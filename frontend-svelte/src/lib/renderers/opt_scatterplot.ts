import type { tOptimization, tNode } from "lib/types";
// import { optimization_colors } from "lib/constants/Colors";
import { cluster_colors } from "lib/constants";
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
        const arrow_group = svg.append("g").attr("class", "arrows");
        this.xScale = d3.scaleLinear().domain([0, 1]).range([0, this.svgSize.width]);
        this.yScale = d3.scaleLinear().domain([0, 1]).range([0, this.svgSize.height]);
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

    update(optimizations: tOptimization[]) {
        console.log("opt_scatterplot update", optimizations)
        const self = this
        const svg = d3.select(`#${this.svgId}`);
        const node_group = svg.select("g.nodes");
        const nodeOpacityScale = d3.scaleLinear().domain([0, optimizations.length-1]).range([0.2, 1])
        const bubbleOpacityScale = d3.scaleLinear().domain([0, optimizations.length-1]).range([0.3, 0.9])
        const recommendation_node_ids = get(recommended_nodes)?.map(node => node.id) || []
        const bubble_group = svg.select("g.bubbles");
        bubble_group.selectAll("path.bubble_contour").remove()
        const opt_group = node_group.selectAll("g.optimization")
        .data(optimizations)
        .join("g")
        .attr("class", "optimization")
        .each(function(optimization: tOptimization, i: number) {
            const group = d3.select(this);
            // const optimization_color = optimization_colors[i % optimization_colors.length];
            const testset_nodes = optimization.nodes.filter(node => !recommendation_node_ids.includes(node.id))
            console.log(testset_nodes.length, optimization.nodes.length)
            group.selectAll("circle.node").data(testset_nodes)
                .join("circle")
                .attr("class", "node")
                .attr("cx", (node: tNode) => self.xScale(node.coordinates[0]))
                .attr("cy", (node: tNode) => self.yScale(node.coordinates[1]))
                .attr("r", node_radius)
                .attr("fill", "white")
                .attr("stroke", "black")
                // .attr("stroke", "#f0f0f0")
                .attr("opacity", nodeOpacityScale(i))
                .attr("stroke-width", 1)
            const testset_bubble = create_bubble_path(testset_nodes.map(node => [self.xScale(node.coordinates[0]), self.yScale(node.coordinates[1])]), 10)
            bubble_group.append("path")
                .attr("class", "bubble_contour").attr("d", testset_bubble)
                .attr("fill", "lightgray")
                .attr("opacity", bubbleOpacityScale(i))
        })
    }
    update_movement(optimizations: tOptimization[], ideal_nodes: tNode[]) {
        console.log({optimizations})
        const self = this
        const svg = d3.select(`#${this.svgId}`);
        const line_group = svg.select("g.lines");
        const global_mins = optimizations[0].statistics.global_mins
        const global_maxes = optimizations[0].statistics.global_maxes
        let opt_trajectory_colors: any[] = []
        const recommendation_node_ids = get(recommended_nodes)?.map(node => node.id) || []
        const recommended_node_indices = optimizations[0].nodes.reduce((acc, node, i) => { if(!recommendation_node_ids.includes(node.id)) acc.push(i); return acc}, [] as any[])
        for(let i = 0; i < optimizations.length-1; i++) {
            const movement_srcs = optimizations[i].nodes
            const movement_dsts = optimizations[i+1].nodes
            const one_iteration_lines: [tNode, tNode][] = movement_srcs.map((_, i) => [movement_srcs[i], movement_dsts[i]])
            const direction_colors = one_iteration_lines.map((d) => categorize_distance(d, get(selected_metrics), get(target_ranges), global_mins, global_maxes))
            opt_trajectory_colors.push(direction_colors)
        }

        const trajectory_groups = line_group.selectAll("g.trajectory_group")
            .data(optimizations.slice(1))
            .join("g")
            .attr("id", (_, i) => `trajectory-${i+1}`)
            .attr("class", "trajectory_group")
        optimizations.forEach((optimization, i) => {
            if(optimization.trajectories === undefined) return
            const trajectory_colors = filter_by_indices(opt_trajectory_colors[i-1], recommended_node_indices)
            // const lighter_trajectory_colors = trajectory_colors.map(color => d3.color(color).brighter(3).formatHex())
            const end_trajectory_colors = trajectory_colors.map(color => d3.color(color).darker(1.5).formatHex())
            console.log(trajectory_colors, end_trajectory_colors)
            const colorScales = trajectory_colors.map((color, i) => d3.scaleLinear().domain([0, optimization.trajectories[0].length]).range([color, end_trajectory_colors[i]]))
            const target_trajectories = filter_by_indices(optimization.trajectories, recommended_node_indices)
            console.log({target_trajectories}, recommended_node_indices)
            const trajectory_group = line_group.select(`#trajectory-${i}`)
            trajectory_group.selectAll("g.trajectory")
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
                        .attr("r", 3)
                        .attr("fill", (_, i) => colorScales[node_index](i*3))
                        // .attr("fill", "lightgreen")
                        // .attr("opacity", (_, i) => opacityScale(i))
                    
                })
        })
    }
    _update_movement(optimizations: tOptimization[], ideal_nodes: tNode[]) {
        console.log({optimizations})
        const self = this
        const svg = d3.select(`#${this.svgId}`);
        const line_group = svg.select("g.lines");
        const ideal_node_centroid = compute_centroid(ideal_nodes.map(node => node.coordinates))
        let movement_data: [tNode, tNode][] = []
        for(let opt_i = 0; opt_i < optimizations.length-1; opt_i++) {
            const movement_srcs = optimizations[opt_i].nodes;
            const movement_dsts = optimizations[opt_i+1].nodes;
            const one_iteration_lines: [tNode, tNode][] = movement_srcs.map((_, i) => [movement_srcs[i], movement_dsts[i]])
            movement_data = movement_data.concat(one_iteration_lines)
            console.log({movement_data})
        }
        // defs
        svg.selectAll("defs.line-gradient")
            .data(movement_data)
            .join("defs")
            .attr("class", "line-gradient")
            .each(function(d) {
                const defs = d3.select(this)
                // const direction_color = categorize_direction(d, ideal_node_centroid)
                const direction_color = categorize_distance(d, get(selected_metrics), get(target_ranges))
                defs.selectAll("*").remove()
                const linearGradient = defs.append("linearGradient")
                    .attr("id", (d) => `line-gradient-${d[0].id}-${d[1].id}`)
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", 1)
                    .attr("y2", 1)
                    .attr("gradientUnits", "userSpaceOnUse")
                linearGradient.append("stop")
                    .attr("stop-color", direction_color)
                    .attr("offset", "0")
                linearGradient.append("stop")
                    .attr("stop-color", "white")
                    .attr("offset", "1")
            })
        const movement_lines = line_group.selectAll("line.movement")
            .data(movement_data)
            .join("line")
            .attr("class", "movement")
            .attr("x1", (d: [tNode, tNode]) => self.xScale(d[0].coordinates[0]))
            .attr("y1", (d: [tNode, tNode]) => self.yScale(d[0].coordinates[1]))
            .attr("x2", (d: [tNode, tNode]) => self.xScale(d[1].coordinates[0]))
            .attr("y2", (d: [tNode, tNode]) => self.yScale(d[1].coordinates[1]))
            .attr("stroke-width", 4)
            .attr("stroke", function(d: [tNode, tNode]) {
                const line = d3.select(this)
                svg.select(`#line-gradient-${d[0].id}-${d[1].id}`)
                    .attr("x1", +line.attr("x1"))
                    .attr("y1", +line.attr("y1"))
                    .attr("x2", +line.attr("x2"))
                    .attr("y2", +line.attr("y2"))
                // const line = d3.select(this).node()
                // const linearGradient = svg.select(`#line-gradient-${d[0].id}-${d[1].id}`).node()
                // rotate_gradient(line, linearGradient)
                return `url(#line-gradient-${d[0].id}-${d[1].id})`
            })
            // .attr("stroke", (d: [tNode, tNode]) => cluster_colors(d[0].cluster))
            // .attr("stroke", (d) => categorize_direction(d, ideal_node_centroid))
            // .attr("stroke-dasharray", "5, 5")
        
        // const arrows = line_group.selectAll("use.arrow")
        //     .data(movement_data)
        //     .join("use")
        //     .attr("class", "arrow")
        //     .attr("xlink:href", "#arrowhead")
        //     // .attr("fill", (d: [tNode, tNode]) => cluster_colors(d[0].cluster))
        //     // .attr("stroke", "gray")
        //     .attr("stroke", (d) => categorize_direction(d, ideal_node_centroid))
        //     .attr("fill", (d) => categorize_direction(d, ideal_node_centroid))
        //     .attr("transform", (d: [tNode, tNode]) => {
        //         const src = d[0].coordinates
        //         const dst = d[1].coordinates
        //         const src_scaled = [self.xScale(src[0]), self.yScale(src[1])]
        //         const dst_scaled = [self.xScale(dst[0]), self.yScale(dst[1])]
        //         const mid_scaled = [(src_scaled[0] + dst_scaled[0])/2, (src_scaled[1] + dst_scaled[1])/2]
        //         const angle = Math.atan2(dst[1] - src[1], dst[0] - src[0]) * 180 / Math.PI;
        //         // return `translate(${mid_scaled[0]}, ${mid_scaled[1]}) rotate(${angle})`
        //         return `translate(${src_scaled[0]}, ${src_scaled[1]}) rotate(${angle})`
        //     })

        // let arrow_position_data: any[] = Array.apply(null, Array(optimizations[0].nodes.length)).map(() => []) 
        // optimizations.forEach((optimization) => {
        //     optimization.nodes.forEach((node, i) => {
        //         arrow_position_data[i].push(node.coordinates)
        //     })
        // })
        // const arrow_group = svg.select("g.arrows");
        // arrow_animation(arrow_group, arrow_position_data)
    }
}

function create_bubble_path(points, radius) {
  const pad = 0;
  // bubbles can be reused for subsequent runs or different sets of rectangles
  const bubbles = new BubbleSet();
  // rectangles needs to be a list of objects of the form { x: 0, y: 0, width: 0, height: 0 }
  // lines needs to be a list of objects of the form { x1: 0, x2: 0, y1: 0, y2: 0 }
  // lines can be null to infer lines between rectangles automatically
  const rectangles = points.map((point) => ({ x: point[0] - radius, y: point[1] - radius, width: 2*radius, height: 2*radius }));
  const list = bubbles.createOutline(
    BubbleSet.addPadding(rectangles, pad),
    [],
    null /* lines */
  );
  // outline is a path that can be used for the attribute d of a SVG path element
  const outline = new PointPath(list).transform([
    new ShapeSimplifier(0.0),  // removes path points by removing (near) colinear points
    new BSplineShapeGenerator(),  // smoothes the output shape using b-splines
    new ShapeSimplifier(0.0),  // removes path points by removing (near) colinear points
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

function filter_by_indices(arr, indices) {
    return arr.filter((_, i) => indices.includes(i))
}