<script lang="ts">
  import { createSelect, melt } from "@melt-ui/svelte";
  import type { SelectOption } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  export let options: SelectOption[];
  export let selected_value: string | undefined;
  export let placeholder: string = "Select";
  $: if ($selected) selected_value = $selected.value;

  const {
    elements: { trigger, menu, option },
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
  <button
    class="flex h-5 w-[8rem] items-center justify-center rounded bg-white px-1 py-2
        text-xs font-mono
        text-magnum-700 shadow transition-opacity hover:opacity-90"
    use:melt={$trigger}
    aria-label="select-trigger"
  >
    <div class="flex items-center gap-x-1">
      {$selected?.label || placeholder}
    </div>
  </button>
  {#if $open}
    <div
      class={`z-10 flex max-h-[300px] flex-col
          overflow-y-auto overflow-x-visible bg-white p-1
          divide-y divide-neutral-200
          justify-center items-center w-max
          text-xs font-mono
          shadow focus:!ring-0
          `}
      use:melt={$menu}
      transition:fade={{ duration: 150 }}
    >
      {#each options as item}
        <div
          class={`relative cursor-pointer py-1 text-center text-neutral-800
                hover:bg-gray-100 focus:z-10
                focus:text-gray-700
                text-xs font-mono
                w-[7rem] flex justify-center items-center px-1
                data-[highlighted]:bg-magnum-200 data-[highlighted]:text-magnum-900
                data-[disabled]:opacity-50
                `}
          class:checked={$isSelected(item)}
          use:melt={$option({
            value: item.value,
            label: item.label,
          })}
        >
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
  }
</style>
