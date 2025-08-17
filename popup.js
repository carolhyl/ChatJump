document.addEventListener('DOMContentLoaded', function () {
  const openChatGPTButton = document.getElementById('open-chatgpt')
  const settingsButton = document.getElementById('settings')
  const statusDot = document.querySelector('.status-dot')
  const statusText = document.querySelector('.status-text')

  openChatGPTButton.addEventListener('click', function () {
    chrome.tabs.create({
      url: 'https://chatgpt.com/'
    })
    window.close()
  })

  settingsButton.addEventListener('click', function () {
    alert('設定功能即將推出！')
  })

  chrome.tabs.query({ url: ['https://chat.openai.com/*', 'https://chatgpt.com/*'] }, function (tabs) {
    if (tabs.length > 0) {
      statusDot.style.background = '#10b981' // Green
      statusText.textContent = 'ChatGPT 已開啟'
      openChatGPTButton.textContent = '切換到 ChatGPT'

      openChatGPTButton.addEventListener('click', function (e) {
        e.preventDefault()
        chrome.tabs.update(tabs[0].id, { active: true })
        chrome.windows.update(tabs[0].windowId, { focused: true })
        window.close()
      })
    } else {
      statusDot.style.background = '#f59e0b' // Orange
      statusText.textContent = '等待連接'
    }
  })

  const featureItems = document.querySelectorAll('.feature-item')
  featureItems.forEach((item, index) => {
    item.style.animationDelay = `${index * 0.1}s`
    item.classList.add('fade-in')
  })

  const buttons = document.querySelectorAll('button')
  buttons.forEach(button => {
    button.addEventListener('mousedown', function () {
      this.style.transform = 'translateY(0px) scale(0.98)'
    })

    button.addEventListener('mouseup', function () {
      this.style.transform = 'translateY(-1px) scale(1)'
    })

    button.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(-1px) scale(1)'
    })
  })
})

const style = document.createElement('style')
style.textContent = `
    .fade-in {
        animation: fadeInUp 0.5s ease-out forwards;
        opacity: 0;
        transform: translateY(10px);
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`
document.head.appendChild(style)
