import { initTheme, readFile, parseData, detectDataType, formatJSON, validateDataStructure } from './utils.js';
import ArrayVisualizer from './visualizers/array.js';
import TreeVisualizer from './visualizers/tree.js';
import GraphVisualizer from './visualizers/graph.js';
import LinkedListVisualizer from './visualizers/linkedlist.js';
import HeapVisualizer from './visualizers/heap.js';
import HashTableVisualizer from './visualizers/hashtable.js';
import GridVisualizer from './visualizers/grid.js';

class DataVisualizerApp {
    constructor() {
        this.editor = document.getElementById('data-content');
        this.visualizer = null;
        this.currentType = null;
        this.forcedType = 'auto';
        this.updateUrlDebounced = this.debounce(() => this.updateURLState(), 300);
        this.sampleData = {
            array: [5, 2, 8, 1, 9, 3, 7, 4, 6],
            grid: [
                [1, 2, 3, 4, 5],
                [2, 3, 4, 5, 6],
                [3, 4, 9, 6, 7],
                [4, 5, 6, 7, 8],
                [5, 6, 7, 8, 9]
            ],
            tree: {
                value: 1,
                left: {
                    value: 2,
                    left: { value: 4 },
                    right: { value: 5 }
                },
                right: {
                    value: 3,
                    left: { value: 6 },
                    right: { value: 7 }
                }
            },
            graph: {
                nodes: [
                    { id: 1, name: 'A' },
                    { id: 2, name: 'B' },
                    { id: 3, name: 'C' },
                    { id: 4, name: 'D' },
                    { id: 5, name: 'E' },
                    { id: 6, name: 'F' }
                ],
                links: [
                    { source: 1, target: 2 },
                    { source: 1, target: 3 },
                    { source: 2, target: 4 },
                    { source: 3, target: 4 },
                    { source: 4, target: 5 },
                    { source: 5, target: 6 },
                    { source: 6, target: 1 }
                ]
            },
            linkedlist: [1, 2, 3, 4, 5],
            heap: [10, 8, 9, 4, 7, 5, 3, 2, 1],
            hashtable: {
                "apple": "fruit",
                "carrot": "vegetable",
                "salmon": "fish",
                "bread": "grain",
                "milk": "dairy",
                "chicken": "meat"
            }
        };
        
        this.init();
    }

    init() {
        // Initialize theme
        initTheme();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Try to restore state from URL/hash; fallback to default sample
        if (!this.loadFromURLState()) {
            this.loadSampleData('array');
        }
        
        // Apply saved type override if present
        const savedType = localStorage.getItem('typeOverride');
        if (savedType) {
            this.forcedType = savedType;
            const typeToggle = document.getElementById('type-toggle');
            if (typeToggle) {
                const label = this.forcedType.charAt(0).toUpperCase() + this.forcedType.slice(1);
                typeToggle.textContent = `Type: ${label}`;
            }
        }
    }

    setupEventListeners() {
        // File input change
        document.getElementById('file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileUpload(file);
            // Reset the input so the same file can be selected again
            e.target.value = '';
        });

