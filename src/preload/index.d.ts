import { ElectronAPI } from '@electron-toolkit/preload'

interface AppAPI {
  platform: string
  getConfig: () => Promise<{ notesDir: string | null }>
  saveConfig: (config: { notesDir: string | null }) => Promise<void>
  selectFolder: () => Promise<string | null>
  getNotes: (folderPath: string) => Promise<Array<{ filename: string; content: string; updatedAt: number }>>
  saveNote: (folderPath: string, filename: string, content: string) => Promise<boolean>
  renameNote: (folderPath: string, oldFilename: string, newFilename: string) => Promise<boolean>
  deleteNote: (folderPath: string, filename: string) => Promise<boolean>
  selectImage: () => Promise<string | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
