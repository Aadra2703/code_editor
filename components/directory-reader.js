// Directory reader functionality
const fs = require('fs');
const path = require('path');

// Function to read directory structure
function readDirectory(dirPath) {
  try {
    const result = { name: path.basename(dirPath), type: 'folder', children: [] };
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    // Sort items by type (folders first) then by name
    items.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      // Skip node_modules folder and hidden files/folders
      if (item.name === 'node_modules' || item.name.startsWith('.')) {
        continue;
      }
      
      if (item.isDirectory()) {
        result.children.push(readDirectory(itemPath));
      } else {
        result.children.push({
          name: item.name,
          type: 'file',
          path: itemPath
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error reading directory:', error);
    return { name: path.basename(dirPath), type: 'folder', error: true };
  }
}

// Function to generate HTML for the file explorer
function generateFileExplorerHTML(directoryStructure, isRoot = true) {
  let html = '';
  
  if (isRoot) {
    html = `
      <div class="folder-group">
        <div class="folder-header">
          <i class="fas fa-chevron-down"></i>
          <span>${directoryStructure.name.toUpperCase()}</span>
        </div>
        <div class="file-list">
    `;
  }
  
  for (const item of directoryStructure.children) {
    if (item.type === 'folder') {
      html += `
        <div class="folder-group">
          <div class="folder-header">
            <i class="fas fa-chevron-right"></i>
            <span>${item.name}</span>
          </div>
          <div class="file-list" style="display: none;">
            ${generateFileExplorerHTML(item, false)}
          </div>
        </div>
      `;
    } else {
      // Determine file icon based on extension
      let fileIcon = 'fa-file';
      const extension = path.extname(item.name).toLowerCase();
      
      if (['.js', '.jsx', '.ts', '.tsx'].includes(extension)) {
        fileIcon = 'fa-file-code';
      } else if (['.html', '.htm'].includes(extension)) {
        fileIcon = 'fa-file-code';
      } else if (['.css', '.scss', '.less'].includes(extension)) {
        fileIcon = 'fa-file-code';
      } else if (['.json'].includes(extension)) {
        fileIcon = 'fa-file-code';
      } else if (['.md'].includes(extension)) {
        fileIcon = 'fa-file-alt';
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(extension)) {
        fileIcon = 'fa-file-image';
      }
      
      html += `
        <div class="file" data-path="${item.path}">
          <i class="fas ${fileIcon}"></i>
          <span>${item.name}</span>
        </div>
      `;
    }
  }
  
  if (isRoot) {
    html += `
        </div>
      </div>
    `;
  }
  
  return html;
}

// Export functions
module.exports = {
  readDirectory,
  generateFileExplorerHTML
};