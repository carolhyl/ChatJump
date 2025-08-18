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
          <div class="chat-jump-indicators-container">
            <div 
              v-for="(question, index) in questions" 
              :key="index"
              class="chat-jump-nav-item"
              @click="scrollToQuestion(question.element)"
            >
              <div class="chat-jump-nav-icon">
                <div 
                  class="chat-jump-dash-icon"
                  :class="{ 'active': activeQuestionIndex === index }"
                />
              </div>
            </div>
          </div>
          

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
          <div class="chat-jump-question-number-badge">{{ String(index + 1).padStart(2, '0') }}</div>
          <div class="chat-jump-question-text">
            <div 
              v-if="editingQuestionIndex !== index"
              class="chat-jump-question-title"
              @dblclick="startEditingQuestionTitle(question, index)"
              title="雙擊編輯標題"
            >
              {{ getDisplayTitle(question) }}
            </div>
            <input 
              v-else
              v-model="editingTitle"
              class="chat-jump-inline-input"
              @keydown="handleInlineKeydown"
              @input="handleInlineInput"
              @blur="saveEditingTitle"
              @click.stop
              ref="inlineInput"
              maxlength="100"
            />
          </div>
          <div 
            v-if="hoveredQuestionIndex === index && editingQuestionIndex !== index"
            class="chat-jump-edit-icon"
            @click.stop="startEditingQuestionTitle(question, index)"
            title="編輯標題"
          >
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.54549 0.0909081C5.68451 0.0910623 5.81823 0.144297 5.91932 0.239734C6.02042 0.335172 6.08125 0.46561 6.0894 0.604396C6.09755 0.743182 6.05239 0.879842 5.96316 0.986453C5.87393 1.09306 5.74736 1.16158 5.60931 1.178L5.54549 1.18182H1.18185V8.81818H8.81821V4.45454C8.81837 4.31552 8.8716 4.1818 8.96704 4.08071C9.06248 3.97961 9.19292 3.91878 9.3317 3.91063C9.47049 3.90248 9.60715 3.94764 9.71376 4.03687C9.82037 4.1261 9.88889 4.25267 9.9053 4.39073L9.90912 4.45454V8.81818C9.90921 9.0934 9.80527 9.35849 9.61812 9.5603C9.43098 9.7621 9.17448 9.88572 8.90003 9.90636L8.81821 9.90909H1.18185C0.906628 9.90918 0.641542 9.80523 0.439734 9.61809C0.237926 9.43095 0.114312 9.17445 0.0936698 8.9L0.0909424 8.81818V1.18182C0.0908553 0.906594 0.1948 0.641508 0.381941 0.4397C0.569081 0.237892 0.825585 0.114277 1.10003 0.0936354L1.18185 0.0909081H5.54549ZM8.95076 0.277999C9.04892 0.180173 9.18063 0.123377 9.31915 0.119147C9.45767 0.114917 9.5926 0.163571 9.69655 0.255226C9.80049 0.34688 9.86565 0.474663 9.8788 0.612621C9.89194 0.750579 9.85208 0.888367 9.76731 0.997999L9.72203 1.04982L4.32203 6.44927C4.22387 6.5471 4.09216 6.60389 3.95364 6.60812C3.81512 6.61235 3.68019 6.5637 3.57624 6.47204C3.4723 6.38039 3.40714 6.25261 3.394 6.11465C3.38086 5.97669 3.42072 5.8389 3.50549 5.72927L3.55076 5.678L8.95076 0.277999Z" fill="#9E9E9E"/>
            </svg>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const questions = ref([])
const savedQuestions = ref([])
const showQuestionList = ref(false)
const hoveredQuestionIndex = ref(-1)
const activeQuestionIndex = ref(-1)

const editingQuestionId = ref(null)
const editingQuestionIndex = ref(-1)
const editingTitle = ref('')
let autoSaveTimer = null

let observer = null
let scrollObserver = null
let lastScrollY = 0
let lastScrollTime = 0



const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + '...'
}

