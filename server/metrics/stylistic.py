from lexical_diversity import lex_div as ld
import textstat
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk import pos_tag
from collections import Counter
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import numpy as np
from summac.model_guardrails import NERInaccuracyPenalty
import nltk
import spacy
from Naturalness_helper import NaturalnessHelper

class StyleEvaluator:
    def __init__(self):
        self.sentiment_scorer = SentimentEvaluator()
        self.faithfulness_scorer = FaithfulnessEvaluator()

    def default(self, original_text, summary):
        readability_score = ReadabilityEvaluator(summary).default()
        formality_score = FormalityEvaluator(summary).default()
        sentiment_score = self.sentiment_scorer.default(summary) 
        faithfulness_score = self.faithfulness_scorer.default(original_text, summary)
        length_score = len(summary)
        return {
            "readability": readability_score,
            "formality": formality_score,
            "sentiment": sentiment_score,
            "faithfulness": faithfulness_score,
            "length": length_score,
        }

class ReadabilityEvaluator:
    def __init__(self, text):
        self.text = text
        # self.scorer = Readability(text)
    
    def default(self):
        return self.flesch()
    
    def flesch_kincaid(self): # lower = more readable
        # fk = self.scorer.flesch_kincaid()
        # return (fk.score, fk.grade_level)
        return textstat.flesch_kincaid_grade(self.text)
    def flesch(self): # higher = more readable
        # f = self.scorer.flesch()
        # return (f.score, f.ease, f.grade_levels)
        return textstat.flesch_reading_ease(self.text)

    def dale_chall(self):
        # dc = self.scorer.dale_chall()
        # return (dc.score, dc.grade_levels)
        return textstat.dale_chall_readability_score(self.text)

    def automated_readability_index(self):
        # ari = self.scorer.ari()
        # return (ari.score, ari.grade_levels, ari.ages)
        return textstat.automated_readability_index(self.text)

    def coleman_liau(self):
        # cl = self.scorer.coleman_liau()
        # return (cl.score, cl.grade_level)
        return textstat.coleman_liau_index(self.text)

    def gunning_fog(self):
        # gf = self.scorer.gunning_fog()
        # return (gf.score, gf.grade_level)
        return textstat.gunning_fog(self.text)

    # def spache(self):
        # s = self.scorer.spache()
        # return (s.score, s.grade_level)
    def linsear_write(self):
        # lw = self.scorer.linsear_write()
        # return (lw.score, lw.grade_level)
        return textstat.linsear_write_formula(self.text)

    def smog(self):
        # smog = self.scorer.smog()
        # return (smog.score, smog.grade_level)
        return textstat.smog_index(self.text)

    def lix_score(self):
        text = self.text
        words = text.split()
        long_words = [word for word in words if len(word) > 6]
        num_words = len(words)
        num_sentences = text.count('.') + text.count('!') + text.count('?')
        lix = num_words / num_sentences + (float(len(long_words)) * 100) / num_words
        return lix

    def mcalpine_eflaw(self):
        text = self.text
        return textstat.mcalpine_eflaw(text)

    def reading_time(self):
        text = self.text
        return textstat.reading_time(text)

