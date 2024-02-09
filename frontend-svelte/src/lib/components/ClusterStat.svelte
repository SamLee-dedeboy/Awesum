<script lang="ts">
  import type { tStatBarData } from "lib/types/statistics";
  import { metrics } from "lib/constants";

  export let cluster_stat: tStatBarData[] | undefined;
  export let global_means: number[];
  // const metric_columns = ["Cluster"].concat(metrics);
</script>

<div class="w-full grid grid-cols-5 auto-rows-auto text-xs">
  <div class="col-span-1">metric</div>
  <div class="col-span-1">min</div>
  <div class="col-span-1">max</div>
  <div class="col-span-1">mean</div>
  <div class="col-span-1">g_mean</div>
  {#if cluster_stat}
    {#each cluster_stat as row, index}
      <div class="row-span-1 col-span-1">{metrics[index]}</div>
      <div class="row-span-1 col-span-1">{row.min.toFixed(2)}</div>
      <div class="row-span-1 col-span-1">{row.max.toFixed(2)}</div>
      <div class="row-span-1 col-span-1">{row.mean.toFixed(2)}</div>
      <div class="row-span-1 col-span-1">
        {global_means[index].toFixed(2)}
      </div>
    {/each}
  {/if}
</div>
