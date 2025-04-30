// Make sure we have the correct require function
let monaco;
let editor;
let ipcRenderer;

try {
  // Check if we're in an Electron environment
  if (window.require) {
    const electronRequire = window.require;
    ipcRenderer = electronRequire('electron').ipcRenderer;
    // In a real app, you would use a proper path to Monaco
    monaco = window.monaco || { editor: null };
  } else {
    // Fallback for browser testing
    monaco = window.monaco || { editor: null };
    console.warn('Running in browser mode - some features may be limited');
  }
} catch (error) {
  console.error('Failed to import required modules:', error);
  // Fallback for browser testing
  monaco = window.monaco || { editor: null };
}

// File content cache (simulated)
const files = {
  'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Code Editor</title>\n</head>\n<body>\n  <div id="editor"></div>\n</body>\n</html>',
  'renderer.js': '// Type your code here\nconsole.log("Hello World!");\n',
  'main.js': 'const { app, BrowserWindow } = require(\'electron\')\n\nfunction createWindow() {\n  const win = new BrowserWindow({\n    width: 1200,\n    height: 800\n  })\n\n  win.loadFile(\'index.html\')\n}\n\napp.whenReady().then(createWindow)'
};

let currentFile = 'renderer.js';

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing editor...');
  
  // Wait for Monaco to be ready before initializing
  onMonacoReady(() => {
    initializeEditor();
  });
  
  // Add event listeners to existing tabs
  setupTabEventListeners();
  
  console.log('Editor initialization registered');
});

// Initialize Monaco Editor
function initializeEditor() {
  try {
    console.log('Creating Monaco editor instance...');
    
    // For testing in browser, create a simple editor if Monaco isn't available
    if (!monaco || !monaco.editor) {
      console.warn('Monaco editor not available, creating fallback editor');
      
      // Create a simple textarea as fallback
      const editorContainer = document.getElementById('editor-container');
      if (editorContainer) {
        const textarea = document.createElement('textarea');
        textarea.id = 'fallback-editor';
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.backgroundColor = '#1e1e1e';
        textarea.style.color = '#d4d4d4';
        textarea.style.fontFamily = 'Consolas, "Courier New", monospace';
        textarea.style.padding = '10px';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        editorContainer.appendChild(textarea);
        
        // Update our editor reference to use the textarea API
        editor = {
          getValue: () => textarea.value,
          setValue: (value) => textarea.value = value,
          onDidChangeCursorPosition: (callback) => {
            textarea.addEventListener('click', () => {
              // Approximate cursor position
              const lines = textarea.value.substr(0, textarea.selectionStart).split('\n');
              const lineNumber = lines.length;
              const column = lines[lines.length - 1].length + 1;
              callback({ position: { lineNumber, column } });
            });
            textarea.addEventListener('keyup', () => {
              // Approximate cursor position
              const lines = textarea.value.substr(0, textarea.selectionStart).split('\n');
              const lineNumber = lines.length;
              const column = lines[lines.length - 1].length + 1;
              callback({ position: { lineNumber, column } });
            });
          },
          onDidChangeModelContent: (callback) => {
            textarea.addEventListener('input', callback);
          },
          getModel: () => ({ 
            getValue: () => textarea.value, 
            setValue: (value) => textarea.value = value 
          })
        };
      } else {
        console.error('Editor container element not found in DOM');
        return;
      }
    } else {
      // Create Monaco Editor instance
      editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '// Loading...',
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'all',
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: 14,
        lineNumbers: 'on',
        folding: true,
        glyphMargin: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3
      });
    }
    
    console.log('Editor created successfully');
    
    // Set initial content
    if (files[currentFile]) {
      console.log(`Setting initial content for ${currentFile}`);
      editor.setValue(files[currentFile]);
      setEditorLanguage(currentFile);
    }
    
    // Register event listeners
    setupEditorEventListeners();
    setupIPCEventListeners();
    
    // For manual testing - make the editor globally accessible
    window.editorInstance = editor;
    
  } catch (error) {
    console.error('Error initializing editor:', error);
    
    // Try to create a fallback textarea
    const editorContainer = document.getElementById('editor-container');
    if (editorContainer) {
      editorContainer.innerHTML = `<div class="error-editor">
        <h3>Error initializing editor</h3>
        <p>${error.message}</p>
        <textarea style="width: 100%; height: 80%; background-color: #1e1e1e; color: #d4d4d4;"></textarea>
      </div>`;
    }
  }
}

// Set up editor event listeners
function setupEditorEventListeners() {
  if (!editor) return;
  
  // Update cursor position in status bar
  editor.onDidChangeCursorPosition(e => {
    const position = e.position;
    document.querySelector('.line-col').textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
  });
  
  // Save changes to our file cache when content changes
  editor.onDidChangeModelContent(() => {
    files[currentFile] = editor.getValue();
  });
  
  console.log('Editor event listeners set up');
}

