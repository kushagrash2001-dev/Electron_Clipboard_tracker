const { app, BrowserWindow, clipboard, ipcMain } = require('electron');

let clipboardHistory = [];
let lastText = "";

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');

  setInterval(() => {
    const text = clipboard.readText();
    if (text && text !== lastText) {
      lastText = text;
      clipboardHistory.unshift(text);
      clipboardHistory = clipboardHistory.slice(0, 50); // Keep last 50 items
      win.webContents.send('clipboard-update', clipboardHistory);
    }
  }, 1000);

  ipcMain.on('copy-to-clipboard', (event, text) => {
    clipboard.writeText(text);
    lastText = text; // Prevent duplicate entries
  });

  ipcMain.on('clear-history', () => {
    clipboardHistory = [];
    win.webContents.send('clipboard-update', clipboardHistory);
  });
}

app.whenReady().then(createWindow);
