<script lang="ts">
  import { server_address } from "lib/constants";
  import { metrics } from "lib/constants";
  import type { tMetricRecommendationResponse } from "lib/types";
  let delayed_user_question_response = "Response will be here...";
  let loading_response = false;
  function handleQuery(e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      const user_question = e.target.textContent;
      query_metric(user_question);
      // make_delay(make_paragraph([]));
    }
  }

  function query_metric(question: string) {
    console.log(question);
    loading_response = true;
    const feature_pool = metrics;
    fetch(server_address + "/query_metric/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, feature_pool }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        // make_delay(data.response);
        make_delay(make_paragraph(data.response.features));
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

  function make_paragraph(responses: tMetricRecommendationResponse[]) {
    let p = "";
    responses.forEach((response) => {
      p += "<p>";
      p += `<span class="feature-name">${response.feature_name}</span>: <span class="level">${response.level}</span>. <span class="explanation">${response.explanation}</span>`;
      p += "</p>";
    });
    // p += `<p><span class="feature-name">readability</span>: <span class="level">Professional</span>. <span class="explanation">To make your writing academic, aim for a readability level of Professional (0-10) to ensure it is extremely difficult to read and best understood by university graduates.</span></p>`;
    return p;
  }
</script>

<div class="flex flex-col w-full gap-y-1">
  <div class="view-header">Metrics Recommendation</div>
  <div
    class="h-[4rem] mx-3 textarea-border p-1 bg-stone text-sm text-left placeholder empty:before:content-['Ask_any_question_here...']"
    contenteditable
    role="form"
    on:keyup={(e) => handleQuery(e)}
  ></div>
  <div class="h-[12rem] mx-3 flex overflow-y-auto flex-none gap-x-1 p-1">
    <div
      class="w-[2.5rem] h-[2.5rem] flex items-center justify-center p-1 rounded-full border-gray-300 relative"
    >
      <img src="bot.svg" alt="*" class="w-[80%] h-[80%]" />
      {#if loading_response}
        <img
          src="load.svg"
          alt="*"
          class="absolute w-full h-full animate-[spin_1.5s_ease-in-out_infinite]"
        />
      {/if}
    </div>
    <div class="grow textarea-border bg-stone text-xs relative rounded">
      <span
        class="bot-response absolute left-0 right-0 top-0 bottom-0 overflow-y-auto p-1 font-mono text-[0.75rem] text-left"
      >
        {@html delayed_user_question_response}
      </span>
    </div>
  </div>
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
