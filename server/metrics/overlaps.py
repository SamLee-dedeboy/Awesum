from rouge_score import rouge_scorer
import nltk
from nltk.translate.bleu_score import sentence_bleu
from nltk.translate.meteor_score import meteor_score


# BLEU
def bleu_score(reference, candidate):
    reference_tokens = nltk.word_tokenize(reference.lower())
    candidate_tokens = nltk.word_tokenize(candidate.lower())

    bleu_1 = sentence_bleu([reference_tokens], candidate_tokens, weights=(1, 0, 0, 0))
    bleu_2 = sentence_bleu([reference_tokens], candidate_tokens, weights=(0.5, 0.5, 0, 0))
    bleu_3 = sentence_bleu([reference_tokens], candidate_tokens, weights=(0.33, 0.33, 0.33, 0))
    bleu_4 = sentence_bleu([reference_tokens], candidate_tokens, weights=(0.25, 0.25, 0.25, 0.25))

    return bleu_1, bleu_2, bleu_3, bleu_4

def rogue_score(full_text, summary, rouge_types=['rougeL'], use_stemmer=True):
    scorer = rouge_scorer.RougeScorer(rouge_types, use_stemmer=use_stemmer)
    scores = scorer.score(full_text, summary)
    if len(rouge_types) == 1:
        return scores[rouge_types[0]].fmeasure
    else:
        return scores

# METEOR
def meteor_score(reference, candidate):

    reference =  nltk.word_tokenize(reference.lower())
    candidate =  nltk.word_tokenize(candidate.lower())

    score = meteor_score([reference], candidate)

    return score

# TRANSLATION ERROR RATE
def ter_score(reference, candidate):

    ref_tokens = nltk.word_tokenize(reference.lower())
    cand_tokens = nltk.word_tokenize(candidate.lower())

    substitutions = nltk.edit_distance(ref_tokens, cand_tokens)
    deletions = len(ref_tokens) - len(set(ref_tokens) & set(cand_tokens))
    insertions = len(cand_tokens) - len(set(ref_tokens) & set(cand_tokens))

    reference_length = len(ref_tokens)
    ter = (substitutions + deletions + insertions) / reference_length

    return ter

def writer_better(writer_score, llm_score, higher_better=True, epsilon=0):
    if abs(writer_score - llm_score) < epsilon:
        return 'Equally Good' 
    
    if higher_better:
        return writer_score > llm_score
    else:
        return writer_score < llm_score
