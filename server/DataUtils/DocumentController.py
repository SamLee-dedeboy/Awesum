import openai
import json
import numpy as np
from numpy.linalg import norm
from scipy import spatial

class DocumentController:
        def __init__(self, data_path, api_key) -> None:
            openai.api_key = api_key
            self.embeddings_db = json.load(open(data_path))
    # search function
        def search(
            self,
            query: str,
            base: list[str]=None,
            relatedness_fn=lambda x, y: 1 - spatial.distance.cosine(x, y),
        ) -> tuple[list[str], list[float]]:
            """Returns a list of strings and relatednesses, sorted from most related to least."""
            query_embedding_response = openai.Embedding.create(
                model="text-embedding-ada-002",
                input=query,
            )
            query_embedding = query_embedding_response["data"][0]["embedding"]
            return self.search_by_embeddings(query_embedding, search_base=base, relatedness_fn=relatedness_fn)

        def searchByID(self, query_ids: list[str], includeContent: bool = False):
            summaries = [
                {
                    'id': doc['id'],
                    'content': doc['content'] if includeContent else None,
                    # 'entity_spans': cleanSpans(self.article_entity_dict[doc['doc_id']])
                }
                for doc in self.embeddings_db if doc['id'] in query_ids
            ]
            return summaries

        def search_by_embeddings(self, query_embedding, search_base=None, relatedness_fn=lambda x, y: 1 - spatial.distance.cosine(x, y)):
            if search_base is not None:
                search_base = [doc for doc in self.embeddings_db if doc['id'] in search_base]
            else:
                search_base = self.embeddings_db
            strings_and_relatednesses = [
                (doc_data["id"], relatedness_fn(query_embedding, doc_data["embedding"]), doc_data['conversation'])
                for doc_data in search_base
            ]
            strings_and_relatednesses.sort(key=lambda x: x[1], reverse=True)
            return strings_and_relatednesses
            # strings, relatednesses = zip(*strings_and_relatednesses)
            # return strings_and_relatednesses[:top_n]

def flatten(l):
    return [item for sublist in l for item in sublist]