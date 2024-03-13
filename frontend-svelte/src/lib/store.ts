import { writable, get, derived } from "svelte/store";
import type {  Writable } from "svelte/store";
import {metric_categories, metrics} from "lib/constants/Metrics"
import type {tNode, tMetricRecommendationResponse} from "lib/types"
export let selected_cluster: Writable<any> = writable(null);
export let selected_metrics: Writable<string[]> = writable(metrics)
export let target_ranges: Writable<{[key:string]:[number|undefined, number|undefined]}> = writable(metrics.reduce((res, metric) => { res[metric] = [undefined, undefined]; return res}, {}))
export let default_ranges: Writable<{[key:string]:[number, number]}> = writable(metrics.reduce((res, metric) => { res[metric] = [0, 100]; return res}, {}))
// export let target_range_metric: Writable<string> = writable(metrics[0])
export let cluster_mode: Writable<string> = writable("cluster")
export let test_set: Writable<tNode[]> = writable([])
export let data: Writable<tNode[]> = writable([])
// export let recommended_cluster: Writable<string | undefined> = writable(undefined)
export let recommended_nodes: Writable<tNode[]|undefined> = writable(undefined)
// recommended_nodes.subscribe((value) => {
//     if(value !== undefined) {
//         const recommended_node_ides = value.map(node => node.id)
//         console.log("update test set", recommended_node_ides, get(test_set).length, get(test_set).filter(test_case => !recommended_node_ides.includes(test_case.id)).length)
//         test_set.set(get(test_set).filter(test_case => !recommended_node_ides.includes(test_case.id)))
//     }
// })
export let feature_recommendations: Writable<tMetricRecommendationResponse[] | undefined> = writable(undefined)
export let feature_target_levels: Writable<{[key:string]:string|null}> = writable({})
// feature_target_levels.subscribe((value) => {
//     if(value) {
//         Object.entries(value).forEach(([metric, level]) => {
//             if(level === null) return
//             const target_range = get(target_ranges)[metric]
//             const default_range = get(default_ranges)[metric]
//             console.log(target_range, default_range)
//             if(target_range[0] === default_range[0] && target_range[1] === default_range[1]) {
//                 const range = metric_categories[metric].find(range => range.label === level)
//                 if(range === undefined) return
//                 let old_ranges = get(target_ranges)
//                 old_ranges[metric] = [range.start, range.end]
//                 target_ranges.set(old_ranges)
//                 const in_range_nodes = get(data).filter(
//                     (d) => d.cluster !== "-1" && inAllRange(d.features, get(target_ranges))
//                 );
//                 recommended_nodes.set(in_range_nodes);
//             }
//         })
//     }
// })
export let example_nodes: Writable<tNode[]> = writable([])
export let selected_topic: Writable<string | undefined> = writable(undefined);
export let executing_prompt: Writable<boolean> = writable(false);
export let goal: Writable<string | undefined> = writable(undefined);

export function inAllRange(
    features: { [key: string]: number },
    ranges: { [key: string]: [number | undefined, number | undefined] },
    enabled_features: string[] = metrics
  ) {
    // console.log(enabled_features, ranges)
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