const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;
let serverProcess;
let postgresProcess;
const SERVER_PORT = 3000;
const POSTGRES_PORT = 5432;

// Determine if running in portable mode
const isPortable = fs.existsSync(path.join(process.resourcesPath, 'postgres'));

// PostgreSQL paths
const getPostgresPath = () => {
  if (isPortable) {
    return {
      bin: path.join(process.resourcesPath, 'postgres', 'bin'),
      data: path.join(app.getPath('userData'), 'pgdata'),
      isPortable: true
    };
  }
  return { isPortable: false };
};

// Start PostgreSQL server
async function startPostgres() {
  const pgPaths = getPostgresPath();
  
  if (!pgPaths.isPortable) {
    console.log('Using system PostgreSQL installation');
    return true;
  }

  return new Promise((resolve, reject) => {
    console.log('Starting embedded PostgreSQL...');
    
    const pgBin = path.join(pgPaths.bin, 'pg_ctl.exe');
    const dataDir = pgPaths.data;
    
    // Initialize database if first run
    if (!fs.existsSync(dataDir)) {
      console.log('First run - initializing database...');
      fs.mkdirSync(dataDir, { recursive: true });
      
      const initdb = spawn(
        path.join(pgPaths.bin, 'initdb.exe'),
        ['-D', dataDir, '-U', 'postgres', '-A', 'trust', '--locale=C', '--encoding=UTF8'],
        { windowsHide: true }
      );
      
      initdb.on('close', (code) => {
        if (code === 0) {
          console.log('Database initialized successfully');
          startPostgresServer(pgBin, dataDir, resolve, reject);
        } else {
          reject(new Error('Database initialization failed'));
        }
      });
    } else {
      startPostgresServer(pgBin, dataDir, resolve, reject);
    }
  });
}

function startPostgresServer(pgBin, dataDir, resolve, reject) {
  postgresProcess = spawn(
    pgBin,
    ['start', '-D', dataDir, '-l', path.join(dataDir, 'logfile'), '-w'],
    { windowsHide: true }
  );

  postgresProcess.stdout.on('data', (data) => {
    console.log(`PostgreSQL: ${data}`);
  });

  postgresProcess.stderr.on('data', (data) => {
    console.error(`PostgreSQL Error: ${data}`);
  });

  // Give PostgreSQL time to start
  setTimeout(() => {
    console.log('PostgreSQL started');
    resolve(true);
  }, 3000);
}

// Initialize database schema
async function initializeDatabase() {
  const pgPaths = getPostgresPath();
  
  if (!pgPaths.isPortable) {
    return; // Skip if using system PostgreSQL
  }

  return new Promise((resolve) => {
    console.log('Checking database...');
    
    const psql = path.join(pgPaths.bin, 'psql.exe');
    const schemaFile = path.join(process.resourcesPath, 'database', 'schema.sql');
    
    // Create database if it doesn't exist
    const createDb = spawn(
      psql,
      ['-U', 'postgres', '-c', 'CREATE DATABASE steefe_erp;'],
      { windowsHide: true }
    );

    createDb.on('close', () => {
      // Apply schema (ignore errors if already exists)
      if (fs.existsSync(schemaFile)) {
        const applySchema = spawn(
          psql,
          ['-U', 'postgres', '-d', 'steefe_erp', '-f', schemaFile],
          { windowsHide: true }
        );

        applySchema.on('close', () => {
          console.log('Database ready');
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

// Start the Express server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Express server...');
    
    // In packaged app, server.js is in resources folder
    const serverPath = path.join(process.resourcesPath, 'server.js');
    
    // Set environment for portable PostgreSQL
    const env = { ...process.env };
    if (isPortable) {
      env.DB_HOST = 'localhost';
      env.DB_PORT = POSTGRES_PORT;
      env.DB_NAME = 'steefe_erp';
      env.DB_USER = 'postgres';
      env.DB_PASSWORD = '';
    }
    
    serverProcess = spawn('node', [serverPath], {
      env: env,
      cwd: process.resourcesPath
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.toString().includes('Server running on port')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Give server time to start
    setTimeout(resolve, 3000);
  });
}

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load test page first
    const testPage = path.join(__dirname, 'test.html');
    console.log('Loading test page from:', testPage);
    mainWindow.loadFile(testPage);
    // Open DevTools to see errors
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.reload();
      }
    }, 1000);
  });
}

// Show loading window
function createLoadingWindow() {
  const loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  loadingWindow.loadURL(`data:text/html;charset=utf-8,
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: white;
          }
          .container {
            text-align: center;
          }
          .spinner {
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h2 { margin: 10px 0; }
          p { color: #ccc; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h2>STEEFE ERP</h2>
          <p>Starting application...</p>
        </div>
      </body>
    </html>
  `);

  return loadingWindow;
}

// Initialize app
app.whenReady().then(async () => {
  const loadingWindow = createLoadingWindow();

  try {
    // Start PostgreSQL if portable
    if (isPortable) {
      await startPostgres();
      await initializeDatabase();
    }
    
    // Start the Express server
    await startServer();
    
    // Close loading and create main window
    loadingWindow.close();
    createWindow();
    
    console.log('Desktop app started successfully');
  } catch (error) {
    console.error('Failed to start app:', error);
    loadingWindow.close();
    app.quit();
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Stop PostgreSQL if portable
  if (postgresProcess) {
    const pgPaths = getPostgresPath();
    if (pgPaths.isPortable) {
      const pgCtl = path.join(pgPaths.bin, 'pg_ctl.exe');
      exec(`"${pgCtl}" stop -D "${pgPaths.data}" -m fast`);
    }
  }
  
  // Kill the server process
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up on quit
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (postgresProcess && isPortable) {
    const pgPaths = getPostgresPath();
    const pgCtl = path.join(pgPaths.bin, 'pg_ctl.exe');
    exec(`"${pgCtl}" stop -D "${pgPaths.data}" -m fast`);
  }
});

// Handle IPC messages
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.handle('is-portable', () => {
  return isPortable;
});
