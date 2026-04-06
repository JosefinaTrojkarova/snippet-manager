<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { FolderOpen, CheckCircle, ChevronRight, Shield, Zap, FileText } from 'lucide-vue-next'

const emit = defineEmits(['folder-selected'])

const selectedFolder = ref<string | null>(null)
const isSelecting = ref(false)

const titleText = ref('')
const bodyLines = ref<string[]>([''])
const showSlashMenu = ref(false)
const slashHighlight = ref(0)
const cursorBlink = ref(true)
const cursorIn = ref<'title' | 'body'>('title')
const mockOpacity = ref(0)

const slashItems = ['Heading 1', 'Heading 2', 'Bullet List', 'Code Block']

const tids: ReturnType<typeof setTimeout>[] = []
let alive = true

function at(fn: () => void, ms: number) {
  const id = setTimeout(() => { if (alive) fn() }, ms)
  tids.push(id)
}

function runAnimation() {
  let t = 0

  titleText.value = ''
  bodyLines.value = ['']
  showSlashMenu.value = false
  cursorIn.value = 'title'

  // Type title
  const TITLE = 'Meeting Notes'
  for (let i = 1; i <= TITLE.length; i++) {
    const s = TITLE.slice(0, i)
    at(() => { titleText.value = s }, t + i * 55)
  }
  t += TITLE.length * 55 + 380

  at(() => { cursorIn.value = 'body' }, t)

  // Type body line 1
  const LINE1 = 'Organize thoughts and ideas.'
  for (let i = 1; i <= LINE1.length; i++) {
    const s = LINE1.slice(0, i)
    at(() => { bodyLines.value = [s] }, t + i * 38)
  }
  t += LINE1.length * 38 + 360

  // Type "/" to trigger slash menu
  at(() => { bodyLines.value = [...bodyLines.value, '/'] }, t)
  t += 200

  at(() => { showSlashMenu.value = true; slashHighlight.value = 0 }, t)
  t += 650
  at(() => { slashHighlight.value = 1 }, t)
  t += 400
  at(() => { slashHighlight.value = 2 }, t)
  t += 650

  // Select "Bullet List"
  at(() => {
    showSlashMenu.value = false
    bodyLines.value = [bodyLines.value[0], '']
  }, t)
  t += 80

  // Type bullet 1
  const B1 = '• Review project goals'
  for (let i = 1; i <= B1.length; i++) {
    const s = B1.slice(0, i)
    at(() => {
      const lines = [...bodyLines.value]
      lines[lines.length - 1] = s
      bodyLines.value = lines
    }, t + i * 40)
  }
  t += B1.length * 40 + 240

  at(() => { bodyLines.value = [...bodyLines.value, ''] }, t)
  t += 60

  // Type bullet 2
  const B2 = '• Plan next sprint'
  for (let i = 1; i <= B2.length; i++) {
    const s = B2.slice(0, i)
    at(() => {
      const lines = [...bodyLines.value]
      lines[lines.length - 1] = s
      bodyLines.value = lines
    }, t + i * 40)
  }
  t += B2.length * 40 + 1800

  // Fade out and loop
  at(() => { mockOpacity.value = 0 }, t)
  t += 550
  at(() => { mockOpacity.value = 1; runAnimation() }, t)
}

let blinkId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  blinkId = setInterval(() => { cursorBlink.value = !cursorBlink.value }, 530)
  at(() => { mockOpacity.value = 1 }, 150)
  at(() => runAnimation(), 900)
})

onUnmounted(() => {
  alive = false
  tids.forEach(clearTimeout)
  if (blinkId) clearInterval(blinkId)
})

async function pickFolder() {
  if (isSelecting.value) return
  isSelecting.value = true
  const folder = await window.api.selectFolder()
  if (folder) selectedFolder.value = folder
  isSelecting.value = false
}

function continueSetup() {
  if (selectedFolder.value) emit('folder-selected', selectedFolder.value)
}
</script>

