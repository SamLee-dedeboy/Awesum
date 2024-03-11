<script lang="ts">
  import SummaryCard from "lib/components/SummaryCard.svelte";
  import type { tNode } from "lib/types";
  import { createEventDispatcher } from "svelte";
  import { recommended_nodes, example_nodes } from "lib/store";
  import { cluster_colors } from "lib/constants";

  $: example_nodes_ids = $example_nodes.map((node) => node.id);
  $: nodes = merge_nodes($recommended_nodes || [], $example_nodes);
  function merge_nodes(recommended_nodes: tNode[], example_nodes: tNode[]) {
    const example_node_ids = example_nodes.map((node) => node.id);
    return example_nodes.concat(
      recommended_nodes.filter((node) => !example_node_ids.includes(node.id))
    );
  }
</script>

<div class="flex flex-col">
  <!-- <div
    class="flex justify-start font-bold border-b px-1 border-gray-100 sticky"
  >
    {title}
  </div> -->
  {#if nodes}
    <div class="flex flex-col divide-black gap-y-4 px-[0.75rem] py-1">
      {#each nodes as datum}
        <SummaryCard
          statistics={datum.features}
          color={cluster_colors(datum.cluster)}
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
