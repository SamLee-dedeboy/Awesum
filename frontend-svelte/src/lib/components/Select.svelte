<script lang="ts">
  // import { Check, ChevronDown } from '$icons/index.js';
  import { createSelect, melt } from "@melt-ui/svelte";
  import type { SelectOption } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { writable } from "svelte/store";
  export let options: SelectOption[];
  export let selected_value: string | undefined;
  export let placeholder: string = "Select";
  export let tw_font_size: string = "1rem";
  export let tw_font_family: string = "font-serif";
  $: if ($selected) selected_value = $selected.value;
  // $: selected_label_store.set({ value: selected_label, label: selected_label });
  // selected_label_store.subscribe((value) => {
  //   if (value) selected_label = value.value;
  // });
  const {
    elements: { trigger, menu, option, group, groupLabel, label },
    states: { open, selected },
    helpers: { isSelected },
  } = createSelect<string>({
    forceVisible: true,
    positioning: {
      placement: "bottom",
      //   sameWidth: true,
      gutter: 0,
    },
  });
</script>

<div class="flex flex-col gap-1">
  <!-- svelte-ignore a11y-label-has-associated-control - $label contains the 'for' attribute -->
  <button
    class="flex h-5 w-[8rem] items-center justify-center rounded bg-white px-1 py-2
      text-magnum-700 shadow transition-opacity hover:opacity-90"
    use:melt={$trigger}
    aria-label="select-trigger"
  >
    <div class="flex items-center gap-x-1">
      {$selected?.label || placeholder}
      <img src="chevrondown.svg" alt="*" class="h-[1rem] w-[1rem]" />
    </div>
    <!-- <ChevronDown class="size-5" /> -->
  </button>
  {#if $open}
    <div
      class={`z-10 flex max-h-[300px] flex-col
        overflow-y-auto overflow-x-visible bg-white p-1
        divide-y divide-neutral-200
        justify-center items-center w-max
        text-sm
        shadow focus:!ring-0
          ${tw_font_size}
          ${tw_font_family}
        `}
      use:melt={$menu}
      transition:fade={{ duration: 150 }}
    >
      {#each options as item}
        <div
          class="relative cursor-pointer py-1 text-center text-neutral-800
              hover:bg-gray-100 focus:z-10
              focus:text-gray-700
              w-full flex justify-center items-center px-1
              data-[highlighted]:bg-magnum-200 data-[highlighted]:text-magnum-900
              data-[disabled]:opacity-50"
          class:checked={$isSelected(item)}
          use:melt={$option({
            value: item.value,
            label: item.label,
          })}
        >
          <!-- <div class="check {$isSelected(item) ? 'block' : 'hidden'}">
                  <Check class="size-4" />
              </div> -->

          {item.label}
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
    /* color: theme(colors.magnum.500); */
  }
</style>
