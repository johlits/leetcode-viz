export default class BaseVisualizer {
  constructor(containerId, data) {
    this.containerEl = document.getElementById(containerId);
    this.container = this.containerEl; // raw DOM element
    this.data = data;
    this.svg = null;
    this.g = null;
    this.resizeObserver = null;
    this.overlayG = null;
    this._resizeScheduled = false;

    // Safe default margins (can be overridden by subclasses)
    this.margin = this.margin || { top: 16, right: 16, bottom: 16, left: 16 };

    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);

    // Defer init to next frame so subclass constructor can set fields (e.g., margins)
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => this.init());
    } else {
      setTimeout(() => this.init(), 0);
    }
  }

  // Subclasses should implement render()
  // render() {}

  init() {
    this.clear();
    this.createSvg();
    this.observeResize();
    this.render();
  }

  clear() {
    if (this.container) this.container.innerHTML = '';
  }

  createSvg() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('class', 'viz-svg');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.display = 'block';
    this.container.appendChild(this.svg);

    this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svg.appendChild(this.g);

    // Non-zoom overlay layer (stays fixed, above main content)
    this.overlayG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.overlayG.setAttribute('class', 'viz-overlay');
    this.overlayG.setAttribute('style', 'pointer-events: none;');
    this.svg.appendChild(this.overlayG);
  }

  observeResize() {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
  }

  getSize() {
    const { width, height } = this.container.getBoundingClientRect();
    return { width, height };
  }

  resize() {
    if (this._resizeScheduled) return;
    this._resizeScheduled = true;
    const cb = () => {
      this._resizeScheduled = false;
      this.render();
    };
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(cb);
    } else {
      setTimeout(cb, 16);
    }
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.clear();
  }

  // Helpers
  /**
   * Render a small pill overlay with stats into a target group (DOM element or d3 selection).
   * Options: { x = 0, y = 0 }
   */
  renderStats(target, text, options = {}) {
    if (!this.svg) return;
    const { x = 0, y = 0 } = options;
    const groupEl = (target && typeof target.node === 'function') ? target.node() : target;
    if (!groupEl) return;

    // Remove previous stats in this group
    groupEl.querySelectorAll(':scope > g.viz-stats-pill').forEach(n => n.remove());

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'viz-stats-pill');
    g.setAttribute('transform', `translate(${x}, ${y})`);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('rx', '4');
    rect.setAttribute('ry', '4');
    rect.setAttribute('fill', 'rgba(var(--bg-primary-rgb), 0.85)');
    rect.setAttribute('stroke', 'var(--border)');

    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', '8');
    t.setAttribute('y', '14');
    t.setAttribute('text-anchor', 'start');
    t.setAttribute('font-size', '12px');
    t.setAttribute('font-family', 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
    t.setAttribute('fill', 'var(--text-secondary)');
    t.textContent = text;

    g.appendChild(rect);
    g.appendChild(t);
    groupEl.appendChild(g);

    // Measure text and size the rect
    try {
      const bbox = t.getBBox();
      const padX = 8;
      const padY = 6;
      rect.setAttribute('x', String(4));
      rect.setAttribute('y', String(4));
      rect.setAttribute('width', String(bbox.width + padX + 4));
      rect.setAttribute('height', String(bbox.height + padY));
    } catch (e) {
      // In case getBBox fails (rare), fallback to a reasonable size
      rect.setAttribute('x', '4');
      rect.setAttribute('y', '4');
      rect.setAttribute('width', '140');
      rect.setAttribute('height', '22');
    }
  }

  /** Render stats on a non-zoom overlay layer attached to the root svg. */
  renderStatsOnOverlay(text, options = {}) {
    if (!this.svg) return;
    // If overlay has been removed by a visualizer (e.g., clearing svg), recreate it
    const svgEl = (this.svg.node ? this.svg.node() : this.svg);
    const hasOverlayInDom = this.overlayG && this.overlayG.parentNode === svgEl;
    if (!this.overlayG || !hasOverlayInDom) {
      this.overlayG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.overlayG.setAttribute('class', 'viz-overlay');
      this.overlayG.setAttribute('style', 'pointer-events: none;');
      svgEl.appendChild(this.overlayG);
    }
    const { x = 0, y = 0 } = options;
    // Clear previous overlay stats
    this.overlayG.innerHTML = '';
    const offsetX = (this.margin && this.margin.left) ? this.margin.left : 0;
    const offsetY = (this.margin && this.margin.top) ? this.margin.top : 0;
    this.renderStats(this.overlayG, text, { x: offsetX + x, y: offsetY + y });
  }

  /** Clear overlay layer */
  clearOverlay() {
    if (this.overlayG) this.overlayG.innerHTML = '';
  }
}
