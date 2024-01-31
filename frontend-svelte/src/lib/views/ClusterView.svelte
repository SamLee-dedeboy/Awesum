<script lang="ts">
  import * as d3 from "d3";
  import { onMount, tick } from "svelte";
  import { cluster_colors } from "lib/constants";

  export let data: any;
  export let cluster_labels: any[];
  export let highlight_cluster_label: string | undefined;

  const width = 500;
  const height = 500;
  const margin = 30;
  const innerWidth = width - 2 * margin;
  const innerHeight = height - 2 * margin;
  const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);
  onMount(() => {
    init();
  });

  $: if (data) {
    console.log(cluster_labels);
    update(data);
  }
  $: update_highlight_cluster(highlight_cluster_label);

  async function update(data) {
    await tick();
    console.log(data);
    const g = d3.select("#cluster-svg").select("g.node-group");
    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d: any) => xScale(d.coordinates[0]))
      .attr("cy", (d: any) => yScale(d.coordinates[1]))
      .attr("r", (d: any) => (d.features[0] === 22 ? 5 : 2))
      .attr("fill", (d) =>
        d.cluster === "-1" ? "white" : cluster_colors[d.cluster]
      )
      .attr("stroke", "black")
      .attr("stroke-width", 1);
  }

  function update_highlight_cluster(cluster_label) {
    const g = d3.select("#cluster-svg").select("g.node-group");
    if (cluster_label === undefined) {
      g.selectAll("circle")
        .classed("dismissed", false)
        .classed("highlight", false);
    } else {
      g.selectAll("circle")
        .classed("dismissed", true)
        .classed("highlight", (d) => d.cluster === cluster_label);
    }
  }

  function init() {
    const svg = d3
      .select("#cluster-svg")
      .attr("viewBox", `0 0 ${width} ${height}`);

    const content = svg
      .append("g")
      .attr("transform", `translate(${margin}, ${margin})`);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    content
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);

    content.append("g").call(yAxis);

    content.append("g").attr("class", "node-group");
  }
</script>

<div class="w-full h-full">
  <svg id="cluster-svg" class="w-full h-full"> </svg>
</div>

<style>
  #cluster-svg :global(.dismissed) {
    opacity: 0.2;
  }
  #cluster-svg :global(.highlight) {
    opacity: 1;
  }
</style>
