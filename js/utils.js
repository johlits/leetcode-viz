// Theme management
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved user preference, if any, on load
    const savedTheme = localStorage.getItem('theme') || 
                      (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Apply the saved theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';
    
    // Add event listener for theme toggle
    themeToggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}

// File handling utilities
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

function parseData(content) {
    try {
        // Try to parse as JSON first
        return JSON.parse(content);
    } catch (e) {
        // If not JSON, try to parse as array or other formats
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return null;
        
        // Try to parse each line as JSON
        const parsed = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                // Try to parse as space or comma separated values
                const values = line.split(/[,\s]+/).map(val => {
                    const num = parseFloat(val);
                    return isNaN(num) ? val.trim() : num;
                });
                return values.length === 1 ? values[0] : values;
            }
        });
        
        return parsed.length === 1 ? parsed[0] : parsed;
    }
}

// Data type detection
function detectDataType(data) {
    if (Array.isArray(data)) {
        // Empty array
        if (data.length === 0) return 'array';
        
        // Check if it's hash table data (array of key-value pairs)
        if (data.length > 0 && Array.isArray(data[0]) && data[0].length === 2) {
            // Verify all elements are key-value pairs
            if (data.every(item => Array.isArray(item) && item.length === 2)) {
                return 'hashtable';
            }
        }
        
        // Check if it's a heap (array of numbers with heap properties)
        if (data.length > 0 && data.every(item => typeof item === 'number')) {
            // More sophisticated heap detection
            if (data.length >= 3) {
                let isMaxHeap = true;
                let isMinHeap = true;
                
                // Check heap property for first few levels
                for (let i = 0; i < Math.min(data.length, 7); i++) {
                    const leftChild = 2 * i + 1;
                    const rightChild = 2 * i + 2;
                    
                    if (leftChild < data.length) {
                        if (data[i] < data[leftChild]) isMaxHeap = false;
                        if (data[i] > data[leftChild]) isMinHeap = false;
                    }
                    
                    if (rightChild < data.length) {
                        if (data[i] < data[rightChild]) isMaxHeap = false;
                        if (data[i] > data[rightChild]) isMinHeap = false;
                    }
                }
                
                // If it satisfies heap property, it's likely a heap
                if (isMaxHeap || isMinHeap) {
                    return 'heap';
                }
            }
        }
        
        // Default to array for simple numeric/string arrays
        // Only consider it a linked list if explicitly structured as one
        return 'array';
    }
    
    if (data && typeof data === 'object') {
        // Graph detection
        if (data.nodes && data.links && Array.isArray(data.nodes) && Array.isArray(data.links)) {
            return 'graph';
        }
        
        // Tree detection (has value and left/right or children)
        if (data.value !== undefined && (data.left !== undefined || data.right !== undefined || data.children !== undefined)) {
            return 'tree';
        }
        
        // Linked list detection (has value and next)
        if (data.value !== undefined && (data.next !== undefined || data.next === null)) {
            return 'linkedlist';
        }
        
        // Hash table detection (object with string keys and simple values)
        const keys = Object.keys(data);
        if (keys.length > 0) {
            // If all keys are strings and values are simple types, it's likely a hash table
            const isHashTable = keys.every(key => typeof key === 'string') &&
                               Object.values(data).every(value => 
                                   typeof value === 'string' || 
                                   typeof value === 'number' || 
                                   typeof value === 'boolean'
                               );
            if (isHashTable) {
                return 'hashtable';
            }
        }
        
        if (keys.length > 0) return 'object';
    }
    
    return 'unknown';
}

// Format JSON with syntax highlighting
function formatJSON(json) {
    if (typeof json === 'string') {
        try {
            json = JSON.parse(json);
        } catch (e) {
            return json; // Return as is if not valid JSON
        }
    }
    
    const str = JSON.stringify(json, null, 2);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"(\w+)":/g, '"<span class="json-key">$1</span>":')
        .replace(/: "(.*?)"/g, ': "<span class="json-string">$1</span>"')
        .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false|null)/g, ': <span class="json-boolean">$1</span>');
}

// Validate data structure
function validateDataStructure(data, type) {
    const errors = [];
    
    switch (type) {
        case 'array':
            if (!Array.isArray(data)) {
                errors.push('Data must be an array');
            }
            break;
            
        case 'tree':
            if (!data || typeof data !== 'object' || data.value === undefined) {
                errors.push('Tree must have a value property');
            }
            break;
            
        case 'graph':
            if (!data || !data.nodes || !data.links) {
                errors.push('Graph must have nodes and links properties');
            } else {
                if (!Array.isArray(data.nodes)) errors.push('Nodes must be an array');
                if (!Array.isArray(data.links)) errors.push('Links must be an array');
            }
            break;
            
        case 'heap':
            if (!Array.isArray(data)) {
                errors.push('Heap must be an array');
            } else if (!data.every(item => typeof item === 'number')) {
                errors.push('Heap must contain only numbers');
            }
            break;
            
        case 'hashtable':
            if (Array.isArray(data)) {
                if (!data.every(item => Array.isArray(item) && item.length === 2)) {
                    errors.push('Hash table array must contain key-value pairs');
                }
            } else if (!data || typeof data !== 'object') {
                errors.push('Hash table must be an object or array of key-value pairs');
            }
            break;
    }
    
    return { isValid: errors.length === 0, errors };
}

// Debounce function for performance
function debounce(func, wait) {
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

export {
    initTheme,
    readFile,
    parseData,
    detectDataType,
    formatJSON,
    validateDataStructure,
    debounce
};
