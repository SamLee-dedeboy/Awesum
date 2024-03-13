<script lang="ts">
  import { afterUpdate, createEventDispatcher, onMount } from "svelte";
  import { categorize_metric } from "lib/constants/Metrics";
  import { cluster_colors, metrics } from "lib/constants";
  import * as helpers from "lib/helpers";
  import { createAccordion, melt } from "@melt-ui/svelte";
  import { slide } from "svelte/transition";
  import * as d3 from "d3";
  import { default_ranges } from "lib/store";

  const dispatch = createEventDispatcher();
  export let id: string;
  export let summary: String = "";
  export let color: string;
  export let statistics: { [key: string]: number };
  export let in_example: boolean = false;

  $: short_summary = summary.length > 100 ? summary.slice(0, 100) : summary;
  // let rest_summary = summary.length > 100 ? summary.slice(100) : "";
  let show_short_summary = true;
  function toggleExample() {
    if (in_example) {
      dispatch("remove_example", { summary });
    } else {
      dispatch("add_example", { summary });
    }
  }

  onMount(() => {
    update_metric_tags();
  });

  afterUpdate(() => {
    update_metric_tags();
  });
  function update_metric_tags() {
    const width = document.querySelector(".metric-tag")?.clientWidth || 100;
    const height = document.querySelector(".metric-tag")?.clientHeight || 16;
    const container = d3.select(`#card-${id}`);
    container
      .selectAll(".metric-svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .each(function () {
        const svg = d3.select(this);
        const metric = svg.attr("id");
        const xScale = d3
          .scaleLinear()
          .domain($default_ranges[metric])
          .range([0, width]);
        svg.selectAll("*").remove();
        svg
          .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", xScale(statistics[metric]))
          .attr("height", height)
          .attr("fill", "lightgreen")
          .attr("opacity", "0.3");
      });
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

<!-- class={`card outline outline-2 relative rounded-sm ${in_example ? "bg-[#ddf7e5]" : "bg-stone-50"}`} -->
<div
  class={`card outline outline-2 relative rounded-sm ${in_example ? "bg-stone-50" : "bg-stone-50"}`}
  style={`outline-color: ${d3.color(color).darker(0.15)}; box-shadow: 0px 2px 1.5px 1px ${color};`}
>
  <!-- <div
    class="absolute w-[0.8rem] h-[0.8rem] top-[-0.5rem] left-[-0.5rem] rounded-full outline outline-1 outline-black"
    style="{`background-color: ${color}`};"
  ></div> -->
  <div class="flex text-xs whitespace-nowrap">
    <div
      role="button"
      tabindex="0"
      class="add_button w-4 hover:bg-green-200 cursor-pointer"
      on:click={toggleExample}
      on:keyup={() => {}}
    >
      <img
        src={in_example ? "star_filled.svg" : "star_empty.svg"}
        alt="*"
        class="w-4 h-4"
      />
    </div>
    <div
      id={`card-${id}`}
      class="flex ml-2 grow justify-between divide-x divide-stone-400 border-b border-stone-400"
    >
      {#each Object.keys(statistics) as metric}
        <span class="metric-tag w-full h-full text-center relative"
          >{categorize_metric(metric, statistics[metric])}
          <svg
            id={metric}
            class="metric-svg absolute left-0 top-0 right-0 bottom-0"
          >
          </svg>
        </span>
      {/each}
    </div>
  </div>

  <div class="flex items-center mt-2 gap-x-2 ml-auto right-0"></div>
  <div class="text-left text-xs mt-1">
    <div
      role="button"
      tabindex="0"
      class="p-0.5 rounded outline-1 outline-gray-200 hover:bg-slate-100 hover:outline"
      transition:slide
      on:click={() => (show_short_summary = !show_short_summary)}
      on:keyup={() => {}}
    >
      {#if show_short_summary}
        {short_summary} ...
      {:else}
        <div transition:slide>
          {summary}
        </div>
      {/if}
      <!-- <span>{short_summary}</span>
      {#if show_short_summary}
        <span> ... </span>
      {:else}
        <span transition:slide>{rest_summary}</span>
      {/if} -->
    </div>
  </div>
</div>

<!-- <div
  class="card bg-stone-50 shadow-lg outline outline-2 relative rounded-sm"
  style={`outline-color: ${color}`}
>
  <div
    class="absolute w-[0.8rem] h-[0.8rem] top-[-0.4rem] left-[-0.4rem] rounded-full outline outline-1 outline-black"
    style="{`background-color: ${color}`};"
  ></div>
  <div
    class="flex justify-between divide-x divide-stone-400 text-xs whitespace-nowrap outline outline-1 outline-stone-400"
  >
    {#each Object.keys(statistics) as metric}
      <span class="px-1 w-full text-center"
        >{categorize_metric(metric, statistics[metric])}</span
      >
    {/each}
  </div>
  <div class=" text-xs text-gray-500 flex items-center">
    <div use:melt={$item(id)}>
      <h2 class="flex">
        <div
          use:melt={$trigger(id)}
          class="
          
            flex flex-1 cursor-pointer items-center justify-between
            bg-white p-0.5 text-xs font-light leading-none
            text-black transition-colors hover:bg-neutral-200 focus:!ring-0
            focus-visible:text-magnum-800
            border border-neutral-300
             "
        >
          Summary
        </div>
      </h2>
    </div>
    <div class="flex items-center mt-2 gap-x-2 ml-auto right-0">
      <div
        role="button"
        tabindex="0"
        class="add_button whitespace-nowrap text-xs !rounded hover:bg-green-200 cursor-pointer"
        on:click={toggleExample}
        on:keyup={() => {}}
      >
        <img
          src={in_example ? "star_filled.svg" : "star_empty.svg"}
          alt="*"
          class="w-4 h-4"
        />
      </div>
    </div>
  </div>
  {#if $isSelected(id)}
    <div class="text-left text-xs" use:melt={$content(id)} transition:slide>
      {summary}
    </div>
  {/if}
</div> -->

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
