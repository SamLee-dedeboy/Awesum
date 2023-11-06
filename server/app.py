from flask import Flask, request
from flask_cors import CORS
import json
import openai
from pprint import pprint
from DataUtils import GraphController, EventHGraph, DataTransformer, Utils, ArticleController, GptUtils, pHilbert, gosper
from collections import defaultdict

app = Flask(__name__)
CORS(app)
openai_api_key = open("openai_api_key").read()

dataset = 'full'
# dataset = 'VisPub'
graph_controller = GraphController(r'../preprocess/data/'.format(dataset))
event_hgraph = graph_controller.static_event_hgraph
article_controller = ArticleController(r'../preprocess/data/'.format(dataset), openai_api_key)
data_transformer = DataTransformer()
# example = json.load(open(r'../preprocess/data/result/AllTheNews/cluster_summary/example_article.json'))

# global vars
users = [0]
for uid in users:
    graph_controller.create_user_hgraph(uid)

gosper_curve_points = gosper.plot_level(5)
philbert_curve_points = pHilbert.peripheral_hilbert(128, 20)
print("init done")

@app.route("/user/hgraph/", methods=["POST"])
def get_article_partition():
    # uid = int(uid)
    uid = 0
    article_level = request.json['article_level']
    # get candidate entity nodes
    user_hgraph = graph_controller.getUserHGraph(uid)
    # reset filtering
    # user_hgraph.resetFiltering()

    ### article
    # clusters and sub clusters
    clusters = user_hgraph.binPartitions(article_level, cluster_type='article')
    clusters = user_hgraph.adjustClusterLevel(clusters, cluster_type='article')
    sub_clusters, cluster_children_dict = user_hgraph.getSubClusters(clusters.keys(), cluster_type='article', isList=True)
    # sub_clusters = user_hgraph.binPartitions(article_level - 1, cluster_type="article") if int(article_level) > 0 else None

    # generate cluster labels and orders
    clusters, article_node_dict, cluster_order, update_cluster_order = Utils.addClusterLabelAndOrder(user_hgraph.article_dict, clusters, sub_clusters, gosper_curve_points)    

    # return result
    hgraph = {
        "article_graph": {
            "article_nodes": data_transformer.transform_article_data(article_node_dict.values()),
            "clusters": clusters,
            "cluster_children": cluster_children_dict,
            "sub_clusters": sub_clusters,
            "cluster_order": cluster_order,
            "update_cluster_order": update_cluster_order,   
            "hierarchical_topics": user_hgraph.article_hierarchical_topics,
        },
        "user_hgraph": user_hgraph.save_states()
    }
    return json.dumps(hgraph, default=vars)

