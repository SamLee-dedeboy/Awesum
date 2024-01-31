<script lang="ts">
  export let summary: String = "";
</script>

<div class="card">
  <div class="font-light text-xs text-gray-500">Summary:</div>
  {summary}
</div>

<style>
  .card {
    @apply text-start p-1 text-sm;
    /* outline: 1px solid black; */
  }
</style>
