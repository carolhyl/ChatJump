import { createApp } from 'vue'
import ChatJump from './ChatJump.vue'

console.log('🚀 main.js 開始執行!')

const mount = () => {
  console.log('🔧 開始掛載 Vue 應用...')
  
  // 創建懸浮的根元素，不影響頁面佈局
  const root = document.createElement('div')
  root.id = 'gpt-jump-root'
  root.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 999999;
    pointer-events: none;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
  `
  
  // 確保在頁面載入後再掛載
  if (document.body) {
    document.body.appendChild(root)
    console.log('✅ Root 元素已添加到 DOM')
    
    const app = createApp(ChatJump)
    app.mount(root)
    console.log('✅ Vue 應用已掛載!')
  } else {
    console.log('⚠️ document.body 尚未準備好，延遲掛載...')
    setTimeout(mount, 100)
  }
}

// 確保 DOM 已載入
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}