@app.route("/user/filter/", methods=["POST"])
def filter_hgraph():
    # uid = int(uid)
    article_node_ids = request.json['article_ids']
    clusters = request.json['clusters']
    entity_clusters = request.json['entity_clusters']
    user_hgraph = graph_controller.load_user_hgraph(request.json['user_hgraph'])
    # user_hgraph = graph_controller.getUserHGraph(uid)

    # article
    # filter clusters
    clusters = Utils.filterClusters(clusters, article_node_ids)
    clusters = user_hgraph.adjustClusterLevel(clusters, cluster_type='article')
    # filter sub clusters
    sub_clusters, cluster_children_dict = user_hgraph.getSubClusters(clusters.keys(), cluster_type='article', isList=True)
    sub_clusters = Utils.filterClusters(sub_clusters, article_node_ids)
    cluster_children_dict = Utils.filterClusterChildren(cluster_children_dict, sub_clusters)

    # filter article and entity nodes and links at the same time
    # this changes the state of the user hgraph
    user_hgraph.filter_article_nodes(article_node_ids)
    clusters, article_node_dict, cluster_order, update_cluster_order = Utils.addClusterLabelAndOrder(user_hgraph.article_dict, clusters, sub_clusters, gosper_curve_points)    

    # entity
    entity_node_ids = [node['id'] for node in user_hgraph.entity_nodes]
    # filter clusters
    entity_clusters = Utils.filterClusters(entity_clusters, entity_node_ids)
    # entity_clusters = user_hgraph.adjustClusterLevel(entity_clusters, cluster_type='entity')
    # filter sub clusters
    entity_sub_clusters, entity_cluster_children_dict = user_hgraph.getSubClusters(entity_clusters.keys(), cluster_type='entity', isList=True)
    entity_sub_clusters = Utils.filterClusters(entity_sub_clusters, entity_node_ids)
    entity_cluster_children_dict = Utils.filterClusterChildren(entity_cluster_children_dict, entity_sub_clusters)

    entity_clusters, entity_node_dict, entity_cluster_order, entity_update_cluster_order = Utils.addClusterLabelAndOrder(user_hgraph.entity_dict, entity_clusters, entity_sub_clusters, philbert_curve_points)

    # article_cluster_links = Utils.getArticleClusterLinks(user_hgraph.entity_links, entity_node_dict, article_node_dict)
    cluster_entity_inner_links = Utils.getClusterEntityInnerLinks(article_node_dict)

    # return result
    hgraph = {
        "article_graph": {
            "article_nodes": data_transformer.transform_article_data(article_node_dict.values()),
            "clusters": clusters,
            "cluster_children": cluster_children_dict,
            "sub_clusters": sub_clusters,
            "cluster_order": cluster_order,
            "update_cluster_order": update_cluster_order,   
            "hierarchical_topics": user_hgraph.article_hierarchical_topics,
            # "article_cluster_links": article_cluster_links,
            "cluster_entity_inner_links": cluster_entity_inner_links,
            "filtered": True,
        },
        "entity_graph": {
            "entity_nodes": data_transformer.transform_entity_data(entity_node_dict.values()),
            "entity_clusters":  entity_clusters,
            "entity_cluster_children": entity_cluster_children_dict,
            "entity_sub_clusters": entity_sub_clusters,
            "entity_cluster_order": entity_cluster_order,
            "entity_update_cluster_order": entity_update_cluster_order,
            "entity_hierarchical_topics": user_hgraph.entity_hierarchical_topics,
            "filtered": True,
        },
        "user_hgraph": user_hgraph.save_states()
    }
    return json.dumps(hgraph, default=vars)

