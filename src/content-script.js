
const script = document.createElement('script')
script.src = chrome.runtime.getURL('src/main.js')
script.type = 'module'
script.onload = () => console.log('🚀 Content script 開始執行!')

// 直接注入關鍵樣式
const style = document.createElement('style')
style.textContent = `
/* GPT Jump Navigator 樣式 - 使用高特異性選擇器 */
body div.chat-jump-navigator-container {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 999999;
  pointer-events: auto;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-navigator {
  width: 60px;
  max-height: 70vh;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  backdrop-filter: blur(10px);
  overflow: hidden;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-nav-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 12px 12px 0 0;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin: 0;
  line-height: 1.2;
}

body div.chat-jump-navigator-container .chat-jump-nav-items {
  max-height: calc(70vh - 40px);
  overflow-y: auto;
  padding: 4px 0;
  margin: 0;
}

body div.chat-jump-navigator-container .chat-jump-collapsed-info {
  text-align: center;
  padding: 8px 4px;
  margin: 0;
}

body div.chat-jump-navigator-container .chat-jump-question-count {
  font-size: 18px;
  font-weight: bold;
  color: #667eea;
  line-height: 1;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-count-label {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-indicators {
  margin-top: 8px;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-indicators-container {
  position: relative;
  transition: all 0.3s ease;
}

body div.chat-jump-navigator-container .chat-jump-ellipsis-top,
body div.chat-jump-navigator-container .chat-jump-ellipsis-bottom {
  text-align: center;
  padding: 2px 0;
  margin: 1px 0;
}

body div.chat-jump-navigator-container .chat-jump-ellipsis-dots {
  font-size: 12px;
  color: #999;
  line-height: 1;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-ellipsis-count {
  font-size: 8px;
  color: #bbb;
  line-height: 1;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-nav-item {
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 2px 4px;
  border-radius: 6px;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-nav-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

body div.chat-jump-navigator-container .chat-jump-nav-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  min-height: 40px;
  justify-content: center;
}

body div.chat-jump-navigator-container .chat-jump-dash-icon {
  width: 20px;
  height: 3px;
  background-color: #667eea;
  border-radius: 2px;
  transition: all 0.3s ease;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-dash-icon.active {
  width: 28px;
  height: 4px;
  background-color: #ff6b6b;
  box-shadow: 0 0 8px rgba(255, 107, 107, 0.4);
}

body div.chat-jump-navigator-container .chat-jump-question-number {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-question-list-expanded {
  position: absolute;
  right: 68px;
  top: 50%;
  transform: translateY(-50%);
  width: 300px;
  max-height: 70vh;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  z-index: 1000000;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-question-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: transparent;
  margin: 0;
}

body div.chat-jump-navigator-container .chat-jump-question-item:last-child {
  border-bottom: none;
}

body div.chat-jump-navigator-container .chat-jump-question-item-hovered {
  background-color: #f8f9fa;
}

body div.chat-jump-navigator-container .chat-jump-question-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-question-number-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-question-text {
  font-size: 13px;
  line-height: 1.4;
  color: #333;
  flex: 1;
  word-break: break-word;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-ellipsis-indicator {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: rgba(102, 126, 234, 0.05);
  text-align: center;
  margin: 0;
}

body div.chat-jump-navigator-container .chat-jump-ellipsis-text {
  font-size: 18px;
  color: #667eea;
  font-weight: bold;
  margin-bottom: 4px;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-ellipsis-count {
  font-size: 11px;
  color: #888;
  margin: 0;
  padding: 0;
}

body div.chat-jump-navigator-container .chat-jump-no-questions {
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
  margin: 0;
}
`
document.head.appendChild(style)

// 載入主要的 Vue 應用
const script2 = document.createElement('script')
script2.src = chrome.runtime.getURL('src/main.js')
script2.type = 'module'
document.head.appendChild(script2)

// 載入樣式
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = chrome.runtime.getURL('src/style.css')
document.head.appendChild(link)

console.log('✅ Content script 載入完成!')
link.onerror = (e) => console.error('❌ style.css 載入失敗:', e)

console.log('📝 Content Script 執行完成，已注入腳本和樣式')