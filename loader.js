// Loader script to initialize all components
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing VS Code-like Editor...');
  
  // Set up a global simulated Monaco for browser testing if needed
  if (typeof monaco === 'undefined') {
    console.log('Monaco not found, creating simulation for browser testing');
    
    // Create a simple Monaco editor simulation for testing
    window.monaco = {
      editor: {
        create: function(element, options) {
          console.log('Creating simulated Monaco editor');
          
          // Create a textarea as our editor
          const textarea = document.createElement('textarea');
          textarea.style.width = '100%';
          textarea.style.height = '100%';
          textarea.style.backgroundColor = options.theme === 'vs-dark' ? '#1e1e1e' : '#ffffff';
          textarea.style.color = options.theme === 'vs-dark' ? '#d4d4d4' : '#000000';
          textarea.style.fontFamily = options.fontFamily || 'monospace';
          textarea.style.fontSize = (options.fontSize || 14) + 'px';
          textarea.style.padding = '10px';
          textarea.style.border = 'none';
          textarea.style.outline = 'none';
          textarea.style.resize = 'none';
          textarea.value = options.value || '';
          
          // Clear the container and append our textarea
          element.innerHTML = '';
          element.appendChild(textarea);
          
          // Store listeners
          const listeners = {
            changeCursorPosition: [],
            changeModelContent: []
          };
          
          // Return a simulated Monaco editor instance
          return {
            getValue: () => textarea.value,
            setValue: (value) => { textarea.value = value; },
            getModel: () => ({
              getValue: () => textarea.value,
              setValue: (value) => { textarea.value = value; }
            }),
            onDidChangeCursorPosition: (callback) => {
              listeners.changeCursorPosition.push(callback);
              
              textarea.addEventListener('click', () => {
                // Approximation of cursor position
                const value = textarea.value;
                const selectionStart = textarea.selectionStart;
                const lines = value.substring(0, selectionStart).split('\n');
                const lineNumber = lines.length;
                const column = lines[lines.length - 1].length + 1;
                
                callback({ position: { lineNumber, column } });
              });
              
              textarea.addEventListener('keyup', () => {
                // Approximation of cursor position
                const value = textarea.value;
                const selectionStart = textarea.selectionStart;
                const lines = value.substring(0, selectionStart).split('\n');
                const lineNumber = lines.length;
                const column = lines[lines.length - 1].length + 1;
                
                callback({ position: { lineNumber, column } });
              });
              
              return { dispose: () => {} };
            },
            onDidChangeModelContent: (callback) => {
              listeners.changeModelContent.push(callback);
              textarea.addEventListener('input', callback);
              return { dispose: () => {} };
            },
            layout: () => {},
            dispose: () => {},
            updateOptions: () => {},
            focus: () => textarea.focus()
          };
        },
        setModelLanguage: function(model, language) {
          console.log(`Simulated setModelLanguage: ${language}`);
          // We would update syntax highlighting here if this was a real editor
        },
        defineTheme: function() {},
        setTheme: function() {}
      }
    };
    
    console.log('Monaco simulation created for browser testing');
  } else {
    console.log('Monaco editor found in global scope');
  }
  
  // Signal that Monaco is ready
  window.monacoLoaderReady = true;
  if (window.monacoReadyCallbacks && Array.isArray(window.monacoReadyCallbacks)) {
    console.log(`Calling ${window.monacoReadyCallbacks.length} Monaco ready callbacks`);
    window.monacoReadyCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in Monaco ready callback:', error);
      }
    });
  }

  // Init IPC communication for debug purposes
  try {
    if (window.require) {
      const electronRequire = window.require;
      const { ipcRenderer } = electronRequire('electron');
      
      // Test IPC communication
      console.log('IPC communication initialized');
      
      // Listen for test events
      ipcRenderer.on('test-event', (event, data) => {
      console.log('Received test event:', data);
    });
  }} catch (error) {
    console.error('Error initializing IPC:', error);
  }
  
  console.log('Editor initialization complete');
});