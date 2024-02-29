from sklearn.manifold import MDS, TSNE, LocallyLinearEmbedding
from sklearn.decomposition import PCA, KernelPCA
from sklearn.preprocessing import StandardScaler
import umap
import numpy as np

def scatter_plot(X, method="tsne"):
    X = np.array(X)
    scaler = StandardScaler().fit(X)
    X = scaler.transform(X)
    if method == "pca":
        XY = PCA(n_components=2).fit_transform(X)
    if method == "kernel_pca":
        estimator = KernelPCA(n_components=2, kernel='cosine').fit(X)
        XY = estimator.transform(X)
    if method == "tsne":
        XY = TSNE(n_components=2, learning_rate='auto', init='random', perplexity=50, metric='cosine').fit_transform(X)
    if method == "umap":
        reducer = umap.UMAP()
        XY = reducer.fit_transform(X)
    if method == "mds":
        XY = MDS(n_components=2).fit_transform(X)
    XY, min_val, max_val = min_max_normalize(XY)
    return XY, estimator, scaler, min_val, max_val

def reapply_dr(X, estimator, scaler, min_val, max_val):
    X = np.array(X)
    X = scaler.transform(X)
    XY = estimator.transform(X)
    XY, _, _ = min_max_normalize(XY, min_val, max_val)
    return XY

def min_max_normalize(data, min_vals=None, max_vals=None):
    if min_vals is None: min_vals = np.min(data, axis=0)
    if max_vals is None: max_vals = np.max(data, axis=0)
    
    normalized_data = (data - min_vals) / (max_vals - min_vals)
    
    return normalized_data, min_vals, max_vals

def lr_decision_boundary(c1, c2):
    return