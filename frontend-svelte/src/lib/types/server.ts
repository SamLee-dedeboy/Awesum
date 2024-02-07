export type tDataset = {
    dataset: tNode[];
    metric_data: any;
    cluster_labels: string[];
    statistics: any;
  };

export type tNode = {
    id: string,
    cluster: string
    coordinates: [number, number]
    features: number[]
    summary: string
    text: string
}