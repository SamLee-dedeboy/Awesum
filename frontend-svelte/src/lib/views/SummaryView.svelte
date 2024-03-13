<script lang="ts">
  import SummaryCard from "lib/components/SummaryCard.svelte";
  import type { tNode } from "lib/types";
  import { recommended_nodes, example_nodes } from "lib/store";
  import { cluster_colors, metrics, metric_abbrs } from "lib/constants";

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
  {#if nodes.length > 0}
    <div
      class="flex justify-between text-[0.7rem] px-8 pr-[0.75rem] sticky top-12 z-20 bg-gray-50 py-1"
    >
      {#each metrics as metric}
        <div class="w-full">
          <span
            class="px-1 py-[0.08rem] text-center rounded-sm outline outline-1 outline-gray-400 bg-[#c7f0a5]"
          >
            {metric_abbrs[metric]}
          </span>
        </div>
      {/each}
    </div>
    <div class="flex flex-col divide-black gap-y-4 px-[0.75rem] py-1">
      {#each nodes as datum}
        <SummaryCard
          id={datum.id}
          statistics={datum.features}
          color={cluster_colors(datum.cluster)}
          summary={datum.summary}
          in_example={example_nodes_ids.includes(datum.id)}
          on:add_example={() => example_nodes.set([...$example_nodes, datum])}
          on:remove_example={() =>
            example_nodes.set(
              $example_nodes.filter((node) => node.id !== datum.id)
            )}
        ></SummaryCard>
      {/each}
    </div>
  {/if}
</div>
