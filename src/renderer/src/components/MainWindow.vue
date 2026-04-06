<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Trash2, FileText, PanelLeft, X } from 'lucide-vue-next'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { SlashCommand, renderItems, getSuggestionItems } from '../extensions/slashCommand/slashCommand'
import 'tippy.js/dist/tippy.css'
const props = defineProps<{ folderPath: string }>()

type Note = { filename: string; content: string; updatedAt: number }

const notes = ref<Note[]>([])
const activeNote = ref<Note | null>(null)
const titleInput = ref<HTMLInputElement | null>(null)
const openTabs = ref<Note[]>([])
const showSidebar = ref(true)

async function fetchNotes() {
  // @ts-ignore
  notes.value = await window.api.getNotes(props.folderPath)
  if (openTabs.value.length > 0) {
    openTabs.value = openTabs.value.map(t => notes.value.find(n => n.filename === t.filename)).filter(Boolean) as Note[]
  }
  if (activeNote.value) {
    activeNote.value = notes.value.find(n => n.filename === activeNote.value?.filename) || null
  }
  if (notes.value.length > 0 && openTabs.value.length === 0) {
    activeNote.value = notes.value[0]
    openTabs.value.push(notes.value[0])
  }
}

onMounted(fetchNotes)

function generateUntitledName() {
  let name = 'Untitled'
  let counter = 1
  while (notes.value.some(n => n.filename === `${name}.md`) || openTabs.value.some(t => t.filename === `${name}.md`)) {
    name = `Untitled_${counter}`
    counter++
  }
  return name
}

async function createNote() {
  flushSave()
  const baseName = generateUntitledName()
  const filename = `${baseName}.md`
  const content = `# `
  
  const newNote: Note = {
    filename: filename,
    content: content,
    updatedAt: Date.now()
  }
  
  openTabs.value.push(newNote)
  activeNote.value = newNote
  
  setTimeout(() => {
    if (titleInput.value) titleInput.value.focus()
  }, 50)
}

async function saveActiveNote() {
  if (!activeNote.value) return
  
  const currentTitle = getTitle(activeNote.value.content, activeNote.value.filename)
  let baseName = ''
  
  if (currentTitle) {
    baseName = currentTitle.replace(/[\/\\?%*:|"<>]/g, '').trim()
  }
  
  let newFilename = ''
  if (baseName) {
    newFilename = baseName + '.md'
  } else {
    if (activeNote.value.filename.startsWith('Untitled')) {
      newFilename = activeNote.value.filename
    } else {
      newFilename = generateUntitledName() + '.md'
    }
  }
  
  try {
    const oldFilename = activeNote.value.filename
    const isNewUnsaved = !notes.value.some(n => n.filename === oldFilename)

    if (oldFilename !== newFilename) {
      if (notes.value.some(n => n.filename === newFilename && n.filename !== oldFilename)) {
          newFilename = newFilename.replace('.md', `_${Math.floor(Math.random() * 1000)}.md`)
      }
      
      if (!isNewUnsaved) {
        // @ts-ignore
        if (window.api.renameNote) {
          // @ts-ignore
          await window.api.renameNote(props.folderPath, oldFilename, newFilename)
        } else {
          // @ts-ignore
          await window.api.saveNote(props.folderPath, newFilename, activeNote.value.content)
          // @ts-ignore
          await window.api.deleteNote(props.folderPath, oldFilename)
        }
      }
      activeNote.value.filename = newFilename
    }

    // @ts-ignore
    await window.api.saveNote(props.folderPath, newFilename, activeNote.value.content)
    
    if (!isNewUnsaved) {
      const targetNote = notes.value.find(n => n.filename === oldFilename || n.filename === newFilename)
      if (targetNote) {
        targetNote.filename = newFilename
        targetNote.content = activeNote.value.content
        targetNote.updatedAt = Date.now()
      } else {
        await fetchNotes()
      }
    } else {
      await fetchNotes()
    }
  } catch (error: any) {
    console.error("Save/Rename failed:", error)
    alert("Could not rename or save the file! Error: " + error?.message)
  }
}

let saveTimeout: any
function triggerSave() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveTimeout = undefined
    saveActiveNote()
  }, 600)
}

function flushSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = undefined
    saveActiveNote()
  }
}

function selectTab(tab: Note) {
  flushSave()
  activeNote.value = tab
}

async function deleteNote(note: Note, e: Event) {
  e.stopPropagation()
  // @ts-ignore
  await window.api.deleteNote(props.folderPath, note.filename)
  
  const tabIdx = openTabs.value.findIndex(t => t.filename === note.filename)
  if (tabIdx !== -1) {
    openTabs.value.splice(tabIdx, 1)
    if (activeNote.value?.filename === note.filename) {
      if (openTabs.value.length > 0) {
        activeNote.value = openTabs.value[Math.min(tabIdx, openTabs.value.length - 1)]
      } else {
        activeNote.value = null
      }
    }
  }
  await fetchNotes()
}

