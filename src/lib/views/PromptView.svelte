<script lang="ts">
  import type { tNode, tPrompt } from "lib/types";
  import { createEventDispatcher, onMount } from "svelte";
  import { cluster_colors, server_address } from "lib/constants";
  import { test_set, example_nodes, executing_prompt } from "lib/store";
  import PromptBlockHeader from "lib/components/PromptBlockHeader.svelte";

  // const server_address = "http://localhost:5000";
  const dispatch = createEventDispatcher();

  // let prompts_by_metric = initPrompts(metrics);
  let prompt_template: tPrompt = {
    persona: "You are a writing assistant.",
    // persona: "",
    context: "You will be given a news article to summarize.",
    constraints: "Please make sure the summary",
    examples: [],
    data_template: "${article}",
  };

  example_nodes.subscribe((value) => {
    prompt_template.examples = value;
  });
  onMount(() => {
    document.querySelectorAll(".editable").forEach((el) => {
      el.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          document.execCommand("insertHTML", false, "<br>");

          event.preventDefault();
        }
      });
    });
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
    $executing_prompt = true;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instruction: instruction,
        examples: examples,
        data_template: data_template,
        data: $test_set,
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        console.log("execute prompt", { res });
        $executing_prompt = false;
        dispatch("promptDone", {
          ...res,
          prompt: { persona, context, constraints, examples, data_template },
        });
      });
  }

  export function add_example(example: tNode) {
    prompt_template.examples = [...prompt_template.examples, example];
  }

  function handlePaste(e) {
    // Prevent the default action
    e.preventDefault();

    // Get the copied text from the clipboard
    const text = e.clipboardData
      ? (e.originalEvent || e).clipboardData.getData("text/plain")
      : // For IE
        window.clipboardData
        ? window.clipboardData.getData("Text")
        : "";

    if (document.queryCommandSupported("insertText")) {
      document.execCommand("insertText", false, text);
    } else {
      // Insert text at the current position of caret
      const range = document.getSelection().getRangeAt(0);
      range.deleteContents();

      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.selectNodeContents(textNode);
      range.collapse(false);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
</script>

<div class="flex flex-col px-1 overflow-y-auto h-full">
  <div class="flex justify-between border-b border-gray-200"></div>
  <div id="prompt-table" class="flex flex-col max-w-full gap-y-1">
    <div class="prompt-section flex flex-col flex-1">
      <div class="prompt-section-header">
        <PromptBlockHeader
          title="Persona"
          prompt_content={prompt_template.persona}
        />
      </div>
      <div class="prompt-section-content min-h-[3rem] relative">
        <div
          role="form"
          class="absolute left-0 top-0 bottom-0 right-0 editable overflow-y-auto pr-3"
          contenteditable
          on:paste={handlePaste}
          on:input={(e) => (prompt_template.persona = e.target?.textContent)}
        >
          <p>
            {prompt_template.persona}
          </p>
        </div>
      </div>
    </div>
    <div class="prompt-section flex flex-col flex-1">
      <div class="prompt-section-header">
        <PromptBlockHeader
          title="Context"
          prompt_content={prompt_template.context}
        />
      </div>
      <div class="prompt-section-content min-h-[5rem] relative">
        <div
          class="absolute left-0 top-0 bottom-0 right-0 editable overflow-y-auto pr-3"
          contenteditable
          on:paste={handlePaste}
          on:input={(e) => (prompt_template.context = e.target?.textContent)}
        >
          {prompt_template.context}
        </div>
      </div>
    </div>
    <div class="prompt-section flex flex-col flex-1">
      <div class="prompt-section-header">
        <PromptBlockHeader
          title="Constraints"
          prompt_content={prompt_template.constraints}
        />
      </div>
      <div class="prompt-section-content min-h-[4rem] relative">
        <div
          class="absolute left-0 top-0 bottom-0 right-0 pr-3 editable overflow-y-auto"
          contenteditable
          on:paste={handlePaste}
          on:input={(e) =>
            (prompt_template.constraints = e.target?.textContent)}
        >
          {prompt_template.constraints}
        </div>
      </div>
    </div>
    <div class="flex grow gap-x-4">
      <div class="prompt-section flex flex-col flex-1">
        <div class="prompt-section-header relative">
          <PromptBlockHeader title="Examples" enable_suggestions={false} />
        </div>
        <div
          class="prompt-section-content flex flex-wrap overflow-y-auto max-h-[10rem] items-center px-1"
        >
          {#each prompt_template.examples as example}
            <div class="w-fit">
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
          <PromptBlockHeader title="Data" enable_suggestions={false} />
        </div>
        <div
          class="prompt-section-content editable"
          contenteditable
          on:paste={handlePaste}
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
        {#if $executing_prompt}
          <img
            src="load2.svg"
            class="w-4 h-4 animate-[spin_2s_linear_infinite]"
            alt="*"
          />
        {:else}
          Apply
        {/if}
      </button>
      <span class="text-gray-500"> to validation set </span>
    </div>
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
    display: inline-block;
    max-width: calc(100%);
    max-height: 10rem;
    /* word-break: break-all; */
    text-align: left;
    overflow-wrap: break-word;
    padding-left: 0.5rem;
  }
  .editable:focus {
    outline: none;
  }
  .editable[placeholder]:empty:before {
    content: attr(placeholder);
    color: #555;
  }

  .editable[placeholder]:empty:focus:before {
    content: "";
  }
</style>
