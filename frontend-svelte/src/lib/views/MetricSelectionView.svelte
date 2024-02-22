<script lang="ts">
  import { onMount, tick } from "svelte";
  import { selected_metrics } from "lib/store";
  import { createPopover, melt } from "@melt-ui/svelte";
  import { cluster_colors, metrics, feature_descriptions } from "lib/constants";
  import { CorrelationGraph } from "lib/renderers/correlation_graph";
  import MetricRecommendation from "lib/components/MetricRecommendation.svelte";

  let correlation_graph = new CorrelationGraph(
    "metric-correlations-svg",
    { width: 100, height: 100, center: [50, 50] },
    9
  );
  export let metric_metadata: any;
  $: removed_metrics = metrics.filter((m) => !$selected_metrics.includes(m));

  let selected_metric: string | undefined = undefined;

  onMount(() => {
    console.log(metric_metadata);
    correlation_graph.init();
  });

  $: if (metric_metadata.correlations)
    update_correlation_graph($selected_metrics, metric_metadata.correlations);
  async function update_correlation_graph(selected_metrics, correlations) {
    await tick();
    correlation_graph.update(selected_metrics, correlations);
  }
  function removeMetric(metric) {
    selected_metrics.set($selected_metrics.filter((m) => m !== metric));
  }

  // setting up melt ui popover
  const {
    elements: { trigger, content, arrow, close },
    states: { open },
  } = createPopover({
    forceVisible: true,
    positioning: {
      placement: "left",
      gutter: 0,
    },
    arrowSize: 8,
    disableFocusTrap: true,
  });
  const {
    elements: {
      trigger: add_trigger,
      content: add_content,
      arrow: add_arrow,
      close: add_close,
    },
    states: { open: add_open },
  } = createPopover({
    forceVisible: true,
    positioning: {
      placement: "left",
      gutter: 0,
    },
    arrowSize: 6,
    disableFocusTrap: true,
  });
</script>

<div class="flex flex-col h-full">
  <div class="view-header">Metric Selection</div>
  <div class="topc-section flex">
    <div
      class="flex flex-col grow h-fit items-center justify-center border-gray-500"
    >
      {#each $selected_metrics as metric, index}
        <div class="metric-title w-full flex flex-1 items-center px-1">
          <div
            role="button"
            tabindex={index}
            class="h-[1.2rem] aspect-square hover:bg-gray-300 rounded-full hide-button"
            on:keyup={() => {}}
            on:click={() => removeMetric(metric)}
          >
            <img src="close.svg" alt="*" />
          </div>
          <div
            use:melt={$trigger}
            class="w-[7rem] h-full flex text-left px-2 cursor-pointer hover:bg-gray-200"
            on:m-click={() => {
              selected_metric = metric;
            }}
          >
            {metric}
          </div>
        </div>
      {/each}
      <div
        use:melt={$add_trigger}
        class="w-fit h-full flex flex-1 items-center justify-start px-1 hover:bg-gray-300 mr-auto"
        style={removed_metrics.length === 0
          ? "opacity: 0.5; cursor-not-allowed; pointer-events: none;"
          : ""}
      >
        <div class="h-[1.2rem] aspect-square rounded-full">
          <img src="plus_circle.svg" alt="*" />
        </div>
        <div class="w-[7rem] h-full flex justify-start px-2">add more</div>
      </div>
    </div>
    <div class="w-2/5 aspect-square">
      <svg id={`metric-correlations-svg`} class="metric-correlations-svg"></svg>
    </div>
  </div>
  <div class="flex w-full flex-1">
    <MetricRecommendation></MetricRecommendation>
  </div>
</div>
{#if $open && selected_metric}
  <div use:melt={$content} class="shadow-sm">
    <div class="border border-black !bg-amber-50" use:melt={$arrow} />
    <div
      class="flex flex-col py-2 px-2 w-[20rem] h-fit rounded border border-gray-500 bg-amber-50 relative"
    >
      <p class="break-normal feature-description">
        {@html feature_descriptions[selected_metric]}
      </p>
    </div>
    <div
      role="button"
      tabindex="0"
      use:melt={$close}
      class="absolute p-0.5 bottom-1 right-1 text-sm bg-green-100 hover:bg-green-200 outline outline-1 outline-gray-500 rounded"
    >
      Got it
    </div>
  </div>
{/if}
{#if $add_open}
  <div
    use:melt={$add_content}
    class="shadow-sm rounded bg-gray-100 border border-gray-300 text-sm"
  >
    <div class="border border-black !bg-amber-50" use:melt={$add_arrow} />
    <div class="flex flex-col divide-y">
      {#each removed_metrics as metric, index}
        <div
          class="flex flex-col px-2 w-[7rem] h-fit cursor-pointer hover:bg-gray-300"
        >
          <div
            role="button"
            tabindex={index}
            class="flex flex-wrap break-normal cursor-pointer"
            on:keyup={() => {}}
            on:click={() =>
              selected_metrics.set([...$selected_metrics, metric])}
          >
            {metric}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style lang="postcss">
  .metric-correlations-svg {
    & circle.node {
      fill: white;
      stroke: #5f5f5f;
      stroke-width: 0.5;
      filter: drop-shadow(0 0 0.03rem rgba(0, 0, 0, 0.5));
    }
    & circle.node:hover,
    circle.node-clicked {
      fill: #c0c0c0;
      stroke-width: 1;
    }
    & text.node-label {
      font-size: 0.5rem;
    }
    & .link {
      stroke: black;
      stroke-width: 0.5;
    }
  }

  .feature-description {
    @apply font-mono text-[0.8rem];
    & span {
      @apply underline break-normal;
    }
    & .highlight {
      @apply underline not-italic;
    }
  }
  .hide-button {
    opacity: 0;
  }
  .metric-title:hover .hide-button {
    opacity: 1;
  }
</style>
