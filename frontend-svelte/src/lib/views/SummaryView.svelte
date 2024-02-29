<script lang="ts">
  import SummaryCard from "lib/components/SummaryCard.svelte";
  import type { tNode } from "lib/types";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let data: tNode[] = [];
</script>

<div class="flex flex-col">
  <!-- <div
    class="flex justify-start font-bold border-b px-1 border-gray-100 sticky"
  >
    {title}
  </div> -->
  {#if data}
    <div class="flex flex-col divide-black gap-y-4 px-1 py-0.5">
      {#each data as datum}
        <SummaryCard
          statistics={datum.features}
          summary={datum.summary}
          on:click={() => dispatch("add_example", datum)}
        ></SummaryCard>
      {/each}
    </div>
  {/if}
</div>
