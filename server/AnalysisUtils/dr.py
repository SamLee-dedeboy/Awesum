from sklearn.manifold import MDS, TSNE, LocallyLinearEmbedding
from sklearn.decomposition import PCA, KernelPCA
from sklearn.preprocessing import StandardScaler
import umap
import numpy as np

def scatter_plot(X, method="tsne"):
    scaler = StandardScaler()
    X = np.array(X)
    X = scaler.fit_transform(X)
    if method == "pca":
        XY = PCA(n_components=2).fit_transform(X)
    if method == "kernel_pca":
        XY = KernelPCA(n_components=2, kernel='cosine').fit_transform(X)
    if method == "tsne":
        XY = TSNE(n_components=2, learning_rate='auto', init='random', perplexity=50, metric='cosine').fit_transform(X)
    if method == "umap":
        reducer = umap.UMAP()
        XY = reducer.fit_transform(X)
    if method == "mds":
        XY = MDS(n_components=2).fit_transform(X)
    XY = min_max_normalize(XY)
    return XY

def min_max_normalize(data):
    min_vals = np.min(data, axis=0)
    max_vals = np.max(data, axis=0)
    
    normalized_data = (data - min_vals) / (max_vals - min_vals)
    
    return normalized_data

def lr_decision_boundary(c1, c2):
    return