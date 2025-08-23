<template>
  <div
    v-show="isVisible"
    :id="popoverId"
    class="lock-popover"
    :style="popoverStyle"
    @keydown.esc.stop.prevent="handleEscapeKey"
  >
    <div class="lock-dialog" role="dialog">
      <div class="lock-dialog-header">
        <div class="lock-dialog-hero" v-html="heroSvg" aria-hidden="true"></div>
        <button class="lock-dialog-close" type="button" @click="close" aria-label="Close dialog">✕</button>
      </div>
      <div class="lock-dialog-body">
        <h2 :id="titleId">
          {{ title }}
        </h2>
        <p class="lock-dialog-text">
          {{ description }}
        </p>
        <label class="lock-dialog-checkbox">
          <input type="checkbox" v-model="dontShowAgain" /> {{ checkboxLabel }}
        </label>
      </div>
      <div class="lock-dialog-actions">
        <button class="lock-dialog-btn lock-dialog-btn-primary" type="button" @click="handleUpgrade">
          {{ upgradeText }}
        </button>
        <button class="lock-dialog-btn" type="button" @click="close">
          {{ dismissText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import heroSvg from '../svg/illustrate_pop_title.svg?raw'

const props = defineProps({
  popoverId: { type: String, default: 'chatjump-lock-popover' },
  width: { type: Number, default: 360 },
})

const emit = defineEmits(['close', 'upgrade'])

// State
const isVisible = ref(false)
const position = reactive({ left: 0, top: 0 })
const dontShowAgain = ref(false)

const title = ref('Say goodbye to chat chaos!')
const description = ref('Unlock seamless navigation and priority support with Pro. Grab a 30% early-bird discount ($49 lifetime) now!')
const checkboxLabel = ref('Don\'t show this again')
const upgradeText = ref('Upgrade now')
const dismissText = ref('Dismiss')

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

