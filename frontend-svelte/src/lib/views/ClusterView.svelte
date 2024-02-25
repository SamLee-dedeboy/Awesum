<script lang="ts">
  import * as d3 from "d3";
  import { onMount, tick } from "svelte";
  import { cluster_colors, metrics } from "lib/constants";
  import type { tStatistics, tNode } from "lib/types";
  import * as d3_hexbin from "d3-hexbin";
  import ClusterModeRadio from "lib/components/ClusterModeRadio.svelte";
  import Switch from "lib/components/Switch.svelte";

  import { target_range, cluster_mode, test_set } from "lib/store";
  export let data: tNode[];
  export let highlight_cluster_label: string | undefined;
  export let show_noise: boolean = false;
  export let show_test_set: boolean = false;
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

  $: update_nodes(data);
  function update_nodes(data) {
    if (data) {
      data = data.filter((d) => d.cluster !== "-1");
      const centroids = generate_centroids(data);
      update(data, centroids);
      if ($cluster_mode === "metric") {
        update_by_metric($target_range);
      } else {
        update_by_cluster();
      }
    }
  }

  $: if ($cluster_mode === "metric") {
    update_by_metric($target_range);
  } else {
    update_by_cluster();
  }

  $: update_highlight_cluster(highlight_cluster_label);

  $: update_noise(show_noise, data);
  function update_noise(show_noise, data) {
    console.log("update noise", show_noise);
    if (show_noise) {
      d3.select("#cluster-svg")
        .select("g.noise-group")
        .selectAll("circle.noise")
        .data(data.filter((d) => d.cluster === "-1"))
        .join("circle")
        .attr("class", "noise")
        .attr("cx", (d: any) => (d.x = xScale(d.coordinates[0])))
        .attr("cy", (d: any) => (d.y = yScale(d.coordinates[1])))
        .attr("r", node_radius / 1.5)
        .attr("fill", "white")
        .attr("stroke", "#939393")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.8);
    } else {
      d3.select("#cluster-svg")
        .select("g.noise-group")
        .selectAll("circle.noise")
        .attr("opacity", 0);
    }
  }

  $: if (show_test_set) {
    console.log("show test set");
    d3.select("#cluster-svg")
      .select("g.node-group")
      .selectAll("circle")
      .filter((d) => d.test_case)
      .classed("test-case", true);
  } else {
    d3.select("#cluster-svg")
      .select("g.node-group")
      .selectAll("circle")
      .classed("test-case", false);
  }

  async function update(data: tNode[], centroids: any) {
    await tick();
    const g = d3.select("#cluster-svg").select("g.node-group");
    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d: any) => (d.x = xScale(d.coordinates[0])))
      .attr("cy", (d: any) => (d.y = yScale(d.coordinates[1])))
      .attr("r", (d: any) => node_radius)
      .attr("stroke", "gray")
      .attr("stroke-width", 0.5);
    force_collision_centroid(data, node_radius + 0.7, centroids);
  }

  async function update_by_cluster() {
    await tick();
    const g = d3.select("#cluster-svg").select("g.node-group");
    const points = g
      .selectAll("circle")
      .attr("fill", (d) => cluster_colors(d.cluster));
    // if (show_noise) {
    //   points.attr("opacity", 1);
    // }
    // force_collision_centroid(data, node_radius + 0.7);
  }

  async function update_by_metric(target_range) {
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
      .attr("fill", (d) => {
        const value = d.features[target_metric];
        const distance = in_range(value, target_range)
          ? 0
          : distance_to_range(value, target_range);
        // console.log(value, distance);
        return colorScale(distance);
      })
      .attr("stroke", "white");
    // if (show_noise) {
    //   points.attr("opacity", 1);
    // }
    // force_collision_centroid(data);
  }

  function force_collision_centroid(
    data: tNode[],
    radius = node_radius,
    centroids: any
  ) {
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
    const noise_group = content.append("g").attr("class", "noise-group");
    const line_group = svg.append("g").attr("class", "line-group");
    const utility_group = svg.append("g").attr("class", "utility");
    const show_test_set_button = {
      parent: utility_group,
      class_name: "show-test-set",
      activated_color: "rgb(187 247 208)",
      deactivated_color: "white",
      activated_text_color: "black",
      deactivated_text_color: "#aaaaaa",
      text: "test set",
      x: 5,
      y: 5,
      width: 60,
      height: 20,
      onClick: () => {
        show_test_set = !show_test_set;
        const test_case_circles = content
          .selectAll("circle")
          .filter((d) => d.test_case);
        line_group
          .selectAll("line.test-case-line")
          .data(test_case_circles)
          .join("line")
          .classed("test-case-line", true)
          .attr("x1", (d) => +d3.select(d).attr("cx") + margin)
          .attr("y1", (d) => +d3.select(d).attr("cy") + margin)
          .attr("x2", () => 5 + 60 / 2)
          .attr("y2", () => 5 + 20 / 2)
          .attr("opacity", show_test_set ? 0.8 : 0)
          .attr("stroke", "gray")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4,2");
      },
    };
    add_utility_button(show_test_set_button);

    const show_noise_button = {
      parent: utility_group,
      class_name: "show-noise",
      activated_color: "rgb(187 247 208)",
      deactivated_color: "white",
      activated_text_color: "black",
      deactivated_text_color: "#aaaaaa",
      text: "noise",
      x: 70,
      y: 5,
      width: 60,
      height: 20,
      onClick: () => {
        show_noise = !show_noise;
      },
    };
    add_utility_button(show_noise_button);
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
  function generate_centroids(data: tNode[]) {
    let cluster_nodes = {};
    data.forEach((datum) => {
      if (cluster_nodes[datum.cluster] === undefined) {
        cluster_nodes[datum.cluster] = [];
      }
      cluster_nodes[datum.cluster].push(datum);
    });
    let centroids = {};
    let local_testset: tNode[] = [];
    Object.keys(cluster_nodes).forEach((cluster_label) => {
      const nodes = cluster_nodes[cluster_label];
      const mean_x = d3.mean(nodes.map((d) => d.coordinates[0]));
      const mean_y = d3.mean(nodes.map((d) => d.coordinates[1]));
      const { x, y, nearest } = find_nearest(mean_x, mean_y, nodes);
      centroids[cluster_label] = [x, y];
      nearest.test_case = true;
      local_testset.push(nearest);
    });
    test_set.set(local_testset);

    return centroids;
  }

  function find_nearest(
    x: number,
    y: number,
    nodes: tNode[]
  ): { x: number; y: number; nearest: tNode } {
    let min_distance = Infinity;
    let nearest: tNode = nodes[0];
    nodes.forEach((node) => {
      const distance = Math.sqrt(
        (node.coordinates[0] - x) ** 2 + (node.coordinates[1] - y) ** 2
      );
      if (distance < min_distance) {
        min_distance = distance;
        nearest = node;
      }
    });
    return {
      x: nearest.coordinates[0],
      y: nearest.coordinates[1],
      nearest: nearest,
    };
  }

  function add_utility_button({
    parent,
    class_name,
    activated_color,
    deactivated_color,
    activated_text_color,
    deactivated_text_color,
    text,
    x,
    y,
    width,
    height,
    onClick,
  }) {
    const utility_button = parent.append("g").attr("class", class_name);
    const animation_scale_factor = 1.1;
    utility_button
      .append("rect")
      .classed("utility-button", true)
      .attr("x", x)
      .attr("y", y)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", deactivated_color)
      .on("mouseover", function () {
        d3.select(this).attr("stroke-width", 2);

        // d3.select(this).attr(
        //   "fill",
        //   show_test_set ? deactivated_color : activated_color
        // );
        // d3.select(this.parentNode)
        //   .select("text")
        //   .attr(
        //     "fill",
        //     show_test_set ? deactivated_text_color : activated_text_color
        //   );
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-width", 1);
        // d3.select(this)
        //   .transition()
        //   .duration(100)
        //   .attr("x", x)
        //   .attr("y", y)
        //   .attr("width", width)
        //   .attr("height", height);
        // d3.select(this).attr(
        //   "fill",
        //   show_test_set ? activated_color : deactivated_color
        // );
        // d3.select(this.parentNode)
        //   .select("text")
        //   .attr(
        //     "fill",
        //     show_test_set ? activated_text_color : deactivated_text_color
        //   );
      })
      .on("click", function () {
        onClick();
        const activated = d3.select(this).attr("fill") === activated_color;
        console.log("click", activated);
        d3.select(this)
          .attr("fill", activated ? deactivated_color : activated_color)
          .transition()
          .duration(200)
          .attr("x", function () {
            return x - (width * (animation_scale_factor - 1)) / 2;
          })
          .attr("y", function () {
            return y - (height * (animation_scale_factor - 1)) / 2;
          })
          .attr("width", function () {
            return width * animation_scale_factor;
          })
          .attr("height", function () {
            return height * animation_scale_factor;
          })
          .transition()
          .duration(100)
          .attr("x", x)
          .attr("y", y)
          .attr("width", width)
          .attr("height", height);
        d3.select(this.parentNode)
          .select("text")
          .attr(
            "fill",
            activated ? deactivated_text_color : activated_text_color
          );
      });
    utility_button
      .append("text")
      .attr("x", x + width / 2)
      .attr("y", y + height / 2)
      .attr("pointer-events", "none")
      .text(text)
      .attr("fill", deactivated_text_color)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "middle");
  }
</script>

<div class="container w-full h-full relative">
  <svg id="cluster-svg" class="w-full h-full"> </svg>
  <!-- <div class="absolute top-0 left-0 flex flex-col">
    <Switch label="Show Noise" bind:checked={show_noise}></Switch>
    <Switch label="Show Test set" bind:checked={show_test_set}></Switch>
  </div> -->
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

<style lang="postcss">
  .container {
    outline: 1px solid #f0f0f0;
  }
  #cluster-svg {
    & .dismissed {
      /* opacity: 0.2; */
      /* stroke-width: 1; */
    }
    & .highlight {
      stroke: #363535;
      stroke-width: 1.5;
    }

    & .test-case {
      stroke: #363535;
      stroke-width: 1.5;
    }
    & .utility-button {
      cursor: pointer;
      rx: 1%;
      stroke: gray;
    }
  }
  :global(.test-case-line) {
    animation: moving 4s linear infinite;
  }

  @keyframes moving {
    from {
      stroke-dashoffset: 100;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
</style>
