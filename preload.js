const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('windowHeightUpdate', {
    setHeightOffset: (offset) => ipcRenderer.send('windowHeightUpdate', offset)
})