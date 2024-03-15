<script lang="ts">
  import { createSelect, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { writable } from "svelte/store";
  export let options;
  export let selected_label: string;
  export let selected_label_store: any = writable(undefined);
  export let tw_font_size: string;
  export let tw_font_family: string;

  $: select_options = options.concat("None");
  $: selected_label_store.set({ value: selected_label, label: selected_label });
  selected_label_store.subscribe((value) => {
    if (value) selected_label = value.value;
  });
  const {
    elements: { trigger, menu, option, group, groupLabel, label },
    states: { open },
    helpers: { isSelected },
  } = createSelect<string>({
    selected: selected_label_store,
    forceVisible: true,
    positioning: {
      placement: "bottom",
      fitViewport: true,
      sameWidth: true,
      gutter: 0,
    },
  });
</script>

<div class="flex flex-col gap-1">
  <button
    class="flex h-5 min-w-[5rem] items-center justify-center rounded bg-white px-1 py-2
    text-magnum-700 shadow transition-opacity hover:opacity-90"
    use:melt={$trigger}
    aria-label="select-trigger"
  >
    {$selected_label_store.label || "Select a level"}
  </button>
  {#if $open}
    <div
      class={`z-10 flex max-h-[300px] flex-col
      overflow-y-auto bg-white p-1
      divide-y divide-neutral-200
      shadow focus:!ring-0
        ${tw_font_size}
        ${tw_font_family}
      `}
      use:melt={$menu}
      transition:fade={{ duration: 150 }}
    >
      {#each select_options as item}
        <div
          class="relative cursor-pointer py-1 text-center text-neutral-800
            hover:bg-gray-100 focus:z-10
            focus:text-gray-700
            data-[highlighted]:bg-magnum-200 data-[highlighted]:text-magnum-900
            data-[disabled]:opacity-50"
          class:checked={$isSelected(item)}
          use:melt={$option({
            value: item === "None" ? null : item,
            label: item,
          })}
        >
          {item}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="postcss">
  .checked {
    @apply bg-green-100;
  }
  .check {
    position: absolute;
    left: theme(spacing.2);
    top: 50%;
    z-index: theme(zIndex.20);
    translate: 0 calc(-50% + 1px);
  }
</style>
