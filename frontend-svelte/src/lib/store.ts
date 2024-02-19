import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import {metrics} from "lib/constants/Metrics"
export let selected_cluster: Writable<any> = writable(null);
export let selected_metrics: Writable<string[]> = writable(metrics)