const monaco = require('monaco-editor');
const electronRequire = window.require || require;
const { ipcRenderer } = electronRequire('electron');
const path = require('path');

// Create Monaco Editor instance
const editor = monaco.editor.create(document.getElementById('editor-container'), {
  value: '// Type your code here\nconsole.log("Hello World!");\n',
  language: 'javascript',
  theme: 'vs-dark',
  automaticLayout: true,
  minimap: {
    enabled: true
  },
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

// File content cache (simulated)
const files = {
  'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Code Editor</title>\n</head>\n<body>\n  <div id="editor"></div>\n</body>\n</html>',
  'renderer.js': '// Type your code here\nconsole.log("Hello World!");\n',
  'main.js': 'const { app, BrowserWindow } = require(\'electron\')\n\nfunction createWindow() {\n  const win = new BrowserWindow({\n    width: 1200,\n    height: 800\n  })\n\n  win.loadFile(\'index.html\')\n}\n\napp.whenReady().then(createWindow)'
};

let currentFile = 'renderer.js';

// Listen for file open events from the sidebar
ipcRenderer.on('file-content', (event, fileData) => {
  const { name, path: filePath, content } = fileData;
  
  // Add file to our cache
  files[name] = content;
  
  // Find or create corresponding tab
  let tab = null;
  document.querySelectorAll('.tab span').forEach(span => {
    if (span.textContent === name) {
      tab = span.parentElement;
    }
  });
  
  if (!tab) {
    // Create new tab if it doesn't exist
    const tabsContainer = document.querySelector('.editor-tabs');
    tab = document.createElement('div');
    tab.className = 'tab';
    tab.innerHTML = `<span>${name}</span><i class="fas fa-times"></i>`;
    tabsContainer.appendChild(tab);
    
    // Add click event to new tab
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (files[name]) {
        currentFile = name;
        editor.setValue(files[name]);
        
        // Set language based on extension
        setEditorLanguage(name);
      }
    });
    
    // Add close event to new tab
    tab.querySelector('i').addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Close tab: ' + name);
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
  
  // Activate tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  
  // Set file content in editor
  currentFile = name;
  editor.setValue(content);
  
  // Set language based on extension
  setEditorLanguage(name);
});

// Handle editor tab clicks
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Get the file name from tab
    const fileName = tab.querySelector('span').textContent;
    
    // Set it as active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Set file content in editor
    if (files[fileName]) {
      currentFile = fileName;
      editor.setValue(files[fileName]);
      
      // Set language based on file extension
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

// Set editor language based on file extension
function setEditorLanguage(fileName) {
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
  
  monaco.editor.setModelLanguage(editor.getModel(), language);
  document.querySelector('.language').textContent = language.charAt(0).toUpperCase() + language.slice(1);
}

// Update cursor position in status bar
editor.onDidChangeCursorPosition(e => {
  const position = e.position;
  document.querySelector('.line-col').textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
});

// Save changes to our file cache when content changes
editor.onDidChangeModelContent(() => {
  files[currentFile] = editor.getValue();
});

// Activity bar panel switching
document.querySelectorAll('.activity-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    document.querySelectorAll('.activity-icon').forEach(i => i.classList.remove('active'));
    icon.classList.add('active');
    
    // Here you would show the corresponding panel
    const panel = icon.getAttribute('data-panel');
    document.querySelector('.panel-header h3').textContent = panel.toUpperCase();
  });
});