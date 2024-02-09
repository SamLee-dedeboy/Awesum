import nltk
import torch
import ot
from nltk.corpus import stopwords
from time import time
import os
import numpy as np
import pandas as pd
import json
import matplotlib.pyplot as plt
import stanza
from transformers import pipeline
import spacy
from spacy import displacy
from collections import Counter
from nltk.parse.corenlp import CoreNLPDependencyParser
nltk.download('stanford-corenlp')
nltk.download('stanford-corenlp-4.2.0')
stanza.download('en')       

class Taggers:

    # Processor Options: tokenize, mwt (multi-word-tokens processor), pos (universal pos, treebank-specific POS (XPOS),  universal morphological features (UFeats)), 
    # lemma, depparse(dependency parsing), ner, sentiment(-ve,neutral,+ve), constituency
    
    def __init__(self,processors = None, use_gpu=False,): #Pass empty string to load all processors or choose from the above options and pass in 1 comma seperated string
        self.processors = processors
        self.model = stanza.Pipeline(lang = 'en', processors = processors, use_gpu = use_gpu)
        self.use_gpu = use_gpu
        self.nlp = spacy.load("en_core_web_sm")
        self.male_pronouns = ['he', 'him', 'his', 'himself']
        self.female_pronouns = ['she', 'her', 'hers', 'herself']
        # stanford_corenlp_jar = 'path/to/stanford-corenlp-4.2.0/stanford-corenlp-4.2.0.jar'
        # self.dep_parser = CoreNLPDependencyParser(url='http://localhost:9000', corenlp_jar=stanford_corenlp_jar)

    def stanza_tagger(self,inp):
        # input_multiple = [stanza.Document([], text=d) for d in inp] # Passing List of documents.
        res = self.model(inp)
        return res
    
    def spacy_tagger(self,inp):
        doc = self.nlp(inp)
        output = [(token.text, token.pos_, token.dep_) for token in doc]
        displacy.render(doc, style='dep', jupyter=True, options={'distance': 120})
        return output
    
    def spacy_tagger_dataset(self,data):
        tags_writer = []
        tags_llm = []
        tags_article = []
        for i,datum in enumerate(data):
            doc_writer = self.nlp(datum['writer_summary'])
            doc_article = self.nlp(datum['article_text'])
            doc_llm = self.nlp(datum['text-davinci-002_summary'])
            tags_writer.append([(token.text, token.pos_, token.dep_) for token in doc_writer])
            tags_llm.append([(token.text, token.pos_, token.dep_) for token in doc_llm])
            tags_article.append([(token.text, token.pos_, token.dep_) for token in doc_article])
            # displacy.render(doc, style='dep', jupyter=True, options={'distance': 120})
        return tags_writer,tags_llm,tags_article
    
    def count_tags_percentage(self,tags):
        tag_counts ={}
        total_words = 0

        for summ in tags:
            for tuple in summ:
                if(tuple[1] in tag_counts.keys()): 
                    tag_counts[tuple[1]]+=1
                    total_words+=1
                else: 
                    tag_counts[tuple[1]] = 1
                    total_words+=1
        for tags in tag_counts:
            tag_counts[tags] = (tag_counts[tags]/total_words)*100

        return tag_counts

    def count_dependency_arcs(self,data):
        
        left_arcs = []
        right_arcs = []
        left_arc_lengths = []
        right_arc_lengths = []
        dependency_arcs = {}

        docs = [self.nlp(text) for text in data]

        dependency_arcs['number of sentences'] = 0
        for doc in docs:
            for token in doc:
                left_arcs.extend([token.dep_ for _ in token.lefts])
                right_arcs.extend([token.dep_ for _ in token.rights])
                dependency_arcs['number of sentences']+=len(list(doc.sents))
                for child in token.children:
                    if child.i < token.i: 
                        left_arc_lengths.append(abs(token.i - child.i))
                    else: 
                        right_arc_lengths.append(abs(token.i - child.i))

        dependency_arcs['average left arc length'] = sum(list(filter(lambda x: (x),left_arc_lengths)))/len(left_arc_lengths)
        dependency_arcs['average right arc length'] = sum(list(filter(lambda x: (x),right_arc_lengths)))/len(right_arc_lengths)
        dependency_arcs['average total arc length'] = ( sum(list(filter(lambda x: (x),right_arc_lengths)))+sum(list(filter(lambda x: (x),left_arc_lengths))))/(len(left_arc_lengths)+len(right_arc_lengths))     

        total_arcs = left_arcs + right_arcs
        dependency_arcs['right arc percentage'] = (len(right_arcs)/len(total_arcs))*100
        dependency_arcs['left arc percentage'] = (len(left_arcs)/len(total_arcs))*100

        dependency_arcs['standard deviation left arcs'] = np.std(left_arc_lengths)
        dependency_arcs['standard deviation right arcs'] = np.std(right_arc_lengths)
        dependency_arcs['standard deviation total arcs'] = np.std(left_arc_lengths+right_arc_lengths) 
        
        return dependency_arcs

    def gender_ratio_single(self,data): # Single string input
        male_count = 0
        female_count = 0
        doc = self.nlp(data)
        counter = Counter(token.text.lower() for token in doc if token.pos_ == 'PRON')
        male_count += sum(counter[pronoun] for pronoun in self.male_pronouns)
        female_count += sum(counter[pronoun] for pronoun in self.female_pronouns)
        return  male_count/female_count if female_count else 0
    
    def gender_ratio_dataset(self,data): # dataset input
        male_count_writer = 0
        female_count_writer = 0
        male_count_llm = 0
        female_count_llm = 0
        male_count_article = 0
        female_count_article = 0
        for i,datum in enumerate(data):
            print('{}/{}'.format(i, len(data)))
            doc_writer = self.nlp(datum['writer_summary'])
            doc_llm = self.nlp(datum['text-davinci-002_summary'])
            doc_article = self.nlp(datum['article_text'])

            counter_writer = Counter(token.text.lower() for token in doc_writer if token.pos_ == 'PRON')
            counter_llm = Counter(token.text.lower() for token in doc_llm if token.pos_ == 'PRON')
            counter_article = Counter(token.text.lower() for token in doc_article if token.pos_ == 'PRON')
            
            male_count_writer += sum(counter_writer[pronoun] for pronoun in self.male_pronouns)
            female_count_writer += sum(counter_writer[pronoun] for pronoun in self.female_pronouns)

            male_count_llm += sum(counter_llm[pronoun] for pronoun in self.male_pronouns)
            female_count_llm += sum(counter_llm[pronoun] for pronoun in self.female_pronouns)

            male_count_article += sum(counter_article[pronoun] for pronoun in self.male_pronouns)
            female_count_article += sum(counter_article[pronoun] for pronoun in self.female_pronouns)

        return male_count_writer/female_count_writer, male_count_llm/female_count_llm, male_count_article/female_count_article
   
    def avg_sentence_length(self,summaries):
        total_length_writer = 0
        total_length_llm = 0
        total_length_article = 0
        len_writer = 0
        len_llm = 0
        len_article = 0

        for i,datum in enumerate(summaries):
            sentences_writer = nltk.sent_tokenize(datum['writer_summary'])
            len_writer+=len(sentences_writer)
            sentences_llm = nltk.sent_tokenize(datum['text-davinci-002_summary'])
            len_llm+=len(sentences_llm)
            sentences_article = nltk.sent_tokenize(datum['article_text'])
            len_article+=len(sentences_article)

            
            total_length_writer += sum(len(sentence.split()) for sentence in sentences_writer)
            total_length_llm += sum(len(sentence.split()) for sentence in sentences_llm)
            total_length_article += sum(len(sentence.split()) for sentence in sentences_article)

        average_length_writer = total_length_writer / len_writer
        average_length_llm = total_length_llm / len_llm
        average_length_article = total_length_article / len_article
        
       
        return average_length_writer,average_length_llm,average_length_article

class Emotions:

    def __init__(self,top_k = None): 
        self.top_k = top_k
        self.classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=self.top_k)

    def sentiments(self,input):
        return self.classifier(input)