<template>
  <div class="onboarding">

    <div class="preview-pane">
      <div class="editor-mock" :style="{ opacity: mockOpacity }">

        <div class="mock-topbar">
          <div class="mock-traffic">
            <span class="tl red"></span>
            <span class="tl yellow"></span>
            <span class="tl green"></span>
          </div>
          <span class="mock-tab">Meeting Notes</span>
        </div>

        <div class="mock-layout">
          <div class="mock-sidebar">
            <div class="mock-sidebar-item active">Meeting Notes</div>
            <div class="mock-sidebar-item">Weekly Goals</div>
            <div class="mock-sidebar-item">Ideas</div>
          </div>

          <div class="mock-editor" :style="{ position: 'relative' }">
            <div class="mock-title">
              {{ titleText }}<span
                class="caret"
                :class="{ hidden: cursorIn !== 'title' || !cursorBlink }"
              >|</span>
            </div>

            <div class="mock-body-text">
              <div v-for="(line, i) in bodyLines" :key="i" class="mock-line">
                {{ line }}<span
                  v-if="i === bodyLines.length - 1"
                  class="caret"
                  :class="{ hidden: cursorIn !== 'body' || !cursorBlink }"
                >|</span>
              </div>
            </div>

            <Transition name="slash">
              <div v-if="showSlashMenu" class="slash-dropdown">
                <div
                  v-for="(item, i) in slashItems"
                  :key="i"
                  class="slash-item"
                  :class="{ active: i === slashHighlight }"
                >{{ item }}</div>
              </div>
            </Transition>
          </div>
        </div>

      </div>
    </div>

    <div class="welcome-pane">
      <div class="welcome-content">

        <p class="eyebrow">Welcome to</p>
        <h1 class="wordmark">Snippets</h1>
        <p class="tagline">A clean, minimal, local note editor.</p>

        <ul class="features">
          <li class="feature">
            <Shield :size="14" class="ficon" />
            <span>Your notes never leave your machine</span>
          </li>
          <li class="feature">
            <Zap :size="14" class="ficon" />
            <span>Type <kbd>/</kbd> to format with slash commands</span>
          </li>
          <li class="feature">
            <FileText :size="14" class="ficon" />
            <span>Plain Markdown files — always portable</span>
          </li>
        </ul>

        <div class="cta">
          <p class="cta-label">Choose where to store your notes</p>

          <button
            class="folder-btn"
            :class="{ chosen: !!selectedFolder }"
            @click="pickFolder"
          >
            <template v-if="!selectedFolder">
              <FolderOpen :size="16" />
              <span>Select Folder</span>
            </template>
            <template v-else>
              <CheckCircle :size="16" class="check" />
              <span class="folder-path">{{ selectedFolder }}</span>
            </template>
          </button>

          <Transition name="rise">
            <button
              v-if="selectedFolder"
              class="go-btn"
              @click="continueSetup"
            >
              Get Started
              <ChevronRight :size="16" />
            </button>
          </Transition>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.onboarding {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: var(--background);
  overflow: hidden;
  -webkit-app-region: drag;
}

.preview-pane {
  flex: 0 0 58%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 2rem 2.5rem 2.5rem;
  background: radial-gradient(ellipse at 45% 50%, rgba(255,255,255,0.03) 0%, transparent 65%);
  animation: pane-in 0.7s cubic-bezier(0.22,1,0.36,1) both;
}

.welcome-pane {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 2.5rem 2.5rem 2.5rem 2rem;
  border-left: 1px solid var(--border);
}

.editor-mock {
  width: 100%;
  max-width: 460px;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--background);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.04),
    0 30px 80px rgba(0,0,0,0.9),
    0 8px 24px rgba(0,0,0,0.5);
  transition: opacity 0.55s ease;
}

.mock-topbar {
  height: 36px;
  background: rgba(0,0,0,0.35);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 10px;
  flex-shrink: 0;
}