const documentTitle = computed({
  get() {
    if (!activeNote.value) return ''
    const lines = activeNote.value.content.split('\n')
    if (lines[0] !== undefined && lines[0].startsWith('# ')) {
      const parsed = lines[0].substring(2)
      return parsed
    }
    return ''
  },
  set(newVal) {
    if (!activeNote.value) return
    const lines = activeNote.value.content.split('\n')
    if (lines[0] !== undefined && lines[0].startsWith('# ')) {
      lines[0] = '# ' + newVal
    } else {
      lines.unshift('# ' + newVal)
    }
    activeNote.value.content = lines.join('\n')
  }
})

const documentBody = computed({
  get() {
    if (!activeNote.value) return ''
    const lines = activeNote.value.content.split('\n')
    if (lines[0] && lines[0].startsWith('# ')) {
      return lines.slice(1).join('\n').replace(/^\n+/, '') 
    }
    return activeNote.value.content
  },
  set(newVal) {
    if (!activeNote.value) return
    const lines = activeNote.value.content.split('\n')
    let title = ''
    if (lines[0] && lines[0].startsWith('# ')) {
      title = lines[0]
    } else {
      title = '# ' + (documentTitle.value || 'Untitled')
    }
    activeNote.value.content = title + '\n\n' + newVal
  }
})

const editor = useEditor({
  content: documentBody.value,
  extensions: [
    StarterKit,
    Markdown,
    Placeholder.configure({ placeholder: 'Start typing your markdown...' }),
    TaskList,
    TaskItem.configure({ nested: true }),
    SlashCommand.configure({
      suggestion: {
        items: getSuggestionItems,
        render: renderItems,
      },
    }),
  ],
  onUpdate: () => {
    if (editor.value) {
      documentBody.value = (editor.value.storage as any).markdown.getMarkdown()
      triggerSave()
    }
  }
})

watch(() => activeNote.value?.filename, () => {
  if (editor.value) {
    editor.value.commands.setContent(documentBody.value)
  }
})

function selectSidebarNote(note: Note) {
  flushSave()
  const existingTabIdx = openTabs.value.findIndex(t => t.filename === note.filename)
  if (existingTabIdx !== -1) {
    activeNote.value = note
  } else {
    if (activeNote.value) {
      const activeIdx = openTabs.value.findIndex(t => t.filename === activeNote.value?.filename)
      if (activeIdx !== -1) {
        openTabs.value.splice(activeIdx, 1, note)
      } else {
        openTabs.value.push(note)
      }
    } else {
      openTabs.value.push(note)
    }
    activeNote.value = note
  }
}

function closeTab(tab: Note, e: Event) {
  e.stopPropagation()
  if (activeNote.value?.filename === tab.filename) {
    flushSave()
  }
  const idx = openTabs.value.findIndex(t => t.filename === tab.filename)
  if (idx !== -1) {
    openTabs.value.splice(idx, 1)
    if (activeNote.value?.filename === tab.filename) {
      if (openTabs.value.length > 0) {
        const newIdx = Math.min(idx, openTabs.value.length - 1)
        activeNote.value = openTabs.value[newIdx]
      } else {
        activeNote.value = null
      }
    }
  }
}

function formatDate(ms: number) {
  const d = new Date(ms)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
}

function getTitle(content: string, filename: string) {
  const firstLine = content.split('\n')[0]
  if (firstLine !== undefined && firstLine.startsWith('# ')) {
    const raw = firstLine.substring(2).trim()
    if (raw) return raw.substring(0, 50)
    else return ''
  }
  return filename.replace('.md', '')
}

function getSidebarTitle(content: string, filename: string) {
  const t = getTitle(content, filename)
  return t || 'Untitled note'
}
</script>

