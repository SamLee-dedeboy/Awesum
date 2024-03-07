from sklearn.manifold import MDS, TSNE, LocallyLinearEmbedding
from sklearn.decomposition import PCA, KernelPCA
from sklearn.preprocessing import StandardScaler
import umap
import math
import numpy as np

def scatter_plot(X, method="tsne"):
    X = np.array(X)
    scaler = StandardScaler().fit(X)
    estimator = None
    X = scaler.transform(X)
    if method == "pca":
        XY = PCA(n_components=2).fit_transform(X)
    if method == "kernel_pca":
        estimator = KernelPCA(n_components=2, kernel='cosine').fit(X)
        XY = estimator.transform(X)
    if method == "tsne":
        XY = TSNE(n_components=2, learning_rate='auto', init='pca', perplexity=50, metric='cosine').fit_transform(X)
    if method == "umap":
        reducer = umap.UMAP()
        XY = reducer.fit_transform(X)
    if method == "mds":
        XY = MDS(n_components=2).fit_transform(X)
    init_positions = XY
    XY, min_val, max_val = min_max_normalize(XY)
    return XY, estimator, scaler, min_val, max_val, init_positions

def reapply_dr(X, estimator, scaler, min_val, max_val):
    X = np.array(X)
    X = scaler.transform(X)
    XY = estimator.transform(X)
    XY, _, _ = min_max_normalize(XY, min_val, max_val)
    return XY

def reapply_tsne(X, scaler, min_val, max_val, init_positions):
    X = np.array(X)
    X = scaler.transform(X)
    XY = TSNE(n_components=2, learning_rate='auto', perplexity=50, metric='cosine', init=np.array(init_positions)).fit_transform(X)
    XY, _, _ = min_max_normalize(XY, min_val, max_val)
    return XY

def trajectory(estimator, scaler, min_val, max_val, src_points, dst_points):
    print("===============")
    print(src_points)
    print("--------------------")
    print(dst_points)
    print("===============")
    src_points = scaler.transform(np.array(src_points)) # shape is (# of points, # of features)
    dst_points = scaler.transform(np.array(dst_points))
    print(src_points.shape, dst_points.shape)
    trajectory_points = []
    for src, dst in zip(src_points, dst_points):
        # src and dst shape is (1, # of features)
        interpolation_points = np.array(list(getEquidistantPoints(src, dst, 100))) # shape is (100, # of features)
        print(interpolation_points.shape)
        dr_xy = estimator.transform(interpolation_points) # shape is (100, 2)
        dr_xy, _, _ = min_max_normalize(dr_xy, min_val, max_val)
        trajectory_points.append(dr_xy.tolist())
    return trajectory_points

def getEquidistantPoints(p1, p2, parts):
    return zip(*[np.linspace(p1[i], p2[i], parts+1) for i in range(len(p1))])

def min_max_normalize(data, min_vals=None, max_vals=None):
    if min_vals is None: min_vals = np.min(data, axis=0)
    if max_vals is None: max_vals = np.max(data, axis=0)
    
    normalized_data = np.clip((data - min_vals) / (max_vals - min_vals), a_min=0, a_max=1)
    
    return normalized_data, min_vals, max_vals

def lr_decision_boundary(c1, c2):
    return