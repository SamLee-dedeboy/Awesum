<script lang="ts">
  import { createTooltip, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import {
    server_address,
    prompt_block_explanations,
    range_to_categories,
  } from "lib/constants";
  import { selected_topic, target_ranges } from "lib/store";
  import { categorize_metric, topic_dict } from "lib/constants";
  export let title: string;
  export let prompt_content: string = "";
  export let enable_suggestions: boolean = true;
  let get_recommendation_clicked = false;
  let recommendation: string | undefined = undefined;
  let recommendation_loading = false;
  $: goal = generate_goal(topic_dict[$selected_topic!], $target_ranges);
  const {
    elements: { trigger, content, arrow },
    states: { open },
  } = createTooltip({
    positioning: {
      placement: "right-start",
      gutter: 5,
    },
    openDelay: 0,
    closeDelay: 0,
    closeOnPointerDown: false,
    forceVisible: true,
  });

  async function getSuggestions(block, current_prompt, goal) {
    get_recommendation_clicked = true;
    recommendation_loading = true;
    console.log({ block, current_prompt, goal });
    fetch(server_address + "/prompt_recommendation/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        block,
        current_prompt,
        goal,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        recommendation_loading = false;
        recommendation = data.recommendation;
      });
  }

  function generate_goal(
    selected_topic: string,
    target_ranges: { [key: string]: [number | undefined, number | undefined] }
  ) {
    let goal = `I am writing a prompt to summarize news articles about ${selected_topic}. `;
    Object.entries(target_ranges).forEach(([metric, range]) => {
      if (range[0] === undefined || range[1] === undefined) return;
      goal += `The ${metric} should be ${make_categories_string(range_to_categories(metric, range as any))}. `;
    });
    return goal;
  }

  function make_categories_string(categories: string[]) {
    return categories.slice(0, -1).join(", ") + "and " + categories.slice(-1);
  }
</script>

<span class="rounded !outline-none cursor-help" use:melt={$trigger}>
  {title}
</span>
{#if $open}
  <div
    use:melt={$content}
    transition:fade={{ duration: 100 }}
    class="z-10 rounded-lg bg-amber-50 shadow p-2 text-sm font-mono"
  >
    <div class="underline font-semibold">{title} Block:</div>
    <div class="text-xs max-w-[20rem]">
      {prompt_block_explanations[title.toLowerCase()]}
    </div>
    {#if enable_suggestions}
      <div
        role="button"
        tabindex="0"
        class="mt-3 outline outline-2 outline-gray-300 rounded text-xs w-fit p-1 bg-orange-300 hover:bg-orange-400 shadow-lg"
        on:click={() => getSuggestions(title, prompt_content, goal)}
        on:keyup={() => {}}
      >
        Get Suggestions
      </div>
    {/if}
    {#if get_recommendation_clicked}
      <div class="relative mt-3 h-fit">
        {#if recommendation_loading}
          <div
            class="w-[2rem] h-[2rem] absolute left-[-0.25rem] top-[-0.75rem] flex items-center justify-center rounded-full border-gray-300"
          >
            <img
              src="load.svg"
              alt="*"
              class="absolute w-full h-full animate-[spin_1.5s_ease-in-out_infinite] z-20"
            />
          </div>
        {/if}
        <div
          class="w-[1.5rem] h-[1.5rem] flex items-center justify-center absolute top-[-0.5rem] bg-white z-10 rounded-full outline outline-1 outline-gray-300"
        >
          <img src="bot.svg" alt="*" class="absolute w-[90%] h-[90%]" />
        </div>
        <div
          class="min-h-[4rem] max-h-[6rem] grow ml-3 textarea-border pl-2 flex overflow-y-auto flex-none gap-x-1 p-1"
        >
          <div class="grow bg-stone text-xs relative">
            <span
              class="bot-response absolute left-0 right-0 top-0 bottom-0 overflow-y-auto p-1 font-mono text-[0.75rem] text-left"
            >
              {recommendation || "Loading..."}
            </span>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style lang="postcss">
  .textarea-border {
    @apply rounded border  border-gray-200;
    box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.1);
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
