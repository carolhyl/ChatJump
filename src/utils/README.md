# ChatJump Utils - 獨立工具函數庫

這是一個完全獨立、無外部依賴的工具函數庫，專為聊天室最近記錄管理而設計。可以在任何項目中重複使用。

## 📦 包含的工具

### 1. `localStorageUtils` - localStorage 操作工具
- `getRecentChats(storageKey)` - 獲取最近聊天室數據
- `getRecentChatIds(storageKey)` - 獲取最近聊天室 ID 列表
- `saveRecentChats(chatsData, storageKey)` - 保存最近聊天室數據
- `removeRecentChat(chatId, storageKey)` - 移除指定聊天室
- `autoPopulateIfEmpty(maxChats, storageKey, customSelectors)` - 自動填充（僅在空時）

### 2. `domUtils` - DOM 操作工具
- `findChatElements(customSelectors)` - 查找聊天室元素
- `clearExistingIndicators(indicatorClass)` - 清理現有指示器
- `extractChatId(href)` - 提取聊天室 ID
- `findSuitableParent(element, parentTypes)` - 查找合適的父元素

### 3. `clickHandlerUtils` - 點擊事件處理工具
- `createRemoveClickHandler(chatId, targetElement, removeCallback, config)` - 創建點擊處理器
- `attachClickHandler(targetElement, chatId, removeCallback, config)` - 添加點擊監聽器

### 4. `recentChatIndicatorManager` - 組合管理器
- `addIndicators(options)` - 添加最近聊天室指示器
- `removeChat(chatId, options)` - 移除聊天室並更新指示器

## 🚀 使用示例

### 基本使用

```javascript
import { localStorageUtils, recentChatIndicatorManager } from './chatJumpUtils.js'

// 初始化最近聊天室指示器
recentChatIndicatorManager.addIndicators({
  storageKey: 'my-recent-chats',
  indicatorClass: 'my-indicator',
  removeCallback: (chatId) => {
    console.log('移除聊天室:', chatId)
    recentChatIndicatorManager.removeChat(chatId, {
      storageKey: 'my-recent-chats'
    })
  }
})

// 自動填充（僅在 localStorage 為空時）
localStorageUtils.autoPopulateIfEmpty(5, 'my-recent-chats')
```

### 自定義配置

```javascript
import { 
  recentChatIndicatorManager, 
  CLICK_DETECTION_CONFIG 
} from './chatJumpUtils.js'

// 自定義點擊檢測配置
const customConfig = {
  ...CLICK_DETECTION_CONFIG,
  DOT_OFFSET_FROM_TITLE: 40,
  DOT_EXTEND_BEYOND_TITLE: 20
}

// 使用自定義配置
recentChatIndicatorManager.addIndicators({
  config: customConfig,
  customSelectors: ['a[href*="/chat/"]', '.chat-item'],
  removeCallback: handleRemoveChat
})
```

### 手動操作 localStorage

```javascript
import { localStorageUtils } from './chatJumpUtils.js'

// 獲取最近聊天室
const recentChats = localStorageUtils.getRecentChats('my-storage-key')

// 添加新聊天室
const newChat = {
  id: 'chat-123',
  title: '我的聊天室',
  href: '/c/chat-123',
  lastAccessed: Date.now()
}
const updatedChats = [...recentChats, newChat].slice(0, 3)
localStorageUtils.saveRecentChats(updatedChats, 'my-storage-key')

// 移除特定聊天室
localStorageUtils.removeRecentChat('chat-123', 'my-storage-key')
```

## 🎨 CSS 樣式要求

工具函數會添加 CSS 類名，你需要提供對應的樣式：

```css
.chat-jump-recent-indicator [class*="truncate"]::after,
.chat-jump-recent-indicator [class*="overflow-hidden"]::after {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #ED8742;
  border-radius: 50%;
  margin-left: 15px;
  vertical-align: middle;
  opacity: 0.8;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  z-index: 1001;
}

.chat-jump-recent-indicator:hover [class*="truncate"]::after,
.chat-jump-recent-indicator:hover [class*="overflow-hidden"]::after {
  opacity: 1;
  content: '−';
  background-color: #f44336;
  color: white;
  width: 14px;
  height: 14px;
  font-size: 10px;
  line-height: 14px;
  text-align: center;
  font-weight: bold;
}
```

## 🔧 配置選項

### CLICK_DETECTION_CONFIG
```javascript
{
  DOT_OFFSET_FROM_TITLE: 30,     // 從標題右側往左的偏移量
  DOT_EXTEND_BEYOND_TITLE: 15,   // 超出標題右側的範圍
  FALLBACK_CLICK_THRESHOLD: 0.7  // 備用點擊檢測的右側區域比例
}
```

### CHAT_SELECTORS
```javascript
[
  'a[href*="/c/"]',                    // 直接選擇聊天室連結
  '[data-testid*="conversation"]',     // 可能的測試 ID
  '.group.flex.cursor-pointer',        // 可能的 Tailwind CSS 類組合
  'li a[href*="/c/"]',                 // 列表項中的聊天室連結
  'nav a[href*="/c/"]',                // 導航中的聊天室連結
  '.sidebar a[href*="/c/"]',           // 側邊欄中的聊天室連結
  '[class*="sidebar"] a[href*="/c/"]', // 包含 sidebar 類名的元素中的連結
]
```

## 🌟 特點

- ✅ **零依賴** - 不依賴任何外部庫
- ✅ **模組化** - 可以單獨使用任何工具函數
- ✅ **可配置** - 支援自定義選擇器、樣式類名、存儲鍵等
- ✅ **錯誤處理** - 完整的 try-catch 錯誤處理
- ✅ **TypeScript 友好** - 清晰的參數類型和返回值
- ✅ **瀏覽器兼容** - 支援現代瀏覽器的 ES6+ 特性

## 📄 授權

MIT License - 可自由使用於任何項目
