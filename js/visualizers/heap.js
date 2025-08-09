import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';

class HeapVisualizer {
    constructor(containerId, data) {
        this.container = d3.select(`#${containerId}`);
        this.data = Array.isArray(data) ? data : [];
        this.margin = { top: 80, right: 20, bottom: 40, left: 20 };
        this.nodeRadius = 25;
        this.levelHeight = 80;
        this.init();
    }

    init() {
        // Clear previous visualization
        this.container.selectAll('*').remove();

        if (!this.data || this.data.length === 0) {
            this.showEmptyState();
            return;
        }

        const containerNode = this.container.node();
        const width = containerNode.clientWidth - this.margin.left - this.margin.right;
        const height = this.calculateHeight();

        // Create SVG
        this.svg = this.container.append('svg')
            .attr('width', '100%')
            .attr('height', height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Calculate positions for heap nodes
        const positions = this.calculatePositions(width);

        // Create links first (so they appear behind nodes)
        this.createLinks(positions);

        // Create nodes
        this.createNodes(positions);

        // Add title and info
        this.addTitleAndInfo();

        // Add heap property validation
        this.validateHeapProperty();
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

    createLinks(positions) {
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

        this.svg.selectAll('.heap-link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'heap-link')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', 'var(--text-secondary)')
            .attr('stroke-width', 2)
            .attr('opacity', 0.6);
    }

    createNodes(positions) {
        const nodeGroups = this.svg.selectAll('.heap-node-group')
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
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', this.nodeRadius * 1.1)
                    .attr('stroke-width', 3);
                
                // Show tooltip
                const tooltip = d3.select('body').append('div')
                    .attr('class', 'heap-tooltip')
                    .style('position', 'absolute')
                    .style('background', 'var(--bg-secondary)')
                    .style('border', '1px solid var(--border)')
                    .style('border-radius', '4px')
                    .style('padding', '8px')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('z-index', '1000')
                    .html(`
                        <strong>Index:</strong> ${d.index}<br>
                        <strong>Value:</strong> ${d.value}<br>
                        <strong>Parent:</strong> ${d.index === 0 ? 'None' : Math.floor((d.index - 1) / 2)}<br>
                        <strong>Left Child:</strong> ${2 * d.index + 1 < this.data.length ? 2 * d.index + 1 : 'None'}<br>
                        <strong>Right Child:</strong> ${2 * d.index + 2 < this.data.length ? 2 * d.index + 2 : 'None'}
                    `.replace(/this\.data\.length/g, positions.length));
                
                tooltip.style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            }.bind(this))
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', this.nodeRadius)
                    .attr('stroke-width', 2);
                
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

    addTitleAndInfo() {
        const heapInfo = this.validateHeapProperty();
        
        this.container.insert('h3', 'svg')
            .text('Heap Visualization')
            .style('text-align', 'center')
            .style('color', 'var(--text-primary)')
            .style('margin-bottom', '10px');

        this.container.append('div')
            .attr('class', 'visualization-info')
            .style('text-align', 'center')
            .style('color', heapInfo.isValid ? 'var(--success)' : 'var(--error)')
            .style('font-size', '14px')
            .style('margin-top', '10px')
            .html(`
                <strong>Type:</strong> ${heapInfo.type} | 
                <strong>Nodes:</strong> ${this.data.length} | 
                <strong>Height:</strong> ${Math.floor(Math.log2(this.data.length)) + 1}
            `);
    }

    showEmptyState() {
        this.container.append('div')
            .attr('class', 'empty-state')
            .style('text-align', 'center')
            .style('padding', '40px')
            .style('color', 'var(--text-secondary)')
            .html(`
                <h3>No Data to Visualize</h3>
                <p>Please provide valid heap data</p>
                <small>Format: [10, 8, 9, 4, 7, 5, 3, 2, 1]</small>
            `);
    }

    update(newData) {
        this.data = Array.isArray(newData) ? newData : [];
        this.init();
    }

    destroy() {
        this.container.selectAll('*').remove();
        d3.selectAll('.heap-tooltip').remove();
    }
}

export default HeapVisualizer;
