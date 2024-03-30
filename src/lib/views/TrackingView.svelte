<script lang="ts">
  import type { tPrompt, tNode, tOptimization, tStatistics } from "lib/types";
  import * as d3 from "d3";
  import { onMount, tick } from "svelte";
  import { OptScatterplot } from "lib/renderers/opt_scatterplot";
  import { OptimizationStats } from "lib/renderers/optimization_stats";
  import Test from "lib/components/Test.svelte";
  import TrackingLegend from "lib/components/TrackingLegend.svelte";

  import {
    recommended_nodes,
    target_ranges,
    executing_prompt,
    executing_test,
    whole_test_set,
    cluster_size,
  } from "lib/store";
  import {
    metrics,
    optimization_colors,
    cluster_colors,
    server_address,
  } from "lib/constants";

  export let optimizations: tOptimization[];
  export let statistics: tStatistics;
  let src_index = -1;
  let dst_index = 0;
  let tmp_src_index = -1;
  let tmp_dst_index = -1;
  let select_mode = false;
  const tracking_svgId = "tracking-scatterplot-svg";
  const optimization_stat_svgId_factory = (index) =>
    `optimization-stats-svg-${index}`;
  const svgSize = { width: 500, height: 500, margin: 0 };
  const stat_svgSize = { width: 750, height: 500, margin: 0 };
  const opt_scatterplot = new OptScatterplot(
    tracking_svgId,
    svgSize,
    handleNodeClicked,
    handleNodeUnClicked
  );
  let optimization_stat_instances: OptimizationStats[] = [];
  onMount(() => {
    opt_scatterplot.init();
  });
  $: if (optimizations.length > 1) {
    src_index = optimizations.length - 2;
    dst_index = optimizations.length - 1;
    update(optimizations);
  } else {
    update(optimizations);
  }
  $: if ($recommended_nodes) {
    update_recommendations(optimizations, $recommended_nodes);
    update(optimizations);
  }
  async function update(optimizations: tOptimization[]) {
    await tick();
    if (optimizations.length === 1) {
      opt_scatterplot.update(
        undefined,
        optimizations[dst_index],
        $cluster_size
      );
    } else {
      opt_scatterplot.update(
        optimizations[src_index],
        optimizations[dst_index],
        $cluster_size
      );
      const trajectories = await get_trajectories(
        optimizations[src_index],
        optimizations[dst_index]
      );
      console.log({ trajectories });
      opt_scatterplot.update_movement(
        optimizations[src_index],
        optimizations[dst_index],
        trajectories,
        $cluster_size
      );
    }

    const global_mins = statistics.global_mins;
    const global_maxes = statistics.global_maxes;
    const global_means = statistics.global_means;

    optimization_stat_instances = [];
    optimizations.forEach((optimization, index) => {
      const svgId = optimization_stat_svgId_factory(index);
      const optimization_stat = new OptimizationStats(
        svgId,
        stat_svgSize,
        metrics,
        global_mins,
        global_means,
        global_maxes
      );
      optimization_stat.update(optimization, $cluster_size);
      optimization_stat_instances.push(optimization_stat);
      if ($recommended_nodes) {
        optimization_stat.update_recommendations($target_ranges);
      }
    });
  }

  async function update_recommendations(optimizations, recommended_nodes) {
    await tick();
    if (optimizations.length === 1) {
      opt_scatterplot.update(
        undefined,
        optimizations[dst_index],
        $cluster_size
      );
    } else {
      opt_scatterplot.update(
        optimizations[src_index],
        optimizations[dst_index],
        $cluster_size
      );
    }
    opt_scatterplot.update_recommendations(recommended_nodes);
    optimization_stat_instances.forEach((instance) => {
      instance.update_recommendations($target_ranges);
    });
  }

  async function get_trajectories(
    src_opt: tOptimization,
    dst_opt: tOptimization
  ) {
    const response = await fetch(server_address + "/compute_trajectory/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        src_nodes: src_opt.nodes,
        dst_nodes: dst_opt.nodes,
      }),
    });
    const data = await response.json();
    return data.trajectories;
  }

  async function handleExecuteTest(prompt: tPrompt) {
    executing_test.set(true);
    console.log(prompt);
    opt_scatterplot.hide_bubbles_trajectories();
    opt_scatterplot.show_test_set($whole_test_set);
    const response = await fetch(server_address + "/executePromptAll/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instruction:
          prompt.persona + ". " + prompt.context + ". " + prompt.constraints,
        examples: prompt.examples,
        data_template: prompt.data_template,
        data: $whole_test_set,
      }),
    });
    const data = await response.json();
    executing_test.set(false);
    // console.log({ data });
    opt_scatterplot.update_test_results(data.results);
  }

  function handleNodeClicked(d: tNode, node_type: string) {
    optimization_stat_instances[src_index].highlightNode(d);
    optimization_stat_instances[dst_index].highlightNode(d);
  }

  function handleNodeUnClicked(d: tNode, node_type: string) {
    optimization_stat_instances[src_index].dehighlightAll();
    optimization_stat_instances[dst_index].dehighlightAll();
  }

  function get_opt_color(
    opt_index: number,
    total_length: number,
    src_index: number,
    dst_index: number
  ) {
    if (total_length === 1) {
      return d3.color(optimization_colors[1]).brighter(0.2);
    } else {
      if (opt_index === src_index) {
        return optimization_colors[0];
      } else if (opt_index === dst_index) {
        return optimization_colors[1];
      } else {
        return "white";
      }
    }
  }
