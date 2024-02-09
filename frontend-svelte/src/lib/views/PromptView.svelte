<script lang="ts">
  import type { tNode, tMessage } from "lib/types";
  import { createEventDispatcher } from "svelte";
  const server_address = "http://localhost:5000";
  const dispatch = createEventDispatcher();
  export let data: tNode[] = [];
  export let selected_metrics: string[];
  let messages: tMessage[] = [
    {
      role: "system",
      content:
        // "You are a writing assistant. You will be given a paragraph to revise. The user wants you to make the paragraph more readable. ",
        "You are a writing assistant. You will be given a news article to summarize. Please make sure the summary is readable.",
    },
    {
      role: "user",
      content: "Article: ${text}",
      // content: "Paragraph: ${summary}",
    },
  ];
  let pause = false;
  let index = 0;
  $: prompt_promises = generate_prompt_promises(
    messages,
    data,
    selected_metrics
  );
  function add_default_message() {
    const default_messages = {
      role: "system",
      content: "",
    };
    messages = [...messages, default_messages];
  }

  function execute_sequential() {
    Promise.resolve().then(prompt_promises[index]).then(check_pause);
  }

  function check_pause(data) {
    console.log(data);
    if (!pause) {
      index += 1;
      if (index < prompt_promises.length) execute_sequential();
    }
  }

  function start_sequential() {
    console.log("start");
    index = 0;
    execute_sequential();
  }

  function start_all() {
    console.log("running prompt on all data...", messages, { data });
    const url = new URL(server_address + "/executePromptAll/");
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: messages,
        data: data,
        metrics: selected_metrics,
      }),
    })
      .then((response) => response.json())
      .then((data) => dispatch("promptDone", { ...data, messages }));
  }

  function generate_prompt_promises(messages, summaries, selected_metrics) {
    let prompt_promises: any[] = [];
    summaries?.forEach((summary) => {
      let prompt = [
        ...messages,
        { role: "user", content: "Paragraph: " + summary },
      ];
      // let prompt = messages[0].content + "\nParagraph: \n" + summary;
      const url = new URL(server_address + "/executePrompt/");
      const promise = () =>
        prompt_promise_factory(url, prompt, selected_metrics);
      prompt_promises.push(promise);
    });
    return prompt_promises;
  }

  function prompt_promise_factory(url, prompt, selected_metrics) {
    return new Promise((resolve) => {
      fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt, metrics: selected_metrics }),
      })
        .then((response) => response.json())
        .then((data) => resolve(data));
    });
  }
</script>

<div class="flex flex-col p-1 overflow-y-auto h-full gap-y-1">
  <button class="w-fit ml-auto right-0" on:click={add_default_message}>+</button
  >
  <div id="prompt-table" class="flex flex-col max-w-full">
    <div class="flex w-full">
      <div class="cell w-[4rem]">role</div>
      <div class="cell grow w-max flex justify-center items-center">
        content
      </div>
    </div>
    {#each messages as message, index}
      <div class="flex">
        <div class="cell w-[4rem]">
          <span
            role="button"
            tabindex={index}
            class="p-1 rounded cursor-pointer hover:bg-gray-200 !outline-none"
            on:click={() =>
              (message.role = message.role === "user" ? "system" : "user")}
            on:keyup={() => {}}
          >
            {message.role}
          </span>
        </div>
        <div
          class="cell editable grow overflow-y-auto"
          contenteditable
          on:input={(e) => (message.content = e.target?.textContent)}
        >
          {message.content}
        </div>
      </div>
    {/each}
  </div>
  <div class="flex gap-x-1">
    <button class="w-fit" on:click={start_all}> Apply </button>
    <div class="text-left">
      <div class="underline italic">Codes:</div>
      <div class="text-sm">{`Full Article: $\{text\}`}</div>
      <div class="text-sm">{`Summary: $\{summary\}`}</div>
    </div>
    <!-- <button class="w-fit m-1" on:click={start_sequential}> Start </button>
    <button class="w-fit m-1" on:click={() => (pause = true)}>Pause </button> -->
  </div>
</div>

<style>
  .cell {
    @apply p-1 shrink-0 flex items-center justify-center;
    outline: solid 1px black;
    /* word-wrap: break-word; */
  }
  .editable {
    max-width: calc(100% - 4rem);
    max-height: 10rem;
    /* word-break: break-all; */
    text-align: left;
    overflow-wrap: break-word;
    padding-left: 0.5rem;
  }
  /* #prompt-table {
    display: grid;
    grid-template-columns: 4rem 1fr;
    grid-auto-rows: auto;
  } */
  div,
  span {
  }
</style>
