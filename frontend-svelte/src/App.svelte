<script lang="ts">
  import PromptView from "lib/views/PromptView.svelte";
  import ClusterView from "lib/views/ClusterView.svelte";
  import StatisticsView from "lib/views/StatisticsView.svelte";
  import TrackingView from "lib/views/TrackingView.svelte";
  import SummaryView from "lib/views/SummaryView.svelte";
  import MetricSelectionView from "lib/views/MetricSelectionView.svelte";
  import Select from "lib/components/Select.svelte";
  import {
    // recommended_cluster,
    selected_topic,
    test_set,
    example_nodes,
    recommended_nodes,
    target_ranges,
    default_ranges,
    data,
  } from "lib/store";
  import {
    cluster_colors,
    metric_categories,
    metrics,
    server_address,
    topic_options,
  } from "lib/constants";
  import * as d3 from "d3";

  import type {
    tNode,
    tOptimization,
    tSelectedClusterData,
    tStatBarData,
    tPrompt,
    tDataset,
    tMetricMetadata,
    tStatistics,
  } from "lib/types";
  let cluster_view;
  let statistics_view;
  let cluster_loading = true;
  let dataset: tDataset | undefined = undefined;
  let metric_metadata: tMetricMetadata = {
    correlations: [],
    descriptions: {},
  };
  let selected_cluster: tSelectedClusterData | undefined = undefined;
  let hovered_cluster_label: string | undefined = undefined;
  let optimizations: tOptimization[] = [];
  $: if ($selected_topic) fetch_data($selected_topic);
  function fetch_data(topic) {
    fetch(server_address + "/data/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic: topic }),
    })
      .then((response) => response.json())
      .then((res) => {
        dataset = res;
        if (dataset) {
          cluster_loading = false;
          console.log(dataset);
          data.set(dataset.dataset);
          metric_metadata = dataset.metric_metadata;
          dataset.centroids = generate_centroids(dataset.dataset);
          initOptimizations($test_set, dataset.statistics);
          initTargetRanges(dataset.global_statistics);
        }
      });
  }

  function setNewOptimization({
    results,
    statistics,
    trajectories,
    prompt,
  }: {
    results: tNode[];
    statistics: tStatBarData[];
    trajectories: any[];
    prompt: tPrompt;
  }) {
    console.log({ results, statistics, prompt });
    optimizations = [
      ...optimizations,
      {
        nodes: results,
        features: results.map((node) => node.features),
        prompt: prompt,
        statistics: statistics,
      },
    ];
  }

  function initOptimizations(nodes, statistics) {
    const initial_prompt: tPrompt = {
      persona: "You are a news article summarization system.",
      context: "",
      constraints: "Please summarize the following article into one paragraph.",
      examples: [],
      data_template: "${article}",
    };
    optimizations = [
      {
        nodes: nodes,
        features: nodes.map((node) => node.features),
        prompt: initial_prompt,
        statistics: statistics,
      },
    ];
  }

  function initTargetRanges(statistics: tStatistics) {
    metrics.forEach((metric, index) => {
      const global_max = statistics.global_maxes[index];
      const ranges = metric_categories[metric];
      const xMin = ranges[0].start;
      const xMax =
        ranges[ranges.length - 1].end === -1
          ? global_max
          : ranges[ranges.length - 1].end;
      $target_ranges[metric] = [xMin, xMax];
      $default_ranges[metric] = [xMin, xMax];
    });
  }

  function generate_centroids(data: tNode[]) {
    let cluster_nodes = {};
    data.forEach((datum) => {
      if (cluster_nodes[datum.cluster] === undefined) {
        cluster_nodes[datum.cluster] = [];
      }
      cluster_nodes[datum.cluster].push(datum);
      datum.test_case = false;
    });
    let centroids = {};
    let local_testset: tNode[] = [];
    Object.keys(cluster_nodes).forEach((cluster_label) => {
      if (cluster_label === "-1") return;
      const nodes = cluster_nodes[cluster_label];
      const intra_cluster_distance = compute_intra_cluster_distance(nodes);
      const mean_x = d3.mean(nodes.map((d) => d.coordinates[0]));
      const mean_y = d3.mean(nodes.map((d) => d.coordinates[1]));
      const { x, y, nearest } = find_nearest(mean_x, mean_y, nodes);

      centroids[cluster_label] = [x, y];
      nearest.test_case = true;
      nearest.intra_cluster_distance = intra_cluster_distance;
      local_testset.push(nearest);
    });
    test_set.set(local_testset);

    return centroids;

    function find_nearest(
      x: number,
      y: number,
      nodes: tNode[]
    ): { x: number; y: number; nearest: tNode } {
      let min_distance = Infinity;
      let nearest: tNode = nodes[0];
      nodes.forEach((node) => {
        const distance = Math.sqrt(
          (node.coordinates[0] - x) ** 2 + (node.coordinates[1] - y) ** 2
        );
        if (distance < min_distance) {
          min_distance = distance;
          nearest = node;
        }
      });
      return {
        x: nearest.coordinates[0],
        y: nearest.coordinates[1],
        nearest: nearest,
      };
    }
  }

  function compute_intra_cluster_distance(node: tNode[]) {
    let distance = 0;
    for (let i = 0; i < node.length; i++) {
      for (let j = i + 1; j < node.length; j++) {
        distance += Math.sqrt(
          (node[i].coordinates[0] - node[j].coordinates[0]) ** 2 +
            (node[i].coordinates[1] - node[j].coordinates[1]) ** 2
        );
      }
    }
    distance /= node.length;
    return distance;
  }
