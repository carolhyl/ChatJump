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
              maxlength="300"
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
import { 
  ENABLE_ALL_CHATS,
  ENABLE_DELETE_TITLE,
  MAX_RECENT_CHATS, 
  QUESTION_TITLE_MAX_LENGTH, 
  AUTO_SAVE_DELAY,
  CHAT_ROOM_URL_PATTERNS,
  USER_MESSAGE_SELECTORS,
  LANGUAGE_PATTERNS
} from './constant/config.js'

const questions = ref([])
const savedQuestions = ref([])
const showQuestionList = ref(false)
const hoveredQuestionIndex = ref(-1)
const activeQuestionIndex = ref(-1)
const deletedQuestionIds = ref(new Set())

const editingQuestionId = ref(null)
const editingQuestionIndex = ref(-1)
const editingTitle = ref('')
let autoSaveTimer = null

let observer = null
let scrollObserver = null
let lastScrollY = 0
let lastScrollTime = 0

const getRecentChatRoomIds = () => {
  try {
    const savedRecentChats = localStorage.getItem('chatjump-recent-chats')
    let recentChatsData = []
    
    if (savedRecentChats) {
      try {
        recentChatsData = JSON.parse(savedRecentChats)
      } catch (e) {
        recentChatsData = []
      }
    }
    
    const chatLinks = document.querySelectorAll('a[href*="/c/"]')
    const currentChatRoomIds = []
    const chatRoomInfo = new Map()
    
    Array.from(chatLinks).forEach(link => {
      const href = link.getAttribute('href') || link.href
      const chatIdMatch = href.match(/\/c\/([a-f0-9-]+)/)
      
      if (chatIdMatch) {
        const chatId = chatIdMatch[1]
        if (!currentChatRoomIds.includes(chatId)) {
          currentChatRoomIds.push(chatId)
          
          let title = ''
          const titleElement = link.querySelector('[title]') || 
                              link.closest('[title]') || 
                              link.parentElement?.querySelector('[title]')
          if (titleElement) {
            title = titleElement.getAttribute('title') || titleElement.textContent?.trim() || ''
          }
          
          chatRoomInfo.set(chatId, {
            id: chatId,
            title: title,
            href: href,
            lastAccessed: Date.now()
          })
        }
      }
    })
    
    const updatedRecentChats = []
    const seenIds = new Set()
    
    currentChatRoomIds.slice(0, MAX_RECENT_CHATS).forEach(chatId => {
      if (!seenIds.has(chatId)) {
        updatedRecentChats.push(chatRoomInfo.get(chatId))
        seenIds.add(chatId)
      }
    })
    
    recentChatsData.forEach(chatData => {
      if (updatedRecentChats.length >= MAX_RECENT_CHATS) return
      if (!seenIds.has(chatData.id)) {
        if (chatRoomInfo.has(chatData.id)) {
          chatData.lastAccessed = Date.now()
        }
        updatedRecentChats.push(chatData)
        seenIds.add(chatData.id)
      }
    })
    
    localStorage.setItem('chatjump-recent-chats', JSON.stringify(updatedRecentChats))
    
    const recentIds = updatedRecentChats.map(chat => chat.id)
    
    return recentIds
  } catch (error) {
    return []
  }
}

