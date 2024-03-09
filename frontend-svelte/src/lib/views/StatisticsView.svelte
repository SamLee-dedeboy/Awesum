<script lang="ts">
  import { onMount, tick } from "svelte";
  import ClusterProfile from "lib/components/ClusterProfile.svelte";
  import { Statbars } from "lib/renderers/statbars";
  import { cluster_colors, metrics, metric_abbrs } from "lib/constants";

  import {
    target_ranges,
    default_ranges,
    // cluster_mode,
    selected_metrics,
    feature_target_levels,
    // recommended_cluster,
    recommended_nodes,
  } from "lib/store";
  import { categorize_metric, metric_categories } from "lib/constants/Metrics";
  import type {
    tNode,
    tStatBarData,
    tStatistics,
    tOptimization,
    tSelectedClusterData,
  } from "lib/types";
  import MetricSlider from "lib/components/MetricSlider.svelte";
  //
  // constants
  //
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
  let cluster_statbar_instances: Statbars[] = [];
  let metric_statbar_instances: Statbars[] = [];
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
  $: update_mode(mode);
  function update_mode(mode: tMode) {
    if (stat_data) {
      if (mode === tMode.All_Cluster) {
        update_all_cluster(stat_data);
        // detail_statbars = initDetailStatbars(stat_data.cluster_statistics);
      } else {
        console.log("update_all_metric");
        update_all_metric(stat_data);
      }
    }
  }

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
      statbars.update_selected_range(
        $target_ranges[metric],
        data.global_means[index]
      );
    });
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
      $target_ranges[metrics[index]] = [stat.min, stat.max];
      // recommended_cluster.set(cluster_label);
      recommended_nodes.set(
        data?.filter((datum) => datum.cluster === cluster_label)
      );
    });
    // cluster_mode.set("metric");
  }

  function handleMetricRangeSelected(d: tStatBarData, metric_index: number) {
    console.log("handleMetricRangeSelected", d, metric_index);
    if (
      $target_ranges[metrics[metric_index]][0] === d.min &&
      $target_ranges[metrics[metric_index]][1] === d.max
    ) {
      $target_ranges[metrics[metric_index]] =
        $default_ranges[metrics[metric_index]];
    } else {
      $target_ranges[metrics[metric_index]] = [d.min, d.max];
    }
    const in_range_nodes = data?.filter(
      (d) => d.cluster !== "-1" && inAllRange(d.features, $target_ranges)
    );
    recommended_nodes.set(in_range_nodes);
    metric_statbar_instances[metric_index].update_selected_range(
      $target_ranges[metrics[metric_index]],
      stat_data!.global_means[metric_index]
    );
  }

  target_ranges.subscribe((value) => {
    if (value && metric_statbar_instances.length !== 0) {
      $selected_metrics.forEach((metric, index) => {
        metric_statbar_instances[index].update_selected_range(
          value[metric],
          stat_data!.global_means[index]
        );
      });
    }
  });

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
  <div
    class="flex flex-col overflow-y-auto w-[100%] max-h-full pr-5"
    style="scrollbar-gutter: stable;"
  >
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
          By Feature
        </div>
      </div>
      {#if mode === tMode.All_Cluster}
        <div class="flex gap-x-1 h-full">
          <div class="w-[4rem] h-[7rem] relative flex flex-col justify-around">
            {#each metrics as metric}
              <svg viewBox="0 0 40 30">
                <rect x="0" y="0" width="40" height="24" fill="#c7f0a5"></rect>
                <text
                  x="20"
                  y="14"
                  font-size="1.1rem"
                  dominant-baseline="middle"
                  text-anchor="middle">{metric_abbrs[metric]}</text
                >
              </svg>
            {/each}
          </div>
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
              <div class="h-[1.5rem] w-full">
                <MetricSlider
                  {metric}
                  {data}
                  start_value={$default_ranges[metric][0]}
                  end_value={$default_ranges[metric][1]}
                ></MetricSlider>
              </div>
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
        <!-- {:else if mode === tMode.Detail && selected_cluster}
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
        </div> -->
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
    /* @apply rounded-tl; */
  }
  .tab-end {
    /* @apply rounded-tr; */
  }
  .tab {
    @apply px-1 cursor-pointer border-t border-x text-[0.8rem] hover:bg-gray-200;
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
