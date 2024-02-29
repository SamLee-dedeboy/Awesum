from openai import OpenAI
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
# from DataUtils import DocumentController
from AnalysisUtils import dr, clusters, features, helper, gpt
from metrics.stylistic import StyleEvaluator
import numpy as np
import copy

def save_json(data, filepath=r'new_data.json'):
    with open(filepath, 'w', encoding='utf-8') as fp:
        json.dump(data, fp, indent=4)
app = Flask(__name__)
CORS(app)
openai_api_key = open("api_key").read()
openai_client=OpenAI(api_key=openai_api_key)
# document_controller = DocumentController(r'../data/result/chunk_embeddings/1103/all_chunks.json', openai_api_key)
evaluator = features.StyleEvaluator()
metrics = ["readability", "formality", "sentiment", "faithfulness", "length"]
correlations = json.load(open('data/tmp/pearson_r.json'))
feature_descriptions = json.load(open('data/tmp/feature_descriptions.json'))
dataset = json.load(open('data/tmp/df_summaries_features.json'))

# dataset = features.add_all_features(evaluator, dataset)
# save_json(dataset, "data/tmp/df_summaries_features.json")
# # coordinates
target_features = list(map(lambda x: helper.filter_by_key(x['features'], metrics), dataset))
method = 'kernel_pca'
coordinates, dr_estimator, dr_scaler, min_coord, max_coord = dr.scatter_plot(target_features, method=method)
# coordinates = coordinates.tolist()
# save_json(coordinates, 'data/tmp/df_summaries_{}.json'.format(method))

# # optic labels
# optic_labels = clusters.optics(target_features)
# optic_labels = optic_labels.tolist()
# save_json(optic_labels, 'data/tmp/df_summaries_optic_labels.json')

@app.route("/data/", methods=['GET', 'POST'])
def get_data():
    # dataset = json.load(open('data/df_summaries.json'))
    # print("adding features...")
    # dataset = features.add_all_features(dataset)
    # save_json(dataset, "data/tmp/df_summaries_features.json")
    # default features
    dataset = json.load(open('data/tmp/df_summaries_features.json'))
    # default coordinates and clusters
    print("loading coordinates and clusters...")
    # coordinates = json.load(open('data/tmp/df_summaries_tsne.json'))
    coordinates = json.load(open('data/tmp/df_summaries_kernel_pca.json'))
    optic_labels = json.load(open('data/tmp/df_summaries_optic_labels.json'))
    for i, datum in enumerate(dataset):
        datum['id'] = i
        datum['coordinates'] = coordinates[i]
        datum['cluster'] = str(optic_labels[i])
    cluster_labels = list(map(lambda l: str(l), set(optic_labels)))
    statistics, metric_data = features.collect_statistics(dataset, metrics)
    return json.dumps({
        "metric_data": metric_data, 
        "dataset": dataset, 
        "cluster_labels": cluster_labels, 
        "statistics": statistics,
        "metric_metadata": {
            "correlations": correlations,
            "descriptions": feature_descriptions
        }
    }) 

@app.route("/data/metrics/", methods=['GET', 'POST'])
def adjust_metrics():
    metrics = request.json['metrics']
    dataset = request.json['dataset']
    recommended_features = request.json['recommended_features']
    method = request.json['method']
    # kwargs = request.json['parameters']
    target_features = list(map(lambda x: helper.filter_by_key(x['features'], metrics), dataset))
    # rerun coordinates and clusters
    coordinates = dr.scatter_plot(target_features, method='tsne')
    coordinates = coordinates.tolist()
    cluster_labels = run_cluster(method, target_features, auto_adjust=True)
    for i, datum in enumerate(dataset):
        datum['coordinates'] = coordinates[i]
        datum['cluster'] = str(cluster_labels[i])
    cluster_label_set = list(map(lambda l: str(l), set(cluster_labels)))
    statistics, metric_data = features.collect_statistics(dataset, metrics)
    closest_cluster = None
    if len(recommended_features['features']) > 0:
        closest_cluster = helper.fit_cluster(dataset, recommended_features['features'], recommended_features['feature_pool'], feature_descriptions)
    return {
        "metric_data": metric_data, 
        "dataset": dataset, 
        "cluster_labels": cluster_label_set, 
        "statistics": statistics,
        "closest_cluster": closest_cluster
    } 
