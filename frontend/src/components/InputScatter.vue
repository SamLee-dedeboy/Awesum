<script lang="ts">
import * as d3 from "d3";
import Data from '../../data/demo.json'; /* Example of reading in data directly from file */
import axios from 'axios';
import { isEmpty, debounce } from 'lodash';

import { Dot, ComponentSize, Margin } from '../types';
// A "extends" B means A inherits the properties and methods from B.
interface CategoricalDot extends Dot{
    category: string;
}

// Computed property: https://vuejs.org/guide/essentials/computed.html
// Lifecycle in vue.js: https://vuejs.org/guide/essentials/lifecycle.html#lifecycle-diagram

export default {
    data() {
        // Here we define the local states of this component. If you think the component as a class, then these are like its private variables.
        return {
            dots: [] as CategoricalDot[], // "as <Type>" is a TypeScript expression to indicate what data structures this variable is supposed to store.
            size: { width: 0, height: 0 } as ComponentSize,
            margin: {left: 40, right: 20, top: 20, bottom: 60} as Margin,
        }
    },
    computed: {
        // Re-render the chart whenever the window is resized or the data changes (and data is non-empty)
        rerender() {
            return (!isEmpty(this.dots)) && this.size
        }
    },
    // Anything in here will only be executed once.
    // Refer to the lifecycle in Vue.js for more details, mentioned at the very top of this file.
    created() {
        // fetch the data via GET request when we init this component. 
        // In axios anything we send back in the response are always bound to the "data" property.
        /*
        axios.get(`<some-API-endpoint>`)
            .then(resp => { 
                this.dots = resp.data; // resp.data contains the content, with the format specified by the API you use.
                return true;
            })
            .catch(error => console.log(error));
        */
        // console.log(Data);
        // if (isEmpty(Data)) return;
        // let data: number[] = [];
        
        const random = d3.randomNormal(0, 0.2);
        const sqrt3 = Math.sqrt(3);
        const data: number[][] = [
        ...Array.from({ length: 300 }, () => [random() + sqrt3, random() + 1, 0]),
        ...Array.from({ length: 300 }, () => [random() - sqrt3, random() + 1, 1]),
        ...Array.from({ length: 300 }, () => [random(), random() - 1, 2]),
        ];
        console.log(data)
        const flattenedArray: { x: number; y: number; category: number }[] = data.map(point => ({
                x: point[0],
                y: point[1],
                category: point[2],
        }));
        console.log(flattenedArray)
        this.dots = flattenedArray;
        // console.log(this.dots)
    },
    methods: {
        onResize() {  // record the updated size of the target element
            let target = this.$refs.dotContainer as HTMLElement
            if (target === undefined) return;
            this.size = { width: target.clientWidth, height: target.clientHeight };
        },
        initChart() {
            // select the svg tag so that we can insert(render) elements, i.e., draw the chart, within it.
            let chartContainer = d3.select('#dot-svg')
            

            let xExtents = d3.extent(this.dots.map((d: CategoricalDot) => d.x as number)) as [number, number]
            let yExtents = d3.extent(this.dots.map((d: CategoricalDot) => d.y as number)) as [number, number]
            console.log(xExtents)
            console.log(yExtents)
            let xScale = d3.scaleLinear()
                .range([this.margin.left, this.size.width - this.margin.right]) 
                .domain([xExtents[0], xExtents[1]])
            let yScale = d3.scaleLinear()
                .range([this.size.height - this.margin.bottom, this.margin.top]) 
                .domain([yExtents[0], yExtents[1]])

            
            const xAxis = chartContainer.append('g')
                .attr('transform', `translate(0, ${this.size.height - this.margin.bottom})`)
                .call(d3.axisBottom(xScale))

            const yAxis = chartContainer.append('g')
                .attr('transform', `translate(${this.margin.left}, 0)`)
                .call(d3.axisLeft(yScale))

            // const yLabel = chartContainer.append('g')
            //     .attr('transform', `translate(${10}, ${this.size.height / 2}) rotate(-90)`)
            //     .append('text')
            //     .text('Value')
            //     .style('font-size', '.8rem')

            // const xLabel = chartContainer.append('g')
            //     .attr('transform', `translate(${this.size.width / 2 - this.margin.left}, ${this.size.height - this.margin.top - 5})`)
            //     .append('text')
            //     .text('Categories')
            //     .style('font-size', '.8rem')
            let color = d3.scaleOrdinal()
                        .domain(this.dots.map(d => d.category))
                        .range(d3.schemeCategory10)
            // "g" is grouping element that does nothing but helps avoid DOM looking like a mess
            // We iterate through each <CategoricalBar> element in the array, create a rectangle for each and indicate the coordinates, the rectangle, and the color.
            const dots = chartContainer.append('g')
                .selectAll('circle')
                .data<CategoricalDot>(this.dots)
                .enter() 
                .append('circle')
                .attr('cx',(d)=>{ return xScale(d.x);} )
                .attr('cy', (d)=>{ return yScale(d.y)} )
                .attr("r",3)
                // specify the size of the rectangle
                .attr('fill', (d)=>{return color(d.category)})

            
            const title = chartContainer.append('g')
                .append('text') 
                .attr('transform', `translate(${this.size.width / 2}, ${this.size.height - this.margin.top + 5})`)
                .attr('dy', '0.5rem') 
                .style('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .text('Scatter Plot') // text content
        }
    },
    watch: {
        rerender(newSize) {
            if (!isEmpty(newSize)) {
                d3.select('#dot-svg').selectAll('*').remove() // Clean all the elements in the chart
                this.initChart()
            }
        }
    },
    // The following are general setup for resize events.
    mounted() {
        window.addEventListener('resize', debounce(this.onResize, 100)) 
        this.onResize()
    },
    beforeDestroy() {
       window.removeEventListener('resize', this.onResize)
    }
}

</script>

<!-- "ref" registers a reference to the HTML element so that we can access it via the reference in Vue.  -->
<!-- We use flex (d-flex) to arrange the layout-->
<template>
    <div class="chart-container d-flex" ref="dotContainer">
        <svg id="dot-svg" width="100%" height="100%">
            <!-- all the visual elements we create in initChart() will be inserted here in DOM-->
        </svg>
    </div>
</template>

<style scoped>
.chart-container{
    height: 100%;
}
</style>

