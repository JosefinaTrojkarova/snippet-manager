import { app, shell, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    backgroundColor: '#09090b',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 12 },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  if (process.platform === 'darwin') {
    const template: any = [
      {
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' }
        ]
      }
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const CONFIG_FILE = join(app.getPath('userData'), 'config.json')

  ipcMain.handle('get-config', () => {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8')
      return JSON.parse(data)
    } catch {
      return { notesDir: null }
    }
  })

  ipcMain.handle('save-config', (_, config) => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  })

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('get-notes', async (_, folderPath: string) => {
    if (!folderPath || !fs.existsSync(folderPath)) return []
    const files = await fs.promises.readdir(folderPath)
    const notes: any[] = []

    for (const file of files) {
      if (file.endsWith('.md')) {
        const fullPath = join(folderPath, file)
        const stat = await fs.promises.stat(fullPath)
        const content = await fs.promises.readFile(fullPath, 'utf-8')
        notes.push({
          filename: file,
          content,
          updatedAt: stat.mtimeMs
        })
      }
    }
    return notes.sort((a, b) => b.updatedAt - a.updatedAt)
  })

  ipcMain.handle('save-note', async (_, folderPath: string, filename: string, content: string) => {
    const fullPath = join(folderPath, filename)
    await fs.promises.writeFile(fullPath, content, 'utf-8')
    return true
  })

  ipcMain.handle('rename-note', async (_, folderPath: string, oldFilename: string, newFilename: string) => {
    if (oldFilename === newFilename) return true;
    const oldPath = join(folderPath, oldFilename)
    const newPath = join(folderPath, newFilename)
    if (fs.existsSync(oldPath)) {
      await fs.promises.rename(oldPath, newPath)
    }
    return true
  })

  ipcMain.handle('delete-note', async (_, folderPath: string, filename: string) => {
    const fullPath = join(folderPath, filename)
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath)
    }
    return true
  })

  ipcMain.handle('select-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'] }]
    })
    if (result.canceled || !result.filePaths[0]) return null
    const filePath = result.filePaths[0]
    const data = await fs.promises.readFile(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'png'
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif'
    }
    const mime = mimeMap[ext] ?? 'image/png'
    return `data:${mime};base64,${data.toString('base64')}`
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
