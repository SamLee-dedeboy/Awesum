import type { tStatBarData, tStatistics } from "./statistics"
import type { tPrompt } from "./prompt"
import type { tNode } from "./server"
export type tOptimization = {
    // summaries: String[]
    features: any[]
    nodes: tNode[]
    trajectories?: any[]
    prompt: tPrompt
    statistics: tStatBarData[]
}

export type tSelectedClusterData = {
    cluster_label: string,
    prompt_version: number,
    stats: tStatBarData[],
    cluster_nodes: tNode[]
}