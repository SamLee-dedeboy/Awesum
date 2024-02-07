from sklearn.cluster import KMeans, OPTICS
import numpy as np
from sklearn.metrics import pairwise_distances_argmin_min
from sklearn.preprocessing import StandardScaler

def k_means(X, n_clusters=10, random_state=42, **kwargs):
    scaler = StandardScaler()
    X = np.array(X)
    X = scaler.fit_transform(X)
    # Apply k-means clustering
    # kmeans = KMeans(n_clusters=k, random_state=42)
    print(n_clusters, random_state)
    kmeans = KMeans(n_clusters=n_clusters, random_state=random_state)
    kmeans.fit(X)

    # Get the cluster centers (representative matrices)
    cluster_centers = kmeans.cluster_centers_

    # Assign each matrix to its nearest cluster
    labels, _ = pairwise_distances_argmin_min(X, cluster_centers)

    # Print the cluster assignments for each matrix
    # for i, label in enumerate(labels):
    #     print(f"Matrix {i + 1} is assigned to Cluster {label + 1}")
    return labels
def optics(X, min_samples=10, metric="cosine", **kwargs):
    scaler = StandardScaler()
    X = np.array(X)
    X = scaler.fit_transform(X)
    clustering = OPTICS(min_samples=min_samples, metric=metric).fit(X)
    return clustering.labels_