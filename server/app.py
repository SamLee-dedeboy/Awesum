import glob
from flask import Flask, request
from flask_cors import CORS
import json
from DataUtils import DocumentController
from functools import cmp_to_key
from collections import defaultdict

app = Flask(__name__)
CORS(app)
openai_api_key = open("api_key").read()
# document_controller = DocumentController(r'../data/result/chunk_embeddings/1103/all_chunks.json', openai_api_key)
def reverse_index(base_dict):
    res = defaultdict(list)
    for key, value in base_dict.items():
        res[value].append(key)
    return res

def processData(type):
    partitions = json.load(open(f'../preprocess/data/{type}/{type}_partitions.json'))
    partition_clusters = [reverse_index(partition) for partition in partitions]
    return partitions, partition_clusters

full_partitions, full_partition_clusters = processData(type='full')
summary_partitions, summary_partition_clusters = processData(type='summary')
    
def organize_data(partition_clusters, partitions, level, coordinates):
    clusters = partition_clusters[level]
    partition = partitions[level]
    nodes = {}
    for node, cluster in partition.items():
        nodes[node] = {
            'id': node,
            'topic': cluster,
            'coordinate': coordinates[node]
        }
    return nodes, clusters

@app.route("/data/", methods=['POST'])
def get_data():
    full_level = request.json['full_level']
    summary_level = request.json['summary_level']
    full_node_coordinates = json.load(open('../preprocess/data/full/node_coordinates.json'))
    summary_node_coordinates = json.load(open('../preprocess/data/summary/node_coordinates.json'))
    full_nodes, full_clusters = organize_data(full_partition_clusters, full_partitions, full_level, full_node_coordinates)
    summary_nodes, summary_clusters = organize_data(summary_partition_clusters, summary_partitions, summary_level, summary_node_coordinates)
    print("get_data")
    res = {
        'full': {
            'links': [],
            'nodes': full_nodes,
            'clusters': full_clusters
        },
        'summary': {
            'links': [],
            'nodes': summary_nodes,
            'clusters': summary_clusters
        }
    }
    return json.dumps(res, default=vars)

@app.route("/search/", methods=['POST'])
def search():
    query = request.json['query']
    type = request.json['type']
    doc_id_relevance = document_controller.search(query=query)
    if type == 'chunk':
        chunk_id_relevances = [("_".join(doc[0].split("_")[:3]), doc[1]) for doc in doc_id_relevance]
        existing_chunk_id = []
        cleaned_chunk_id_relevances = []
        for chunk_id_relevance in chunk_id_relevances:
            if chunk_id_relevance[0] not in existing_chunk_id:
                existing_chunk_id.append(chunk_id_relevance[0])
                cleaned_chunk_id_relevances.append(chunk_id_relevance)
            else:
                continue
        doc_id_relevance = cleaned_chunk_id_relevances
    return json.dumps(doc_id_relevance)

