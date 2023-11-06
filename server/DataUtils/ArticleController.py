import openai
import json
import numpy as np
from numpy.linalg import norm
from scipy import spatial

class ArticleController:
    def __init__(self, data_path, api_key) -> None:
        openai.api_key = api_key
        self.embeddings_db = json.load(open(data_path + 'network/server/article_embeddings.json'))
        self.article_entity_dict = json.load(open(data_path + 'network/server/article_participant_spans.json'))
    # search function
    def search(
        self,
        query: str,
        base: list[str],
        relatedness_fn=lambda x, y: 1 - spatial.distance.cosine(x, y),
    ) -> tuple[list[str], list[float]]:
        """Returns a list of strings and relatednesses, sorted from most related to least."""
        query_embedding_response = openai.Embedding.create(
            model="text-embedding-ada-002",
            input=query,
        )
        search_base = [doc for doc in self.embeddings_db if doc['doc_id'] in base]
        query_embedding = query_embedding_response["data"][0]["embedding"]
        strings_and_relatednesses = [
            (doc_data["doc_id"], relatedness_fn(query_embedding, doc_data["embedding"]), doc_data['summary'])
            for doc_data in search_base
        ]
        strings_and_relatednesses.sort(key=lambda x: x[1], reverse=True)
        # strings, relatednesses = zip(*strings_and_relatednesses)
        # return strings_and_relatednesses[:top_n]
        return strings_and_relatednesses

    def searchByID(self, query_ids: list[str], includeContent: bool = False):
        summaries = [
            {
                'id': doc['doc_id'],
                'title': doc['title'],
                'summary': doc['summary'],
                'content': doc['content'] if includeContent else None,
                # 'entity_spans': cleanSpans(self.article_entity_dict[doc['doc_id']])
            }
            for doc in self.embeddings_db if doc['doc_id'] in query_ids
        ]
        return summaries

def cleanSpans(entities):
    all_spans = flatten([entity['spans'] for entity in entities])
    all_spans.sort(key=lambda x: x[0])
    cleaned_spans = []
    current_max_end = float('-inf')  # Initialize with negative infinity

    for span in all_spans:
        start, end, _ = span
        # If the span is not contained within the current range
        if start > current_max_end:
            cleaned_spans.append(span)
            current_max_end = end
        # If the span is contained, skip it
    return cleaned_spans

def flatten(l):
    return [item for sublist in l for item in sublist]