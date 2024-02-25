import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import {metrics} from "lib/constants/Metrics"
import type {tNode} from "lib/types"
export let selected_cluster: Writable<any> = writable(null);
export let selected_metrics: Writable<string[]> = writable(metrics)
export let target_range: Writable<any> = writable(null)
export let cluster_mode: Writable<string> = writable("cluster")
export let test_set: Writable<tNode[]> = writable([])