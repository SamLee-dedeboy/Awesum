def _renumber_dict(P):
    comm_set = set(P.values())
    renumber_dict = {comm: index for index, comm in enumerate(comm_set)}
    return renumber_dict
    # P = {v: renumber_dict[comm] for v, comm in P.items()}
    # return P
    
def levels_to_partitions(node_indices, levels, idx_to_id_dict):
    partitions = []
    # for v in G.vs:
    #     levels[v.index] = levels[v.index][0:-1]
    for v in node_indices:
        levels[v] = levels[v][0:-1]
    for level in range(len(levels[0])):
        P = {}
        for v in node_indices:
            partition = levels[v][level]
            P[idx_to_id_dict[v]] = partition
        renumber_dict = _renumber_dict(P)
        P = {v: renumber_dict[comm] for v, comm in P.items()}
        # for v in G.vs:
        #     levels[v.index][level] = P[v['name']]
        for v in node_indices:
            levels[v][level] = P[idx_to_id_dict[v]]
        partitions.append(P)
    last_partition = partitions[-1]
    comm_labels = set(last_partition.values())
    if len(comm_labels) > 1:
        # partitions.append({v['name']: 0 for v in G.vs})
        partitions.append({idx_to_id_dict[v]: 0 for v in node_indices})
        for v in node_indices:
            levels[v].append(0)
    return partitions, levels

def add_dummy_partition(partitions):
    first_partition = partitions[0]
    dummy_partition = {}
    for index, node_id in enumerate(list(first_partition.keys())):
        dummy_partition[node_id] = index
    partitions.insert(0, dummy_partition)
    return partitions