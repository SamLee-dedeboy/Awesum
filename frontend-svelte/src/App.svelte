<script lang="ts">
  import PromptView from "lib/views/PromptView.svelte";
  import ClusterView from "lib/views/ClusterView.svelte";
  import StatisticsView from "lib/views/StatisticsView.svelte";
  import MetricsView from "lib/views/MetricsView.svelte";
  import SummaryView from "lib/views/SummaryView.svelte";
  import MetricSelectionView from "lib/views/MetricSelectionView.svelte";
  import { onMount } from "svelte";
  import { selected_metrics } from "lib/store";
  import { cluster_colors, server_address } from "lib/constants";

  import type {
    tClusterOptimization,
    tSelectedClusterData,
    tStatBarData,
    tMessage,
    tDataset,
    tExampleData,
  } from "lib/types";
  let prompt_view;
  let cluster_loading = true;
  let dataset: tDataset | undefined = undefined;
  let selected_cluster: tSelectedClusterData | undefined = undefined;
  let hovered_cluster_label: string | undefined = undefined;
  let cluster_optimizations: { [key: string]: tClusterOptimization[] } = {};
  // let show_noise: boolean = true;
  let show_noise: boolean = false;
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
          initClusterOptimizations(
            dataset.cluster_labels,
            dataset.dataset,
            dataset.statistics
          );
        }
      });
  });

  function adjustMetrics(p_dataset, p_cluster_params, p_selected_metrics) {
    console.assert(p_dataset !== undefined);
    if (!dataset) return;
    const parameters = {
      method: p_cluster_params.name,
      parameters: p_cluster_params.params,
      dataset: p_dataset,
      metrics: p_selected_metrics,
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
        initClusterOptimizations(
          dataset.cluster_labels,
          dataset.dataset,
          dataset.statistics
        );
      });
  }

  function setNewOptimization({
    cluster_nodes,
    statistics,
    messages,
  }: {
    cluster_nodes: any[];
    statistics: tStatBarData[];
    messages: any[];
  }) {
    console.assert(selected_cluster !== undefined);
    if (!selected_cluster) return;
    console.log({ cluster_nodes, statistics, messages });
    cluster_optimizations[selected_cluster.cluster_label] = [
      ...cluster_optimizations[selected_cluster.cluster_label],
      {
        // summaries: cluster_nodes.map((node) => node.summary),
        cluster_nodes: cluster_nodes,
        features: cluster_nodes.map((node) => node.features),
        prompts: messages,
        statistics: statistics,
      },
    ];
  }

  function initClusterOptimizations(cluster_labels, dataset, statistics) {
    const initial_prompt: tMessage[] = [
      {
        role: "system",
        content:
          "You are a news article summarization system. Please summarize the following article into one paragraph.",
      },
    ];
    cluster_optimizations = {};
    cluster_labels.forEach((cluster_label) => {
      cluster_optimizations[cluster_label] = [
        {
          // summaries: [],
          cluster_nodes: [],
          features: [],
          prompts: initial_prompt,
          statistics: statistics.cluster_statistics[cluster_label],
        },
      ];
    });
    dataset.forEach((datum) => {
      const cluster_label = datum.cluster;
      // cluster_optimizations[cluster_label][0].summaries.push(datum.summary);
      cluster_optimizations[cluster_label][0].cluster_nodes.push(datum);
      cluster_optimizations[cluster_label][0].features.push(datum.features);
    });
    cluster_optimizations = cluster_optimizations;
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
</script>

<div class="h-screen w-screen p-1 flex gap-x-1">
  {#if dataset === undefined}
    <div class="basis-1/2 h-1/2">Loading...</div>
  {:else}
    <div id="left" class="flex flex-col w-[75%] h-full shrink-0">
      <div class="flex w-full h-[50%] gap-x-1">
        <div class="min-w-[25%] max-w-[25%] p-1 flex flex-col">
          <MetricSelectionView metric_metadata={dataset.metric_metadata}
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
                {show_noise}
                data={dataset.dataset}
                statistics={dataset.statistics}
                highlight_cluster_label={hovered_cluster_label}
              ></ClusterView>
            </div>
          </div>
        </div>
        <div class="grow">
          <StatisticsView
            stat_data={dataset.statistics}
            data={dataset.dataset}
            bind:selected_cluster
            bind:hovered_cluster_label
            optimizations={cluster_optimizations}
          ></StatisticsView>
        </div>
      </div>
      <div class="w-full grow flex max-h-[50%] border-black">
        <!-- Prompt Editor -->
        <div class="h-full w-[30rem] flex flex-col">
          <div class="sticky top-0 view-header">
            <img src="bot.svg" alt="*" class="aspect-square" />
            Prompt Editor
          </div>
          <div class="grow">
            <PromptView
              bind:this={prompt_view}
              data={selected_cluster?.cluster_nodes}
              on:promptDone={(e) => setNewOptimization(e.detail)}
            ></PromptView>
          </div>
        </div>
        <div class="grow">
          <MetricsView
            data={dataset.metric_data}
            highlight_cluster_label={hovered_cluster_label}
          ></MetricsView>
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
              : "Summary"}
          </div>
          <SummaryView
            data={selected_cluster?.cluster_nodes || []}
            on:add_example={handleAddExample}
          ></SummaryView>
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
