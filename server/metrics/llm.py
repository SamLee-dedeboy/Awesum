from openai import OpenAI
import json 
class LLMEvaluator:
    def __init__(self, api_key):
        self.client=OpenAI(api_key=api_key)

    def request_chatgpt_gpt4(self, messages, format=None):
        model = 'gpt-3.5-turbo-1106'
        # model = "gpt-4-1106-preview"
        if format == "json":
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={ "type": "json_object" }
            )
        else:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
            )
        return response.choices[0].message.content

    def predict_writer_better(self, full_text, writer_summary, llm_summary):
        messages = [
            {
                'role': 'system',
                'content': """
                You are a summarization evaluator. You will be shown a full text and two summaries.
                Reply with the following JSON format:
                {{ prediction: 0 | 1 | 2 }}
                0: Equally Good
                1: Summary 1 is better
                2: Summary 2 is better
                """
            },
            {
                'role': 'user',
                'content': """
                Full Text: {}\n,
                Summary 1: {}\n,
                Summary 2: {}\n
                """.format(full_text, writer_summary, llm_summary)
            }
        ]
        try:
            res = json.loads(self.request_chatgpt_gpt4(messages, format="json"))
            res = res['prediction']
            if res == 1:
                return True
            elif res == 2:
                return False
            elif res == 0:
                return 'Equally Good'
            else:
                print("oops")
                return self.predict_writer_better(full_text, writer_summary, llm_summary)
        except Exception as e:
            print(e)
            return self.predict_writer_better(full_text, writer_summary, llm_summary)
