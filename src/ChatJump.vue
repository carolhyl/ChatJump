<template>
  <div 
    class="chat-jump-navigator-container"
    @mouseenter="showQuestionList = true"
    @mouseleave="showQuestionList = false"
  >
    <div 
      v-if="!showQuestionList"
      class="chat-jump-navigator"
    >
      <div class="chat-jump-nav-items">
        <div class="chat-jump-collapsed-info">
          <div class="chat-jump-question-count">{{ questions.length }}</div>
          <div class="chat-jump-count-label">個問題</div>
        </div>
      
        <div class="chat-jump-indicators">
          <div 
            class="chat-jump-indicators-container"
            @mouseenter="handleIndicatorHover"
            @mouseleave="showAllQuestions = false"
          >
            <div 
              v-if="visibleStartIndex > 0 && !showAllQuestions"
              class="chat-jump-ellipsis-top"
            >
              <div class="chat-jump-ellipsis-dots">⋯</div>
              <div class="chat-jump-ellipsis-count">{{ visibleStartIndex }}</div>
            </div>
          
            <div 
              v-for="(question, index) in (showAllQuestions ? questions : visibleQuestions)" 
              :key="showAllQuestions ? index : (visibleStartIndex + index)"
              class="chat-jump-nav-item"
            >
              <div class="chat-jump-nav-icon">
                <div 
                  class="chat-jump-dash-icon"
                  :class="{ 'active': activeQuestionIndex === (showAllQuestions ? index : (visibleStartIndex + index)) }"
                />
              </div>
            </div>
          </div>
        
          <template v-if="visibleQuestions.length === 0 && questions.length > 0">
            <div 
              v-for="(question, index) in questions.slice(visibleStartIndex, visibleEndIndex + 1)" 
              :key="'fallback-' + index"
              class="chat-jump-nav-item"
            >
              <div class="chat-jump-nav-icon">
                <div 
                  class="chat-jump-dash-icon"
                  :class="{ 'active': activeQuestionIndex === index }"
                />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
    
    <div 
      v-if="showQuestionList && questions.length > 0"
      class="chat-jump-question-list-expanded"
    >
    <div 
      v-for="(question, index) in questions" 
      :key="index"
      :class="['chat-jump-question-item', { 'chat-jump-question-item-hovered': hoveredQuestionIndex === index }]"
      @mouseenter="hoveredQuestionIndex = index"
      @mouseleave="hoveredQuestionIndex = -1"
      @click="scrollToQuestion(question.element)"
    >
      <div class="chat-jump-question-content">
        <div class="chat-jump-question-number-badge">{{ index + 1 }}</div>
        <div class="chat-jump-question-text">
          {{ truncateText(question.text, 120) }}
        </div>
      </div>
    </div>
  </div>
    
  <div 
    v-if="questions.length === 0" 
    class="chat-jump-no-questions"
  >
    <div class="chat-jump-loading">正在搜尋問題...</div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const questions = ref([])
const showQuestionList = ref(false)
const hoveredQuestionIndex = ref(-1)
const activeQuestionIndex = ref(-1)
const visibleStartIndex = ref(0)
const visibleEndIndex = ref(0)
const showAllQuestions = ref(false)

let observer = null
let scrollObserver = null
let lastScrollY = 0
let lastScrollTime = 0

