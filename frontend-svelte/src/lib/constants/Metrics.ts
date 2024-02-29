import type { tMetricStep } from "lib/types"
// export const metrics = ["flesch_kincard", "dale_chall", "gunning_fog", "mtld", "formality", "hdd", "sentiment"]
export const metrics = ["readability", "formality", "sentiment", "faithfulness", "length"]
export let metric_abbrs = {
    "readability": "read",
    "formality": "fml",
    "sentiment": "sst",
    "faithfulness": "fth",
    "length": "len",
}
export const metric_category_rotates = [true, true, false, false, false]
export const metric_categories: {[key:string]: tMetricStep[]} = {
    "readability": [
        {
            start: 0,
            end: 10,
            "label": "Professional",
            "note": "Extremely difficult to read. Best understood by university graduates."
        },
        {
            start: 10,
            end: 30,
            "label": "College graduate",
            "note": "Very difficult to read. Best understood by university graduates."
        },
        {
            start: 30,
            end: 50,
            "label": "College",
            "note": "Difficult to read."
        },
        {
            start: 50,
            end: 60,
            "label": "10-12 grade",
            "note": "Fairly difficult to read."
        },
        {
            start: 60,
            end: 70,
            "label": "8-9 grade",
            "note": "Plain English. Easily understood by 13- to 15-year-old students."
        },
        {
            start: 70,
            end: 80,
            "label": "7 grade",
            "note": "Fairly easy to read."
        },
        {
            start: 80,
            end: 90,
            "label": "6 grade",
            "note": "Easy to read. Conversational English for consumers."
        },
        {
            start: 90,
            end: 100,
            "label": "5 grade",
            "note": "Very easy to read. Easily understood by an 11-year-old student."
        }
    ],
    "formality": [
        {
            start: 0,
            end: 30,
            "label": "Very informal",
            "note": "Casual, conversational language."
        },
        {
            start: 30,
            end: 60,
            "label": "Informal",
            "note": "Everyday language."
        },
        {
            start: 60,
            end: 100,
            "label": "Neutral",
            "note": "Standard, neutral language."
        },
        {
            start: 100,
            end: 200,
            "label": "Formal",
            "note": "Professional or academic language."
        },
        {
            start: 200,
            end: -1,
            "label": "Very formal",
            "note": "Highly technical or legal language."
        }
    ],
    "sentiment": [
        {
            start: -1,
            end: -0.3,
            "label": "negative",
            "note": "negative sentiment."
        },
        {
            start: -0.3,
            end: 0.3,
            "label": "neutral",
            "note": "neutral sentiment."
        },
        {
            start: 0.3,
            end: 1,
            "label": "positive",
            "note": "positive sentiment."
        }
    ],
    "faithfulness": [
        {
            start: 0,
            end: 0.2,
            "label": "unfaithful",
            "note": "Very unfaithful to the original text."
        },
        {
            start: 0.2,
            end: 1,
            "label": "faithful",
            "note": "Very faithful to the original text."
        }
    ],
    "length": [
        {
            start: 0,
            end: 100,
            "label": "Short",
            "note": "Under 100 words."
        },
        {
            start: 100,
            end: 300,
            "label": "Mid",
            "note": "100 to 300 words."
        },
        {
            start: 300,
            end: 500,
            "label": "Long",
            "note": "300 to 600 words."
        },
        {
            start: 500,
            end: -1,
            "label": "Very long",
            "note": "Over 500 words."
        }
    ]
}

export const categorize_metric = ( metric: string, value: number ): string => {
    const ranges = metric_categories[metric]
    for (let i = 0; i < ranges.length; i++) {
        if (value >= ranges[i].start && (value < ranges[i].end || ranges[i].end === -1)) {
            return ranges[i].label
        }
    }
    return "error"
}
export const feature_descriptions = {
    "readability": `<span class="highlight">Readability</span> metrics aim to quantify the readability of a piece of writing by considering various linguistic features, such as <span> sentence length, word length, syllable count or semantic difficulty</span>.`,
    "formality": `<span class="highlight">Formality</span> measures how formal a piece of writing is. It is based on the frequencies of different word classes in the corpus. <span> Nouns, adjectives, articles and prepositions </span> are more frequent in formal styles; <span>pronouns, adverbs, verbs and interjections </span> are more frequent in informal styles.`,
    "sentiment": `<span class="highlight">Sentiment</span> aims to determine the attitude of a writer with respect to the overall contextual polarity.`,
    "faithfulness": `<span class="highlight">Faithfulness</span> measures how broad and accurate are the generated summary using the <span>name entity overlap</span> between the summary and the article. Common named entities include <span>persons, organizations, locations, or dates</span>.`,
    "length": `<span class="highlight"> Length</span> measures the <span>number of words</span> in the summary.`,
}