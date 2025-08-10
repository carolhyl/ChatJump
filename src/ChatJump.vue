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
    <!-- 摺疊狀態：顯示問題數量 -->
    <div class="chat-jump-nav-items">
      <div class="chat-jump-collapsed-info">
        <div class="chat-jump-question-count">{{ questions.length }}</div>
        <div class="chat-jump-count-label">個問題</div>
      </div>
      
      <!-- 問題指示器 - 智能視窗，最新在底部 -->
      <div class="chat-jump-indicators">
        
        <!-- 指示器容器 - 統一處理 hover 事件 -->
        <div 
          class="chat-jump-indicators-container"
          @mouseenter="handleIndicatorHover"
          @mouseleave="showAllQuestions = false"
        >
          <!-- 上方省略指示器 - 可 hover 展開 -->
          <div 
            v-if="visibleStartIndex > 0 && !showAllQuestions"
            class="chat-jump-ellipsis-top"
            style="cursor: pointer;"
          >
            <div class="chat-jump-ellipsis-dots">⋯</div>
            <div class="chat-jump-ellipsis-count">{{ visibleStartIndex }}</div>
          </div>
          
          <!-- 顯示問題指示器 - 根據狀態決定顯示範圍 -->
          <div 
            v-for="(question, index) in (showAllQuestions ? questions : visibleQuestions)" 
            :key="showAllQuestions ? index : (visibleStartIndex + index)"
            class="chat-jump-nav-item"
          >
            <div class="chat-jump-nav-icon">
              <div 
                class="chat-jump-dash-icon"
                :class="{ 'active': activeQuestionIndex === (showAllQuestions ? index : (visibleStartIndex + index)) }"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Fallback: 如果 visibleQuestions 為空但有問題，顯示所有問題 -->
        <div 
          v-if="visibleQuestions.length === 0 && questions.length > 0"
          style="color: red; font-size: 10px; margin: 4px 0;"
        >
          Fallback: 顯示所有問題
        </div>
        <div 
          v-if="visibleQuestions.length === 0 && questions.length > 0"
          v-for="(question, index) in questions" 
          :key="'fallback-' + index"
          class="chat-jump-nav-item"
        >
          <div class="chat-jump-nav-icon">
            <div 
              class="chat-jump-dash-icon"
              :class="{ 'active': activeQuestionIndex === index }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <div 
      v-if="showQuestionList && questions.length > 0"
      class="chat-jump-question-list-expanded"
    >
      <!-- 完整問題列表 -->
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

