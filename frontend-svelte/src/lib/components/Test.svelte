<script lang="ts">
  import { createTooltip, createPopover, melt } from "@melt-ui/svelte";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  import SelectPrompt from "./SelectPrompt.svelte";
  import type { tOptimization, tPrompt } from "lib/types";
  import { whole_test_set } from "lib/store";
  export let optimizations: tOptimization[];
  let selected_prompt_version: string = "1";
  $: select_options = optimizations.map((_, i) => ({
    value: "" + i,
    label: "Prompt#" + i,
  }));

  function executeTest(prompt: tPrompt) {
    // dispatch("execute_test", prompt);
  }

  const {
    elements: { trigger, content },
    states: { open },
  } = createTooltip({
    positioning: {
      placement: "right-start",
      gutter: 3,
    },
    openDelay: 0,
    closeDelay: 0,
    closeOnPointerDown: false,
    forceVisible: true,
    disableHoverableContent: true,
  });
  const {
    elements: { trigger: pop_trigger, content: pop_content, close },
    states: { open: pop_open },
  } = createPopover({
    positioning: {
      placement: "right-start",
      gutter: 3,
    },
    forceVisible: true,
  });
</script>

<div use:melt={$trigger}>
  <div
    role="button"
    tabindex="0"
    use:melt={$pop_trigger}
    on:click={() => {
      open.set(false);
    }}
    class="flex items-center gap-x-1 px-1 rounded-sm font-mono text-[0.8rem] outline-1 outline-black bg-red-100 hover:bg-red-200 hover:outlin shadow-[0px_0px_2px_1px_black]"
  >
    <img src="monitor_checked.svg" alt="*" class="w-[1rem] h-[1rem]" />
    Test
  </div>
</div>
{#if $open}
  <div
    use:melt={$content}
    class="bg-red-100 outline outline-1 outline-red-300 text-[0.8rem] font-mono py-0.5 px-1 max-w-[12rem] rounded-sm"
  >
    <span class="font-semibold"> Caution!</span> This can take a long time. Click
    when you're confident with current prompt.
  </div>
{/if}

{#if $pop_open}
  <div
    use:melt={$pop_content}
    class="flex flex-col bg-red-100 outline outline-1 outline-red-300 text-[0.8rem] font-mono py-0.5 px-1 max-w-[16rem] rounded-sm"
  >
    <div class="flex items-center gap-x-1 gap-y-1">
      <span>Select Prompt: </span>
      <SelectPrompt
        options={select_options}
        bind:selected_value={selected_prompt_version}
        placeholder={"Prompt version"}
      ></SelectPrompt>
    </div>
    <div>Test set size: {$whole_test_set.length}</div>
    <div>Estimated time:</div>
    <div
      role="button"
      tabindex="0"
      class="w-fit mt-3 px-1 py-0.5 rounded-sm outline outline-1 outline-green-400 bg-green-200 hover:bg-green-300 hover:outline-2"
      on:click={() =>
        executeTest(optimizations[+selected_prompt_version].prompt)}
      on:keyup={() => {}}
    >
      Confirm
    </div>
  </div>
{/if}
