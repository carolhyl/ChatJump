import {
    CHAT_SELECTORS,
    CLICK_DETECTION_CONFIG,
    DEFAULT_STORAGE_KEY,
} from '../constant/config.js'

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
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

/**
 * localStorage operation utilities
 */
export const localStorageUtils = {
    /**
     * Get recent chat room data
     * @param {string} storageKey - localStorage key name
     * @returns {Array} Array of chat room data
     */
    getRecentChats(storageKey = DEFAULT_STORAGE_KEY) {
        try {
            const saved = localStorage.getItem(storageKey)
            return saved ? JSON.parse(saved) : []
        } catch (error) {
            console.error('Failed to read recent chat room data:', error)
            return []
        }
    },

    /**
     * Get recent chat room ID list
     * @param {string} storageKey - localStorage key name
     * @returns {Array} Array of chat room IDs
     */
    getRecentChatIds(storageKey = DEFAULT_STORAGE_KEY) {
        return this.getRecentChats(storageKey).map(chat => chat.id)
    },

    /**
     * Save recent chat room data
     * @param {Array} chatsData - Array of chat room data
     * @param {string} storageKey - localStorage key name
     * @returns {boolean} Whether save was successful
     */
    saveRecentChats(chatsData, storageKey = DEFAULT_STORAGE_KEY) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(chatsData))
            return true
        } catch (error) {
            console.error('Failed to save recent chat room data:', error)
            return false
        }
    },

    /**
     * Remove specified chat room
     * @param {string} chatId - Chat room ID
     * @param {string} storageKey - localStorage key name
     * @returns {boolean} Whether removal was successful
     */
    removeRecentChat(chatId, storageKey = DEFAULT_STORAGE_KEY) {
        const recentChats = this.getRecentChats(storageKey)
        const filteredChats = recentChats.filter(chat => chat.id !== chatId)
        return this.saveRecentChats(filteredChats, storageKey)
    },

    /**
     * Auto-populate recent chat rooms (only when localStorage is empty)
     * @param {number} maxChats - Maximum number of chat rooms
     * @param {string} storageKey - localStorage key name
     * @param {Array} customSelectors - Custom selectors (optional)
     * @returns {boolean} Whether auto-population was executed
     */
    autoPopulateIfEmpty(maxChats = 3, storageKey = DEFAULT_STORAGE_KEY, customSelectors = null) {
        const existingChats = this.getRecentChats(storageKey)

        if (existingChats.length > 0) {
            return false
        }

        const chatLinks = document.querySelectorAll('a[href*="/c/"]')
        const foundChats = []

        Array.from(chatLinks).forEach(link => {
            if (foundChats.length >= maxChats) return

            const href = link.getAttribute('href') || link.href
            const chatIdMatch = href.match(/\/c\/([a-f0-9-]+)/)
            const chatId = chatIdMatch ? chatIdMatch[1] : null

            if (chatId && !foundChats.some(chat => chat.id === chatId)) {
                let title = ''
                const titleElement = link.querySelector('[title]') ||
                    link.closest('[title]') ||
                    link.parentElement?.querySelector('[title]') ||
                    link.querySelector('[class*="truncate"]') ||
                    link.querySelector('[class*="overflow-hidden"]')

                if (titleElement) {
                    title = titleElement.getAttribute('title') ||
                        titleElement.textContent?.trim() ||
                        `Chat ${chatId.substring(0, 8)}`
                } else {
                    title = `Chat ${chatId.substring(0, 8)}`
                }

                foundChats.push({
                    id: chatId,
                    title: title,
                    href: href,
                    lastAccessed: Date.now()
                })
            }
        })

        if (foundChats.length > 0) {
            this.saveRecentChats(foundChats, storageKey)
            return true
        }

        return false
    }
}

/**
 * DOM operation utilities
 */
