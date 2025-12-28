const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;
const SERVER_PORT = 3000;

// Start Node.js server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend server...');
    
    const serverScript = path.join(process.resourcesPath, 'backend', 'server.js');
    const nodePath = process.platform === 'win32' 
      ? path.join(process.resourcesPath, 'node', 'node.exe')
      : 'node';
    
    serverProcess = spawn(nodePath, [serverScript], {
      cwd: path.join(process.resourcesPath, 'backend'),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: SERVER_PORT
      }
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data.toString()}`);
      if (data.toString().includes('running on port')) {
        setTimeout(resolve, 1000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data.toString()}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Resolve after 3 seconds anyway
    setTimeout(resolve, 3000);
  });
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'STEEFE ERP',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load app with retry
  const loadApp = (retries = 0) => {
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}`)
      .catch(err => {
        if (retries < 10) {
          console.log(`Retrying connection (${retries + 1}/10)...`);
          setTimeout(() => loadApp(retries + 1), 1000);
        } else {
          console.error('Failed to connect to server');
          mainWindow.loadURL(`data:text/html,<h1>Server failed to start</h1><p>Please check the logs</p>`);
        }
      });
  };

  loadApp();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
