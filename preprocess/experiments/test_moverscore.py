from metrics import distances, eval, moverscore
import json
import numpy as np
from pprint import pprint
# test scripts
def test_mover_score(dataset, epsilon=0.001):
    confusion_matrix_overall = eval.llmConfusionMatrix()
    confusion_matrix_informative = eval.llmConfusionMatrix()
    for datum in dataset:
        full_text = datum['article_text']
        writer_summary = datum['writer_summary']
        llm_summary = datum['text-davinci-002_summary']
        # writer summary mover score
        writer_mover_score = moverscore.corpus_score(writer_summary, [full_text])
        llm_mover_score = moverscore.corpus_score(llm_summary, [full_text])
        pred = moverscore.predict_writer_better(writer_mover_score, llm_mover_score, epsilon)
        confusion_matrix_overall.add(datum['overall_writer_better'], pred)
        confusion_matrix_informative.add(datum['informative_writer_better'], pred)
    return confusion_matrix_overall, confusion_matrix_informative

if __name__ == "__main__":
    dataset = json.load(open('data/pairwise_evaluation_w_embeddings.json'))
    # dataset format:
    # [
    #  { 
    # article_id: str, writer_id: str, evaluator_id: str,
    # article_text: str, writer_summary: str, text-davinci-002_summary: str,
    # overall_writer_better: bool | "Equally Good", informative_writer_better: bool | "Equally Good",
    # full_embedding: [float], writer_summary_embedding: [float], llm_summary_embedding: [float] 
    # ]

    test_mover_score(dataset)