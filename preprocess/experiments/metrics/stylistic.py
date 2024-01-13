from lexical_diversity import lex_div as ld
from readability import Readability
import textstat
from textblob import TextBlob
import nltk
from nltk.tokenize import word_tokenize
from nltk import pos_tag
from collections import Counter

class ReadabilityEvaluator:
    def __init__(self, text):
        self.text = text
        self.scorer = Readability(text)

    def flesch_kincaid(self):
        fk = self.scorer.flesch_kincaid()
        return (fk.score, fk.grade_level)
    def flesch(self):
        f = self.scorer.flesch()
        return (f.score, f.ease, f.grade_levels)
    def dale_chall(self):
        dc = self.scorer.dale_chall()
        return (dc.score, dc.grade_levels)
    def automated_readability_index(self):
        ari = self.scorer.ari()
        return (ari.score, ari.grade_levels, ari.ages)
    def coleman_liau(self):
        cl = self.scorer.coleman_liau()
        return (cl.score, cl.grade_level)
    def gunning_fog(self):
        gf = self.scorer.gunning_fog()
        return (gf.score, gf.grade_level)
    def spache(self):
        s = self.scorer.spache()
        return (s.score, s.grade_level)
    def linsear_write(self):
        lw = self.scorer.linsear_write()
        return (lw.score, lw.grade_level)
    def smog(self):
        smog = self.scorer.smog()
        return (smog.score, smog.grade_level)

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
    
    def formality(self):
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
    
