// Sidebar functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('Sidebar script loaded, initializing file explorer...');
  
  // Initialize file explorer with directory structure
  initializeFileExplorer();
  
  // Function to handle folder header clicks (expand/collapse)
  function handleFolderClick(header) {
    const folderIcon = header.querySelector('i');
    const fileList = header.nextElementSibling;
    
    if (folderIcon.classList.contains('fa-chevron-down')) {
      folderIcon.classList.replace('fa-chevron-down', 'fa-chevron-right');
      fileList.style.display = 'none';
    } else {
      folderIcon.classList.replace('fa-chevron-right', 'fa-chevron-down');
      fileList.style.display = 'block';
    }
  }

  // Handle file click event
  function handleFileClick(file) {
    // Get the file name from span
    const fileName = file.querySelector('span').textContent;
    const filePath = file.getAttribute('data-path');
    
    console.log(`File clicked: ${fileName} (${filePath})`);
    
    if (!fileName) {
      console.error('File name is missing');
      return;
    }
    
    // Update file selection in explorer
    document.querySelectorAll('.file').forEach(f => f.classList.remove('active'));
    file.classList.add('active');
    
    // Check if we're in Electron or browser
    try {
      // For Electron
      if (window.require) {
        const electronRequire = window.require;
        const { ipcRenderer } = electronRequire('electron');
        
        // Only send message if path is available
        if (filePath) {
          console.log(`Sending 'open-file' message to main process for ${fileName}`);
          ipcRenderer.send('open-file', { name: fileName, path: filePath });
        } else {
          console.warn(`File path not available for ${fileName}, using test function instead`);
          if (window.testOpenFile) {
            window.testOpenFile(fileName);
          }
        }
      } else {
        // For browser testing
        console.log(`Browser mode: using testOpenFile for ${fileName}`);
        if (window.testOpenFile) {
          window.testOpenFile(fileName);
        } else {
          console.error('testOpenFile function not available');
        }
      }
    } catch (error) {
      console.error('Error handling file click:', error);
      
      // Fallback to test function
      if (window.testOpenFile) {
        window.testOpenFile(fileName);
      }
    }
  }

  // Initialize file explorer once DOM is loaded
  function initializeFileExplorer() {
    try {
      // Check if we're in Electron
      let isElectron = false;
      let ipcRenderer;
      
      try {
        if (window.require) {
          const electronRequire = window.require;
          ipcRenderer = electronRequire('electron').ipcRenderer;
          isElectron = true;
        }
      } catch (error) {
        console.warn('Not running in Electron environment:', error.message);
      }
      
      if (isElectron) {
        console.log('Requesting directory structure from main process...');
        
        // Request directory structure from the main process
        ipcRenderer.send('request-directory-structure');
        
        // Listen for directory structure response
        ipcRenderer.on('directory-structure', (event, directoryStructure) => {
          console.log('Received directory structure:', 
            directoryStructure ? 'Data received' : 'No data received');
          
          if (!directoryStructure) {
            console.error('Directory structure is undefined or null');
            manuallyPopulateExplorer(); // Fall back to manual population
            return;
          }
          
          populateFileExplorer(directoryStructure);
        });
      } else {
        console.log('Browser mode detected, manually populating file explorer');
        manuallyPopulateExplorer();
      }
    } catch (error) {
      console.error('Error initializing file explorer:', error);
      const fileExplorer = document.querySelector('.file-explorer');
      if (fileExplorer) {
        fileExplorer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
      }
      
      // Try manual population as fallback
      manuallyPopulateExplorer();
    }
  }
  
  // Function to populate the file explorer with directory structure
  function populateFileExplorer(directoryStructure) {
    // Get file explorer container
    const fileExplorer = document.querySelector('.file-explorer');
    if (!fileExplorer) {
      console.error('File explorer element not found in DOM');
      return;
    }
    
    // Clear existing content
    fileExplorer.innerHTML = '';
    
    try {
      // Generate HTML for file explorer
      let explorerHtml;
      
      try {
        // Try to use the directory reader module
        const directoryReader = require('./components/directory-reader');
        if (directoryReader && directoryReader.generateFileExplorerHTML) {
          explorerHtml = directoryReader.generateFileExplorerHTML(directoryStructure);
        } else {
          throw new Error('Directory reader module or function not found');
        }
      } catch (moduleError) {
        console.warn('Could not use directory reader module:', moduleError.message);
        
        // Fallback to manual HTML generation
        explorerHtml = `
          <div class="folder-group">
            <div class="folder-header">
              <i class="fas fa-chevron-down"></i>
              <span>${(directoryStructure.name || 'PROJECT').toUpperCase()}</span>
            </div>
            <div class="file-list">
              ${generateSimpleFileList(directoryStructure)}
            </div>
          </div>
        `;
      }
      
      // Set HTML content
      fileExplorer.innerHTML = explorerHtml;
      
      console.log('File explorer HTML generated and inserted');
      
      // Add event listeners to folder headers
      fileExplorer.querySelectorAll('.folder-header').forEach(header => {
        header.addEventListener('click', () => handleFolderClick(header));
      });
      
      // Add event listeners to files
      fileExplorer.querySelectorAll('.file').forEach(file => {
        file.addEventListener('click', () => handleFileClick(file));
      });
    } catch (error) {
      console.error('Error generating file explorer HTML:', error);
      fileExplorer.innerHTML = `<div class="error">Error loading file explorer: ${error.message}</div>`;
      
      // Try manual population as fallback
      manuallyPopulateExplorer();
    }
  }
  
  // Simple function to generate file list HTML for fallback
  function generateSimpleFileList(structure) {
    if (!structure || !structure.children || !Array.isArray(structure.children)) {
      return '<div class="empty-folder">No files found</div>';
    }
    
    let html = '';
    
    for (const item of structure.children) {
      if (item.type === 'folder') {
        html += `
          <div class="folder-group">
            <div class="folder-header">
              <i class="fas fa-chevron-right"></i>
              <span>${item.name || 'Unknown Folder'}</span>
            </div>
            <div class="file-list" style="display: none;">
              ${generateSimpleFileList(item)}
            </div>
          </div>
        `;
      } else {
        // Determine file icon based on extension
        let fileIcon = 'fa-file';
        if (item.name) {
          const extension = item.name.split('.').pop().toLowerCase();
          
          if (['js', 'jsx', 'ts', 'tsx'].includes(extension)) {
            fileIcon = 'fa-file-code';
          } else if (['html', 'htm'].includes(extension)) {
            fileIcon = 'fa-file-code';
          } else if (['css', 'scss', 'less'].includes(extension)) {
            fileIcon = 'fa-file-code';
          } else if (['json'].includes(extension)) {
            fileIcon = 'fa-file-code';
          } else if (['md'].includes(extension)) {
            fileIcon = 'fa-file-alt';
          } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
            fileIcon = 'fa-file-image';
          }
        }
        
        html += `
          <div class="file" data-path="${item.path || ''}">
            <i class="fas ${fileIcon}"></i>
            <span>${item.name || 'Unknown File'}</span>
          </div>
        `;
      }
    }
    
    return html;
  }
  
  // For manual testing in browser
  function manuallyPopulateExplorer() {
    console.log('Manually populating file explorer for testing');
    const fileExplorer = document.querySelector('.file-explorer');
    if (fileExplorer) {
      fileExplorer.innerHTML = `
        <div class="folder-group">
          <div class="folder-header">
            <i class="fas fa-chevron-down"></i>
            <span>TEST PROJECT</span>
          </div>
          <div class="file-list">
            <div class="file" data-path="index.html">
              <i class="fas fa-file-code"></i>
              <span>index.html</span>
            </div>
            <div class="file" data-path="renderer.js">
              <i class="fas fa-file-code"></i>
              <span>renderer.js</span>
            </div>
            <div class="file" data-path="main.js">
              <i class="fas fa-file-code"></i>
              <span>main.js</span>
            </div>
            <div class="file" data-path="directory-reader.js">
              <i class="fas fa-file-code"></i>
              <span>directory-reader.js</span>
            </div>
            <div class="file" data-path="sidebar.js">
              <i class="fas fa-file-code"></i>
              <span>sidebar.js</span>
            </div>
          </div>
        </div>
      `;
      
      // Add event listeners to files
      fileExplorer.querySelectorAll('.file').forEach(file => {
        file.addEventListener('click', () => handleFileClick(file));
      });
      
      // Add event listeners to folder headers
      fileExplorer.querySelectorAll('.folder-header').forEach(header => {
        header.addEventListener('click', () => handleFolderClick(header));
      });
    }
  }
  
  // Make manuallyPopulateExplorer available globally for testing
  window.manuallyPopulateExplorer = manuallyPopulateExplorer;
});