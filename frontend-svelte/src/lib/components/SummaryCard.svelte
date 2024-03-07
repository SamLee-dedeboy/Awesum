<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { categorize_metric } from "lib/constants/Metrics";
  import { cluster_colors } from "lib/constants";
  import * as helpers from "lib/helpers";
  const dispatch = createEventDispatcher();
  export let summary: String = "";
  export let color: string;
  export let statistics: { [key: string]: number };
  export let in_example: boolean = false;

  function toggleExample() {
    if (in_example) {
      dispatch("remove_example", { summary });
    } else {
      dispatch("add_example", { summary });
    }
  }

  /**
   *
   * @param color hex format
   */
  function contrast_color(color: string) {
    const { r, g, b } = helpers.HEX_to_RGB(color);
    const { h, s, l } = helpers.RGB_to_HSL(r, g, b);
    const contrast_l = helpers.contrast_luminance(l);
    const contrast_h = l < 50 ? 0 : 100;
    const contrast_s = l < 50 ? 0 : 100;
    const contrast_color = helpers.HSL_to_RGB(
      contrast_h,
      contrast_s,
      contrast_l
    );
    return helpers.rgb_to_string(
      contrast_color.r,
      contrast_color.g,
      contrast_color.b
    );
    // const r = parseInt(color.slice(1, 3), 16);
    // const g = parseInt(color.slice(3, 5), 16);
    // const b = parseInt(color.slice(5, 7), 16);
    // const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    // return yiq >= 128 ? "black" : "white";
  }
</script>

<!-- "rgb(187 247 208)" -->
<div
  class="card bg-stone-50 shadow-lg outline outline-2"
  style={`outline-color: ${color}`}
>
  <div class="font-light text-xs text-gray-500">Summary:</div>
  <div>{summary}</div>
  <div
    class="flex justify-between divide-x divide-stone-400 text-xs whitespace-nowrap outline outline-1 outline-stone-400"
  >
    {#each Object.keys(statistics) as metric}
      <span class="px-1 w-full text-center"
        >{categorize_metric(metric, statistics[metric])}</span
      >
    {/each}
  </div>
  <div class="flex items-center mt-2 gap-x-2">
    <div
      role="button"
      tabindex="0"
      class="add_button whitespace-nowrap p-1 outline outline-1 outline-gray-400 text-xs !rounded hover:bg-gray-100 cursor-pointer shadow-[0_0_1px_1px_gray]"
      style={`background-color: ${in_example ? "#f0f0f0" : color}; color: ${contrast_color(
        in_example ? "#f0f0f0" : color
      )}`}
      on:click={toggleExample}
      on:keyup={() => {}}
    >
      {in_example ? "Remove example" : "Add example"}
    </div>
  </div>
</div>

<style>
  .card {
    @apply text-start p-1 text-sm;
    /* outline: 1px solid black; */
  }
  .add_button {
    /* color: color-mix(in lab, currentColor 15%, black); */
    color: currentColor;
  }
</style>
