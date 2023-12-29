from rouge_score import rouge_scorer


def rogue_score(full_text, summary, rouge_types=['rougeL'], use_stemmer=True):
    scorer = rouge_scorer.RougeScorer(rouge_types, use_stemmer=use_stemmer)
    scores = scorer.score(full_text, summary)
    if len(rouge_types) == 1:
        return scores[rouge_types[0]].fmeasure
    else:
        return scores

def rogue_writer_better(writer_score, llm_score, epsilon=0):
    if abs(writer_score - llm_score) < epsilon:
        return 'Equally Good' 
    elif writer_score > llm_score: # higher is better
        return True
    else:
        return False