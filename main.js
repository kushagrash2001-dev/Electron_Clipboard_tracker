const { app, BrowserWindow, clipboard, ipcMain, globalShortcut, nativeImage } = require('electron');

let clipboardHistory = [];
let lastText = "";
let lastImage = "";
let win = null;

function createWindow() {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
    return;
  }

  win = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');

  win.on('closed', () => {
    win = null; // Allow new window creation after close
  });

  setInterval(() => {
    checkClipboard();
  }, 1000);
}

function checkClipboard() {
  if (!win) return;

  const text = clipboard.readText();
  if (text && text !== lastText) {
    lastText = text;
    clipboardHistory.unshift({ type: 'text', content: text });
    clipboardHistory = clipboardHistory.slice(0, 50);
    win.webContents.send('clipboard-update', clipboardHistory);
  }

  const image = clipboard.readImage();
  const imgData = image.toDataURL();

  if (imgData && imgData !== 'data:image/png;base64,' && imgData !== lastImage) {
    lastImage = imgData;
    clipboardHistory.unshift({ type: 'image', content: imgData });
    clipboardHistory = clipboardHistory.slice(0, 50);
    win.webContents.send('clipboard-update', clipboardHistory);
  }
}

app.whenReady().then(() => {
  createWindow();

  // Register global shortcut
globalShortcut.register('Control+Shift+V', () => {
  if (!win) {
    createWindow();
  } else if (win.isVisible()) {
    win.minimize();
  } else {
    win.show();
    win.focus();
  }
});

});
ipcMain.on('delete-item', (event, index) => {
  clipboardHistory.splice(index, 1);
  if (win) win.webContents.send('clipboard-update', clipboardHistory);
});

ipcMain.on('copy-to-clipboard', (event, data) => {
  if (data.type === 'text') {
    clipboard.writeText(data.content);
    lastText = data.content;
  } else if (data.type === 'image') {
    const image = nativeImage.createFromDataURL(data.content);
    clipboard.writeImage(image);
    lastImage = data.content;
  }
});

ipcMain.on('clear-history', () => {
  clipboardHistory = [];
  if (win) win.webContents.send('clipboard-update', clipboardHistory);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
