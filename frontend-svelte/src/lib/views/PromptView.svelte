<script lang="ts">
  import type {
    tNode,
    tMessage,
    tExampleMessage,
    tPrompt,
    tExampleData,
  } from "lib/types";
  import { createEventDispatcher } from "svelte";
  import { cluster_colors, metrics } from "lib/constants";
  import { selected_metrics, test_set, example_nodes } from "lib/store";
  import PromptBlockHeader from "lib/components/PromptBlockHeader.svelte";

  const server_address = "http://localhost:5000";
  const dispatch = createEventDispatcher();

  let executing_prompt = false;
  // let prompts_by_metric = initPrompts(metrics);
  let prompt_template: tPrompt = {
    persona: "You are a writing assistant.",
    context: "You will be given a news article to summarize.",
    constraints: "Please make sure the summary",
    // examples: Array.from(Array(30).keys()).map((i) => ({
    //   id: i.toString(),
    //   cluster: "2",
    //   summary: "summary",
    //   text: "text",
    //   coordinates: [0, 0],
    //   features: {},
    // })),
    examples: [],
    data_template: "${article}",
  };

  example_nodes.subscribe((value) => {
    prompt_template.examples = value;
  });

  function start_all({
    persona,
    context,
    constraints,
    examples,
    data_template,
  }: tPrompt) {
    const instruction = persona + ". " + context + ". " + constraints;
    const url = new URL(server_address + "/executePromptAll/");
    console.log("test set", $test_set);
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
        data: $test_set,
        last_data: [],
        // metrics: metrics,
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        console.log("execute prompt", { res });
        executing_prompt = false;
        dispatch("promptDone", {
          ...res,
          prompt: { persona, context, constraints, examples, data_template },
        });
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

  export function add_example(example: tNode) {
    prompt_template.examples = [...prompt_template.examples, example];
  }
</script>

<div class="flex flex-col px-1 overflow-y-auto h-full">
  <div class="flex justify-between border-b border-gray-200"></div>
  <div id="prompt-table" class="flex flex-col max-w-full gap-y-1">
    <!-- <div class="grow flex gap-x-1"> -->
    <div class="prompt-section flex flex-col flex-1">
      <div class="prompt-section-header">
        <!-- <span class=" rounded !outline-none"> Persona </span> -->
        <PromptBlockHeader
          title="Persona"
          prompt_content={prompt_template.persona}
        />
      </div>
      <div
        class="prompt-section-content editable min-h-[3rem]"
        contenteditable
        on:input={(e) => (prompt_template.persona = e.target?.textContent)}
      >
        {prompt_template.persona}
      </div>
    </div>
    <div class="prompt-section flex flex-col flex-1">
      <div class="prompt-section-header">
        <PromptBlockHeader
          title="Context"
          prompt_content={prompt_template.context}
        />
      </div>
      <div
        class="prompt-section-content editable min-h-[5rem]"
        contenteditable
        on:input={(e) => (prompt_template.context = e.target?.textContent)}
      >
        {prompt_template.context}
      </div>
    </div>
    <div class="prompt-section flex flex-col flex-1">
      <div class="prompt-section-header">
        <PromptBlockHeader
          title="Constraints"
          prompt_content={prompt_template.constraints}
        />
      </div>
      <div
        class="prompt-section-content editable min-h-[4rem]"
        contenteditable
        on:input={(e) => (prompt_template.constraints = e.target?.textContent)}
      >
        {prompt_template.constraints}
      </div>
    </div>
    <!-- </div> -->
    <div class="flex grow gap-x-4">
      <div class="prompt-section flex flex-col flex-1">
        <div class="prompt-section-header relative">
          <PromptBlockHeader title="Examples" enable_suggestions={false} />
        </div>
        <div
          class="prompt-section-content flex flex-wrap overflow-y-auto max-h-[10rem] items-center px-1"
          on:input={(e) => e.target?.textContent}
        >
          {#each prompt_template.examples as example}
            <div class="w-fit">
              <!-- <div class="">{example.id}</div> -->
              <svg class="w-[1rem] h-[1rem]" viewBox="0 0 10 10">
                <circle
                  fill={cluster_colors(example.cluster)}
                  stroke="black"
                  stroke-width="0.5"
                  r="4"
                  cx="5"
                  cy="5"
                >
                </circle></svg
              >
            </div>
          {/each}
        </div>
      </div>
      <div class="prompt-section flex flex-col flex-1">
        <div class="prompt-section-header">
          <PromptBlockHeader
            title="Data"
            prompt_content={prompt_template.data_template}
          />
        </div>
        <div
          class="prompt-section-content editable"
          contenteditable
          on:input={(e) =>
            (prompt_template.data_template = e.target?.textContent)}
        >
          {prompt_template.data_template}
        </div>
      </div>
    </div>
  </div>
  <div class="flex gap-x-1 py-1">
    <div class="flex w-fit items-center justify-start gap-x-1">
      <button
        class="w-[4rem] h-[2.5rem] text-sm bg-green-50 flex items-center justify-center gap-x-1 !shadow-[0px_0px_1px_1px_#87ee93] text-slate-500"
        on:click={() => start_all(prompt_template)}
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
          {$test_set.length}
        </span> articles
      </span>
    </div>
    <!-- <div
      class="flex flex-col justify-start items-start ml-auto right-0 text-gray-500 px-1 bg-yellow-50 outline outline-1 outline-gray-200"
    >
      <div class="italic">Codes:</div>
      <div class="text-sm">{`Full Article: $\{text\}`}</div>
      <div class="text-sm">{`Summary: $\{summary\}`}</div>
    </div> -->
    <!-- <button class="w-fit m-1" on:click={start_sequential}> Start </button>
    <button class="w-fit m-1" on:click={() => (pause = true)}>Pause </button> -->
  </div>
</div>

<style lang="postcss">
  .prompt-section {
    @apply shrink-0 flex justify-center rounded  border-gray-200;
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.1);
  }
  .prompt-section-header {
    @apply w-full font-semibold text-sm shrink-0 flex items-center justify-center border-b border-gray-200 bg-sky-100;
  }
  .prompt-section-content {
    @apply py-1 grow overflow-y-auto w-full text-sm;
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
