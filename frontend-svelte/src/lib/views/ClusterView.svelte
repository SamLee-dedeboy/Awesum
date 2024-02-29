<script lang="ts">
  import * as d3 from "d3";
  import { onMount, tick } from "svelte";
  import { cluster_colors, metrics } from "lib/constants";
  import type { tStatistics, tNode } from "lib/types";
  import * as d3_hexbin from "d3-hexbin";
  import ClusterModeRadio from "lib/components/ClusterModeRadio.svelte";
  import Switch from "lib/components/Switch.svelte";
  import {
    example_nodes,
    // recommended_cluster,
    recommended_nodes,
  } from "lib/store";

  import {
    target_ranges,
    target_range_metric,
    cluster_mode,
    selected_metrics,
    test_set,
  } from "lib/store";
  export let data: tNode[];
  export let centroids: { [key: string]: tNode[] };
  export let highlight_cluster_label: string | undefined;
  let show_noise: boolean = false;
  let show_test_set: boolean = false;
  let show_recommendations: boolean = false;
  export let statistics: tStatistics;

  recommended_nodes.subscribe((value) => {
    if (!value) return;
    if (!show_recommendations) {
      toggle_recommendations();
    }
    update_recommendations(show_recommendations);
  });

  $: {
    if (show_recommendations) {
      const show_recommendation_button = d3.select("g.show-recommendation");
      show_recommendation_button
        .select(".utility-button")
        .attr("fill", "rgb(187 247 208)");
      show_recommendation_button.select("text").attr("fill", "black");
      d3.select("g.add-to-examples")
        .attr("pointer-events", "auto")
        .select("text")
        .attr("fill", "black");
    } else {
      const show_recommendation_button = d3.select("g.show-recommendation");
      show_recommendation_button
        .select(".utility-button")
        .attr("fill", "white");
      show_recommendation_button.select("text").attr("fill", "#aaaaaa");
      d3.select("g.add-to-examples")
        .attr("pointer-events", "none")
        .select("text")
        .attr("fill", "#aaaaaa");
    }
  }

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
  function update_nodes(data: tNode[]) {
    if (data) {
      data = data.filter((d) => d.cluster !== "-1");
      // const centroids = generate_centroids(data);
      // console.log({ centroids });
      update(data, centroids);
      if ($cluster_mode === "metric") {
        update_by_metric($target_ranges);
      } else {
        update_by_cluster();
      }
      // if ($recommended_cluster !== undefined) {
      //   toggle_recommendations();
      // }
    }
  }

  $: if ($cluster_mode === "metric") {
    update_by_metric($target_ranges);
    d3.select("g.cluster-mode")
      .attr("pointer-events", "auto")
      .select("text")
      // .text("cluster")
      .attr("fill", "black");
  } else {
    update_by_cluster();
  }

  $: update_highlight_cluster(highlight_cluster_label);

  $: update_noise(show_noise, data);
  function update_noise(show_noise, data) {
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

  async function update(data: tNode[], centroids: { [key: string]: tNode[] }) {
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
      .attr("fill", (d) => cluster_colors(d.cluster))
      .attr("stroke", "gray")
      .attr("stroke-width", 0.5);
    // .attr("opacity", show_recommendations ? 0.8 : 0)
    // .attr("stroke", "gray")
    // .attr("stroke-width", 1)
    // .attr("stroke-dasharray", "4,2");
    // if (show_noise) {
    //   points.attr("opacity", 1);
    // }
    // force_collision_centroid(data, node_radius + 0.7);
  }

  async function update_by_metric(target_ranges) {
    await tick();
    // const target_metric = metrics[target_metric_index];
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
    let total_max_distance = 0;
    $selected_metrics.forEach((metric) => {
      const target_metric_index = metrics.indexOf(metric);
      const target_range = target_ranges[metric];
      if (target_range[0] === undefined) return;
      const max_distance = Math.max(
        Math.abs(
          statistics.global_maxes[target_metric_index] - target_range[1]
        ),
        Math.abs(statistics.global_mins[target_metric_index] - target_range[0])
      );
      total_max_distance += max_distance;
    });
    const colorScale = d3
      .scalePow()
      // .domain([
      //   statistics.global_mins[target_metric_index],
      //   statistics.global_maxes[target_metric_index],
      // ])
      .domain([0, total_max_distance])
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
        d.total_distance = undefined;
        $selected_metrics.forEach((metric) => {
          if ($target_ranges[metric][0] === undefined) return;
          const value = d.features[metric];
          const distance = in_range(value, $target_ranges[metric])
            ? 0
            : distance_to_range(value, $target_ranges[metric]);
          if (d.total_distance === undefined) d.total_distance = 0;
          d.total_distance += distance;
        });
        return colorScale(d.total_distance);
      })
      .attr("stroke", (d) => (d.total_distance === 0 ? "black" : "white"))
      .attr("stroke-width", (d) => (d.total_distance === 0 ? 1.5 : 1));
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
        d3.select("#cluster-svg")
          .select("g.line-group")
          .selectAll("line.recommended-case-line")
          // .data(recommended_case_circles)
          // .join("line")
          // .classed("recommended-case-line", true)
          .attr("x1", (d) => +d3.select(d).attr("cx") + margin)
          .attr("y1", (d) => +d3.select(d).attr("cy") + margin);
      });
  }

  export function update_highlight_cluster(cluster_label: string | undefined) {
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

    const line_group = svg.append("g").attr("class", "line-group");
    const content = svg
      .append("g")
      .attr("transform", `translate(${margin}, ${margin})`);
    const noise_group = content.append("g").attr("class", "noise-group");
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
      width: 45,
      height: 20,
      onClick: () => {
        show_noise = !show_noise;
      },
    };
    add_utility_button(show_noise_button);

    const show_recommendation_button = {
      parent: utility_group,
      class_name: "show-recommendation",
      activated_color: "rgb(187 247 208)",
      deactivated_color: "white",
      activated_text_color: "black",
      deactivated_text_color: "#aaaaaa",
      text: "recommendations",
      x: 120,
      y: 5,
      width: 150,
      height: 20,
      onClick: toggle_recommendations,
    };
    add_utility_button(show_recommendation_button);

    const add_to_examples_button = {
      parent: utility_group,
      class_name: "add-to-examples",
      activated_color: "rgb(187 247 208)",
      deactivated_color: "white",
      activated_text_color: "black",
      deactivated_text_color: "#aaaaaa",
      text: "add to examples",
      x: 275,
      y: 5,
      width: 135,
      height: 20,
      onClick: add_examples,
      stateless: true,
    };
    add_utility_button(add_to_examples_button);
    d3.select("g.add-to-examples").attr("pointer-events", "none");

    const cluster_mode_button = {
      parent: utility_group,
      class_name: "cluster-mode",
      activated_color: "rgb(187 247 208)",
      deactivated_color: "white",
      activated_text_color: "black",
      deactivated_text_color: "#aaaaaa",
      text: "switch",
      x: 415,
      y: 5,
      width: 60,
      height: 20,
      onClick: toggle_cluster_mode,
      stateless: true,
    };
    add_utility_button(cluster_mode_button);
    d3.select("g.cluster-mode").attr("pointer-events", "none");
    // const xAxis = d3.axisBottom(xScale);
    // const yAxis = d3.axisLeft(yScale);

    // content
    //   .append("g")
    //   .attr("transform", `translate(0, ${innerHeight})`)
    //   .call(xAxis);

    // content.append("g").call(yAxis);

    content.append("g").attr("class", "node-group");
  }

  function toggle_recommendations() {
    show_recommendations = !show_recommendations;
  }

  function toggle_cluster_mode() {
    // d3.select("g.cluster-mode").select("text").text($cluster_mode);
    cluster_mode.set($cluster_mode === "metric" ? "cluster" : "metric");
  }
  $: update_recommendations(show_recommendations);
  function update_recommendations(show_recommendations) {
    // if ($recommended_cluster === undefined) return;
    if ($recommended_nodes === undefined) return;
    console.log("show recommendations", $recommended_nodes);
    const svg = d3.select("#cluster-svg");
    const line_group = svg.select("g.line-group");
    const recommended_node_ids = $recommended_nodes.map((node) => node.id);
    const recommended_case_circles = svg
      .selectAll("circle")
      .filter((d) => recommended_node_ids.includes(d.id));
    line_group
      .selectAll("line.recommended-case-line")
      .data(recommended_case_circles)
      .join("line")
      .classed("recommended-case-line", true)
      .attr("x1", (d) => +d3.select(d).attr("cx") + margin)
      .attr("y1", (d) => +d3.select(d).attr("cy") + margin)
      .attr("x2", () => 135 + 150 / 2)
      .attr("y2", () => 5 + 20 / 2)
      .attr("opacity", show_recommendations ? 0.8 : 0)
      .attr("stroke", "gray")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,2");
    // if (show_recommendations) {
    //   const button = d3.select("g.show-recommendation");
    //   button.select(".utility-button").attr("fill", "rgb(187 247 208)");
    //   button.select("text").attr("fill", "black");
    // }
  }

  function add_examples() {
    example_nodes.set($recommended_nodes!);
    return;
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
    stateless = false,
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
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-width", 1);
      })
      .on("click", function () {
        onClick();
        const button = d3.select(this);
        const activated = button.attr("fill") === activated_color;
        button.attr("fill", activated ? deactivated_color : activated_color);
        button
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
          .attr("height", height)
          .on("end", () => {
            if (stateless) button.attr("fill", deactivated_color);
          });
        if (!stateless) {
          d3.select(this.parentNode)
            .select("text")
            .attr(
              "fill",
              activated ? deactivated_text_color : activated_text_color
            );
        }
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
    <!-- <ClusterModeRadio id="cluster-mode" bind:cluster_mode={$cluster_mode}
    ></ClusterModeRadio> -->
    <!-- {#if $cluster_mode === "metric"}
      <div class="ml-auto right-0 w-fit pr-1 text-sm font-sans">
        {metrics[$target_range_metric]}: {$target_ranges[
          $target_range_metric
        ][0]} - {$target_ranges[$target_range_metric][1]}
      </div>
    {/if} -->
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
      stroke: #676767;
      stroke-width: 1.5;
    }

    & .test-case {
      stroke: #505050;
      stroke-width: 1.5;
    }
    & .utility-button {
      cursor: pointer;
      rx: 1%;
      stroke: gray;
    }
  }
  :global(.test-case-line, .recommended-case-line) {
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
