import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import {metrics} from "lib/constants/Metrics"
import type {tNode, tMetricRecommendationResponse} from "lib/types"
export let selected_cluster: Writable<any> = writable(null);
export let selected_metrics: Writable<string[]> = writable(metrics)
export let target_ranges: Writable<{[key:string]:[number|undefined, number|undefined]}> = writable(metrics.reduce((res, metric) => { res[metric] = [undefined, undefined]; return res}, {}))
export let target_range_metric: Writable<string> = writable(metrics[0])
export let cluster_mode: Writable<string> = writable("cluster")
export let test_set: Writable<tNode[]> = writable([])
// export let recommended_cluster: Writable<string | undefined> = writable(undefined)
export let recommended_nodes: Writable<tNode[]|undefined> = writable(undefined)
export let feature_recommendations: Writable<tMetricRecommendationResponse[] | undefined> = writable(undefined)
export let feature_target_levels: Writable<{[key:string]:string}> = writable({})
export let example_nodes: Writable<tNode[]> = writable([])