<template>
  <div class="window-wrapper animate-fade-in">
    <!-- Top Bar -->
    <nav class="topbar">
      <!-- Left sidebar toggle and traffic lights section -->
      <div class="topbar-sidebar-section" :class="{ 'is-open': showSidebar }">
        <!-- Traffic lights spacer -->
        <div class="mac-controls-spacer"></div>
        <div class="topbar-spacer"></div>
        <!-- Left sidebar toggle -->
        <button class="topbar-btn" @click="showSidebar = !showSidebar" title="Toggle Sidebar">
          <PanelLeft :size="16" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs-scroll-area">
        <div 
          v-for="tab in openTabs"
          :key="tab.filename"
          class="tab"
          :class="{ active: activeNote?.filename === tab.filename }"
          @click="selectTab(tab)"
        >
          <span class="tab-title">{{ getSidebarTitle(tab.content, tab.filename) }}</span>
          <button class="close-tab-btn" @click="closeTab(tab, $event)">
            <X :size="14" />
          </button>
        </div>
        <button class="new-tab-btn" @click="createNote" title="New Tab">
          <Plus :size="15" />
        </button>
      </div>

      <!-- Right spacer (no icons) -->
      <div class="topbar-right-spacer"></div>
    </nav>

    <!-- App Body -->
    <div class="app-body">
      <!-- Sidebar -->
      <aside class="sidebar glass" :class="{ 'is-closed': !showSidebar }">
        <div class="sidebar-content">
          <div class="sidebar-header">
            <h2 class="app-title">Snippets</h2>
            <button class="icon-btn" @click="createNote" title="Create Note">
              <Plus :size="18" />
            </button>
          </div>
        
        <div class="notes-list">
          <div 
            v-for="note in notes" 
            :key="note.filename" 
            class="note-item"
            :class="{ active: activeNote?.filename === note.filename }"
            @click="selectSidebarNote(note)"
          >
            <div class="note-info">
              <span class="note-title">{{ getSidebarTitle(note.content, note.filename) }}</span>
              <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
            </div>
            <button class="delete-btn" @click="deleteNote(note, $event)" title="Delete Note">
              <Trash2 :size="14" />
            </button>
          </div>
          
          <div v-if="notes.length === 0" class="empty-list">
            <FileText :size="32" class="empty-icon" />
            <p>No notes yet</p>
          </div>
        </div>
        </div>
      </aside>

      <!-- Main Editor Area -->
      <main class="editor-area">
        <div v-if="activeNote" class="editor-content">
          <input 
            ref="titleInput"
            v-model="documentTitle" 
            @input="triggerSave"
            class="title-input animate-fade-in"
            placeholder="Untitled note"
            spellcheck="false"
          />
          <editor-content :editor="editor" class="body-editor animate-fade-in delay-100" />
      </div>
      
      <div v-else class="empty-state">
        <p>Select or create a note to begin.</p>
      </div>
    </main>
    </div>
  </div>
</template>

<style scoped>
.window-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--background);
}

.topbar {
  height: 38px;
  display: flex;
  align-items: flex-end; /* Align tabs to bottom */
  background: rgba(0, 0, 0, 0.25);
  box-shadow: inset 0 -1px 0 var(--border);
  -webkit-app-region: drag;
}

.topbar-sidebar-section {
  display: flex;
  align-items: center;
  height: 100%;
  width: 114px; /* fits traffic lights + button margins exactly when closed */
  flex-shrink: 0;
  transition: width 0.2s;
  box-sizing: border-box;
  border-right: 1px solid var(--border);
  -webkit-app-region: drag;
}

.topbar-sidebar-section.is-open {
  width: 280px;
}

.mac-controls-spacer {
  width: 72px;
  height: 100%;
  flex-shrink: 0;
}

.topbar-spacer {
  flex: 1;
}

.topbar-btn {
  -webkit-app-region: no-drag;
  padding: 0.35rem;
  background: transparent;
  border: none;
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  border-radius: var(--radius);
  cursor: pointer;
  margin-right: 6px;
  margin-left: 8px;
  margin-top: 1px;
  transition: all 0.2s;
}

.topbar-btn:hover {
  background: var(--muted);
  color: var(--foreground);
}

.tabs-scroll-area {
  display: flex;
  flex: 1;
  align-items: flex-end;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-app-region: drag;
  min-width: 0;
}

.tabs-scroll-area::-webkit-scrollbar {
  display: none;
}

.tab {
  -webkit-app-region: no-drag;
  height: 38px;
  padding: 0 8px 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0;
  cursor: pointer;
  color: var(--muted-foreground);
  font-size: 0.85rem;
  background: transparent;
  transition: background 0.15s, color 0.15s;
  border: none;
  border-right: 1px solid var(--border);
  max-width: 240px;
  min-width: 100px;
  flex: 1 1 0; /* Flex sizing like Chrome */
  position: relative;
  z-index: 1;
}

.new-tab-btn {
  -webkit-app-region: no-drag;
  background: transparent;
  border: none;
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  width: 38px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.new-tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--foreground);
}

.tab:hover {
  background: rgba(255, 255, 255, 0.04);
}

.tab.active {
  background: var(--background);
  color: var(--foreground);
  border-right: 1px solid var(--border);
  z-index: 2;
}

.tab-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-tab-btn {
  background: transparent;
  border: none;
  padding: 2px;
  border-radius: 4px;
  color: inherit;
  display: flex;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}

.tab:hover .close-tab-btn, .tab.active .close-tab-btn {
  opacity: 1;
}

