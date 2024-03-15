<script lang="ts">
  import { createTooltip, melt } from "@melt-ui/svelte";
  import { optimization_colors } from "lib/constants";
  const {
    elements: { trigger, content },
    states: { open },
  } = createTooltip({
    positioning: {
      placement: "right-start",
      gutter: 3,
    },
    openDelay: 0,
    closeDelay: 0,
    closeOnPointerDown: false,
    forceVisible: true,
    // disableHoverableContent: true,
  });
</script>

<div
  use:melt={$trigger}
  class="px-1 py-0.5 rounded-sm outline outline-1 outline-gray-300 bg-amber-50 font-mono text-[0.6rem] select-none"
>
  Legend
</div>
{#if $open}
  <div
    use:melt={$content}
    class="flex flex-col gap-y-1 w-max p-1 rounded-sm outline outline-1 outline-gray-300 bg-white"
  >
    <div class="legend-item group-title">circles:</div>
    <div class="legend-item flex items-center gap-x-1">
      <svg class="w-[1rem] h-[1rem]" viewBox="0 0 10 10">
        <circle
          fill="white"
          stroke="black"
          stroke-width="0.5"
          r="3"
          cx="5"
          cy="5"
        >
        </circle>
      </svg>
      <span> validation article</span>
    </div>
    <div class="legend-item flex items-center gap-x-1">
      <svg class="w-[1rem] h-[1rem]" viewBox="0 0 10 10">
        <circle
          fill="white"
          stroke="black"
          stroke-width="0.5"
          r="4"
          cx="5"
          cy="5"
        >
        </circle>
        <circle
          fill="white"
          stroke="black"
          stroke-width="0.5"
          r="3"
          cx="5"
          cy="6"
        >
        </circle>
        <circle
          fill="white"
          stroke="black"
          stroke-width="0.5"
          r="2"
          cx="5"
          cy="7"
        >
        </circle>
      </svg>
      <span> representativeness </span>
    </div>
    <div class="legend-item group-title mt-2">contours:</div>
    <div class="legend-item flex items-center gap-x-1">
      <svg class="w-[1rem] h-[0.6rem]" viewBox="0 0 100 60">
        <rect
          fill={optimization_colors[0]}
          x="5"
          y="5"
          width="95"
          height="50"
          rx="20%"
          stroke="gray"
        >
        </rect>
      </svg>
      <span> before </span>
    </div>
    <div class="legend-item flex items-center gap-x-1">
      <svg class="w-[1rem] h-[0.6rem]" viewBox="0 0 100 60">
        <rect
          fill={optimization_colors[1]}
          x="5"
          y="5"
          width="95"
          height="50"
          rx="20%"
          stroke="gray"
        >
        </rect>
      </svg>
      <span> after </span>
    </div>
    <div class="legend-item flex items-center gap-x-1">
      <svg class="w-[1rem] h-[0.6rem]" viewBox="0 0 100 60">
        <rect fill="lightgreen" x="5" y="5" width="95" height="50" rx="20%">
        </rect>
      </svg>
      <span> goal </span>
    </div>
    <div class="legend-item group-title mt-2">trajectories:</div>
    <div class="legend-item flex items-center gap-x-1">
      <svg class="w-[1rem] h-[0.6rem]" viewBox="0 0 10 6">
        <rect
          fill="#FFEA93"
          x="0"
          y="0"
          width="10"
          height="6"
          stroke="gray"
          stroke-width="0.5"
        >
        </rect>
      </svg>
      <span> better </span>
    </div>
    <div class="legend-item flex items-center gap-x-1">
      <svg class="w-[1rem] h-[0.6rem]" viewBox="0 0 10 6">
        <rect fill="#A88CFD" x="0" y="0" width="10" height="6" stroke="gray">
        </rect>
      </svg>
      <span> worse </span>
    </div>
    <div class="legend-item flex items-center gap-x-1">
      <svg class="w-[1rem] h-[0.6rem]" viewBox="0 0 10 6">
        <rect fill="#f0f0f0" x="0" y="0" width="10" height="6" stroke="gray">
        </rect>
      </svg>
      <span> unchanged </span>
    </div>
  </div>
{/if}

<style lang="postcss">
  .legend-item {
    @apply font-mono text-[0.6rem] select-none;
  }
  .group-title {
    @apply border-b border-gray-300 border-dashed text-[0.7rem] capitalize;
  }
</style>
