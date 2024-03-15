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
export class CorrelationGraph {
    svgId: string
    svgSize: any
    node_radius: number
    constructor(svgId, svgSize, node_radius=5) {
        this.svgId = svgId;
        this.svgSize = svgSize;
        this.node_radius = node_radius
    }
    init() {
        console.log("init")
        const svg = d3.select("#" + this.svgId).attr("viewBox", `0 0 ${this.svgSize.width} ${this.svgSize.height}`);
        const link_group = svg.append("g").classed("link-group", true);
        const node_group = svg.append("g").classed("node-group", true);
        const label_group = svg.append("g").classed("label-group", true);
    }

    update(metrics: string[], correlations: any[]) {
        console.log(metrics, correlations)
        const nodes: tNode[] = metrics.map((metric) => {
            return {
            id: metric,
            x: this.svgSize.width / 2,
            y: this.svgSize.height / 2,
            r: this.node_radius,
            };
        });
        let links: tLink[] = [];
            correlations.forEach((cor) => {
                const node_1 = cor[0];
                const node_2 = cor[1];
                const weight = Math.abs(cor[2])
                if(metrics.includes(node_1) && metrics.includes(node_2) && weight > 0.2) {
                links.push({
                  source: node_1,
                  target: node_2,
                  weight: weight,
                });
            }
            })
        this.update_nodes(nodes);
        this.update_links(links);
        this.update_force(nodes, links);
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