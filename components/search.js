// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('Search script loaded, initializing search components...');
    
    // DOM elements
    const searchIcon = document.querySelector('.activity-icon[data-panel="search"]');
    const sidePanel = document.querySelector('.side-panel');
    
    // Search panel HTML template
    const searchPanelHTML = `
      <div class="search-container">
        <div class="search-input-container">
          <input type="text" class="search-input" placeholder="Search in files...">
          <button class="search-button">
            <i class="fas fa-search"></i>
          </button>
        </div>
        <div class="search-options">
          <label><input type="checkbox" class="search-case-sensitive"> Case sensitive</label>
          <label><input type="checkbox" class="search-whole-word"> Whole word</label>
          <label><input type="checkbox" class="search-regex"> Use regex</label>
        </div>
        <div class="search-results">
          <div class="search-results-header">SEARCH RESULTS</div>
          <div class="search-results-list"></div>
        </div>
      </div>
    `;
    
    // Editor search box HTML template
    const editorSearchBoxHTML = `
      <div class="editor-search-box" style="display: none;">
        <input type="text" class="editor-search-input" placeholder="Find">
        <span class="editor-search-count"></span>
        <div class="editor-search-actions">
          <button class="editor-search-prev"><i class="fas fa-chevron-up"></i></button>
          <button class="editor-search-next"><i class="fas fa-chevron-down"></i></button>
          <button class="editor-search-close"><i class="fas fa-times"></i></button>
        </div>
      </div>
    `;
    
    // Add editor search box to main content area
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      const searchBoxContainer = document.createElement('div');
      searchBoxContainer.innerHTML = editorSearchBoxHTML;
      mainContent.appendChild(searchBoxContainer.firstElementChild);
    }
    
    // Handle search panel activation
    if (searchIcon) {
      searchIcon.addEventListener('click', () => {
        console.log('Search panel activated');
        
        // Update panel header
        const panelHeader = document.querySelector('.panel-header h3');
        if (panelHeader) {
          panelHeader.textContent = 'SEARCH';
        }
        
        // Replace file explorer with search panel if not already done
        const fileExplorer = document.querySelector('.file-explorer');
        if (fileExplorer && !document.querySelector('.search-container')) {
          fileExplorer.style.display = 'none';
          
          // Create search panel
          const searchPanel = document.createElement('div');
          searchPanel.innerHTML = searchPanelHTML;
          sidePanel.appendChild(searchPanel.firstElementChild);
          
          // Initialize search panel functionality
          initializeSearchPanel();
        } else if (document.querySelector('.search-container')) {
          // Show search panel, hide file explorer
          document.querySelector('.search-container').style.display = 'block';
          if (fileExplorer) {
            fileExplorer.style.display = 'none';
          }
        }
      });
    }
    
    // Handle file explorer activation
    document.querySelector('.activity-icon[data-panel="explorer"]').addEventListener('click', () => {
      // Show file explorer, hide search panel
      const fileExplorer = document.querySelector('.file-explorer');
      const searchContainer = document.querySelector('.search-container');
      
      if (fileExplorer) {
        fileExplorer.style.display = 'block';
      }
      
      if (searchContainer) {
        searchContainer.style.display = 'none';
      }
    });
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Initialize search panel functionality
    function initializeSearchPanel() {
      const searchInput = document.querySelector('.search-input');
      const searchButton = document.querySelector('.search-button');
      const searchResults = document.querySelector('.search-results-list');
      
      if (searchInput && searchButton) {
        // Search button click event
        searchButton.addEventListener('click', () => {
          performSearch(searchInput.value);
        });
        
        // Enter key in search input
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            performSearch(searchInput.value);
          }
        });
      }
    }
    
    // Perform global search across files
    function performSearch(searchTerm) {
      console.log(`Performing global search for: "${searchTerm}"`);
      
      const searchResults = document.querySelector('.search-results-list');
      if (!searchResults) return;
      
      // Clear previous results
      searchResults.innerHTML = '';
      
      if (!searchTerm.trim()) {
        searchResults.innerHTML = '<div class="no-results">Please enter a search term</div>';
        return;
      }
      
      // Get search options
      const caseSensitive = document.querySelector('.search-case-sensitive')?.checked || false;
      const wholeWord = document.querySelector('.search-whole-word')?.checked || false;
      const isRegex = document.querySelector('.search-regex')?.checked || false;
      
      let count = 0;
      const resultsHTML = [];
      
      // Search in cached files (from renderer.js)
      try {
        // Try to access files from window.files or access directly if available
        let files = window.files;
        
        // If not available globally, try to use the files in renderer.js
        if (!files && window.editorInstance) {
          // This is a simplified approach - in a real app, you'd have better data sharing
          files = {};
          // Try to get cached files from renderer
          document.querySelectorAll('.tab span').forEach(span => {
            const fileName = span.textContent;
            if (fileName && window.testOpenFile && window.testOpenFile(fileName)) {
              files[fileName] = window.editorInstance.getValue();
              // Restore the current file
              if (window.currentFile) {
                window.testOpenFile(window.currentFile);
              }
            }
          });
        }
        
        if (!files || Object.keys(files).length === 0) {
          // Fallback to simulated files
          console.warn('No files available - using simulated files for search demo');
          files = {
            'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Code Editor</title>\n</head>\n<body>\n  <div id="editor"></div>\n</body>\n</html>',
            'renderer.js': '// Type your code here\nconsole.log("Hello World!");\n',
            'main.js': 'const { app, BrowserWindow } = require(\'electron\')\n\nfunction createWindow() {\n  const win = new BrowserWindow({\n    width: 1200,\n    height: 800\n  })\n\n  win.loadFile(\'index.html\')\n}\n\napp.whenReady().then(createWindow)'
          };
        }
        
        // Process each file
        Object.entries(files).forEach(([fileName, content]) => {
          let fileMatches = 0;
          const fileResults = [];
          
          // Convert content to string if not already
          const contentStr = typeof content === 'string' ? content : String(content);
          const lines = contentStr.split('\n');
          
          let regex;
          try {
            if (isRegex) {
              regex = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
            } else {
              let pattern = searchTerm;
              // Escape regex special characters if not using regex mode
              if (!isRegex) {
                pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              }
              // Add word boundaries if whole word is checked
              if (wholeWord) {
                pattern = `\\b${pattern}\\b`;
              }
              regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
            }
          } catch (error) {
            console.error('Invalid regex pattern:', error);
            searchResults.innerHTML = `<div class="error-result">Error: ${error.message}</div>`;
            return;
          }
          
          // Search in each line
          lines.forEach((line, lineIndex) => {
            const matches = [...line.matchAll(regex)];
            if (matches.length > 0) {
              fileMatches += matches.length;
              
              // Get context around the match
              const trimmedLine = line.length > 100 ? 
                line.substring(0, 100) + '...' : line;
              
              fileResults.push(`
                <div class="search-result-line" data-file="${fileName}" data-line="${lineIndex + 1}">
                  <span class="line-number">${lineIndex + 1}:</span>
                  <span class="line-content">${escapeHTML(trimmedLine)}</span>
                </div>
              `);
            }
          });
          
          if (fileMatches > 0) {
            count += fileMatches;
            resultsHTML.push(`
              <div class="search-result-file">
                <div class="search-result-file-header">
                  <i class="fas fa-file-code"></i>
                  <span>${fileName}</span>
                  <span class="match-count">(${fileMatches} matches)</span>
                </div>
                <div class="search-result-lines">
                  ${fileResults.join('')}
                </div>
              </div>
            `);
          }
        });
        
        // Display results
        if (count > 0) {
          searchResults.innerHTML = `
            <div class="search-summary">${count} matches found</div>
            ${resultsHTML.join('')}
          `;
          
          // Add click event to result lines
          document.querySelectorAll('.search-result-line').forEach(line => {
            line.addEventListener('click', () => {
              const fileName = line.getAttribute('data-file');
              const lineNum = parseInt(line.getAttribute('data-line'), 10);
              openFileAndGoToLine(fileName, lineNum);
            });
          });
        } else {
          searchResults.innerHTML = `<div class="no-results">No matches found for "${searchTerm}"</div>`;
        }
      } catch (error) {
        console.error('Error performing search:', error);
        searchResults.innerHTML = `<div class="error-result">Error searching: ${error.message}</div>`;
      }
    }
    
    // Initialize keyboard shortcuts
    function initializeKeyboardShortcuts() {
      // Ctrl+F for in-file search
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault();
          toggleEditorSearch(true);
        } else if (e.key === 'Escape') {
          toggleEditorSearch(false);
        }
      });
      
      // Editor search box events
      const editorSearchBox = document.querySelector('.editor-search-box');
      const editorSearchInput = document.querySelector('.editor-search-input');
      const prevButton = document.querySelector('.editor-search-prev');
      const nextButton = document.querySelector('.editor-search-next');
      const closeButton = document.querySelector('.editor-search-close');
      
      if (editorSearchInput) {
        editorSearchInput.addEventListener('input', () => {
          searchInCurrentFile(editorSearchInput.value);
        });
        
        editorSearchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
              findPrevInEditor();
            } else {
              findNextInEditor();
            }
          }
        });
      }
      
      if (prevButton) {
        prevButton.addEventListener('click', findPrevInEditor);
      }
      
      if (nextButton) {
        nextButton.addEventListener('click', findNextInEditor);
      }
      
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          toggleEditorSearch(false);
        });
      }
    }
    
    // Toggle editor search box
    function toggleEditorSearch(show) {
      const searchBox = document.querySelector('.editor-search-box');
      if (!searchBox) return;
      
      if (show) {
        searchBox.style.display = 'flex';
        const searchInput = searchBox.querySelector('.editor-search-input');
        if (searchInput) {
          // Get selected text from editor if any
          let selectedText = '';
          if (window.editorInstance && window.editorInstance.getSelection) {
            selectedText = window.editorInstance.getSelection();
          }
          
          if (selectedText) {
            searchInput.value = selectedText;
            searchInCurrentFile(selectedText);
          }
          
          searchInput.focus();
          searchInput.select();
        }
      } else {
        searchBox.style.display = 'none';
        clearEditorSearchHighlights();
      }
    }
    
    // Search in current file
    function searchInCurrentFile(searchTerm) {
      console.log(`Searching in current file for: "${searchTerm}"`);
      
      // Clear previous search
      clearEditorSearchHighlights();
      
      if (!searchTerm.trim() || !window.editorInstance) {
        updateSearchCount(0, 0);
        return;
      }
      
      try {
        // For Monaco editor
        if (window.monaco && window.editorInstance.getModel) {
          const model = window.editorInstance.getModel();
          if (model) {
            // Find all matches
            const matches = model.findMatches(
              searchTerm, 
              true, // searchOnlyEditableRange
              false, // isRegex
              false, // matchCase
              null, // wordSeparators
              true // captureMatches
            );
            
            // Highlight matches
            const decorations = matches.map(match => ({
              range: match.range,
              options: {
                inlineClassName: 'editor-search-highlight',
                stickiness: 1
              }
            }));
            
            if (window.editorSearchDecorations) {
              window.editorInstance.deltaDecorations(window.editorSearchDecorations, []);
            }
            
            window.editorSearchMatches = matches;
            window.editorSearchCurrentMatch = 0;
            window.editorSearchDecorations = window.editorInstance.deltaDecorations([], decorations);
            
            // Update search count display
            updateSearchCount(
              window.editorSearchCurrentMatch + 1, 
              window.editorSearchMatches.length
            );
            
            // Navigate to first match
            if (matches.length > 0) {
              window.editorInstance.revealLineInCenter(matches[0].range.startLineNumber);
              window.editorInstance.setSelection(matches[0].range);
            }
          }
        } else {
          // Fallback for custom editor
          console.log('Custom editor search not implemented in this demo');
          updateSearchCount(0, 0);
        }
      } catch (error) {
        console.error('Error searching in file:', error);
        updateSearchCount(0, 0);
      }
    }
    
    // Update search count display
    function updateSearchCount(current, total) {
      const countEl = document.querySelector('.editor-search-count');
      if (countEl) {
        if (total > 0) {
          countEl.textContent = `${current} of ${total}`;
        } else {
          countEl.textContent = 'No results';
        }
      }
    }
    
    // Find next match in editor
    function findNextInEditor() {
      if (!window.editorSearchMatches || window.editorSearchMatches.length === 0) return;
      
      window.editorSearchCurrentMatch = (window.editorSearchCurrentMatch + 1) % window.editorSearchMatches.length;
      const match = window.editorSearchMatches[window.editorSearchCurrentMatch];
      
      window.editorInstance.revealLineInCenter(match.range.startLineNumber);
      window.editorInstance.setSelection(match.range);
      
      updateSearchCount(window.editorSearchCurrentMatch + 1, window.editorSearchMatches.length);
    }
    
    // Find previous match in editor
    function findPrevInEditor() {
      if (!window.editorSearchMatches || window.editorSearchMatches.length === 0) return;
      
      window.editorSearchCurrentMatch = (window.editorSearchCurrentMatch - 1 + window.editorSearchMatches.length) % window.editorSearchMatches.length;
      const match = window.editorSearchMatches[window.editorSearchCurrentMatch];
      
      window.editorInstance.revealLineInCenter(match.range.startLineNumber);
      window.editorInstance.setSelection(match.range);
      
      updateSearchCount(window.editorSearchCurrentMatch + 1, window.editorSearchMatches.length);
    }
    
    // Clear editor search highlights
    function clearEditorSearchHighlights() {
      if (window.editorInstance && window.editorSearchDecorations) {
        window.editorInstance.deltaDecorations(window.editorSearchDecorations, []);
        window.editorSearchDecorations = null;
        window.editorSearchMatches = [];
        window.editorSearchCurrentMatch = 0;
      }
    }
    
    // Open file and go to specific line
    function openFileAndGoToLine(fileName, lineNumber) {
      console.log(`Opening ${fileName} at line ${lineNumber}`);
      
      // Try to use the testOpenFile function from renderer.js
      if (window.testOpenFile) {
        window.testOpenFile(fileName);
        
        // Wait for editor to load the file then move to the line
        setTimeout(() => {
          if (window.editorInstance) {
            if (window.editorInstance.revealLineInCenter) {
              // Monaco editor
              window.editorInstance.revealLineInCenter(lineNumber);
              window.editorInstance.setPosition({
                lineNumber: lineNumber,
                column: 1
              });
              
              // Focus editor
              window.editorInstance.focus();
            } else {
              // Custom editor fallback - just inform user
              console.log(`Move to line ${lineNumber} not implemented for custom editor`);
            }
          }
        }, 100);
      }
    }
    
    // Helper function to escape HTML for safe display
    function escapeHTML(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  });