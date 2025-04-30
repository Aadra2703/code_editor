// Sidebar functionality
document.addEventListener('DOMContentLoaded', () => {
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

  // Initialize file explorer once DOM is loaded
  function initializeFileExplorer() {
    // Get the parent directory of the current directory (one level up)
    const electronRequire = window.require || require;
    const { ipcRenderer } = electronRequire('electron');
    
    // Request directory structure from the main process
    ipcRenderer.send('request-directory-structure');
    
    // Listen for directory structure response
    ipcRenderer.on('directory-structure', (event, directoryStructure) => {
      // Get file explorer container
      const fileExplorer = document.querySelector('.file-explorer');
      
      // Clear existing content
      fileExplorer.innerHTML = '';
      
      // Generate HTML for file explorer
      const directoryReader = require('./components/directory-reader');
      const explorerHtml = directoryReader.generateFileExplorerHTML(directoryStructure);
      
      // Set HTML content
      fileExplorer.innerHTML = explorerHtml;
      
      // Add event listeners to folder headers
      fileExplorer.querySelectorAll('.folder-header').forEach(header => {
        header.addEventListener('click', () => handleFolderClick(header));
      });
      
      // Add event listeners to files
      fileExplorer.querySelectorAll('.file').forEach(file => {
        file.addEventListener('click', () => {
          // Get the file name from span
          const fileName = file.querySelector('span').textContent;
          const filePath = file.getAttribute('data-path');
          
          // Update file selection in explorer
          document.querySelectorAll('.file').forEach(f => f.classList.remove('active'));
          file.classList.add('active');
          
          // Trigger file open event
          ipcRenderer.send('open-file', { name: fileName, path: filePath });
        });
      });
    });
  }
});