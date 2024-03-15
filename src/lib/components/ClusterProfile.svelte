<script lang="ts">
  import { createTooltip, melt } from "@melt-ui/svelte";
  import { createEventDispatcher } from "svelte";
  import { selected_metrics } from "lib/store";
  import { categorize_metric } from "lib/constants";
  import { fade } from "svelte/transition";
  import type { tStatBarData } from "lib/types";
  const dispatch = createEventDispatcher();
  export let index: number;
  export let cluster_label: string;
  export let svgSize: { width: number; height: number; margin: number };
  export let hovered_cluster_label: string | undefined;
  export let stat_data: tStatBarData[];
  const {
    elements: { trigger, content, arrow },
    states: { open },
  } = createTooltip({
    positioning: {
      placement: "right-start",
      gutter: 1.5,
    },
    openDelay: 0,
    closeDelay: 0,
    closeOnPointerDown: false,
    forceVisible: true,
    disableHoverableContent: true,
  });
</script>

<div
  role="button"
  tabindex={index}
  class="cluster-stat-container w-[9rem] h-[7rem] border border-1 border-gray-100 relative hoverable gap-x-0.5 gap-y-0.5"
  use:melt={$trigger}
  on:keyup={() => {}}
  on:click={() => dispatch("click", cluster_label)}
  on:m-pointerenter={() => dispatch("mouseover", cluster_label)}
  on:m-focus={() => dispatch("mouseover", cluster_label)}
  on:m-pointerleave={() => {
    dispatch("mouseout", cluster_label);
  }}
  on:m-blur={() => {
    dispatch("mouseout", cluster_label);
  }}
>
  <p class="text-sm absolute ml-0.5 top-[-0.1rem] pointer-events-none">
    {cluster_label}
  </p>
  <svg
    id={`stat-cluster-${index}`}
    class="w-full h-full pointer-events-none"
    viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
  >
    <g
      class="inner"
      transform={`translate(${svgSize.margin}, ${svgSize.margin})`}
    ></g>
  </svg>
</div>
{#if $open}
  <div
    use:melt={$content}
    transition:fade={{ duration: 100 }}
    class="z-40 p-1 rounded-lg bg-amber-50 outline outline-1 outline-gray-400 shadow pointer-events-none text-[0.6rem] font-mono"
  >
    <p class="w-full text-center border-b border-gray-300 text-[0.7rem]">
      Cluster Label:{hovered_cluster_label}
    </p>
    {#each $selected_metrics as metric, index}
      <div class="flex">
        <span class="w-[5rem]">{metric}:</span>
        <span>
          {stat_data[index].min.toFixed(2)} ({categorize_metric(
            metric,
            stat_data[index].min
          )}) - {stat_data[index].max.toFixed(2)} ({categorize_metric(
            metric,
            stat_data[index].max
          )})
        </span>
      </div>
    {/each}
  </div>
{/if}

<style lang="postcss">
  .hoverable {
    @apply cursor-pointer hover:border hover:border-black;
  }
</style>
