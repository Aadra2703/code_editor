const monaco = require('monaco-editor');

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
      const extension = fileName.split('.').pop();
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
      }
      
      monaco.editor.setModelLanguage(editor.getModel(), language);
      
      // Update status bar
      document.querySelector('.language').textContent = language.charAt(0).toUpperCase() + language.slice(1);
    }
  });
  
  // Handle close tab button
  tab.querySelector('i').addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent tab selection when closing
    
    // In a real app, you'd handle saving changes here
    console.log('Close tab: ' + tab.querySelector('span').textContent);
  });
});

// Handle file clicks in explorer
document.querySelectorAll('.file').forEach(file => {
  file.addEventListener('click', () => {
    const fileName = file.querySelector('span').textContent;
    
    // Update file selection in explorer
    document.querySelectorAll('.file').forEach(f => f.classList.remove('active'));
    file.classList.add('active');
    
    // Find or create corresponding tab
    let tab = null;
    document.querySelectorAll('.tab span').forEach(span => {
      if (span.textContent === fileName) {
        tab = span.parentElement;
      }
    });
    
    if (!tab) {
      // Create new tab if it doesn't exist
      const tabsContainer = document.querySelector('.editor-tabs');
      tab = document.createElement('div');
      tab.className = 'tab';
      tab.innerHTML = `<span>${fileName}</span><i class="fas fa-times"></i>`;
      tabsContainer.appendChild(tab);
      
      // Add click event to new tab
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (files[fileName]) {
          currentFile = fileName;
          editor.setValue(files[fileName]);
        }
      });
      
      // Add close event to new tab
      tab.querySelector('i').addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Close tab: ' + fileName);
      });
    }
    
    // Activate tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Set file content in editor
    if (files[fileName]) {
      currentFile = fileName;
      editor.setValue(files[fileName]);
      
      // Set language based on extension
      const extension = fileName.split('.').pop();
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
      }
      
      monaco.editor.setModelLanguage(editor.getModel(), language);
      document.querySelector('.language').textContent = language.charAt(0).toUpperCase() + language.slice(1);
    }
  });
});

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