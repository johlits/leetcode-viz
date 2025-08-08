import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';

class GraphVisualizer {
    constructor(containerId, data) {
        this.container = d3.select(`#${containerId}`);
        this.data = data;
        this.margin = { top: 60, right: 20, bottom: 20, left: 20 };
        this.init();
    }

    init() {
        // Clear previous visualization
        this.container.selectAll('*').remove();

        const containerNode = this.container.node();
        const width = Math.max(containerNode.clientWidth - this.margin.left - this.margin.right, 500);
        const height = Math.max(containerNode.clientHeight - this.margin.top - this.margin.bottom, 400);
        
        // Ensure data has required properties
        if (!this.data.nodes) this.data.nodes = [];
        if (!this.data.links) this.data.links = [];
        
        // Ensure links have source and target as objects or indices
        this.data.links = this.data.links.map(link => {
            // If source/target is an object with an id, use the id
            if (typeof link.source === 'object' && link.source.id !== undefined) {
                link.source = link.source.id;
            }
            if (typeof link.target === 'object' && link.target.id !== undefined) {
                link.target = link.target.id;
            }
            return link;
        });

        // Create SVG
        this.svg = this.container.append('svg')
            .attr('width', '100%')
            .attr('height', height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Create simulation with proper link and node binding
        const linkForce = d3.forceLink(this.data.links)
            .id(d => d.id)
            .distance(100);
            
        this.simulation = d3.forceSimulation(this.data.nodes)
            .force('link', linkForce)
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05));

        // Create arrow markers for graph links
        this.defs = this.svg.append('defs');
        this.defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('svg:path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', 'var(--text-secondary)');

        // Create links
        this.link = this.svg.append('g')
            .selectAll('.link')
            .data(this.data.links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');

        // Create node groups
        this.node = this.svg.append('g')
            .selectAll('.node')
            .data(this.data.nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', this.dragstarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragended.bind(this))
            );

        // Add circles to nodes
        this.node.append('circle')
            .attr('r', 20)
            .attr('fill', 'var(--accent)')
            .attr('stroke', 'var(--accent-hover)')
            .attr('stroke-width', 2);

        // Add node labels
        this.node.append('text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .style('font-weight', 'bold')
            .text(d => d.name || d.id);

        // Add title
        this.container.append('h3')
            .text('Graph Visualization')
            .style('text-align', 'center')
            .style('color', 'var(--text-primary)');

        // Update simulation on tick
        this.simulation.on('tick', () => this.ticked());

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.5, 2])
            .on('zoom', (event) => {
                this.svg.attr('transform', `translate(${this.margin.left + event.transform.x},${this.margin.top + event.transform.y})scale(${event.transform.k})`);
            });

        this.container.call(this.zoom);
    }

    ticked() {
        this.link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        this.node.attr('transform', d => `translate(${d.x},${d.y})`);
    }

    dragstarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    dragended(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    update(newData) {
        // Stop any existing simulation
        if (this.simulation) {
            this.simulation.stop();
            this.simulation = null;
        }
        
        // Clear the container
        this.container.selectAll('*').remove();
        
        // Reinitialize with new data
        this.data = newData;
        this.init();
    }
    
    // Clean up resources when the visualizer is destroyed
    destroy() {
        if (this.simulation) {
            this.simulation.stop();
        }
        this.container.selectAll('*').remove();
    }
}

export default GraphVisualizer;
