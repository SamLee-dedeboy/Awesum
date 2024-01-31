from bert_score.bert_score.score import score
if __name__ == "__main__":
    reference_text = "The quick brown fox jumps over the lazy dog."
    candidate_text = "The quick brown dog jumps on the log."
    print(bertscore([candidate_text], [reference_text]))

def bertscore(cands, refs):
    return score(cands, refs)
