
const script = document.createElement('script')
script.src = chrome.runtime.getURL('src/main.js')
script.type = 'module'
document.head.appendChild(script)

const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = chrome.runtime.getURL('src/style.css')
document.head.appendChild(link)