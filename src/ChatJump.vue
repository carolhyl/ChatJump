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
  AUTO_SAVE_DELAY,
  CHAT_ROOM_URL_PATTERNS,
  ADD_CLICK_DETECTION_CONFIG
} from './constant/config.js'
import { 
  debounce,
  localStorageUtils,
  recentChatIndicatorManager
} from './utils/chatJumpUtils.js'
import { useSavedQuestions } from './composables/useSavedQuestions.js'
import { useDetectQuestions } from './composables/useDetectQuestions.js'

const showQuestionList = ref(false)
const hoveredQuestionIndex = ref(-1)
const recentChatIds = ref([])

const editingQuestionId = ref(null)
const editingQuestionIndex = ref(-1)
const editingTitle = ref('')
let autoSaveTimer = null

let observer = null
let scrollObserver = null

const lockDialogManager = new LockDialogManager()

const {
  questions,
  activeQuestionIndex,
  extractUserQuestions,
  detectActiveQuestion,
  scrollToQuestion,
  setupIntersectionObserver,
} = useDetectQuestions()

const {
  updateQuestionTitle,
  getDisplayTitle,
  deleteQuestionToLocalStorage,
  ensureSavedQuestion,
  getInitialEditTitle,
} = useSavedQuestions()

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
  
  return recentChatIds.value.includes(currentChatRoomId)
})

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
  const saved = ensureSavedQuestion(question)
  const titleToEdit = getInitialEditTitle(question)
  if (saved) {
    startEditingTitle(saved.id, titleToEdit, questionIndex)
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
  deleteQuestionToLocalStorage(questionId)
  const questionIndex = questions.value.findIndex(question => question.id === questionId)
  if (questionIndex !== -1) {
    questions.value = questions.value.filter((_, index) => index !== questionIndex)
  }
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

onMounted(() => {
  initTheme()

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
  
  window.addEventListener('scroll', directScrollHandler, { passive: true })
  window.addEventListener('resize', detectActiveQuestion)
  
  const debouncedUpdateIndicators = debounce(addRecentChatIndicators, 300)
  
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
  
  scrollObserver = { directScrollHandler }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  if (scrollObserver) {
    window.removeEventListener('scroll', scrollObserver.directScrollHandler)
    window.removeEventListener('resize', detectActiveQuestion)
  }
})

onBeforeUnmount(() => lockDialogManager.destroy())
</script>
