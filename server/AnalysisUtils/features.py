from metrics.stylistic import StyleEvaluator
from collections import defaultdict
import numpy as np

def evaluate(evaluator: StyleEvaluator, text, summary, target_metrics):
    all_features = evaluator.default(text, summary)
    return {m: all_features[m] for m in target_metrics}

def add_all_features(evaluator: StyleEvaluator, dataset):
    for index, datum in enumerate(dataset):
        print("Evaluating %d/%d" % (index + 1, len(dataset)))
        datum['features'] = evaluator.default(datum['text'], datum['summary'])
    return dataset

def groupby(dataset, key): # itertools.groupby only groups consecutive elements so I wrote this
    groups = defaultdict(list)
    for datum in dataset:
        groups[key(datum)].append(datum)
    return groups.items()

def collect_statistics(dataset, metrics):
    cluster_statistics = {}
    metric_statistics = {m: {} for m in metrics}
    # metrics = ["flesch_kincard", "dale_chall", "gunning_fog", "mtld", "formality", "hdd", "sentiment"]
    metric_data = {
        m: {
            "statistics": {
                "min": 0,
                "max": 0,
                "mean": 0,
                # "std": 0,
            },
            "data": [] 
        } for m in metrics
    }
    # cluster statistics
    global_means = np.zeros(len(dataset[0]['features']))
    global_mins = np.empty(len(dataset[0]['features']))
    global_mins.fill(np.inf)
    global_maxes = np.zeros(len(dataset[0]['features']))
    for cluster, cluster_nodes in groupby(dataset, lambda x: str(x['cluster'])):
        cluster_nodes = list(cluster_nodes)
        feature_matrix = np.array(list(map(lambda x: [x['features'][m] for m in metrics], cluster_nodes)))
        statistics = []
        for c in range(feature_matrix.shape[1]):
            column = feature_matrix[:, c]
            statistics.append(collect_local_stats(column))
            global_means[c] += np.sum(column)
            global_mins[c] = np.min([global_mins[c], np.min(column)])
            global_maxes[c] = np.max([global_maxes[c], np.max(column)])
        cluster_statistics[cluster] = statistics
        for index, m in enumerate(metrics):
            metric_statistics[m][cluster] = statistics[index]
    global_means = [global_mean / len(dataset) for global_mean in global_means]

    # metric data
    for datum in dataset:
        for index, m in enumerate(metrics):
        # for index, value in enumerate(datum['features']):
            metric_data[m]['statistics']['min'] = global_mins[index]
            metric_data[m]['statistics']['max'] = global_maxes[index]
            metric_data[m]['statistics']['mean'] = global_means[index]
            # metric_data[metrics[index]]['statistics']['std'] = np.std(value)
            metric_data[m]['data'].append({
                "cluster": datum['cluster'],
                "value": datum['features'][m],
            })
    return {
        "metric_statistics": metric_statistics,
        "cluster_statistics": cluster_statistics, 
        "global_means": list(global_means), 
        "global_mins": list(global_mins), 
        "global_maxes": list(global_maxes),
    }, metric_data



def collect_local_stats(column):
    return {
        'mean': np.mean(column),
        'std': np.std(column),
        'max': np.max(column),
        'min': np.min(column),
    }