class FormalityEvaluator:
    def __init__(self, text):
        self.text = text
        self.tokens = ld.tokenize(text)
        self.flm_tokens = ld.flemmatize(text)
    
    def default(self):
        return self.mtld()

    def formality_score(self):
        text = self.text
        # Tokenize an tag
        words = word_tokenize(text)
        pos_tags = pos_tag(words)
        
        pos_counts = Counter(tag for word, tag in pos_tags)
        
        # Calculate the frequencies as percentages
        total_words = len(words)
        noun_freq = (pos_counts['NN'] + pos_counts['NNS'] + pos_counts['NNP'] + pos_counts['NNPS']) / total_words * 100
        adjective_freq = (pos_counts['JJ'] + pos_counts['JJR'] + pos_counts['JJS']) / total_words * 100
        preposition_freq = pos_counts['IN'] / total_words * 100
        article_freq = (pos_counts['DT'] + pos_counts['WDT']) / total_words * 100
        pronoun_freq = (pos_counts['PRP'] + pos_counts['PRP$'] + pos_counts['WP'] + pos_counts['WP$']) / total_words * 100
        verb_freq = (pos_counts['VB'] + pos_counts['VBD'] + pos_counts['VBG'] + pos_counts['VBN'] + pos_counts['VBP'] + pos_counts['VBZ']) / total_words * 100
        adverb_freq = (pos_counts['RB'] + pos_counts['RBR'] + pos_counts['RBS']) / total_words * 100
        interjection_freq = pos_counts['UH'] / total_words * 100
        
        # Formality score formula
        F = (noun_freq + adjective_freq + preposition_freq + article_freq - pronoun_freq - verb_freq - adverb_freq - interjection_freq + 100) / 2
        
        return F

    def ttr(self):
        return ld.ttr(self.flm_tokens)
    def root_ttr(self):
        return ld.root_ttr(self.flm_tokens)
    def log_ttr(self):
        return ld.log_ttr(self.flm_tokens)
    def maas_ttr(self):
        return ld.maas_ttr(self.flm_tokens)
    def ms_ttr(self, window_length=25):
        return ld.msttr(self.flm_tokens, window_length=window_length)
    def hdd(self):
        return ld.hdd(self.flm_tokens)
    def mtld(self):
        return ld.mtld(self.flm_tokens)
    def mtld_ma_bid(self):
        return ld.mtld_ma_bid(self.flm_tokens)
    def mtld_ma_wrap(self):
        return ld.mtld_ma_wrap(self.flm_tokens)
    
class SentimentEvaluator:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()

    def default(self, text):
        sentences = sent_tokenize(text)
        self.sst_by_sentence = [self.analyzer.polarity_scores(sentence)['compound'] for sentence in sentences]
        self.sst = np.mean(self.sst_by_sentence)
        return self.sst

