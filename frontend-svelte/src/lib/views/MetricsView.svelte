<script lang="ts">
  import { tick } from "svelte";
  import * as d3 from "d3";
  import type { tClusterStatistics } from "lib/types";
  import { metric_colors, metrics } from "lib/constants";

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
        .attr("fill", metric_colors[index])
        // .attr("stroke", "gray")
        // .attr("stroke-width", 1)
        .attr("opacity", 0.2);

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

  function init(svgId, statistics: tClusterStatistics) {
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
    const target_points = points
      .filter((d) => d.cluster === cluster_label)
      .data();
    console.log(target_points);
    if (cluster_label === undefined) {
      points.classed("dismissed", false).classed("highlight", false);
    } else {
      points
        .classed("dismissed", true)
        .classed("highlight", (d) => d.cluster === cluster_label);
    }
  }
</script>

<div
  class="flex flex-col items-center justify-center divide-dashed divide-gray-400"
>
  {#each metrics as metric, index}
    <div
      class="w-full h-fit flex flex-1 items-center justify-center px-1 divide-x divide-gray-500"
    >
      <div class="w-[7rem] text-left px-2">{metric}</div>
      <svg id={`metrics-svg-${index}`} class="metrics-svg grow h-[2rem]"></svg>
    </div>
  {/each}
</div>

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
    opacity: 0;
  }
  .metrics-svg :global(.highlight) {
    opacity: 1;
  }
</style>
