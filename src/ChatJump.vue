<template>
  <div 
    v-if="shouldShowNavigator"
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
        </div>
      
        <div class="chat-jump-indicators">
          <div class="chat-jump-indicators-container">
            <div 
              v-for="(question, index) in questions" 
              :key="index"
              class="chat-jump-nav-item"
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
              title="Double click to edit"
            >
              {{ getDisplayTitle(question) }}
            </div>
            <input 
              v-else
              ref="inlineInput"
              v-model="editingTitle"
              class="chat-jump-inline-input"
              @keydown="handleInlineKeydown"
              @input="handleInlineInput"
              @blur="saveEditingTitle"
              @click.stop
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
          <div 
            v-if="hoveredQuestionIndex === index && editingQuestionIndex !== index && ENABLE_DELETE_TITLE"
            class="chat-jump-delete-icon"
            @click.stop="deleteQuestion(question.id)"
            title="刪除問題"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, nextTick, useTemplateRef } from 'vue'
import LockDialogManager from './model/LockDialogManager.js'
import { useLockIcon } from './composables/useLockIcon'
import { 
  ENABLE_ALL_CHATS,
  ENABLE_DELETE_TITLE,
  MAX_RECENT_CHATS, 
  QUESTION_TITLE_MAX_LENGTH, 
  AUTO_SAVE_DELAY,
  CHAT_ROOM_URL_PATTERNS,
  USER_MESSAGE_SELECTORS,
  LANGUAGE_PATTERNS,
  ADD_CLICK_DETECTION_CONFIG
} from './constant/config.js'
import { 
  debounce,
  localStorageUtils,
  recentChatIndicatorManager
} from './utils/chatJumpUtils.js'

const questions = ref([])
const savedQuestions = ref([])
const showQuestionList = ref(false)
const hoveredQuestionIndex = ref(-1)
const activeQuestionIndex = ref(-1)
const deletedQuestionIds = ref(new Set())
const recentChatIds = ref([])

const editingQuestionId = ref(null)
const editingQuestionIndex = ref(-1)
const editingTitle = ref('')
let autoSaveTimer = null

let observer = null
let scrollObserver = null
let lastScrollY = 0
let lastScrollTime = 0

const lockDialogManager = new LockDialogManager()

const applyTheme = (theme) => {
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-dark')
  if (!theme) {
    return
  }
  
  theme === 'light' ? root.classList.add('theme-light') : root.classList.add('theme-dark')
}

const getStoredTheme = () => {
  try {
    return localStorage.getItem('theme')
  } catch {
    return null
  }
}

const initTheme = () => {
  try {
    const theme = getStoredTheme()

    if(!theme) {
      const media = window.matchMedia?.('(prefers-color-scheme: dark)');
      applyTheme(media?.matches ? 'dark' : 'light');
      return;
    }
    applyTheme(theme);
  } catch {
    applyTheme(null)
  }
}

const shouldShowNavigator = computed(() => {
  if (questions.value.length === 0) return false
  
  if (ENABLE_ALL_CHATS) return true
  
  const currentChatRoomId = questions.value[0]?.chatRoomId
  if (!currentChatRoomId) return false
  
  // 使用響應式狀態檢查當前聊天室是否在最近列表中
  return recentChatIds.value.includes(currentChatRoomId)
})

const detectLanguage = (text) => {
  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(text)) {
      return lang
    }
  }
  return 'default'
}

const truncateText = (text, customMaxLength = null) => {
  let maxLength
  
  if (customMaxLength !== null) {
    maxLength = customMaxLength
  } else {
    const language = detectLanguage(text)
    maxLength = QUESTION_TITLE_MAX_LENGTH[language] || QUESTION_TITLE_MAX_LENGTH.default
  }
  
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
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
    title: truncateText(question.text),
    originalText: question.text,
    timestamp: new Date().toISOString(),
    url: window.location.href
  }
  
  const existingIndex = savedQuestions.value.findIndex(q => 
    q.originalText === question.text
  )
  
  if (existingIndex !== -1) {
    savedQuestions.value[existingIndex].timestamp = questionToSave.timestamp
    savedQuestions.value[existingIndex].url = questionToSave.url
  } else {
    savedQuestions.value.unshift(questionToSave)
  }
  
  saveSavedQuestions()
}

