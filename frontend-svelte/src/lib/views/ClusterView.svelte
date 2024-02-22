<script lang="ts">
  import * as d3 from "d3";
  import { onMount, tick } from "svelte";
  import { cluster_colors, metrics } from "lib/constants";
  import type { tStatistics, tNode } from "lib/types";
  import * as d3_hexbin from "d3-hexbin";
  import ClusterModeRadio from "lib/components/ClusterModeRadio.svelte";

  import { target_range, cluster_mode } from "lib/store";
  export let data: tNode[];
  export let highlight_cluster_label: string | undefined;
  export let show_noise: boolean = false;
  export let statistics: tStatistics;

  const width = 500;
  const height = 500;
  const margin = 30;
  const innerWidth = width - 2 * margin;
  const innerHeight = height - 2 * margin;
  const node_radius = 4;
  const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);
  onMount(() => {
    init();
  });

  $: if (data) {
    if (!show_noise) data = data.filter((d) => d.cluster !== "-1");
    if ($cluster_mode === "metric") {
      update_by_metric(data, $target_range);
      // update_hex_by_metric(data, "readability", null);
    } else {
      update_by_cluster(data);
    }
  }

  $: update_highlight_cluster(highlight_cluster_label);
  $: if (show_noise) {
    d3.select("#cluster-svg")
      .select("g.node-group")
      .selectAll("circle")
      .transition()
      // .ease(d3.easeCircleOut)
      .duration(500)
      .attr("opacity", 1);
  } else {
    d3.select("#cluster-svg")
      .select("g.node-group")
      .selectAll("circle")
      .attr("opacity", (d) => (d.cluster === "-1" ? 0 : 1));
  }

  async function update_by_cluster(data: tNode[]) {
    await tick();
    const g = d3.select("#cluster-svg").select("g.node-group");
    const points = g
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d: any) => (d.x = xScale(d.coordinates[0])))
      .attr("cy", (d: any) => (d.y = yScale(d.coordinates[1])))
      .attr("r", (d: any) => node_radius)
      .attr("fill", (d) => cluster_colors(d.cluster))
      .attr("stroke", "gray")
      .attr("stroke-width", 0.5)
      .attr("opacity", (d) => (d.cluster === "-1" ? 0 : 1));
    if (show_noise) {
      points.attr("opacity", 1);
    }
    force_collision_centroid(data, node_radius + 0.7);
  }

  async function update_by_metric(data, target_range) {
    await tick();
    const target_metric_index = target_range[2];
    const target_metric = metrics[target_metric_index];
    // const offset = 0.01;
    // const metric_values = data.map((d) => d.features[target_metric]);
    // target_range = [
    //   d3.quantile(metric_values, 0.5 - offset),
    //   d3.quantile(metric_values, 0.5 + offset),
    // ];
    // console.log({ target_range });
    // target_range = [
    //   statistics.global_means[target_metric_index] * (1 - offset),
    //   statistics.global_means[target_metric_index] * (1 + offset),
    // ];
    const max_distance = Math.max(
      Math.abs(statistics.global_maxes[target_metric_index] - target_range[1]),
      Math.abs(statistics.global_mins[target_metric_index] - target_range[0])
    );
    console.log({ statistics, max_distance, target_range });
    const colorScale = d3
      .scalePow()
      // .domain([
      //   statistics.global_mins[target_metric_index],
      //   statistics.global_maxes[target_metric_index],
      // ])
      .domain([
        0,
        Math.max(
          Math.abs(
            statistics.global_maxes[target_metric_index] - target_range[1]
          ),
          Math.abs(
            statistics.global_mins[target_metric_index] - target_range[0]
          )
        ),
      ])
      .range(["red", "transparent"])
      .exponent(0.2);
    // const colorScale = d3
    //   .scalePow()
    //   .domain([
    //     statistics.global_mins[target_metric_index],
    //     statistics.global_maxes[target_metric_index],
    //   ])
    //   .range(["white", "red"])
    //   .exponent(1.5);

    const g = d3.select("#cluster-svg").select("g.node-group");
    const points = g
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d: any) => (d.x = xScale(d.coordinates[0])))
      .attr("cy", (d: any) => (d.y = yScale(d.coordinates[1])))
      .attr("r", (d: any) => node_radius)
      // .attr("fill", (d) => cluster_colors(d.cluster))
      .attr("fill", (d) => {
        const value = d.features[target_metric];
        const distance = in_range(value, target_range)
          ? 0
          : distance_to_range(value, target_range);
        // console.log(value, distance);
        return colorScale(distance);
      })
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .attr("opacity", (d) => (d.cluster === "-1" ? 0 : 1));
    if (show_noise) {
      points.attr("opacity", 1);
    }
    force_collision_centroid(data);
  }

  async function update_hex_by_metric(data, target_metric, target_range) {
    await tick();
    const target_metric_index = 0;
    const offset = 5;
    target_range = [
      statistics.global_means[target_metric_index] + 50 - offset,
      statistics.global_means[target_metric_index] + 50 + offset,
    ];
    console.log({ target_range });
    const colorScale = d3
      .scalePow()
      // .domain([
      //   statistics.global_mins[target_metric_index],
      //   statistics.global_maxes[target_metric_index],
      // ])
      .domain([
        0,
        Math.max(
          Math.abs(
            statistics.global_maxes[target_metric_index] - target_range[1]
          ),
          Math.abs(
            statistics.global_mins[target_metric_index] - target_range[0]
          )
        ),
      ])
      .range(["black", "transparent"])
      .exponent(1);
    const data_for_hex = data.map((d) => [
      xScale(d.coordinates[0]),
      yScale(d.coordinates[1]),
      d.features[target_metric],
    ]);
    const hexbin = d3_hexbin
      .hexbin()
      .radius(7)
      .extent([0, 0], [innerWidth, innerHeight]);
    const svg = d3.select("#cluster-svg");
    console.log(data_for_hex, hexbin(data_for_hex));
    svg.selectAll("*").remove();
    svg
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    svg
      .append("g")
      .attr("clip-path", "url(#clip)")
      .selectAll("path")
      .data(hexbin(data_for_hex))
      .enter()
      .append("path")
      .attr("d", (d) => `M${d.x},${d.y}${hexbin.hexagon()}`)
      .attr("fill", function (points) {
        const mean = d3.mean(points.map((p) => p[2]));
        const distance = in_range(mean, target_range)
          ? 0
          : distance_to_range(mean, target_range);
        // console.log(distance);
        return colorScale(distance);
      })
      .attr("stroke", "black")
      .attr("stroke-width", "0.1");
  }

  function force_collision_centroid(data: tNode[], radius = node_radius) {
    let cluster_nodes = {};
    data.forEach((datum) => {
      if (cluster_nodes[datum.cluster] === undefined) {
        cluster_nodes[datum.cluster] = [];
      }
      cluster_nodes[datum.cluster].push(datum);
    });
    let centroids = {};
    Object.keys(cluster_nodes).forEach((cluster_label) => {
      const nodes = cluster_nodes[cluster_label];
      const x = d3.mean(nodes.map((d) => d.coordinates[0]));
      const y = d3.mean(nodes.map((d) => d.coordinates[1]));
      centroids[cluster_label] = [x, y];
    });
    console.log("force collision", data);
    const collisionForce = d3
      .forceSimulation(data)
      .force(
        "cluster_x",
        d3.forceX((d) => xScale(centroids[d.cluster][0])).strength(0.1)
      )
      .force(
        "cluster_y",
        d3.forceY((d) => yScale(centroids[d.cluster][1])).strength(0.1)
      )
      .alphaMin(0.1)
      .force("collide", d3.forceCollide(radius))
      .force(
        "x_force",
        d3.forceX((d) => xScale(d.coordinates[0]))
      )
      .force(
        "y_force",
        d3.forceY((d) => yScale(d.coordinates[1]))
      )
      .on("tick", () => {
        const nodes = d3
          .select("#cluster-svg")
          .select("g.node-group")
          .selectAll("circle");
        nodes
          .attr(
            "cx",
            (d) => (d.x = clip(d.x, [node_radius, innerWidth - node_radius]))
          )
          .attr(
            "cy",
            (d) => (d.y = clip(d.y, [node_radius, innerHeight - node_radius]))
          );
      });
  }

  function update_highlight_cluster(cluster_label: string | undefined) {
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

    // const xAxis = d3.axisBottom(xScale);
    // const yAxis = d3.axisLeft(yScale);

    // content
    //   .append("g")
    //   .attr("transform", `translate(0, ${innerHeight})`)
    //   .call(xAxis);

    // content.append("g").call(yAxis);

    content.append("g").attr("class", "node-group");
  }

  function clip(x, range) {
    return Math.max(Math.min(x, range[1]), range[0]);
  }
  function in_range(value, range) {
    return value >= range[0] && value <= range[1];
  }
  function distance_to_range(value, range) {
    return Math.min(Math.abs(value - range[0]), Math.abs(value - range[1]));
  }
</script>

<div class="container w-full h-full relative">
  <svg id="cluster-svg" class="w-full h-full"> </svg>
  <div class="absolute top-0 right-0">
    <ClusterModeRadio id="cluster-mode" bind:cluster_mode={$cluster_mode}
    ></ClusterModeRadio>
    {#if $cluster_mode === "metric"}
      <div class="ml-auto right-0 w-fit pr-1 text-sm font-sans">
        {metrics[$target_range[2]]}: {$target_range[0]} - {$target_range[1]}
      </div>
    {/if}
  </div>
</div>

<style>
  .container {
    outline: 1px solid #f0f0f0;
  }
  #cluster-svg :global(.dismissed) {
    opacity: 0.2;
  }
  #cluster-svg :global(.highlight) {
    opacity: 1;
  }
</style>