// 智能顯示：最新問題在底部，限制可見數量
const calculateSmartViewport = () => {
  if (questions.value.length === 0) {
    visibleStartIndex.value = 0
    visibleEndIndex.value = 0
    return
  }
  
  // 計算最大可顯示的問題數量（基於視窗高度）
  const maxVisibleHeight = 60 * 0.4 * window.innerHeight / 100 // 40% 視窗高度
  const itemHeight = 25 // 每個指示器的高度
  let maxVisibleItems = Math.floor(maxVisibleHeight / itemHeight)
  
  // 強制限制最大顯示數量，確保智能視窗邏輯生效
  maxVisibleItems = Math.min(maxVisibleItems, 8) // 最多顯示 8 個問題
  
  if (questions.value.length <= maxVisibleItems) {
    // 所有問題都能顯示
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
      
      // 邊界處理
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
  
  console.log('✅ 智能視窗計算完成，最新在底部:', {
    totalQuestions: questions.value.length,
    maxVisibleItems,
    visibleStart: visibleStartIndex.value,
    visibleEnd: visibleEndIndex.value,
    latestQuestionIndex: questions.value.length - 1
  })
}

// 獲取可見的問題列表
const visibleQuestions = computed(() => {
  const result = questions.value.slice(visibleStartIndex.value, visibleEndIndex.value + 1)
  console.log('🔍 可見問題列表:', {
    totalQuestions: questions.value.length,
    visibleStart: visibleStartIndex.value,
    visibleEnd: visibleEndIndex.value,
    visibleCount: result.length,
    activeIndex: activeQuestionIndex.value
  })
  return result
})

// 截斷文字函數
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 處理指示器 hover 事件
const handleIndicatorHover = () => {
  console.log('🔄 Hover 指示器容器觸發', {
    visibleStartIndex: visibleStartIndex.value,
    showAllQuestions: showAllQuestions.value,
    totalQuestions: questions.value.length
  })
  
  if (visibleStartIndex.value > 0) {
    showAllQuestions.value = true
    console.log('✅ 展開所有問題，從', visibleStartIndex.value, '個隱藏問題')
  } else {
    console.log('⚠️ 沒有隱藏問題，不需要展開')
  }
}

// 檢測當前窗口內的問題
const detectActiveQuestion = () => {
  const currentTime = Date.now()
  const currentScrollY = window.scrollY
  
  // 計算滾動速度
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
  
  // 如果檢測到有效的問題，才更新 active 狀態
  if (closestIndex !== -1) {
    activeQuestionIndex.value = closestIndex
  } else {
    // 如果檢測不到問題，保持最新問題為 active（防止跳來跳去）
    if (questions.value.length > 0 && activeQuestionIndex.value === -1) {
      activeQuestionIndex.value = questions.value.length - 1
      console.log('🎯 檢測不到問題，保持最新問題為 active:', activeQuestionIndex.value)
    }
  }
  
  // 如果 active 問題改變，重新計算智能視窗
  if (previousActiveIndex !== activeQuestionIndex.value) {
    calculateSmartViewport()
  }
}

// 滾動到指定問題
const scrollToQuestion = (element) => {
  if (element) {
    // 開始滾動前立即檢測一次
    detectActiveQuestion()
    
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    })
    
    // 在滾動過程中持續檢測 active 狀態
    const scrollCheckInterval = setInterval(() => {
      detectActiveQuestion()
    }, 50) // 每 50ms 檢測一次，確保滾動過程中實時更新
    
    // 滾動完成後停止檢測（大約 1 秒後）
    setTimeout(() => {
      clearInterval(scrollCheckInterval)
      // 最後再檢測一次確保狀態正確
      detectActiveQuestion()
    }, 1000)
    
    // 添加高亮效果
    element.style.transition = 'background-color 0.5s ease'
    element.style.backgroundColor = '#fff3cd'
    setTimeout(() => {
      element.style.backgroundColor = ''
    }, 2000)
  }
}