export const domUtils = {
    /**
     * Find chat room elements
     * @param {Array} customSelectors - Custom selectors (optional)
     * @returns {Array} Array of chat room elements
     */
    findChatElements(customSelectors = null) {
        const selectors = customSelectors || CHAT_SELECTORS

        for (const selector of selectors) {
            const items = document.querySelectorAll(selector)
            if (items.length > 0) {
                return Array.from(items)
            }
        }
        return Array.from(document.querySelectorAll('a[href*="/c/"]'))
    },

    /**
     * Clear existing indicators
     * @param {string} indicatorClass - Indicator CSS class name
     * @returns {number} Number of cleared indicators
     */
    clearExistingIndicators(indicatorClass = DEFAULT_INDICATOR_CLASS) {
        const existingIndicators = document.querySelectorAll(`.${indicatorClass}`)
        existingIndicators.forEach(element => {
            element.classList.remove(indicatorClass)
            element.removeAttribute('data-chat-id')
            if (element._chatJumpRemoveHandler) {
                element.removeEventListener('click', element._chatJumpRemoveHandler, true)
                delete element._chatJumpRemoveHandler
            }
        })
        return existingIndicators.length
    },

    /**
     * Extract chat room ID
     * @param {string} href - Link URL
     * @returns {string|null} Chat room ID or null
     */
    extractChatId(href) {
        if (!href) return null
        const chatIdMatch = href.match(/\/c\/([a-f0-9-]+)/)
        return chatIdMatch ? chatIdMatch[1] : null
    },

    /**
     * Find suitable parent element
     * @param {Element} element - Starting element
     * @param {Array} parentTypes - Array of parent element types
     * @returns {Element} Suitable parent element
     */
    findSuitableParent(element, parentTypes = ['LI', 'group', 'flex', 'menuitem']) {
        let targetElement = element

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

/**
 * Click event handler utilities
 */
export const clickHandlerUtils = {
    /**
     * Create click event handler
     * @param {string} chatId - Chat room ID
     * @param {Element} targetElement - Target element
     * @param {Function} removeCallback - Remove callback function
     * @param {Object} config - Configuration options
     * @returns {Function} Click event handler
     */
    createRemoveClickHandler(chatId, targetElement, removeCallback, config = CLICK_DETECTION_CONFIG) {
        return (e) => {
            const rect = targetElement.getBoundingClientRect()
            const clickX = e.clientX - rect.left
            const clickY = e.clientY - rect.top

            // Find title element
            const titleElement = targetElement.querySelector('[class*="truncate"], [class*="overflow-hidden"]')

            if (titleElement) {
                const titleRect = titleElement.getBoundingClientRect()
                const titleWidth = titleRect.width
                const dotStartX = titleWidth - config.DOT_OFFSET_FROM_TITLE
                const dotEndX = titleWidth + config.DOT_EXTEND_BEYOND_TITLE

                // Primary detection: click within dot area
                if (clickX >= dotStartX && clickX <= dotEndX) {
                    e.preventDefault()
                    e.stopPropagation()
                    removeCallback(chatId)
                    return false
                }

                // Fallback detection: Shift + click right area
                if (clickX > rect.width * config.FALLBACK_CLICK_THRESHOLD && e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                    removeCallback(chatId)
                    return false
                }
            }
        }
    },

    /**
     * Add click event listener
     * @param {Element} targetElement - Target element
     * @param {string} chatId - Chat room ID
     * @param {Function} removeCallback - Remove callback function
     * @param {Object} config - Configuration options
     */
    attachClickHandler(targetElement, chatId, removeCallback, config = CLICK_DETECTION_CONFIG) {
        if (targetElement._chatJumpRemoveHandler) {
            targetElement.removeEventListener('click', targetElement._chatJumpRemoveHandler, true)
        }

        const handler = this.createRemoveClickHandler(chatId, targetElement, removeCallback, config)
        targetElement._chatJumpRemoveHandler = handler
        targetElement.addEventListener('click', handler, true)
    }
}

/**
 * Recent chat room indicator manager
 */
export const recentChatIndicatorManager = {
    /**
     * Add recent chat room indicators
     * @param {Object} options - Configuration options
     */
    addIndicators({
        storageKey = 'chatjump-recent-chats',
        indicatorClass = 'chat-jump-recent-indicator',
        customSelectors = null,
        removeCallback = null,
        config = CLICK_DETECTION_CONFIG
    } = {}) {
        try {
            domUtils.clearExistingIndicators(indicatorClass)

            const recentChatRoomIds = localStorageUtils.getRecentChatIds(storageKey)
            if (recentChatRoomIds.length === 0) return

            const foundItems = domUtils.findChatElements(customSelectors)

            foundItems.forEach((item) => {
                const href = item.getAttribute('href') || item.href
                const chatId = domUtils.extractChatId(href)

                if (chatId && recentChatRoomIds.includes(chatId)) {
                    const targetElement = domUtils.findSuitableParent(item)

                    targetElement.classList.add(indicatorClass)
                    targetElement.style.position = 'relative'
                    targetElement.setAttribute('data-chat-id', chatId)

                    if (removeCallback) {
                        clickHandlerUtils.attachClickHandler(targetElement, chatId, removeCallback, config)
                    }
                }
            })
        } catch (error) {
            console.error('Error adding recent chat room indicators:', error)
        }
    },

    /**
     * Remove chat room and update indicators
     * @param {string} chatId - Chat room ID
     * @param {Object} options - Configuration options
     */
    removeChat(chatId, {
        storageKey = 'chatjump-recent-chats',
        indicatorClass = 'chat-jump-recent-indicator',
        customSelectors = null,
        config = CLICK_DETECTION_CONFIG,
        updateDelay = 100,
        removeCallback = null
    } = {}) {
        try {
            const success = localStorageUtils.removeRecentChat(chatId, storageKey)

            if (success) {
                setTimeout(() => {
                    this.addIndicators({
                        storageKey,
                        indicatorClass,
                        customSelectors,
                        removeCallback: removeCallback || ((id) => this.removeChat(id, { storageKey, indicatorClass, customSelectors, config, removeCallback })),
                        config
                    })
                }, updateDelay)

                console.log(`Removed from recent chat rooms: ${chatId}`)
            }
        } catch (error) {
            console.error('Error removing chat room:', error)
        }
    }
}

export default {
    debounce,
    localStorageUtils,
    domUtils,
    clickHandlerUtils,
    recentChatIndicatorManager,
    CHAT_SELECTORS,
    CLICK_DETECTION_CONFIG
}
