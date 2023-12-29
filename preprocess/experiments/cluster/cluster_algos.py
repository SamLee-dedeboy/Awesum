import numpy as np
from scipy import spatial
from scipy.sparse import csr_matrix
from collections import defaultdict
from itertools import combinations
import math
import copy
from .hierarchies import get_level_transition, add_dummy_hierarchy
from .partitions import levels_to_partitions, add_dummy_partition

def distance_matrix(node_ids, embedding_dict):
    embeddings = np.array([embedding_dict[v] for v in node_ids])
    return spatial.distance.cdist(embeddings, embeddings, metric='cosine')

def ravasz_cluster(node_ids, embedding_dict):
    index_to_id_dict = {index: node_id for index, node_id in enumerate(node_ids)}
    id_to_index_dict = { node_id: index for index, node_id in enumerate(node_ids)}
    index_embedding_dict = { id_to_index_dict[node_id]: embedding for node_id, embedding in embedding_dict.items()}
    node_indices = list(index_to_id_dict.keys())
    levels = ravasz(node_indices, index_embedding_dict)
    partitions, renumbered_levels = levels_to_partitions(node_indices, copy.deepcopy(levels), index_to_id_dict)
    partitions = add_dummy_partition(partitions)
    hierarchies = get_level_transition(renumbered_levels)
    hierarchies = add_dummy_hierarchy(partitions, hierarchies)
    return partitions, hierarchies

def ravasz(node_indices, embedding_dict):
    def partition(node_indices):
        P = {}
        for v in node_indices:
            P[v] = v
        return P 
    def similarity(node_indices, D):
        SS = 1 - D
        for i in range(len(node_indices)):
            SS[i][i] = -math.inf
        return SS

    def reverse_index(P):
        comms = defaultdict(list)
        for v, comm in P.items():
            comms[comm].append(v)
        renumber_dict = {}
        for index, comm in enumerate(list(comms.keys())):
            renumber_dict[comm] = index
        renumbered_comms_dict = {
            renumber_dict[comm]: vertices for comm, vertices in comms.items()
        }
        return renumbered_comms_dict

    def cluster_embedding(embedding_dict, comms):
        new_embedding_dict = {}
        for comm, nodes in comms.items():
            avg_embedding = np.mean(np.array([embedding_dict[v] for v in nodes]), axis=0)
            new_embedding_dict[comm] = avg_embedding
        return new_embedding_dict

    levels = []
    P = partition(node_indices)
    comms_dict = reverse_index(P)
    ori_graph_partition = P
    levels = defaultdict(list)
    level = 0
    for v in node_indices:
        levels[v].append(P[v])
    D = distance_matrix(node_indices, embedding_dict)
    while(True):
        # init level slot
        for v, cur_levels in levels.items():
            cur_levels.append(None)
        print("clustering begin")
        print("initial nodes:", len(node_indices))
        print("calculating similarity matrix")
        similarity_matrix = similarity(node_indices, D)

        print("calculating reverse index of G")
        ori_graph_comms_dict = reverse_index(ori_graph_partition)
        most_similar_nodes = set()
        # for v in G.vs:
        for v in node_indices:
            print("finding most similar node")
            most_similar_node = max(range(len(similarity_matrix[v])), key=similarity_matrix[v].__getitem__)

            print("moving node: ", v, " from comm: ", P[v], " to comm: ", P[most_similar_node])
            most_similar_nodes.add(P[most_similar_node])
            print(len(ori_graph_comms_dict), len(ori_graph_partition))
            P[v] = P[most_similar_node]
        for v, c in P.items():
            for node in ori_graph_comms_dict[v]:
                ori_graph_partition[node] = c
                levels[node][level] = c
        ori_graph_comms_dict = reverse_index(ori_graph_partition)
        print("most similar nodes: ", len(most_similar_nodes), len(ori_graph_comms_dict))

        level += 1
        print("one iteration done")
        comms_dict = reverse_index(P)
        print("total nodes in comms:", sum([len(x) for x in ori_graph_comms_dict.values()]))
        comm_node_ids = list(comms_dict.keys())
        print("clusters: ", len(comm_node_ids))
        # preserve the hierarchy
        embedding_dict = cluster_embedding(embedding_dict, comms_dict)
        # construct new distances between clusters
        D = distance_matrix(comm_node_ids, embedding_dict)
        P = partition(comm_node_ids)
        # assign the result to operate recursively
        if len(node_indices) == len(comm_node_ids): break
        node_indices = comm_node_ids
        print("pass done. ")
    return levels
