const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const accountWindows = {};
let launcherWindow;

// Use writable userData path for accounts.json
const userDataPath = app.getPath('userData');
const accountsFilePath = path.join(userDataPath, 'accounts.json');

function ensureAccountsFileExists() {
  if (!fs.existsSync(accountsFilePath)) {
    const defaultAccountsPath = path.join(__dirname, 'renderer', 'public', 'config', 'accounts.json');
    try {
      fs.copyFileSync(defaultAccountsPath, accountsFilePath);
      console.log('Copied default accounts.json to userData');
    } catch (err) {
      console.error('Failed to copy default accounts.json:', err);
    }
  }
}

function createAccountWindow(partition, accountName) {
  if (accountWindows[partition]) {
    accountWindows[partition].focus();
    return;
  }
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: accountName,
    webPreferences: {
      partition,
    }
  });

  win.loadURL('https://web.whatsapp.com', {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  accountWindows[partition] = win;

  win.on('closed', () => {
    delete accountWindows[partition];
  });
}

function createLauncherWindow() {
  ensureAccountsFileExists();

  launcherWindow = new BrowserWindow({
    width: 360,
    height: 600,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
    title: "WhatsApp Multi-Manager Launcher"
  });

  launcherWindow.loadFile(path.join(__dirname, 'renderer', 'build', 'index.html'));

  launcherWindow.on('closed', () => {
    launcherWindow = null;
  });
}

app.whenReady().then(createLauncherWindow);

ipcMain.on('open-account-window', (event, partition, name) => {
  createAccountWindow(partition, name);
});

// Provide the contents of accounts.json on request
ipcMain.handle('get-accounts-data', async () => {
  try {
    const content = fs.readFileSync(accountsFilePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading accounts.json:", err);
    return [];
  }
});

// Save updated accounts to accounts.json
ipcMain.on('save-accounts', (event, updatedAccounts) => {
  fs.writeFile(accountsFilePath, JSON.stringify(updatedAccounts, null, 2), 'utf-8', (err) => {
    if (err) {
      console.error("Failed to save accounts.json", err);
      event.sender.send('save-accounts-response', { success: false, error: err.message });
    } else {
      console.log("accounts.json saved successfully.");
      event.sender.send('save-accounts-response', { success: true });
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});