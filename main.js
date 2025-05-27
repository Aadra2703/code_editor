const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadFile('index.html')
  // Uncomment for dev tools
  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Handle directory structure request
ipcMain.on('request-directory-structure', (event) => {
  // Get the current app directory
  const appDirectory = path.dirname(app.getAppPath());
  console.log('Reading directory structure from:', appDirectory);
  
  // Read directory structure using our module
  const directoryReader = require('./components/directory-reader');
  const directoryStructure = directoryReader.readDirectory(appDirectory);
  
  // Send directory structure back to renderer
  event.sender.send('directory-structure', directoryStructure);
});

// Handle file open request
ipcMain.on('open-file', (event, fileInfo) => {
  console.log(`Main process received request to open: ${fileInfo.path}`);
  
  try {
    const content = fs.readFileSync(fileInfo.path, 'utf8');
    console.log(`Successfully read file: ${fileInfo.name}`);
    
    // Send file content back to renderer
    event.sender.send('file-content', {
      name: fileInfo.name,
      path: fileInfo.path,
      content: content
    });
  } catch (error) {
    console.error('Error reading file:', error);
    event.sender.send('file-content-error', {
      name: fileInfo.name,
      path: fileInfo.path,
      error: error.message
    });
  }
});

// Handle file save request
ipcMain.on('save-file', (event, fileData) => {
  console.log(`Main process received request to save: ${fileData.path}`);
  
  try {
    fs.writeFileSync(fileData.path, fileData.content, 'utf8');
    console.log(`Successfully saved file: ${fileData.path}`);
    
    // Send confirmation back to renderer
    event.sender.send('file-saved', {
      name: fileData.name,
      path: fileData.path,
      success: true
    });
  } catch (error) {
    console.error('Error saving file:', error);
    event.sender.send('file-saved', {
      name: fileData.name,
      path: fileData.path,
      success: false,
      error: error.message
    });
  }
});

// Handle new file creation
ipcMain.on('create-new-file', (event, { fileName }) => {
  try {
    const appDirectory = path.dirname(app.getAppPath());
    const filePath = path.join(appDirectory, fileName);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      event.sender.send('file-created', {
        success: false,
        error: 'File already exists'
      });
      return;
    }
    
    // Create empty file
    fs.writeFileSync(filePath, '', 'utf8');
    
    event.sender.send('file-created', {
      success: true,
      filePath: filePath
    });
  } catch (error) {
    console.error('Error creating file:', error);
    event.sender.send('file-created', {
      success: false,
      error: error.message
    });
  }
});

// Handle code execution
ipcMain.on('execute-code', (event, { filePath, code }) => {
  try {
    const extension = path.extname(filePath).toLowerCase();
    let process;
    
    switch (extension) {
      case '.js':
        process = spawn('node', [filePath]);
        break;
      case '.py':
        process = spawn('python', [filePath]);
        break;
      case '.java':
        // First compile, then run
        const className = path.basename(filePath, '.java');
        const compileProcess = spawn('javac', [filePath]);
        compileProcess.on('close', (code) => {
          if (code === 0) {
            process = spawn('java', ['-cp', path.dirname(filePath), className]);
            handleProcess(process, event);
          } else {
            event.sender.send('execution-output', {
              type: 'error',
              output: 'Compilation failed'
            });
          }
        });
        return;
      default:
        event.sender.send('execution-output', {
          type: 'error',
          output: `Unsupported file type: ${extension}`
        });
        return;
    }
    
    handleProcess(process, event);
    
  } catch (error) {
    console.error('Error executing code:', error);
    event.sender.send('execution-output', {
      type: 'error',
      output: error.message
    });
  }
});

function handleProcess(process, event) {
  process.stdout.on('data', (data) => {
    event.sender.send('execution-output', {
      type: 'output',
      output: data.toString()
    });
  });
  
  process.stderr.on('data', (data) => {
    event.sender.send('execution-output', {
      type: 'error',
      output: data.toString()
    });
  });
  
  process.on('close', (code) => {
    event.sender.send('execution-output', {
      type: 'info',
      output: `Process exited with code ${code}`
    });
  });
}

/* Prompt user before closing with unsaved changes */
// window.addEventListener('beforeunload', (e) => {
//   if (isDirty) {
//     e.preventDefault();
//     e.returnValue = '';
//     return '';
//   }
// });