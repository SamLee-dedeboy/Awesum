import nltk
import numpy as np
import matplotlib.pyplot as plt
import stanza
from transformers import pipeline
import spacy
from collections import Counter   

class naturalness:
    def __init__(self,df): #Pass empty string to load all processors or choose from the above options and pass in 1 comma seperated string
        self.nlp = spacy.load("en_core_web_sm")
        self.weights = {
            'Average Dependency tree heights': 0.2826426317853948,
            'average_sentence_lengths': 0.2522139996530825,
            'avg_left_subtree_height': 0.23287886122532872,
            'avg_right_subtree_height': 0.2458490930520618,
        }
        self.range_avg_dep_tree_ht = (min(df['Writer Average Dependency tree heights'].min(),df['LLM Average Dependency tree heights'].min()),max(df['Writer Average Dependency tree heights'].max(),df['LLM Average Dependency tree heights'].max()))
        self.range_avg_sentence_length = (min(df['writer_average_sentence_lengths'].min(),df['LLM_average_sentence_lengths'].min()),max(df['writer_average_sentence_lengths'].max(),df['LLM_average_sentence_lengths'].max()))
        self.range_avg_left_subtree_ht = (min(df['writer_avg_left_subtree_height'].min(),df['LLM_avg_left_subtree_height'].min()),max(df['writer_avg_left_subtree_height'].max(),df['LLM_avg_left_subtree_height'].max()))
        self.range_avg_right_subtree_ht = (min(df['writer_avg_right_subtree_height'].min(),df['LLM_avg_right_subtree_height'].min()),max(df['writer_avg_right_subtree_height'].max(),df['LLM_avg_right_subtree_height'].max()))
        self.ranges = np.array([self.range_avg_dep_tree_ht,self.range_avg_sentence_length,self.range_avg_left_subtree_ht,self.range_avg_right_subtree_ht])

    def naturalness_helper(self,features, weights):
        inverses = 1.0-features
        naturalness_score = np.mean(np.dot(inverses, weights))
        return naturalness_score

    def min_max_scaling(self,feature,range):
        scaled_feature = (feature-range[0])/(range[1]-range[0])
        return scaled_feature

    def calculate_naturalness(self,text):
        avg_sentence_length = self.avg_sentence_length(text)
        avg_dep_tree_ht = self.calculate_average_tree_height([text])
        avg_left_subtree_height, avg_right_subtree_height = self.calculate_subtree_features(text)
        features = np.array([avg_dep_tree_ht,avg_sentence_length,avg_left_subtree_height,avg_right_subtree_height])
        zipped_features = list(zip(features,self.ranges))
        scaled_features = []
        for feature,tup in zipped_features:
            scaled_features.append(self.min_max_scaling(feature,tup))
        naturalness = self.naturalness_helper(np.array(scaled_features),np.array(list(self.weights.values())))
        return naturalness
    
    def calculate_subtree_features(self,text):
        doc = self.nlp(text)

        def subtree_features(token):
            lefts = list(token.lefts)
            rights = list(token.rights)

            # Count the number of left and right subtrees
            num_left_subtrees = len(lefts)
            num_right_subtrees = len(rights)

            # Calculate the average left and right subtree height
            avg_left_subtree_height = sum(t._.depth for t in lefts) / num_left_subtrees if num_left_subtrees > 0 else 0
            avg_right_subtree_height = sum(t._.depth for t in rights) / num_right_subtrees if num_right_subtrees > 0 else 0
            return num_left_subtrees, num_right_subtrees, avg_left_subtree_height, avg_right_subtree_height
        
        spacy.tokens.Token.set_extension('depth', getter=lambda token: len(list(token.ancestors)), force=True)
        total_left_subtrees = 0
        total_right_subtrees = 0
        total_left_subtree_height = 0
        total_right_subtree_height = 0
        for sent in doc.sents:
            for token in sent:
                num_left_subtrees, num_right_subtrees, avg_left_subtree_height, avg_right_subtree_height = subtree_features(token)
                total_left_subtrees += num_left_subtrees
                total_right_subtrees += num_right_subtrees
                total_left_subtree_height += avg_left_subtree_height * num_left_subtrees
                total_right_subtree_height += avg_right_subtree_height * num_right_subtrees
        avg_left_subtree_height_text = total_left_subtree_height / total_left_subtrees if total_left_subtrees > 0 else 0
        avg_right_subtree_height_text = total_right_subtree_height / total_right_subtrees if total_right_subtrees > 0 else 0

        return avg_left_subtree_height_text,avg_right_subtree_height_text
    
    def calculate_average_tree_height(self,text_list):
        total_tree_height = 0
        num_trees = 0
        for text in text_list:
            doc = self.nlp(text)
            stack = [(sent.root, 1) for sent in doc.sents]

            while stack:
                node, depth = stack.pop()
                total_tree_height += depth
                num_trees += 1
                stack.extend((child, depth + 1) for child in node.children)
        avg_tree_height = total_tree_height / max(1, num_trees)
        return avg_tree_height
    
    def avg_sentence_length(self,text):
        total_tokens = 0
        sentences= nltk.sent_tokenize(text)
        total_tokens = sum(len(sentence.split()) for sentence in sentences)
        average_length= total_tokens / len(sentences)
        return average_length

