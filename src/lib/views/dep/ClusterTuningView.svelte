<script lang=ts>
  import Switch from "lib/components/Switch.svelte";
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

  function reGenerateCluster(p_dataset, p_cluster_params, p_selected_metrics) {
    console.assert(p_dataset !== undefined);
    if (!dataset) return;
    const parameters = {
      method: p_cluster_params.name,
      parameters: p_cluster_params.params,
      dataset: p_dataset,
      metrics: p_selected_metrics,
    };
    cluster_loading = true;
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
        initClusterOptimizations(
          dataset.cluster_labels,
          dataset.dataset,
          dataset.statistics
        );
        cluster_loading = false;
      });
  }
</script>

<div class="param-tuning-section flex flex-col gap-y-1 bg-gray-100 p-1 rounded border border-gray-300" >
    <!-- input for cluster method -->
    <div class="flex justify-start items-center gap-x-1">
        <label
        for="cluster_method"
        class="block text-sm font-medium text-gray-900 dark:text-white"
        >Cluster Method</label
        >
        <select
        id="cluster_method"
        class="grow bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
            class="text-sm font-medium text-gray-900 dark:text-white w-fit"
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
</div>
<button
class="px-2 flex items-center justify-start w-fit h-[2.5rem] gap-x-1"
on:click={() =>
    reGenerateCluster(
    dataset?.dataset,
    cluster_params,
    $selected_metrics
    )}
>
<img src="refresh.svg" alt="*" class="h-[1rem] aspect-square" />
<span> regenerate cluster </span>
</button>
<Switch label="show noise" bind:checked={show_noise} />