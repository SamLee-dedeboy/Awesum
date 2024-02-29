<script lang="ts">
  import type { tOptimization } from "lib/types";

  export let optimizations: tOptimization[];
</script>

<div class="flex flex-col min-w-full min-h-full px-2 outline outline-1">
  {#each optimizations as optimization, index}
    <div class="optimization-container flex flex-col">
      <div class="optimization-title w-fit underline text-semibold">
        Prompt #{index}
      </div>
      <div
        class="prompt w-[40%] text-start outline outline-1 outline-[#a0a0a0]"
      >
        <span class="">{optimization.prompt.persona}</span>
        <span>{optimization.prompt.context}</span>
        <span>{optimization.prompt.constraints}</span>
        <p>{optimization.prompt.data_template}</p>
        <div>
          <div class="flex">
            <span> Examples: </span>
            <!-- To be replaced with svg -->
            <div>
              {optimization.prompt.examples.length === 0
                ? "None"
                : optimization.prompt.examples}
            </div>
          </div>
        </div>
      </div>
      <!-- <div>
      <p>{optimization.statistics}</p>
    </div> -->
    </div>
  {/each}
</div>
