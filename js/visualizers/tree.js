import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';
import BaseVisualizer from './base.js';

class TreeVisualizer extends BaseVisualizer {
    constructor(containerId, data) {
        super(containerId, data);
        this.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        this.nodeRadius = 18;
    }

    render() {
        if (!this.svg) return;
        const rootSel = d3.select(this.svg);
        rootSel.selectAll('*').remove();

        const { width, height: containerH } = this.container.getBoundingClientRect();
        const height = Math.max(360, containerH || 500);

        // Set svg size
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', String(height));

        // inner group that will be zoomed
        const inner = rootSel.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        const innerWidth = Math.max(200, width - this.margin.left - this.margin.right);
        const innerHeight = Math.max(200, height - this.margin.top - this.margin.bottom - 40);

        // Create tree layout
        const treeLayout = d3.tree().size([innerWidth, innerHeight]);

        // Convert to hierarchy (binary)
        const hierarchy = d3.hierarchy(this.data, d => {
            const children = [];
            if (d && d.left) children.push(d.left);
            if (d && d.right) children.push(d.right);
            return children.length ? children : null;
        });

        const treeData = treeLayout(hierarchy);
        const nodes = treeData.descendants();
        const links = treeData.links();

        // Links
        inner.selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical().x(d => d.x).y(d => d.y))
            .attr('fill', 'none')
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 1.5);

        // Nodes
        const node = inner.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`);

        node.append('circle')
            .attr('r', this.nodeRadius)
            .attr('fill', 'var(--accent)')
            .attr('stroke', 'var(--accent-hover)')
            .attr('stroke-width', 1.5);

        node.append('text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .text(d => d.data && (d.data.value ?? d.data.val ?? d.data.key ?? ''));

        // Zoom behavior operates on inner group
        const zoom = d3.zoom()
            .scaleExtent([0.5, 2])
            .on('zoom', (event) => {
                inner.attr('transform', `translate(${this.margin.left + event.transform.x},${this.margin.top + event.transform.y}) scale(${event.transform.k})`);
            });

        d3.select(this.svg).call(zoom);
    }

    update(newData) {
        this.data = newData;
        this.render();
    }
}

export default TreeVisualizer;
