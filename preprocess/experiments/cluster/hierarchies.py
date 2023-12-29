from collections import defaultdict
def get_level_transition(levels):
    nested_comms = {}
    for i in range(len(levels[0])-1):
        for v, transitions in levels.items():
            trans_children_title = "L-{}-{}".format(i, transitions[i])
            trans_parent_title = "L-{}-{}".format(i+1, transitions[i+1])
            # if children is the first level
            if trans_children_title not in nested_comms:
                # create leaf
                nested_comms[trans_children_title] = {
                    "title": trans_children_title,
                    "key": trans_children_title
                }
                # add to parent 
                if trans_parent_title not in nested_comms:
                    nested_comms[trans_parent_title] = {
                        "title": trans_parent_title,
                        "key": trans_parent_title,
                        'children': [nested_comms[trans_children_title]]
                    }
                # avoid adding duplicate children
                elif trans_children_title not in [child['title'] for child in nested_comms[trans_parent_title]['children']]:
                    nested_comms[trans_parent_title]['children'].append(nested_comms[trans_children_title])
            else:
                # if children is not the first level
                # add to parent directly
                if trans_parent_title not in nested_comms:
                    nested_comms[trans_parent_title] = {
                        "title": trans_parent_title,
                        "key": trans_parent_title,
                        'children': [nested_comms[trans_children_title]]
                    }
                # avoid adding duplicate children
                elif trans_children_title not in [child['title'] for child in nested_comms[trans_parent_title]['children']]:
                    nested_comms[trans_parent_title]['children'].append(nested_comms[trans_children_title])
    final_level = len(levels[0])-1
    return nested_comms['L-{}-{}'.format(final_level, 0)]

def dfs(hierarchy, leaf_children_dict):
    cur_level_label = hierarchy['title'].split("-")[1]
    cur_cluster_label = hierarchy['title'].split("-")[2]
    new_level_label = str(int(cur_level_label) + 1)
    hierarchy['title'] = "L-{}-{}".format(new_level_label, cur_cluster_label)
    hierarchy['key'] = "L-{}-{}".format(new_level_label, cur_cluster_label)
    if 'children' in hierarchy:
        for child in hierarchy['children']:
            dfs(child, leaf_children_dict)
    else:
        dummy_clusters = leaf_children_dict[cur_cluster_label]
        hierarchy['children'] = []
        for dummy_cluster_label in dummy_clusters:
            hierarchy['children'].append({ 
                "title": "L-0-{}".format(dummy_cluster_label),
                "key": "L-0-{}".format(dummy_cluster_label),
            })
    return

def add_dummy_hierarchy(partitions, hierarchies):
    first_partition = partitions[0]
    second_partition = partitions[1]
    second_level_children_dict = defaultdict(list)
    for node_id, dummy_cluster_label in first_partition.items():
        parent_cluster_label = second_partition[node_id]
        second_level_children_dict[str(parent_cluster_label)].append(dummy_cluster_label)
    dfs(hierarchies, second_level_children_dict)
    return hierarchies