</script>

<div class="flex h-full">
  <div class="flex flex-col">
    <div class="view-header relative">
      <img src="line_chart.svg" alt="*" class="aspect-square" />
      Prompt Comparator
      <div class="absolute right-1 top-[0.15rem] bottom-[0.15rem]">
        <Test
          {optimizations}
          on:execute_test={(e) => handleExecuteTest(e.detail)}
        ></Test>
      </div>
    </div>
    <div
      role="button"
      tabindex="0"
      class="w-fit px-1 my-1 ml-1 font-mono text-[0.8rem] outline outline-1 outline-gray-400 rounded select-none hover:outline-2"
      style={`background-color: ${select_mode ? "#89d0ff" : "white"}`}
      on:click={() => {
        select_mode = !select_mode;
        tmp_src_index = -1;
        tmp_dst_index = -1;
      }}
      on:keyup={() => {}}
    >
      Select Comparison
    </div>
    <div
      class="flex flex-col grow items-center overflow-y-auto px-1 py-0.5 border-r border-gray-200"
    >
      {#each optimizations as optimization, index}
        <div
          role="button"
          tabindex="0"
          class="optimization-container flex text-sm items-center p-1 gap-x-1 relative"
          class:to-be-selected={select_mode}
          class:selected={select_mode &&
            (tmp_src_index === index || tmp_dst_index === index)}
          style={`
          background-color: ${get_opt_color(index, optimizations.length, src_index, dst_index)};
          opacity: ${src_index === index || dst_index === index ? 1 : 0.5};
          `}
          on:keyup={() => {}}
          on:click={() => {
            if (select_mode) {
              if (tmp_src_index === index) {
                tmp_src_index = -1;
              } else if (tmp_dst_index === index) {
                tmp_dst_index = -1;
              } else if (tmp_src_index === -1) {
                tmp_src_index = index;
              } else if (tmp_dst_index === -1) {
                tmp_dst_index = index;
                src_index = tmp_src_index;
                dst_index = tmp_dst_index;
                tmp_src_index = -1;
                tmp_dst_index = -1;
                select_mode = false;
                update(optimizations);
                update_recommendations(optimizations, $recommended_nodes);
              } else {
                tmp_src_index = index;
                tmp_dst_index = -1;
              }
            }
          }}
        >
          <div class="flex flex-col flex-1">
            <div class="optimization-title flex underline text-semibold">
              Prompt #{index}
            </div>
            <div class="prompt text-start">
              <span class="">{optimization.prompt.persona}</span>
              <span>{optimization.prompt.context}</span>
              <span>{optimization.prompt.constraints}</span>
              <p>{optimization.prompt.data_template}</p>
              <div>
                <div class="flex">
                  <span> Examples: </span>
                  <div class="flex items-center">
                    {#if optimization.prompt.examples.length === 0}
                      None
                    {:else}
                      {#each optimization.prompt.examples as example}
                        <div class="w-fit">
                          <svg class="w-[1rem] h-[1rem]" viewBox="0 0 10 10">
                            <circle
                              fill={cluster_colors(example.cluster)}
                              stroke="black"
                              stroke-width="0.5"
                              r="4"
                              cx="5"
                              cy="5"
                            ></circle>
                          </svg>
                        </div>
                      {/each}
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            class="w-[12rem] h-[8rem] outline outline-1 outline-gray-300 p-1 bg-white"
          >
            <svg
              id={optimization_stat_svgId_factory(index)}
              class="opt-stats w-full h-full overflow-visible"
              viewBox={`0 0 ${stat_svgSize.width} ${stat_svgSize.height}`}
            ></svg>
          </div>
        </div>
        {#if index !== optimizations.length - 1}
          <div
            role="button"
            tabindex={index}
            class="w-[2rem] h-[2rem] hover:bg-gray-200"
            on:click={() => {
              src_index = index;
              dst_index = index + 1;
              update(optimizations);
            }}
            on:keyup={() => {}}
          >
            <img
              class="w-full h-full"
              src="arrow_down.svg"
              alt="*"
              style={`opacity: ${src_index === index ? 1 : 0.3}`}
            />
          </div>
        {/if}
      {/each}
      {#if $executing_prompt}
        <div class="w-[2rem] h-[2rem] mt-2 animate-bounce">
          <img class="w-full h-full" src="arrow_down.svg" alt="*" />
        </div>
        <div class="w-full h-[10rem] pulse bg-gray-100"></div>
      {/if}
    </div>
  </div>
  <div
    class="h-full aspect-square border-t-4 border-[#89d0ff] bg-white p-1 relative"
  >
    <div class="absolute top-1 right-0">
      <TrackingLegend></TrackingLegend>
    </div>
    <svg
      id={tracking_svgId}
      class="tracking-scatterplot w-full h-full overflow-visible"
      viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
    >
      <defs>
        <path id="arrowhead" d="M7,0 L-7,-5 L-7,5 Z" />
        <!-- <path id="arrowhead" d="M-7,-5 L7,0 L-7,5" /> -->
      </defs>
    </svg>
  </div>
</div>

<style lang="postcss">
  .selected {
    @apply !bg-none !outline;
  }
  .to-be-selected {
    @apply cursor-pointer outline-2 outline-black hover:bg-none hover:outline;
    background-image: linear-gradient(90deg, black 50%, transparent 50%),
      linear-gradient(90deg, black 50%, transparent 50%),
      linear-gradient(0deg, black 50%, transparent 50%),
      linear-gradient(0deg, black 50%, transparent 50%);
    background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
    background-size:
      15px 2px,
      15px 2px,
      2px 15px,
      2px 15px;
    background-position:
      left top,
      right bottom,
      left bottom,
      right top;
    animation: border-dance 1s infinite linear;
  }
  @keyframes border-dance {
    0% {
      background-position:
        left top,
        right bottom,
        left bottom,
        right top;
    }
    100% {
      background-position:
        left 15px top,
        right 15px bottom,
        left bottom 15px,
        right top 15px;
    }
  }
  /* .comparison-tag {
    @apply flex w-fit px-1  outline outline-1 outline-gray-300 rounded bg-amber-200 text-[0.7rem] font-mono;
  } */
  .tracking-scatterplot {
    & .node:hover {
      stroke: black;
      stroke-width: 2.5;
    }
  }

  .opt-stats {
    & .highlight {
      fill: red;
    }
    & .dismissed {
      fill: white;
      opacity: 0.5;
    }
  }
  :global(.movement) {
    animation: moving 4s linear infinite;
  }

  @keyframes moving {
    from {
      stroke-dashoffset: 100;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  .pulse {
    animation: pulse 1.8s infinite;
  }

  @keyframes pulse {
    0% {
      background-color: #fafafa;
    }
    50% {
      background-color: #e0e0e0;
    }
    100% {
      background-color: #fafafa;
    }
  }
</style>
