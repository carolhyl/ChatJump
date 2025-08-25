import { ref } from 'vue'
import {
  MAX_RECENT_CHATS,
  ADD_CLICK_DETECTION_CONFIG,
  CHAT_ROOM_URL_PATTERNS,
} from '../constant/config.js'
import {
  localStorageUtils,
  recentChatIndicatorManager,
} from '../utils/chatJumpUtils.js'

export function useRecentChats() {
  const recentChatIds = ref([])

  const getCurrentChatRoomId = () => {
    const url = window.location.href
    for (const pattern of CHAT_ROOM_URL_PATTERNS) {
      const match = url.match(pattern)
      if (match && match[1]) return match[1]
    }
    return null
  }

  const syncRecentChatIds = () => {
    const currentIds = localStorageUtils.getRecentChatIds('chatjump-recent-chats')
    recentChatIds.value = currentIds
  }

  const removeRecentChat = (chatId) => {
    recentChatIndicatorManager.removeChat(chatId, {
      removeCallback: removeRecentChat,
      addCallback: (id, title, href) => addRecentChat(id, title, href),
    })
    syncRecentChatIds()
  }

  const addRecentChat = (chatId, title, href, extractFn) => {
    const success = recentChatIndicatorManager.addChat(chatId, title, href, {
      removeCallback: removeRecentChat,
      addCallback: (id, t, h) => addRecentChat(id, t, h, extractFn),
    })
    if (success) {
      syncRecentChatIds()
      const currentChatRoomId = getCurrentChatRoomId()
      if (extractFn && chatId === currentChatRoomId) {
        setTimeout(() => {
          extractFn()
        }, ADD_CLICK_DETECTION_CONFIG.NAVIGATOR_ENABLE_DELAY)
      }
    }
    return success
  }

  const initRecentChats = (extractFn) => {
    localStorageUtils.autoPopulateIfEmpty(MAX_RECENT_CHATS, 'chatjump-recent-chats')
    recentChatIndicatorManager.addIndicators({
      storageKey: 'chatjump-recent-chats',
      removeCallback: removeRecentChat,
      addCallback: (id, title, href) => addRecentChat(id, title, href, extractFn),
    })
    syncRecentChatIds()
  }

  const refreshIndicators = (extractFn) => {
    recentChatIndicatorManager.addIndicators({
      storageKey: 'chatjump-recent-chats',
      removeCallback: removeRecentChat,
      addCallback: (id, title, href) => addRecentChat(id, title, href, extractFn),
    })
    syncRecentChatIds()
  }

  return {
    // state
    recentChatIds,
    // utils
    getCurrentChatRoomId,
    syncRecentChatIds,
    initRecentChats,
    refreshIndicators,
    addRecentChat,
    removeRecentChat,
  }
}