class FaithfulnessEvaluator:
    def __init__(self):
        self.model_ner = NERInaccuracyPenalty()
        # model_zs = SummaCZS(granularity="sentence", model_name="vitc", device="cpu") # If you have a GPU: switch to: device="cuda"
        # model_conv = SummaCConv(models=["vitc"], bins='percentile', granularity="sentence", nli_labels="e", device="cpu", start_file="default", agg="mean")
    # def __init__(self, original_text, summary):
    #     self.original_text = original_text
    #     self.summary = summary

    def default(self, original_text, summary):
        return self.ner_overlap([original_text], [summary])[0]
        # return self.model_ner.score([original_text], [summary])

    def ner_overlap(self, sources, generateds):
        source_ents = [self.model_ner.extract_entities(text) for text in sources]
        generated_ents = [self.model_ner.extract_entities(text) for text in generateds]

        scores = []
        for source_ent, generated_ent, source in zip(source_ents, generated_ents, sources):
            overlaps = self.find_overlaps(source_ent, generated_ent, source)
            # print(len(overlaps), len(source_ent))
            score = len(overlaps)/len(source_ent)
            scores.append(score)
        return scores
        # return {"scores": scores, "source_ents": source_ents, "gen_ents": generated_ents, "new_ents": all_new_ents}

    def find_overlaps(self, ent_list_old, ent_list_new, source_text):
        model_ner = self.model_ner
        source_text = source_text.lower()

        ent_set = set([model_ner.clean_entity_text(e["text"]) for e in ent_list_old])
        overlaps = []

        for ent_new in ent_list_new:
            raw_entity_lower = ent_new["text"].lower()
            entity_text = model_ner.clean_entity_text(ent_new["text"])
            if model_ner.common_ents_no_problem(entity_text): # The entity is too common and could added anywhere
                overlaps.append(ent_new)
                continue
            if entity_text in ent_set or model_ner.singular(entity_text) in ent_set: # Exact match with some entity
                overlaps.append(ent_new)
                continue
            if entity_text in source_text or model_ner.singular(entity_text).lower() in source_text or raw_entity_lower in source_text: # Sometimes the NER model won't tag the exact same thing in the original paragraph, but we can just do string matching
                overlaps.append(ent_new)
                continue
            # Starting the entity-specific matching
            if ent_new["type"] in ["DATE", "CARDINAL", "MONEY", "PERCENT"]:
                # For dates:
                # a subset match is allowed: "several months" -> "months", "only a few weeks" -> "a few weeks"
                quantifier_clean = model_ner.quantifier_cleaning(ent_new["text"])
                if model_ner.quantifier_matching(ent_new["text"],  ent_list_old):
                # if any([clean_string in ent_text2 for ent_text2 in ent_set]):
                    overlaps.append(ent_new)
                    continue
                
                if all([w in source_text for w in quantifier_clean]):
                    # A bit more desperate: remove additional words, and check that what's left is in the original
                    overlaps.append(ent_new)
                    continue
                if ent_new["type"] == "CARDINAL":
                    if raw_entity_lower in model_ner.string2digits and model_ner.string2digits[raw_entity_lower] in source_text:
                        overlaps.append(ent_new)
                        continue # They wrote "nineteen" instead of 19
                    elif raw_entity_lower in model_ner.digits2string and model_ner.digits2string[raw_entity_lower] in source_text.replace(",", ""):
                        overlaps.append(ent_new)
                        continue # They wrote 19 instead of "nineteen"

            if ent_new["type"] == "GPE":
                if entity_text+"n" in ent_set or entity_text[:-1] in ent_set:
                    overlaps.append(ent_new)
                    # If you say india instead of indian, or indian instead of india.
                    # Definitely doesn't work with every country, could use a lookup table
                    continue
            if ent_new["type"] in ["ORG", "PERSON"]:
                # Saying a smaller thing is fine: Barack Obama -> Obama. University of California, Berkeley -> University of California
                if any([entity_text in ent_text2 for ent_text2 in ent_set]):
                    overlaps.append(ent_new)
                    continue
        return overlaps
        return {"score": score, "new_ents": new_ents2, "gen_entities": ents2, "source_entities": ents1}

    def summac(self):
        return 0
        # return summac_score(self.original_text, self.summary)

class NaturalnessEvaluator:
    def __init__(self,ranges): # Ranges for each feature for min-max scaling
        self.ranges = ranges
        self.nlp = spacy.load("en_core_web_sm")
        self.nh = NaturalnessHelper()
        self.weights = {
            'Average Dependency tree heights': 0.2826426317853948,
            'average_sentence_lengths': 0.2522139996530825,
            'avg_left_subtree_height': 0.23287886122532872,
            'avg_right_subtree_height': 0.2458490930520618,
        }

    def default(self,text):
        naturalness = self.calculate_naturalness(text)
        return naturalness

    def calculate_naturalness(self,text):
        avg_sentence_length = self.nh.avg_sentence_length(text)
        avg_dep_tree_ht = self.nh.calculate_average_tree_height([text])
        avg_left_subtree_height, avg_right_subtree_height = self.nh.calculate_subtree_features(text)
        features = np.array([avg_dep_tree_ht,avg_sentence_length,avg_left_subtree_height,avg_right_subtree_height])
        zipped_features = list(zip(features,self.ranges))
        scaled_features = []
        for feature,tup in zipped_features:
            scaled_features.append(self.min_max_scaling(feature,tup))
        inverses = [1.0-feature for feature in scaled_features]
        naturalness_score = np.mean(np.dot(inverses, list(self.weights.values())))
        return naturalness_score

    def min_max_scaling(self,feature,range):
        scaled_feature = (feature-range[0])/(range[1]-range[0])
        return scaled_feature
    
