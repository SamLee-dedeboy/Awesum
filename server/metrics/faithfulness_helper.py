import numpy as np
from summac.model_guardrails import NERInaccuracyPenalty
import pandas as pd
from fuzzywuzzy import fuzz
import collections
import string

class FaithfulnessHelper:
    def __init__(self):
        self.model_ner = NERInaccuracyPenalty()

    def top_entities_match(self,original_src_ents, generated_entities, article):
        original_src_ents = [dict(zip(d.keys(), d.values())) for sublist in original_src_ents for d in sublist]
        article_lower = article.lower()
        entity_frequencies = {}
        for entity in original_src_ents:
            entity_frequencies[entity['text']] = article_lower.count(entity['text'].lower())
        # add counts of similar entities. 
        for ent1 in entity_frequencies.keys():
            for ent2 in entity_frequencies.keys():
                if fuzz.token_set_ratio(ent1.lower(), ent2.lower()) >=70 and ent1 != ent2:
                    entity_frequencies[ent1]+=entity_frequencies[ent2]
                    entity_frequencies[ent2] = 0
        entity_frequencies = {entity: freq for entity, freq in entity_frequencies.items() if freq > 0}        
        top_source_entities = []
        sorted_entities = sorted(entity_frequencies.items(), key=lambda x: x[1], reverse=True)
        max_entities = len(generated_entities)

        if max_entities<3 and len(sorted_entities)>4:
            max_entities = 5
            top_source_entities = sorted_entities[0:max_entities]  
            
        elif len(sorted_entities)<max_entities:
            top_source_entities = sorted_entities        

        else:
            top_source_entities =  sorted_entities[0:max_entities]  
                                         
        match_count = 0
        for source_entity in top_source_entities:
            for generated_entity in generated_entities:
                if fuzz.token_set_ratio(source_entity[0], generated_entity) >= 70:
                    match_count += 1
        return match_count,top_source_entities

    def get_similar_entities(self,entities):
        bins = collections.defaultdict(list)
        used_entities = set()
        bins = []
        for ents in entities:
            for entity1 in ents:
                bin = []
                if entity1['text'] not in used_entities:
                    for entity2 in ents:
                        if entity2['text'] not in bin and fuzz.token_set_ratio(entity1['text'], entity2['text']) >= 70:
                            bin.append(entity2['text'])
                            if entity1['text'] not in bin:
                                bin.append(entity1['text'])
                            used_entities.add(entity2['text'])
                    used_entities.add(entity1['text'])
                if bin:
                    bins.append(bin)
        return bins

    def replace_similar_entities(self,bins, source_data):
        source_data = [dict(zip(d.keys(), d.values())) for sublist in source_data for d in sublist]
        replaced_data = []
        for entity in source_data:
            # print(entity)
            if entity not in replaced_data and all(fuzz.token_set_ratio(entity['text'],rep)<70 for rep in replaced_data):
            # Check if the entity is a key in the bins
                for bin in bins:
                    if entity['text'] in bin:
                        if bin[0] not in replaced_data and all(fuzz.token_set_ratio(bin[0],rep)<70 for rep in replaced_data): 
                            replaced_data.append(bin[0])
                        break 
        return replaced_data
    
    def replace_punctuation_with_whitespace(self,input_string):
        translator = str.maketrans(string.punctuation, ' ' * len(string.punctuation))
        return input_string.translate(translator)
    
def get_quartiles_faithfulness(df):
    Q1 = np.percentile(df['faithfullness'], 25)
    Q2 = np.percentile(df['faithfullness'], 50)
    Q3 = np.percentile(df['faithfullness'], 75)
    range1 = (df['faithfullness'].min(), Q1)
    range2 = (Q1,Q2)
    range3 = (Q2,Q3)
    range4 = (Q3, df['faithfullness'].max())
    return  np.array([range1,range2,range3,range4])