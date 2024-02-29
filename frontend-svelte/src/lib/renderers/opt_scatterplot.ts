import type { tOptimization, tNode } from "lib/types";
import { optimization_colors } from "lib/constants/Colors";

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
        this.xScale = d3.scaleLinear().domain([0, 1]).range([0, this.svgSize.width]);
        this.yScale = d3.scaleLinear().domain([0, 1]).range([this.svgSize.height, 0]);
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
            const optimization_color = optimization_colors[i % optimization_colors.length];
            group.selectAll("circle.node").data(optimization.nodes)
                .join("circle")
                .attr("class", "node")
                .attr("cx", (node: tNode) => self.xScale(node.coordinates[0]))
                .attr("cy", (node: tNode) => self.yScale(node.coordinates[1]))
                .attr("r", 4)
                // .attr("fill", (node: tNode) => cluster_colors(node.cluster))
                .attr("fill", optimization_color)
                .attr("stroke", "gray")
                .attr("stroke-width", 0.5)
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
            .attr("stroke", "gray")
            .attr("stroke-width", 0.5)
            .attr("stroke-dasharray", "5, 5")
    }
}