</script>

<div class="h-screen w-screen p-1 flex gap-x-1 overflow-hidden">
  {#if !$selected_topic}
    <div class="flex w-full items-center justify-center gap-x-2">
      <div>Choose a topic</div>
      <Select bind:selected_value={$selected_topic} options={topic_options}
      ></Select>
    </div>
  {:else if dataset === undefined}
    <div class="basis-1/2 h-1/2">Loading...</div>
  {:else}
    <div id="left" class="flex flex-col w-[75%] h-full shrink-0">
      <div class="flex w-full h-[50%] gap-x-0.5">
        <div class="min-w-[20rem] max-w-[25%] p-1 flex flex-col">
          <MetricSelectionView
            stat_data={dataset.global_statistics}
            {metric_metadata}
            data={dataset.dataset}
          ></MetricSelectionView>
        </div>
        <div class="flex h-full grow py-1">
          <div class="flex flex-col h-full items-center justify-center">
            <div class="view-header">Example Sourcing</div>
            <div class="flex-1 h-full w-min aspect-square relative">
              {#if cluster_loading}
                <img
                  src="load2.svg"
                  alt="*"
                  class="z-10 absolute center_spin w-[3rem] h-[3rem] bg-white rounded-full"
                />
              {/if}
              <div
                class="w-full h-full"
                style={cluster_loading ? `opacity: 0.5` : ""}
              >
                <ClusterView
                  bind:this={cluster_view}
                  data={dataset.dataset}
                  centroids={dataset.centroids || {}}
                  highlight_cluster_label={hovered_cluster_label}
                ></ClusterView>
              </div>
            </div>
          </div>
          <div class="grow border-t-4 border-[#89d0ff]">
            <StatisticsView
              bind:this={statistics_view}
              stat_data={dataset.global_statistics}
              data={dataset.dataset}
              bind:selected_cluster
              bind:hovered_cluster_label
              {optimizations}
            ></StatisticsView>
          </div>
        </div>
      </div>
      <div class="w-full grow flex max-h-[50%] border-black gap-x-1">
        <!-- Prompt Editor -->
        <div class="h-full min-w-[16rem] max-w-[25%] flex flex-col">
          <div class="sticky top-0 view-header">
            <img src="bot.svg" alt="*" class="aspect-square" />
            Prompt Editor
          </div>
          <div class="grow">
            <PromptView on:promptDone={(e) => setNewOptimization(e.detail)}
            ></PromptView>
          </div>
        </div>
        <div class="grow">
          <TrackingView {optimizations} statistics={dataset.global_statistics}
          ></TrackingView>
        </div>
      </div>
    </div>
    <div
      id="right"
      class="grow flex flex-col divide-y bg-gray-50 outline outline-1 outline-gray-100"
    >
      <div class="grow relative py-1">
        <div
          class="absolute overflow-y-auto top-0 bottom-0 w-full outline outline-1 outline-gray-100"
        >
          <div
            class="sticky top-0 view-header z-10"
            style={`background-color: ${
              selected_cluster
                ? cluster_colors(selected_cluster.cluster_label)
                : "#89d0ff"
            }`}
          >
            <img src="page.svg" alt="*" class="aspect-square" />
            {selected_cluster
              ? `Cluster #${selected_cluster.cluster_label}, Prompt #${selected_cluster.prompt_version} Summaries`
              : "Recommendations"}
          </div>
          <div
            class="flex px-1 gap-y-2 gap-x-2 items-center sticky top-6 z-20 bg-gray-50"
          >
            {#if $recommended_nodes}
              Examples:
              {@const nodes = $example_nodes || []}
              <div class="flex gap-x-0.5 items-center flex-wrap">
                {#each nodes as example}
                  <div class="w-fit">
                    <svg class="w-[1rem] h-[1rem]" viewBox="0 0 10 10">
                      <circle
                        fill={cluster_colors(example.cluster)}
                        stroke="black"
                        stroke-width="0.5"
                        r="4"
                        cx="5"
                        cy="5"
                      >
                      </circle></svg
                    >
                  </div>
                {/each}
              </div>
              <span class="text-xs font-mono flex-1 flex-nowrap min-w-[4rem]">
                {nodes.length} / {$recommended_nodes.length}
              </span>
              <div
                role="button"
                tabindex="0"
                class="flex shrink-0 items-center font-mono text-[0.6rem] h-fit outline outline-1 outline-green-400 hover:bg-green-100 rounded-sm px-1 shadow-lg ml-auto right-0"
                on:click={() => {
                  const example_node_ids = nodes.map((n) => n.id);
                  const not_example_nodes =
                    $recommended_nodes?.filter(
                      (node) => !example_node_ids.includes(node.id)
                    ) || [];
                  $example_nodes = [...nodes, ...not_example_nodes];
                }}
                on:keyup={() => {}}
              >
                <img src="star_filled.svg" alt="Add" class="mr-0.5 h-[1rem]" />
                <span> all </span>
              </div>
            {/if}
          </div>
          <SummaryView></SummaryView>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  div {
    /* outline: 1px solid black; */
  }
  .center_spin {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: center_spin 2s linear infinite;
  }

  @keyframes center_spin {
    from {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
</style>
