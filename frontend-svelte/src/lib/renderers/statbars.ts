import * as d3 from "d3"
import { cluster_colors, metric_colors } from "lib/constants";
import type { tStatBarData } from "lib/types/statistics";
export class Statbars {
    svgId: string
    svgSize: any
    innerSize: any
    constructor(svgId, svgSize, innerSize) {
        this.svgId = svgId;
        this.svgSize = svgSize;
        this.innerSize = innerSize;
    }
    update(stats: tStatBarData[], global_means: number[], global_mins: number[], global_maxes: number[], sameScale: boolean=false) {
      let xScales;
      const g = d3.select(this.svgId).select("g.inner");
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
        // scales
        const yScale = d3.scaleBand(
          [...Array(stats.length).keys()],
          [0, this.innerSize.height]
        ); 
      g.selectAll("rect")
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
        .attr("fill", (_, i) =>  sameScale ? cluster_colors[i] : metric_colors[i]);
      // .attr("stroke", "black")
      // .attr("stroke-width", 1);
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
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    }

}