import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';
import BaseVisualizer from './base.js';

class GraphVisualizer extends BaseVisualizer {
    constructor(containerId, data) {
        super(containerId, data);
        this.margin = { top: 16, right: 16, bottom: 16, left: 16 };
        this.simulation = null;
        this.link = null;
        this.node = null;
    }

    normalizeData() {
        const data = this.data || {};
        data.nodes = Array.isArray(data.nodes) ? data.nodes : [];
        data.links = Array.isArray(data.links) ? data.links : [];
        data.links = data.links.map(link => {
            if (typeof link.source === 'object' && link.source && link.source.id !== undefined) link.source = link.source.id;
            if (typeof link.target === 'object' && link.target && link.target.id !== undefined) link.target = link.target.id;
            return link;
        });
        this.data = data;
    }

    render() {
        if (!this.svg) return;
        this.normalizeData();

        const root = d3.select(this.svg);
        root.selectAll('*').remove();

        const { width, height } = this.container.getBoundingClientRect();
        const w = Math.max(400, width - this.margin.left - this.margin.right);
        const h = Math.max(320, height - this.margin.top - this.margin.bottom);

        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', String(h + this.margin.top + this.margin.bottom));

        const g = root.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // Arrow marker
        const defs = g.append('defs');
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 22)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', 'var(--text-secondary)');

        // Links and nodes
        this.link = g.append('g')
            .selectAll('line')
            .data(this.data.links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrowhead)');

        this.node = g.append('g')
            .selectAll('g.node')
            .data(this.data.nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', (event, d) => this.dragstarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragended(event, d))
            );

        this.node.append('circle')
            .attr('r', 18)
            .attr('fill', 'var(--accent)')
            .attr('stroke', 'var(--accent-hover)')
            .attr('stroke-width', 1.5);

        this.node.append('text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--on-accent)')
            .text(d => d.name || d.id);

        // Force simulation
        const linkForce = d3.forceLink(this.data.links).id(d => d.id).distance(100);
        this.simulation = d3.forceSimulation(this.data.nodes)
            .force('link', linkForce)
            .force('charge', d3.forceManyBody().strength(-280))
            .force('center', d3.forceCenter(w / 2, h / 2))
            .force('collision', d3.forceCollide().radius(28))
            .force('x', d3.forceX(w / 2).strength(0.04))
            .force('y', d3.forceY(h / 2).strength(0.04));

        this.simulation.on('tick', () => this.ticked());

        // Zoom
        const zoom = d3.zoom().scaleExtent([0.5, 2]).on('zoom', (event) => {
            g.attr('transform', `translate(${this.margin.left + event.transform.x}, ${this.margin.top + event.transform.y}) scale(${event.transform.k})`);
        });
        root.call(zoom);

        // Stats overlay via BaseVisualizer helper (fixed, non-zooming)
        const stats = `nodes: ${this.data.nodes.length}  edges: ${this.data.links.length}`;
        this.renderStatsOnOverlay(stats);
    }

    ticked() {
        if (!this.link || !this.node) return;
        this.link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        this.node.attr('transform', d => `translate(${d.x},${d.y})`);
    }

    dragstarted(event, d) {
        if (!event.active && this.simulation) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    dragended(event, d) {
        if (!event.active && this.simulation) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    update(newData) {
        if (this.simulation) {
            this.simulation.stop();
            this.simulation = null;
        }
        this.data = newData;
        this.render();
    }

    destroy() {
        if (this.simulation) this.simulation.stop();
        super.destroy && super.destroy();
    }
}

export default GraphVisualizer;