// 提取使用者問題
const extractUserQuestions = () => {
  console.log('🔍 開始搜尋使用者問題...')
  
  // ChatGPT 使用者訊息的最新選擇器（基於 2024 年結構）
  const userSelectors = [
    // 主要選擇器：整個 article 容器
    'article[data-testid*="conversation-turn"][data-turn="user"]',
    // 備用選擇器：message 容器
    '[data-message-author-role="user"]',
    // 更具體的選擇器：包含使用者訊息的 div
    'div[data-message-author-role="user"]',
    // 舊版本相容選擇器
    '.group[data-testid*="conversation-turn"]:has([data-message-author-role="user"])',
  ]
  
  const foundQuestions = []
  
  userSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector)
      console.log(`選擇器 "${selector}" 找到 ${elements.length} 個元素`)
      
      elements.forEach((element, index) => {
        // 嘗試多種方式提取文字內容
        let questionText = ''
        
        // 方法1: 尋找 whitespace-pre-wrap 容器（最新結構）
        const preWrapContainer = element.querySelector('.whitespace-pre-wrap')
        if (preWrapContainer && preWrapContainer.textContent.trim()) {
          questionText = preWrapContainer.textContent.trim()
        }
        
        // 方法2: 尋找 user-message-bubble-color 容器
        if (!questionText) {
          const bubbleContainer = element.querySelector('.user-message-bubble-color')
          if (bubbleContainer && bubbleContainer.textContent.trim()) {
            questionText = bubbleContainer.textContent.trim()
          }
        }
        
        // 方法3: 尋找 data-message-author-role="user" 內的文字
        if (!questionText) {
          const messageContainer = element.querySelector('[data-message-author-role="user"]')
          if (messageContainer) {
            const textDiv = messageContainer.querySelector('.whitespace-pre-wrap')
            if (textDiv && textDiv.textContent.trim()) {
              questionText = textDiv.textContent.trim()
            }
          }
        }
        
        // 方法4: 直接取 textContent（備用方案）
        if (!questionText && element.textContent && element.textContent.trim()) {
          questionText = element.textContent.trim()
          // 清理多餘的文字（如按鈕文字等）
          questionText = questionText.replace(/複製|編輯訊息|你說：/g, '').trim()
        }
        
        // 方法5: 尋找其他可能的文字容器
        if (!questionText) {
          const textContainers = element.querySelectorAll('div, p, span')
          textContainers.forEach(container => {
            const text = container.textContent?.trim()
            if (text && text.length > questionText.length && text.length < 1000) {
              // 避免選到按鈕或其他 UI 元素的文字
              if (!text.match(/複製|編輯訊息|你說：|aria-label|data-testid/)) {
                questionText = text
              }
            }
          })
        }
        
        // 過濾掉太短或太長的文字，以及明顯不是問題的內容
        if (questionText && 
            !questionText.includes('ChatGPT') &&
            !questionText.includes('OpenAI')) {
          
          // 為元素添加 ID 以便滾動定位
          const questionId = `user-question-${foundQuestions.length}`
          element.id = questionId
          
          foundQuestions.push({
            text: questionText,
            element: element,
            id: questionId,
            index: foundQuestions.length
          })
          
          console.log(`找到問題 ${foundQuestions.length}:`, questionText.substring(0, 50) + '...')
        }
      })
    } catch (error) {
      console.log(`選擇器 "${selector}" 執行時出錯:`, error)
    }
  })
  
  // 去重複（基於文字內容）
  const uniqueQuestions = []
  const seenTexts = new Set()
  
  foundQuestions.forEach(q => {
    const normalizedText = q.text.toLowerCase().replace(/\s+/g, ' ').trim()
    if (!seenTexts.has(normalizedText)) {
      seenTexts.add(normalizedText)
      uniqueQuestions.push(q)
    }
  })
  
  console.log(`✅ 總共找到 ${uniqueQuestions.length} 個獨特的使用者問題`)
  questions.value = uniqueQuestions
  
  // 初始化時檢測當前 active 問題，如果沒有則設置最新問題為 active
  if (uniqueQuestions.length > 0) {
    detectActiveQuestion()
    
    // 如果沒有檢測到 active 問題，強制設置最新問題為 active
    if (activeQuestionIndex.value === -1) {
      const latestQuestionIndex = uniqueQuestions.length - 1
      console.log('🎯 沒有檢測到 active 問題，設置最新問題為 active:', latestQuestionIndex)
      activeQuestionIndex.value = latestQuestionIndex
    }
  }
  
  // 初始化智能視窗 - 這會處理 activeQuestionIndex === -1 的情況
  calculateSmartViewport()
}

