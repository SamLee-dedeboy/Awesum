import * as d3 from "d3"
import { metric_abbrs } from "lib/constants/Metrics"
type tLink = {
    source: string;
    target: string;
    weight: number;
  };
type tNode = {
    id: string;
    x: number;
    y: number;
    r: number;
  };
export class CorrelationMatrix {
    svgId: string
    svgSize: any
    show_description: any
    toggle_metric: any
    metrics_toggled: boolean[]
    row_bands: any
    col_bands: any
    constructor(svgId, svgSize, show_description: any, toggle_metric: any) {
        this.svgId = svgId;
        this.svgSize = svgSize;
        this.show_description = show_description
        this.toggle_metric = toggle_metric
        this.metrics_toggled = []
        this.row_bands = null
        this.col_bands = null
    }

    init() {
        const svg = d3.select("#" + this.svgId).attr("viewBox", `0 0 ${this.svgSize.width} ${this.svgSize.height}`);
        const node_group = svg.append("g").classed("node-group", true);
        const node_connector_group = node_group.append("g").classed("node-connector-group", true);
        const label_container_group = svg.append("g").classed("label-container-group", true);
        const label_group = svg.append("g").classed("label-group", true);
        const axis_group = svg.append("g").classed("axis-group", true);
    }

    update(metrics: string[], correlations: any[]) {
        this.metrics_toggled = metrics.map(() => true)
        this.updateAxis(metrics, correlations)
        this.update_cells(metrics, correlations)
        // this.update_nodes(nodes);
        // this.update_links(links);
        // this.update_force(nodes, links);
    }

