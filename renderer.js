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

// Track file paths (for saving back to disk)
const filePaths = {};
let currentFile = 'renderer.js';
let isDirty = false; // Track if current file has unsaved changes

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing editor...');
  
  // Wait for Monaco to be ready before initializing
  onMonacoReady(() => {
    initializeEditor();
  });
  
  // Add event listeners to existing tabs
  setupTabEventListeners();
  
  // Set up keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Add save button to status bar
  addSaveButton();
  
  // Initialize code execution
  initializeCodeExecution();
  
  console.log('Editor initialization registered');
});

// Add save button to status bar
function addSaveButton() {
  const statusRight = document.querySelector('.status-right');
  
  if (statusRight) {
    const saveButton = document.createElement('span');
    saveButton.className = 'save-button';
    saveButton.innerHTML = '<i class="fas fa-save"></i> Save';
    saveButton.title = 'Save file (Ctrl+S)';
    saveButton.style.cursor = 'pointer';
    saveButton.style.marginRight = '10px';
    
    // Add click handler
    saveButton.addEventListener('click', () => {
      saveCurrentFile();
    });
    
    // Insert at the beginning of status-right
    statusRight.insertBefore(saveButton, statusRight.firstChild);
  }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Ctrl+S (or Cmd+S on Mac) to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault(); // Prevent browser save dialog
      saveCurrentFile();
    }
  });
}

// Save the current file
function saveCurrentFile() {
  if (!currentFile || !editor) {
    console.warn('No file to save or editor not initialized');
    return;
  }
  
  // Get current content from editor
  const content = editor.getValue();
  
  // Update our local cache
  files[currentFile] = content;
  
  // Check if we have a path for this file (if it was opened from disk)
  if (filePaths[currentFile]) {
    console.log(`Saving ${currentFile} to ${filePaths[currentFile]}`);
    
    // If we have IPC available, save through main process
    if (ipcRenderer) {
      showSavingIndicator();
      
      ipcRenderer.send('save-file', {
        name: currentFile,
        path: filePaths[currentFile],
        content: content
      });
    } else {
      console.warn('IPC not available, cannot save file to disk');
      // For browser testing, simulate success
      showSavedIndicator();
      updateDirtyState(false);
    }
  } else {
    console.warn(`No file path associated with ${currentFile}, cannot save to disk`);
    // In a real app, you'd show a "Save As" dialog here
    alert('This file was not opened from disk. In a real app, a "Save As" dialog would appear here.');
  }
}

// Show saving indicator in status bar
function showSavingIndicator() {
  const statusLeft = document.querySelector('.status-left');
  
  if (statusLeft) {
    // Create or update saving indicator
    let savingIndicator = document.querySelector('.saving-indicator');
    
    if (!savingIndicator) {
      savingIndicator = document.createElement('span');
      savingIndicator.className = 'saving-indicator';
      statusLeft.appendChild(savingIndicator);
    }
    
    savingIndicator.textContent = 'Saving...';
    savingIndicator.style.color = '#ffa500';
  }
}

// Show saved indicator in status bar
function showSavedIndicator() {
  const statusLeft = document.querySelector('.status-left');
  
  if (statusLeft) {
    let savingIndicator = document.querySelector('.saving-indicator');
    
    if (!savingIndicator) {
      savingIndicator = document.createElement('span');
      savingIndicator.className = 'saving-indicator';
      statusLeft.appendChild(savingIndicator);
    }
    
    savingIndicator.textContent = 'Saved';
    savingIndicator.style.color = '#4CAF50';
    
    // Clear the indicator after a delay
    setTimeout(() => {
      savingIndicator.textContent = '';
    }, 2000);
  }
}

