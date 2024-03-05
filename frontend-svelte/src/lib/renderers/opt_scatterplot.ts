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
                // .attr("fill", (node: tNode) => cluster_colors(node.cluster))
                .attr("fill", (d) => cluster_colors(d.cluster))
                // .attr("stroke", "gray")
                // .attr("stroke-width", 0.5)
                .attr("stroke", "#0a0a0a")
                .attr("stroke-width", 1)
        })
    }
    // update_movement(optimizations: tOptimization[], src_index: number, dst_index: number) {
    update_movement(optimizations: tOptimization[]) {
        const self = this
        const svg = d3.select(`#${this.svgId}`);
        const line_group = svg.select("g.lines");
        let movement_data: [tNode, tNode][] = []
        for(let opt_i = 0; opt_i < optimizations.length-1; opt_i++) {
            const movement_srcs = optimizations[opt_i].nodes;
            const movement_dsts = optimizations[opt_i+1].nodes;
            const one_iteration_lines: [tNode, tNode][] = movement_srcs.map((_, i) => [movement_srcs[i], movement_dsts[i]])
            movement_data = movement_data.concat(one_iteration_lines)
            console.log({movement_data})
        }
        const movement_lines = line_group.selectAll("line.movement")
            .data(movement_data)
            .join("line")
            .attr("class", "movement")
            .attr("x1", (d: [tNode, tNode]) => self.xScale(d[0].coordinates[0]))
            .attr("y1", (d: [tNode, tNode]) => self.yScale(d[0].coordinates[1]))
            .attr("x2", (d: [tNode, tNode]) => self.xScale(d[1].coordinates[0]))
            .attr("y2", (d: [tNode, tNode]) => self.yScale(d[1].coordinates[1]))
            .attr("stroke", (d: [tNode, tNode]) => cluster_colors(d[0].cluster))
            .attr("stroke-width", 4)
            .attr("stroke-dasharray", "5, 5")
        const arrows = line_group.selectAll("use.arrow")
            .data(movement_data)
            .join("use")
            .attr("class", "arrow")
            .attr("xlink:href", "#arrowhead")
            // .attr("fill", (d: [tNode, tNode]) => cluster_colors(d[0].cluster))
            // .attr("stroke", "gray")
            .attr("stroke", (d: [tNode, tNode]) => cluster_colors(d[0].cluster))
            .attr("fill", "none")
            .attr("transform", (d: [tNode, tNode]) => {
                const src = d[0].coordinates
                const dst = d[1].coordinates
                const src_scaled = [self.xScale(src[0]), self.yScale(src[1])]
                const dst_scaled = [self.xScale(dst[0]), self.yScale(dst[1])]
                const mid_scaled = [(src_scaled[0] + dst_scaled[0])/2, (src_scaled[1] + dst_scaled[1])/2]
                const angle = Math.atan2(dst[1] - src[1], dst[0] - src[0]) * 180 / Math.PI;
                return `translate(${mid_scaled[0]}, ${mid_scaled[1]}) rotate(${angle})`
            })
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
        .attr("xlink:href", "#arrowhead");
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
