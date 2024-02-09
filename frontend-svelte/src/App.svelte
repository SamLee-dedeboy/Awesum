<script lang="ts">
  import PromptView from "lib/views/PromptView.svelte";
  import ClusterView from "lib/views/ClusterView.svelte";
  import StatisticsView from "lib/views/StatisticsView.svelte";
  import MetricsView from "lib/views/MetricsView.svelte";
  import SummaryView from "lib/views/SummaryView.svelte";
  import { onMount } from "svelte";
  import { metrics } from "lib/constants";
  import type {
    tClusterOptimization,
    tSelectedClusterData,
    tStatBarData,
    tMessage,
  } from "lib/types";
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
  let loading = true;
  let dataset: any = null;
  let selected_metrics: string[] = metrics;
  let selected_cluster: tSelectedClusterData | undefined = undefined;
  let hovered_cluster_label: string | undefined = undefined;
  let cluster_optimizations: { [key: string]: tClusterOptimization[] } = {};
  const server_address = "http://localhost:5000";
  onMount(() => {
    fetch(server_address + "/data/")
      .then((response) => response.json())
      .then((res) => {
        dataset = res;
        console.log(dataset);
        loading = false;
        initClusterOptimizations(
          dataset.cluster_labels,
          dataset.dataset,
          dataset.statistics
        );
      });
  });

  function generateCluster() {
    const parameters = {
      method: cluster_params.name,
      parameters: cluster_params.params,
      dataset: dataset.dataset,
      metrics: selected_metrics,
    };
    fetch(server_address + "/data/cluster/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...parameters }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        dataset.cluster_labels = data.cluster_labels;
        dataset.dataset = data.dataset;
        dataset.statistics = data.statistics;
        dataset.metric_data = data.metric_data;
        dataset = dataset;
        // Object.keys(data).forEach((key) => {
        //   dataset[key] = data[key];
        // });
        initClusterOptimizations(
          dataset.cluster_labels,
          dataset.dataset,
          dataset.statistics
        );
      });
  }

  function setNewSummaries({
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
    cluster_optimizations[selected_cluster.cluster_label] = [
      ...cluster_optimizations[selected_cluster.cluster_label],
      {
        summaries: cluster_nodes.map((node) => node.summary),
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
          summaries: [],
          features: [],
          prompts: initial_prompt,
          statistics: statistics.cluster_statistics[cluster_label],
        },
      ];
    });
    dataset.forEach((datum) => {
      const cluster_label = datum.cluster;
      cluster_optimizations[cluster_label][0].summaries.push(datum.summary);
      cluster_optimizations[cluster_label][0].features.push(datum.features);
    });
    cluster_optimizations = cluster_optimizations;
  }
</script>

<div class="h-screen w-screen p-1 flex gap-x-1">
  {#if loading}
    <div class="basis-1/2 h-1/2">Loading...</div>
  {:else}
    <div id="left" class="flex flex-col w-[75%] h-full shrink-0">
      <div class="flex w-full h-[70%] flex-none">
        <div class="w-[15%] p-1 flex flex-col gap-y-1">
          <!-- input for cluster method -->
          <div class="flex justify-start items-center gap-x-1">
            <label
              for="cluster_method"
              class="block text-sm font-medium text-gray-900 dark:text-white"
              >Cluster Method</label
            >
            <select
              id="cluster_method"
              class="grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              on:input={(e) => {
                cluster_params.name = e.target?.value;
                cluster_params = cluster_params;
              }}
            >
              <option value="optics" selected>OPTICS</option>
              <option value="kmeans">K-Means</option>
            </select>
          </div>
          <!-- input for min_samples -->
          <div class="flex flex-col gap-x-1 flex-wrap">
            {#if cluster_params.name === "optics"}
              <div class="flex items-center justify-start gap-x-1">
                <label
                  for="min_samples"
                  class="text-sm font-medium text-gray-900 dark:text-white w-fit ml-1"
                  >Min Samples</label
                >
                <input
                  type="number"
                  id="min_samples"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[5rem] p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="10"
                  bind:value={cluster_params.params.min_samples}
                  required
                />
              </div>
            {:else}
              <div class="flex items-center justify-start gap-x-1">
                <label
                  for="k"
                  class="text-sm font-medium text-gray-900 dark:text-white w-fit ml-1"
                  >k</label
                >
                <input
                  type="number"
                  id="k"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[5rem] p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="10"
                  bind:value={cluster_params.params.n_clusters}
                  required
                />
              </div>
              <div class="flex items-center justify-start gap-x-1">
                <label
                  for="random_state"
                  class="text-sm font-medium text-gray-900 dark:text-white w-fit ml-1"
                  >random state</label
                >
                <input
                  type="number"
                  id="random_state"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[5rem] p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="42"
                  bind:value={cluster_params.params.random_state}
                  required
                />
              </div>
            {/if}
          </div>
          <button class="w-fit" on:click={generateCluster}>re-cluster</button>
        </div>
        <div class="h-full aspect-square">
          <ClusterView
            cluster_labels={dataset.cluster_labels}
            data={dataset.dataset}
            highlight_cluster_label={hovered_cluster_label}
          ></ClusterView>
        </div>
        <div class="flex-1">
          <StatisticsView
            stat_data={dataset.statistics}
            data={dataset.dataset}
            bind:selected_cluster
            bind:hovered_cluster_label
            optimizations={cluster_optimizations}
          ></StatisticsView>
        </div>
      </div>
      <div
        class="w-full grow max-h-[30%] overflow-y-auto border-t border-black"
      >
        <MetricsView
          data={dataset.metric_data}
          highlight_cluster_label={hovered_cluster_label}
        ></MetricsView>
      </div>
    </div>
    <div id="right" class="grow flex flex-col">
      <div class="h-[30%]">
        <PromptView
          data={selected_cluster?.cluster_nodes}
          {selected_metrics}
          on:promptDone={(e) => setNewSummaries(e.detail)}
        ></PromptView>
      </div>
      <div class="h-[70%] shrink-0">
        <SummaryView
          title={selected_cluster
            ? `Cluster #${selected_cluster.cluster_label}, Prompt #${selected_cluster.prompt_version} Summaries`
            : "Summary"}
          data={selected_cluster?.summaries || []}
        ></SummaryView>
      </div>
    </div>
  {/if}
</div>

<style>
  div {
    /* outline: 1px solid black; */
  }
</style>
