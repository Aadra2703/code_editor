// Tab functionality
document.addEventListener('DOMContentLoaded', () => {
    // Allow tabs to be reordered (simplified drag and drop)
    let draggedTab = null;
    
    document.querySelectorAll('.tab').forEach(tab => {
      tab.setAttribute('draggable', true);
      
      tab.addEventListener('dragstart', (e) => {
        draggedTab = tab;
        e.dataTransfer.setData('text/plain', ''); // Required for Firefox
      });
      
      tab.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      
      tab.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedTab !== tab) {
          // Get the parent container and all tabs
          const tabsContainer = tab.parentElement;
          const tabs = Array.from(tabsContainer.children);
          
          // Get positions of both tabs
          const draggedPos = tabs.indexOf(draggedTab);
          const dropPos = tabs.indexOf(tab);
          
          // Reorder tabs
          if (draggedPos < dropPos) {
            tabsContainer.insertBefore(draggedTab, tab.nextElementSibling);
          } else {
            tabsContainer.insertBefore(draggedTab, tab);
          }
        }
      });
    });
  });