from .EventHGraph import EventHGraph
from collections import defaultdict
class GraphController:
    def __init__(self, data_path) -> None:
        self.data_path = data_path
        self.static_event_hgraph = EventHGraph(data_path)
        self.user_hgraphs = defaultdict(lambda: EventHGraph(data_path))

    def getUserHGraph(self, uid):
        if uid not in self.user_hgraphs:
            print("creating user hgraph")
            return self.create_user_hgraph(uid)
        else:
            return self.user_hgraphs[uid]

    def create_user_hgraph(self, uid):
        self.user_hgraphs[uid] = EventHGraph(self.data_path)
        return self.user_hgraphs[uid]
    
    def load_user_hgraph(self, user_hgraph_dict):
        article_dict = self.static_event_hgraph.article_dict
        entity_dict = self.static_event_hgraph.entity_dict
        user_hgraph = EventHGraph(data_path=None, init=False)
        # articles
        user_hgraph.article_hierarchical_topics = self.static_event_hgraph.article_hierarchical_topics
        user_hgraph.article_nodes = [article_dict[node_id] for node_id in user_hgraph_dict['article_nodes']]
        user_hgraph.article_dict = {node['id']: node for node in user_hgraph.article_nodes}

        # entities
        user_hgraph.entity_nodes = [entity_dict[node_id] for node_id in user_hgraph_dict['entity_nodes']]
        user_hgraph.entity_dict = {node['id']: node for node in user_hgraph.entity_nodes}
        user_hgraph.entity_hierarchical_topics = self.static_event_hgraph.entity_hierarchical_topics
        
        # links
        user_hgraph.links = user_hgraph_dict['links']
        user_hgraph.entity_links = user_hgraph_dict['links']

        # flags
        user_hgraph.filtered = user_hgraph_dict['filtered']

        # hierarchy
        user_hgraph.hierarchy_article = self.static_event_hgraph.hierarchy_article
        user_hgraph.hierarchy_entity = self.static_event_hgraph.hierarchy_entity
        user_hgraph.hierarchy_flattened_article = self.static_event_hgraph.hierarchy_flattened_article
        user_hgraph.hierarchy_flattened_entity  = self.static_event_hgraph.hierarchy_flattened_entity

        # partitions
        user_hgraph.partitions_article = self.static_event_hgraph.partitions_article
        user_hgraph.partitions_entity = self.static_event_hgraph.partitions_entity
        return user_hgraph

