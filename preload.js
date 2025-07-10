const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  launchWhatsApp: () => ipcRenderer.invoke('launch-whatsapp')
});
