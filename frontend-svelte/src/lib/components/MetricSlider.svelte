<script lang="ts">
  import { metric_steps } from "lib/constants";
  import {
    target_ranges,
    recommended_nodes,
    inAllRange,
    feature_target_levels,
  } from "lib/store";
  import type { tNode } from "lib/types";
  export let metric: string;
  export let data: tNode[];
  export let start_value: number = 0;
  export let end_value: number = 100;
  import { createSlider, melt } from "@melt-ui/svelte";
  const {
    elements: { root, range, thumbs },
    states: { value },
  } = createSlider({
    defaultValue: [start_value, end_value],
    min: start_value,
    max: end_value,
    step: metric_steps[metric],
  });
  target_ranges.subscribe((v) => {
    if (
      v[metric] &&
      (v[metric][0] !== $value[0] || v[metric][1] !== $value[1])
    ) {
      value.set([v[metric][0]!, v[metric][1]!]);
    }
  });
  let first_time = true;
  value.subscribe((v) => {
    if (first_time) {
      first_time = false;
      return;
    }
    if ($feature_target_levels[metric] === null) return;
    if (
      $target_ranges[metric][0] !== v[0] ||
      $target_ranges[metric][1] !== v[1]
    )
      $target_ranges[metric] = [v[0], v[1]];
    const enabled_features = Object.keys($feature_target_levels).filter(
      (k) => $feature_target_levels[k] !== null
    );
    const in_range_nodes = data?.filter(
      (d) => inAllRange(d.features, $target_ranges, enabled_features),
      Object.keys($feature_target_levels).filter(
        (k) => $feature_target_levels[k] !== null
      )
    );
    recommended_nodes.set(in_range_nodes);
  });
</script>

<div class="w-full h-full px-0.5">
  <span use:melt={$root} class="relative flex h-full w-full items-center">
    <span class="h-[3px] w-full bg-white">
      <span use:melt={$range} class="h-[3px] bg-black" />
    </span>

    {#each $thumbs as thumb}
      <span
        use:melt={thumb}
        class="h-5 w-1 cursor-col-resize bg-gray-500 focus:ring-0 focus:!ring-black/40"
      />
    {/each}
  </span>
</div>
