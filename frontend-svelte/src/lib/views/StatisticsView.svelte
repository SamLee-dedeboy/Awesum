<script lang="ts">
  import { afterUpdate, onMount, tick, createEventDispatcher } from "svelte";
  import * as d3 from "d3";
  import ClusterStat from "lib/components/ClusterStat.svelte";
  import { Statbars } from "lib/renderers/statbars";
  import { cluster_colors } from "lib/constants";
  import { selected_metrics } from "lib/store";
  import type {
    tStatBarData,
    tStatistics,
    tClusterOptimization,
    tSelectedClusterData,
  } from "lib/types";
  //
  // constants
  //
  const dispatch = createEventDispatcher();
  enum tMode {
    All_Cluster,
    All_Metric,
    Detail,
  }
  const svgSize = {
    width: 100,
    height: 100,
    margin: 2,
  };
  const innerSize = {
    width: svgSize.width - 2 * svgSize.margin,
    height: svgSize.height - 2 * svgSize.margin,
  };
  //
  // props
  //
  export let stat_data: tStatistics | undefined;
  export let data: any[] | undefined;
  export let selected_cluster: tSelectedClusterData | undefined;
  export let hovered_cluster_label: string | undefined;
  export let optimizations: { [key: string]: tClusterOptimization[] };

  //
  // states
  //
  let hoveredClusterStat: tStatBarData[] | undefined;
  let clickedClusterStat: tStatBarData[] | undefined;
  let statbar_instances: Statbars[] = [];
  let detail_statbars: { [key: string]: Statbars[] };
  let mode: tMode = tMode.All_Cluster;

  //
  // init
  //
  onMount(() => {
    console.log(stat_data);
  });

  //
  // listeners
  //
  $: {
    if (stat_data) {
      if (mode === tMode.All_Cluster) {
        update_all_cluster(stat_data);
        detail_statbars = initDetailStatbars(stat_data.cluster_statistics);
      } else {
        update_all_metric(stat_data);
      }
    }
  }

  $: {
    if (
      selected_cluster &&
      optimizations[selected_cluster.cluster_label].length > 0 &&
      stat_data
    )
      update_detail(
        selected_cluster.cluster_label,
        optimizations[selected_cluster.cluster_label],
        stat_data
      );
  }

  //
  // functions
  //
  async function update_all_cluster(data: tStatistics) {
    console.log("updating statistics", data);
    await tick();
    Object.keys(data.cluster_statistics).forEach((cluster_label, index) => {
      const statbars = new Statbars(
        `#stat-cluster-${index}`,
        svgSize,
        innerSize,
        cluster_colors(cluster_label)
      );
      statbars.update(
        data.cluster_statistics[cluster_label],
        data.global_means,
        data.global_mins,
        data.global_maxes
      );
      statbar_instances.push(statbars);
    });
  }

  async function update_all_metric(data: tStatistics) {
    await tick();
    $selected_metrics.forEach((metric, index) => {
      const statbars = new Statbars(
        `#stat-metric-${index}`,
        svgSize,
        innerSize,
        undefined,
        handleMetricRangeSelected
      );

      statbars.update(
        Object.keys(data.metric_statistics[metric]).map(
          (cluster_label) => data.metric_statistics[metric][cluster_label]
        ),
        [data.global_means[index]],
        [data.global_mins[index]],
        [data.global_maxes[index]],
        true,
        Object.keys(data.metric_statistics[metric]).map((cluster_label) =>
          cluster_colors(cluster_label)
        )
      );
      statbar_instances.push(statbars);
    });
  }

  async function update_detail(
    cluster_label: string,
    optimization_snippets: tClusterOptimization[],
    data: tStatistics
  ) {
    console.log("update_detail");
    await tick();
    optimization_snippets.forEach((optimization_snippet, index) => {
      if (index >= detail_statbars[cluster_label].length) {
        detail_statbars[cluster_label].push(
          new Statbars(
            `#stat-detail-${cluster_label}-${index}`,
            svgSize,
            innerSize,
            cluster_colors(cluster_label)
          )
        );
      }
      const statbars = detail_statbars[cluster_label][index];
      statbars.update(
        optimization_snippet.statistics,
        data.global_means,
        data.global_mins,
        data.global_maxes
      );
    });
  }

  function initDetailStatbars(cluster_statistics: {
    [key: string]: tStatBarData[];
  }) {
    let detail_statbars: { [key: string]: Statbars[] } = {};
    Object.keys(cluster_statistics).forEach((cluster_label, index) => {
      detail_statbars[cluster_label] = [
        new Statbars(
          `#stat-detail-${cluster_label}-0`,
          svgSize,
          innerSize,
          cluster_colors(cluster_label)
        ),
      ];
    });
    return detail_statbars;
  }

  //
  // handlers
  //
  function handleClusterHovered(cluster_label) {
    hoveredClusterStat = stat_data?.cluster_statistics[cluster_label];
    hovered_cluster_label = cluster_label;
  }

  async function handleClusterClicked(
    cluster_label: string,
    prompt_version: number
  ) {
    console.assert(stat_data !== undefined && data !== undefined);
    if (!stat_data || !data) return;
    mode = tMode.Detail;
    const cluster_nodes = data.filter(
      (datum) => "" + datum.cluster === "" + cluster_label
    );
    selected_cluster = {
      cluster_label: cluster_label,
      prompt_version: prompt_version,
      stats: stat_data.cluster_statistics[cluster_label],
      cluster_nodes: cluster_nodes,
      // summaries: cluster_nodes.map((datum) => datum.summary),
    };

    console.log(optimizations[selected_cluster.cluster_label]);
    await tick();
    clickedClusterStat = stat_data.cluster_statistics[cluster_label];
    detail_statbars[selected_cluster.cluster_label][0].update(
      clickedClusterStat,
      stat_data.global_means,
      stat_data.global_mins,
      stat_data.global_maxes
    );
  }

  function handleOptimizationClicked(prompt_version: number) {
    console.assert(selected_cluster !== undefined);
    if (!selected_cluster) return;
    const optimization_snippet =
      optimizations[selected_cluster.cluster_label][prompt_version];
    console.log(optimization_snippet);
    selected_cluster.prompt_version = prompt_version;
    selected_cluster.stats = optimization_snippet.statistics;
    selected_cluster.cluster_nodes = optimization_snippet.cluster_nodes;
    // selected_cluster.summaries =
    //   optimizations[selected_cluster.cluster_label][prompt_version].summaries;
    selected_cluster = selected_cluster;
  }

  function handleMetricRangeSelected(d) {
    console.log("handleMetricRangeSelected", d);
  }
