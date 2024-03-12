<script lang="ts">
  import type { tNode, tOptimization, tStatistics } from "lib/types";
  import * as d3 from "d3";
  import { onMount, tick } from "svelte";
  import { OptScatterplot } from "lib/renderers/opt_scatterplot";
  import { OptimizationStats } from "lib/renderers/optimization_stats";
  import {
    recommended_nodes,
    target_ranges,
    executing_prompt,
  } from "lib/store";
  import {
    metrics,
    optimization_colors,
    cluster_colors,
    optimization_opacities,
  } from "lib/constants";

  export let optimizations: tOptimization[];
  export let statistics: tStatistics;
  let src_index = -1;
  let dst_index = 0;
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
    // opt_scatterplot.rotate_gradient();
    // rotate_gradient();
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
      opt_scatterplot.update(undefined, optimizations[dst_index]);
    } else {
      opt_scatterplot.update(
        optimizations[src_index],
        optimizations[dst_index]
      );
      opt_scatterplot.update_movement(
        optimizations[src_index],
        optimizations[dst_index],
        statistics
      );
    }

    const global_mins = statistics.global_mins;
    const global_maxes = statistics.global_maxes;
    const global_means = statistics.global_means;

    optimizations.forEach((optimization, index) => {
      optimization_stat_instances = [];
      const svgId = optimization_stat_svgId_factory(index);
      const optimization_stat = new OptimizationStats(
        svgId,
        stat_svgSize,
        metrics,
        global_mins,
        global_means,
        global_maxes
      );
      optimization_stat.update(optimization);
      optimization_stat_instances.push(optimization_stat);
      if ($recommended_nodes) {
        optimization_stat.update_recommendations($target_ranges);
      }
    });
  }

  async function update_recommendations(optimizations, recommended_nodes) {
    await tick();
    if (optimizations.length === 1) {
      opt_scatterplot.update(undefined, optimizations[dst_index]);
    } else {
      opt_scatterplot.update(
        optimizations[src_index],
        optimizations[dst_index]
      );
    }
    opt_scatterplot.update_recommendations(recommended_nodes);
    optimization_stat_instances.forEach((instance) => {
      instance.update_recommendations($target_ranges);
    });
  }

  function handleNodeClicked(d: tNode, node_type: string) {
    console.log("click", d, node_type);
    if (node_type === "dst") {
      const opt_stat_instance = optimization_stat_instances[dst_index];
      opt_stat_instance.highlightNode(d);
    } else {
    }
  }

  function handleNodeUnClicked(d: tNode, node_type: string) {
    console.log("unclick", d, node_type);
    if (node_type === "dst") {
      const opt_stat_instance = optimization_stat_instances[dst_index];
      opt_stat_instance.dehighlightAll(d);
    } else {
    }
  }

  function rotate_gradient() {
    let l: any = document.getElementById("l");
    let x1 = parseFloat(l.getAttribute("x1"));
    let y1 = parseFloat(l.getAttribute("y1"));
    let x2 = parseFloat(l.getAttribute("x2"));
    let y2 = parseFloat(l.getAttribute("y2"));
    let w = parseFloat(l.getAttribute("stroke-width"));
    console.log({ x1, y1, x2, y2, w });

    // step 1
    let dx = x2 - x1;
    let dy = y2 - y1;

    // step 2
    const len = Math.sqrt(dx * dx + dy * dy);
    dx = dx / len;
    dy = dy / len;

    // step 3
    let temp = dx;
    dx = -dy;
    dy = temp;

    //step 4
    dx = w * dx;
    dy = w * dy;

    //step 5
    let gradient_x1 = x1 + dx * 0.5;
    let gradient_y1 = y1 + dy * 0.5;
    let gradient_x2 = x1 - dx * 0.5;
    let gradient_y2 = y1 - dy * 0.5;

    let e: any = document.getElementById("e");
    e.setAttribute("x1", gradient_x1);
    e.setAttribute("y1", gradient_y1);
    e.setAttribute("x2", gradient_x2);
    e.setAttribute("y2", gradient_y2);
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
    <div class="view-header">
      <img src="line_chart.svg" alt="*" class="aspect-square" />
      Prompt Comparator
    </div>
    <div
      class="flex flex-col grow items-center overflow-y-auto px-1 border-r border-gray-200"
    >
      {#each optimizations as optimization, index}
        <div
          class="optimization-container flex text-sm items-center p-1 gap-x-1 relative"
          style={`background-color: ${get_opt_color(index, optimizations.length, src_index, dst_index)}; opacity: ${src_index === index || dst_index === index ? 1 : 0.5}`}
        >
          <div class="flex flex-col flex-1">
            <div class="optimization-title w-fit underline text-semibold">
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
                  <!-- To be replaced with svg -->
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
  <div class="h-full aspect-square border-t-4 border-[#89d0ff] bg-white p-1">
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