.close-tab-btn:hover {
  background: rgba(255,255,255,0.1);
  color: var(--destructive);
}

.topbar-right-spacer {
  width: 20px;
}

.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  border: none;
  border-right: 1px solid var(--border);
  background: rgba(9, 9, 11, 0.4);
  transition: width 0.2s ease, opacity 0.2s ease;
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar.is-closed {
  width: 0px;
  border-right-width: 0;
  opacity: 0;
  pointer-events: none;
}

.sidebar-content {
  width: 280px; /* locks content size to prevent reflow wrapping during animation */
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  height: 60px;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
}

.app-title {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.icon-btn {
  background: transparent;
  color: var(--muted-foreground);
  padding: 0.4rem;
  border-radius: var(--radius);
  display: flex;
}

.icon-btn:hover {
  background: var(--muted);
  color: var(--foreground);
}

.notes-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.note-item {
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  margin-bottom: 2px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.note-item:hover {
  background: var(--muted);
}

.note-item.active {
  background: var(--accent);
  border-color: var(--border);
}

.note-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow: hidden;
}

.note-title {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-date {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.delete-btn {
  background: transparent;
  color: var(--muted-foreground);
  opacity: 0;
  padding: 0.4rem;
  border-radius: var(--radius);
}

.note-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--destructive);
  background: rgba(127, 29, 29, 0.2);
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--muted-foreground);
  gap: 1rem;
}

.empty-icon {
  opacity: 0.5;
}

.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--background);
}


.editor-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.title-input {
  width: 100%;
  padding: 2rem 2rem 0.5rem 2rem;
  font-family: inherit;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--foreground);
  background: transparent;
  border: none;
  outline: none;
}

.title-input::placeholder {
  color: var(--muted-foreground);
  opacity: 0.5;
}

.body-editor {
  flex: 1;
  width: 100%;
  overflow-y: auto;
}

.body-editor :deep(.tiptap) {
  min-height: 100%;
  padding: 1rem 2rem 2rem 2rem;
  font-family: inherit;
  font-size: 1.05rem;
  line-height: 1.7;
  outline: none !important;
  color: var(--foreground);
}

.body-editor :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--muted-foreground);
  pointer-events: none;
  height: 0;
  opacity: 0.5;
}

.body-editor :deep(.tiptap h1), 
.body-editor :deep(.tiptap h2), 
.body-editor :deep(.tiptap h3) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.body-editor :deep(.tiptap p) {
  margin-top: 0;
  margin-bottom: 1rem;
}

.body-editor :deep(.tiptap ul),
.body-editor :deep(.tiptap ol) {
  padding-left: 1.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
}

.body-editor :deep(.tiptap li) {
  margin-bottom: 0.25rem;
}

.body-editor :deep(.tiptap li p) {
  margin-bottom: 0;
  margin-top: 0;
}

.body-editor :deep(.tiptap li > ul),
.body-editor :deep(.tiptap li > ol) {
  margin-bottom: 0;
  margin-top: 0.25rem;
}

.body-editor :deep(.tiptap ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
}

.body-editor :deep(.tiptap ul[data-type="taskList"] li[data-type="taskItem"]) {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.body-editor :deep(.tiptap ul[data-type="taskList"] li[data-type="taskItem"] > label) {
  flex-shrink: 0;
  user-select: none;
  margin-top: 0.2rem;
}

.body-editor :deep(.tiptap ul[data-type="taskList"] li[data-type="taskItem"] > div) {
  flex: 1;
  min-height: 1.5rem;
}

.body-editor :deep(.tiptap ul[data-type="taskList"] li[data-type="taskItem"][data-checked="true"] > div) {
  text-decoration: line-through;
  opacity: 0.5;
}

.body-editor :deep(.tiptap ul[data-type="taskList"] li[data-type="taskItem"] input[type="checkbox"]) {
  margin: 0;
  width: 1.15em;
  height: 1.15em;
  cursor: pointer;
}

.body-editor :deep(.tiptap code) {
  background: var(--muted);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}

.body-editor :deep(.tiptap pre) {
  background: var(--muted);
  padding: 1rem;
  border-radius: var(--radius);
  overflow-x: auto;
  margin-bottom: 1rem;
}

.body-editor :deep(.tiptap pre code) {
  background: transparent;
  padding: 0;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
  font-size: 1rem;
}

:global(.tippy-box[data-theme~='slash-command']) {
  background: transparent !important;
  color: inherit !important;
  border-radius: 0 !important;
  padding: 0 !important;
  box-shadow: none !important;
  border: none !important;
}

:global(.tippy-box[data-theme~='slash-command'] .tippy-content) {
  padding: 0 !important;
}
</style>
