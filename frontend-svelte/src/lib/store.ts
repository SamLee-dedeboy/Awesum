import { writable, get } from "svelte/store";
import type {  Writable } from "svelte/store";
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
// recommended_nodes.subscribe((value) => {
//     if(value !== undefined) {
//         const recommended_node_ides = value.map(node => node.id)
//         console.log("update test set", recommended_node_ides, get(test_set).length, get(test_set).filter(test_case => !recommended_node_ides.includes(test_case.id)).length)
//         test_set.set(get(test_set).filter(test_case => !recommended_node_ides.includes(test_case.id)))
//     }
// })
export let feature_recommendations: Writable<tMetricRecommendationResponse[] | undefined> = writable(undefined)
export let feature_target_levels: Writable<{[key:string]:string}> = writable({})
export let example_nodes: Writable<tNode[]> = writable([])
export let selected_topic: Writable<string | undefined> = writable(undefined);
export let goal: Writable<string | undefined> = writable(undefined);