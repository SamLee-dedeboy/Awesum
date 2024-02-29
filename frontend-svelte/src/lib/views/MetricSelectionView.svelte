<script lang="ts">
  import { createEventDispatcher, onMount, tick } from "svelte";
  import { selected_metrics } from "lib/store";
  import {
    createPopover,
    createSelect,
    createTooltip,
    melt,
  } from "@melt-ui/svelte";
  import Select from "lib/components/Select.svelte";
  import {
    cluster_colors,
    metrics,
    feature_descriptions,
    metric_categories,
  } from "lib/constants";
  import { fade } from "svelte/transition";
  // import { CorrelationGraph } from "lib/renderers/correlation_graph";
  import { CorrelationMatrix } from "lib/renderers/correlation_matrix";
  import MetricRecommendation from "lib/components/MetricRecommendation.svelte";
  import { feature_recommendations, feature_target_levels } from "lib/store";
  import type { tNode } from "lib/types";
  const dispatch = createEventDispatcher();

  // let correlation_graph = new CorrelationGraph(
  //   "metric-correlations-svg",
  //   { width: 100, height: 100, center: [50, 50] },
  //   9
  // );
  let correlation_matrix = new CorrelationMatrix(
    "metric-correlations-svg",
    {
      width: 100,
      height: 100,
      center: [50, 50],
    },
    show_description,
    toggle_metric
  );
  export let metric_metadata: any;
  export let data: tNode[];
  export let local_selected_metrics: string[] = $selected_metrics;
  let hovered_metric: string | undefined = undefined;

  onMount(() => {
    correlation_matrix.init();
  });

  $: if (metric_metadata.correlations)
    update_correlation_graph(metrics, metric_metadata.correlations);
  async function update_correlation_graph(selected_metrics, correlations) {
    await tick();
    correlation_matrix.update(selected_metrics, correlations);
  }

  feature_recommendations.subscribe((value) => {
    if (value) {
      const features = value.map((f) => f.feature_name);
      correlation_matrix.update_tag_disability(features);
      correlation_matrix.update_cell_disability(metrics, features);
      correlation_matrix.update_cells(metrics, metric_metadata.correlations);
      value.forEach((f) => {
        $feature_target_levels[f.feature_name] = f.level;
      });
    }
  });

  function show_description(metric, flag) {
    open.set(flag);
    hovered_metric = flag ? metric : undefined;
  }

  function toggle_metric(metric) {
    if (local_selected_metrics.includes(metric)) {
      local_selected_metrics = local_selected_metrics.filter(
        (m) => m !== metric
      );
    } else {
      local_selected_metrics = [...local_selected_metrics, metric];
    }
  }

  // setting up melt ui popover
  const {
    elements: { trigger, content, arrow },
    states: { open },
  } = createTooltip({
    forceVisible: true,
    positioning: {
      placement: "left-start",
      gutter: 0,
    },
    arrowSize: 8,
  });
</script>

<div class="flex flex-col h-full">
  <div class="view-header">Metric Selection</div>
  <div class="topc-section flex relative gap-x-2">
    <!-- <div
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
    </div> -->
    <div
      class="max-w-[15rem] min-h-[8rem] max-h-[9rem] p-1 w-min aspect-square"
      use:melt={$trigger}
    >
      <svg
        id={`metric-correlations-svg`}
        class="metric-correlations-svg h-full aspect-square overflow-visible"
      >
        <pattern
          id="diagonalHatch"
          patternUnits="userSpaceOnUse"
          width="4"
          height="4"
        >
          <path
            d="M-1,1 l2,-2
                 M0,4 l4,-4
                 M3,5 l2,-2"
            style="stroke:black; stroke-width:1"
          />
        </pattern>
      </svg>
    </div>
    <div class="flex flex-col gap-y-0.5 justify-between py-2">
      {#each metrics as metric, index}
        <div class="flex items-center gap-x-1 font-mono text-[0.55rem]">
          <span class="w-[4rem] text-left"> {metric} </span>
          <Select
            options={metric_categories[metric].map((c) => c.label)}
            tw_font_size="text-[0.55rem]"
            tw_font_family="font-mono"
            bind:selected_label={$feature_target_levels[metric]}
          />
        </div>
      {/each}
    </div>
    <div
      class="absolute bottom-1 right-1 text-xs flex flex-col items-center gap-x-1 gap-y-1"
    >
      <!-- todo: add info on what 'Apply' does -->
      <img
        src="info_icon.svg"
        alt="*"
        class="w-[1rem] h-[1rem] ml-auto right-0"
      />
      <button
        class="p-1 bg-green-100 border-green-200"
        on:click={() => selected_metrics.set(local_selected_metrics)}
        >Apply</button
      >
    </div>
    <!-- {#if hovered_metric}
      <div class="text-xs text-left ml-1 font-mono break-words">
        {@html feature_descriptions[hovered_metric]}
      </div>
    {/if} -->
  </div>
  <div class="flex w-full flex-1">
    <MetricRecommendation
      {data}
      {metric_metadata}
      on:highlight_recommendation={(e) =>
        dispatch("highlight_recommendation", e.detail)}
    ></MetricRecommendation>
  </div>
</div>
{#if $open && hovered_metric}
  <div
    use:melt={$content}
    class="shadow-sm"
    transition:fade={{ duration: 100 }}
  >
    <!-- <div class="border border-black !bg-amber-50" use:melt={$arrow} /> -->
    <div
      class="flex flex-col py-2 px-2 w-[20rem] h-fit rounded border border-gray-500 bg-amber-50 relative"
    >
      <p class="break-normal feature-description">
        {@html feature_descriptions[hovered_metric]}
      </p>
    </div>
    <!-- <div
      role="button"
      tabindex="0"
      use:melt={$close}
      class="absolute p-0.5 bottom-1 right-1 text-sm bg-green-100 hover:bg-green-200 outline outline-1 outline-gray-500 rounded"
    >
      Got it
    </div> -->
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
    & .axis-label-container {
      fill: #c0c0c0;
      stroke: black;
      stroke-width: 0.5;
      rx: 2%;
    }
    & .tag-mouseover {
      fill: #c0c0c0 !important;
    }
    & .tag-selected {
      fill: #c7f0a5;
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