    updateAxis(metrics: string[], correlations: any[]) {
        const cells = generate_cells(metrics.length) 
        const nums = [...Array(metrics.length-1).keys()]
        const row_bands = d3.scaleBand().domain([...Array(metrics.length).keys()]).range([0, this.svgSize.height]);
        const col_bands = d3.scaleBand().domain([...Array(metrics.length).keys()]).range([0, this.svgSize.width]);
        this.row_bands = row_bands
        this.col_bands = col_bands
        const axis_group = d3.select("#" + this.svgId).select("g.axis-group");
        axis_group.select("line.row-start").remove()
        axis_group.append("line").classed("row-start", true)
            .attr("x1", 0)
            .attr("y1", this.svgSize.height)
            .attr("x2", this.svgSize.width - col_bands.bandwidth())
            .attr("y2", this.svgSize.height)
            .attr("stroke", "black")
        axis_group.select("line.col-start").remove()
        axis_group.append("line").classed("col-start", true)
            .attr("x1", 0)
            .attr("y1", row_bands.bandwidth())
            .attr("x2", 0)
            .attr("y2", this.svgSize.height)
            .attr("stroke", "black")
        axis_group.selectAll("line.row-divider")
        .data(nums)
        .join("line")
        .classed("row-divider", true)
        .attr("x1", 0)
        .attr("y1", (index) => row_bands(index+1))
        .attr("x2", (index) => col_bands(index+1))
        .attr("y2", (index) => row_bands(index+1))
        .attr("stroke", "black")

        axis_group.selectAll("line.col-divider")
        .data(nums)
        .join("line")
        .classed("col-divider", true)
        .attr("x1", (index) => col_bands(index+1))
        .attr("y1", (index) => row_bands(index+1))
        .attr("x2", (index) => col_bands(index+1))
        .attr("y2", this.svgSize.height)
        .attr("stroke", "black")


        let self = this
        const label_group = d3.select("#" + this.svgId).select("g.label-group");
        label_group
          .selectAll("text.axis-label")
          .data(metrics)
          .join("text")
          .classed("axis-label", true)
          .attr("x", (_, i) => (i+0.5) * col_bands.bandwidth() + 3)
          .attr("y", (_, i) => (i+0.5) * row_bands.bandwidth() + 1.5)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "0.6rem")
          .attr("pointer-events", "none")
          .text((d) => metric_abbrs[d])
        const label_container_group = d3.select("#" + this.svgId).select("g.label-container-group");
        label_container_group
          .selectAll("rect.axis-label-container")
          .data(metrics)
          .join("rect")
          .classed("axis-label-container", true)
          .classed("tag-selected", true)
          .attr("x", (_, i) => (i) * col_bands.bandwidth() + 2)
          .attr("y", (_, i) => (i) * row_bands.bandwidth() + 4)
          .attr("width", "22")
          .attr("height", "10")
          .attr("cursor", "pointer")
          .on("mouseover", function(_, d) {
            d3.select(this).classed("tag-mouseover", true)
            self.show_description(d, true) 
          })
          .on("mouseout", function(_, d) {
            d3.select(this).classed("tag-mouseover", false)
            self.show_description(d, false) 
          })
          .on("click", function(_, d) {
            self.toggle_metric(d)
            const tag = d3.select(this)
            const index = metrics.indexOf(d)
            self.metrics_toggled[index] = !self.metrics_toggled[index]
            self.update_cells(metrics, correlations)
            if(tag.classed("tag-selected")) {
                tag.classed("tag-selected", false)
            } else {
                tag.classed("tag-selected", true)
            }
          })
    }

    update_cells(metrics, correlations) {
        const row_bands = this.row_bands
        const col_bands = this.col_bands
        const scaleSize = d3.scalePow().exponent(1).domain([0, 1]).range([0, row_bands.bandwidth() ]);
        const threshold = 0.2
        const scaleColor = (weight) => weight < 0? "red": "green"
        let cell_data: any[] = []
        correlations.forEach(correlation => {
            const [mi, mj, weight, p, sig] = correlation
            const over_threshold = Math.abs(weight) > threshold
            const i = metrics.indexOf(mi)
            const j = metrics.indexOf(mj)
            const disabled = !this.metrics_toggled[i] || !this.metrics_toggled[j]
            cell_data.push({
                source: i,
                target: j,
                weight: weight,
                x: col_bands(i),
                y: row_bands(j),
                size: over_threshold? scaleSize(Math.abs(weight)): row_bands.bandwidth() ,
                color: over_threshold? scaleColor(weight): "white",
                over_threshold: over_threshold,
                disabled: disabled
            })
        })
        const node_group = d3.select("#" + this.svgId).select("g.node-group");
        node_group.selectAll("g.cell")
            .data(cell_data)
            .join("g")
            .classed("cell", true)
            .each(function(d) {
                const cell = d3.select(this)
                cell.selectAll("rect").remove()
                cell.selectAll("line").remove()
                cell.selectAll("text").remove()
                cell.append("rect") 
                    .attr("class", "correlation")
                    .attr("x", (d) => d.x + col_bands.bandwidth() / 2 - d.size / 2)
                    .attr("y", (d) => d.y + row_bands.bandwidth() / 2 - d.size / 2)
                    .attr("width", (d) => d.size)
                    .attr("height", (d) => d.size)
                    .attr("fill", (d) => d.color)
                    // .attr("stroke", "black")
                    .attr("pointer-events", "none")
                cell.append("text") 
                    .attr("x", (d) => d.x + col_bands.bandwidth() / 2)
                    .attr("y", (d) => d.y + row_bands.bandwidth() / 2)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .attr("font-size", "0.4rem")
                    .attr("font-family", "monospace")
                    .attr("pointer-events", "none")
                    .attr("opacity", (d) => d.over_threshold? 0:1)
                    .text(d => d.weight.toFixed(2))
                if(d.over_threshold) {
                    cell.append("line")
                        .attr("class", "vertical")
                        .attr("x1", (d) => col_bands(d.source) + col_bands.bandwidth()/2)
                        .attr("x2", (d) => col_bands(d.source) + col_bands.bandwidth()/2)
                        .attr("y1", (d) => (d.source+1) * row_bands.bandwidth())
                        .attr("y2", (d) => d.y + row_bands.bandwidth() / 2 - d.size / 2)
                        .attr("stroke", "black")
                        .attr("stroke-width", 0.5)
                        .attr("stroke-dasharray", "2, 2")
                        .attr("opacity", 0)
                    cell.append("line")
                        .attr("class", "horizontal")
                        .attr("x1", (d) => d.x + col_bands.bandwidth() / 2 +  d.size / 2)
                        .attr("x2", (d) => col_bands(d.target))
                        .attr("y1", (d) => d.y + row_bands.bandwidth() / 2)
                        .attr("y2", (d) => d.y + row_bands.bandwidth() / 2)
                        .attr("stroke", "black")
                        .attr("stroke-width", 0.5)
                        .attr("stroke-dasharray", "2, 2")
                        .attr("opacity", 0)
                    cell.append("rect")
                        .classed("event-rect", true)
                        .attr("x", (d) => d.x)
                        .attr("y", (d) => d.y)
                        .attr("width", col_bands.bandwidth())
                        .attr("height", row_bands.bandwidth())
                        .attr("fill", "white")
                        .attr("cursor", "pointer")
                        .on("mouseover", (e) => {
                            e.preventDefault()
                            // cell.selectAll("line").attr("opacity", 1)
                            cell.select("rect.correlation").attr("opacity", 0)
                            cell.select("text").attr("opacity", 1)
                            cell.raise()
                        })
                        .on("mouseout", (e) => {
                            e.preventDefault()
                            cell.selectAll("line").attr("opacity", 0)
                            cell.select("rect.correlation").attr("opacity", 1)
                            cell.select("text").attr("opacity", 0)
                        })
                        .lower()
                }
                if(d.disabled) {
                    cell.append("rect")
                        .attr("class", "disable_effect")
                        .attr("x", (d) => d.x)
                        .attr("y", (d) => d.y)
                        .attr("width", col_bands.bandwidth())
                        .attr("height", row_bands.bandwidth())
                        .attr("fill","url(#diagonalHatch)")
                }
            })
    }

    update_cell_disability(all_metrics, enabled_metrics) {
      all_metrics.forEach((metric, i) => {
        this.metrics_toggled[i] = false
        if(enabled_metrics.includes(metric)) {
          this.metrics_toggled[i] = true 
        }
      })
    }

    update_tag_disability(enabled_metrics) {
        const label_container_group = d3.select("#" + this.svgId).select("g.label-container-group");
        label_container_group.selectAll("rect.axis-label-container")
          .classed("tag-selected", false)
          .filter(d => enabled_metrics.includes(d))
          .classed("tag-selected", true)
    }
    update_nodes(nodes: tNode[]) {
        const node_group = d3.select("#" + this.svgId).select("g.node-group");
        const label_group = d3.select("#" + this.svgId).select("g.label-group");
        node_group
          .selectAll("circle.node")
          .data(nodes)
          .join("circle")
          .classed("node", true)
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr("r", (d) => d.r)
          .attr("cursor", "pointer")
          .on("click", function (e, d) {
          });

        label_group
          .selectAll("text.node-label")
          .data(nodes)
          .join("text")
          .classed("node-label", true)
          .attr("x", (d) => d.x)
          .attr("y", (d) => d.y)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("pointer-events", "none")
          .text((d) => metric_abbrs[d.id]);
      }

      update_links(links) {
        const link_group = d3.select("#" + this.svgId).select("g.link-group");
        link_group
          .selectAll("line.link")
          .data(links)
          .join("line")
          .attr("class", "link")
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);
      }

      update_force(nodes: tNode[], links: tLink[]) {
        const svgId = this.svgId
        const svgSize = this.svgSize
        const node_radius = this.node_radius
        const connected_nodes = new Set(
          links.map((link) => link.source).concat(links.map((link) => link.target))
        );
        const isolate_nodes = nodes
          .map((node) => node.id)
          .filter((node_id) => !connected_nodes.has(node_id));
        const node_selections = d3
          .select("#" + svgId)
          .select(".node-group")
          .selectAll("circle.node");
        const link_selections = d3
          .select("#" + svgId)
          .select(".link-group")
          .selectAll("line.link");
        const label_selections = d3
          .select("#" + svgId)
          .select(".label-group")
          .selectAll("text.node-label");
        const forceCharge = d3
          .forceManyBody()
          .strength(-120)
          .distanceMin(svgSize.width)
          .distanceMax(40);
    
        const forceLink = d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => d.weight * 100);
        const forceIsolate = d3
          .forceY(svgSize.center[1] + 4 * node_radius)
          .strength((d) => (isolate_nodes.includes(d.id) ? 1 : 0));
        const simulation = d3
          .forceSimulation(nodes)
          .force("link", forceLink)
          .force("charge", forceCharge)
          .force("isolate", forceIsolate)
          .force(
            "center",
            d3.forceCenter(svgSize.center[0], svgSize.center[1]).strength(1)
          )
          .force("collide", d3.forceCollide(node_radius))
          .alphaMin(0.01)
          .on("tick", () => {
            node_selections
              .attr(
                "cx",
                (d) =>
                  (d.x = clip(d.x, [
                    node_radius + 1,
                    svgSize.width - node_radius - 1,
                  ]))
              )
              .attr(
                "cy",
                (d) =>
                  (d.y = clip(d.y, [
                    node_radius + 1,
                    svgSize.height - node_radius - 1,
                  ]))
              );
            label_selections.attr("x", (d) => d.x).attr("y", (d) => d.y);
            link_selections
              .attr("x1", (d) => {
                return d.source.x;
              })
              .attr("y1", (d) => d.source.y)
              .attr("x2", (d) => d.target.x)
              .attr("y2", (d) => d.target.y);
          });
      }

}
function clip(x, range) {
    return Math.max(Math.min(x, range[1]), range[0]);
} 
function generate_cells(num) {
    let cells: [number, number][] = []
    for (let i = 0; i < num; i++) {
        for (let j = 0; j < num; j++) {
        cells.push([i, j]);
        }
    }
    return cells;
}

