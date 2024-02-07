<script lang="ts">
  import PromptView from "lib/views/PromptView.svelte";
  import ClusterView from "lib/views/ClusterView.svelte";
  import StatisticsView from "lib/views/StatisticsView.svelte";
  import MetricsView from "lib/views/MetricsView.svelte";
  import SummaryView from "lib/views/SummaryView.svelte";
  import { onMount } from "svelte";
  import { metrics, cluster_colors } from "lib/constants";
  import type {
    tClusterOptimization,
    tSelectedClusterData,
    tStatBarData,
    tMessage,
    tDataset,
    tExampleData,
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
  let prompt_view;
  let loading = true;
  let dataset: tDataset | undefined = undefined;
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
        if (dataset) {
          loading = false;
          initClusterOptimizations(
            dataset.cluster_labels,
            dataset.dataset,
            dataset.statistics
          );
        }
      });
  });

  function generateCluster() {
    console.assert(dataset !== undefined);
    if (!dataset) return;
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
        console.assert(dataset !== undefined);
        if (!dataset) return;
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
</script>

<div class="h-screen w-screen p-1 flex gap-x-1">
  {#if dataset === undefined}
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
    <div
      id="right"
      class="grow flex flex-col divide-y bg-gray-50 outline outline-1 outline-gray-100"
    >
      <div class="h-fit">
        <div
          class="sticky top-0 bg-[#89d0ff] border-b border-gray-100 text-center text-xl text-gray font-bold w-full"
        >
          Prompt Editor
        </div>
        <PromptView
          bind:this={prompt_view}
          data={selected_cluster?.cluster_nodes}
          {selected_metrics}
          on:promptDone={(e) => setNewOptimization(e.detail)}
        ></PromptView>
      </div>
      <div class="grow relative py-1">
        <div
          class="absolute overflow-y-auto top-0 bottom-0 w-full outline outline-1 outline-gray-100"
        >
          <div
            class="sticky top-0 text-xl border-b py-1 border-gray-100 text-center font-bold w-full"
            style={`background-color: ${
              selected_cluster
                ? cluster_colors(selected_cluster.cluster_label)
                : "#89d0ff"
            }`}
          >
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
</style>
