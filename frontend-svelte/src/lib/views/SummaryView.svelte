<script lang="ts">
  import SummaryCard from "lib/components/SummaryCard.svelte";
  import type { tNode } from "lib/types";
  import { createEventDispatcher } from "svelte";
  import { recommended_nodes, example_nodes } from "lib/store";
  const dispatch = createEventDispatcher();

  $: example_nodes_ids = $example_nodes.map((node) => node.id);
</script>

<div class="flex flex-col">
  <!-- <div
    class="flex justify-start font-bold border-b px-1 border-gray-100 sticky"
  >
    {title}
  </div> -->
  {#if $recommended_nodes}
    <div class="flex flex-col divide-black gap-y-4 px-1 py-0.5">
      {#each $recommended_nodes as datum}
        <SummaryCard
          statistics={datum.features}
          summary={datum.summary}
          in_example={example_nodes_ids.includes(datum.id)}
          on:add_example={() => example_nodes.set([datum, ...$example_nodes])}
          on:remove_example={() =>
            example_nodes.set(
              $example_nodes.filter((node) => node.id !== datum.id)
            )}
        ></SummaryCard>
      {/each}
    </div>
  {/if}
</div>
