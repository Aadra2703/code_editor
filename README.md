# Code Editor Project

A VS Code-like editor built with Electron and Monaco Editor.

## Project Structure

```
├── .git                    # Git repository
├── components/             # UI and functionality components
│   ├── directory-reader.js # File system navigation
│   ├── search.js           # Search functionality
│   ├── sidebar.js          # File explorer sidebar
│   ├── statusbar.js        # Status bar component
│   └── tabs.js             # Editor tabs management
├── styles/                 # CSS styling
│   └── main.css            # Main application styling
├── index.html              # Main application HTML
├── loader.js               # Monaco editor loader
├── main.js                 # Electron main process
├── monaco-editor-loader-worker.js # Worker for Monaco editor
├── package-lock.json       # NPM dependencies lock file
├── package.json            # Project metadata and dependencies
├── README.md               # Project documentation
└── renderer.js             # Electron renderer process
```

## Key Components

1. **Main Process (main.js)**
   - Electron application entry point
   - Handles file system operations
   - Manages IPC communication

2. **Renderer Process (renderer.js)**
   - UI initialization and management
   - Monaco editor integration
   - Tab management
   - File handling

3. **Directory Reader (components/directory-reader.js)**
   - File system navigation
   - Directory structure generation

4. **Sidebar (components/sidebar.js)**
   - File explorer visualization
   - Folder expansion/collapse
   - File selection

5. **Search (components/search.js)**
   - Global search across files
   - In-editor search
   - Search results navigation

6. **Tabs (components/tabs.js)**
   - Tab creation and management
   - Tab switching

7. **Status Bar (components/statusbar.js)**
   - Status information display
   - Editor status updates

## Dependencies

- **Electron**: Application framework
- **Monaco Editor**: Code editor component
- **FontAwesome**: Icons

## Features

- File system navigation and file opening
- Code editing with syntax highlighting
- Tab-based file management
- Search functionality (global and in-file)
- Status bar with file information
- File saving