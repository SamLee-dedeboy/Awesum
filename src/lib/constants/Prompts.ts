export const prompt_block_explanations = {
    "persona": "Specify a fictional or role-based identity for the AI to adopt when responding to prompt. Think about what expertise would best suit the intended task and goal. For example, for a more academic summary, one can ask the model to be a research assistant.",
    "context": "To get a highly relevant response, make sure the requests provide important details or context. Otherwise you are leaving it up to the model to guess what you mean.",
    "constraints": "Specify any requirements or limitations for the AI to follow. For example, you can ask the model to keep the response under a certain length. Note that the AI may not always follow these constraints perfectly.",
    "examples": "An example is worth a thousand words. Providing concrete examples of the type of response you are looking for reduces the ambiguity of the requests.",
    "data": "Here is where you provide the article to be summaries. You can use delimiters like triple quotation marks, XML tags, section titles, etc. to help demarcate sections of text to be treated differently. Use ${article} to insert the article."
}