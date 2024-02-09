<script lang=ts>
    import { onMount, createEventDispatcher } from 'svelte';
    import { simgraph } from './SimGraph';
    import * as d3 from "d3"
    const dispatch = createEventDispatcher();

    export let graph
    export let svgId;
    // export let data;
    // const treemap_data = {
    //     name: "root",
    //     children: [
    //         { name: "p1", value: 100},
    //         { name: "p2", value: 50},
    //         { name: "p3", value: 1000},
    //         { name: "p4", value: 150},
    //         { name: "p5", value: 300},
    //         { name: "p6", value: 200},
    //         { name: "p7", value: 200},
    //         { name: "p8", value: 300},
    //         { name: "p9", value: 400},
    //         { name: "p11", value: 500},
    //     ]
    // }

    const categoricalColors = [
        "#8dd3c7",
        "#ffffb3",
        "#bebada",
        "#fb8072",
        "#80b1d3",
        "#fdb462",
        "#b3de69",
        "#fccde5",
        "#d9d9d9",
        "#bc80bd",
        "#ccebc5",
        "#ffed6f",
        "#1f78b4",
        "#33a02c",
        "#e31a1c",
        "#ff7f00",
        "#6a3d9a",
        "#b15928",
        "#a6cee3",
        "#b2df8a",
        "#fb9a99",
        "#fdbf6f",
    ]

    const width = 1000
    const height = 1000
    let selected_chunk;
    let selected_links = undefined
    let scaleRadius = undefined
    let topicColorScale = undefined
    $: if(graph) topicColorScale = d3.scaleOrdinal().domain(Object.keys(graph.groups)).range(categoricalColors)
    $: if(graph) scaleRadius = d3.scaleLinear()
        .domain([Math.min(...graph.nodes.map(node => node.degree)), Math.max(...graph.nodes.map(node => node.degree))])
        .range([3, 12])

    $: if(graph) simgraph.update(svgId, graph.groups, graph.nodes, graph.links, graph.weights, scaleRadius, topicColorScale)

    // $: chunks = ((data) => {
    //     let chunks_dict = {}
    //     if(!data) return {}
    //     data.forEach(interview => {
    //         interview.data.forEach(chunk => {
    //             chunks_dict[chunk.id] = chunk
    //         })
    //     })
    //     return chunks_dict
    // })(data)

    onMount(() => {
        simgraph.init(svgId, width, height, handleNodeClick, handleClusterClick);
    })

    function handleClusterClick(node_ids) {
        dispatch('cluster_clicked', node_ids)
    }
    function handleNodeClick(d) {
        dispatch('node_clicked', d.id)
    }
    // function handleNodeClick(event, d) {
    //     selected_chunk = chunks[d.id]
    //     console.log(d.id, graph.links)
    //     selected_links = graph.links.filter(link => link.source == d.id || link.target == d.id).map(link => link.source + "_" + link.target)
    //     // simgraph.highlight_links(svgId, selected_links)
    // }

    export function highlight_nodes(nodes) {
        console.log({nodes})
        simgraph.highlight_nodes(svgId, nodes)
    }
</script>
<div class='h-full relative'>
    <svg id={svgId} class='w-full h-full'></svg>
    <!-- <div class='top-[15%] bottom-[15%] left-[20%] right-[20%] absolute p-2 flex flex-col text-left pointer-events-none'>
        <div class='border-b border-black'> Title: {selected_chunk?.title} </div>
        <div class='border-b border-black'> Topic: {selected_chunk?.topic} </div>
        <div>
            <div> Summary: </div>
            <div> {selected_chunk?.summary} </div>
        </div>
    </div> -->
</div>