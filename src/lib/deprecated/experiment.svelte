<script lang="ts">
  import { onMount } from "svelte";
  import SimGraph from "../SimGraph.svelte";

  const server_address = "http://localhost:5000"

  let full_chunk_graph: any;
  let summary_chunk_graph: any;
  let link_threshold: number = 0.92;
  let full_simgraph;
  let summary_simgraph;
  let clicked_nodes: any[] = []

  onMount(() => {
      // fetchData()
  })

  function fetchData() {
    const full_level = 4
    const summary_level = 4
    fetch(`${server_address}/data/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ full_level, summary_level })
    })
    .then(res => res.json())
    .then(res => {
        console.log({res})
        full_chunk_graph = link_to_graph(res.full.links, res.full.nodes, res.full.clusters)
        summary_chunk_graph = link_to_graph(res.summary.links, res.summary.nodes, res.summary.clusters)
    })
  }

  function link_to_graph(links, nodes, clusters) {
        let weights = {}
        let degree_dict = {}
        let graph_links: any = []
        // filter links and build weights
        links = links.filter(link => link[2] > link_threshold)
        links.forEach(link => {
            const source = link[0]
            const target = link[1]
            degree_dict[source] = degree_dict[source] ? degree_dict[source] + 1 : 1
            degree_dict[target] = degree_dict[target] ? degree_dict[target] + 1 : 1
            if(!weights[source]) weights[source] = {}
            weights[source][target] = link[2]
            graph_links.push({ source, target })
        })

        // group nodes by topic
        let groups = clusters
        const graph = {
            groups: groups,
            // topics: Array.from(topics),
            nodes: Object.keys(nodes).map((node: string) => nodes[node]),
            links: graph_links,
            weights: weights,
        }
        console.log(graph.nodes.length, graph.links.length)
        return graph
    }

    function handleNodeClicked(e) {
      clicked_nodes.push(e.detail)
      full_simgraph.highlight_nodes(clicked_nodes)
      summary_simgraph.highlight_nodes(clicked_nodes)
    }

    function handleClusterClicked(e) {
      console.log({e})
      // clicked_nodes = clicked_nodes.concat(e.detail)
      clicked_nodes = e.detail
      full_simgraph.highlight_nodes(clicked_nodes)
      summary_simgraph.highlight_nodes(clicked_nodes)
    }


</script>
<div>

</div>
<main class='h-[100vh] w-[100vw] flex justify-around'>
  <div class="flex flex-col justify-center items-center basis-[40%] h-full overflow-hidden">
    <div class='w-full h-full'>
        <SimGraph bind:this={full_simgraph} svgId='full_svg' graph={full_chunk_graph} on:node_clicked={handleNodeClicked} on:cluster_clicked={handleClusterClicked} ></SimGraph>   
    </div>
  </div>
  <div class="flex flex-col justify-center items-center basis-[40%] h-full overflow-hidden">
    <div class='w-full h-full'>
        <SimGraph bind:this={summary_simgraph} svgId='summary_svg' graph={summary_chunk_graph} on:node_clicked={handleNodeClicked} on:cluster_clicked={handleClusterClicked}></SimGraph>   
    </div>
  </div>
</main>
