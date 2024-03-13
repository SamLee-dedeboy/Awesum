import * as d3 from "d3"
import { cluster_colors, metric_categories, metric_colors, metrics, metric_category_rotates } from "lib/constants";
import type { tStatBarData } from "lib/types/statistics";
export class Statbars {
    svgId: string
    svgSize: any
    innerSize: any
    tag_width: number
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
        this.tag_width = 10
        this.metric_index = metric_index;
        this.barColor = barColor
        this.barMouseover = barMouseover
        this.barMouseout = barMouseout
        this.barClick = barClick
        this.xScales = []
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
      if (sameScale) { // metric
        console.assert(global_means.length === 1 && global_mins.length === 1 && global_maxes.length === 1)
        const ranges = metric_categories[metrics[this.metric_index]]
        const xMax =
          ranges[ranges.length - 1].end === -1
            ? global_maxes[0]
            : ranges[ranges.length - 1].end;
        xScales = [d3
          .scaleLinear()
          .domain([ranges[0].start, xMax])
          .range([0, this.innerSize.width])]
        this.update_categories(xScales[0], metric_category_rotates[this.metric_index], xMax)
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
          if(sameScale) {
            return xScales[0](d.min)
          } else {
            return xScales[i](d.min - global_means[i])
          }
        })
        .attr("y", (_: tStatBarData, i) => yScale(i))
        .attr(
          "width",
          (d: tStatBarData, i) => {
            if(sameScale) {
              // if(this.metric_index === 2)
              // console.log(this.metric_index, d)
              return xScales[0](d.max) - xScales[0](d.min)
            } else {
              return xScales[i](d.max - global_means[i]) -
              xScales[i](d.min - global_means[i])
            }
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
        .on("click", function(_, d) {  
          self.update_selected_range([d.min, d.max], global_means[0])
          self.barClick(d, self.metric_index)
        });
      }


      if(!sameScale) {
        g.selectAll("line.mean")
          .data(stats)
          .join("line")
          .attr("class", "mean")
          .attr("x1", (d: tStatBarData, i) => {
            if(sameScale) {
              return xScales[0](d.mean)
            } else {
              return xScales[i](d.mean - global_means[i])
            }
          })
          .attr("y1", (_, i) => yScale(i))
          .attr("x2", (d: tStatBarData, i) => {
            if(sameScale) {
              return xScales[0](d.mean)
            } else {
              return xScales[i](d.mean - global_means[i])
            }
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

    }

    update_selected_range(selected_range: [number|undefined, number|undefined], global_mean: number) {
      const g = d3.select(this.svgId).select("g.inner");
      g.selectAll("line.range").remove();
      const xScale = this.xScales[0];
      // g.selectAll("line.range")
      //   .data(selected_range)
      //   .join("line")
      //   .attr("class", "range")
      //   .attr("x1", (d) => d? xScale(d): 0)
      //   .attr("y1", -this.svgSize.margin)
      //   .attr("x2", (d) => d? xScale(d) : 0)
      //   .attr("y2", this.innerSize.height + this.svgSize.margin)
      //   .attr("stroke", "lightgreen")
      g.select("rect.selected-range").remove();
      g.selectAll("rect.selected-range")
        .data([0])
        .join("rect")
        .attr("class", "selected-range")
        .attr("x", () => xScale(selected_range[0]))
        .attr("y", -this.svgSize.margin)
        .attr("width", () => xScale(selected_range[1]) - xScale(selected_range[0]))
        .attr("height", this.innerSize.height + this.svgSize.margin)
        .attr("fill", "lightgreen")
        .attr("opacity", 0.2)
        .lower()
    }

    update_categories(xScale: any, rotate: boolean, xMax: number) {
      const svg = d3.select(this.svgId);
      const ranges = metric_categories[metrics[this.metric_index]]

      const details = svg.append("g").attr("class", "step-divider-group");
      details.selectAll("line").remove();
      details.append("line").attr("class", "start")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", this.svgSize.height)
      details
        .selectAll("line.divider")
        .data(ranges.slice(1))
        .join("line")
        .attr("class", "divider")
        .attr("x1", (d) => xScale(d.start))
        .attr("y1", 0)
        .attr("x2", (d) => xScale(d.start))
        .attr("y2", this.svgSize.height)
      details.selectAll("line")
        .attr("stroke", "gray")
        .attr("stroke-width", 0.2)
        .attr("stroke-dasharray", "2, 4")
        .classed("hide", true);
      const labels = details
        .selectAll("text.divider-label")
        .data(ranges)
        .join("text")
        .attr("class", "divider-label")
        .attr(
          "font-family",
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
        )
        .attr("font-size", "0.2rem")
        .text((d) => d.label)
        .attr("pointer-events", "none")
        .classed("hide", true);
      if(rotate) {
        labels
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "baseline")
        .attr("transform", (d, i) => `translate(${xScale(d.start)+1}, 1) rotate(90) `)
      } else {
        labels.attr("text-anchor", "middle").attr("dominant-baseline", "hanging")
        .attr("transform", (d, i) => `translate(${(xScale(d.start) + xScale(d.end === -1 ? xMax : d.end)) / 2}, 1)`)
        ;
      }
    }

}