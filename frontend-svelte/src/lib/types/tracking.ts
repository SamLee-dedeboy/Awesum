import type { tStatBarData } from "./statistics"
import type { tMessage } from "./prompt"
import type { tNode } from "./server"
export type tClusterOptimization = {
    // summaries: String[]
    features: any[]
    cluster_nodes: tNode[]
    prompts: tMessage[]
    statistics: tStatBarData[]
}

export type tSelectedClusterData = {
    cluster_label: string,
    prompt_version: number,
    stats: tStatBarData[],
    cluster_nodes: tNode[]
}