const shouldShowNavigator = computed(() => {
  if (questions.value.length === 0) return false
  
  if (ENABLE_ALL_CHATS) return true
  
  const currentChatRoomId = questions.value[0]?.chatRoomId
  if (!currentChatRoomId) return false
  
  // 使用工具函數檢查當前聊天室是否在最近列表中
  const recentChatIds = localStorageUtils.getRecentChatIds()
  return recentChatIds.includes(currentChatRoomId)
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

const loadSavedQuestions = () => {
  try {
    const saved = localStorage.getItem('chatjump-saved-questions')
    if (saved) {
      savedQuestions.value = JSON.parse(saved)
    }
    
    const deletedIds = localStorage.getItem('chatjump-deleted-questions')
    if (deletedIds) {
      const idsArray = JSON.parse(deletedIds)
      deletedQuestionIds.value = new Set(idsArray)
    }
  } catch (error) {
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
    const input = document.querySelector('.chat-jump-inline-input')
    if (input) {
      input.focus()
      input.select()
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
  
  // Save deleted IDs to localStorage for persistence
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

const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// localStorage 工具函數
const localStorageUtils = {
  // 獲取最近聊天室數據
  getRecentChats() {
    try {
      const saved = localStorage.getItem('chatjump-recent-chats')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('讀取最近聊天室數據失敗:', error)
      return []
    }
  },

  // 獲取最近聊天室 ID 列表
  getRecentChatIds() {
    return this.getRecentChats().map(chat => chat.id)
  },

  // 保存最近聊天室數據
  saveRecentChats(chatsData) {
    try {
      localStorage.setItem('chatjump-recent-chats', JSON.stringify(chatsData))
      return true
    } catch (error) {
      console.error('保存最近聊天室數據失敗:', error)
      return false
    }
  },

  // 移除指定聊天室
  removeRecentChat(chatId) {
    const recentChats = this.getRecentChats()
    const filteredChats = recentChats.filter(chat => chat.id !== chatId)
    return this.saveRecentChats(filteredChats)
  },

  // 自動填充最近聊天室（僅在 localStorage 為空時）
  autoPopulateIfEmpty() {
    const existingChats = this.getRecentChats()
    
    // 如果已經有聊天室記錄，不執行自動填充
    if (existingChats.length > 0) {
      return false
    }

    // 掃描當前頁面的聊天室
    const chatLinks = document.querySelectorAll('a[href*="/c/"]')
    const foundChats = []
    
    Array.from(chatLinks).forEach(link => {
      if (foundChats.length >= MAX_RECENT_CHATS) return
      
      const href = link.getAttribute('href') || link.href
      const chatId = domUtils.extractChatId(href)
      
      if (chatId && !foundChats.some(chat => chat.id === chatId)) {
        // 嘗試獲取聊天室標題
        let title = ''
        const titleElement = link.querySelector('[title]') || 
                            link.closest('[title]') || 
                            link.parentElement?.querySelector('[title]') ||
                            link.querySelector('[class*="truncate"]') ||
                            link.querySelector('[class*="overflow-hidden"]')
        
        if (titleElement) {
          title = titleElement.getAttribute('title') || 
                  titleElement.textContent?.trim() || 
                  `聊天室 ${chatId.substring(0, 8)}`
        } else {
          title = `聊天室 ${chatId.substring(0, 8)}`
        }

        foundChats.push({
          id: chatId,
          title: title,
          href: href,
          lastAccessed: Date.now()
        })
      }
    })

    // 如果找到聊天室，保存到 localStorage
    if (foundChats.length > 0) {
      this.saveRecentChats(foundChats)
      console.log(`🚀 自動填充了 ${foundChats.length} 個最近聊天室`)
      return true
    }

    return false
  }
}

// DOM 操作工具函數
const domUtils = {
  // 聊天室選擇器配置
  CHAT_SELECTORS: [
    'a[href*="/c/"]',
    '[data-testid*="conversation"]',
    '.group.flex.cursor-pointer',
    'li a[href*="/c/"]',
    'nav a[href*="/c/"]',
    '.sidebar a[href*="/c/"]',
    '[class*="sidebar"] a[href*="/c/"]',
  ],

  // 查找聊天室元素
  findChatElements() {
    for (const selector of this.CHAT_SELECTORS) {
      const items = document.querySelectorAll(selector)
      if (items.length > 0) {
        return Array.from(items)
      }
    }
    return Array.from(document.querySelectorAll('a[href*="/c/"]'))
  },

  // 清理現有指示器
  clearExistingIndicators() {
    const existingIndicators = document.querySelectorAll('.chat-jump-recent-indicator')
    existingIndicators.forEach(element => {
      element.classList.remove('chat-jump-recent-indicator')
      element.removeAttribute('data-chat-id')
      if (element._chatJumpRemoveHandler) {
        element.removeEventListener('click', element._chatJumpRemoveHandler, true)
        delete element._chatJumpRemoveHandler
      }
    })
    return existingIndicators.length
  },

  // 提取聊天室 ID
  extractChatId(href) {
    const chatIdMatch = href.match(/\/c\/([a-f0-9-]+)/)
    return chatIdMatch ? chatIdMatch[1] : null
  },

  // 查找合適的父元素
  findSuitableParent(element) {
    let targetElement = element
    const parentTypes = ['LI', 'group', 'flex', 'menuitem']
    
    for (const type of parentTypes) {
      const parent = element.closest(type.toLowerCase()) || 
                    element.closest(`[class*="${type}"]`)
      if (parent) {
        targetElement = parent
        break
      }
    }
    return targetElement
  }
}

// 點擊事件處理工具函數
const clickHandlerUtils = {
  // 點擊檢測配置
  DOT_OFFSET_FROM_TITLE: 30,
  DOT_EXTEND_BEYOND_TITLE: 15,
  FALLBACK_CLICK_THRESHOLD: 0.7,

  // 創建點擊事件處理器
  createRemoveClickHandler(chatId, targetElement) {
    return (e) => {
      const rect = targetElement.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      // 找到標題元素
      const titleElement = targetElement.querySelector('[class*="truncate"], [class*="overflow-hidden"]')
      
      if (titleElement) {
        const titleRect = titleElement.getBoundingClientRect()
        const titleWidth = titleRect.width
        const dotStartX = titleWidth - this.DOT_OFFSET_FROM_TITLE
        const dotEndX = titleWidth + this.DOT_EXTEND_BEYOND_TITLE
        
        // 主要檢測：點擊在小點點區域內
        if (clickX >= dotStartX && clickX <= dotEndX) {
          e.preventDefault()
          e.stopPropagation()
          removeRecentChat(chatId)
          return false
        }
        
        // 備用檢測：Shift + 點擊右側區域
        if (clickX > rect.width * this.FALLBACK_CLICK_THRESHOLD && e.shiftKey) {
          e.preventDefault()
          e.stopPropagation()
          removeRecentChat(chatId)
          return false
        }
      }
    }
  },

  // 添加點擊事件監聽器
  attachClickHandler(targetElement, chatId) {
    // 移除舊的事件監聽器
    if (targetElement._chatJumpRemoveHandler) {
      targetElement.removeEventListener('click', targetElement._chatJumpRemoveHandler, true)
    }
    
    // 創建並添加新的事件監聽器
    const handler = this.createRemoveClickHandler(chatId, targetElement)
    targetElement._chatJumpRemoveHandler = handler
    targetElement.addEventListener('click', handler, true)
  }
}

// 從 localStorage 中移除指定的聊天室
const removeRecentChat = (chatId) => {
  try {
    // 使用工具函數移除聊天室
    const success = localStorageUtils.removeRecentChat(chatId)
    
    if (success) {
      // 重新更新標示
      setTimeout(() => {
        addRecentChatIndicators()
      }, 100)
      
      console.log(`已從最近聊天室中移除: ${chatId}`)
    }
  } catch (error) {
    console.error('移除聊天室時出錯:', error)
  }
}

const addRecentChatIndicators = () => {
  try {
    // 清理現有指示器
    domUtils.clearExistingIndicators()
    
    // 獲取最近聊天室 IDs
    const recentChatRoomIds = localStorageUtils.getRecentChatIds()
    if (recentChatRoomIds.length === 0) return
    
    // 查找聊天室元素
    const foundItems = domUtils.findChatElements()
    
    foundItems.forEach((item) => {
      const href = item.getAttribute('href') || item.href
      const chatId = domUtils.extractChatId(href)
      
      if (chatId && recentChatRoomIds.includes(chatId)) {
        // 查找合適的父元素
        const targetElement = domUtils.findSuitableParent(item)
        
        // 添加指示器樣式
        targetElement.classList.add('chat-jump-recent-indicator')
        targetElement.style.position = 'relative'
        targetElement.setAttribute('data-chat-id', chatId)
        
        // 添加點擊事件處理器
        clickHandlerUtils.attachClickHandler(targetElement, chatId)
      }
    })
  } catch (error) {
    console.error('添加最近聊天室標示時出錯:', error)
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
    } catch {
      // console.log(`選擇器 "${selector}" 執行時出錯`)
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
  loadSavedQuestions()  
  extractUserQuestions()
  
  setTimeout(() => {
    setupIntersectionObserver()
    detectActiveQuestion()
    
    // 如果 localStorage 為空，自動填充最近聊天室
    const wasPopulated = localStorageUtils.autoPopulateIfEmpty()
    
    // 添加最近聊天室標示
    addRecentChatIndicators()
    
    setTimeout(() => {      
      if (questions.value.length > 0) {
        const latestIndex = questions.value.length - 1
        activeQuestionIndex.value = latestIndex
      }
      
      // 再次確保標示已添加
      addRecentChatIndicators()
      
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
  
  // 創建防抖版本的更新函數
  const debouncedUpdateIndicators = debounce(addRecentChatIndicators, 300)
  
  observer = new MutationObserver((mutations) => {
    let shouldUpdateQuestions = false
    let shouldUpdateIndicators = false
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldUpdateQuestions = true
        
        // 檢查是否有聊天室相關的變化
        const hasRelevantChanges = Array.from(mutation.addedNodes).some(node => 
          node.nodeType === 1 && (
            node.querySelector?.('a[href*="/c/"]') ||
            node.matches?.('a[href*="/c/"]') ||
            node.classList?.contains('__menu-item')
          )
        )
        
        if (hasRelevantChanges) {
          shouldUpdateIndicators = true
        }
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
