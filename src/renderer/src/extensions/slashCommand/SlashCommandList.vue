<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  items: any[]
  command: (item: any) => void
}>()

const selectedIndex = ref(0)
const listRef = ref<HTMLElement | null>(null)

watch(() => props.items, () => {
  selectedIndex.value = 0
})

watch(selectedIndex, () => {
  nextTick(() => {
    const list = listRef.value
    if (!list) return
    const selected = list.children[selectedIndex.value] as HTMLElement | undefined
    if (!selected) return
    const padding = parseFloat(getComputedStyle(list).paddingTop)
    const itemTop = selected.offsetTop
    const itemBottom = itemTop + selected.offsetHeight
    if (itemTop < list.scrollTop + padding) {
      list.scrollTop = itemTop - padding
    } else if (itemBottom > list.scrollTop + list.clientHeight - padding) {
      list.scrollTop = itemBottom - list.clientHeight + padding
    }
  })
})

function onKeyDown({ event }: { event: KeyboardEvent }) {
  if (event.key === 'ArrowUp') {
    upHandler()
    return true
  }
  if (event.key === 'ArrowDown') {
    downHandler()
    return true
  }
  if (event.key === 'Enter') {
    enterHandler()
    return true
  }
  return false
}

function upHandler() {
  selectedIndex.value = ((selectedIndex.value + props.items.length) - 1) % props.items.length
}

function downHandler() {
  selectedIndex.value = (selectedIndex.value + 1) % props.items.length
}

function enterHandler() {
  selectItem(selectedIndex.value)
}

function selectItem(index: number) {
  const item = props.items[index]
  if (item) {
    props.command(item)
  }
}

defineExpose({
  onKeyDown
})
</script>

<template>
  <div ref="listRef" class="slash-command-list glass">
    <template v-if="items.length">
      <button
        v-for="(item, index) in items"
        :key="index"
        class="command-item"
        :class="{ 'is-selected': index === selectedIndex }"
        @mousedown.prevent
        @click="selectItem(index)"
      >
        <component :is="item.icon" v-if="item.icon" :size="16" class="command-icon" />
        <span class="command-label">{{ item.title }}</span>
      </button>
    </template>
    <div v-else class="no-results">
      No result
    </div>
  </div>
</template>

<style scoped>
.slash-command-list {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: calc(var(--radius) - 2px);
  background: transparent;
  border: none;
  text-align: left;
  color: var(--foreground);
  cursor: pointer;
  font-size: 0.9rem;
}

.command-item:hover,
.command-item.is-selected {
  background: var(--muted);
}

.command-icon {
  color: var(--muted-foreground);
}

.no-results {
  padding: 0.5rem;
  color: var(--muted-foreground);
  font-size: 0.9rem;
  text-align: center;
}
</style>
