<script lang="ts">
  import type { tOptimization } from "lib/types";
  import { onMount, tick } from "svelte";
  import { OptScatterplot } from "lib/renderers/opt_scatterplot";
  import { OptimizationStats } from "lib/renderers/optimization_stats";
  import { recommended_nodes, target_ranges } from "lib/store";
  import { metrics } from "lib/constants";
  // import { optimization_colors } from "lib/constants";

  export let optimizations: tOptimization[];
  const tracking_svgId = "tracking-scatterplot-svg";
  const optimization_stat_svgId_factory = (index) =>
    `optimization-stats-svg-${index}`;
  const svgSize = { width: 500, height: 500, margin: 0 };
  const opt_scatterplot = new OptScatterplot(tracking_svgId, svgSize);
  let optimization_stat_instances: OptimizationStats[] = [];
  onMount(() => {
    opt_scatterplot.init();
    // opt_scatterplot.rotate_gradient();
    // rotate_gradient();
  });
  $: update(optimizations);
  $: if ($recommended_nodes) {
    update_recommendations(optimizations, $recommended_nodes);
  }
  async function update(optimizations: tOptimization[]) {
    await tick();
    opt_scatterplot.update(optimizations);
    if (optimizations.length >= 2) {
      opt_scatterplot.update_movement(
        optimizations,
        $recommended_nodes!
        // optimizations.length - 2,
        // optimizations.length - 1
      );
    }
    const global_mins = optimizations[0].statistics.global_mins;
    const global_maxes = optimizations[0].statistics.global_maxes;
    const global_means = optimizations[0].statistics.global_means;

    optimizations.forEach((optimization, index) => {
      optimization_stat_instances = [];
      const svgId = optimization_stat_svgId_factory(index);
      const optimization_stat = new OptimizationStats(
        svgId,
        svgSize,
        metrics,
        global_mins,
        global_means,
        global_maxes
      );
      optimization_stat.update(optimization);
      optimization_stat_instances.push(optimization_stat);
      if ($recommended_nodes) {
        optimization_stat.update_recommendations(
          $recommended_nodes,
          $target_ranges
        );
      }
    });
  }

  async function update_recommendations(optimizations, recommended_nodes) {
    await tick();
    opt_scatterplot.update(optimizations);
    opt_scatterplot.update_recommendations(recommended_nodes);
    optimization_stat_instances.forEach((instance) => {
      instance.update_recommendations(recommended_nodes, $target_ranges);
    });
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
</script>

<div class="flex h-full gap-x-2">
  <div>
    <div class="view-header">
      <img src="line_chart.svg" alt="*" class="aspect-square" />
      Evaluation Tracker
    </div>
    <div class="flex flex-col items-center overflow-y-auto px-1">
      {#each optimizations as optimization, index}
        <div
          class="optimization-container flex text-sm items-center p-1 bg-stone-100 gap-x-1 relative"
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
                  <div>
                    <!-- {optimization.prompt.examples.length === 0
                      ? "None"
                      : optimization.prompt.examples.map((e) => e.id)} -->
                    "None"
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="w-[8rem] h-[8rem] outline outline-1 outline-gray-300 p-1">
            <svg
              id={optimization_stat_svgId_factory(index)}
              class="w-full h-full overflow-visible"
              viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
            ></svg>
          </div>
        </div>
        {#if index !== optimizations.length - 1}
          <div class="w-[2rem] h-[2rem]">
            <img class="w-full h-full" src="arrow_down.svg" alt="*" />
          </div>
        {/if}
      {/each}
    </div>
  </div>
  <div
    class="h-full aspect-square outline outline-1 outline-gray-200 bg-white rounded-lg"
  >
    <svg
      id={tracking_svgId}
      class="w-full h-full"
      viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
    >
      <defs>
        <path id="arrowhead" d="M7,0 L-7,-5 L-7,5 Z" />
        <!-- <path id="arrowhead" d="M-7,-5 L7,0 L-7,5" /> -->
      </defs>
      <!-- <defs>
        <linearGradient
          id="e"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="steelblue" offset="0" />
          <stop stop-color="red" offset="1" />
        </linearGradient>
      </defs>
      <line
        id="l"
        x1="40"
        y1="270"
        x2="450"
        y2="210"
        stroke="url(#e)"
        stroke-width="30"
      /> -->
    </svg>
  </div>
</div>

<style lang="postcss">
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
</style>
