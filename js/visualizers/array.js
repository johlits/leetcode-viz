import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';

class ArrayVisualizer {
    constructor(containerId, data) {
        this.container = d3.select(`#${containerId}`);
        this.data = Array.isArray(data) ? data : [data];
        this.margin = { top: 40, right: 40, bottom: 60, left: 40 };
        this.init();
    }

    init() {
        // Clear previous visualization
        this.container.selectAll('*').remove();

        const containerNode = this.container.node();
        const width = containerNode.clientWidth - this.margin.left - this.margin.right;
        const height = 300;
        const maxBarHeight = 200;

        // Create SVG
        this.svg = this.container.append('svg')
            .attr('width', '100%')
            .attr('height', height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // Calculate dimensions
        const barWidth = Math.max(30, (width / this.data.length) * 0.8);
        const barSpacing = (width - (barWidth * this.data.length)) / (this.data.length + 1);
        const maxValue = Math.max(...this.data);
        const minValue = Math.min(...this.data);
        const yScale = d3.scaleLinear()
            .domain([Math.min(0, minValue), Math.max(0, maxValue)])
            .range([maxBarHeight, 0]);

        // Draw bars
        this.svg.selectAll('.bar')
            .data(this.data)
            .enter()
            .append('rect')
            .attr('class', 'array-element')
            .attr('x', (d, i) => barSpacing + (i * (barWidth + barSpacing)))
            .attr('y', d => yScale(Math.max(0, d)))
            .attr('width', barWidth)
            .attr('height', d => Math.abs(yScale(d) - yScale(0)))
            .attr('rx', 4)
            .attr('ry', 4)
            .on('mouseover', function(event, d) {
                d3.select(this).attr('fill', '#90cdf4');
            })
            .on('mouseout', function() {
                d3.select(this).attr('fill', '');
            });

        // Add value labels
        this.svg.selectAll('.value-label')
            .data(this.data)
            .enter()
            .append('text')
            .attr('class', 'array-text')
            .attr('x', (d, i) => barSpacing + (i * (barWidth + barSpacing)) + (barWidth / 2))
            .attr('y', d => yScale(Math.max(0, d)) - 5)
            .text(d => d)
            .attr('text-anchor', 'middle');

        // Add index labels
        this.svg.selectAll('.index-label')
            .data(this.data)
            .enter()
            .append('text')
            .attr('class', 'array-index')
            .attr('x', (d, i) => barSpacing + (i * (barWidth + barSpacing)) + (barWidth / 2))
            .attr('y', maxBarHeight + 20)
            .text((d, i) => i)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)');

        // Add x-axis
        this.svg.append('line')
            .attr('x1', 0)
            .attr('y1', yScale(0))
            .attr('x2', width)
            .attr('y2', yScale(0))
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 2);

        // Add title
        this.container.append('h3')
            .text('Array Visualization')
            .style('text-align', 'center')
            .style('color', 'var(--text-primary)');
    }

    update(newData) {
        this.data = Array.isArray(newData) ? newData : [newData];
        this.init();
    }
}

export default ArrayVisualizer;
