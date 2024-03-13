<script lang="ts">
  import { onMount, tick } from "svelte";
  import ClusterProfile from "lib/components/ClusterProfile.svelte";
  import { Statbars } from "lib/renderers/statbars";
  import {
    cluster_colors,
    metrics,
    metric_abbrs,
    categorize_metric,
  } from "lib/constants";

  import {
    target_ranges,
    default_ranges,
    selected_metrics,
    feature_target_levels,
    recommended_nodes,
    inAllRange,
  } from "lib/store";
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
      } else {
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
      const stats = Object.keys(data.metric_statistics[metric]).map(
        (cluster_label) => [
          data.metric_statistics[metric][cluster_label],
          cluster_label,
        ]
      );
      const sorted_stats_w_label = stats
        .filter((stat_w_label) => stat_w_label[1] !== "-1")
        .sort((a, b) => a[0].mean - b[0].mean)
        .concat(stats.filter((stat_w_label) => stat_w_label[1] === "-1"));
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
    const feature_target_all_undefined = Object.keys(
      $feature_target_levels
    ).every((feature) => $feature_target_levels[feature] === null);
    cluster_stat?.forEach((stat, index) => {
      if (!$selected_metrics.includes(metrics[index])) return;
      if (
        !feature_target_all_undefined &&
        $feature_target_levels[metrics[index]] === null
      )
        return;
      $feature_target_levels[metrics[index]] = categorize_metric(
        metrics[index],
        stat.mean
      );
      $target_ranges[metrics[index]] = [stat.min, stat.max];
      recommended_nodes.set(
        data?.filter((datum) => datum.cluster === cluster_label)
      );
    });
  }

  function handleMetricRangeSelected(d: tStatBarData, metric_index: number) {
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

  function handleMetricDisabled(
    metric,
    target_level: string | null,
    target_range: [number | undefined, number | undefined],
    default_range: [number, number]
  ) {
    $feature_target_levels[metric] = target_level
      ? null
      : categorize_metric(
          metric,
          ((target_range[0] || default_range[0]) +
            (target_range[1] || default_range[1])) /
            2
        );
    const enabled_features = Object.keys($feature_target_levels).filter(
      (k) => $feature_target_levels[k] !== null
    );
    const in_range_nodes = data?.filter((d) =>
      inAllRange(d.features, $target_ranges, enabled_features)
    );

    recommended_nodes.set(in_range_nodes);
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
                stat_data={stat_data.cluster_statistics[cluster_label]}
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
            {@const target_level = $feature_target_levels[metric]}
            {@const target_range = $target_ranges[metric]}
            {@const default_range = $default_ranges[metric]}
            <div
              class="metric-container flex flex-col w-[49%] relative"
              style={`opacity: ${target_level ? 1 : 0.5}`}
            >
              <div
                role="button"
                tabindex={index}
                class="hide-button absolute top-0 right-0 p-0.5 w-7 h-5 hover:bg-gray-300 hidden"
                on:click={() =>
                  handleMetricDisabled(
                    metric,
                    target_level,
                    target_range,
                    default_range
                  )}
              >
                <img src="eye_off.svg" alt="hide" class="w-full h-full" />
              </div>
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
      {/if}
    {/if}
  </div>
</div>

<style lang="postcss">
  .metric-container:hover .hide-button {
    display: block;
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