// 組件掛載時開始監聽
onMounted(() => {
  console.log('🎯 ChatJump 組件已掛載')
  
  // 初次提取問題
  extractUserQuestions()
  
  // 初次設置 Intersection Observer
  setTimeout(() => {
    setupIntersectionObserver()
    detectActiveQuestion()
    
    // 強制重新計算智能視窗，確保顯示正確
    setTimeout(() => {
      console.log('🔄 強制重新計算智能視窗以確保正確顯示')
      
      // 確保最新問題始終為 active（不依賴檢測結果）
      if (questions.value.length > 0) {
        const latestIndex = questions.value.length - 1
        console.log('🎯 強制設置最新問題為 active:', latestIndex)
        activeQuestionIndex.value = latestIndex
      }
      
      calculateSmartViewport()
    }, 500)
  }, 1000) // 等待問題提取完成
  
  // 設置滾動事件監聽器 - 使用最直接的方法
  const handleScroll = () => {
    detectActiveQuestion()
  }
  
  // 使用 Intersection Observer 作為主要檢測機制
  let intersectionObserver = null
  const setupIntersectionObserver = () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect()
    }
    
    intersectionObserver = new IntersectionObserver((entries) => {
      // 當任何問題進入或離開視窗時，重新檢測
      detectActiveQuestion()
    }, {
      root: null,
      rootMargin: '0px',
      threshold: [0, 0.1, 0.5, 0.9, 1.0] // 多個閾值確保更敏感的檢測
    })
    
    // 觀察所有問題元素
    questions.value.forEach(question => {
      if (question.element) {
        intersectionObserver.observe(question.element)
      }
    })
  }
  
  // 備用滾動監聽，確保萬無一失
  let scrollTimeout = null
  const directScrollHandler = () => {
    // 立即檢測
    detectActiveQuestion()
    
    // 延遲檢測，處理快速滾動後的狀態
    if (scrollTimeout) clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      detectActiveQuestion()
    }, 100)
  }
  
  // 使用直接滾動監聽 + Intersection Observer 雙重機制
  window.addEventListener('scroll', directScrollHandler, { passive: true })
  window.addEventListener('resize', handleScroll) // 窗口大小改變時也需要重新檢測
  
  // 設置 MutationObserver 監聽 DOM 變化
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
        // 問題更新後重新設置 Intersection Observer
        setTimeout(() => {
          setupIntersectionObserver()
          detectActiveQuestion()
        }, 100)
      }, 500) // 延遲 500ms 讓內容完全載入
    }
  })
  
  // 開始監聽整個文檔的變化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  
  // 保存監聽器引用以便清理
  scrollObserver = { directScrollHandler, intersectionObserver }
})

// 組件卸載時清理
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

