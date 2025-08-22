import {
    CHAT_SELECTORS,
    CLICK_DETECTION_CONFIG,
    DEFAULT_STORAGE_KEY,
    DEFAULT_ADD_INDICATOR_CLASS,
    MAX_RECENT_CHATS,
    ADD_CLICK_DETECTION_CONFIG,
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
     * Add chat room to recent chats
     * @param {string} chatId - Chat room ID
     * @param {string} title - Chat room title
     * @param {string} href - Chat room URL
     * @param {string} storageKey - localStorage key name
     * @returns {boolean} Whether addition was successful
     */
    addRecentChat(chatId, title, href, storageKey = DEFAULT_STORAGE_KEY) {
        try {
            const recentChats = this.getRecentChats(storageKey)
            
            // Check if chat already exists
            if (recentChats.some(chat => chat.id === chatId)) {
                return false
            }
            
            // Check if we've reached the maximum
            if (recentChats.length >= MAX_RECENT_CHATS) {
                return false
            }
            
            const newChat = {
                id: chatId,
                title: title || `Chat ${chatId.substring(0, 8)}`,
                href: href,
                lastAccessed: new Date().toISOString()
            }
            
            recentChats.unshift(newChat)
            return this.saveRecentChats(recentChats, storageKey)
        } catch (error) {
            console.error('Failed to add recent chat:', error)
            return false
        }
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
        try {
            const existingIndicators = document.querySelectorAll(`.${indicatorClass}`)
            existingIndicators.forEach(element => {
                element.classList.remove(indicatorClass)
                element.style.position = ''
                element.removeAttribute('data-chat-id')
                
                if (element._chatJumpRemoveHandler) {
                    element.removeEventListener('click', element._chatJumpRemoveHandler, true)
                    delete element._chatJumpRemoveHandler
                }
            })
            return existingIndicators.length
        } catch (error) {
            console.error('Error clearing existing indicators:', error)
            return 0
        }
    },

    /**
     * Clear existing add indicators
     * @param {string} addIndicatorClass - Add indicator CSS class name
     * @returns {number} Number of cleared add indicators
     */
    clearExistingAddIndicators(addIndicatorClass = DEFAULT_ADD_INDICATOR_CLASS) {
        try {
            const existingAddIndicators = document.querySelectorAll(`.${addIndicatorClass}`)
            existingAddIndicators.forEach(element => {
                element.classList.remove(addIndicatorClass)
                element.style.position = ''
                element.removeAttribute('data-chat-id')
                
                if (element._chatJumpAddHandler) {
                    element.removeEventListener('click', element._chatJumpAddHandler, true)
                    delete element._chatJumpAddHandler
                }
            })
            return existingAddIndicators.length
        } catch (error) {
            console.error('Error clearing existing add indicators:', error)
            return 0
        }
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
    },

    /**
     * Create add click event handler for + icon
     * @param {string} chatId - Chat room ID
     * @param {Element} targetElement - Target element
     * @param {Function} addCallback - Add callback function
     * @returns {Function} Click event handler
     */
    createAddClickHandler(chatId, targetElement, addCallback) {
        return function(e) {
            // Check if this element has the add indicator class
            if (targetElement.classList.contains('chat-jump-add-indicator')) {
                const rect = targetElement.getBoundingClientRect()
                const clickX = e.clientX - rect.left
                const rightAreaStart = rect.width * ADD_CLICK_DETECTION_CONFIG.RIGHT_AREA_RATIO
                
                if (clickX >= rightAreaStart) {
                    e.preventDefault()
                    e.stopPropagation()
                    addCallback(chatId, targetElement)
                    return false
                }
            }
        }
    },

    /**
     * Add click event listener for + icon
     * @param {Element} targetElement - Target element
     * @param {string} chatId - Chat room ID
     * @param {Function} addCallback - Add callback function
     */
    attachAddClickHandler(targetElement, chatId, addCallback) {
        if (targetElement._chatJumpAddHandler) {
            targetElement.removeEventListener('click', targetElement._chatJumpAddHandler, true)
        }

        const handler = this.createAddClickHandler(chatId, targetElement, addCallback)
        targetElement._chatJumpAddHandler = handler
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
        addIndicatorClass = DEFAULT_ADD_INDICATOR_CLASS,
        customSelectors = null,
        removeCallback = null,
        addCallback = null,
        config = CLICK_DETECTION_CONFIG
    } = {}) {
        try {
            domUtils.clearExistingIndicators(indicatorClass)
            domUtils.clearExistingAddIndicators(addIndicatorClass)

            const recentChats = localStorageUtils.getRecentChats(storageKey)
            const recentChatRoomIds = recentChats.map(chat => chat.id)
            const canAddMore = recentChats.length < MAX_RECENT_CHATS



            const foundItems = domUtils.findChatElements(customSelectors)

            foundItems.forEach((item) => {
                const href = item.getAttribute('href') || item.href
                const chatId = domUtils.extractChatId(href)

                if (chatId) {
                    const targetElement = domUtils.findSuitableParent(item)
                    
                    if (recentChatRoomIds.includes(chatId)) {
                        // Add recent chat indicator (dot)

                        targetElement.classList.add(indicatorClass)
                        targetElement.style.position = 'relative'
                        targetElement.setAttribute('data-chat-id', chatId)

                        if (removeCallback) {
                            clickHandlerUtils.attachClickHandler(targetElement, chatId, removeCallback, config)
                        }
                    } else if (canAddMore && addCallback) {
                        // Add + indicator for non-recent chats when we can add more

                        targetElement.classList.add(addIndicatorClass)
                        targetElement.style.position = 'relative'
                        targetElement.setAttribute('data-chat-id', chatId)

                        clickHandlerUtils.attachAddClickHandler(targetElement, chatId, (chatId, element) => {
                            // Extract chat info for adding to localStorage
                            const title = this.extractChatTitle(element, item)
                            addCallback(chatId, title, href, element)
                        })
                    }
                }
            })
        } catch (error) {
            console.error('Error adding recent chat room indicators:', error)
        }
    },

    /**
     * Extract chat title from element
     * @param {Element} targetElement - Target element
     * @param {Element} linkElement - Link element
     * @returns {string} Chat title
     */
    extractChatTitle(targetElement, linkElement) {
        let title = ''
        
        // Try to find title from various sources
        const titleElement = linkElement.querySelector('[title]') ||
            linkElement.closest('[title]') ||
            targetElement.querySelector('[title]') ||
            linkElement.querySelector('[class*="truncate"]') ||
            linkElement.querySelector('[class*="overflow-hidden"]') ||
            targetElement.querySelector('[class*="truncate"]') ||
            targetElement.querySelector('[class*="overflow-hidden"]')

        if (titleElement) {
            title = titleElement.getAttribute('title') ||
                titleElement.textContent?.trim() ||
                ''
        }
        
        // Fallback to link text
        if (!title) {
            title = linkElement.textContent?.trim() || targetElement.textContent?.trim() || ''
        }
        
        return title || 'Untitled Chat'
    },

    /**
     * Remove chat room and update indicators
     * @param {string} chatId - Chat room ID
     * @param {Object} options - Configuration options
     */
    removeChat(chatId, {
        storageKey = 'chatjump-recent-chats',
        indicatorClass = 'chat-jump-recent-indicator',
        addIndicatorClass = DEFAULT_ADD_INDICATOR_CLASS,
        customSelectors = null,
        config = CLICK_DETECTION_CONFIG,
        updateDelay = 100,
        removeCallback = null,
        addCallback = null
    } = {}) {
        try {
            const success = localStorageUtils.removeRecentChat(chatId, storageKey)

            if (success) {
                setTimeout(() => {
                    this.addIndicators({
                        storageKey,
                        indicatorClass,
                        addIndicatorClass,
                        customSelectors,
                        removeCallback: removeCallback || ((id) => this.removeChat(id, { storageKey, indicatorClass, addIndicatorClass, customSelectors, config, removeCallback, addCallback })),
                        addCallback,
                        config
                    })
                }, updateDelay)

                console.log(`Removed from recent chat rooms: ${chatId}`)
            }
        } catch (error) {
            console.error('Error removing chat room:', error)
        }
    },

    /**
     * Add chat room and update indicators
     * @param {string} chatId - Chat room ID
     * @param {string} title - Chat room title
     * @param {string} href - Chat room URL
     * @param {Object} options - Configuration options
     */
    addChat(chatId, title, href, {
        storageKey = 'chatjump-recent-chats',
        indicatorClass = 'chat-jump-recent-indicator',
        addIndicatorClass = DEFAULT_ADD_INDICATOR_CLASS,
        customSelectors = null,
        config = CLICK_DETECTION_CONFIG,
        updateDelay = 100,
        removeCallback = null,
        addCallback = null
    } = {}) {
        try {
            const success = localStorageUtils.addRecentChat(chatId, title, href, storageKey)

            if (success) {
                setTimeout(() => {
                    this.addIndicators({
                        storageKey,
                        indicatorClass,
                        addIndicatorClass,
                        customSelectors,
                        removeCallback: removeCallback || ((id) => this.removeChat(id, { storageKey, indicatorClass, addIndicatorClass, customSelectors, config, removeCallback, addCallback })),
                        addCallback: addCallback || ((id, title, href) => this.addChat(id, title, href, { storageKey, indicatorClass, addIndicatorClass, customSelectors, config, removeCallback, addCallback })),
                        config
                    })
                }, updateDelay)

                console.log(`Added to recent chat rooms: ${chatId} - ${title}`)
                return true
            }
            return false
        } catch (error) {
            console.error('Error adding chat room:', error)
            return false
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
