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
import { selected_metrics, target_ranges } from "lib/store";
import { get } from "svelte/store";
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
        const line_group = svg.append("g").attr("class", "lines");
        const node_group = svg.append("g").attr("class", "nodes");
        const ideal_group = svg.append("g").attr("class", "ideal");
        const arrow_group = svg.append("g").attr("class", "arrows");
        this.xScale = d3.scaleLinear().domain([0, 1]).range([0, this.svgSize.width]);
        this.yScale = d3.scaleLinear().domain([0, 1]).range([0, this.svgSize.height]);
    }
    update_recommendations(recommendation_nodes: tNode[]) {
        console.log(recommendation_nodes)
        const svg = d3.select(`#${this.svgId}`);
        const ideal_group = svg.select("g.ideal");
        ideal_group.selectAll("circle.ideal_node")
            .data(recommendation_nodes)
            .join("circle")
            .attr("class", "ideal_node")
            .attr("cx", (node: tNode) => this.xScale(node.coordinates[0]))
            .attr("cy", (node: tNode) => this.yScale(node.coordinates[1]))
            .attr("r", 4)
            .attr("fill", (d) => cluster_colors(d.cluster))
            // .attr("fill", "lightgray")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
        const bubble_path = create_bubble_path(recommendation_nodes.map(node => [this.xScale(node.coordinates[0]), this.yScale(node.coordinates[1])]), 5)
        ideal_group.select("path.bubble_contour").remove()
        ideal_group.append("path")
            .attr("class", "bubble_contour").attr("d", bubble_path)
            .attr("fill", "lightgreen")
            .attr("opacity", 0.2)
    }

    update(optimizations: tOptimization[]) {
        console.log("opt_scatterplot update", optimizations)
        const self = this
        const svg = d3.select(`#${this.svgId}`);
        const node_group = svg.select("g.nodes");
        const opt_group = node_group.selectAll("g.optimization")
        .data(optimizations)
        .join("g")
        .attr("class", "optimization")
        .each(function(optimization: tOptimization, i: number) {
            const group = d3.select(this);
            // const optimization_color = optimization_colors[i % optimization_colors.length];
            group.selectAll("circle.node").data(optimization.nodes)
                .join("circle")
                .attr("class", "node")
                .attr("cx", (node: tNode) => self.xScale(node.coordinates[0]))
                .attr("cy", (node: tNode) => self.yScale(node.coordinates[1]))
                .attr("r", 4)
                .attr("fill", "lightgray")
                .attr("stroke", "#f0f0f0")
                .attr("stroke-width", 0.5)
        })
    }
    update_movement(optimizations: tOptimization[], ideal_nodes: tNode[]) {
        console.log({optimizations})
        const self = this
        const svg = d3.select(`#${this.svgId}`);
        const line_group = svg.select("g.lines");
        optimizations.forEach((optimization, i) => {
            if(optimization.trajectories === undefined) return
            svg.selectAll("g.trajectory")
                .data(optimization.trajectories)
                .join("g")
                .attr("class", "trajectory")
                .each(function(trajectory) {
                    const opacityScale = d3.scaleLinear().domain([0, trajectory.length]).range([1, 0.2])
                    const colorScale = d3.scaleLinear().domain([0, trajectory.length]).range(["green", "lightgreen"])
                    const trajectory_group = d3.select(this)
                    trajectory_group.selectAll("circle.interpolation_point")
                        .data(trajectory)
                        .join("circle")
                        .attr("class", "interpolation_point")
                        .attr("cx", (d: number[]) => self.xScale(d[0]))
                        .attr("cy", (d: number[]) => self.yScale(d[1]))
                        .attr("r", 2)
                        .attr("fill", (_, i) => colorScale(i))
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

function categorize_distance(d: [tNode, tNode], selected_metrics: string[], target_ranges: any) {
    const src_distance: number = compute_distance(d[0], selected_metrics, target_ranges)
    const dst_distance: number = compute_distance(d[1], selected_metrics, target_ranges)
    console.log(src_distance, dst_distance)
    if (Math.abs(src_distance - dst_distance) < 0.1) return "gray"
    else if(src_distance > dst_distance) return "green"
    else return "red"
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

function compute_distance(d: tNode, selected_metrics: string[], target_ranges: any) {
    console.log({target_ranges})
    let total_distance: number  = 0
    selected_metrics.forEach((metric) => {
        if (target_ranges[metric][0] === undefined) return;
        const value = d.features[metric];
        const distance = in_range(value, target_ranges[metric])
        ? 0
        : distance_to_range(value, target_ranges[metric]);
        total_distance += distance;
    });
    return total_distance;
}
function in_range(value, range) {
    return value >= range[0] && value <= range[1];
}
function distance_to_range(value, range) {
    return Math.min(Math.abs(value - range[0]), Math.abs(value - range[1]));
}

