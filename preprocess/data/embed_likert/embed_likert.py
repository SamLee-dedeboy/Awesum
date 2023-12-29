import openai
import json
import numpy as np
from numpy.linalg import norm
import requests
import csv
import tiktoken
from pprint import pprint
api_key = open("api_key").read()
openai.api_key = api_key
def get_embedding(text, model="text-embedding-ada-002"):
   encoder = tiktoken.encoding_for_model(model)
   token_length = len(encoder.encode(text))
   while token_length > 8191:
      text = text[:-100]
      token_length = len(encoder.encode(text))
      print(token_length)
   # text = text.replace("\n", " ")
   # return openai.Embedding.create(input = [text], model=model)['data'][0]['embedding']
   url = 'https://api.openai.com/v1/embeddings'
   headers = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer {}".format(api_key)
   }
   data = {
      "input": text,
      "model": model
   }
   res = requests.post(url, headers=headers, json=data)
   res = res.json()
   return res['data'][0]['embedding']

def cos_sim(a, b):
   return np.dot(a, b)/(norm(a)*norm(b))

def save_json(data, filepath=r'new_data.json'):
   with open(filepath, 'w') as fp:
      json.dump(data, fp, indent=4)

if __name__ == "__main__":
    import json
    import math
    likert_articles = json.load(open('likert_evaluation_results.json')) 
    has_summary = [article for article in likert_articles if type(article['summary']) is not float]
    full_embedding_dict = {}
    summary_embedding_dict = {}
    total = len(has_summary)
    for index, article in enumerate(has_summary):
        print("Processing article {} of {}".format(index, total))
        full_text = article['article']
        summary = article['summary']
        if full_text in full_embedding_dict:
            full_embedding = full_embedding_dict[full_text]
        else:
            full_embedding = get_embedding(full_text)
        if summary in summary_embedding_dict:
            summary_embedding = summary_embedding_dict[summary]
        else:
            summary_embedding = get_embedding(summary)
        article['full_embedding'] = full_embedding
        article['summary_embedding'] = summary_embedding
    save_json(has_summary, 'likert_evaluation_w_embeddings.json')
