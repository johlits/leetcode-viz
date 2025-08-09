import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';
import BaseVisualizer from './base.js';

class HashTableVisualizer extends BaseVisualizer {
    constructor(containerId, data) {
        super(containerId, []);
        this.data = this.processData(data);
        this.margin = { top: 20, right: 20, bottom: 20, left: 60 };
        this.bucketHeight = 40;
        this.bucketWidth = 200;
    }

    processData(data) {
        // Handle different input formats
        if (Array.isArray(data)) {
            // Array of key-value pairs: [["key1", "value1"], ["key2", "value2"]]
            if (data.length > 0 && Array.isArray(data[0])) {
                return data.map(([key, value]) => ({ key: String(key), value }));
            }
            // Array of objects: [{key: "key1", value: "value1"}]
            if (data.length > 0 && typeof data[0] === 'object' && data[0].key !== undefined) {
                return data;
            }
            // Simple array - use indices as keys
            return data.map((value, index) => ({ key: String(index), value }));
        }
        
        // Object format: {"key1": "value1", "key2": "value2"}
        if (data && typeof data === 'object') {
            return Object.entries(data).map(([key, value]) => ({ key: String(key), value }));
        }
        
        return [];
    }

    simpleHash(key, tableSize = 10) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash + key.charCodeAt(i)) % tableSize;
        }
        return hash;
    }

    render() {
        if (!this.svg) return;
        const root = d3.select(this.svg);
        root.selectAll('*').remove();

        const { width } = this.container.getBoundingClientRect();
        const innerWidth = Math.max(320, width - this.margin.left - this.margin.right);

        const tableSize = Math.max(10, Math.ceil((this.data?.length || 0) * 1.3));
        const totalHeight = tableSize * (this.bucketHeight + 5) + this.margin.top + this.margin.bottom;

        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', String(Math.max(200, totalHeight)));

        const g = root.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        if (!this.data || this.data.length === 0) {
            g.append('text')
                .attr('x', innerWidth / 2)
                .attr('y', 100)
                .attr('text-anchor', 'middle')
                .attr('fill', 'var(--text-secondary)')
                .style('font-size', '14px')
                .text('No hash table data to visualize');
            return;
        }

        const buckets = this.createBuckets(tableSize);
        this.createVisualization(g, buckets, innerWidth, tableSize);

        // Stats overlay via BaseVisualizer helper (fixed, non-zooming)
        const totalItems = this.data.length;
        const collisions = buckets.reduce((acc, b) => acc + Math.max(0, b.items.length - 1), 0);
        const loadFactor = (totalItems / tableSize).toFixed(2);
        const stats = `buckets: ${tableSize}  items: ${totalItems}  load: ${loadFactor}  collisions: ${collisions}`;
        this.renderStatsOnOverlay(stats);
    }

    createBuckets(tableSize) {
        const buckets = Array.from({ length: tableSize }, (_, i) => ({ index: i, items: [] }));
        
        // Distribute items into buckets
        this.data.forEach(item => {
            const hash = this.simpleHash(item.key, tableSize);
            buckets[hash].items.push(item);
        });
        
        return buckets;
    }

    createVisualization(g, buckets, width, tableSize) {
        const bucketGroups = g.selectAll('.bucket-group')
            .data(buckets)
            .enter()
            .append('g')
            .attr('class', 'bucket-group')
            .attr('transform', (d, i) => `translate(0, ${i * (this.bucketHeight + 5)})`);

        // Bucket indices
        bucketGroups.append('text')
            .attr('class', 'bucket-index')
            .attr('x', -10)
            .attr('y', this.bucketHeight / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '12px')
            .text(d => `[${d.index}]`);

        // Bucket containers
        bucketGroups.append('rect')
            .attr('class', 'bucket-container')
            .attr('width', this.bucketWidth)
            .attr('height', this.bucketHeight)
            .attr('fill', d => d.items.length > 1 ? 'var(--error)' : d.items.length === 1 ? 'var(--accent-light)' : 'var(--bg-tertiary)')
            .attr('stroke', 'var(--border)')
            .attr('stroke-width', 1)
            .attr('rx', 3);

        // Items in buckets
        const itemGroups = bucketGroups.selectAll('.item-group')
            .data(d => d.items.map((item, i) => ({ ...item, bucketIndex: d.index, itemIndex: i })))
            .enter()
            .append('g')
            .attr('class', 'item-group')
            .attr('transform', (d, i) => `translate(${5 + i * 60}, 5)`);

        // Item rectangles
        itemGroups.append('rect')
            .attr('class', 'hash-item')
            .attr('width', 55)
            .attr('height', this.bucketHeight - 10)
            .attr('fill', 'var(--accent)')
            .attr('stroke', 'var(--accent-hover)')
            .attr('stroke-width', 1)
            .attr('rx', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', 'var(--accent-hover)');
                
                // Show tooltip
                const tooltip = d3.select('body').append('div')
                    .attr('class', 'hash-tooltip')
                    .style('position', 'absolute')
                    .style('background', 'var(--bg-secondary)')
                    .style('border', '1px solid var(--border)')
                    .style('border-radius', '4px')
                    .style('padding', '8px')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('z-index', '1000')
                    .html(`
                        <strong>Key:</strong> ${d.key}<br>
                        <strong>Value:</strong> ${d.value}<br>
                        <strong>Hash:</strong> ${d.bucketIndex}<br>
                        <strong>Collision:</strong> ${d.itemIndex > 0 ? 'Yes' : 'No'}
                    `);
                
                tooltip.style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', 'var(--accent)');
                
                d3.selectAll('.hash-tooltip').remove();
            });

        // Item text (key)
        itemGroups.append('text')
            .attr('class', 'item-key')
            .attr('x', 27.5)
            .attr('y', (this.bucketHeight - 10) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--on-accent)')
            .style('font-size', '10px')
            .style('pointer-events', 'none')
            .text(d => d.key.length > 6 ? d.key.substring(0, 6) + '...' : d.key);

        // Collision indicators
        bucketGroups.filter(d => d.items.length > 1)
            .append('text')
            .attr('x', this.bucketWidth + 10)
            .attr('y', this.bucketHeight / 2)
            .attr('dy', '0.35em')
            .style('fill', 'var(--error)')
            .style('font-size', '12px')
            .text(d => `⚠ ${d.items.length} collisions`);

        // Chain arrows for collisions
        bucketGroups.filter(d => d.items.length > 1)
            .selectAll('.chain-arrow')
            .data(d => d.items.slice(0, -1))
            .enter()
            .append('path')
            .attr('class', 'chain-arrow')
            .attr('d', (d, i) => `M ${60 + i * 60} ${this.bucketHeight / 2} L ${65 + i * 60} ${this.bucketHeight / 2}`)
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#chain-arrow-marker)');

        // Arrow marker for chains
        const defs = g.append('defs');
        defs.append('marker')
            .attr('id', 'chain-arrow-marker')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', 'var(--text-secondary)');
    }

    update(newData) {
        this.data = this.processData(newData);
        this.render();
    }

    destroy() {
        super.destroy && super.destroy();
        d3.selectAll('.hash-tooltip').remove();
    }
}

export default HashTableVisualizer;
