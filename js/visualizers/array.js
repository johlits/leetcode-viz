import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';
import BaseVisualizer from './base.js';

class ArrayVisualizer extends BaseVisualizer {
    constructor(containerId, data) {
        super(containerId, Array.isArray(data) ? data : [data]);
        this.margin = { top: 16, right: 16, bottom: 32, left: 16 };
    }

    render() {
        if (!this.container || !this.svg) return;

        // Clear drawing area
        d3.select(this.svg).selectAll('*').remove();

        const { width } = this.container.getBoundingClientRect();
        const height = 280; // fixed height for consistency across visualizers
        const innerWidth = Math.max(0, width - this.margin.left - this.margin.right);
        const maxBarHeight = height - this.margin.top - this.margin.bottom - 30; // space for indices

        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', String(height));

        const g = d3.select(this.svg)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        const data = Array.isArray(this.data) ? this.data : [this.data];
        if (!data.length) return;

        const barWidth = Math.max(22, (innerWidth / data.length) * 0.7);
        const barSpacing = (innerWidth - (barWidth * data.length)) / (data.length + 1);
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const yScale = d3.scaleLinear()
            .domain([Math.min(0, minValue), Math.max(0, maxValue)])
            .nice()
            .range([maxBarHeight, 0]);

        // Bars
        g.selectAll('.array-element')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'array-element')
            .attr('x', (d, i) => barSpacing + (i * (barWidth + barSpacing)))
            .attr('y', d => yScale(Math.max(0, d)))
            .attr('width', barWidth)
            .attr('height', d => Math.abs(yScale(d) - yScale(0)))
            .attr('rx', 4)
            .attr('ry', 4)
            .on('mouseover', function () {
                d3.select(this).style('filter', 'brightness(1.05)');
            })
            .on('mouseout', function () {
                d3.select(this).style('filter', null);
            });

        // Values
        g.selectAll('.array-text')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'array-text')
            .attr('x', (d, i) => barSpacing + (i * (barWidth + barSpacing)) + (barWidth / 2))
            .attr('y', d => yScale(Math.max(0, d)) - 6)
            .text(d => d)
            .attr('text-anchor', 'middle');

        // Indices
        g.selectAll('.array-index')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'array-index')
            .attr('x', (d, i) => barSpacing + (i * (barWidth + barSpacing)) + (barWidth / 2))
            .attr('y', maxBarHeight + 18)
            .text((d, i) => i)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '12px');

        // Baseline at 0
        g.append('line')
            .attr('x1', 0)
            .attr('y1', yScale(0))
            .attr('x2', innerWidth)
            .attr('y2', yScale(0))
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 1);
        // Stats overlay via BaseVisualizer helper (fixed, non-zooming)
        const stats = `len: ${data.length}  min: ${minValue}  max: ${maxValue}`;
        this.renderStatsOnOverlay(stats);
    }

    update(newData) {
        this.data = Array.isArray(newData) ? newData : [newData];
        this.render();
    }
}

export default ArrayVisualizer;
