import * as d3 from "d3"
import type { tOptimization, tNode } from "lib/types";
import { metric_categories, metric_abbrs } from "lib/constants";
import { get } from "svelte/store";
import { recommended_nodes } from "lib/store";
export class OptimizationStats {
    svgId: string
    svgSize: any
    tag_width: number
    metrics: string[]
    global_mins: number[]
    global_means: number[]
    global_maxes: number[]
    barMouseover: any | undefined
    barMouseout: any | undefined
    barClick: any | undefined
    xScales: any[]
    yScale: any
    constructor(svgId, svgSize,
        metrics,
        global_mins, global_means, global_maxes,
      barMouseover: any=undefined,
      barMouseout: any=undefined,
      barClick: any=undefined) {
        this.svgId = svgId;
        this.svgSize = svgSize;
        this.barMouseover = barMouseover
        this.barMouseout = barMouseout
        this.barClick = barClick
        this.metrics = metrics
        this.global_mins = global_mins
        this.global_means = global_means
        this.global_maxes = global_maxes
        this.tag_width = 100
        this.yScale = d3.scaleBand(
            [...Array(metrics.length).keys()],
            [0, this.svgSize.height]
        ); 
        this.xScales = []
        metrics.forEach((metric, index) => {
            const ranges = metric_categories[metric]
            const xMax =
            ranges[ranges.length - 1].end === -1
                ? global_maxes[index]
                : ranges[ranges.length - 1].end;
            this.xScales.push(d3
            .scaleLinear()
            .domain([ranges[0].start, xMax])
            .range([this.tag_width+5, this.svgSize.width]))
        })
    }

    init() {
    }

    update_tags() {
       const svg = d3.select(`#${this.svgId}`) 
       const tag_group = svg.append("g").attr("class", "tag-group")
       const self = this
       tag_group.selectAll("g.tag")
        .data(this.metrics)
        .join("g")
        .attr("class", "tag")
        .attr("transform", (metric, i) => `translate(0, ${this.yScale(i)})`)
        .attr("pointer-events", "none")
        .each(function(metric, i) {
            const group = d3.select(this)
            group.selectAll("*").remove()
            group.append("rect")
                .attr("class", "tag-border")
                .attr("x", 0)
                .attr("y", self.yScale.bandwidth()/6)
                .attr("width", 100)
                .attr("height", self.yScale.bandwidth()/1.5)
                .attr("fill", "#c7f0a5")
                .attr("stroke-width", 1)
            group.append("text")
                .attr("class", "tag-text")
                .attr("x", 50)
                .attr("y", self.yScale.bandwidth()/2+5)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .text(metric_abbrs[metric])
                .attr("font-size", "2.5rem")
        })
    }

    update(optimization: tOptimization) {
        const svg = d3.select(`#${this.svgId}`)
        svg.selectAll("g").remove();
        this.update_tags()
        const features = optimization.nodes.map(node => node.features)
        const recommendation_node_ids = get(recommended_nodes)?.map(node => node.id) || []
        const intra_cluster_distances = optimization.nodes.map(node => node.intra_cluster_distance!)
        const min_intra_cluster_distance = Math.min(...intra_cluster_distances)
        const max_intra_cluster_distance = Math.max(...intra_cluster_distances)
        const nodeRadiusScale = d3.scaleLinear().domain([min_intra_cluster_distance, max_intra_cluster_distance]).range([this.yScale.bandwidth()/8, this.yScale.bandwidth()/4])
        this.metrics.forEach((metric, i) => {
            const metric_group = svg.append("g").attr("class", metric)
            const metric_values = features.map(feature => feature[metric])
            const min = Math.min(...metric_values)
            const max = Math.max(...metric_values)
           
            const testset_nodes = optimization.nodes.filter(node => !recommendation_node_ids.includes(node.id)).sort((a, b) => -(a.intra_cluster_distance! - b.intra_cluster_distance!))

            const test_nodes = metric_group.selectAll("circle.test_case")
                .data(testset_nodes)
                .join("circle")
                .attr("class", "test_case")
                // .attr("cx", (node: tNode) => this.xScales[i](node.features[metric] - this.global_means[i]))
                .attr("cx", (node: tNode) => this.xScales[i](node.features[metric]))
                .attr("cy", this.yScale(i) + this.yScale.bandwidth() / 2)
                .attr("r", (node: tNode) => nodeRadiusScale(node.intra_cluster_distance!))
                .attr("fill", "#fafafa")
                .attr("stroke", "black")
                .attr("stroke-width", 2.5)
        })
    } 
    update_recommendations(target_ranges: {[key:string]:[number|undefined, number|undefined]}) {
        const svg = d3.select(`#${this.svgId}`)
        const target_features = Object.keys(target_ranges).filter(metric => target_ranges[metric][0] !== undefined && target_ranges[metric][1] !== undefined)
        this.metrics.forEach((metric, i) => {
            if(target_ranges[metric] === undefined) return
            const metric_group = svg.select("g." + metric)
            metric_group.selectAll("rect.recommendation").remove()
            const min = target_ranges[metric][0]!
            const max = target_ranges[metric][1]!
            metric_group.append("rect")
                .attr("class", "recommendation")
                .attr("x", this.xScales[i](min))    
                .attr("y", this.yScale(i) + this.yScale.bandwidth()/4)
                .attr("width", this.xScales[i](max) - this.xScales[i](min))
                .attr("height", this.yScale.bandwidth()/2)
                .attr("fill", "#90ee9090") // lightgreen
                .attr("stroke-dasharray", "20,20")
                .attr("stroke-width", 1)
                .attr("opacity", target_features.includes(metric) ? 1 : 0)
                .lower()
        })
    }

    highlightNode(node: tNode) {
        const svg = d3.select(`#${this.svgId}`)
        svg.selectAll("circle.test_case")
            .classed("dismissed", true)
            .classed("highlight", false)
            .filter((d: tNode) => d.id === node.id)
            .classed("dismissed", false)
            .classed("highlight", true)
    }

    dehighlightAll() {
        const svg = d3.select(`#${this.svgId}`)
        svg.selectAll("circle.test_case")
            .classed("dismissed", false)
            .classed("highlight", false)
    }
}