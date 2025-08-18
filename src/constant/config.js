export const ENABLE_ALL_CHATS = false

export const MAX_RECENT_CHATS = 3
export const QUESTION_TITLE_MAX_LENGTH = {
    'zh': 24,
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