@app.route("/user/expand_cluster/article/", methods=["POST"])
def expand_article_cluster():
    def check_clusters(clusters, correct_volume):
        check = 0
        for nodes in clusters.values():
            check += len(nodes)
        print(check == correct_volume)
    # uid = int(uid)
    # retain original setups
    cluster_label = request.json['cluster_label']
    clusters = request.json['clusters']
    print("loading user hgraph")
    user_hgraph = graph_controller.load_user_hgraph(request.json['user_hgraph'])
    print("loading done")
    article_node_ids = list(map(lambda node: node['id'], user_hgraph.article_nodes)) 
    check_clusters(clusters, len(article_node_ids))
    # user_hgraph = graph_controller.getUserHGraph(uid)
    sub_clusters, cluster_children_dict = user_hgraph.getSubClusters(clusters.keys(), cluster_type='article', isList=True)
    sub_clusters = Utils.filterClusters(sub_clusters, article_node_ids)
    cluster_children_dict = Utils.filterClusterChildren(cluster_children_dict, sub_clusters)
    check_clusters(sub_clusters, len(article_node_ids))
    ###############
    # expand cluster
    # generate sub clusters of targeted cluster
    targeted_sub_clusters, _ = user_hgraph.getSubClusters(cluster_label, cluster_type='article')
    targeted_sub_clusters = Utils.filterClusters(targeted_sub_clusters, article_node_ids)
    # replace the targeted cluster with targeted_sub_clusters
    del clusters[cluster_label]
    del cluster_children_dict[cluster_label]
    for targeted_sub_cluster_label, targeted_sub_cluster_node_ids in targeted_sub_clusters.items():
        clusters[targeted_sub_cluster_label] = targeted_sub_cluster_node_ids
    check_clusters(clusters, len(article_node_ids))
    # generate sub-clusters of sub_clusters
    # filter out targeted sub-sub-clusters
    targeted_sub_sub_clusters, targeted_sub_cluster_children_dict = user_hgraph.getSubClusters(targeted_sub_clusters.keys(), cluster_type='article', isList=True)
    targeted_sub_sub_clusters = Utils.filterClusters(targeted_sub_sub_clusters, article_node_ids)
    targeted_sub_cluster_children_dict = Utils.filterClusterChildren(targeted_sub_cluster_children_dict, targeted_sub_sub_clusters)
    for sub_cluster_label, children_labels in targeted_sub_cluster_children_dict.items():
        cluster_children_dict[sub_cluster_label] = children_labels
    # replace the sub-clusters of targeted cluster with its sub-sub-clusters
    for targeted_sub_cluster_key in targeted_sub_clusters.keys():
        del sub_clusters[targeted_sub_cluster_key]
    for sub_sub_cluster_label, sub_sub_cluster_node_ids in targeted_sub_sub_clusters.items():
        sub_clusters[sub_sub_cluster_label] = sub_sub_cluster_node_ids
    print("--------- expansion done. ----------")
    check_clusters(sub_clusters, len(article_node_ids))
    ###############
    ###############
    # post-process
    # # add cluster label to article nodes
    # article_node_dict = Utils.addClusterLabel(user_hgraph.article_dict, clusters, sub_clusters)

    # # generate cluster order
    # cluster_order = Utils.generateClusterOrder(user_hgraph.article_nodes)
    # update_cluster_order = Utils.generateUpdateClusterOrder(cluster_order, targeted_sub_clusters.keys())
    # # add cluster order to article nodes
    # article_node_dict = Utils.addClusterOrder(clusters, cluster_order, update_cluster_order, article_node_dict)
    expanded_cluster = {}
    expanded_cluster['parent'] = cluster_label
    expanded_cluster['sub_clusters'] = list(targeted_sub_clusters.keys())
    # article
    clusters, article_node_dict, cluster_order, update_cluster_order = Utils.addClusterLabelAndOrder(user_hgraph.article_dict, clusters, sub_clusters, gosper_curve_points, expanded_cluster)
    print("--------- article nodes post-process done. ----------")

    # # entity
    # entity_level = 3
    # entity_clusters = user_hgraph.binPartitions(entity_level, type='entity')
    # entity_sub_clusters = user_hgraph.binPartitions(entity_level - 1, type="entity") if int(entity_level) > 0 else None
    # entity_clusters, entity_node_dict, entity_cluster_order, entity_update_cluster_order = Utils.addClusterLabelAndOrder(user_hgraph.entity_dict, entity_clusters, entity_sub_clusters, philbert_curve_points)
    # print("--------- entity nodes post-process done. ----------")

    # link entities to clusters
    # article_cluster_links = Utils.getArticleClusterLinks(user_hgraph.entity_links, user_hgraph.entity_dict, article_node_dict)
    cluster_entity_inner_links = Utils.getClusterEntityInnerLinks(article_node_dict)
    print("--------- Entity links extraction done. ----------")

    # return result
    article_graph = {
        "links": user_hgraph.entity_links,
        "article_nodes": data_transformer.transform_article_data(article_node_dict.values()),
        "clusters": clusters,
        "cluster_children": cluster_children_dict,
        "sub_clusters": sub_clusters,
        "cluster_order": cluster_order,
        "update_cluster_order": update_cluster_order,   
        "hierarchical_topics": user_hgraph.article_hierarchical_topics,
        # "article_cluster_links": article_cluster_links,
        "cluster_entity_inner_links": cluster_entity_inner_links,
    }
    res = {
        "article_graph": article_graph,
        "user_hgraph": user_hgraph.save_states()
    }
    return json.dumps(res, default=vars)

