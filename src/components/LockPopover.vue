<template>
  <div
    v-show="isVisible"
    :id="popoverId"
    class="lock-popover"
    :style="popoverStyle"
    @keydown.esc.stop.prevent="handleEscapeKey"
  >
    <div class="lock-dialog" role="dialog" aria-modal="false" :aria-labelledby="titleId">
      <div class="lock-dialog__header">
        <div :id="titleId" class="lock-dialog__title">Upgrade for Pro features</div>
        <button class="lock-dialog__close" type="button" @click="close" aria-label="Close dialog">✕</button>
      </div>
      <div class="lock-dialog__body">
        <p class="lock-dialog__text">Unlock seamless navigation and priority support with Pro. Grab a 30% early-bird discount ($49 lifetime) now!</p>
        <label class="lock-dialog__checkbox">
          <input type="checkbox" v-model="dontShowAgain" /> Don't show this again
        </label>
      </div>
      <div class="lock-dialog__actions">
        <button class="lock-dialog__btn" type="button" @click="close">Dismiss</button>
        <button class="lock-dialog__btn lock-dialog__btn--primary" type="button" @click="handleUpgrade">Upgrade now</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  popoverId: { type: String, default: 'chatjump-lock-popover' },
  width: { type: Number, default: 360 },
})

const emit = defineEmits(['close', 'upgrade'])

// State
const isVisible = ref(false)
const position = reactive({ left: 0, top: 0 })
const dontShowAgain = ref(false)

// Computed
const titleId = computed(() => `${props.popoverId}-title`)
const popoverStyle = computed(() => ({
  left: `${position.left}px`,
  top: `${position.top}px`
}))

// Outside click handler
let outsideClickHandler = null

function openNearAnchor(anchorElement) {
  if (!anchorElement) return
  
  const anchorRect = anchorElement.getBoundingClientRect()
  const calculatedPosition = calculateOptimalPosition(anchorRect)
  
  position.left = calculatedPosition.left
  position.top = calculatedPosition.top
  isVisible.value = true
  
  // Setup outside click handler on next tick
  setTimeout(() => setupOutsideClickHandler(anchorElement), 0)
}

function calculateOptimalPosition(anchorRect) {
  const PADDING = 8
  const ESTIMATED_HEIGHT = 220
  
  // Position to the right of anchor with padding
  const left = Math.min(
    window.innerWidth - PADDING - props.width, 
    anchorRect.right + PADDING
  )
  
  // Center vertically relative to anchor, but keep within viewport
  const idealTop = anchorRect.top - 4
  const maxTop = window.innerHeight - ESTIMATED_HEIGHT - PADDING
  const top = Math.max(PADDING, Math.min(idealTop, maxTop))
  
  return { left, top }
}

function setupOutsideClickHandler(anchorElement) {
  cleanupOutsideClickHandler()
  
  outsideClickHandler = (event) => {
    const popoverElement = document.getElementById(props.popoverId)
    if (!popoverElement) return
    
    const isClickOutside = !popoverElement.contains(event.target) && 
                          event.target !== anchorElement
    
    if (isClickOutside) {
      close()
    }
  }
  
  document.addEventListener('click', outsideClickHandler, true)
}

function close() {
  isVisible.value = false
  cleanupOutsideClickHandler()
  try {
    localStorage.setItem('chatjump-hide-lock-dialog', JSON.stringify(!!dontShowAgain.value))
  } catch {}
  emit('close')
}

function handleUpgrade() {
  emit('upgrade')
  close()
}

function handleEscapeKey() {
  if (isVisible.value) close()
}

function cleanupOutsideClickHandler() {
  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler, true)
    outsideClickHandler = null
  }
}

onBeforeUnmount(() => {
  cleanupOutsideClickHandler()
})

// Expose public API
defineExpose({ 
  openNearAnchor, 
  close 
})
</script>