@app.route("/data/query_closest_cluster/", methods=['GET', 'POST'])
def query_closest_cluster():
    recommended_features = request.json['recommended_features']
    dataset = request.json['dataset']
    closest_cluster = helper.fit_cluster(dataset, recommended_features['features'], recommended_features['feature_pool'], feature_descriptions)
    return {
        "closest_cluster": closest_cluster
    }


@app.route("/data/cluster/", methods=["POST"])
def get_cluster():
    method = request.json['method']
    # kwargs = request.json['parameters']
    dataset = request.json['dataset']
    metrics = request.json['metrics']
    print(metrics)
    target_features = list(map(lambda x: helper.filter_by_key(x['features'], metrics), dataset))
    cluster_labels = run_cluster(method, target_features, auto_adjust=True)
    # save_json(cluster_labels, 'data/tmp/df_summaries_cluster_labels.json')
    for i, datum in enumerate(dataset):
        datum['cluster'] = str(cluster_labels[i])
    cluster_label_set = list(map(lambda l: str(l), set(cluster_labels)))
    statistics, metric_data = features.collect_statistics(dataset, metrics)
    # del statistics['global_means']
    # del statistics['global_mins']
    # del statistics['global_maxes']
    return { 
        "metric_data": metric_data, 
        "dataset": dataset, 
        "cluster_labels": cluster_label_set, 
        "statistics": statistics
    }

def run_cluster(method, target_features, auto_adjust=False):
    if method == "optics":
        return clusters.optics(target_features, auto_adjust=auto_adjust).tolist()
    elif method == "kmeans":
        return clusters.k_means(target_features).tolist()
    

# @app.route("/executePrompt/", methods=['POST'])
# def execute_prompt():
#     prompt = request.json['prompt']
#     target_metrics = request.json['metrics']
#     res = request_chatgpt_gpt4(prompt)
#     metrics = evaluate(res, target_metrics)
#     return json.dumps({
#         "summary": res,
#         "metrics": metrics
#     }) 

@app.route("/executePromptAll/", methods=['POST'])
def execute_prompt_all():
    instruction = request.json['instruction']
    examples = request.json['examples']
    data_template = request.json['data_template']
    prompt_template = gpt.combine_templates(instruction, examples, data_template)
    data = request.json['data']
    # metrics = request.json['metrics']
    prompts = []
    for datum in data:
        prompt = copy.deepcopy(prompt_template)
        for message in prompt:
            message['content'] = gpt.replace_data(message['content'], datum)
        prompts.append(prompt)
    # save_json(prompts, 'data/debug/prompts.json')
    summaries = gpt.multithread_prompts(openai_client, prompts)
    # save_json(summaries, 'data/debug/summaries.json')
    results = []
    for index, new_summary in enumerate(summaries):
        default_metrics = features.evaluate(evaluator, data[index]['text'], new_summary, metrics)

        results.append({
            "id": data[index]['id'],
            "cluster": data[index]['cluster'],
            "features": default_metrics,
            "coordinates": dr.reapply_dr([[default_metrics[metric] for metric in metrics]], dr_estimator, dr_scaler, min_coord, max_coord).tolist()[0],
            "summary": new_summary,
            "text": data[index]['text'],
            "test_case": True
        })
    feature_matrix = np.array(list(map(lambda x: [x['features'][m] for m in metrics], results)))
    statistics = []
    for c in range(feature_matrix.shape[1]):
        column = feature_matrix[:, c]
        statistics.append(features.collect_local_stats(column))

    return json.dumps({
        "results": results,
        "statistics": statistics
    })