        // Sample data custom dropdown
        const sampleToggle = document.getElementById('sample-toggle');
        const sampleMenu = document.getElementById('sample-menu');
        if (sampleToggle && sampleMenu) {
            const closeMenu = () => {
                sampleMenu.classList.remove('open');
                sampleMenu.setAttribute('aria-hidden', 'true');
            };
            const openMenu = () => {
                sampleMenu.classList.add('open');
                sampleMenu.setAttribute('aria-hidden', 'false');
            };
            const toggleMenu = () => {
                if (sampleMenu.classList.contains('open')) closeMenu(); else openMenu();
            };

            sampleToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMenu();
            });

            sampleMenu.addEventListener('click', (e) => {
                const btn = e.target.closest('.dropdown-item');
                if (!btn) return;
                const value = btn.getAttribute('data-type');
                if (value) {
                    this.loadSampleData(value);
                    closeMenu();
                }
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!sampleMenu.classList.contains('open')) return;
                if (e.target === sampleMenu || e.target === sampleToggle) return;
                if (sampleMenu.contains(e.target)) return;
                closeMenu();
            });

            // Close on Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeMenu();
            });
        }

        // New UI controls
        document.getElementById('format-btn').addEventListener('click', () => {
            this.formatJSON();
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearEditor();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('screenshot-btn').addEventListener('click', () => {
            this.takeScreenshot();
        });

        document.getElementById('help-btn').addEventListener('click', () => {
            this.showHelp();
        });

        // Type override custom dropdown
        const typeToggle = document.getElementById('type-toggle');
        const typeMenu = document.getElementById('type-menu');
        if (typeToggle && typeMenu) {
            const closeType = () => {
                typeMenu.classList.remove('open');
                typeMenu.setAttribute('aria-hidden', 'true');
            };
            const openType = () => {
                typeMenu.classList.add('open');
                typeMenu.setAttribute('aria-hidden', 'false');
            };
            const toggleType = () => {
                if (typeMenu.classList.contains('open')) closeType(); else openType();
            };

            typeToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleType();
            });

            typeMenu.addEventListener('click', (e) => {
                const btn = e.target.closest('.dropdown-item');
                if (!btn) return;
                const value = btn.getAttribute('data-type') || 'auto';
                this.forcedType = value;
                localStorage.setItem('typeOverride', this.forcedType);
                // Update toggle label
                const label = this.forcedType.charAt(0).toUpperCase() + this.forcedType.slice(1);
                typeToggle.textContent = `Type: ${label}`;
                this.updateEditorStatus();
                this.updateUrlDebounced();
                closeType();
            });

            document.addEventListener('click', (e) => {
                if (!typeMenu.classList.contains('open')) return;
                if (e.target === typeMenu || e.target === typeToggle) return;
                if (typeMenu.contains(e.target)) return;
                closeType();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeType();
            });
        }

        // Format JSON shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.formatJSON();
            }
        });

        // Run button
        const runButton = document.getElementById('run-btn');
        runButton.addEventListener('click', () => {
            this.visualizeCurrentData();
        });

        // Keyboard shortcut: Ctrl+Enter to run
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.visualizeCurrentData();
                // Add a visual feedback for the keyboard shortcut
                runButton.classList.add('active');
                setTimeout(() => runButton.classList.remove('active'), 200);
            }
        });

        // Handle editor changes with debounce
        this.editor.addEventListener('input', this.debounce(() => {
            this.updateEditorStatus();
            this.updateUrlDebounced();
        }, 300));

        // Also listen for paste events
        this.editor.addEventListener('paste', () => {
            setTimeout(() => {
                this.updateEditorStatus();
                this.updateUrlDebounced();
            }, 100);
        });

        // Update status on load
        setTimeout(() => this.updateEditorStatus(), 100);

        // Responsive resize handling for visualizations
        const onResize = this.debounce(() => {
            if (this.visualizer && typeof this.visualizer.resize === 'function') {
                try { this.visualizer.resize(); } catch {}
            }
        }, 150);
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
    }

    // Removed drag and drop related methods

    async handleFileUpload(file) {
        try {
            const content = await readFile(file);
            this.editor.textContent = content;
            this.visualizeCurrentData();
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again.');
        }
    }

    loadSampleData(type) {
        if (!this.sampleData[type]) return;
        
        // Format the data nicely for the editor
        const formattedData = JSON.stringify(this.sampleData[type], null, 2);
        this.editor.textContent = formattedData;
        
        // Update status after loading data
        setTimeout(() => this.updateEditorStatus(), 50);
        
        // Clone the data to avoid reference issues
        const dataCopy = JSON.parse(formattedData);
        this.visualizeData(dataCopy, type);
    }

    visualizeCurrentData() {
        try {
            const content = this.editor.textContent.trim();
            if (!content) return;

            // Show loading state
            this.showLoading(true);

            // Add small delay to show loading animation
            setTimeout(() => {
                try {
                    const data = parseData(content);
                    const type = this.forcedType !== 'auto' ? this.forcedType : detectDataType(data);
                    
                    // Validate data
                    const validation = validateDataStructure(data, type);
                    if (!validation.isValid) {
                        this.showError('Data validation failed: ' + validation.errors.join(', '));
                        this.showLoading(false);
                        return;
                    }
                    
                    this.visualizeData(data, type);
                    this.showLoading(false);
                    this.updateUrlDebounced();
                } catch (error) {
                    console.error('Error visualizing data:', error);
                    this.showError('Error visualizing data: ' + error.message);
                    this.showLoading(false);
                }
            }, 100);
        } catch (error) {
            console.error('Error visualizing data:', error);
            this.showError('Error visualizing data: ' + error.message);
            this.showLoading(false);
        }
    }

    visualizeData(data, type) {
        if (!data) return;

        // Clean up previous visualizer
        if (this.visualizer) {
            if (typeof this.visualizer.destroy === 'function') {
                this.visualizer.destroy();
            }
            this.visualizer = null;
        }

        // Create appropriate visualizer based on data type
        try {
            switch (type) {
                case 'array':
                    this.visualizer = new ArrayVisualizer('graph-container', data);
                    break;
                case 'grid':
                    this.visualizer = new GridVisualizer('graph-container', data);
                    break;
                case 'tree':
                    this.visualizer = new TreeVisualizer('graph-container', data);
                    break;
                case 'graph':
                    this.visualizer = new GraphVisualizer('graph-container', data);
                    break;
                case 'linkedlist':
                    this.visualizer = new LinkedListVisualizer('graph-container', data);
                    break;
                case 'heap':
                    this.visualizer = new HeapVisualizer('graph-container', data);
                    break;
                case 'hashtable':
                    this.visualizer = new HashTableVisualizer('graph-container', data);
                    break;
                default:
                    console.warn('Unsupported data type:', type);
                    alert('This data type is not supported for visualization.');
                    return;
            }
            this.currentType = type;
            
            // Update visualization title
            const title = document.getElementById('visualization-title');
            const forced = (this.forcedType !== 'auto');
            title.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Visualization${forced ? ' (Forced)' : ''}`;
            
        } catch (error) {
            console.error('Error creating visualizer:', error);
            this.showError('Error creating visualization: ' + error.message);
        }
    }

    // UI Enhancement Methods
    updateEditorStatus() {
        const content = this.editor.textContent.trim();
        const charCount = content.length;
        
        // Update character count
        document.getElementById('data-size-indicator').textContent = `${charCount} chars`;
        
        if (!content) {
            document.getElementById('data-type-indicator').textContent = 'No Data';
            document.getElementById('validation-status').textContent = '✓ Valid';
            document.getElementById('validation-status').className = 'status-indicator valid';
            return;
        }
        
        try {
            const data = parseData(content);
            const detected = detectDataType(data);
            const type = this.forcedType !== 'auto' ? this.forcedType : detected;
            const validation = validateDataStructure(data, type);
            
            // Update data type
            const forced = (this.forcedType !== 'auto');
            document.getElementById('data-type-indicator').textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}${forced ? ' (Forced)' : ''}`;
            
            // Update validation status
            const statusEl = document.getElementById('validation-status');
            if (validation.isValid) {
                statusEl.textContent = '✓ Valid';
                statusEl.className = 'status-indicator valid';
            } else {
                statusEl.textContent = '⚠ Invalid';
                statusEl.className = 'status-indicator invalid';
                statusEl.title = validation.errors.join(', ');
            }
        } catch (error) {
            document.getElementById('data-type-indicator').textContent = 'Unknown';
            document.getElementById('validation-status').textContent = '✗ Syntax Error';
            document.getElementById('validation-status').className = 'status-indicator invalid';
        }
    }
    
    formatJSON() {
        try {
            const content = this.editor.textContent.trim();
            if (!content) return;
            
            const data = parseData(content);
            this.editor.textContent = JSON.stringify(data, null, 2);
            this.updateEditorStatus();
        } catch (error) {
            this.showError('Cannot format: Invalid JSON syntax');
        }
    }
    
    clearEditor() {
        if (confirm('Are you sure you want to clear the editor?')) {
            this.editor.textContent = '';
            this.updateEditorStatus();
            // Clear visualization
            if (this.visualizer) {
                if (typeof this.visualizer.destroy === 'function') {
                    this.visualizer.destroy();
                }
                this.visualizer = null;
            }
            document.getElementById('graph-container').innerHTML = '';
        }
    }
    
    exportData() {
        const content = this.editor.textContent.trim();
        if (!content) {
            this.showError('No data to export');
            return;
        }
        
        try {
            const data = parseData(content);
            const type = this.forcedType !== 'auto' ? this.forcedType : detectDataType(data);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_data_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            this.showError('Cannot export: Invalid data format');
        }
    }
    
    toggleFullscreen() {
        const panel = document.querySelector('.visualization-panel');
        if (!document.fullscreenElement) {
            panel.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    takeScreenshot() {
        const container = document.getElementById('graph-container');
        const svg = container.querySelector('svg');
        
        if (!svg) {
            this.showError('No visualization to capture');
            return;
        }
        
        // Ensure SVG has explicit size
        const cloned = svg.cloneNode(true);
        cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const rect = svg.getBoundingClientRect();
        const width = parseInt(svg.getAttribute('width') || rect.width || 800, 10);
        const height = parseInt(svg.getAttribute('height') || rect.height || 600, 10);
        cloned.setAttribute('width', width);
        cloned.setAttribute('height', height);

        // Serialize and draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(cloned);
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            const link = document.createElement('a');
            link.download = `visualization_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
    
    showHelp() {
        const helpContent = `
            <div style="max-width: 500px; line-height: 1.6;">
                <h3 style="margin-top: 0;">Data Structure Visualizer Help</h3>
                
                <h4>Supported Data Types:</h4>
                <ul>
                    <li><strong>Arrays:</strong> [1, 2, 3, 4, 5]</li>
                    <li><strong>Trees:</strong> {"value": 1, "left": {"value": 2}, "right": {"value": 3}}</li>
                    <li><strong>Graphs:</strong> {"nodes": [...], "links": [...]}</li>
                    <li><strong>Linked Lists:</strong> [1, 2, 3, 4, 5]</li>
                    <li><strong>Heaps:</strong> [10, 8, 9, 4, 7, 5, 3]</li>
                    <li><strong>Hash Tables:</strong> {"key1": "value1", "key2": "value2"}</li>
                </ul>
                
                <h4>Keyboard Shortcuts:</h4>
                <ul>
                    <li><strong>Ctrl+Enter:</strong> Run visualization</li>
                    <li><strong>Ctrl+Shift+F:</strong> Format JSON</li>
                </ul>
                
                <h4>Tips:</h4>
                <ul>
                    <li>Use sample data buttons for quick examples</li>
                    <li>Edit data directly in the editor</li>
                    <li>Hover over visualizations for details</li>
                    <li>Use dark mode toggle for better visibility</li>
                </ul>
            </div>
        `;
        
        this.showModal('Help', helpContent);
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    
    showError(message) {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">⚠️</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close">×</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
        
        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }
    
    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- URL State (hash-based) ---
    updateURLState() {
        try {
            const content = (this.editor.textContent || '').trim();
            const type = this.forcedType || 'auto';
            const params = new URLSearchParams();
            params.set('type', type);
            if (content) params.set('data', content);
            // Use hash to avoid server involvement
            const newHash = '#' + params.toString();
            if (location.hash !== newHash) {
                history.replaceState(null, '', newHash);
            }
        } catch {}
    }

    loadFromURLState() {
        try {
            if (!location.hash || location.hash.length < 2) return false;
            const raw = location.hash.slice(1);
            const params = new URLSearchParams(raw);
            const type = params.get('type');
            const dataParam = params.get('data');
            if (type) {
                this.forcedType = type;
                const typeToggle = document.getElementById('type-toggle');
                if (typeToggle) {
                    const label = this.forcedType.charAt(0).toUpperCase() + this.forcedType.slice(1);
                    typeToggle.textContent = `Type: ${label}`;
                }
            }
            if (dataParam) {
                this.editor.textContent = dataParam;
                // attempt visualize
                this.visualizeCurrentData();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DataVisualizerApp();
});