@app.route("/user/expand_cluster/entity/", methods=["POST"])
def expand_entity_cluster():
    # uid = int(uid)
    # retain original setups
    cluster_label = request.json['cluster_label']
    entity_clusters = request.json['clusters']
    user_hgraph = graph_controller.load_user_hgraph(request.json['user_hgraph'])
    entity_node_ids = list(map(lambda node: node['id'], user_hgraph.entity_nodes)) 
    # user_hgraph = graph_controller.getUserHGraph(uid)
    entity_sub_clusters, entity_cluster_children_dict = user_hgraph.getSubClusters(entity_clusters.keys(), isList=True, cluster_type='entity')
    entity_sub_clusters = Utils.filterClusters(entity_sub_clusters, entity_node_ids)
    ###############
    # expand cluster
    # generate sub clusters of targeted cluster
    targeted_sub_clusters, _ = user_hgraph.getSubClusters(cluster_label, cluster_type='entity')
    targeted_sub_clusters = Utils.filterClusters(targeted_sub_clusters, entity_node_ids)
    # replace the targeted cluster with targeted_sub_clusters
    del entity_clusters[cluster_label]
    del entity_cluster_children_dict[cluster_label]
    for targeted_sub_cluster_label, targeted_sub_cluster_node_ids in targeted_sub_clusters.items():
        entity_clusters[targeted_sub_cluster_label] = targeted_sub_cluster_node_ids
    # generate sub-clusters of sub_clusters
    # filter out targeted sub-sub-clusters
    targeted_sub_sub_clusters, targeted_sub_cluster_children_dict = user_hgraph.getSubClusters(targeted_sub_clusters.keys(), isList=True, cluster_type='entity')
    targeted_sub_sub_clusters = Utils.filterClusters(targeted_sub_sub_clusters, entity_node_ids)
    for sub_cluster_label, children_labels in targeted_sub_cluster_children_dict.items():
        entity_cluster_children_dict[sub_cluster_label] = children_labels
    # replace the sub-clusters of targeted cluster with its sub-sub-clusters
    for targeted_sub_cluster_key in targeted_sub_clusters.keys():
        del entity_sub_clusters[targeted_sub_cluster_key]
    for sub_sub_cluster_label, sub_sub_cluster_node_ids in targeted_sub_sub_clusters.items():
        entity_sub_clusters[sub_sub_cluster_label] = sub_sub_cluster_node_ids
    print("--------- expansion done. ----------")
    ###############
    ###############
    # post-process
    # # add cluster label to article nodes
    # article_node_dict = Utils.addClusterLabel(user_hgraph.article_dict, clusters, sub_clusters)

    # # generate cluster order
    # cluster_order = Utils.generateClusterOrder(user_hgraph.article_nodes)
    # update_cluster_order = Utils.generateUpdateClusterOrder(cluster_order, targeted_sub_clusters.keys())
    # # add cluster order to article nodes
    # article_node_dict = Utils.addClusterOrder(clusters, cluster_order, update_cluster_order, article_node_dict)
    expanded_cluster = {}
    expanded_cluster['parent'] = cluster_label
    expanded_cluster['sub_clusters'] = list(targeted_sub_clusters.keys())
    # article
    print("--------- article nodes post-process done. ----------")
    # entity
    entity_clusters, entity_node_dict, entity_cluster_order, entity_update_cluster_order = Utils.addClusterLabelAndOrder(user_hgraph.entity_dict, entity_clusters, entity_sub_clusters, philbert_curve_points, expanded_cluster)
    print("--------- entity nodes post-process done. ----------")

    # link entities to clusters
    # article_cluster_entities = Utils.getArticleClusterEntities(user_hgraph.entity_links, entity_node_dict, user_hgraph.article_dict)
    print("--------- Entity links extraction done. ----------")

    # return result
    hgraph = {
        # entities
        "entity_nodes": data_transformer.transform_entity_data(entity_node_dict.values()),
        "entity_clusters":  entity_clusters,
        "entity_cluster_children": entity_cluster_children_dict,
        "entity_sub_clusters": entity_sub_clusters,
        "entity_cluster_order": entity_cluster_order,
        "entity_update_cluster_order": entity_update_cluster_order,
        "entity_hierarchical_topics": user_hgraph.entity_hierarchical_topics,
    }
    res = {
        "entity_graph": hgraph,
        "user_hgraph": user_hgraph.save_states()
    }
    return json.dumps(res, default=vars)

