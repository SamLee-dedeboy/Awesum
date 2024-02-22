import concurrent
from tqdm import tqdm
import copy

def request_chatgpt_gpt4(client, messages, format=None):
    model = 'gpt-3.5-turbo-0125'
    # model="gpt-4-1106-preview"
    if format == "json":
        response = client.chat.completions.create(
            # model="gpt-4-1106-preview",
            model = model,
            messages=messages,
            response_format={ "type": "json_object" },
            temperature=0,
        )
    else:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0,
        )
    return response.choices[0].message.content

def multithread_prompts(client, prompts):
    l = len(prompts)
    # results = np.zeros(l)
    with tqdm(total=l) as pbar:
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=len(prompts))
        futures = [executor.submit(request_chatgpt_gpt4, client, prompt) for prompt in prompts]
        for _ in concurrent.futures.as_completed(futures):
            pbar.update(1)
    concurrent.futures.wait(futures)
    return [future.result() for future in futures]

def combine_templates(instruction: str, examples: list, data_template: str):
    messages = [
        {
            "role": "system",
            "content": instruction
        }
    ] 
    for example in examples:
        insert_data_messages = replace_data(data_template, example)
        messages.append({
            "role": "user",
            "content": insert_data_messages
        })
        messages.append({
            "role": "assistant",
            "content": example['summary']
        })
    messages.append({
        "role": "user",
        "content": data_template
    })
    return messages

def replace_data(message:str, data):
    replaced = copy.deepcopy(message)
    replaced = replaced.replace("${summary}", data['summary'])
    replaced = replaced.replace("${text}", data['text'])
    return replaced

def formulate_metric_prompt(question, feature_definitions):
    messages = [
        {
            "role": "system",
            "content": """You are an evaluation aspect recommendation given. 
            You are given a list of features and their definitions: {feature_definitions}
            The user will ask you to recommend the features that best fit their needs.""".format(feature_definitions=feature_definitions)
        },
        {
            "role": "user",
            "content": "What are the best features for being academic and professional?"
        },
        {
            "role": "assistant",
            "content": "The best features for being academic and professional are: Formality, Readability and Length."
        },
        {
            "role": "user",
            "content": question
        }
    ]
    return messages