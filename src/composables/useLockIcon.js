import { debounce } from '../utils/chatJumpUtils'
import { LOCK_ICON } from '../constant/config.js'

import lockSvg from '../svg/lock.svg'

export function useLockIcon() {
  let isInitialized = false
  let lockButton = null
  let targetElement = null
  let mutationObserver = null
  let resizeObserver = null
  let openCallback = null
  let cleanupFunctions = []
  let observedContainer = null
  let initOptions = {
    containerSelector: null,
    headingSelectors: null,
    sidebarSelectors: null
  }

  function findChatTitle() {
    const orderedHeadingSelectors = initOptions.headingSelectors || LOCK_ICON.ORDERED_HEADING_SELECTORS

    const isVisible = (el) => {
      const style = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      const displayNone = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0'
      const clipped = style.position === 'absolute' &&
        (style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clip === 'rect(0, 0, 0, 0)')
      const sizeZero = rect.width <= 1 || rect.height <= 1
      return !(displayNone || clipped || sizeZero)
    }

    for (const selector of orderedHeadingSelectors) {
      const elements = document.querySelectorAll(selector)
      for (const el of elements) {
        if (isVisible(el)) return el
      }
    }

    const sidebarSelectors = initOptions.sidebarSelectors || LOCK_ICON.SIDEBAR_CONTAINERS
    for (const selector of sidebarSelectors) {
      const elements = document.querySelectorAll(selector)
      for (const el of elements) {
        if (isVisible(el)) return el
      }
    }

    return null
  }

  function resolveContainer() {
    if (initOptions.containerSelector) {
      const el = document.querySelector(initOptions.containerSelector)
      if (el) return el
    }
    const title = findChatTitle()
    if (!title) return document.body
    // Prefer closest sidebar-like container from constants
    for (const sel of (initOptions.sidebarSelectors || LOCK_ICON.SIDEBAR_CONTAINERS)) {
      const container = title.closest(sel)
      if (container) return container
    }
    return title.parentElement || document.body
  }

  function createLockButton() {
    if (lockButton) return lockButton

    lockButton = document.createElement('button')
    lockButton.id = LOCK_ICON.BUTTON_ID
    lockButton.className = LOCK_ICON.BUTTON_CLASS
    lockButton.innerHTML = `<img src="${lockSvg}" alt="lock" />`
    lockButton.title = 'Upgrade to Pro'
    lockButton.setAttribute('aria-label', 'Upgrade to Pro')

    // Apply initial disabled state
    updateDisabledState(lockButton)

    // Add click handler
    lockButton.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      // If disabled, do nothing
      if (isDialogDisabled()) return
      openCallback?.(lockButton)
    })

    return lockButton
  }

  function isDialogDisabled() {
    try {
      return !!JSON.parse(localStorage.getItem('chatjump-hide-lock-dialog') || 'false')
    } catch {
      return false
    }
  }

  function updateDisabledState(button) {
    const disabled = isDialogDisabled()
    if (!button) return
    if (disabled) {
      button.classList.add('is-disabled')
      button.setAttribute('aria-disabled', 'true')
      button.title = ''
    } else {
      button.classList.remove('is-disabled')
      button.removeAttribute('aria-disabled')
      button.title = 'Upgrade to Pro'
    }
  }

  function positionLockButton() {
    const chatTitle = findChatTitle()
    console.log('[useLockIcon] findChatTitle result:', chatTitle)
    if (!chatTitle) {
      console.log('[useLockIcon] No chat title found')
      return false
    }

    // Reuse existing button if present to avoid flicker
    const button = document.getElementById(LOCK_ICON.BUTTON_ID) || createLockButton()

    // For better visibility, attach directly to the h2 title element
    const parent = chatTitle.parentElement || chatTitle
    console.log('[useLockIcon] Parent element:', parent)

    // Ensure parent has relative positioning
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative'
    }

    // Also ensure the h2 itself has relative positioning if we're attaching to its parent
    if (getComputedStyle(chatTitle).position === 'static') {
      chatTitle.style.position = 'relative'
    }

    // Calculate final position
    const titleRect = chatTitle.getBoundingClientRect()
    const parentRect = parent.getBoundingClientRect()
    const relativeTop = titleRect.top - parentRect.top + (titleRect.height / 2)

    // Set position (styling handled via CSS class)
    button.style.top = `${relativeTop}px`
    button.style.transform = 'translateY(-50%)'

    // Attach button if not already under the correct parent
    if (button.parentElement !== parent) {
      parent.appendChild(button)
    }
    targetElement = parent

    // Update disabled state on each reposition
    updateDisabledState(button)

    return true
  }

  function removeLockButton() {
    const existingButton = document.getElementById(LOCK_ICON.BUTTON_ID)
    existingButton?.remove()
  }

  function setupMutationObserver() {
    const debouncedPosition = debounce(positionLockButton, 100)

    observedContainer = resolveContainer()
    if (!observedContainer) observedContainer = document.body

    mutationObserver = new MutationObserver((mutations) => {
      const involvesOurButton = mutations.some(m => {
        const nodes = [...m.addedNodes, ...m.removedNodes]
        return nodes.some(n => n?.nodeType === Node.ELEMENT_NODE && n.id === LOCK_ICON.BUTTON_ID)
      })
      if (involvesOurButton) return
      const shouldReposition = mutations.some(m => m.type === 'childList')
      if (shouldReposition) debouncedPosition()
    })

    mutationObserver.observe(observedContainer, {
      childList: true,
      subtree: true
    })
  }

  function setupResizeObserver() {
    if (!window.ResizeObserver) return

    const debouncedPosition = debounce(positionLockButton, 50)

    resizeObserver = new ResizeObserver(debouncedPosition)
    resizeObserver.observe(observedContainer || document.body)

    // Also listen to window resize (kept minimal)
    const handleResize = debounce(positionLockButton, 50)
    window.addEventListener('resize', handleResize)
    cleanupFunctions.push(() => window.removeEventListener('resize', handleResize))
  }

  function initLockIcon(callback, options = {}) {
    if (isInitialized) return
    openCallback = callback
    initOptions = {
      ...initOptions,
      ...options
    }
    isInitialized = true

    setTimeout(() => {
      positionLockButton()
    }, 500)

    setupMutationObserver()
    setupResizeObserver()
  }

  function cleanup() {
    isInitialized = false

    mutationObserver?.disconnect()
    resizeObserver?.disconnect()

    cleanupFunctions.forEach(fn => {
      try { fn() } catch { }
    })

    removeLockButton()

    mutationObserver = null
    resizeObserver = null
    lockButton = null
    targetElement = null
    openCallback = null
    cleanupFunctions = []
  }

  return {
    initLockIcon,
    cleanup
  }
}