const updateQuestionTitle = (questionId, newTitle) => {
  const question = savedQuestions.value.find(q => q.id === questionId)
  if (question) {
    question.title = newTitle.trim() || truncateText(question.originalText)
    saveSavedQuestions()
  }
}

const getDisplayTitle = (question) => {
  const savedQuestion = savedQuestions.value.find(q => 
    q.originalText === question.text
  )
  
  if (savedQuestion && savedQuestion.title !== truncateText(question.text)) {
    return truncateText(savedQuestion.title)
  }
  
  return truncateText(question.text)
}

const startEditingTitle = (questionId, currentTitle, questionIndex = -1) => {
  editingQuestionId.value = questionId
  editingQuestionIndex.value = questionIndex
  editingTitle.value = currentTitle
  
  nextTick(() => {
    const inputRef = useTemplateRef('inlineInput')
    if (inputRef.value) {
      inputRef.value.focus()
      inputRef.value.select()
    }
  })
}

const startEditingQuestionTitle = (question, questionIndex) => {
  const savedQuestion = savedQuestions.value.find(q => 
    q.originalText === question.text
  )
  
  if (savedQuestion) {
    const defaultTitle = truncateText(question.text)
    const titleToEdit = savedQuestion.title !== defaultTitle 
      ? savedQuestion.title 
      : question.text
    startEditingTitle(savedQuestion.id, titleToEdit, questionIndex)
  } else {
    saveCurrentQuestion(question)
    nextTick(() => {
      const newSavedQuestion = savedQuestions.value.find(q => 
        q.originalText === question.text
      )
      if (newSavedQuestion) {
        startEditingTitle(newSavedQuestion.id, question.text, questionIndex)
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
  editingQuestionId.value = null
  editingQuestionIndex.value = -1
  editingTitle.value = ''
  
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
}

const deleteQuestion = (questionId) => {
  deletedQuestionIds.value.add(questionId)
  
  const updatedSavedQuestions = savedQuestions.value.filter(question => question.id !== questionId)
  savedQuestions.value = updatedSavedQuestions
  saveSavedQuestions()
  

  const questionIndex = questions.value.findIndex(question => question.id === questionId)
  if (questionIndex !== -1) {
    questions.value = questions.value.filter((_, index) => index !== questionIndex)
  }
  
  localStorage.setItem('chatjump-deleted-questions', JSON.stringify([...deletedQuestionIds.value]))
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
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  autoSaveTimer = setTimeout(() => {
    saveEditingTitle()
  }, AUTO_SAVE_DELAY)
}

const syncRecentChatIds = () => {
  const currentIds = localStorageUtils.getRecentChatIds('chatjump-recent-chats')
  recentChatIds.value = currentIds
}

const removeRecentChat = (chatId) => {
  recentChatIndicatorManager.removeChat(chatId, {
    removeCallback: removeRecentChat,
    addCallback: addRecentChat
  })
  
  syncRecentChatIds()
}

const addRecentChat = (chatId, title, href) => {
  const success = recentChatIndicatorManager.addChat(chatId, title, href, {
    removeCallback: removeRecentChat,
    addCallback: addRecentChat
  })
  
  if (success) {
    syncRecentChatIds()
    
    // 獲取當前聊天室 ID
    const getCurrentChatRoomId = () => {
      const url = window.location.href
      for (const pattern of CHAT_ROOM_URL_PATTERNS) {
        const match = url.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }
      return null
    }
    
    const currentChatRoomId = getCurrentChatRoomId()
    
    // 如果成功添加了當前聊天室，重新提取問題並啟用導航
    if (chatId === currentChatRoomId) {
      // 重新提取問題以確保導航功能正常工作
      setTimeout(() => {
        extractUserQuestions()
      }, ADD_CLICK_DETECTION_CONFIG.NAVIGATOR_ENABLE_DELAY)
    }
  }
  
  return success
}

const addRecentChatIndicators = () => {
  recentChatIndicatorManager.addIndicators({
    storageKey: 'chatjump-recent-chats',
    removeCallback: removeRecentChat,
    addCallback: addRecentChat
  })
  
  syncRecentChatIds()
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
  
  const foundQuestions = []
  
  const getCurrentChatRoomId = () => {
    const url = window.location.href
    
    for (const pattern of CHAT_ROOM_URL_PATTERNS) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    // 如果 URL 中沒有找到，使用 pathname 作為備用 ID
    const pathname = window.location.pathname
    if (pathname && pathname !== '/') {
      return pathname.replace(/[^a-zA-Z0-9-]/g, '-').replace(/^-+|-+$/g, '')
    }
    
    return 'default-chat'
  }
  
  const currentChatRoomId = getCurrentChatRoomId()
  
  USER_MESSAGE_SELECTORS.forEach(selector => {
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
            index: foundQuestions.length,
            chatRoomId: currentChatRoomId,
            timestamp: Date.now()
          })
          
        }
      })
    } catch (error) {
      console.error(`Error occurred while processing selector "${selector}":`, error)
    }
  })
  
  const uniqueQuestions = []
  const seenTexts = new Set()
  
  foundQuestions.forEach(q => {
    const normalizedText = q.text.toLowerCase().replace(/\s+/g, ' ').trim()
    // Skip questions that have been deleted
    if (!seenTexts.has(normalizedText) && !deletedQuestionIds.value.has(q.id)) {
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
  initTheme()
  // const storageHandler = (e) => {
  //   if (e.key === 'theme') initTheme()
  // }
  // window.addEventListener('storage', storageHandler)

  extractUserQuestions()
  
  setTimeout(() => {
    setupIntersectionObserver()
    detectActiveQuestion()
    
    localStorageUtils.autoPopulateIfEmpty(MAX_RECENT_CHATS, 'chatjump-recent-chats')
    
    syncRecentChatIds()
    
    addRecentChatIndicators()
    
    const { initLockIcon } = useLockIcon()
    initLockIcon((lockButton) => {
      lockDialogManager.open(lockButton)
    })
    
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
  
  const debouncedUpdateIndicators = debounce(addRecentChatIndicators, 300)
  // start lock icon manager
  // lockIcon.start()
  
  observer = new MutationObserver((mutations) => {
    let shouldUpdateQuestions = false
    let shouldUpdateIndicators = false
    let shouldTryLock = false
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldUpdateQuestions = true
        
        // 檢查是否有聊天室相關的變化
        const hasRelevantChanges = Array.from(mutation.addedNodes).some(node => 
          node.nodeType === 1 && (
            node.querySelector?.('a[href*="/c/"]') ||
            node.matches?.('a[href*="/c/"]') ||
            node.classList?.contains('__menu-item') ||
            node.querySelector?.('h2.__menu-label')
          )
        )
        
        if (hasRelevantChanges) {
          shouldUpdateIndicators = true
        }

        // 如果側欄或標題發生變化，嘗試掛載鎖頭按鈕
        const hasMenuLabel = Array.from(mutation.addedNodes).some(node => 
          node.nodeType === 1 && (node.matches?.('h2.__menu-label') || node.querySelector?.('h2.__menu-label'))
        )
        if (hasMenuLabel) shouldTryLock = true
      }
    })
    
    if (shouldUpdateQuestions) {
      setTimeout(() => {
        extractUserQuestions()
        setTimeout(() => {
          setupIntersectionObserver()
          detectActiveQuestion()
        }, 100)
      }, 500)
    }
    
    if (shouldUpdateIndicators) {
      debouncedUpdateIndicators()
    }
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  
  scrollObserver = { directScrollHandler, intersectionObserver }
  // Cleanup listeners on unmount
  onBeforeUnmount(() => {
    window.removeEventListener('storage', storageHandler)
    window.removeEventListener('chatjump-theme-change', sameTabHandler)
    teardownSystemListener?.()
  })
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

onBeforeUnmount(() => lockDialogManager.destroy())
</script>
