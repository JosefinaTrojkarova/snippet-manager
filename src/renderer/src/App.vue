<script setup lang="ts">
import { ref, onMounted } from 'vue'
import OnboardingSetup from './components/OnboardingSetup.vue'
import MainWindow from './components/MainWindow.vue'

const isLoaded = ref(false)
const configuredFolder = ref<string | null>(null)

onMounted(async () => {
  try {
    const config = await window.api.getConfig()
    if (config && config.notesDir) {
      configuredFolder.value = config.notesDir
    }
  } catch (err) {
    console.error('Failed to load config', err)
  } finally {
    isLoaded.value = true
  }
})

async function handleFolderSelected(folder: string) {
  await window.api.saveConfig({ notesDir: folder })
  configuredFolder.value = folder
}

async function handleFolderChanged(folder: string) {
  await window.api.saveConfig({ notesDir: folder })
  configuredFolder.value = folder
}

async function handleResetOnboarding() {
  await window.api.saveConfig({ notesDir: null })
  configuredFolder.value = null
}
</script>

<template>
  <div v-if="!isLoaded" class="loading-state">
  </div>
  <OnboardingSetup v-else-if="!configuredFolder" @folder-selected="handleFolderSelected" />
  <MainWindow v-else :folder-path="configuredFolder" @folder-changed="handleFolderChanged" @reset-onboarding="handleResetOnboarding" />
</template>

<style>
.loading-state {
  height: 100vh;
  width: 100vw;
  background: var(--background);
}
</style>
