<script setup lang="ts">
import { ref } from 'vue'
import { FolderUp, CheckCircle, ChevronRight } from 'lucide-vue-next'

const emit = defineEmits(['folder-selected'])

const selectedFolder = ref<string | null>(null)
const isSelecting = ref(false)

async function pickFolder() {
  if (isSelecting.value) return
  isSelecting.value = true
  // @ts-ignore - Exposed via preload
  const folder = await window.api.selectFolder()
  if (folder) {
    selectedFolder.value = folder
  }
  isSelecting.value = false
}

function continueSetup() {
  if (selectedFolder.value) {
    emit('folder-selected', selectedFolder.value)
  }
}
</script>

<template>
  <div class="onboarding-container">
    <div class="onboarding-card animate-fade-in">
      <div class="icon-wrapper glass animate-fade-in delay-100">
        <FolderUp :size="32" class="icon" />
      </div>
      <h1 class="title animate-fade-in delay-200">Welcome to Snippets</h1>
      <p class="subtitle animate-fade-in delay-200">
        A premium Markdown workspace for your code snippets and notes.
      </p>

      <div class="folder-selection animate-fade-in delay-300">
        <button class="select-btn" @click="pickFolder" :class="{ 'has-selection': selectedFolder }">
          <span v-if="!selectedFolder">Select Storage Folder</span>
          <span v-else class="selected-text">
            <CheckCircle :size="18" class="check-icon" />
            {{ selectedFolder }}
          </span>
        </button>

        <button 
          v-if="selectedFolder" 
          class="continue-btn animate-fade-in" 
          @click="continueSetup"
        >
          Get Started
          <ChevronRight :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% -20%, rgba(255,255,255,0.05), transparent 60%);
}

.onboarding-card {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem;
  border-radius: var(--radius);
}

.icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

.icon {
  color: var(--primary);
}

.title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.subtitle {
  color: var(--muted-foreground);
  font-size: 1.1rem;
  line-height: 1.5;
  margin-bottom: 3rem;
}

.folder-selection {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.select-btn {
  width: 100%;
  padding: 1.25rem;
  background: var(--muted);
  color: var(--foreground);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.select-btn:hover {
  background: rgba(39, 39, 42, 0.8);
  border-color: var(--muted-foreground);
}

.select-btn.has-selection {
  border-style: solid;
  border-color: var(--primary);
  background: rgba(250, 250, 250, 0.05);
}

.selected-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--primary);
  word-break: break-all;
}

.continue-btn {
  width: 100%;
  padding: 1.25rem;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(250,250,250,0.1);
  transition: all 0.2s ease;
}

.continue-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(250,250,250,0.15);
}
</style>