// Update tab dirty state
function updateDirtyState(dirty) {
  isDirty = dirty;
  
  // Find the tab for the current file
  document.querySelectorAll('.tab span').forEach(span => {
    if (span.textContent === currentFile) {
      const tab = span.parentElement;
      
      if (dirty) {
        if (!tab.classList.contains('dirty')) {
          tab.classList.add('dirty');
          // Add a visual indicator (bullet) before the name
          span.textContent = '• ' + span.textContent.replace(/^• /, '');
        }
      } else {
        tab.classList.remove('dirty');
        // Remove the bullet
        span.textContent = span.textContent.replace(/^• /, '');
      }
    }
  });
}

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
            textarea.addEventListener('input', () => {
              updateDirtyState(true);
              callback();
            });
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
  
  // Mark file as dirty when content changes
  editor.onDidChangeModelContent(() => {
    files[currentFile] = editor.getValue();
    updateDirtyState(true);
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
    
    // Add file to our cache and store its path
    files[name] = content;
    filePaths[name] = filePath;
    
    // Create or update tab
    createOrUpdateTab(name);
    
    // Set file content in editor
    currentFile = name;
    if (editor) {
      editor.setValue(content);
      setEditorLanguage(name);
      updateDirtyState(false); // Reset dirty state as we just opened the file
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
  
  // Handle file save response
  ipcRenderer.on('file-saved', (event, saveData) => {
    const { name, path: filePath, success, error } = saveData;
    
    if (success) {
      console.log(`File saved successfully: ${name}`);
      showSavedIndicator();
      updateDirtyState(false);
    } else {
      console.error(`Error saving file ${name}: ${error}`);
      alert(`Failed to save file: ${name}\nError: ${error}`);
      
      // Update save indicator to show error
      const savingIndicator = document.querySelector('.saving-indicator');
      if (savingIndicator) {
        savingIndicator.textContent = 'Save failed';
        savingIndicator.style.color = '#f44336';
        
        // Clear the indicator after a delay
        setTimeout(() => {
          savingIndicator.textContent = '';
        }, 3000);
      }
    }
  });
  
  console.log('IPC event listeners set up');
}

// Create or update a tab for a file
function createOrUpdateTab(fileName) {
  // Find an existing tab
  let tab = null;
  document.querySelectorAll('.tab span').forEach(span => {
    if (span.textContent === fileName || span.textContent === '• ' + fileName) {
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
      // Check if current file has unsaved changes and prompt user
      if (currentFile && isDirty && files[currentFile]) {
        const save = confirm(`Save changes to ${currentFile}?`);
        if (save) {
          saveCurrentFile();
        }
      }
      
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (files[fileName]) {
        currentFile = fileName;
        if (editor) {
          editor.setValue(files[fileName]);
          setEditorLanguage(fileName);
          updateDirtyState(false); // Reset dirty state as we just switched to this file
        }
      }
    });
    
    // Add close event to the new tab
    tab.querySelector('i').addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Check if this tab has unsaved changes
      if (fileName === currentFile && isDirty) {
        const save = confirm(`Save changes to ${fileName} before closing?`);
        if (save) {
          saveCurrentFile();
        }
      }
      
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
      // Check if current file has unsaved changes and prompt user
      if (currentFile && isDirty && files[currentFile]) {
        const save = confirm(`Save changes to ${currentFile}?`);
        if (save) {
          saveCurrentFile();
        }
      }
      
      // Get the file name from tab
      const fileName = tab.querySelector('span').textContent.replace(/^• /, '');
      
      // Set it as active tab
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Set file content in editor
      if (files[fileName] && editor) {
        currentFile = fileName;
        editor.setValue(files[fileName]);
        setEditorLanguage(fileName);
        updateDirtyState(false);
      }
    });
    
    // Handle close tab button
    tab.querySelector('i').addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent tab selection when closing
      
      // Get the file name from tab
      const fileName = tab.querySelector('span').textContent.replace(/^• /, '');
      
      // Check if this tab has unsaved changes
      if (fileName === currentFile && isDirty) {
        const save = confirm(`Save changes to ${fileName} before closing?`);
        if (save) {
          saveCurrentFile();
        }
      }
      
      // In a real app, you'd handle saving changes here
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
      updateDirtyState(false);
      return true;
    }
  }
  console.error(`Test: File ${filename} not found in cache`);
  return false;
}

// Make it globally available for testing
window.testOpenFile = testOpenFile;
window.saveCurrentFile = saveCurrentFile;

// Initialize code execution functionality
function initializeCodeExecution() {
  const runButton = document.querySelector('.run-code-button');
  const terminalPanel = document.querySelector('.terminal-panel');
  const terminalContent = document.querySelector('.terminal-content');
  const terminalClose = document.querySelector('.terminal-close');
  
  if (!runButton || !terminalPanel || !terminalContent || !terminalClose) {
    console.error('Required elements for code execution not found');
    return;
  }
  
  // Handle run button click
  runButton.addEventListener('click', () => {
    if (!currentFile || !editor) {
      alert('No file is currently open');
      return;
    }
    
    // Show terminal panel
    terminalPanel.classList.add('show');
    terminalContent.innerHTML = '';
    
    // Get current file content
    const code = editor.getValue();
    
    // Send code for execution
    if (ipcRenderer) {
      ipcRenderer.send('execute-code', {
        filePath: filePaths[currentFile],
        code: code
      });
    }
  });
  
  // Handle terminal close button
  terminalClose.addEventListener('click', () => {
    terminalPanel.classList.remove('show');
  });
  
  // Handle execution output
  if (ipcRenderer) {
    ipcRenderer.on('execution-output', (event, { type, output }) => {
      const outputElement = document.createElement('div');
      outputElement.className = `output-${type}`;
      outputElement.textContent = output;
      terminalContent.appendChild(outputElement);
      
      // Auto-scroll to bottom
      terminalContent.scrollTop = terminalContent.scrollHeight;
    });
  }
}