</script>

<div class="flex flex-col overflow-y-auto max-h-full">
  {#if stat_data}
    <div class="flex">
      <div
        role="button"
        tabindex="0"
        class="tab tab-start"
        on:click={() => (mode = tMode.All_Cluster)}
        on:keyup={() => {}}
      >
        By Cluster
      </div>
      <div
        class="tab tab-end"
        role="button"
        tabindex="0"
        on:click={() => (mode = tMode.All_Metric)}
        on:keyup={() => {}}
      >
        By Metric
      </div>
    </div>
    {#if mode === tMode.All_Cluster}
      <div class="flex flex-wrap">
        {#each Object.keys(stat_data.cluster_statistics) as cluster_label, index}
          <div
            role="button"
            tabindex={index}
            class="cluster-stat-container w-[85px] h-[78px] border border-1 border-gray-100 relative hoverable gap-x-0.5 gap-y-0.5"
            on:keyup={() => {}}
            on:click={() => handleClusterClicked(cluster_label, 0)}
            on:mouseover={() => handleClusterHovered(cluster_label)}
            on:focus={() => handleClusterHovered(cluster_label)}
            on:mouseout={() => {
              hoveredClusterStat = undefined;
              hovered_cluster_label = undefined;
            }}
            on:blur={() => {
              hoveredClusterStat = undefined;
              hovered_cluster_label = undefined;
            }}
          >
            <p
              class="text-sm absolute ml-0.5 top-[-0.1rem] pointer-events-none"
            >
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
        {/each}
      </div>
      <div
        class="sticky bottom-1 w-full bg-white border border-1 border-black pl-1"
      >
        <ClusterStat
          cluster_stat={hoveredClusterStat}
          global_means={stat_data?.global_means}
        ></ClusterStat>
      </div>
    {:else if mode === tMode.All_Metric}
      <div class="flex flex-wrap">
        {#each $selected_metrics as metric, index}
          <div
            class="metric-stat-container w-[250px] h-[250px] border border-1 border-gray-100 relative gap-x-0.5 gap-y-0.5"
          >
            <p class="text-sm absolute ml-0.5 top-[-0.1rem]">
              {metric}
            </p>
            <svg
              id={`stat-metric-${index}`}
              class="w-full h-full"
              viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
            >
              <g
                class="inner"
                transform={`translate(${svgSize.margin}, ${svgSize.margin})`}
              ></g>
            </svg>
          </div>
        {/each}
      </div>
    {:else if mode === tMode.Detail && selected_cluster}
      <div
        class="w-full h-full flex flex-col justify-center items-center gap-y-1 border"
      >
        <div class="w-full flex p-1">
          <button
            class="text-sm h-fit !py-1 hoverable"
            on:click={() => {
              mode = tMode.All_Cluster;
              if (stat_data) update_all_cluster(stat_data);
            }}>Back</button
          >
        </div>
        <div class="w-full px-1 flex justify-start border-b font-bold">
          Cluster #{selected_cluster.cluster_label}
        </div>
        {#each optimizations[selected_cluster.cluster_label] as optimization_snippet, index}
          <div
            role="button"
            tabindex={index}
            on:keyup={() => {}}
            on:click={() => handleOptimizationClicked(index)}
            class="w-full flex gap-x-1 px-1"
          >
            <div class="flex flex-col justify-between">
              {#each $selected_metrics as metric}
                <div class="flex-1 text-xs flex items-center justify-end">
                  {metric}
                </div>
              {/each}
            </div>
            <svg
              id={`stat-detail-${selected_cluster.cluster_label}-${index}`}
              class="min-w-[48%] aspect-square pointer-events-none border border-gray-200"
              viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
            >
              <g
                class="inner"
                transform={`translate(${svgSize.margin}, ${svgSize.margin})`}
              ></g>
            </svg>
            <div class="grow text-left text-sm">
              <p class="border-b border-black w-fit">Prompt #{index}</p>
              <p class="text-sm">{optimization_snippet.prompts[0].content}</p>
              {#if optimization_snippet.prompts.length >= 4}
                <p class="text-sm">{optimization_snippet.prompts[3].content}</p>
              {/if}
            </div>
          </div>
        {/each}
        <!-- <ClusterStat
          cluster_stat={clickedClusterStat}
          global_means={data?.global_means}
        ></ClusterStat> -->
      </div>
    {/if}
  {/if}
</div>

<!-- <div class="grid auto-cols-min auto-rows-auto gap-x-1">
  {#each columns as col}
    <div class="row-start-1 row-end-1 col-span-1 text-sm">{col}</div>
  {/each}
  {#if data}
    {#each Object.keys(data) as cluster_label}
      <p class="row-span-1 col-start-1 col-end-1">{cluster_label}</p>
    {/each}
  {/if}
</div> -->
<style lang="postcss">
  .tab-start {
    @apply rounded-tl;
  }
  .tab-end {
    @apply rounded-tr;
  }
  .tab {
    @apply p-1 cursor-pointer border-t border-x text-sm hover:bg-gray-200;
  }
  .hoverable {
    @apply cursor-pointer hover:border hover:border-black;
  }
  :global(.clicked) {
    border: black solid 1px;
  }
  :global(.rect-hovered) {
    stroke: black;
    stroke-width: 1px;
  }
</style>
