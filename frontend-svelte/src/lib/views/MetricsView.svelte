<script lang="ts">
  import { tick } from "svelte";
  import * as d3 from "d3";
  import type { tStatBarData } from "lib/types";
  import { cluster_colors, metrics } from "lib/constants";
  import { createPopover, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";

  export let data: any[];
  export let highlight_cluster_label: string | undefined;

  $: if (data) update(data);

  $: update_highlight_cluster(highlight_cluster_label);

  async function update(data) {
    await tick();
    console.log(data);
    metrics.forEach((metric, index) => {
      const svgId = `metrics-svg-${index}`;
      const points = data[metric].data;
      const statistics = data[metric].statistics;
      console.log(statistics);
      const { svgSize, xScale } = init(svgId, statistics);
      // add nodes
      const svg = d3.select(`#${svgId}`);
      const node_group = svg.select("g.node-group");
      node_group
        .selectAll("circle")
        .data(points)
        .join("circle")
        .attr("cx", (d) => xScale(d.value))
        .attr("cy", svgSize.height / 2)
        .attr("r", svgSize.height / 10)
        .attr("fill", "gray")
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("opacity", 0.05);

      svg
        .append("line")
        .attr("x1", xScale(statistics.mean))
        .attr("y1", 0)
        .attr("x2", xScale(statistics.mean))
        .attr("y2", svgSize.height)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    });
  }

  function init(svgId, statistics: tStatBarData) {
    const svg = d3.select(`#${svgId}`);
    svg.selectAll("*").remove();
    const svgSize = {
      padding_x: 10,
      width: svg.node().clientWidth,
      height: svg.node().clientHeight,
    };
    svg.attr("viewBox", `0 0 ${svgSize.width} ${svgSize.height}`);

    const xScale = d3
      .scaleLinear()
      .domain([statistics.min, statistics.max])
      .range([svgSize.padding_x, svgSize.width - svgSize.padding_x]);
    const xAxis = d3.axisBottom(xScale);
    svg
      .append("g")
      .attr("transform", `translate(0, ${svgSize.height})`)
      .call(xAxis);
    svg.append("g").attr("class", "node-group");
    return { svgSize, xScale };
  }

  function update_highlight_cluster(cluster_label: string | undefined) {
    const points = d3.selectAll("svg.metrics-svg").selectAll("circle");
    // const target_points = points
    //   .filter((d) => d.cluster === cluster_label)
    //   .data();
    // console.log(target_points);
    if (cluster_label === undefined) {
      points
        .classed("dismissed", false)
        .classed("highlight", false)
        .attr("fill", "gray");
    } else {
      points
        .classed("dismissed", true)
        .classed("highlight", false)
        .filter((d) => d.cluster === cluster_label)
        .classed("highlight", true)
        .attr("fill", (d) => cluster_colors(d.cluster))
        .attr("stroke-width", 1)
        .raise();
    }
  }

  // setting up melt ui popover
  const {
    elements: { trigger, content, arrow, close },
    states: { open },
  } = createPopover({
    forceVisible: true,
    positioning: {
      placement: "left",
      gutter: 0,
    },
    arrowSize: 8,
    disableFocusTrap: true,
  });
</script>

<div
  class="flex flex-col items-center justify-center divide-dashed divide-gray-400"
>
  {#each metrics as metric, index}
    <div
      class="w-full h-fit flex flex-1 items-center justify-center px-1 divide-x divide-gray-500"
    >
      <div
        use:melt={$trigger}
        class="w-[7rem] text-left px-2 cursor-pointer hover:bg-gray-200 rounded"
      >
        {metric}
      </div>
      <svg id={`metrics-svg-${index}`} class="metrics-svg grow h-[2rem]"></svg>
    </div>
  {/each}
</div>
{#if $open}
  <div use:melt={$content} class="shadow-sm">
    <div class="border border-black !bg-amber-50" use:melt={$arrow} />
    <div
      class="flex flex-col py-2 px-4 w-[20rem] h-fit rounded border border-gray-500 bg-amber-50"
    >
      <p class="flex flex-wrap break-normal">Readability is about</p>
      <!-- <button class="close" use:melt={$close}> X </button> -->
    </div>
  </div>
{/if}

<!-- <div class="flex flex-col h-full overflow-auto">
  <div class="flex">
    {#each Object.keys(data[0]) as key}
      <div class="flex-1 items-center justify-center">{key}</div>
    {/each}
  </div>
  {#each data as datum}
    <div class="flex">
      {#each Object.keys(datum) as key}
        <div class="flex-1 items-center justify-center">{datum[key]}</div>
      {/each}
    </div>
  {/each}
</div> -->

<style>
  .metrics-svg :global(.dismissed) {
    /* opacity: 0.05; */
  }
  .metrics-svg :global(.highlight) {
    opacity: 1;
  }
</style>
