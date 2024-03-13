import type { tMetricStep } from "lib/types"
// export const metrics = ["flesch_kincard", "dale_chall", "gunning_fog", "mtld", "formality", "hdd", "sentiment"]
export const metrics = ["complexity", "formality", "sentiment", "faithfulness", "naturalness", "length"]
export let metric_abbrs = {
    "complexity": "cpx",
    "formality": "fml",
    "sentiment": "sst",
    "faithfulness": "fth",
    "naturalness": "ntr",
    "length": "len",
}
export const metric_category_rotates = [true, true, false, false, false, false]
export const metric_categories: {[key:string]: tMetricStep[]} = {
    "complexity": [
        {
            start: 0,
            end: 10,
            "label": "Elementary",
            "note": "Very easy to read. Easily understood by an 11-year-old student."
        },
        {
            start: 10,
            end: 40,
            "label": "Middle School",
            "note": "Plain English. Easily understood by middle school students."
        },
        {
            start: 40,
            end: 50,
            "label": "High School",
            "note": "Fairly difficult to read. Best understood by high school students."
        },
        {
            start: 50,
            end: 90,
            "label": "College",
            "note": "Difficult to read. Best understood by college students."
        },
        {
            start: 90,
            end: 100,
            "label": "Professional",
            "note": "Extremely difficult to read. Best understood by university graduates."
        },
    ],
    "formality": [
        {
            start: 0,
            end: 30,
            "label": "Very Informal",
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
            "label": "Standard",
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
            "label": "Very Formal",
            "note": "Highly technical or legal language."
        }
    ],
    "sentiment": [
        {
            start: -1,
            end: -0.3,
            "label": "Negative",
            "note": "negative sentiment."
        },
        {
            start: -0.3,
            end: 0.3,
            "label": "Neutral",
            "note": "neutral sentiment."
        },
        {
            start: 0.3,
            end: 1,
            "label": "Positive",
            "note": "positive sentiment."
        }
    ],
    "naturalness": [
        {
            start: 0,
            end: 0.4352518900573824,
            "label": "Bad",
            "note": "Summary is not natural or human-like"
        },
        {
            start: 0.4352518900573824,
            end: 0.607625718803343,
            "label": "Low",
            "note": "summary is somewhat natural and human-like"
        },
        {
            start: 0.607625718803343,
            end: 0.7156745588358897,
            "label": "Avg",
            "note": "Summary is mostly natural and human-like"
        },
        {
            start: 0.7156745588358897,
            end: 1.0,
            "label": "Good",
            "note": "Summary is natural and human-like"
        },
    ],
    "faithfulness": [
        {
            start: 0,
            end: 0.25,
            "label": "Bad",
            "note": "All or Almost all of the important entities from the article are missing in the generated summary"
        },
        {
            start: 0.25,
            end: 0.4,
            "label": "Low",
            "note": "Very few of the important entities from the article are present in the generated summary"
        },
        {
            start: 0.4,
            end: 0.6,
            "label": "Avg",
            "note": "Few of the important entities from the article are missing in the generated summary"
        },
        {
            start: 0.6,
            end: 1.0,
            "label": "Good",
            "note": "All or almost all of the important entities from the article are present in the generated summary"
        },
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
export const metric_steps: {[key:string]: number} = {
    "complexity": 1,
    "formality": 1,
    "sentiment": 0.1,
    "faithfulness": 0.1,
    "naturalness": 0.1,
    "length": 10
}
export const categorize_metric = ( metric: string, value: number ): string => {
    const ranges = metric_categories[metric]
    for (let i = 0; i < ranges.length; i++) {
        if (value >= ranges[i].start && (value <= ranges[i].end || ranges[i].end === -1)) {
            return ranges[i].label
        }
    }
    console.log(metric, value, ranges)
    return "error"
}
export const range_to_categories = (metric: string, range: [number, number]): string[] => {
    let categories: string[] = []
    const metric_ranges = metric_categories[metric] 
    metric_ranges.forEach(category_range => {
        if (category_range.start >= range[1]) return
        if (category_range.end !== -1 && category_range.end <= range[0]) return
        categories.push(category_range.label)
    })
    return categories
}

export const feature_descriptions = {
    "complexity": `<span class="highlight">Complexity</span> metrics aim to quantify the readability of a piece of writing by considering various linguistic features, such as <span> sentence length, word length, syllable count or semantic difficulty</span>.`,
    "formality": `<span class="highlight">Formality</span> measures how formal a piece of writing is. It is based on the frequencies of different word classes in the corpus. <span> Nouns, adjectives, articles and prepositions </span> are more frequent in formal styles; <span>pronouns, adverbs, verbs and interjections </span> are more frequent in informal styles.`,
    "sentiment": `<span class="highlight">Sentiment</span> aims to determine the attitude of a writer with respect to the overall contextual polarity.`,
    "faithfulness": `<span class="highlight">Faithfulness</span> measures how broad and accurate are the generated summary using the <span>name entity overlap</span> between the summary and the article. Common named entities include <span>persons, organizations, locations, or dates</span>.`,
    "naturalness": `<span class="highlight">Naturalness</span> measures how human-like the summary is. It is based on the <span>grammaticality, fluency, and coherence</span> of the summary.`,
    "length": `<span class="highlight"> Length</span> measures the <span>number of words</span> in the summary.`,
}