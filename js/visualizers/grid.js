import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export default class GridVisualizer {
  constructor(containerId, data) {
    this.container = document.getElementById(containerId);
    this.data = data;
    this.svg = null;
    this.g = null;
    this.overlayG = null;
    this.resizeObserver = null;

    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);

    this.init();
  }

  // Local helper to render a pill-like stats overlay on a fixed overlay group
  renderStatsOnOverlay(text, options = {}) {
    if (!this.overlayG) return;
    const { x = 12, y = 12 } = options;
    // Clear previous
    this.overlayG.selectAll('*').remove();

    const g = this.overlayG.append('g')
      .attr('class', 'viz-stats-pill')
      .attr('transform', `translate(${x}, ${y})`);

    const rect = g.append('rect')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'rgba(var(--bg-primary-rgb), 0.85)')
      .attr('stroke', 'var(--border)');

    const t = g.append('text')
      .attr('x', 8)
      .attr('y', 14)
      .attr('text-anchor', 'start')
      .attr('font-size', '12px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace')
      .attr('fill', 'var(--text-secondary)')
      .text(text);

    // Size rect to text
    try {
      const node = t.node();
      if (node && node.getBBox) {
        const bbox = node.getBBox();
        const padX = 8;
        const padY = 6;
        rect.attr('x', 4)
            .attr('y', 4)
            .attr('width', bbox.width + padX + 4)
            .attr('height', bbox.height + padY);
      }
    } catch (_) {
      rect.attr('x', 4).attr('y', 4).attr('width', 140).attr('height', 22);
    }
  }

  init() {
    // Cleanup any existing contents
    this.container.innerHTML = '';

    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('class', 'grid-svg')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'block');

    this.g = this.svg.append('g');
    // Non-zoom overlay stays fixed for stats
    this.overlayG = this.svg.append('g')
      .attr('class', 'viz-overlay')
      .style('pointer-events', 'none');

    this.render();

    // Observe container resize
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
  }

  getMatrix() {
    // Supports: array of arrays (mixed/number/string) or array of strings
    if (Array.isArray(this.data) && this.data.length > 0) {
      if (Array.isArray(this.data[0])) return this.data;
      if (typeof this.data[0] === 'string') return this.data.map(r => r.split(''));
    }
    return [];
  }

  inferNumeric(matrix) {
    let numeric = true;
    for (const row of matrix) {
      for (const v of row) {
        if (typeof v === 'number') continue;
        const n = Number(v);
        if (!Number.isFinite(n)) { numeric = false; break; }
      }
      if (!numeric) break;
    }
    return numeric;
  }

  toNumber(v) {
    return typeof v === 'number' ? v : Number(v);
  }

  render() {
    const matrix = this.getMatrix();
    const rows = matrix.length;
    const cols = rows ? matrix[0].length : 0;

    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height || !rows || !cols) {
      this.svg.attr('width', 0).attr('height', 0);
      return;
    }

    const padding = 12;
    const w = Math.max(0, width - padding * 2);
    const h = Math.max(0, height - padding * 2);
    const cellSize = Math.floor(Math.min(w / cols, h / rows));
    const gridW = cellSize * cols;
    const gridH = cellSize * rows;

    this.svg.attr('width', width).attr('height', height);
    this.g.attr('transform', `translate(${(width - gridW) / 2}, ${(height - gridH) / 2})`);
    // Position overlay near top-left padding
    if (this.overlayG) this.overlayG.attr('transform', `translate(0, 0)`);

    const isNumeric = this.inferNumeric(matrix);

    // Heatmap scale for numeric matrices
    let color = null;
    if (isNumeric) {
      const flat = matrix.flat().map(v => this.toNumber(v));
      const min = d3.min(flat);
      const max = d3.max(flat);
      // Use theme-aware colors via CSS variables with fallbacks
      const low = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7f7fd5';
      const mid = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#e5e7eb';
      const high = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#86a8e7';
      color = d3.scaleLinear().domain([min, (min+max)/2, max]).range([low, mid || '#ddd', high]);

      // Stats overlay via BaseVisualizer helper (fixed, non-zooming)
      const stats = `rows: ${rows}  cols: ${cols}  min: ${min}  max: ${max}`;
      this.renderStatsOnOverlay(stats);
    } else {
      // Non-numeric: just rows x cols
      const stats = `rows: ${rows}  cols: ${cols}`;
      this.renderStatsOnOverlay(stats);
    }

    // Data join
    const cells = this.g.selectAll('g.cell')
      .data(matrix.flatMap((row, r) => row.map((v, c) => ({ r, c, v }))), d => `${d.r}-${d.c}`);

    const cellsEnter = cells.enter().append('g').attr('class', 'cell');

    cellsEnter.append('rect')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('stroke', 'var(--border)')
      .attr('stroke-width', 1);

    cellsEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', Math.max(10, Math.floor(cellSize * 0.35)))
      .style('fill', 'var(--text-primary)');

    const cellsAll = cellsEnter.merge(cells);

    cellsAll.attr('transform', d => `translate(${d.c * cellSize}, ${d.r * cellSize})`);

    cellsAll.select('rect')
      .attr('width', cellSize - 2)
      .attr('height', cellSize - 2)
      .attr('x', 1)
      .attr('y', 1)
      .attr('fill', d => {
        if (isNumeric) return color(this.toNumber(d.v));
        // Characters/strings use neutral surface
        return getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#f3f4f6';
      });

    cellsAll.select('text')
      .attr('x', (cellSize - 2) / 2 + 1)
      .attr('y', (cellSize - 2) / 2 + 1)
      .text(d => {
        if (isNumeric) return this.toNumber(d.v);
        return String(d.v);
      })
      .style('display', d => (isNumeric ? 'none' : 'block'));

    cells.exit().remove();
  }

  resize() {
    this.render();
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.container) this.container.innerHTML = '';
  }
}
