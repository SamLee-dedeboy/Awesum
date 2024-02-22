import * as d3 from "d3"
import { cluster_colors, metric_colors } from "lib/constants";
import type { tStatBarData } from "lib/types/statistics";
export class Statbars {
    svgId: string
    svgSize: any
    innerSize: any
    metric_index: number
    barColor: string | undefined
    barMouseover: any | undefined
    barMouseout: any | undefined
    barClick: any | undefined
    xScales: any[]
    yScale: any
    constructor(svgId, svgSize, innerSize, 
      metric_index, 
      barColor: string|undefined=undefined, 
      barMouseover: any=undefined,
      barMouseout: any=undefined,
      barClick: any=undefined) {
        this.svgId = svgId;
        this.svgSize = svgSize;
        this.innerSize = innerSize;
        this.metric_index = metric_index;
        this.barColor = barColor
        this.barMouseover = barMouseover
        this.barMouseout = barMouseout
        this.barClick = barClick
    }
    update(stats: tStatBarData[], 
      global_means: number[], global_mins: number[], global_maxes: number[], 
      sameScale: boolean=false, 
      colors: string[]=[], 
      cluster_labels: string[]|undefined=undefined,
      ) {
      let self = this; 
      let xScales;
      const g = d3.select(this.svgId).select("g.inner");
      // scales
      if (sameScale) {
        console.assert(global_means.length === 1 && global_mins.length === 1 && global_maxes.length === 1)
        const half_width = Math.max(Math.abs(global_maxes[0] - global_means[0]), Math.abs(global_means[0] - global_mins[0]));
        xScales = [d3.scaleLinear().domain([-half_width, half_width]).range([0, this.innerSize.width])];
      } else {
        console.assert(stats.length === global_means.length && stats.length === global_mins.length && stats.length === global_maxes.length)
         xScales = stats.map((_, index) => {
            const half_width = Math.max(
                Math.abs(global_maxes[index] - global_means[index]),
                Math.abs(global_means[index] - global_mins[index])
            );
          return d3
            .scaleLinear()
            .domain([-half_width, half_width])
            .range([0, this.innerSize.width]);
        });
      }
      const yScale = d3.scaleBand(
        [...Array(stats.length).keys()],
        [0, this.innerSize.height]
      ); 

      this.xScales = xScales;
      this.yScale = yScale;
      const rects = g.selectAll("rect")
        .data(stats)
        .join("rect")
        .attr("x", (d: tStatBarData, i) => {
          i = sameScale ? 0 : i;
          return xScales[i](d.min - global_means[i])
        })
        .attr("y", (_: tStatBarData, i) => yScale(i))
        .attr(
          "width",
          (d: tStatBarData, i) => {
            i = sameScale ? 0 : i;
            return xScales[i](d.max - global_means[i]) -
            xScales[i](d.min - global_means[i])
          }
        )
        .attr("height", yScale.bandwidth())
        .attr("fill", (_, i) =>  sameScale ? colors[i] : this.barColor)
        .attr("stroke", "black")
        .attr("stroke-width", (_, i) => {
          if(sameScale) {
            return colors[i] === "white"? 0.2 : 0
          } else {
            return this.barColor && this.barColor === "white"? 0.5 : 0
          }
        });
      if(this.barClick !== undefined) {
        rects.attr("cursor", "pointer")
          .on("mouseover", function(_, d) {
            d3.select(this).classed("rect-hovered", true).raise()
            if(self.barMouseover) self.barMouseover(cluster_labels?.[rects.nodes().indexOf(this)])
          })
          .on("mouseout", function(_, d) {
            d3.select(this).classed("rect-hovered", false)
            if(self.barMouseout) self.barMouseout(cluster_labels?.[rects.nodes().indexOf(this)])
          })
        .on("click", function(_, d) {  self.barClick(d, self.metric_index, cluster_labels?.[rects.nodes().indexOf(this)])});
      }


      g.selectAll("line.mean")
        .data(stats)
        .join("line")
        .attr("class", "mean")
        .attr("x1", (d: tStatBarData, i) => {
          i = sameScale ? 0 : i;
          return xScales[i](d.mean - global_means[i])
        })
        .attr("y1", (_, i) => yScale(i))
        .attr("x2", (d: tStatBarData, i) => {
          i = sameScale ? 0 : i;
          return xScales[i](d.mean - global_means[i])
        })
        .attr("y2", (_, i) => yScale(i) + yScale.bandwidth())
        .attr("stroke", "gray");

      // axis
      g.selectAll("line.y-axis").remove();
      g.append("line")
        .attr("class", "y-axis")
        .attr("x1", this.innerSize.width / 2)
        .attr("y1", -this.svgSize.margin)
        .attr("x2", this.innerSize.width / 2)
        .attr("y2", this.innerSize.height + this.svgSize.margin)
        .attr("stroke", "#a3a3a3")
        .attr("stroke-width", 0.3);
    }

    update_selected_range(selected_range: number[]|undefined, global_mean: number) {
      console.log("selected_range", selected_range)
      const g = d3.select(this.svgId).select("g.inner");
      g.selectAll("line.selected-range").remove();
        const xScale = this.xScales[0];
        g.selectAll("line.range")
          .data(selected_range)
          .join("line")
          .attr("class", "range")
          .attr("x1", (d) => xScale(d - global_mean))
          .attr("y1", -this.svgSize.margin)
          .attr("x2", (d) => xScale(d - global_mean))
          .attr("y2", this.innerSize.height + this.svgSize.margin)
          .attr("stroke", "gray");
    }

}