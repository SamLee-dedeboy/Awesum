<script lang="ts">
  import PromptView from "lib/views/PromptView.svelte";
  import ClusterView from "lib/views/ClusterView.svelte";
  import StatisticsView from "lib/views/StatisticsView.svelte";
  import MetricsView from "lib/views/MetricsView.svelte";
  import TrackingView from "lib/views/TrackingView.svelte";
  import SummaryView from "lib/views/SummaryView.svelte";
  import MetricSelectionView from "lib/views/MetricSelectionView.svelte";
  import { onMount } from "svelte";
  import {
    // recommended_cluster,
    feature_target_levels,
    selected_metrics,
    test_set,
    recommended_nodes,
  } from "lib/store";
  import {
    cluster_colors,
    metric_categories,
    metrics,
    server_address,
  } from "lib/constants";
  import * as d3 from "d3";

  import type {
    tNode,
    tOptimization,
    tSelectedClusterData,
    tStatBarData,
    tMessage,
    tPrompt,
    tDataset,
    tMetricMetadata,
    tExampleData,
    tMetricRecommendationResponse,
  } from "lib/types";
  let prompt_view;
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
  // let show_noise: boolean = true;
  let firstSubscribe = true;
  let cluster_params = {
    name: "optics",
    params: {
      // for optics
      min_samples: 10,
      metric: "cosine",
      // for kmeans
      n_clusters: 10,
      random_state: 42,
    },
  };

  selected_metrics.subscribe((value) => {
    if (firstSubscribe) {
      firstSubscribe = false;
      return;
    }
    adjustMetrics(dataset?.dataset, cluster_params, value);
  });

  onMount(() => {
    fetch(server_address + "/data/")
      .then((response) => response.json())
      .then((res) => {
        dataset = res;
        if (dataset) {
          cluster_loading = false;
          console.log(dataset);
          metric_metadata = dataset.metric_metadata;
          dataset.centroids = generate_centroids(dataset.dataset);
          initOptimizations($test_set, dataset.statistics);
        }
      });
  });

  function adjustMetrics(p_dataset, p_cluster_params, p_selected_metrics) {
    console.assert(p_dataset !== undefined);
    if (!dataset) return;
    const feature_recommendations = Object.entries($feature_target_levels)
      .filter((f) => f[1])
      .map((f) => {
        return { feature_name: f[0], level: f[1] };
      });
    console.log({ feature_recommendations });
    const parameters = {
      dataset: p_dataset,
      recommended_features: {
        features: feature_recommendations,
        feature_pool: $selected_metrics,
      },
    };
    cluster_loading = true;
    fetch(server_address + "/data/query_closest_cluster/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...parameters }),
    })
      .then((response) => response.json())
      .then((data) => {
        // recommended_cluster.set(data.closest_cluster);
        const closest_cluster = data.closest_cluster;
        recommended_nodes.set(
          dataset?.dataset.filter((d) => d.cluster === closest_cluster)
        );
        cluster_loading = false;
      });
  }

  function _adjustMetrics(p_dataset, p_cluster_params, p_selected_metrics) {
    console.assert(p_dataset !== undefined);
    if (!dataset) return;
    const feature_recommendations = Object.entries($feature_target_levels)
      .filter((f) => f[1])
      .map((f) => {
        return { feature_name: f[0], level: f[1] };
      });
    console.log({ feature_recommendations }, $feature_target_levels);
    const parameters = {
      method: p_cluster_params.name,
      // parameters: p_cluster_params.params,
      dataset: p_dataset,
      metrics: p_selected_metrics,
      recommended_features: {
        features: feature_recommendations,
        feature_pool: $selected_metrics,
      },
    };
    cluster_loading = true;
    fetch(server_address + "/data/metrics/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...parameters }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.assert(dataset !== undefined);
        if (!dataset) return;
        console.log("Success:", data);
        dataset.cluster_labels = data.cluster_labels;
        dataset.dataset = data.dataset;
        dataset.statistics = data.statistics;
        dataset.metric_data = data.metric_data;
        dataset = dataset;
        cluster_loading = false;
        initOptimizations($test_set, dataset.statistics);

        // recommended_cluster.set(data.closest_cluster);
      });
  }

  function setNewOptimization({
    results,
    statistics,
    prompt,
  }: {
    results: tNode[];
    statistics: tStatBarData[];
    prompt: tPrompt;
  }) {
    console.log({ results, statistics, prompt });
    optimizations = [
      ...optimizations,
      {
        // summaries: cluster_nodes.map((node) => node.summary),
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
      data_template: "${text}",
    };
    optimizations = [
      {
        nodes: nodes,
        features: nodes.map((node) => node.features),
        prompt: initial_prompt,
        statistics: statistics,
      },
    ];
    // cluster_optimizations = {};
    // cluster_labels.forEach((cluster_label) => {
    //   cluster_optimizations[cluster_label] = [
    //     {
    //       // summaries: [],
    //       cluster_nodes: [],
    //       features: [],
    //       prompts: initial_prompt,
    //       statistics: statistics.cluster_statistics[cluster_label],
    //     },
    //   ];
    // });
    // dataset.forEach((datum) => {
    //   const cluster_label = datum.cluster;
    //   // cluster_optimizations[cluster_label][0].summaries.push(datum.summary);
    //   cluster_optimizations[cluster_label][0].cluster_nodes.push(datum);
    //   cluster_optimizations[cluster_label][0].features.push(datum.features);
    // });
    // cluster_optimizations = cluster_optimizations;
  }

  function handleAddExample(e) {
    const example: tExampleData = {
      id: e.detail.id,
      text: e.detail.text,
      summary: e.detail.summary,
    };
    prompt_view.add_example(example);
  }

  // function handleSelectedMetricChanged(metrics) {
  //   generateCluster();
  // }
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
      const nodes = cluster_nodes[cluster_label];
      const mean_x = d3.mean(nodes.map((d) => d.coordinates[0]));
      const mean_y = d3.mean(nodes.map((d) => d.coordinates[1]));
      const { x, y, nearest } = find_nearest(mean_x, mean_y, nodes);
      centroids[cluster_label] = [x, y];
      nearest.test_case = true;
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

  function handleHighlightRecommendation() {
    // cluster_view.toggle_recommendations();
    // const cluster_label: string = e.detail;
    // console.log(cluster_label);
    // cluster_view.update_highlight_cluster(cluster_label);
  }
</script>

<div class="h-screen w-screen p-1 flex gap-x-1">
  {#if dataset === undefined}
    <div class="basis-1/2 h-1/2">Loading...</div>
  {:else}
    <div id="left" class="flex flex-col w-[75%] h-full shrink-0">
      <div class="flex w-full h-[50%] gap-x-1">
        <div class="min-w-[25%] max-w-[25%] p-1 flex flex-col">
          <MetricSelectionView
            {metric_metadata}
            data={dataset.dataset}
            on:highlight_recommendation={handleHighlightRecommendation}
          ></MetricSelectionView>
        </div>
        <div class="flex flex-col h-full p-1 items-center justify-center">
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
                statistics={dataset.statistics}
                highlight_cluster_label={hovered_cluster_label}
              ></ClusterView>
            </div>
          </div>
        </div>
        <div class="grow">
          <StatisticsView
            bind:this={statistics_view}
            stat_data={dataset.statistics}
            data={dataset.dataset}
            bind:selected_cluster
            bind:hovered_cluster_label
            {optimizations}
          ></StatisticsView>
        </div>
      </div>
      <div class="w-full grow flex max-h-[50%] border-black">
        <!-- Prompt Editor -->
        <div class="h-full w-[30rem] shrink-0 flex flex-col">
          <div class="sticky top-0 view-header">
            <img src="bot.svg" alt="*" class="aspect-square" />
            Prompt Editor
          </div>
          <div class="grow">
            <PromptView
              bind:this={prompt_view}
              on:promptDone={(e) => setNewOptimization(e.detail)}
            ></PromptView>
          </div>
        </div>
        <div class="">
          <TrackingView {optimizations}></TrackingView>
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
            class="sticky top-0 view-header"
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
          <!-- <SummaryView
            data={selected_cluster?.cluster_nodes || []}
            on:add_example={handleAddExample}
          ></SummaryView> -->
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
