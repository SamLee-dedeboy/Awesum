<script lang="ts">
  import { server_address } from "lib/constants";
  import { metrics } from "lib/constants";
  import type { tNode, tMetricRecommendationResponse } from "lib/types";
  import { createEventDispatcher } from "svelte";
  import {
    selected_metrics,
    // recommended_cluster,
    feature_target_levels,
    target_range_metric,
    feature_recommendations,
  } from "lib/store";
  const dispatch = createEventDispatcher();
  let delayed_user_question_response = "Response will be here...";
  export let data: tNode[];
  export let metric_metadata: any;
  let query_area;
  let loading_response = false;
  // let recommended_cluster = "";
  function handleQuery() {
    const user_question = query_area.textContent;
    query_metric(user_question);
  }

  function query_metric(question: string) {
    console.log(question);
    loading_response = true;
    const feature_pool = $selected_metrics;
    const nodes = data;
    fetch(server_address + "/query_metric/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, feature_pool, nodes }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        // make_delay(data.response);
        feature_recommendations.set(data.features);
        $feature_target_levels = {};
        data.features.forEach((feature: tMetricRecommendationResponse) => {
          $feature_target_levels[feature.feature_name] = feature.level;
        });
        make_delay(make_paragraph(data.features, metric_metadata.correlations));
        // recommended_cluster.set(data.closest_cluster);
        loading_response = false;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function make_delay(text) {
    delayed_user_question_response = "";
    const steps = generate_steps(text);
    console.log(steps);
    steps.forEach((step, i) => {
      setTimeout(function () {
        delayed_user_question_response += step;
      }, i * 30);
    });
    function generate_steps(text: string) {
      let steps: string[] = [];
      let i = 0;
      while (i < text.length) {
        const start = i;
        let end = i + 1;
        if (text[i] === "<") {
          while (text[end] !== ">") {
            end++;
          }
          end++;
        }
        steps.push(text.substring(start, end));
        i = end;
      }
      return steps;
    }
  }

  function make_paragraph(
    responses: tMetricRecommendationResponse[],
    correlations
  ) {
    let p = "";
    // feature descriptions
    responses.forEach((response) => {
      p += "<p>";
      p += `<span class="feature-name">${response.feature_name}</span>: <span class="level">${response.level}</span>. <span class="explanation">${response.explanation}</span>`;
      p += "</p>";
    });
    // correlations
    const recommended_features = responses.map((r) => r.feature_name);
    let first = true;
    correlations.forEach((corr) => {
      if (
        Math.abs(corr[2]) > 0.2 &&
        recommended_features.includes(corr[0]) &&
        recommended_features.includes(corr[1])
      ) {
        p += "<p>";
        if (first) {
          p += `<span class="feature-name">Correlations: </span>`;
          first = false;
        }
        p += `<span class="feature-name">${
          corr[0]
        }</span> and <span class="feature-name">${
          corr[1]
        }</span> have a <span class="level">${
          corr[2] < 0 ? "negative" : "positive"
        } </span> correlation.`;
        p += "</p>";
      }
    });
    return p;
  }
</script>

<div class="flex flex-col w-full gap-y-1">
  <div class="view-header">Metrics Recommendation</div>
  <div class="flex relative w-full">
    <div
      class="w-[1.5rem] h-[1.5rem] flex items-center justify-center absolute bg-white z-10 rounded-full outline outline-1 outline-gray-100 p-0.5"
    >
      <img src="user.svg" alt="*" class="w-full h-full" />
    </div>
    <div class="h-[4rem] w-full ml-3 mt-3 relative bg-stone">
      <div
        bind:this={query_area}
        class="h-full grow textarea-border pr-[1.5rem] pl-2 bg-stone text-area-border text-sm text-left placeholder empty:before:content-['Ask_any_question_here...']"
        contenteditable
        role="form"
      ></div>
      <div
        role="button"
        tabindex="0"
        class="absolute right-0 top-0 h-full w-[1.5rem] flex items-center justify-center cursor-pointer rounded-r border-l border-gray-200 hover:bg-gray-200"
        on:click={handleQuery}
        on:keyup={() => {}}
      >
        <img src="send.svg" alt="*" class="w-[1.1rem] h-[1.1rem]" />
      </div>
    </div>
  </div>

  <div class="flex relative w-full">
    {#if loading_response}
      <div
        class="w-[2rem] h-[2rem] absolute left-[-0.25rem] top-[-0.25rem] flex items-center justify-center rounded-full border-gray-300"
      >
        <img
          src="load.svg"
          alt="*"
          class="absolute w-full h-full animate-[spin_1.5s_ease-in-out_infinite] z-20"
        />
      </div>
    {/if}
    <div
      class="w-[1.5rem] h-[1.5rem] flex items-center justify-center absolute bg-white z-10 rounded-full outline outline-1 outline-gray-100 p-0.5"
    >
      <img src="bot.svg" alt="*" class="absolute w-full h-full" />
    </div>
    <div
      class="h-[12rem] grow ml-3 textarea-border pl-2 mt-3 flex overflow-y-auto flex-none gap-x-1 p-1"
    >
      <div class="grow bg-stone text-xs relative rounded">
        <span
          class="bot-response absolute left-0 right-0 top-0 bottom-0 overflow-y-auto p-1 font-mono text-[0.75rem] text-left"
        >
          {@html delayed_user_question_response}
        </span>
      </div>
    </div>
  </div>
  <!-- <button
    class="w-fit sticky ml-auto bottom-1 right-0 text-[0.6rem] p-1 bg-amber-400 border-amber-500"
    on:click={() => dispatch("highlight_recommendation", recommended_cluster)}
  >
    Find cluster
  </button> -->
</div>

<style lang="postcss">
  .textarea-border {
    @apply rounded border  border-gray-200;
    box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, 0.1);
  }
  .bot-response {
    & .feature-name {
      @apply font-bold;
    }
    & .level {
      @apply font-semibold;
    }
    & .explanation {
      @apply font-light;
    }
  }
</style>
