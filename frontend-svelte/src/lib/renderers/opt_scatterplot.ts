import type { tOptimization, tNode, tStatistics } from "lib/types";
// import { optimization_colors } from "lib/constants/Colors";
import { cluster_colors, optimization_opacities, optimization_colors } from "lib/constants";
import {
    BSplineShapeGenerator,
    BubbleSet,
    PointPath,
    ShapeSimplifier,
  } from 'bubblesets';
  
import * as d3 from "d3";
import { selected_metrics, target_ranges, recommended_nodes } from "lib/store";
import { get } from "svelte/store";
const node_radius = 4
export class OptScatterplot  {  
    svgId: string
    svgSize: any
    xScale: any
    yScale: any
    show_trajectory: boolean = true
    constructor(svgId: string, svgSize: any) {
        this.svgId = svgId;
        this.svgSize = svgSize
    }

    init() {
        const svg = d3.select(`#${this.svgId}`);
        const bubble_group = svg.append("g").attr("class", "bubbles");
        const line_group = svg.append("g").attr("class", "lines");
        const ideal_group = svg.append("g").attr("class", "ideal");
    const node_group = svg.append("g").attr("class", "nodes");
        const src_node_group = node_group.append("g").attr("class", "src");
        const dst_node_group = node_group.append("g").attr("class", "dst");
        const arrow_group = svg.append("g").attr("class", "arrows");
        const utility_group = svg.append("g").attr("class", "utilities");
        this.xScale = d3.scaleLinear().domain([0, 1]).range([0, this.svgSize.width]);
        this.yScale = d3.scaleLinear().domain([0, 1]).range([0, this.svgSize.height]);
        add_utility_button({
            parent: utility_group,
            class_name: "show-trajectory",
            activated_color: "rgb(187 247 208)",
            deactivated_color: "white",
            activated_text_color: "black",
            deactivated_text_color: "#aaaaaa",
            text: "trajectories",
            x: -3,
            y: 0,
            width: 80,
            height: 18,
            onClick: () => {
                this.show_trajectory = !this.show_trajectory;
                const svg = d3.select(`#${this.svgId}`);
                svg.selectAll("circle.interpolation_point").attr("opacity", this.show_trajectory ? 1 : 0)
            }
        })
    }
    update_recommendations(recommendation_nodes: tNode[]) {
        console.log(recommendation_nodes)
        const svg = d3.select(`#${this.svgId}`);
        const ideal_group = svg.select("g.ideal");
        const bubble_group = svg.select("g.bubbles");
        const bubble_path = create_bubble_path(recommendation_nodes.map(node => [this.xScale(node.coordinates[0]), this.yScale(node.coordinates[1])]), 5)
        bubble_group.select("path.ideal_bubble").remove()
        bubble_group.append("path")
            .attr("class", "ideal_bubble").attr("d", bubble_path)
            .attr("fill", "lightgreen")
            .attr("opacity", 0.2)
        ideal_group.selectAll("circle.ideal_node")
            .data(recommendation_nodes)
            .join("circle")
            .attr("class", "ideal_node")
            .attr("cx", (node: tNode) => this.xScale(node.coordinates[0]))
            .attr("cy", (node: tNode) => this.yScale(node.coordinates[1]))
            .attr("r", node_radius)
            .attr("fill", (d) => cluster_colors(d.cluster))
            // .attr("fill", "lightgray")
            .attr("stroke", "black")
            .attr("stroke-width", 1.2)
    }
    update(src_optimization: tOptimization | undefined, dst_optimization: tOptimization ) {
        console.log("opt scatterplot update")
        const self = this
        const svg = d3.select(`#${this.svgId}`);
        const node_group = svg.select("g.nodes");
        const recommendation_nodes = get(recommended_nodes)
        // const recommendation_node_ids = get(recommended_nodes)?.map(node => node.id) || []
        const bubble_group = svg.select("g.bubbles");
        bubble_group.selectAll("path.bubble_contour").remove()
        const intra_cluster_distances = dst_optimization.nodes.map(node => node.intra_cluster_distance!)
        const min_intra_cluster_distance = Math.min(...intra_cluster_distances)
        const max_intra_cluster_distance = Math.max(...intra_cluster_distances)
        const nodeRadiusScale = d3.scaleLinear().domain([min_intra_cluster_distance, max_intra_cluster_distance]).range([3, 10])
        // src
        if(src_optimization) {
            const src_group = node_group.select("g.src")
            src_group.selectAll("*").remove()
            // const src_nodes = src_optimization.nodes.filter(node => !recommendation_node_ids.includes(node.id))
            const src_nodes = src_optimization.nodes.filter(node => !too_close(node, recommendation_nodes))
            this.update_optimization_snapshot(src_nodes, src_group, bubble_group, nodeRadiusScale, optimization_colors[0], optimization_opacities[0])
        }
        // dst
        const dst_group = node_group.select("g.dst")
        dst_group.selectAll("*").remove()
        // const dst_nodes = dst_optimization.nodes.filter(node => !recommendation_node_ids.includes(node.id))
        const dst_nodes = dst_optimization.nodes.filter(node => !too_close(node, recommendation_nodes))
        // const dst_nodes = dst_optimization.nodes
        this.update_optimization_snapshot(dst_nodes, dst_group, bubble_group, nodeRadiusScale, optimization_colors[1], optimization_opacities[1])
    }