.mock-traffic {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.tl {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.tl.red    { background: #ff5f57; }
.tl.yellow { background: #febc2e; }
.tl.green  { background: #28c840; }

.mock-tab {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  font-weight: 500;
}

.mock-layout {
  display: flex;
  height: 260px;
}

.mock-sidebar {
  width: 130px;
  border-right: 1px solid var(--border);
  background: rgba(0,0,0,0.2);
  padding: 0.5rem 0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.mock-sidebar-item {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mock-sidebar-item.active {
  background: rgba(255,255,255,0.07);
  color: var(--foreground);
}

.mock-editor {
  flex: 1;
  padding: 1.25rem 1.25rem 1rem;
  overflow: hidden;
}

.mock-title {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--foreground);
  line-height: 1.2;
  min-height: 1.7rem;
  margin-bottom: 0.6rem;
}

.mock-body-text {
  font-size: 0.88rem;
  color: var(--muted-foreground);
  line-height: 1.7;
}

.mock-line {
  min-height: 1.4rem;
}

.caret {
  display: inline-block;
  color: var(--foreground);
  font-weight: 200;
  margin-left: 1px;
  transition: opacity 0.08s;
}

.caret.hidden {
  opacity: 0;
}

/* Slash command dropdown */
.slash-dropdown {
  position: absolute;
  left: 1.25rem;
  top: 6.4rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 6px 20px rgba(0,0,0,0.7);
  padding: 0.2rem;
  min-width: 150px;
  z-index: 10;
}

.slash-item {
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  color: var(--muted-foreground);
  border-radius: calc(var(--radius) - 2px);
}

.slash-item.active {
  background: var(--muted);
  color: var(--foreground);
}

.slash-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.slash-leave-active { transition: opacity 0.1s ease; }
.slash-enter-from   { opacity: 0; transform: translateY(-6px); }
.slash-leave-to     { opacity: 0; }

.welcome-content {
  width: 100%;
  max-width: 300px;
}

.eyebrow {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted-foreground);
  margin-bottom: 0.35rem;
  animation: rise 0.6s 0.15s cubic-bezier(0.22,1,0.36,1) both;
}

.wordmark {
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 0.6rem;
  animation: rise 0.6s 0.25s cubic-bezier(0.22,1,0.36,1) both;
}

.tagline {
  font-size: 0.95rem;
  color: var(--muted-foreground);
  margin-bottom: 2rem;
  animation: rise 0.6s 0.35s cubic-bezier(0.22,1,0.36,1) both;
}

.features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2.25rem;
  animation: rise 0.6s 0.45s cubic-bezier(0.22,1,0.36,1) both;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.ficon {
  flex-shrink: 0;
  color: var(--foreground);
  opacity: 0.6;
}

.feature kbd {
  font-family: monospace;
  font-size: 0.8em;
  background: var(--muted);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 3px;
  padding: 0.05rem 0.35rem;
  color: var(--foreground);
}

.cta {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  animation: rise 0.6s 0.55s cubic-bezier(0.22,1,0.36,1) both;
}

.cta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted-foreground);
}

.folder-btn {
  -webkit-app-region: no-drag;
  width: 100%;
  padding: 0.8rem 1rem;
  background: var(--muted);
  border: 1px dashed rgba(255,255,255,0.15);
  color: var(--muted-foreground);
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: var(--radius);
  transition: all 0.2s;
}

.folder-btn:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.25);
  color: var(--foreground);
}

.folder-btn.chosen {
  border-style: solid;
  border-color: rgba(255,255,255,0.2);
  color: var(--foreground);
  background: rgba(255,255,255,0.05);
}

.check {
  flex-shrink: 0;
  opacity: 0.8;
}

.folder-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.go-btn {
  -webkit-app-region: no-drag;
  width: 100%;
  padding: 0.8rem 1rem;
  background: var(--foreground);
  color: var(--background);
  border: none;
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: opacity 0.2s, transform 0.2s;
}

.go-btn:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.rise-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.rise-enter-from   { opacity: 0; transform: translateY(8px); }

@keyframes rise {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pane-in {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
</style>
