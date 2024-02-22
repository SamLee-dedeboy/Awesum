<script lang="ts">
  import { tick } from "svelte";
  import * as d3 from "d3";
  import type { tStatBarData, tMetricStep } from "lib/types";
  import { cluster_colors, metric_categories, metrics } from "lib/constants";
  import { selected_metrics } from "lib/store";
  import { Expand } from "lucide-svelte";

  export let data: any[];
  export let highlight_cluster_label: string | undefined;

  $: if (data) update(data);

  $: update_highlight_cluster(highlight_cluster_label);

  async function update(data) {
    await tick();
    console.log(data);
    $selected_metrics.forEach((metric, index) => {
      const svgId = `metrics-svg-${index}`;
      const points = data[metric].data;
      const statistics = data[metric].statistics;
      const ranges = metric_categories[metric];
      const { svgSize, xScale } = init(svgId, statistics, ranges);
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
        .attr("y1", 0.3 * svgSize.height)
        .attr("x2", xScale(statistics.mean))
        .attr("y2", 0.7 * svgSize.height)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    });
  }

  function init(svgId, statistics: tStatBarData, ranges: tMetricStep[]) {
    const svg = d3.select(`#${svgId}`);
    svg.selectAll("*").remove();
    const svgSize = {
      padding_x: 10,
      width: svg.node().clientWidth,
      height: svg.node().clientHeight,
    };
    svg.attr("viewBox", `0 0 ${svgSize.width} ${svgSize.height}`);

    const xMax =
      ranges[ranges.length - 1].end === -1
        ? statistics.max
        : ranges[ranges.length - 1].end;
    const xScale = d3
      .scaleLinear()
      .domain([ranges[0].start, xMax])
      .range([svgSize.padding_x, svgSize.width - svgSize.padding_x]);
    const xAxis = d3.axisBottom(xScale);
    svg
      .append("g")
      .attr("transform", `translate(0, ${svgSize.height})`)
      .call(xAxis);
    const details = svg.append("g").attr("class", "step-divider-group");
    details
      .selectAll("line.divider")
      .data(ranges.slice(1))
      .join("line")
      .attr("class", "divider")
      .attr("x1", (d) => xScale(d.start))
      .attr("y1", 0)
      .attr("x2", (d) => xScale(d.start))
      .attr("y2", svgSize.height)
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3")
      .classed("hide", true);
    details
      .selectAll("text.divider-label")
      .data(ranges)
      .join("text")
      .attr("class", "divider-label")
      .attr(
        "x",
        (d) => (xScale(d.start) + xScale(d.end === -1 ? xMax : d.end)) / 2
      )
      .attr("y", 10)
      .attr(
        "font-family",
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
      )
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "hanging")
      .text((d) => d.label)
      .attr("font-size", "0.65rem")
      .classed("hide", true);
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

  function showDetail(metric) {
    const svg = d3.select(`#metrics-svg-${$selected_metrics.indexOf(metric)}`);
    svg.selectAll("line.divider").classed("hide", false);
    svg.selectAll("text.divider-label").classed("hide", false);
  }

  function hideDetail() {
    d3.selectAll("line.divider").classed("hide", true);
    d3.selectAll("text.divider-label").classed("hide", true);
  }

  function expand(metric) {
    const svg = d3.select(`#metrics-svg-${$selected_metrics.indexOf(metric)}`);
  }
</script>

<div class="flex flex-col items-center justify-center">
  {#each $selected_metrics as metric, index}
    <div
      role="button"
      tabindex={index}
      class="metric-title w-full h-full flex flex-1 items-center justify-center px-1"
      on:mouseover={() => showDetail(metric)}
      on:focus={() => showDetail(metric)}
      on:mouseout={() => hideDetail()}
      on:blur={() => hideDetail()}
      on:click={() => expand(metric)}
      on:keyup={() => {}}
    >
      <div class="w-[7rem] h-full flex text-left px-2 border-r border-gray-500">
        {metric}
      </div>
      <svg id={`metrics-svg-${index}`} class="metrics-svg grow h-[2rem]"></svg>
    </div>
  {/each}
</div>

<style>
  .metrics-svg :global(.dismissed) {
    /* opacity: 0.05; */
  }
  .metrics-svg :global(.highlight) {
    opacity: 1;
  }
  .metrics-svg :global(.hide) {
    opacity: 0;
  }
</style>
