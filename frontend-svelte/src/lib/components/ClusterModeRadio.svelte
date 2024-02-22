<script lang="ts">
  export let id: string;
  export let cluster_mode: string;
  const options = [
    { id: "cluster", label: "Cluster Mode" },
    { id: "metric", label: "Metric Mode" },
  ];
  $: console.log(cluster_mode);
  $: radio_toggles = options.map((option) => cluster_mode === option.id);
</script>

<div
  class="w-fit h-fit items-center text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white"
>
  <div
    class="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600"
  >
    <div class="flex items-center px-2 cursor-pointer">
      <input
        id={id + "-" + options[0].id}
        type="radio"
        value={radio_toggles[0]}
        checked={radio_toggles[0]}
        on:change={() => {
          cluster_mode = options[0].id;
        }}
        name={id}
        class="cursor-pointer w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-0 dark:bg-gray-600 dark:border-gray-500"
      />
      <label
        for={id + "-" + options[0].id}
        class="cursor-pointer w-full py-1 ml-2 text-xs font-medium text-gray-900 dark:text-gray-300"
      >
        {options[0].label}
      </label>
    </div>
  </div>
  <div class="w-full dark:border-gray-600">
    <div
      class={`${
        radio_toggles[1] ? "" : "disable"
      } flex items-center px-2 cursor-pointer`}
    >
      <input
        id={id + "-" + options[1].id}
        type="radio"
        value={radio_toggles[1]}
        checked={radio_toggles[1]}
        on:change={() => {
          cluster_mode = options[1].id;
        }}
        name={id}
        class=" hover:bg-gray-300 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-0 dark:bg-gray-600 dark:border-gray-500"
      />
      <label
        for={id + "-" + options[1].id}
        class=" w-full py-1 ml-2 text-xs font-medium text-gray-900 dark:text-gray-300"
        >{options[1].label}</label
      >
    </div>
  </div>
</div>

<style>
  .disable {
    @apply pointer-events-none cursor-not-allowed opacity-50;
  }
</style>