// localStorage 相關功能
const loadSavedQuestions = () => {
  try {
    const saved = localStorage.getItem('chatjump-saved-questions')
    if (saved) {
      savedQuestions.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('載入儲存問題時出錯:', error)
    savedQuestions.value = []
  }
}

const saveSavedQuestions = () => {
  try {
    localStorage.setItem('chatjump-saved-questions', JSON.stringify(savedQuestions.value))
  } catch (error) {
    console.error('儲存問題時出錯:', error)
  }
}

const saveCurrentQuestion = (question) => {
  const questionToSave = {
    id: Date.now().toString(),
    title: truncateText(question.text, 50),
    originalText: question.text,
    timestamp: new Date().toISOString(),
    url: window.location.href
  }
  
  // 檢查是否已存在相同問題（只檢查原文）
  const existingIndex = savedQuestions.value.findIndex(q => 
    q.originalText === question.text
  )
  
  if (existingIndex !== -1) {
    // 更新現有問題的時間戳，但保持編輯過的標題
    savedQuestions.value[existingIndex].timestamp = questionToSave.timestamp
    savedQuestions.value[existingIndex].url = questionToSave.url
  } else {
    // 添加新問題
    savedQuestions.value.unshift(questionToSave)
    
  }
  
  saveSavedQuestions()
}

const removeSavedQuestion = (questionId) => {
  savedQuestions.value = savedQuestions.value.filter(q => q.id !== questionId)
  saveSavedQuestions()
}

const updateQuestionTitle = (questionId, newTitle) => {
  const question = savedQuestions.value.find(q => q.id === questionId)
  if (question) {
    question.title = newTitle.trim() || question.originalText.substring(0, 50) + '...'
    saveSavedQuestions()
  }
}

// 獲取顯示標題（優先顯示編輯過的標題）
const getDisplayTitle = (question) => {
  const savedQuestion = savedQuestions.value.find(q => 
    q.originalText === question.text
  )
  
  if (savedQuestion && savedQuestion.title !== truncateText(question.text, 50)) {
    // 如果有儲存的問題且標題被編輯過，顯示編輯過的標題
    return savedQuestion.title
  }
  
  // 否則顯示原始文字
  return truncateText(question.text, 120)
}

const startEditingTitle = (questionId, currentTitle, questionIndex = -1) => {
  editingQuestionId.value = questionId
  editingQuestionIndex.value = questionIndex
  editingTitle.value = currentTitle
  
  // 使用 nextTick 確保 DOM 更新後再聚焦
  nextTick(() => {
    const input = document.querySelector('.chat-jump-inline-input')
    if (input) {
      input.focus()
      input.select()
    }
  })
}



const startEditingQuestionTitle = (question, questionIndex) => {
  // 檢查是否已經有儲存的版本
  const savedQuestion = savedQuestions.value.find(q => 
    q.originalText === question.text
  )
  
  if (savedQuestion) {
    // 編輯已儲存的問題
    startEditingTitle(savedQuestion.id, savedQuestion.title, questionIndex)
  } else {
    // 創建新的儲存問題並編輯
    saveCurrentQuestion(question)
    nextTick(() => {
      const newSavedQuestion = savedQuestions.value.find(q => 
        q.originalText === question.text
      )
      if (newSavedQuestion) {
        startEditingTitle(newSavedQuestion.id, newSavedQuestion.title, questionIndex)
      }
    })
  }
}

const saveEditingTitle = () => {
  if (editingQuestionId.value && editingTitle.value.trim()) {
    updateQuestionTitle(editingQuestionId.value, editingTitle.value)
  }
  cancelEditingTitle()
}

const cancelEditingTitle = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
  editingQuestionId.value = null
  editingQuestionIndex.value = -1
  editingTitle.value = ''
}

const handleInlineKeydown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveEditingTitle()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelEditingTitle()
  }
}

const handleInlineInput = () => {
  // 清除之前的計時器
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  // 設置新的計時器，1秒後自動儲存
  autoSaveTimer = setTimeout(() => {
    saveEditingTitle()
  }, 1000)
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
    // Active question changed
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
    
    // 自動儲存最新的問題（如果有的話）
    if (uniqueQuestions.length > 0) {
      const latestQuestion = uniqueQuestions[uniqueQuestions.length - 1]
      saveCurrentQuestion(latestQuestion)
    }
  }
}

onMounted(() => {
  // 載入儲存的問題
  loadSavedQuestions()
  
  extractUserQuestions()
  
  setTimeout(() => {
    setupIntersectionObserver()
    detectActiveQuestion()
    
    setTimeout(() => {      
      if (questions.value.length > 0) {
        const latestIndex = questions.value.length - 1
        activeQuestionIndex.value = latestIndex
      }
      
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
  window.addEventListener('resize', handleScroll)
  
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