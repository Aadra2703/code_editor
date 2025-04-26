// Sidebar functionality
document.addEventListener('DOMContentLoaded', () => {
    // Toggle folder expand/collapse
    document.querySelectorAll('.folder-header').forEach(header => {
      header.addEventListener('click', () => {
        const folderIcon = header.querySelector('i');
        const fileList = header.nextElementSibling;
        
        if (folderIcon.classList.contains('fa-chevron-down')) {
          folderIcon.classList.replace('fa-chevron-down', 'fa-chevron-right');
          fileList.style.display = 'none';
        } else {
          folderIcon.classList.replace('fa-chevron-right', 'fa-chevron-down');
          fileList.style.display = 'block';
        }
      });
    });
  });