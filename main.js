const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

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