@app.route("/query_metric/", methods=['POST'])
def query_metric():
    question = request.json['question']
    feature_pool = request.json['feature_pool']
    # nodes = request.json['nodes']
    feature_definition_prompt = gpt.formulate_feature_definitions_prompt(feature_pool, feature_descriptions)
    prompt = gpt.formulate_metric_prompt(question, feature_definition_prompt)
    while True:
        features = json.loads(gpt.request_chatgpt_gpt4(openai_client, prompt, format='json'))
        if gpt.check_metric_recommendation_validity(features, feature_pool, feature_descriptions):
            break
    # closest_cluster = helper.fit_cluster(nodes, features['features'], feature_pool, feature_descriptions)
    return {
        "features": features['features'],
        # "closest_cluster": closest_cluster,
    }

# ====================== deprecated ===============================
# def get_ravasz():
#     full_level = request.json['full_level']
#     summary_level = request.json['summary_level']
#     full_node_coordinates = json.load(open('../preprocess/data/full/node_coordinates.json'))
#     summary_node_coordinates = json.load(open('../preprocess/data/summary/node_coordinates.json'))
#     full_nodes, full_clusters = organize_data(full_partition_clusters, full_partitions, full_level, full_node_coordinates)
#     summary_nodes, summary_clusters = organize_data(summary_partition_clusters, summary_partitions, summary_level, summary_node_coordinates)
#     print("get_data")
#     res = {
#         'full': {
#             'links': [],
#             'nodes': full_nodes,
#             'clusters': full_clusters
#         },
#         'summary': {
#             'links': [],
#             'nodes': summary_nodes,
#             'clusters': summary_clusters
#         }
#     }
#     return json.dumps(res, default=vars)

# @app.route("/search/", methods=['POST'])
# def search():
#     query = request.json['query']
#     type = request.json['type']
#     doc_id_relevance = document_controller.search(query=query)
#     if type == 'chunk':
#         chunk_id_relevances = [("_".join(doc[0].split("_")[:3]), doc[1]) for doc in doc_id_relevance]
#         existing_chunk_id = []
#         cleaned_chunk_id_relevances = []
#         for chunk_id_relevance in chunk_id_relevances:
#             if chunk_id_relevance[0] not in existing_chunk_id:
#                 existing_chunk_id.append(chunk_id_relevance[0])
#                 cleaned_chunk_id_relevances.append(chunk_id_relevance)
#             else:
#                 continue
#         doc_id_relevance = cleaned_chunk_id_relevances
#     return json.dumps(doc_id_relevance)


# def reverse_index(base_dict):
#     res = defaultdict(list)
#     for key, value in base_dict.items():
#         res[value].append(key)
#     return res

# def processData(type):
#     partitions = json.load(open(f'../preprocess/data/{type}/{type}_partitions.json'))
#     partition_clusters = [reverse_index(partition) for partition in partitions]
#     return partitions, partition_clusters

# full_partitions, full_partition_clusters = processData(type='full')
# summary_partitions, summary_partition_clusters = processData(type='summary')
    
# def organize_data(partition_clusters, partitions, level, coordinates):
#     clusters = partition_clusters[level]
#     partition = partitions[level]
#     nodes = {}
#     for node, cluster in partition.items():
#         nodes[node] = {
#             'id': node,
#             'topic': cluster,
#             'coordinate': coordinates[node]
#         }
#     return nodes, clusters

# def evaluate_default(text):
#     readability_scores = list(all_readability_scores(text))
#     formality_scores = list(all_formality_scores(text))
#     sentiment_scores = list([all_sentiment_scores(text)])
#     return readability_scores + formality_scores + sentiment_scores

# def evaluate(text, target_metrics):
#     readability_scores = ReadabilityEvaluator(text)
#     formality_scores = FormalityEvaluator(text)
#     metric_scorers = {
#         "readability": readability_scores.flesch_kincaid()[0],
#         "formality": formality_scores.formality(),
#     }
#     res = {}
#     for target_metric in target_metrics:
#         res[target_metric] = metric_scorers[target_metric]
#     return res
