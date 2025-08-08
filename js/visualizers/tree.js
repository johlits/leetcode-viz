import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';

class TreeVisualizer {
    constructor(containerId, data) {
        this.container = d3.select(`#${containerId}`);
        this.data = data;
        this.margin = { top: 60, right: 90, bottom: 30, left: 90 };
        this.duration = 750;
        this.nodeRadius = 20;
        this.init();
    }

    init() {
        // Clear previous visualization
        this.container.selectAll('*').remove();

        const containerNode = this.container.node();
        const width = containerNode.clientWidth - this.margin.left - this.margin.right;
        const height = 500;

        // Create SVG
        this.svg = this.container.append('svg')
            .attr('width', '100%')
            .attr('height', height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Create tree layout
        this.treeLayout = d3.tree()
            .size([width, height - 100]);

        // Convert data to hierarchy
        this.root = d3.hierarchy(this.data, d => {
            const children = [];
            if (d.left) children.push(d.left);
            if (d.right) children.push(d.right);
            return children;
        });

        // Calculate tree layout
        this.treeData = this.treeLayout(this.root);

        // Find all nodes
        this.nodes = this.treeData.descendants();
        this.links = this.treeData.links();

        // Draw links
        this.svg.selectAll('.link')
            .data(this.links, d => d.target.data.id || d.target.data.value)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y)
            )
            .style('fill', 'none')
            .style('stroke', 'var(--text-secondary)')
            .style('stroke-width', '2px');

        // Create node groups
        const node = this.svg.selectAll('.node')
            .data(this.nodes, d => d.data.id || d.data.value)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`);

        // Add circles to nodes
        node.append('circle')
            .attr('r', this.nodeRadius)
            .style('fill', 'var(--accent)')
            .style('stroke', 'var(--accent-hover)')
            .style('stroke-width', '2px');

        // Add node text
        node.append('text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .style('font-weight', 'bold')
            .text(d => d.data.value);

        // Add title
        this.container.append('h3')
            .text('Binary Tree Visualization')
            .style('text-align', 'center')
            .style('color', 'var(--text-primary)');

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.5, 2])
            .on('zoom', (event) => {
                this.svg.attr('transform', `translate(${this.margin.left + event.transform.x},${this.margin.top + event.transform.y})scale(${event.transform.k})`);
            });

        this.container.call(this.zoom);
    }

    update(newData) {
        this.data = newData;
        this.init();
    }
}

export default TreeVisualizer;
