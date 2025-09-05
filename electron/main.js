const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const express = require('express');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let server;

function startLocalServer() {
  const expressApp = express();
  const PORT = 3001;
  
  // Serve static files from the out directory
  expressApp.use(express.static(path.join(__dirname, '../out')));
  
  // Handle all routes by serving index.html
  expressApp.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../out/index.html'));
  });
  
  // Start the server
  server = expressApp.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // For production, start local server and load from it
    startLocalServer();
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3001');
    }, 1000); // Wait for server to start
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  const template = [
    {
      label: 'Sales Funnel',
      submenu: [
        {
          label: 'About Sales Funnel',
          click: () => {
            // Show about dialog
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event listeners
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) {
      server.close();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});