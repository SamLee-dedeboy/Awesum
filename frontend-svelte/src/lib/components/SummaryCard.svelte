<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { categorize_metric } from "lib/constants/Metrics";
  const dispatch = createEventDispatcher();
  export let summary: String = "";
  export let statistics: { [key: string]: number };
</script>

<div class="card bg-stone-50 shadow-lg outline outline-1 outline-gray-300">
  <div class="font-light text-xs text-gray-500">Summary:</div>
  <div>{summary}</div>
  <div class="flex items-center mt-2 gap-x-2">
    <div
      role="button"
      tabindex="0"
      class="w-fit bg-green-200 p-1 outline outline-1 outline-gray-400 text-xs text-gray-500 !rounded hover:bg-gray-100 cursor-pointer shadow-[0_0_1px_1px_gray]"
      on:click={() => dispatch("click")}
      on:keyup={() => {}}
    >
      add to example
    </div>
    <div class="flex justify-center divide-x divide-stone-400">
      {#each Object.keys(statistics) as metric}
        <span class="px-1">{categorize_metric(metric, statistics[metric])}</span
        >
      {/each}
    </div>
  </div>
</div>

<style>
  .card {
    @apply text-start p-1 text-sm;
    /* outline: 1px solid black; */
  }
</style>
