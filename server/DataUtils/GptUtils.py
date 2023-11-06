import requests
def binary_search_threshold(docs, query):
    # binary search to find the most appropriate threshold
    start = 0
    end = len(docs)
    mid = len(docs) // 2
    binary_search_threshold = 5
    while True:
        quality = evaluate_fitness(docs[mid][0], query) # returns 'Relevant' or 'Irrelevant'
        print(mid, quality, docs[mid][0])
        if quality == 'Relevant':
            start = mid
            mid = (mid + end) // 2
        else:
            end = mid
            mid = (mid + start) // 2

        if mid - start <= binary_search_threshold or end - mid <= binary_search_threshold:
            break
    return docs[mid][1]

def evaluate_fitness(doc, query):
    template = """
    Article: {news} \n\n\n
    Do you think the article is talking about: {topic}? \n\n\n
    """
    messages = [
        {
            "role": "system",
            "content": """
                You are a news article filtering system.
                The user will provide you with an article and a topic, your job is to decide whether the article is talking about the topic.
                Reply with 'Relevant' or 'Irrelevant'.
            """,
        },
        { "role": "user", "content": template.format(news=doc, topic=query)}
    ]
    response = request_chatgpt_gpt4(messages)
    if 'Irrelevant' in response:
        return 'Irrelevant'
    elif 'Relevant' in response:
        return 'Relevant'
    else:
        return 'Irrelevant'

def generate_summary_message(target_hyperedges, hyperedges):
    summaries = [hyperedges[hyperedge_id]['summary'] for hyperedge_id in target_hyperedges]
    summaries_message = ""
    for index, summary in enumerate(summaries):
        summaries_message += "Article {}: \n".format(index+1)
        summaries_message += summary + '\n\n\n'
    return summaries_message

def explain_articles(target_hyperedge_ids, hyperedges_dict, example_summaries, example_noun_phrase):
    summaries = [hyperedges_dict[hyperedge_id]['summary'] for hyperedge_id in target_hyperedge_ids]
    summaries_message = ""
    for index, summary in enumerate(summaries):
        summaries_message += "Article {}: \n".format(index+1)
        summaries_message += summary + '\n\n\n'
    messages = [
        { 
            "role": "system", 
            "content": """
                You are a news article summarization system. 
                The user will provide you with a set of summarized news articles, your job is to further summarize them into one noun phrase.
                Use words that are already in the articles, and try to use as few words as possible.
            """
        },
        { "role": "system", "name": "example_user", "content": example_summaries},
        { "role": "system", "name": "example_system", "content": example_noun_phrase},
        { "role": "user", "content": summaries_message}
    ]
    topic = request_chatgpt_gpt4(messages)
    return topic

def request_chatgpt_gpt4(messages):
    url = "http://127.0.0.1:5000/event_hgraph"
    body = {"messages": messages}
    response = requests.post(url, json=body).json()
    gpt_response = response['choices'][0]['message']['content'].strip()
    return gpt_response
