import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';

class LinkedListVisualizer {
    constructor(containerId, data) {
        this.container = d3.select(`#${containerId}`);
        this.data = this.processData(data);
        this.margin = { top: 60, right: 20, bottom: 60, left: 20 };
        this.nodeWidth = 80;
        this.nodeHeight = 40;
        this.spacing = 120;
        this.init();
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

    init() {
        // Clear previous visualization
        this.container.selectAll('*').remove();

        if (!this.data || this.data.length === 0) {
            this.showEmptyState();
            return;
        }

        const containerNode = this.container.node();
        const totalWidth = Math.max(this.data.length * this.spacing + this.margin.left + this.margin.right, containerNode.clientWidth);
        const height = 200;

        // Create SVG
        this.svg = this.container.append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${totalWidth} ${height}`)
            .style('overflow-x', 'auto');

        const g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Create nodes
        const nodeGroups = g.selectAll('.node-group')
            .data(this.data)
            .enter()
            .append('g')
            .attr('class', 'node-group')
            .attr('transform', (d, i) => `translate(${i * this.spacing}, 0)`);

        // Node rectangles
        nodeGroups.append('rect')
            .attr('class', 'll-node')
            .attr('width', this.nodeWidth)
            .attr('height', this.nodeHeight)
            .attr('rx', 5)
            .attr('fill', 'var(--accent)')
            .attr('stroke', 'var(--accent-hover)')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', 'var(--accent-hover)')
                    .attr('transform', 'scale(1.05)');
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', 'var(--accent)')
                    .attr('transform', 'scale(1)');
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
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '12px')
            .text(d => `[${d.index}]`);

        // Arrows
        nodeGroups.filter(d => d.next !== null)
            .append('line')
            .attr('class', 'll-arrow')
            .attr('x1', this.nodeWidth)
            .attr('y1', this.nodeHeight / 2)
            .attr('x2', this.spacing - 10)
            .attr('y2', this.nodeHeight / 2)
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrow)');

        // Arrow markers
        const defs = this.svg.append('defs');
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

        // NULL indicator for the last node
        const lastNode = nodeGroups.filter((d, i) => i === this.data.length - 1);
        lastNode.append('text')
            .attr('x', this.nodeWidth + 20)
            .attr('y', this.nodeHeight / 2)
            .attr('dy', '0.35em')
            .style('fill', 'var(--text-secondary)')
            .style('font-style', 'italic')
            .text('NULL');

        // Add title
        this.container.insert('h3', 'svg')
            .text('Linked List Visualization')
            .style('text-align', 'center')
            .style('color', 'var(--text-primary)')
            .style('margin-bottom', '10px');

        // Add info
        this.container.append('div')
            .attr('class', 'visualization-info')
            .style('text-align', 'center')
            .style('color', 'var(--text-secondary)')
            .style('font-size', '14px')
            .style('margin-top', '10px')
            .html(`<strong>Nodes:</strong> ${this.data.length} | <strong>Operations:</strong> Traverse, Insert, Delete`);
    }

    showEmptyState() {
        this.container.append('div')
            .attr('class', 'empty-state')
            .style('text-align', 'center')
            .style('padding', '40px')
            .style('color', 'var(--text-secondary)')
            .html(`
                <h3>No Data to Visualize</h3>
                <p>Please provide valid linked list data</p>
                <small>Format: [1, 2, 3, 4] or {"value": 1, "next": {"value": 2, "next": null}}</small>
            `);
    }

    update(newData) {
        this.data = this.processData(newData);
        this.init();
    }

    destroy() {
        this.container.selectAll('*').remove();
    }
}

export default LinkedListVisualizer;
