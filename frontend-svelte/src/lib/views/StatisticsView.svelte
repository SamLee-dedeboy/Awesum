<script lang="ts">
  import { afterUpdate, onMount, tick, createEventDispatcher } from "svelte";
  import * as d3 from "d3";
  import ClusterStat from "lib/components/ClusterStat.svelte";
  import ClusterProfile from "lib/components/ClusterProfile.svelte";
  import { Statbars } from "lib/renderers/statbars";
  import { cluster_colors, metrics } from "lib/constants";

  import {
    target_ranges,
    cluster_mode,
    selected_metrics,
    feature_target_levels,
    // recommended_cluster,
    recommended_nodes,
  } from "lib/store";
  import { categorize_metric } from "lib/constants/Metrics";
  import type {
    tNode,
    tStatBarData,
    tStatistics,
    tOptimization,
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
    margin: 0,
  };
  const innerSize = {
    width: svgSize.width - 2 * svgSize.margin,
    height: svgSize.height - 2 * svgSize.margin,
  };
  //
  // props
  //
  export let stat_data: tStatistics | undefined;
  export let data: tNode[] | undefined;
  export let selected_cluster: tSelectedClusterData | undefined;
  export let hovered_cluster_label: string | undefined;
  export let optimizations: tOptimization[];

  //
  // states
  //
  let hoveredClusterStat: tStatBarData[] | undefined;
  let clickedClusterStat: tStatBarData[] | undefined;
  let cluster_statbar_instances: Statbars[] = [];
  let metric_statbar_instances: Statbars[] = [];
  let detail_statbars: { [key: string]: Statbars[] };
  let mode: tMode = tMode.All_Cluster;

  //
  // init
  //
  onMount(() => {
    init_statbar_instances(stat_data);
  });

  function init_statbar_instances(stat_data) {
    console.assert(data !== undefined);
    //
    // cluster statbars
    //
    Object.keys(stat_data.cluster_statistics).forEach(
      (cluster_label, index) => {
        const statbars = new Statbars(
          `#stat-cluster-${index}`,
          svgSize,
          innerSize,
          null,
          cluster_colors(cluster_label)
        );
        cluster_statbar_instances.push(statbars);
      }
    );

    //
    // metric statbars
    //
    $selected_metrics.forEach((metric, index) => {
      const statbars = new Statbars(
        `#stat-metric-${index}`,
        svgSize,
        innerSize,
        index,
        undefined,
        handleMetricRangeMouseover,
        handleMetricRangeMouseout,
        handleMetricRangeSelected
      );

      metric_statbar_instances.push(statbars);
    });
  }

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

  $: if ($target_ranges && stat_data && metric_statbar_instances.length !== 0) {
    // const metric_index = $target_range[2];
    $selected_metrics.forEach((metric) => {
      const metric_index = metrics.indexOf(metric);
      metric_statbar_instances[metric_index].update_selected_range(
        $target_ranges[metric],
        stat_data!.global_means[metric_index]
      );
    });
  }

  // this will disable detail showing when click cluster
  // $: {
  //   if (
  //     selected_cluster &&
  //     optimizations[selected_cluster.cluster_label].length > 0 &&
  //     stat_data
  //   )
  //     update_detail(
  //       selected_cluster.cluster_label,
  //       optimizations[selected_cluster.cluster_label],
  //       stat_data
  //     );
  // }

  //
  // functions
  //
  async function update_all_cluster(data: tStatistics) {
    await tick();
    Object.keys(data.cluster_statistics).forEach((cluster_label, index) => {
      const statbars = cluster_statbar_instances[index];
      statbars.update(
        data.cluster_statistics[cluster_label],
        data.global_means,
        data.global_mins,
        data.global_maxes
      );
    });
  }

  async function update_all_metric(data: tStatistics) {
    await tick();
    $selected_metrics.forEach((metric, index) => {
      const statbars = metric_statbar_instances[index];
      const stats = Object.keys(data.metric_statistics[metric])
        .map((cluster_label) => [
          data.metric_statistics[metric][cluster_label],
          cluster_label,
        ])
        .filter((stat_w_label) => stat_w_label[1] !== "-1");
      const sorted_stats_w_label = stats.sort((a, b) => a[0].mean - b[0].mean);
      const sorted_stats = sorted_stats_w_label.map((stat) => stat[0]);
      const sorted_cluster_labels = sorted_stats_w_label.map((stat) => stat[1]);
      const sorted_cluster_colors = sorted_cluster_labels.map((cluster_label) =>
        cluster_colors(cluster_label)
      );
      statbars.update(
        sorted_stats,
        [data.global_means[index]],
        [data.global_mins[index]],
        [data.global_maxes[index]],
        true,
        sorted_cluster_colors,
        sorted_cluster_labels
      );
    });
  }

  async function update_detail(
    cluster_label: string,
    optimization_snippets: tOptimization[],
    data: tStatistics
  ) {
    await tick();
    optimization_snippets.forEach((optimization_snippet, index) => {
      if (index >= detail_statbars[cluster_label].length) {
        detail_statbars[cluster_label].push(
          new Statbars(
            `#stat-detail-${cluster_label}-${index}`,
            svgSize,
            innerSize,
            null,
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
          null,
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

  function handleClusterMouseout() {
    hoveredClusterStat = undefined;
    hovered_cluster_label = undefined;
  }

  function handleClusterClicked(cluster_label: string) {
    const cluster_stat = stat_data?.cluster_statistics[cluster_label];
    cluster_stat?.forEach((stat, index) => {
      if (!$selected_metrics.includes(metrics[index])) return;
      // $target_ranges[metrics[index]] = [stat.min, stat.max];
      $feature_target_levels[metrics[index]] = categorize_metric(
        metrics[index],
        stat.mean
      );
      // recommended_cluster.set(cluster_label);
      recommended_nodes.set(
        data?.filter((datum) => datum.cluster === cluster_label)
      );
    });
    // cluster_mode.set("metric");
  }

  function handleOptimizationClicked(prompt_version: number) {
    console.assert(selected_cluster !== undefined);
    if (!selected_cluster) return;
    const optimization_snippet =
      optimizations[selected_cluster.cluster_label][prompt_version];
    selected_cluster.prompt_version = prompt_version;
    selected_cluster.stats = optimization_snippet.statistics;
    selected_cluster.cluster_nodes = optimization_snippet.cluster_nodes;
    // selected_cluster.summaries =
    //   optimizations[selected_cluster.cluster_label][prompt_version].summaries;
    selected_cluster = selected_cluster;
  }

  function handleMetricRangeSelected(d: tStatBarData, metric_index: number) {
    if (
      $target_ranges[metrics[metric_index]][0] === d.min &&
      $target_ranges[metrics[metric_index]][1] === d.max
    ) {
      $target_ranges[metrics[metric_index]] = [undefined, undefined];
    } else {
      $target_ranges[metrics[metric_index]] = [d.min, d.max];
    }
    const in_range_nodes = data?.filter(
      (d) => d.cluster !== "-1" && inAllRange(d.features, $target_ranges)
    );
    console.log(in_range_nodes);
    recommended_nodes.set(in_range_nodes);
    if (
      Object.values($target_ranges).every(
        (range) => range[0] === undefined && range[1] === undefined
      )
    )
      cluster_mode.set("cluster");
    else cluster_mode.set("metric");
  }

  function handleMetricRangeMouseover(cluster_label: string) {
    handleClusterHovered(cluster_label);
  }

  function handleMetricRangeMouseout(cluster_label: string) {
    handleClusterMouseout();
  }
  function inAllRange(
    features: { [key: string]: number },
    ranges: { [key: string]: [number | undefined, number | undefined] }
  ) {
    if (
      Object.values(ranges).every(
        ([min, max]) => min === undefined && max === undefined
      )
    )
      return false;
    let inRange = true;
    Object.entries(ranges).forEach(([metric, range]) => {
      if (range[0] === undefined || range[1] === undefined) return;
      const value = features[metric];
      if (value < range[0] || value > range[1]) return (inRange = false);
    });
    return inRange;
  }
</script>

<div class="flex max-h-full">
  <div class="flex flex-col overflow-y-auto w-[100%] max-h-full">
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
            <ClusterProfile
              {cluster_label}
              {index}
              {svgSize}
              {hovered_cluster_label}
              on:click={(e) => handleClusterClicked(e.detail)}
              on:mouseout={() => handleClusterMouseout()}
              on:mouseover={(e) => handleClusterHovered(e.detail)}
            ></ClusterProfile>
          {/each}
        </div>
      {:else if mode === tMode.All_Metric}
        <div
          class="flex flex-wrap outline outline-1 outline-gray-100 justify-between"
        >
          {#each $selected_metrics as metric, index}
            <div class="flex flex-col w-[49%]">
              <p class="text-sm text-center font-semibold bg-cyan-100">
                {metric}
              </p>
              <div
                class="metric-stat-container grow aspect-square border border-1 border-gray-100 relative gap-x-0.5 gap-y-0.5"
              >
                <svg
                  id={`stat-metric-${index}`}
                  class="h-full aspect-square"
                  viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
                >
                  <g
                    class="inner"
                    transform={`translate(${svgSize.margin}, ${svgSize.margin})`}
                  ></g>
                </svg>
              </div>
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
                  <p class="text-sm">
                    {optimization_snippet.prompts[3].content}
                  </p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
  <!-- <div class="flex flex-col p-1 text-left">
    {#each Object.keys($target_ranges) as metric, index}
      {#if $target_ranges[metric][0] !== undefined}
        <div class="underline">{metric}</div>
        <div class="text-sm">
          <span
            >{$target_ranges[metric][0]?.toFixed(2)} - {$target_ranges[
              metric
            ][1]?.toFixed(2)}
          </span>
         
        </div>
      {/if}
    {/each}
  </div> -->
</div>

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
