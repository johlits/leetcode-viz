import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';

class HashTableVisualizer {
    constructor(containerId, data) {
        this.container = d3.select(`#${containerId}`);
        this.data = this.processData(data);
        this.margin = { top: 60, right: 20, bottom: 40, left: 60 };
        this.bucketHeight = 40;
        this.bucketWidth = 200;
        this.init();
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

    init() {
        // Clear previous visualization
        this.container.selectAll('*').remove();

        if (!this.data || this.data.length === 0) {
            this.showEmptyState();
            return;
        }

        const tableSize = Math.max(10, Math.ceil(this.data.length * 1.3)); // Load factor ~0.75
        const buckets = this.createBuckets(tableSize);
        
        const containerNode = this.container.node();
        const width = containerNode.clientWidth - this.margin.left - this.margin.right;
        const height = tableSize * (this.bucketHeight + 5) + this.margin.top + this.margin.bottom;

        // Create SVG
        this.svg = this.container.append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        this.createVisualization(buckets, width, tableSize);
        this.addTitleAndInfo(tableSize);
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

    createVisualization(buckets, width, tableSize) {
        const bucketGroups = this.svg.selectAll('.bucket-group')
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
            .style('font-weight', 'bold')
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
            .style('fill', 'white')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
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
            .style('font-weight', 'bold')
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
        const defs = this.svg.append('defs');
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

    addTitleAndInfo(tableSize) {
        const collisions = this.data.length - new Set(this.data.map(item => this.simpleHash(item.key, tableSize))).size;
        const loadFactor = (this.data.length / tableSize).toFixed(2);
        
        this.container.insert('h3', 'svg')
            .text('Hash Table Visualization')
            .style('text-align', 'center')
            .style('color', 'var(--text-primary)')
            .style('margin-bottom', '10px');

        this.container.append('div')
            .attr('class', 'visualization-info')
            .style('text-align', 'center')
            .style('color', 'var(--text-secondary)')
            .style('font-size', '14px')
            .style('margin-top', '10px')
            .html(`
                <strong>Items:</strong> ${this.data.length} | 
                <strong>Buckets:</strong> ${tableSize} | 
                <strong>Load Factor:</strong> ${loadFactor} | 
                <strong>Collisions:</strong> <span style="color: ${collisions > 0 ? 'var(--error)' : 'var(--success)'}">${collisions}</span>
            `);

        // Add legend
        const legend = this.container.append('div')
            .attr('class', 'hash-legend')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('gap', '20px')
            .style('margin-top', '10px')
            .style('font-size', '12px');

        const legendItems = [
            { color: 'var(--bg-tertiary)', label: 'Empty' },
            { color: 'var(--accent-light)', label: 'Occupied' },
            { color: 'var(--error)', label: 'Collisions' }
        ];

        legendItems.forEach(item => {
            const legendItem = legend.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '5px');

            legendItem.append('div')
                .style('width', '12px')
                .style('height', '12px')
                .style('background-color', item.color)
                .style('border', '1px solid var(--border)')
                .style('border-radius', '2px');

            legendItem.append('span')
                .style('color', 'var(--text-secondary)')
                .text(item.label);
        });
    }

    showEmptyState() {
        this.container.append('div')
            .attr('class', 'empty-state')
            .style('text-align', 'center')
            .style('padding', '40px')
            .style('color', 'var(--text-secondary)')
            .html(`
                <h3>No Data to Visualize</h3>
                <p>Please provide valid hash table data</p>
                <small>Format: {"key1": "value1", "key2": "value2"} or [["key1", "value1"], ["key2", "value2"]]</small>
            `);
    }

    update(newData) {
        this.data = this.processData(newData);
        this.init();
    }

    destroy() {
        this.container.selectAll('*').remove();
        d3.selectAll('.hash-tooltip').remove();
    }
}

export default HashTableVisualizer;
