from collections import defaultdict
import math
def filter_by_key(dict, keys):
    return [dict[k] for k in keys]

def fit_cluster(all_nodes, recommendations, target_features, feature_descriptions):
    min_distance = math.inf
    best_cluster = None
    if len(recommendations) > 0:
        clusters = group_by(all_nodes, lambda d: d['cluster'])
        for cluster_label, nodes in clusters.items():
            total_distance = 0
            for target_feature in target_features:
                recommendation = next((r for r in recommendations if r['feature_name'] == target_feature), None)
                if recommendation:
                    recommended_level = recommendation['level']
                    recommended_range = next((range for range in feature_descriptions[target_feature]['ranges'] if range[2] == recommended_level), None)
                    feature_min = feature_descriptions[target_feature]['ranges'][0][0]
                    feature_max = feature_descriptions[target_feature]['ranges'][-1][1]
                    if feature_max == -1: # if the feature is not bounded
                        feature_max = max(list(map(lambda node: node['features'][target_feature], all_nodes)))
                    assert recommended_range is not None
                    distance = overlap_distance(list(map(lambda node: node['features'][target_feature], nodes)), [recommended_range[0], recommended_range[1]], feature_min, feature_max)
                    total_distance += distance
            avg_distance = total_distance / len(nodes)
            if avg_distance < min_distance:
                min_distance = avg_distance
                best_cluster = cluster_label
    return best_cluster
def group_by(data, key):
    groups = defaultdict(list)
    for d in data:
        k = key(d)
        if k in groups:
            groups[k].append(d)
        else:
            groups[k] = [d]
    return groups
def overlap_distance(values, range, min_value, max_value):
    total_distance = 0
    for value in values:
        if value < range[0]:
            total_distance += minmax_norm(range[0], min_value, max_value) - minmax_norm(value, min_value, max_value)
        elif value > range[1]:
            total_distance += minmax_norm(value, min_value, max_value) - minmax_norm(range[1], min_value, max_value)
    return total_distance
def minmax_norm(value, min_value, max_value):
    return (value - min_value) / (max_value - min_value)