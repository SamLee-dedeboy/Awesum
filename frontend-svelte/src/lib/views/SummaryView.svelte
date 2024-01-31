<script lang="ts">
  import SummaryCard from "lib/components/SummaryCard.svelte";
  export let title: string;
  export let data: String[] = [];
</script>

<div class="flex flex-col h-full overflow-y-auto outline outline-1">
  <div
    class="flex justify-start font-bold border-b px-1 border-gray-100 sticky"
  >
    {title}
  </div>
  {#if data}
    <div
      class="flex flex-col overflow-y-auto divide-solid divide-y divide-black"
    >
      {#each data as datum}
        <SummaryCard summary={datum}></SummaryCard>
      {/each}
    </div>
  {/if}
</div>