class LinguisticFeatures:

    # Processor Options: tokenize, mwt (multi-word-tokens processor), pos (universal pos, treebank-specific POS (XPOS),  universal morphological features (UFeats)), 
    # lemma, depparse(dependency parsing), ner, sentiment(-ve,neutral,+ve), constituency
    
    def __init__(self,processors = None, use_gpu=False): #Pass empty string to load all processors or choose from the above options and pass in 1 comma seperated string
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
        # displacy.render(doc, style='dep', jupyter=True, options={'distance': 120})
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
    
    def calculate_subtree_features(self,text):
        doc = self.nlp(text)

        def subtree_features(token):
            lefts = list(token.lefts)
            rights = list(token.rights)

            # Count the number of left and right subtrees
            num_left_subtrees = len(lefts)
            num_right_subtrees = len(rights)

            # Calculate the average left and right subtree height
            avg_left_subtree_height = sum(t._.depth for t in lefts) / num_left_subtrees if num_left_subtrees > 0 else 0
            avg_right_subtree_height = sum(t._.depth for t in rights) / num_right_subtrees if num_right_subtrees > 0 else 0
            return num_left_subtrees, num_right_subtrees, avg_left_subtree_height, avg_right_subtree_height
        
        spacy.tokens.Token.set_extension('depth', getter=lambda token: len(list(token.ancestors)), force=True)
        total_left_subtrees = 0
        total_right_subtrees = 0
        total_left_subtree_height = 0
        total_right_subtree_height = 0
        for sent in doc.sents:
            for token in sent:
                num_left_subtrees, num_right_subtrees, avg_left_subtree_height, avg_right_subtree_height = subtree_features(token)
                total_left_subtrees += num_left_subtrees
                total_right_subtrees += num_right_subtrees
                total_left_subtree_height += avg_left_subtree_height * num_left_subtrees
                total_right_subtree_height += avg_right_subtree_height * num_right_subtrees
        avg_left_subtree_height_text = total_left_subtree_height / total_left_subtrees if total_left_subtrees > 0 else 0
        avg_right_subtree_height_text = total_right_subtree_height / total_right_subtrees if total_right_subtrees > 0 else 0

        return {
            "avg_left_subtree_height": avg_left_subtree_height_text,
            "avg_right_subtree_height": avg_right_subtree_height_text,
            "num_left_subtrees": total_left_subtrees,
            "num_right_subtrees": total_right_subtrees,
            }

    def calculate_average_tree_height(self,text_list):
        total_tree_height = 0
        num_trees = 0
        for text in text_list:
            doc = self.nlp(text)
            stack = [(sent.root, 1) for sent in doc.sents]

            while stack:
                node, depth = stack.pop()
                total_tree_height += depth
                num_trees += 1
                stack.extend((child, depth + 1) for child in node.children)
        avg_tree_height = total_tree_height / max(1, num_trees)
        return avg_tree_height

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

    def phrase_counts(self,text):
        doc = self.nlp(text)
        # Extract noun phrases (NP), verb phrases (VP), and adjective phrases (ADJP)
        np = [chunk for chunk in doc.noun_chunks]
        vp = [chunk for chunk in doc.noun_chunks if chunk.root.pos_ == 'VERB']
        adjp = [chunk for chunk in doc.noun_chunks if chunk.root.pos_ == 'ADJ']
        # Print the results
        print(f'Number of NP subtrees: {len(np)}, Mean length of NP subtrees: {sum(len(chunk) for chunk in np) / len(np) if np else 0}')
        print(f'Number of VP subtrees: {len(vp)}, Mean length of VP subtrees: {sum(len(chunk) for chunk in vp) / len(vp) if vp else 0}')
        print(f'Number of ADJP subtrees: {len(adjp)}, Mean length of ADJP subtrees: {sum(len(chunk) for chunk in adjp) / len(adjp) if adjp else 0}')


    def count_dependency_arcs(self,data):
        
        left_arcs = []
        right_arcs = []
        left_arc_lengths = []
        right_arc_lengths = []
        dependency_arcs = {}

        docs = [self.nlp(text) for text in data]

        dependency_arcs['number of sentences'] = 0
        for doc in docs:
            dependency_arcs['number of sentences']+=len(list(doc.sents))
            for token in doc:
                left_arcs.extend([token.dep_ for _ in token.lefts])
                right_arcs.extend([token.dep_ for _ in token.rights])
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

    def average_word_length_instance(self,text):
        doc = self.nlp(text)
        words = [token.text for token in doc if not token.is_punct and not token.is_space]
        total_length = sum(len(word) for word in words)
        num_words = len(words)
        average_word_length = total_length / num_words if num_words > 0 else 0
        return average_word_length

    def average_word_length_system(self,text_list):
        total_length = 0
        num_words = 0
        for text in text_list:
            doc = self.nlp(text)
            words = [token.text for token in doc if not token.is_punct and not token.is_space]
            total_length += sum(len(word) for word in words)
            num_words += len(words)
        average_word_length = total_length / num_words if num_words > 0 else 0
        return average_word_length

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
   
    def avg_sentence_length(self,text):
        total_tokens = 0
        sentences= nltk.sent_tokenize(text)
        total_tokens = sum(len(sentence.split()) for sentence in sentences)
        average_length= total_tokens / len(sentences)
        return average_length

    def avg_sentence_length_dataset(self,summaries):
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
    