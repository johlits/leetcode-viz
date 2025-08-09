import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';
import BaseVisualizer from './base.js';

class LinkedListVisualizer extends BaseVisualizer {
    constructor(containerId, data) {
        super(containerId, data);
        this.margin = { top: 20, right: 16, bottom: 20, left: 16 };
        this.nodeWidth = 80;
        this.nodeHeight = 40;
        this.spacing = 120;
        this.data = this.processData(data);
    }

    processData(data) {
        // Convert array to linked list format if needed
        if (Array.isArray(data)) {
            return data.map((value, index) => ({
                value: value,
                index: index,
                next: index < data.length - 1 ? index + 1 : null
            }));
        }
        
        // If it's already in linked list format, convert to array format
        if (data && typeof data === 'object' && data.value !== undefined) {
            const nodes = [];
            let current = data;
            let index = 0;
            
            while (current && index < 20) { // Prevent infinite loops
                nodes.push({
                    value: current.value,
                    index: index,
                    next: current.next ? index + 1 : null
                });
                current = current.next;
                index++;
            }
            return nodes;
        }
        
        return [];
    }

    render() {
        if (!this.svg) return;
        const root = d3.select(this.svg);
        root.selectAll('*').remove();

        const data = this.data || [];
        if (!data.length) {
            // empty state
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.style.padding = '24px';
            empty.innerHTML = '<h3>No Data to Visualize</h3><p>Please provide valid linked list data</p>';
            // Replace SVG with empty message temporarily
            this.svg.replaceWith(empty);
            this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            empty.replaceWith(this.svg);
            return;
        }

        const height = 180;
        const totalWidth = Math.max(data.length * this.spacing + this.margin.left + this.margin.right, 400);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', String(height));
        this.svg.setAttribute('viewBox', `0 0 ${totalWidth} ${height}`);

        const g = root.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // Groups per node
        const nodeGroups = g.selectAll('.node-group')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'node-group')
            .attr('transform', (d, i) => `translate(${i * this.spacing}, 0)`);

        // Node rectangles
        nodeGroups.append('rect')
            .attr('class', 'll-node')
            .attr('width', this.nodeWidth)
            .attr('height', this.nodeHeight)
            .attr('rx', 6)
            .attr('fill', 'var(--accent)')
            .attr('stroke', 'var(--accent-hover)')
            .attr('stroke-width', 1.5)
            .on('mouseover', function () {
                d3.select(this).style('filter', 'brightness(1.05)');
            })
            .on('mouseout', function () {
                d3.select(this).style('filter', null);
            });

        // Node values
        nodeGroups.append('text')
            .attr('class', 'll-text')
            .attr('x', this.nodeWidth / 2)
            .attr('y', this.nodeHeight / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .style('font-size', '14px')
            .style('pointer-events', 'none')
            .text(d => d.value);

        // Node indices
        nodeGroups.append('text')
            .attr('class', 'll-index')
            .attr('x', this.nodeWidth / 2)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '12px')
            .text(d => `[${d.index}]`);

        // Arrow marker
        const defs = root.append('defs');
        defs.append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', 'var(--text-secondary)');

        // Links
        nodeGroups.filter(d => d.next !== null)
            .append('line')
            .attr('class', 'll-arrow')
            .attr('x1', this.nodeWidth)
            .attr('y1', this.nodeHeight / 2)
            .attr('x2', this.spacing - 10)
            .attr('y2', this.nodeHeight / 2)
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrow)');

        // NULL indicator
        const lastNode = nodeGroups.filter((d, i) => i === data.length - 1);
        lastNode.append('text')
            .attr('x', this.nodeWidth + 20)
            .attr('y', this.nodeHeight / 2)
            .attr('dy', '0.35em')
            .style('fill', 'var(--text-secondary)')
            .style('font-style', 'italic')
            .style('font-size', '12px')
            .text('NULL');
    }

    showEmptyState() { /* handled in render() for consistency */ }

    update(newData) {
        this.data = this.processData(newData);
        this.render();
    }

    destroy() {
        super.destroy();
    }
}

export default LinkedListVisualizer;
