import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  CHAT_ROOM_URL_PATTERNS,
  USER_MESSAGE_SELECTORS,
} from '../constant/config.js'

/**
 * useQuestions
 * Encapsulates DOM-driven question extraction, active detection, smooth scrolling, and IntersectionObserver management.
 * - Does not handle persistence; compose with useSavedQuestions if needed.
 * - Parameters allow adapting to host DOM.
 */
export function useDetectQuestions(options = {}) {
  const {
    userMessageSelectors = USER_MESSAGE_SELECTORS,
    scrollContainer = null,
    observerOptions = { root: null, rootMargin: '0px', threshold: [0, 0.1, 0.5, 0.9, 1.0] },
  } = options

  const questions = ref([])
  const activeQuestionIndex = ref(-1)

  let intersectionObserver = null
  let lastScrollY = 0
  let lastScrollTime = 0

  const getCurrentChatRoomId = () => {
    const url = window.location.href
    for (const pattern of CHAT_ROOM_URL_PATTERNS) {
      const match = url.match(pattern)
      if (match && match[1]) return match[1]
    }
    const pathname = window.location.pathname
    if (pathname && pathname !== '/') {
      return pathname.replace(/[^a-zA-Z0-9-]/g, '-').replace(/^-+|-+$/g, '')
    }
    return 'default-chat'
  }

  const normalizeText = (text) => (text || '').trim().replace(/\s+/g, ' ')

  const extractUserQuestions = () => {
    const foundQuestions = []
    const chatRoomId = getCurrentChatRoomId()

    const queryNodesBySelectors = (selectors) => {
      const nodes = []
      selectors.forEach((sel) => {
        try {
          document.querySelectorAll(sel).forEach((el) => nodes.push(el))
        } catch {}
      })
      return nodes
    }

    const nodes = queryNodesBySelectors(userMessageSelectors)

    nodes.forEach((el) => {
      const text = normalizeText(el.textContent || '')
      if (!text) return

      // Build a question object compatible with existing UI usage in ChatJump.vue
      const q = {
        id: el.dataset?.messageId || `${chatRoomId}-${text.slice(0, 20)}-${el.offsetTop}`,
        chatRoomId,
        text,
        originalText: text,
        element: el,
      }
      foundQuestions.push(q)
    })

    // Deduplicate by normalized text while preserving order
    const seenTexts = new Set()
    const uniqueQuestions = []
    for (const q of foundQuestions) {
      const key = normalizeText(q.text)
      if (!seenTexts.has(key)) {
        seenTexts.add(key)
        uniqueQuestions.push(q)
      }
    }

    questions.value = uniqueQuestions

    // Ensure a valid active index
    if (uniqueQuestions.length > 0) {
      detectActiveQuestion()
      if (activeQuestionIndex.value === -1) {
        activeQuestionIndex.value = uniqueQuestions.length - 1
      }
    }
  }

  const detectActiveQuestion = () => {
    const currentTime = Date.now()
    const currentScrollY = window.scrollY
    const scrollVelocity = Math.abs(currentScrollY - lastScrollY) / Math.max(currentTime - lastScrollTime, 1)
    lastScrollY = currentScrollY
    lastScrollTime = currentTime

    const viewportHeight = window.innerHeight
    const scrollTop = window.scrollY
    const viewportCenter = scrollTop + viewportHeight / 2

    let closestIndex = -1
    let closestDistance = Infinity

    questions.value.forEach((question, index) => {
      if (question.element) {
        const rect = question.element.getBoundingClientRect()
        const elementTop = rect.top + scrollTop
        const elementCenter = elementTop + (rect.height / 2)

        const isInViewport = rect.top <= viewportHeight && rect.bottom >= 0
        const distance = Math.abs(elementCenter - viewportCenter)

        const isValidCandidate = (scrollVelocity < 5) ? isInViewport : isInViewport
        if (isValidCandidate && distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      }
    })

    if (closestIndex !== -1) {
      activeQuestionIndex.value = closestIndex
    } else if (questions.value.length > 0 && activeQuestionIndex.value === -1) {
      activeQuestionIndex.value = questions.value.length - 1
    }
  }

  const scrollToQuestion = (element) => {
    if (!element) return
    detectActiveQuestion()
    const container = scrollContainer || window
    if (container === window) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else if (typeof container.scrollTo === 'function') {
      const rect = element.getBoundingClientRect()
      container.scrollTo({ top: rect.top + container.scrollTop - (container.clientHeight / 2), behavior: 'smooth' })
    }

    const scrollCheckInterval = setInterval(() => detectActiveQuestion(), 50)
    setTimeout(() => {
      clearInterval(scrollCheckInterval)
      detectActiveQuestion()
    }, 1000)

    element.style.transition = 'background-color 0.5s ease'
    element.style.backgroundColor = 'rgba(189, 189, 189, 0.15)'
    setTimeout(() => { element.style.backgroundColor = '' }, 2000)
  }

  const setupIntersectionObserver = () => {
    if (intersectionObserver) intersectionObserver.disconnect()
    intersectionObserver = new IntersectionObserver((_entries) => {
      detectActiveQuestion()
    }, observerOptions)

    questions.value.forEach(q => { if (q.element) intersectionObserver.observe(q.element) })
  }

  onMounted(() => {
    // Consumers can call extractUserQuestions when DOM is ready; we don't auto-run here.
  })

  onBeforeUnmount(() => {
    if (intersectionObserver) intersectionObserver.disconnect()
  })

  return {
    // state
    questions,
    activeQuestionIndex,
    // methods
    extractUserQuestions,
    detectActiveQuestion,
    scrollToQuestion,
    setupIntersectionObserver,
  }
}