// Set up IPC event listeners
function setupIPCEventListeners() {
  if (!ipcRenderer) {
    console.log('IPC renderer not available, setting up file click handler fallback');
    
    // Set up file click handler for browser testing
    document.addEventListener('click', (event) => {
      // Check if clicked element is a file in the file explorer
      let element = event.target;
      while (element && !element.classList.contains('file')) {
        if (element.parentElement) {
          element = element.parentElement;
        } else {
          break;
        }
      }
      
      if (element && element.classList.contains('file')) {
        const fileName = element.querySelector('span').textContent;
        console.log(`File clicked through DOM event: ${fileName}`);
        
        if (files[fileName]) {
          testOpenFile(fileName);
        }
      }
    });
    
    return;
  }
  
  // Listen for file open events from the sidebar
  ipcRenderer.on('file-content', (event, fileData) => {
    const { name, path: filePath, content } = fileData;
    console.log(`Received file content for: ${name} (${content.length} bytes)`);
    
    // Add file to our cache
    files[name] = content;
    
    // Create or update tab
    createOrUpdateTab(name);
    
    // Set file content in editor
    currentFile = name;
    if (editor) {
      editor.setValue(content);
      setEditorLanguage(name);
    } else {
      console.error('Editor not initialized when trying to set content');
    }
  });
  
  // Handle file content error events
  ipcRenderer.on('file-content-error', (event, errorData) => {
    const { name, path: filePath, error } = errorData;
    console.error(`Error loading file ${name}: ${error}`);
    // Show error in UI
    alert(`Failed to load file: ${name}\nError: ${error}`);
  });
  
  console.log('IPC event listeners set up');
}

// Create or update a tab for a file
function createOrUpdateTab(fileName) {
  // Find an existing tab
  let tab = null;
  document.querySelectorAll('.tab span').forEach(span => {
    if (span.textContent === fileName) {
      tab = span.parentElement;
    }
  });
  
  if (!tab) {
    // Create new tab if it doesn't exist
    console.log(`Creating new tab for ${fileName}`);
    const tabsContainer = document.querySelector('.editor-tabs');
    tab = document.createElement('div');
    tab.className = 'tab';
    tab.innerHTML = `<span>${fileName}</span><i class="fas fa-times"></i>`;
    tabsContainer.appendChild(tab);
    
    // Add click event to the new tab
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (files[fileName]) {
        currentFile = fileName;
        if (editor) {
          editor.setValue(files[fileName]);
          setEditorLanguage(fileName);
        }
      }
    });
    
    // Add close event to the new tab
    tab.querySelector('i').addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Close tab: ' + fileName);
      tab.remove();
      
      // If this was the active tab, activate another one if available
      if (tab.classList.contains('active')) {
        const remainingTabs = document.querySelectorAll('.tab');
        if (remainingTabs.length > 0) {
          remainingTabs[0].click();
        }
      }
    });
  }
  
  // Activate the tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
}

// Set up event listeners for existing tabs
function setupTabEventListeners() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Get the file name from tab
      const fileName = tab.querySelector('span').textContent;
      
      // Set it as active tab
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Set file content in editor
      if (files[fileName] && editor) {
        currentFile = fileName;
        editor.setValue(files[fileName]);
        setEditorLanguage(fileName);
      }
    });
    
    // Handle close tab button
    tab.querySelector('i').addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent tab selection when closing
      
      // In a real app, you'd handle saving changes here
      console.log('Close tab: ' + tab.querySelector('span').textContent);
      tab.remove();
      
      // If this was the active tab, activate another one if available
      if (tab.classList.contains('active')) {
        const remainingTabs = document.querySelectorAll('.tab');
        if (remainingTabs.length > 0) {
          remainingTabs[0].click();
        }
      }
    });
  });
  
  console.log('Tab event listeners set up');
}

// Set editor language based on file extension
function setEditorLanguage(fileName) {
  if (!editor) return;
  
  const extension = fileName.split('.').pop().toLowerCase();
  let language = 'text';
  
  switch(extension) {
    case 'js':
      language = 'javascript';
      break;
    case 'html':
      language = 'html';
      break;
    case 'css':
      language = 'css';
      break;
    case 'json':
      language = 'json';
      break;
    case 'md':
      language = 'markdown';
      break;
    case 'py':
      language = 'python';
      break;
    case 'jsx':
      language = 'javascript';
      break;
    case 'ts':
      language = 'typescript';
      break;
    case 'tsx':
      language = 'typescript';
      break;
  }
  
  // Update status bar
  document.querySelector('.language').textContent = language.charAt(0).toUpperCase() + language.slice(1);
  
  // For Monaco editor
  if (monaco && monaco.editor && editor.getModel) {
    monaco.editor.setModelLanguage(editor.getModel(), language);
  }
}

// Activity bar panel switching
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.activity-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      document.querySelectorAll('.activity-icon').forEach(i => i.classList.remove('active'));
      icon.classList.add('active');
      
      // Here you would show the corresponding panel
      const panel = icon.getAttribute('data-panel');
      document.querySelector('.panel-header h3').textContent = panel.toUpperCase();
    });
  });
});

// Test function to simulate opening a file (for debugging)
function testOpenFile(filename) {
  console.log(`Test: Opening file ${filename}`);
  if (files[filename]) {
    createOrUpdateTab(filename);
    currentFile = filename;
    if (editor) {
      editor.setValue(files[filename]);
      setEditorLanguage(filename);
      return true;
    }
  }
  console.error(`Test: File ${filename} not found in cache`);
  return false;
}

// Make it globally available for testing
window.testOpenFile = testOpenFile;