import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
export let selected_cluster: Writable<any> = writable(null);