    update_optimization_snapshot(nodes: tNode[], node_parent: any, bubble_parent: any, nodeRadiusScale: any, color: string, opacity: number) {
        const self = this
        node_parent.selectAll("circle.node").data(nodes)
            .join("circle")
            .attr("class", "node")
            .attr("cx", (node: tNode) => self.xScale(node.coordinates[0]))
            .attr("cy", (node: tNode) => self.yScale(node.coordinates[1]))
            .attr("r", (d) => nodeRadiusScale(d.intra_cluster_distance!))
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("opacity", opacity)
            .attr("stroke-width", 1)
        const testset_bubble = create_bubble_path(nodes.map(node => [self.xScale(node.coordinates[0]), self.yScale(node.coordinates[1])]), 10)
        bubble_parent.append("path")
            .attr("class", "bubble_contour").attr("d", testset_bubble)
            .attr("fill", color)
            // .attr("opacity", opacity)
    }

    update_movement(src_optimization: tOptimization, dst_optimization: tOptimization, statistics: tStatistics) {
        if(!this.show_trajectory) return;
        const self = this
        const svg = d3.select(`#${this.svgId}`);
        const line_group = svg.select("g.lines");
        // const recommendation_node_ids = get(recommended_nodes)?.map(node => node.id) || []
        const recommendation_nodes = get(recommended_nodes)
        const kept_node_indices = src_optimization.nodes.reduce((acc, node, i) => { if(!too_close(node, recommendation_nodes)) acc.push(i); return acc}, [] as any[])
        // node radius scale
        const intra_cluster_distances = src_optimization.nodes.map(node => node.intra_cluster_distance!)
        const min_intra_cluster_distance = Math.min(...intra_cluster_distances)
        const max_intra_cluster_distance = Math.max(...intra_cluster_distances)
        const nodeRadiusScale = d3.scaleLinear().domain([min_intra_cluster_distance, max_intra_cluster_distance]).range([3, 10])
        // trajectory_colors 
        const movement_srcs = src_optimization.nodes
        // const movement_dsts = dst_optimization.nodes
        // const one_iteration_lines: [tNode, tNode][] = movement_srcs.map((_, i) => [movement_srcs[i], movement_dsts[i]])
        // const global_mins = statistics.global_mins
        // const global_maxes = statistics.global_maxes
        // const direction_colors = one_iteration_lines.map((d) => categorize_distance(d, get(selected_metrics), get(target_ranges), global_mins, global_maxes))
        // const trajectory_colors = filter_by_indices(direction_colors, recommended_node_indices)
        // const end_trajectory_colors = trajectory_colors.map(color => d3.color(color).darker(1.5).formatHex())
        // const colorScales = trajectory_colors.map((color, i) => d3.scaleLinear().domain([0, dst_optimization.trajectories![0].length]).range([color, end_trajectory_colors[i]]))
        const samples = dst_optimization.trajectories![0].length
        const colorScale = d3.scaleLinear().domain([0, samples]).range(["#fafafa", "#ababab"])
        // bind
        const target_trajectories = kept_indices(dst_optimization.trajectories, kept_node_indices)
        line_group.selectAll("g.trajectory")
            .data(target_trajectories)
            .join("g")
            .attr("class", "trajectory")
            .each(function(trajectory, node_index) {
                // const opacityScale = d3.scaleLinear().domain([0, trajectory.length]).range([1, 0.2])
                // const colorScale = d3.scaleLinear().domain([0, trajectory.length]).range(["green", "lightgreen"])
                const trajectory_group = d3.select(this)
                trajectory_group.selectAll("circle.interpolation_point")
                    .data(trajectory.filter((_, i) => i % 2 === 0))
                    .join("circle")
                    .attr("class", "interpolation_point")
                    .attr("cx", (d: number[]) => self.xScale(d[0]))
                    .attr("cy", (d: number[]) => self.yScale(d[1]))
                    .attr("r", nodeRadiusScale(movement_srcs[node_index].intra_cluster_distance!))
                    .attr("fill", (_, i) => colorScale(i*2))
                    // .attr("fill", "lightgray")
                    // .attr("fill", "lightgreen")
                    // .attr("opacity", (_, i) => opacityScale(i))
                
            })
    }
}