@app.route("/static/p_hilbert/", methods=["POST"])
def peripheral_hilbert():
    width = request.json['width']
    height = request.json['height']
    p_hilbert = pHilbert.peripheral_hilbert(width, height)
    return json.dumps(p_hilbert)

@app.route("/static/gosper/", methods=["POST"])
def gosper_curve():
    level = request.json['level']
    coords = gosper.plot_level(level)
    return json.dumps(coords)


@app.route("/static/search/", methods=["POST"])
def search():
    query = request.json['query']
    base = request.json['base']
    doc_id_relevance = article_controller.search(query=query, base=base)
    # binary search to find the most appropriate threshold
    # suggested_threshold = GptUtils.binary_search_threshold(doc_id_relevance, query)
    suggested_threshold = 0.8

    doc_data = []
    for (doc_id, relevance, summary) in doc_id_relevance:
        doc_data.append({
            "id": doc_id,
            "relevance": relevance,
            "summary": summary
        })
    # Utils.save_json(doc_data, 'tmp_search.json')
    # res = { doc_id: relatedness for doc_id, relatedness in docs }
    return json.dumps({"docs": doc_data, "suggested_threshold": suggested_threshold})

@app.route("/static/articles/", methods=["POST"])
def get_articles():
    doc_ids = request.json['doc_ids']
    articles = article_controller.searchByID(doc_ids, includeContent=False)
    return json.dumps(articles, default=vars)

@app.route("/static/hierarchy", methods=["GET"])
def get_hierarcy():
    return json.dumps(event_hgraph.hierarchy_article)

# @app.route("/static/topic", methods=["POST"])
# def generate_topic():
#     article_ids = request.json
#     # messages = GptUtils.generate_summary_message(article_ids, event_hgraph.article_dict)
#     example_summaries = example['summaries']
#     example_topic = example['topic']
#     topic = GptUtils.explain_articles(article_ids, event_hgraph.article_dict, example_summaries, example_topic)
#     return json.dumps(topic, default=vars)

@app.route("/static/chat", methods=["POST"])
def chat():
    messages = request.json['queryMessages']
    useQueryDocs = request.json['useQueryDocs']
    if useQueryDocs:
        queryDocs = request.json['queryDocs']
        useSummary = request.json['useSummary']
        docs = article_controller.searchByID(queryDocs, includeContent=True)
        user_query = messages[-1]['content']
        doc_query = ""
        for index, doc in enumerate(docs):
            doc_query += "Selected Article {}:".format(index)
            doc_query += doc['summary'] if useSummary else doc['content']
            doc_query += "\n"
        messages[-1]['content'] = user_query + "\n" + doc_query
        response = request_gpt3_5(messages)
    else:
        response = request_gpt3_5(messages)
    return json.dumps(response)


def request_gpt3_5(messages):
    response = openai.ChatCompletion.create(
        # model="text-davinci-003",
        # model="gpt-4",
        model="gpt-3.5-turbo-16k-0613",
        messages=messages,
    )
    return response['choices'][0]['message']['content']
