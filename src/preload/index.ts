import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getNotes: (folderPath: string) => ipcRenderer.invoke('get-notes', folderPath),
  saveNote: (folderPath: string, filename: string, content: string) => ipcRenderer.invoke('save-note', folderPath, filename, content),
  renameNote: (folderPath: string, oldFilename: string, newFilename: string) => ipcRenderer.invoke('rename-note', folderPath, oldFilename, newFilename),
  deleteNote: (folderPath: string, filename: string) => ipcRenderer.invoke('delete-note', folderPath, filename)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