<style>
/* 容器樣式 - 使用高特異性避免被覆蓋 */
.chat-jump-navigator-container {
  position: fixed !important;
  right: 20px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 999999 !important;
  pointer-events: auto !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 摺疊狀態導航器 */
.chat-jump-navigator {
  width: 60px !important;
  max-height: 70vh !important;
  background: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid #e1e5e9 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  backdrop-filter: blur(10px) !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 導航標題 */
.chat-jump-nav-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  padding: 8px 12px !important;
  border-radius: 12px 12px 0 0 !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-align: center !important;
  margin: 0 !important;
  line-height: 1.2 !important;
}

.chat-jump-nav-title {
  color: white !important;
}

/* 導航項目容器 */
.chat-jump-nav-items {
  max-height: calc(70vh - 40px) !important;
  overflow-y: auto !important;
  padding: 4px 0 !important;
  margin: 0 !important;
}

/* 摺疊狀態資訊 */
.chat-jump-collapsed-info {
  text-align: center !important;
  padding: 8px 4px !important;
  margin: 0 !important;
}

.chat-jump-question-count {
  font-size: 18px !important;
  font-weight: bold !important;
  color: #667eea !important;
  line-height: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.chat-jump-count-label {
  font-size: 10px !important;
  color: #888 !important;
  margin-top: 2px !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 指示器容器 */
.chat-jump-indicators {
  margin-top: 8px !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 指示器內部容器 - 處理 hover 展開 */
.chat-jump-indicators-container {
  position: relative !important;
  transition: all 0.3s ease !important;
}

/* 省略指示器 */
.chat-jump-ellipsis-top,
.chat-jump-ellipsis-bottom {
  text-align: center !important;
  padding: 2px 0 !important;
  margin: 1px 0 !important;
}

.chat-jump-ellipsis-dots {
  font-size: 12px !important;
  color: #999 !important;
  line-height: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.chat-jump-ellipsis-count {
  font-size: 8px !important;
  color: #bbb !important;
  line-height: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 單個導航項目 */
.chat-jump-nav-item {
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  margin: 2px 4px !important;
  border-radius: 6px !important;
  padding: 0 !important;
}

.chat-jump-nav-item:hover {
  background: rgba(102, 126, 234, 0.1) !important;
}

/* 導航圖示容器 */
.chat-jump-nav-icon {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  padding: 8px 4px !important;
  min-height: 40px !important;
  justify-content: center !important;
}

/* 自定義 div 圖示 */
.chat-jump-dash-icon {
  width: 20px !important;
  height: 3px !important;
  background-color: #667eea !important;
  border-radius: 2px !important;
  transition: all 0.3s ease !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 當前問題的圖示樣式 */
.chat-jump-dash-icon.active {
  width: 28px !important;
  height: 4px !important;
  background-color: #ff6b6b !important;
  box-shadow: 0 0 8px rgba(255, 107, 107, 0.4) !important;
}

/* 問題編號 */
.chat-jump-question-number {
  font-size: 10px !important;
  color: #666 !important;
  margin-top: 2px !important;
  padding: 0 !important;
}

/* 展開的問題列表 - 中心展開 */
.chat-jump-question-list-expanded {
  position: absolute !important;
  right: 68px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 300px !important;
  max-height: 70vh !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  overflow-y: auto !important;
  z-index: 1000000 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 問題項目 */
.chat-jump-question-item {
  padding: 12px 16px !important;
  border-bottom: 1px solid #f0f0f0 !important;
  cursor: pointer !important;
  transition: background-color 0.2s ease !important;
  background-color: transparent !important;
  margin: 0 !important;
}

.chat-jump-question-item:last-child {
  border-bottom: none !important;
}

.chat-jump-question-item-hovered {
  background-color: #f8f9fa !important;
}

/* 問題內容容器 */
.chat-jump-question-content {
  display: flex !important;
  align-items: flex-start !important;
  gap: 12px !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 問題編號徽章 */
.chat-jump-question-number-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  border-radius: 50% !important;
  width: 24px !important;
  height: 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  flex-shrink: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 問題文字 */
.chat-jump-question-text {
  font-size: 13px !important;
  line-height: 1.4 !important;
  color: #333 !important;
  flex: 1 !important;
  word-break: break-word !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 省略號指示器 */
.chat-jump-ellipsis-indicator {
  padding: 12px 16px !important;
  border-bottom: 1px solid #f0f0f0 !important;
  background: rgba(102, 126, 234, 0.05) !important;
  text-align: center !important;
  margin: 0 !important;
}

.chat-jump-ellipsis-text {
  font-size: 18px !important;
  color: #667eea !important;
  font-weight: bold !important;
  margin-bottom: 4px !important;
  margin: 0 !important;
  padding: 0 !important;
}

.chat-jump-ellipsis-count {
  font-size: 11px !important;
  color: #888 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 沒有問題時的提示 */
.chat-jump-no-questions {
  padding: 20px !important;
  text-align: center !important;
  color: #666 !important;
  font-size: 14px !important;
  margin: 0 !important;
}

.chat-jump-loading {
  color: #666 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 滾動條樣式 */
.chat-jump-nav-items::-webkit-scrollbar,
.chat-jump-question-list-expanded::-webkit-scrollbar {
  width: 4px !important;
}

.chat-jump-nav-items::-webkit-scrollbar-track,
.chat-jump-question-list-expanded::-webkit-scrollbar-track {
  background: transparent !important;
}

.chat-jump-nav-items::-webkit-scrollbar-thumb,
.chat-jump-question-list-expanded::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2) !important;
  border-radius: 2px !important;
}

.chat-jump-nav-items::-webkit-scrollbar-thumb:hover,
.chat-jump-question-list-expanded::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3) !important;
}
</style>