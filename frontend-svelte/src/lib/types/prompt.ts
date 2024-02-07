export type tMessage = {
    role: string;
    name?: string;
    content: string;
}

export type tExampleData = {
    id: string;
    text: string;
    summary: string;
}
export type tExampleMessage = {
    id: string;
    example_input: string;
    example_output: string
}

export type tPrompt = {
    instruction: string;
    examples: tExampleData[];
    data_template: string;
}