export type tDataset = {
    dataset: tNode[];
    metric_data: any;
    cluster_labels: string[];
    statistics: any;
    metric_metadata: {
      correlations: any[],
      descriptions: any
    }
  };

export type tNode = {
    id: string,
    cluster: string
    coordinates: [number, number]
    features: {[key: string]: number}
    summary: string
    text: string
}