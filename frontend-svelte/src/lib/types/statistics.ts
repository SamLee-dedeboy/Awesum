export type tStatBarData = {
    mean: number
    min: number
    max: number
    std?: number
}
export  type tStatistics = {
    metric_statistics: {[key:string]: tStatBarData[]}
    cluster_statistics: {[key:string]: tStatBarData[]}
    global_means: number[]
    global_mins: number[]
    global_maxes: number[]
  }