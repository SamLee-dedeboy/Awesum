<script lang="ts">
  import { server_address } from "lib/constants";
  import { metrics } from "lib/constants";
  let delayed_user_question_response = "Response will be here...";

  function handleQuery(e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      const user_question = e.target.textContent;
      query_metric(user_question);
    }
  }

  function query_metric(question: string) {
    console.log(question);
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
        make_delay(data.response);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function make_delay(text) {
    delayed_user_question_response = "";
    for (let i = 0, l = text.length; i < l; i++) {
      setTimeout(
        function (i) {
          delayed_user_question_response = text.substring(0, i + 1);
        }.bind(this, i),
        i * 30
      );
    }
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
      class="w-[2.5rem] h-[2.5rem] flex items-center justify-center p-1 rounded-full border-gray-300"
    >
      <img src="bot.svg" alt="*" class="w-full h-full" />
    </div>
    <div class="grow textarea-border bg-stone text-xs relative rounded">
      <span
        class="bot-response absolute left-0 right-0 top-0 bottom-0 overflow-y-auto p-1 font-mono text-[0.75rem] text-left"
      >
        {delayed_user_question_response}
      </span>
    </div>
  </div>
</div>

<style lang="postcss">
  .textarea-border {
    @apply rounded border  border-gray-200;
    box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, 0.1);
  }
</style>
