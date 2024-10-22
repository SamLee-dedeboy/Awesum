import type { tStatBarData, tStatistics } from ".";

export type tDataset = {
    dataset: tNode[];
    whole_test_set: tNode[];
    metric_data: any;
    cluster_labels: string[];
    global_statistics: tStatistics;
    statistics: tStatBarData[];
    metric_metadata: tMetricMetadata 
    centroids? : {[key:string]: tNode[]};
  };

export type tMetricMetadata = {
    correlations: any[],
    descriptions: any
}
export type tNode = {
    id: string,
    cluster: string
    coordinates: [number, number]
    features: {[key: string]: number}
    summary: string
    text: string
    test_case?: boolean
    topic: string
    // intra_cluster_distance?: number
}