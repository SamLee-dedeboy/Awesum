# Import and download stopwords from NLTK.
from nltk.corpus import stopwords
from nltk import download
import gensim.downloader as api

class WordMoversDistance(object):
    def __init__(self):
        download('stopwords')  # Download stopwords list.
        self.stop_words = stopwords.words('english')
        self.model = api.load('word2vec-google-news-300')

    def distance(self, first_sentence, second_sentence):
        first_sentence = self.preprocess(first_sentence)
        second_sentence = self.preprocess(second_sentence)
        return self.model.wmdistance(first_sentence, second_sentence)

    def predict_writer_better(self, writer_score, llm_score, epsilon=0.01):
        if abs(writer_score - llm_score) < epsilon:
            return 'Equally Good'
        elif writer_score < llm_score: # small is good
            return True
        else:
            return False

    def preprocess(self, sentence):
        return [w for w in sentence.lower().split() if w not in self.stop_words]