function create_bubble_path(points, radius) {
  const pad = 0;
  // bubbles can be reused for subsequent runs or different sets of rectangles
  const bubbles = new BubbleSet();
//   const first_point = points[0]
//   const last_point = points[points.length - 1]
//   console.log(first_point, last_point)
//   const connector_point = [(first_point[0] + last_point[0])/2, (first_point[1] + last_point[1])/2]
//   const closed_points = points.concat([connector_point])
    const closed_points = points
  // rectangles needs to be a list of objects of the form { x: 0, y: 0, width: 0, height: 0 }
  // lines needs to be a list of objects of the form { x1: 0, x2: 0, y1: 0, y2: 0 }
  // lines can be null to infer lines between rectangles automatically
  const rectangles = closed_points.map((point) => ({ x: point[0] - radius, y: point[1] - radius, width: 2*radius, height: 2*radius }));
  const list = bubbles.createOutline(
    BubbleSet.addPadding(rectangles, pad),
    [],
    null /* lines */
  );
  // outline is a path that can be used for the attribute d of a SVG path element
  const outline = new PointPath(list).transform([
    // new ShapeSimplifier(0.0),  // removes path points by removing (near) colinear points
    new BSplineShapeGenerator(),  // smoothes the output shape using b-splines
    // new ShapeSimplifier(0.0),  // removes path points by removing (near) colinear points
  ]);
  return outline
}
function arrow_animation(parent, arrow_position_data){ // har
    console.log("arrow_animation", arrow_position_data)
    let arrows = parent.selectAll("use")
        .data(arrow_position_data)
        .join("use")
        .attr("class", "arrow")
        .attr("xlink:href", "#arrowhead")
        .attr("fill", "gray")

    // repeat();
    
    function repeat() {
        arrows.attr("transform", (d) => `translate(${d[0][0]}, ${d[0][1]})`)
        .transition()
        .duration(4000)
        .ease("linear")
        .attr({
            'x1': 0,
            'y1': 430,
            'x2': 168,
            'y2': 430   
        })
        .each("end", repeat);
    };
};


function compute_centroid(points: number[][]) {
    const centroid = points.reduce((acc, point) => {
        return [acc[0] + point[0], acc[1] + point[1]]
    }, [0, 0])
    return [centroid[0]/points.length, centroid[1]/points.length]
}

function categorize_direction(d: [tNode, tNode], ideal_node_centroid: number[]) {
    const src = d[0].coordinates
    const dst = d[1].coordinates
    const src_to_dst = [dst[0] - src[0], dst[1] - src[1]]
    const src_to_ideal = [ideal_node_centroid[0] - src[0], ideal_node_centroid[1] - src[1]]
    const angle = Math.abs(Math.atan2(src_to_dst[1], src_to_dst[0]) - Math.atan2(src_to_ideal[1], src_to_ideal[0]))
    const right_angle = Math.PI / 4
    const off_angle = Math.PI / 2
    console.log(180 * angle / Math.PI, angle < right_angle, angle > off_angle)
    if(angle < right_angle) return "green"
    if(angle > off_angle) return "red"
    return "gray"
}

