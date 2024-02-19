<script lang="ts">
  import type {
    tNode,
    tMessage,
    tExampleMessage,
    tPrompt,
    tExampleData,
  } from "lib/types";
  import { createEventDispatcher } from "svelte";
  import { metrics } from "lib/constants";
  import { selected_metrics } from "lib/store";

  const server_address = "http://localhost:5000";
  const dispatch = createEventDispatcher();
  export let data: tNode[] = [];

  let executing_prompt = false;
  let prompts_by_metric = initPrompts(metrics);
  let target_metric: string = metrics[0];

  function initPrompts(metrics) {
    let prompts: { [key: string]: tPrompt } = {};
    metrics.forEach((metric) => {
      prompts[metric] = {
        instruction:
          "You are a writing assistant. You will be given a news article to summarize. Please make sure the summary is",
        examples: [],
        data_template: "Article: ${text}",
      };
    });
    return prompts;
  }

  // let instruction: string =
  //   "You are a writing assistant. You will be given a news article to summarize. Please make sure the summary is readable.";
  // let examples: tExampleMessage[] = [
  //   {
  //     id: "test",
  //     example_input: "Article: ${text}",
  //     example_output: "Summary: ${summary}",
  //   },
  // ];
  // let user_input_data = "Article: ${text}";
  // let pause = false;
  // let index = 0;
  // $: prompt_promises = generate_prompt_promises(
  //   messages,
  //   data,
  //   selected_metrics
  // );

  // function add_default_message() {
  //   const default_messages = {
  //     role: "system",
  //     content: "",
  //   };
  //   messages = [...messages, default_messages];
  // }

  // function execute_sequential() {
  //   Promise.resolve().then(prompt_promises[index]).then(check_pause);
  // }

  // function check_pause(data) {
  //   console.log(data);
  //   if (!pause) {
  //     index += 1;
  //     if (index < prompt_promises.length) execute_sequential();
  //   }
  // }

  // function start_sequential() {
  //   console.log("start");
  //   index = 0;
  //   execute_sequential();
  // }

  function start_all({ instruction, examples, data_template }: tPrompt) {
    // const messages = combine_messages(instruction, examples, user_input_data);
    // console.log("running prompt on all data...", messages, { data });
    const url = new URL(server_address + "/executePromptAll/");
    executing_prompt = true;
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instruction: instruction,
        examples: examples,
        data_template: data_template,
        data: data,
        metrics: $selected_metrics,
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        executing_prompt = false;
        dispatch("promptDone", { ...res });
      });
  }

  // function generate_prompt_promises(messages, summaries, selected_metrics) {
  //   let prompt_promises: any[] = [];
  //   summaries?.forEach((summary) => {
  //     let prompt = [
  //       ...messages,
  //       { role: "user", content: "Paragraph: " + summary },
  //     ];
  //     // let prompt = messages[0].content + "\nParagraph: \n" + summary;
  //     const url = new URL(server_address + "/executePrompt/");
  //     const promise = () =>
  //       prompt_promise_factory(url, prompt, selected_metrics);
  //     prompt_promises.push(promise);
  //   });
  //   return prompt_promises;
  // }

  // function prompt_promise_factory(url, prompt, selected_metrics) {
  //   return new Promise((resolve) => {
  //     fetch(url, {
  //       method: "POST",
  //       headers: {
  //         Accept: "application/json",
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ prompt: prompt, metrics: selected_metrics }),
  //     })
  //       .then((response) => response.json())
  //       .then((data) => resolve(data));
  //   });
  // }

  // function combine_messages(
  //   instruction: string,
  //   examples: tExampleData[],
  //   user_input_data: string
  // ) {
  //   console.log({ instruction, user_input_data });
  //   if (examples.length === 0) {
  //     const messages: tMessage[] = [
  //       { role: "system", content: instruction },
  //       { role: "system", content: user_input_data },
  //     ];
  //     return messages;
  //   } else {
  //     let messages: tMessage[] = [{ role: "system", content: instruction }];
  //     examples.forEach((example) => {
  //       messages.push({ role: "user", content: instruction });
  //       messages.push({ role: "assistant", content: example.example_output });
  //     });
  //     messages.push({ role: "user", content: user_input_data });
  //     return messages;
  //   }
  // }

  export function add_example(
    example: tExampleData,
    add_to_metric = undefined
  ) {
    if (!add_to_metric) {
      prompts_by_metric[target_metric].examples = [
        ...prompts_by_metric[target_metric].examples,
        example,
      ];
    } else {
      prompts_by_metric[add_to_metric].examples = [
        ...prompts_by_metric[add_to_metric].examples,
        example,
      ];
    }
  }
