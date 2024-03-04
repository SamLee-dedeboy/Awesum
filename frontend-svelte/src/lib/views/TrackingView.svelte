<script lang="ts">
  import type { tOptimization } from "lib/types";
  import { IndentIcon } from "lucide-svelte";
  import { onMount, tick } from "svelte";
  import { OptScatterplot } from "lib/renderers/opt_scatterplot";
  // import { optimization_colors } from "lib/constants";

  export let optimizations: tOptimization[];
  const svgId = "opt-scatterplot-svg";
  const svgSize = { width: 500, height: 500, margin: 0 };
  const opt_scatterplot = new OptScatterplot(svgId, svgSize);
  onMount(() => {
    opt_scatterplot.init();
  });
  $: update(optimizations);
  async function update(optimizations: tOptimization[]) {
    await tick();
    opt_scatterplot.update(optimizations);
    if (optimizations.length >= 2) {
      opt_scatterplot.update_movement(
        optimizations
        // optimizations.length - 2,
        // optimizations.length - 1
      );
    }
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
          class="optimization-container flex text-sm items-center p-1 bg-yellow-100 gap-x-1 relative"
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
                    {optimization.prompt.examples.length === 0
                      ? "None"
                      : optimization.prompt.examples.map((e) => e.id)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="w-[5rem] h-[5rem] outline outline-1"></div>
        </div>
        {#if index !== optimizations.length - 1}
          <div class="w-[2rem] h-[2rem]">
            <img class="w-full h-full" src="arrow_down.svg" alt="*" />
          </div>
        {/if}
      {/each}
    </div>
  </div>
  <div class="h-full aspect-square outline outline-1 outline-gray-200">
    <svg
      id={svgId}
      class="w-full h-full"
      viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
    ></svg>
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
