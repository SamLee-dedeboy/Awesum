import concurrent
from tqdm import tqdm
import copy
from pprint import pprint

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
    replaced = replaced.replace("${article}", data['text'])
    return replaced

def formulate_metric_prompt(question, feature_definitions):
    messages = [
        {
            "role": "system",
            "content": """You are an evaluation feature recommendation assistant. 
            You are given a list of features and their definitions.
            Feature definitions: {feature_definitions}
            The user will ask you to recommend the features that best fit their needs.
            First, tell the user which features they should use.
            Then, tell them what level of the feature they should aim for and briefly explain why.
            Reply with the following JSON format:
            {{ "features": [
                {{ "feature"name": string, "level": string (one of the provided), "explanation": string}},
                {{ "feature"name": string, "level": string (one of the provided), "explanation": string}},
                ...
            ]}}
            """.format(feature_definitions=feature_definitions)
        },
        # {
        #     "role": "user",
        #     "content": "What are the best features for being academic and professional?"
        # },
        # {
        #     "role": "assistant",
        #     "content": "The best features for being academic and professional are: Formality, Readability and Length."
        # },
        {
            "role": "user",
            "content": question
        }
    ]
    return messages

def formulate_feature_definitions_prompt(feature_pool, feature_descriptions):
    definition_prompt = ""
    for feature in feature_pool:
        definitions = feature_descriptions[feature]
        definition_prompt += "{feature}: {description}\n".format(feature=feature, description=definitions["description"])
        for feature_range in definitions["ranges"]:
            definition_prompt += "Between {min} and {max}, the {feature} is at level {level}, which means {explanation}\n".format(min=feature_range[0], max=feature_range[1], feature=feature, level=feature_range[2], explanation=feature_range[3])
    return definition_prompt

def check_metric_recommendation_validity(recommendations, feature_pool, feature_descriptions):
    for recommendation in recommendations['features']:
        feature_name = recommendation['feature_name']
        # check feature name
        if feature_name not in feature_pool:
            return False
        # check level
        level = recommendation['level']
        ranges = feature_descriptions[feature_name]['ranges']
        if level not in [range[2] for range in ranges]:
            return False
    return True

def formulate_prompt_block_suggestion_prompt(block_name, block_definition, current_prompt, goal):
    messages = [
        {
            "role": "system",
            "content": """You are a block recommendation assistant. 
            You are given a {block_name} block.
            Block definition: {block_definition}
            The user has a simple version of {block_name} block content. He wants to know how to improve it.
            Please give suggestions specific to their current prompt and intended goal.
            Point out what is missing or what can be improved according to the {block_name} block definition.
            Be concise and reply with no more than 50 words.
            Respond with a coherent paragraph. Do not use bullet points or lists.
            """.format(block_name=block_name, block_definition=block_definition)
        },
        {
            "role": "user",
            "content": """Current prompt: {current_prompt}\n
            Intended Goal: {goal}""".format(current_prompt=current_prompt, goal=goal)
        }
    ]
    pprint(messages)
    return messages