</script>

<div class="flex flex-col px-2 overflow-y-auto h-full">
  <div class="flex justify-between border-b border-gray-200">
    {#each Object.keys(prompts_by_metric) as metric}
      <div
        role="button"
        tabindex="0"
        class="grow cursor-pointer hover:bg-gray-200 rounded-t p-1 border-t border-x border-gray-200 text-gray-400"
        style={target_metric === metric
          ? "background-color: #e0f2fe; color: black"
          : ""}
        on:click={() => (target_metric = metric)}
        on:keyup={() => {}}
      >
        {metric}
      </div>
    {/each}
  </div>
  <div id="prompt-table" class="flex flex-col max-w-full gap-y-1">
    <div class="prompt-section flex flex-col">
      <div class="prompt-section-header">
        <span class="p-1 rounded !outline-none"> Instruction </span>
      </div>
      <div
        class="prompt-section-content editable"
        contenteditable
        on:input={(e) =>
          (prompts_by_metric[target_metric].instruction =
            e.target?.textContent)}
      >
        {prompts_by_metric[target_metric].instruction}
      </div>
    </div>
    <div class="flex gap-x-4">
      <div class="prompt-section flex flex-col flex-1">
        <div class="prompt-section-header relative">
          <span class="p-1 rounded !outline-none"> Examples </span>
        </div>
        <div
          class="prompt-section-content flex flex-col overflow-y-auto max-h-[10rem]"
          on:input={(e) => e.target?.textContent}
        >
          {#each prompts_by_metric[target_metric].examples as example}
            <div
              class="flex w-full gap-x-2 text-sm justify-between items-center px-1"
            >
              <div class="">{example.id}</div>
            </div>
          {/each}
        </div>
      </div>
      <div class="prompt-section flex flex-col flex-1">
        <div class="prompt-section-header">
          <span class="p-1 rounded !outline-none"> Data </span>
        </div>
        <div
          class="prompt-section-content editable"
          contenteditable
          on:input={(e) =>
            (prompts_by_metric[target_metric].data_template =
              e.target?.textContent)}
        >
          {prompts_by_metric[target_metric].data_template}
        </div>
      </div>
    </div>
  </div>
  <div class="flex gap-x-1 py-1">
    <div class="flex w-fit items-center justify-start gap-x-1">
      <button
        class="w-[4rem] h-[2.5rem] text-sm bg-green-50 flex items-center justify-center gap-x-1 !shadow-[0px_0px_1px_1px_#87ee93] text-slate-500"
        on:click={() => start_all(prompts_by_metric[target_metric])}
      >
        {#if executing_prompt}
          <img
            src="load2.svg"
            class="w-4 h-4 animate-[spin_2s_linear_infinite]"
            alt="*"
          />
        {:else}
          <!-- <img
            src="clipboard_checked.svg"
            alt="*"
            class="aspect-square text-gray-500"
          /> -->
          Apply
        {/if}
      </button>
      <span class="text-gray-500">
        to
        <span class="underline">
          {data.length}
        </span> articles
      </span>
    </div>
    <div
      class="flex flex-col justify-start items-start ml-auto right-0 text-gray-500 px-1 bg-yellow-50 outline outline-1 outline-gray-200"
    >
      <div class="italic">Codes:</div>
      <div class="text-sm">{`Full Article: $\{text\}`}</div>
      <div class="text-sm">{`Summary: $\{summary\}`}</div>
    </div>
    <!-- <button class="w-fit m-1" on:click={start_sequential}> Start </button>
    <button class="w-fit m-1" on:click={() => (pause = true)}>Pause </button> -->
  </div>
</div>

<style lang="postcss">
  .prompt-section {
    @apply shrink-0 flex items-center justify-center rounded  border-gray-200;
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.1);
  }
  .prompt-section-header {
    @apply w-full font-semibold shrink-0 flex items-center justify-center border-b border-gray-200 bg-sky-100;
  }
  .prompt-section-content {
    @apply py-1 grow overflow-y-auto w-full;
  }
  .editable {
    max-width: calc(100%);
    max-height: 10rem;
    /* word-break: break-all; */
    text-align: left;
    overflow-wrap: break-word;
    padding-left: 0.5rem;
  }

  /* :global(.loader) {
    animation: rotation 2s infinite linear;
  }

  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  } */
</style>