const calculateSmartViewport = () => {
  if (questions.value.length === 0) {
    visibleStartIndex.value = 0
    visibleEndIndex.value = 0
    return
  }
  
  const maxVisibleHeight = 60 * 0.4 * window.innerHeight / 100
  const itemHeight = 25
  let maxVisibleItems = Math.floor(maxVisibleHeight / itemHeight)
  
  // maxVisibleItems = Math.min(maxVisibleItems, 8)
  
  if (questions.value.length <= maxVisibleItems) {
    visibleStartIndex.value = 0
    visibleEndIndex.value = questions.value.length - 1
  } else {
    const activeIndex = activeQuestionIndex.value
    const totalQuestions = questions.value.length
    
    if (activeIndex === -1 || activeIndex >= totalQuestions - Math.floor(maxVisibleItems / 2)) {
      // 沒有 active 問題，或 active 問題在後半段，顯示最新的問題
      visibleStartIndex.value = totalQuestions - maxVisibleItems
      visibleEndIndex.value = totalQuestions - 1
    } else {
      // 有 active 問題且在前半段，讓 active 問題居中
      const halfVisible = Math.floor(maxVisibleItems / 2)
      let idealStart = activeIndex - halfVisible
      let idealEnd = activeIndex + halfVisible
      
      if (idealStart < 0) {
        idealStart = 0
        idealEnd = maxVisibleItems - 1
      } else if (idealEnd >= totalQuestions) {
        idealEnd = totalQuestions - 1
        idealStart = totalQuestions - maxVisibleItems
      }
      
      visibleStartIndex.value = idealStart
      visibleEndIndex.value = idealEnd
    }
  }
}

const visibleQuestions = computed(() => {
  const result = questions.value.slice(visibleStartIndex.value, visibleEndIndex.value + 1)
  return result
})

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + '...'
}

const handleIndicatorHover = () => {
  if (visibleStartIndex.value > 0) {
    showAllQuestions.value = true
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
      const elementCenter = elementTop + rect.height / 2
      
      // 計算元素中心點與視窗中心點的距離
      const distance = Math.abs(elementCenter - viewportCenter)
      
      // 檢查元素是否在視窗內
      const isInViewport = rect.top < viewportHeight && rect.bottom > 0
      
      // 快速滾動時放寬檢測範圍
      const isValidCandidate = scrollVelocity > 2 ? 
        (rect.top < viewportHeight * 1.2 && rect.bottom > -viewportHeight * 0.2) : 
        isInViewport
      
      if (isValidCandidate && distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    }
  })
  
  const previousActiveIndex = activeQuestionIndex.value
  
  if (closestIndex !== -1) {
    activeQuestionIndex.value = closestIndex
  } else {
    if (questions.value.length > 0 && activeQuestionIndex.value === -1) {
      activeQuestionIndex.value = questions.value.length - 1
    }
  }
  
  if (previousActiveIndex !== activeQuestionIndex.value) {
    calculateSmartViewport()
  }
}

const scrollToQuestion = (element) => {
  if (element) {
    detectActiveQuestion()
    
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    })
    
    const scrollCheckInterval = setInterval(() => {
      detectActiveQuestion()
    }, 50)
    
    setTimeout(() => {
      clearInterval(scrollCheckInterval)
      detectActiveQuestion()
    }, 1000)
    
    element.style.transition = 'background-color 0.5s ease'
    element.style.backgroundColor = '#FAF3EC'
    setTimeout(() => {
      element.style.backgroundColor = ''
    }, 2000)
  }
}

