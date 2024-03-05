import * as d3 from "d3"
import type { tOptimization, tNode } from "lib/types";
import { metric_categories } from "lib/constants";
export class OptimizationStats {
    svgId: string
    svgSize: any
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
        this.yScale = d3.scaleBand(
            [...Array(metrics.length).keys()],
            [0, this.svgSize.height]
        ); 
        this.xScales = []
        metrics.forEach((metric, index) => {
            const half_width = Math.max(Math.abs(global_maxes[index] - global_means[index]), Math.abs(global_means[index] - global_mins[index]))
            this.xScales.push(d3.scaleLinear().domain([-half_width, half_width]).range([0, this.svgSize.width]))
            // const ranges = metric_categories[metric]
            // const xMax =
            // ranges[ranges.length - 1].end === -1
            //     ? global_maxes[index]
            //     : ranges[ranges.length - 1].end;
            // console.log(metric, [ranges[0].start, xMax])
            // this.xScales.push(d3
            // .scaleLinear()
            // .domain([ranges[0].start, xMax])
            // .range([0, this.svgSize.width]))
        })
    }

    init() {

    }
    update(optimization: tOptimization) {
        const svg = d3.select(`#${this.svgId}`)
        svg.selectAll("g").remove();
        console.log("optimization", optimization, svg.node(), this.svgId)
        const features = optimization.nodes.map(node => node.features)
        this.metrics.forEach((metric, i) => {
            const metric_group = svg.append("g").attr("class", metric)
            const metric_values = features.map(feature => feature[metric])
            const min = Math.min(...metric_values)
            const max = Math.max(...metric_values)
            // metric_group.append("rect")
            //     .attr("x", this.xScales[i](min - this.global_means[i]))    
            //     .attr("y", this.yScale(i))
            //     // .attr("width", this.xScales[i](max) - this.xScales[i](min))
            //     .attr("width", this.xScales[i](max - this.global_means[i]) - this.xScales[i](min - this.global_means[i]))
            //     .attr("height", this.yScale.bandwidth())
            //     .attr("fill", "#e0e0e0")
            //     .attr("stroke", "black")
            //     .attr("stroke-width", 1)
            const test_nodes = metric_group.selectAll("rect.test_case")
                .data(optimization.nodes)
                .join("rect")
                .attr("class", "test_case")
                .attr("x", (node: tNode) => this.xScales[i](node.features[metric] - this.global_means[i]))
                .attr("y", this.yScale(i))
                .attr("width", 8)
                .attr("height", this.yScale.bandwidth())
                .attr("fill", "gray")
                // .attr("stroke", "black")
        })
    } 
    update_recommendations(ideal_nodes: tNode[]) {
        const svg = d3.select(`#${this.svgId}`)
        const features = ideal_nodes.map(node => node.features)
        this.metrics.forEach((metric, i) => {
            const metric_group = svg.select("g." + metric)
            metric_group.selectAll("rect.recommendation").remove()
            const metric_values = features.map(feature => feature[metric])
            const min = Math.min(...metric_values)
            const max = Math.max(...metric_values)
            metric_group.append("rect")
                .attr("class", "recommendation")
                .attr("x", this.xScales[i](min - this.global_means[i]))    
                .attr("y", this.yScale(i))
                // .attr("width", this.xScales[i](max) - this.xScales[i](min))
                .attr("width", this.xScales[i](max - this.global_means[i]) - this.xScales[i](min - this.global_means[i]))
                .attr("height", this.yScale.bandwidth())
                .attr("fill", "#90ee9090") // lightgreen
                .attr("stroke", "gray")
                .attr("stroke-dasharray", "20,20")
                .attr("stroke-width", 1)
        // const ideal_node_elements = metric_group.selectAll("circle.ideal_node")
        //     .data(ideal_nodes)
        //     .join("circle")
        //     .attr("class", "ideal_node")
        //     .attr("cx", (node: tNode) => this.xScales[i](node.features[metric]))
        //     .attr("cy", this.yScale(i))
        //     .attr("r", 10)
        //     .attr("fill", "red")
        //     .attr("stroke", "black")
    })

    }
}