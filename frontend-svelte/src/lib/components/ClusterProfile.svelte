<script lang="ts">
  import { createTooltip, melt } from "@melt-ui/svelte";
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  const dispatch = createEventDispatcher();
  export let index: number;
  export let cluster_label: string;
  export let svgSize: { width: number; height: number; margin: number };
  export let hovered_cluster_label: string | undefined;
  const {
    elements: { trigger, content, arrow },
    states: { open },
  } = createTooltip({
    positioning: {
      placement: "right",
      gutter: 0,
    },
    openDelay: 0,
    closeDelay: 0,
    closeOnPointerDown: false,
    forceVisible: true,
  });
</script>

<div
  role="button"
  tabindex={index}
  class="cluster-stat-container w-[120px] h-[78px] border border-1 border-gray-100 relative hoverable gap-x-0.5 gap-y-0.5"
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
    class="z-10 rounded-lg bg-white shadow pointer-events-none"
  >
    <div use:melt={$arrow} />
    <p class="px-4 py-1 text-magnum-700">{hovered_cluster_label}</p>
  </div>
{/if}

<style lang="postcss">
  .hoverable {
    @apply cursor-pointer hover:border hover:border-black;
  }
</style>