const extractUserQuestions = () => {
  
  // ChatGPT user selector(base on 2024)
  const userSelectors = [
    'article[data-testid*="conversation-turn"][data-turn="user"]',
    '[data-message-author-role="user"]',
    'div[data-message-author-role="user"]',
    '.group[data-testid*="conversation-turn"]:has([data-message-author-role="user"])'
  ]
  
  const foundQuestions = []
  
  userSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector)
      
      elements.forEach((element, _index) => {
        let questionText = ''
        
        const preWrapContainer = element.querySelector('.whitespace-pre-wrap')
        if (preWrapContainer && preWrapContainer.textContent.trim()) {
          questionText = preWrapContainer.textContent.trim()
        }
        
        if (!questionText) {
          const bubbleContainer = element.querySelector('.user-message-bubble-color')
          if (bubbleContainer && bubbleContainer.textContent.trim()) {
            questionText = bubbleContainer.textContent.trim()
          }
        }
        
        if (!questionText) {
          const messageContainer = element.querySelector('[data-message-author-role="user"]')
          if (messageContainer) {
            const textDiv = messageContainer.querySelector('.whitespace-pre-wrap')
            if (textDiv && textDiv.textContent.trim()) {
              questionText = textDiv.textContent.trim()
            }
          }
        }
        
        if (!questionText && element.textContent && element.textContent.trim()) {
          questionText = element.textContent.trim()
          questionText = questionText.replace(/複製|編輯訊息|你說：/g, '').trim()
        }
        
        if (!questionText) {
          const textContainers = element.querySelectorAll('div, p, span')
          textContainers.forEach(container => {
            const text = container.textContent?.trim()
            if (text && text.length > questionText.length && text.length < 1000) {
              if (!text.match(/複製|編輯訊息|你說：|aria-label|data-testid/)) {
                questionText = text
              }
            }
          })
        }
        
        if (questionText && 
            !questionText.includes('ChatGPT') &&
            !questionText.includes('OpenAI')) {
          
          const questionId = `user-question-${foundQuestions.length}`
          element.id = questionId
          
          foundQuestions.push({
            text: questionText,
            element: element,
            id: questionId,
            index: foundQuestions.length
          })
          
        }
      })
    } catch {
      // console.log(`選擇器 "${selector}" 執行時出錯`)
    }
  })
  
  const uniqueQuestions = []
  const seenTexts = new Set()
  
  foundQuestions.forEach(q => {
    const normalizedText = q.text.toLowerCase().replace(/\s+/g, ' ').trim()
    if (!seenTexts.has(normalizedText)) {
      seenTexts.add(normalizedText)
      uniqueQuestions.push(q)
    }
  })
  
  questions.value = uniqueQuestions
  
  if (uniqueQuestions.length > 0) {
    detectActiveQuestion()
    
    if (activeQuestionIndex.value === -1) {
      const latestQuestionIndex = uniqueQuestions.length - 1
      activeQuestionIndex.value = latestQuestionIndex
    }
  }
  
  calculateSmartViewport()
}

onMounted(() => {
  extractUserQuestions()
  
  setTimeout(() => {
    setupIntersectionObserver()
    detectActiveQuestion()
    
    setTimeout(() => {      
      if (questions.value.length > 0) {
        const latestIndex = questions.value.length - 1
        activeQuestionIndex.value = latestIndex
      }
      
      calculateSmartViewport()
    }, 500)
  }, 1000)
  
  const handleScroll = () => {
    detectActiveQuestion()
  }
  
  let intersectionObserver = null
  const setupIntersectionObserver = () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect()
    }
    
    intersectionObserver = new IntersectionObserver((_entries) => {
      detectActiveQuestion()
    }, {
      root: null,
      rootMargin: '0px',
      threshold: [0, 0.1, 0.5, 0.9, 1.0]
    })
    
    questions.value.forEach(question => {
      if (question.element) {
        intersectionObserver.observe(question.element)
      }
    })
  }
  
  let scrollTimeout = null
  const directScrollHandler = () => {
    detectActiveQuestion()
    
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
    scrollTimeout = setTimeout(() => {
      detectActiveQuestion()
    }, 100)
  }
  
  window.addEventListener('scroll', directScrollHandler, { passive: true })
  window.addEventListener('resize', handleScroll) // 窗口大小改變時也需要重新檢測
  
  observer = new MutationObserver((mutations) => {
    let shouldUpdate = false
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldUpdate = true
      }
    })
    
    if (shouldUpdate) {
      setTimeout(() => {
        extractUserQuestions()
        setTimeout(() => {
          setupIntersectionObserver()
          detectActiveQuestion()
        }, 100)
      }, 500)
    }
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  
  scrollObserver = { directScrollHandler, intersectionObserver }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  if (scrollObserver) {
    window.removeEventListener('scroll', scrollObserver.directScrollHandler)
    if (scrollObserver.intersectionObserver) {
      scrollObserver.intersectionObserver.disconnect()
    }
    window.removeEventListener('resize', detectActiveQuestion)
  }
})
</script>