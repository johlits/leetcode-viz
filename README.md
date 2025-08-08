# Advanced Data Structure Visualizer

A comprehensive interactive web application for visualizing multiple data structures including arrays, trees, graphs, linked lists, heaps, and hash tables using D3.js.

## Features

- **File Upload**: Clean file input interface for JSON and text files
- **Six Data Structure Types**: Arrays, Trees, Graphs, Linked Lists, Heaps, and Hash Tables
- **Interactive Visualizations**:
  - **Arrays**: Bar chart with indices and values
  - **Trees**: Binary tree with hierarchical layout
  - **Graphs**: Force-directed layout with draggable nodes
  - **Linked Lists**: Sequential node visualization with pointers
  - **Heaps**: Tree structure with heap property validation
  - **Hash Tables**: Bucket visualization with collision detection
- **Smart Data Detection**: Automatically detects data structure type
- **Sample Data**: Pre-loaded examples for all data structures
- **Dark Mode**: Toggle between light and dark themes
- **Keyboard Shortcuts**: Ctrl+Enter to run visualization
- **Responsive Design**: Optimized for desktop and mobile
- **Real-time Editing**: Edit data and see changes instantly
- **Data Validation**: Built-in validation with helpful error messages

## Supported Data Formats

### Arrays
```json
[1, 2, 3, 4, 5]
```

### Binary Trees
```json
{
  "value": 1,
  "left": {
    "value": 2,
    "left": { "value": 4 },
    "right": { "value": 5 }
  },
  "right": {
    "value": 3,
    "left": { "value": 6 },
    "right": { "value": 7 }
  }
}
```

### Graphs
```json
{
  "nodes": [
    { "id": 1, "name": "A" },
    { "id": 2, "name": "B" },
    { "id": 3, "name": "C" }
  ],
  "links": [
    { "source": 1, "target": 2 },
    { "source": 2, "target": 3 },
    { "source": 3, "target": 1 }
  ]
}
```

### Linked Lists
```json
[1, 2, 3, 4, 5]
```

### Heaps (Min/Max)
```json
[10, 8, 9, 4, 7, 5, 3, 2, 1]
```

### Hash Tables
```json
{
  "apple": "fruit",
  "carrot": "vegetable",
  "salmon": "fish"
}
```

Or as key-value pairs:
```json
[["apple", "fruit"], ["carrot", "vegetable"], ["salmon", "fish"]]
```

## How to Use

1. **Using Sample Data**:
   - Click on any of the sample buttons (📊 Array, 🌳 Tree, 🔗 Graph, ⛓️ Linked List, 🔺 Heap, 🗂️ Hash Table)
   - Sample data will be loaded and visualized automatically

2. **Using Your Own Data**:
   - Click "Open File" to select a JSON or text file
   - Or edit the data directly in the editor panel
   - Click "Run" or press Ctrl+Enter to visualize

3. **Interacting with Visualizations**:
   - **Graphs**: Drag nodes to reposition them, zoom and pan
   - **Trees**: Zoom and pan to explore large trees
   - **Heaps**: Hover over nodes to see parent-child relationships
   - **Hash Tables**: Hover over items to see hash values and collision info
   - **All visualizations**: Hover for detailed information

4. **Theme Toggle**:
   - Use the toggle in the top-right to switch between light and dark modes
   - Your preference is automatically saved

## Running Locally

1. Clone this repository
2. Run the included Python server:
   ```bash
   python server.py
   ```
3. Open http://localhost:8000 in your browser

**Note**: A local server is required for ES modules to work properly.

## Dependencies

- [D3.js v7](https://d3js.org/) - For data visualization (loaded via CDN)
- Modern web browser with ES6 module support
- Python 3.x (for local development server)

## Technical Features

- **Modular Architecture**: Clean separation of concerns with ES6 modules
- **Smart Type Detection**: Automatic data structure type recognition
- **Data Validation**: Built-in validation with helpful error messages
- **Performance Optimized**: Efficient rendering for large datasets
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Keyboard navigation and screen reader support
- **Cross-browser Compatible**: Works on all modern browsers

## License

This project is open source and available under the [MIT License](LICENSE).

## Sample Files

You can find sample data files in the `data/` directory to test the visualizer.
# leetcode-viz
