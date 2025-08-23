export const ENABLE_ALL_CHATS = false
export const ENABLE_DELETE_TITLE = false

export const MAX_RECENT_CHATS = 3
export const QUESTION_TITLE_MAX_LENGTH = {
    'zh': 254,
    'ja': 32,
    'ko': 30,
    'en': 60,
    'default': 50
}
export const AUTO_SAVE_DELAY = 1000

export const CHAT_ROOM_URL_PATTERNS = [
    /\/c\/([a-f0-9-]+)/,           // /c/chat-id
    /\/chat\/([a-f0-9-]+)/,       // /chat/chat-id
    /\/conversation\/([a-f0-9-]+)/, // /conversation/chat-id
    /chatId=([a-f0-9-]+)/,        // ?chatId=chat-id
    /id=([a-f0-9-]+)/             // ?id=chat-id
]

export const USER_MESSAGE_SELECTORS = [
    'article[data-testid*="conversation-turn"][data-turn="user"]',
    '[data-message-author-role="user"]',
    'div[data-message-author-role="user"]',
    '.group[data-testid*="conversation-turn"]:has([data-message-author-role="user"])'
]

export const LANGUAGE_PATTERNS = {
    zh: /[\u4e00-\u9fff]/,           // 中文字符範圍
    ja: /[\u3040-\u309f\u30a0-\u30ff]/, // 日文字符範圍（平假名+片假名）
    ko: /[\uac00-\ud7af]/,           // 韓文字符範圍
    en: /^[a-zA-Z\s\d\W]+$/          // 英文字符範圍
}

export const CHAT_SELECTORS = [
    'a[href*="/c/"]',
    '[data-testid*="conversation"]',
    '.group.flex.cursor-pointer',
    'li a[href*="/c/"]',
    'nav a[href*="/c/"]',
    '.sidebar a[href*="/c/"]',
    '[class*="sidebar"] a[href*="/c/"]',
]

export const CLICK_DETECTION_CONFIG = {
    DOT_OFFSET_FROM_TITLE: 30,        // Offset from title right side (pixels)
    DOT_EXTEND_BEYOND_TITLE: 15,      // Extension beyond title right side (pixels)
    FALLBACK_CLICK_THRESHOLD: 0.7     // Fallback click detection right area ratio
}

export const DEFAULT_STORAGE_KEY = 'chatjump-recent-chats'
export const DEFAULT_INDICATOR_CLASS = 'chat-jump-recent-indicator'
export const DEFAULT_ADD_INDICATOR_CLASS = 'chat-jump-add-indicator'
export const DEFAULT_UPDATE_DELAY = 100

// Click detection configuration for add indicator
export const ADD_CLICK_DETECTION_CONFIG = {
    RIGHT_AREA_RATIO: 0.5,           // Right 50% of element for click detection
    NAVIGATOR_ENABLE_DELAY: 200      // Delay before re-enabling navigator
}

// Lock icon configuration and selectors (shared)
export const LOCK_ICON = {
    BUTTON_CLASS: 'chatjump-lock-button',
    BUTTON_ID: 'chatjump-lock-button',
    ORDERED_HEADING_SELECTORS: [
        'h2.__menu-label',
        'nav h1, nav h2',
        'aside h1, aside h2',
        '[role="navigation"] h1, [role="navigation"] h2',
        '.sidebar h1, .sidebar h2',
        '[class*="sidebar"] h1, [class*="sidebar"] h2',
        'h1, h2'
    ],
    SIDEBAR_CONTAINERS: [
        'nav[aria-label]',
        '[role="navigation"]',
        '.sidebar',
        '[class*="sidebar"]',
        '[class*="nav"]'
    ],
    SIDEBAR_TRIGGERS_SELECTOR: [
        'h1', 'h2', 'h2.__menu-label',
        'nav', 'aside', '[role="navigation"]',
        '.sidebar', '[class*="sidebar"]', '[class*="nav"]'
    ].join(',')
}
