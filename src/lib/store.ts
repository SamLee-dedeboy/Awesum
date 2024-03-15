import { writable} from "svelte/store";
import type {  Writable } from "svelte/store";
import { metrics} from "lib/constants/Metrics"
import type {tNode, tMetricRecommendationResponse} from "lib/types"
export let selected_cluster: Writable<any> = writable(null);
export let selected_metrics: Writable<string[]> = writable(metrics)
export let target_ranges: Writable<{[key:string]:[number|undefined, number|undefined]}> = writable(metrics.reduce((res, metric) => { res[metric] = [undefined, undefined]; return res}, {}))
export let default_ranges: Writable<{[key:string]:[number, number]}> = writable(metrics.reduce((res, metric) => { res[metric] = [0, 100]; return res}, {}))
export let cluster_mode: Writable<string> = writable("cluster")
export let test_set: Writable<tNode[]> = writable([])
export let data: Writable<tNode[]> = writable([])
export let whole_test_set: Writable<tNode[]> = writable([])
export let cluster_size: Writable<{[key:string]:number}> = writable({})
export let recommended_nodes: Writable<tNode[]|undefined> = writable(undefined)
export let feature_recommendations: Writable<tMetricRecommendationResponse[] | undefined> = writable(undefined)
export let feature_target_levels: Writable<{[key:string]:string|null}> = writable({})
export let example_nodes: Writable<tNode[]> = writable([])
export let selected_topic: Writable<string | undefined> = writable(undefined);
export let executing_prompt: Writable<boolean> = writable(false);
export let executing_test: Writable<boolean> = writable(false);
export let goal: Writable<string | undefined> = writable(undefined);

export function inAllRange(
    features: { [key: string]: number },
    ranges: { [key: string]: [number | undefined, number | undefined] },
    enabled_features: string[] = metrics
  ) {
    if (
      Object.values(ranges).every(
        ([min, max]) => min === undefined && max === undefined
      )
    )
      return false;
    let inRange = true;
    Object.entries(ranges).forEach(([metric, range]) => {
      if (range[0] === undefined || range[1] === undefined) return;
      if(!enabled_features.includes(metric)) return
      if(!inRange) return
      const value = parseFloat(features[metric].toFixed(2));
      if (value < range[0] || value > range[1]) inRange = false;
    });
    return inRange;
  }