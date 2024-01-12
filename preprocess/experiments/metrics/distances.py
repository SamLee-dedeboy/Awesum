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

def simple_linear_regression(X: np.array, Y: np.array): # x and y are scalars
    # Calculate the slope (m) and y-intercept (b) using the least squares method
    X_mean = np.mean(X)
    y_mean = np.mean(Y)
    m = np.sum((X - X_mean) * (Y - y_mean)) / np.sum((X - X_mean)**2)
    b = y_mean - m * X_mean
    # Make predictions using the calculated slope and y-intercept
    y_pred = m * X + b
    mse_by_sample = (Y - y_pred)**2 / len(Y)
    print("mse by sample: ", np.mean(mse_by_sample))
    return m, b, y_pred, mse_by_sample

def linear_regression_distances(X: np.ndarray, Y:np.ndarray): # x and y are vectors of shape (n, d)
    # fit each dimension using linear regression
    d = X.shape[1]
    mse_matrix = np.zeros(X.shape)
    for i in range(d):
        m, b, y_pred, mse_by_sample = simple_linear_regression(X[:, i], Y[:, i])
        mse_matrix[:, i] = mse_by_sample
    total_mse_by_sample = np.sum(mse_matrix, axis=1)
    return total_mse_by_sample

def linear_regression_writer_better(writer_score, llm_score, epsilon=0):
    # print(epsilon, abs(writer_score - llm_score))
    if abs(writer_score - llm_score) < epsilon:
        return 'Equally Good' 
    elif writer_score < llm_score: # small is good
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


