from summac.model_summac import SummaCZS, SummaCConv
from summac.model_guardrails import NERInaccuracyPenalty

from pprint import pprint
import json
def save_json(data, filepath=r'new_data.json'):
    with open(filepath, 'w', encoding='utf-8') as fp:
        json.dump(data, fp, indent=4)
if __name__ == "__main__":
    # model_zs = SummaCZS(granularity="sentence", model_name="vitc", device="cpu") # If you have a GPU: switch to: device="cuda"
    # model_conv = SummaCConv(models=["vitc"], bins='percentile', granularity="sentence", nli_labels="e", device="cpu", start_file="default", agg="mean")
    model_ner = NERInaccuracyPenalty()
    dataset = json.load(open("df_summaries.json"))
    for datum in dataset[:2]:
        document = datum["text"]
        summary = datum["summary"]
        # score = model_conv.score([document], [summary])
        score = model_ner.score([document], [summary])
        # datum["faithfulness"] = score["scores"][0]
        pprint(score)
        print("=================================")
    # save_json(dataset, "df_summaries_faithfulness.json")

    # document = """Scientists are studying Mars to learn about the Red Planet and find landing sites for future missions.
    # One possible site, known as Arcadia Planitia, is covered in strange sinuous features.
    # The shapes could be signs that the area is actually made of glaciers, which are large masses of slow-moving ice.
    # Arcadia Planitia is in Mars' northern lowlands."""

    # summary1 = "There are strange shape patterns on Arcadia Planitia. The shapes could indicate the area might be made of glaciers. This makes Arcadia Planitia ideal for future missions."
    # # score_zs1 = model_zs.score([document], [summary1])
    # score_zs1 = {"scores": [0.000]}
    # score_conv1 = model_conv.score([document], [summary1])
    # print("[Summary 1] SummaCZS Score: %.3f; SummacConv score: %.3f" % (score_zs1["scores"][0], score_conv1["scores"][0])) # [Summary 1] SummaCZS Score: 0.582; SummacConv score: 0.536

    # summary2 = "There are strange shape patterns on Arcadia Planitia. The shapes could indicate the area might be made of glaciers."
    # # score_zs2 = model_zs.score([document], [summary2])
    # score_zs2 = {"scores": [0.000]}
    # score_conv2 = model_conv.score([document], [summary2])
    # print("[Summary 2] SummaCZS Score: %.3f; SummacConv score: %.3f" % (score_zs2["scores"][0], score_conv2["scores"][0])) # [Summary 2] SummaCZS Score: 0.877; SummacConv score: 0.709
