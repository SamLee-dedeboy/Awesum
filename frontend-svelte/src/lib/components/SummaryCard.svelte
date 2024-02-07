<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let summary: String = "";
</script>

<div class="card bg-stone-50 shadow-lg outline outline-1 outline-gray-300">
  <div class="font-light text-xs text-gray-500">Summary:</div>
  <div>{summary}</div>
  <div
    role="button"
    tabindex="0"
    class="w-fit bg-green-200 p-1 outline outline-1 outline-gray-400 text-xs text-gray-500 mt-2 !rounded hover:bg-gray-100 cursor-pointer shadow-[0_0_1px_1px_gray]"
    on:click={() => dispatch("click")}
    on:keyup={() => {}}
  >
    add to example
  </div>
</div>

<style>
  .card {
    @apply text-start p-1 text-sm;
    /* outline: 1px solid black; */
  }
</style>
