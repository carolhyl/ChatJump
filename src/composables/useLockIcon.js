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

  function findChatTitle() {
    const orderedHeadingSelectors = LOCK_ICON.ORDERED_HEADING_SELECTORS

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

    const sidebarSelectors = LOCK_ICON.SIDEBAR_CONTAINERS
    for (const selector of sidebarSelectors) {
      const elements = document.querySelectorAll(selector)
      for (const el of elements) {
        if (isVisible(el)) return el
      }
    }

    return null
  }

  function createLockButton() {
    if (lockButton) return lockButton

    lockButton = document.createElement('button')
    lockButton.id = LOCK_ICON.BUTTON_ID
    lockButton.className = LOCK_ICON.BUTTON_CLASS
    lockButton.innerHTML = `<img src="${lockSvg}" alt="lock" style="width: 12px; height: 12px; display: block;" />`
    lockButton.title = 'Upgrade to Pro'
    lockButton.setAttribute('aria-label', 'Upgrade to Pro')

    // Apply styles
    Object.assign(lockButton.style, {
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '24px',
      height: '24px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: '#666',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
      zIndex: '1000'
    })

    // Add hover effects
    lockButton.addEventListener('mouseenter', () => {
      lockButton.style.background = 'rgba(0,0,0,0.05)'
      lockButton.style.color = '#333'
    })

    lockButton.addEventListener('mouseleave', () => {
      lockButton.style.background = 'transparent'
      lockButton.style.color = '#666'
    })

    // Add click handler
    lockButton.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      openCallback?.(lockButton)
    })

    return lockButton
  }

  function positionLockButton() {
    const chatTitle = findChatTitle()
    console.log('[useLockIcon] findChatTitle result:', chatTitle)
    if (!chatTitle) {
      console.log('[useLockIcon] No chat title found')
      return false
    }

    removeLockButton()

    const button = createLockButton()

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

    // Calculate final position first to prevent animation
    const titleRect = chatTitle.getBoundingClientRect()
    const parentRect = parent.getBoundingClientRect()
    const relativeTop = titleRect.top - parentRect.top + (titleRect.height / 2)

    // Set final position immediately to prevent animation
    button.style.top = `${relativeTop}px`
    button.style.transform = 'translateY(-50%)'
    button.style.transition = 'none' // Disable transitions during positioning

    parent.appendChild(button)
    targetElement = parent

    // Re-enable transitions after positioning
    requestAnimationFrame(() => {
      button.style.transition = 'all 0.2s ease'
    })

    return true
  }

  function removeLockButton() {
    const existingButton = document.getElementById(LOCK_ICON.BUTTON_ID)
    existingButton?.remove()
  }

  function setupMutationObserver() {
    const debouncedPosition = debounce(positionLockButton, 100)

    const triggersSelector = LOCK_ICON.SIDEBAR_TRIGGERS_SELECTOR

    mutationObserver = new MutationObserver((mutations) => {
      const shouldReposition = mutations.some(mutation =>
        mutation.type === 'childList' &&
        Array.from(mutation.addedNodes).some(node =>
          node.nodeType === Node.ELEMENT_NODE && (
            node.matches?.(triggersSelector) ||
            node.querySelector?.(triggersSelector)
          )
        )
      )

      if (shouldReposition) {
        debouncedPosition()
      }
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  function setupResizeObserver() {
    if (!window.ResizeObserver) return

    const debouncedPosition = debounce(positionLockButton, 50)

    resizeObserver = new ResizeObserver(debouncedPosition)
    resizeObserver.observe(document.body)

    // Also listen to window resize
    const handleResize = debounce(positionLockButton, 50)
    window.addEventListener('resize', handleResize)
    cleanupFunctions.push(() => window.removeEventListener('resize', handleResize))
  }

  function initLockIcon(callback) {
    if (isInitialized) return

    openCallback = callback
    isInitialized = true

    setTimeout(() => {
      positionLockButton()
    }, 1000)

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
