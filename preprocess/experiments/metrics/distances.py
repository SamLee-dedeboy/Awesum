import numpy as np
from numpy.linalg import norm
from scipy.stats import entropy
from sklearn.neighbors import KernelDensity

def cosine_distance(a: np.array, b: np.array):
    return np.dot(a, b)/(norm(a)*norm(b))

def cosine_distance_writer_better(writer_score, llm_score, epsilon=0):
    if abs(writer_score - llm_score) < epsilon:
        return 'Equally Good' 
    elif writer_score < llm_score:
        return True
    else:
        return False

def linear_regression_distance(full_embeddings: np.ndarray, summ_embeddings: np.ndarray):
    # embedding_pairs = []
    # for article_id in full_embeddings_dict.keys():
    #     embedding_pairs.append((article_id, full_embeddings_dict[article_id], summary_embeddings_dict[article_id]))
    # ids = [embedding_pair[0] for embedding_pair in embedding_pairs]
    # X = np.array([embedding_pair[1] for embedding_pair in embedding_pairs])
    # Y = np.array([embedding_pair[2] for embedding_pair in embedding_pairs])
    X = full_embeddings
    Y = summ_embeddings
    W = np.linalg.inv(X.T @ X) @ X.T @ Y
    Y_pred = X @ W
    residuals = Y - Y_pred
    covariance_matrix = np.cov(residuals, rowvar=False)
    mahalanobis_distances = np.sqrt(np.sum(residuals @ np.linalg.inv(covariance_matrix) * residuals, axis=1))
    return mahalanobis_distances
    # return X, Y, W, Y_pred, residuals

def linear_regression_writer_better(writer_score, llm_score, epsilon=0):
    # print(epsilon, abs(writer_score - llm_score))
    if abs(writer_score - llm_score) < epsilon:
        return 'Equally Good' 
    elif writer_score < llm_score:
        return True
    else:
        return False


def kl_divergence(full_embeddings: np.ndarray, summ_embedding: np.ndarray):
    # Assuming X and Y are your datasets
    X = full_embeddings
    Y = summ_embedding

    # Estimate probability distributions using Kernel Density Estimation (KDE)
    kde_X = KernelDensity(bandwidth=0.1).fit(X.reshape(-1, 1))
    kde_Y = KernelDensity(bandwidth=0.1).fit(Y.reshape(-1, 1))

    # Generate a range of values for evaluation
    x_values = np.linspace(min(np.min(X), np.min(Y)), max(np.max(X), np.max(Y)), 1000).reshape(-1, 1)

    # Evaluate the KDEs at the specified values
    pdf_X = np.exp(kde_X.score_samples(x_values))
    pdf_Y = np.exp(kde_Y.score_samples(x_values))

    # Compute KL divergence between X and Y
    kl_divergence = entropy(pdf_X, pdf_Y)

    return kl_divergence


