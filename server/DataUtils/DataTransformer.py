class DataTransformer:
    def __init__(self) -> None:
        return
    
    def transform_article_data(self, articles):
        return list(map(
            lambda article: {
                'id': article['id'],
                'type': article['type'],
                'cluster_label': article['cluster_label'],
                'sub_cluster_label': article['sub_cluster_label'],
                'date': article['date'],
                # 'leaf_label': article['leaf_label'],
                # 'order': article['order'],
                'sfc_order': article['sfc_order'],
                'cluster_order': article['cluster_order'],
                'update_cluster_order': article['update_cluster_order'],
            }, articles))

    def transform_entity_data(self, entities):
        return list(map(
            lambda entity: {
                'id': entity['id'],
                'title': entity['title'],
                'entity_type': entity['entity_type'],
                'type': entity['type'],
                'mentions': entity['mentions'],
                'cluster_label': entity['cluster_label'],
                'sub_cluster_label': entity['sub_cluster_label'],
                # 'leaf_label': article['leaf_label'],
                # 'order': entity['order'],
                'sfc_order': entity['sfc_order'],
                'cluster_order': entity['cluster_order'],
                'update_cluster_order': entity['update_cluster_order'],
            }, entities))