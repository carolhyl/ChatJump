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

        // 如果 URL 中沒有找到，使用 pathname 作為備用 ID
        const pathname = window.location.pathname
        if (pathname && pathname !== '/') {
            return pathname.replace(/[^a-zA-Z0-9-]/g, '-').replace(/^-+|-+$/g, '')
        }

        return 'default-chat'
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