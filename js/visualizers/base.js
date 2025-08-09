export default class BaseVisualizer {
  constructor(containerId, data) {
    this.containerEl = document.getElementById(containerId);
    this.container = this.containerEl; // raw DOM element
    this.data = data;
    this.svg = null;
    this.g = null;
    this.resizeObserver = null;

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
    this.render();
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.clear();
  }
}
