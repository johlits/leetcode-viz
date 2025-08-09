import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';
import BaseVisualizer from './base.js';

class HeapVisualizer extends BaseVisualizer {
    constructor(containerId, data) {
        super(containerId, Array.isArray(data) ? data : []);
        this.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        this.nodeRadius = 24;
        this.levelHeight = 80;
    }

    render() {
        if (!this.svg) return;
        const root = d3.select(this.svg);
        root.selectAll('*').remove();

        const { width, height: containerH } = this.container.getBoundingClientRect();
        const innerWidth = Math.max(200, width - this.margin.left - this.margin.right);
        const height = Math.max(260, this.calculateHeight());

        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', String(height));

        const g = root.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        if (!this.data || this.data.length === 0) {
            g.append('text')
                .attr('x', (innerWidth) / 2)
                .attr('y', 120)
                .attr('text-anchor', 'middle')
                .attr('fill', 'var(--text-secondary)')
                .style('font-size', '14px')
                .text('No heap data to visualize');
            return;
        }

        // Calculate positions for heap nodes
        const positions = this.calculatePositions(innerWidth);

        // Create links first (so they appear behind nodes)
        this.createLinks(g, positions);

        // Create nodes
        this.createNodes(g, positions);
    }

    calculateHeight() {
        const levels = Math.floor(Math.log2(this.data.length)) + 1;
        return levels * this.levelHeight + 40;
    }

    calculatePositions(width) {
        const positions = [];
        const levels = Math.floor(Math.log2(this.data.length)) + 1;

        for (let i = 0; i < this.data.length; i++) {
            const level = Math.floor(Math.log2(i + 1));
            const positionInLevel = i - (Math.pow(2, level) - 1);
            const nodesInLevel = Math.pow(2, level);
            const levelWidth = width - 2 * this.nodeRadius;
            
            const x = (levelWidth / (nodesInLevel + 1)) * (positionInLevel + 1) + this.nodeRadius;
            const y = level * this.levelHeight + this.nodeRadius;

            positions.push({ x, y, index: i, value: this.data[i] });
        }

        return positions;
    }

    createLinks(g, positions) {
        const links = [];
        
        for (let i = 0; i < positions.length; i++) {
            const leftChild = 2 * i + 1;
            const rightChild = 2 * i + 2;
            
            if (leftChild < positions.length) {
                links.push({
                    source: positions[i],
                    target: positions[leftChild],
                    type: 'left'
                });
            }
            
            if (rightChild < positions.length) {
                links.push({
                    source: positions[i],
                    target: positions[rightChild],
                    type: 'right'
                });
            }
        }

        g.selectAll('.heap-link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'heap-link')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.6);
    }

    createNodes(g, positions) {
        const nodeGroups = g.selectAll('.heap-node-group')
            .data(positions)
            .enter()
            .append('g')
            .attr('class', 'heap-node-group')
            .attr('transform', d => `translate(${d.x},${d.y})`);

        // Node circles
        nodeGroups.append('circle')
            .attr('class', 'heap-node')
            .attr('r', this.nodeRadius)
            .attr('fill', (d, i) => this.getNodeColor(i))
            .attr('stroke', 'var(--accent-hover)')
            .attr('stroke-width', 1.5)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', this.nodeRadius + 3)
                    .attr('stroke-width', 2.5);
                
                // Tooltip
                const tooltip = d3.select('body').append('div')
                    .attr('class', 'heap-tooltip')
                    .style('position', 'absolute')
                    .style('background', 'var(--bg-elevated)')
                    .style('color', 'var(--text-primary)')
                    .style('border', '1px solid var(--border)')
                    .style('padding', '6px 8px')
                    .style('font-size', '12px')
                    .style('border-radius', '6px')
                    .style('pointer-events', 'none')
                    .style('box-shadow', '0 2px 6px rgba(0,0,0,0.2)')
                    .style('transform', 'translate(-50%, -120%)')
                    .style('left', `${event.pageX}px`)
                    .style('top', `${event.pageY}px`)
                    .html(`<strong>Index:</strong> ${d.index}<br/><strong>Value:</strong> ${d.value}`);
            }.bind(this))
            .on('mousemove', function(event) {
                d3.select('.heap-tooltip')
                    .style('left', `${event.pageX}px`)
                    .style('top', `${event.pageY}px`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', this.nodeRadius)
                    .attr('stroke-width', 1.5);
                
                d3.selectAll('.heap-tooltip').remove();
            }.bind(this));

        // Node values
        nodeGroups.append('text')
            .attr('class', 'heap-text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .style('font-size', '14px')
            .style('pointer-events', 'none')
            .text(d => d.value);

        // Node indices
        nodeGroups.append('text')
            .attr('class', 'heap-index')
            .attr('dy', '-35px')
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '10px')
            .text(d => `[${d.index}]`);
    }

    getNodeColor(index) {
        // Root node gets special color
        if (index === 0) return 'var(--accent-hover)';
        
        // Color based on level for visual hierarchy
        const level = Math.floor(Math.log2(index + 1));
        const colors = ['var(--accent)', 'var(--accent-light)', '#a78bfa', '#c4b5fd'];
        return colors[level % colors.length] || 'var(--accent)';
    }

    validateHeapProperty() {
        let isMaxHeap = true;
        let isMinHeap = true;
        const violations = [];

        for (let i = 0; i < this.data.length; i++) {
            const leftChild = 2 * i + 1;
            const rightChild = 2 * i + 2;

            if (leftChild < this.data.length) {
                if (this.data[i] < this.data[leftChild]) isMaxHeap = false;
                if (this.data[i] > this.data[leftChild]) isMinHeap = false;
                if (this.data[i] < this.data[leftChild] && this.data[i] > this.data[leftChild]) {
                    violations.push(`Node ${i} violates heap property with left child ${leftChild}`);
                }
            }

            if (rightChild < this.data.length) {
                if (this.data[i] < this.data[rightChild]) isMaxHeap = false;
                if (this.data[i] > this.data[rightChild]) isMinHeap = false;
            }
        }

        let heapType = 'Invalid Heap';
        if (isMaxHeap) heapType = 'Max Heap';
        else if (isMinHeap) heapType = 'Min Heap';

        return { type: heapType, isValid: isMaxHeap || isMinHeap, violations };
    }

    update(newData) {
        this.data = Array.isArray(newData) ? newData : [];
        this.render();
    }

    destroy() {
        super.destroy && super.destroy();
        d3.selectAll('.heap-tooltip').remove();
    }
}

export default HeapVisualizer;
