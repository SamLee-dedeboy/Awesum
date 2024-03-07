import type { tStatistics } from ".";

export type tDataset = {
    dataset: tNode[];
    metric_data: any;
    cluster_labels: string[];
    statistics: tStatistics;
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
}