function categorize_distance(d: [tNode, tNode], selected_metrics: string[], target_ranges: any, global_mins: number[], global_maxes: number[]) {
    const src_distance: number = compute_distance(d[0], selected_metrics, target_ranges, global_mins, global_maxes)
    const dst_distance: number = compute_distance(d[1], selected_metrics, target_ranges, global_mins, global_maxes)
    console.log(src_distance, dst_distance, src_distance - dst_distance, d[0].cluster)
    if (Math.abs(src_distance - dst_distance) < 0.15) return "#d0d0d0"
    else if(src_distance > dst_distance) return "#98f955"
    else return "#ff0000"
}


function rotate_gradient(l, linearGradient) {
        // let l: any = document.getElementById("l");
        let x1=parseFloat(l.getAttribute("x1"));
        let y1=parseFloat(l.getAttribute("y1"));
        let x2=parseFloat(l.getAttribute("x2"));
        let y2=parseFloat(l.getAttribute("y2"));
        let w=parseFloat(l.getAttribute("stroke-width"));
        console.log({x1, y1, x2, y2, w})
    
        // step 1
        let dx=x2-x1;
        let dy=y2-y1;
    
        // step 2
        const len=Math.sqrt(dx*dx+dy*dy);
        dx=dx/len;
        dy=dy/len;
    
        // step 3
        let temp=dx;
        dx=-dy;
        dy=temp;
        
        //step 4
        dx=w*dx;
        dy=w*dy;
    
        //step 5
        let gradient_x1=x1+dx*0.5;
        let gradient_y1=y1+dy*0.5;
        let gradient_x2=x1-dx*0.5;
        let gradient_y2=y1-dy*0.5;
    
        // let e: any  = document.getElementById("e");
        linearGradient.setAttribute("x1",gradient_x1);
        linearGradient.setAttribute("y1",gradient_y1);
        linearGradient.setAttribute("x2",gradient_x2);
        linearGradient.setAttribute("y2",gradient_y2);
    }

function compute_distance(d: tNode, selected_metrics: string[], target_ranges: any, global_mins: number[], global_maxes: number[]) {
    let total_distance: number  = 0
    let distances: number[] = []
    selected_metrics.forEach((metric, index) => {
        if (target_ranges[metric][0] === undefined) return;
        const value = d.features[metric];
        const distance = in_range(value, target_ranges[metric])
        ? 0
        : distance_to_range(value, target_ranges[metric], global_mins[index], global_maxes[index]);
        total_distance += distance;
        distances.push(distance)
    });
    return total_distance;
}
function in_range(value, range) {
    return value >= range[0] && value <= range[1];
}
function distance_to_range(value, range, min, max) {
    return (Math.min(Math.abs(value - range[0]), Math.abs(value - range[1])) )/ (max - min);
}

function kept_indices(arr, indices) {
    return arr.filter((_, i) => indices.includes(i))
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
        .attr("fill", activated_color)
        .attr("cursor", "pointer")
        .attr("stroke", "gray")
        .attr("rx", "1%")
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
        .attr("fill", activated_text_color)
        .attr("font-size", "0.8rem")
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle");
}

function too_close(node: tNode, recommendation_nodes: tNode[] | undefined) {
    if(!recommendation_nodes) return false;
    const recommendation_node_ids = recommendation_nodes.map(node => node.id)
    if(recommendation_node_ids.includes(node.id)) return true;
    const distances = recommendation_nodes.map(recommendation_node => Math.sqrt((node.coordinates[0] - recommendation_node.coordinates[0])**2 + (node.coordinates[1] - recommendation_node.coordinates[1])**2))
    console.log(distances)
    const threshold = 0.1
    if(distances.filter(distance => distance < threshold).length > 0) return true;
    return false
}