import { ref } from 'vue';

/**
 * Manage saved questions persistence and helpers.
 * - Persists to localStorage under provided keys
 * - Provides CRUD helpers
 * - Does NOT handle any UI/DOM concerns
 */
import { truncateText } from '../utils/utils.js';

export function useSavedQuestions(options = {}) {
  const {
    storageKey = 'chatjump-saved-questions',
    deletedKey = 'chatjump-deleted-questions'
  } = options;

  const savedQuestions = ref([]);
  const deletedQuestionIds = ref(new Set());

  // init from localStorage
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      savedQuestions.value = JSON.parse(saved);
    }
  } catch (e) {
    console.error('讀取已儲存問題失敗:', e);
  }
  try {
    const del = localStorage.getItem(deletedKey);
    if (del) {
      deletedQuestionIds.value = new Set(JSON.parse(del));
    }
  } catch (e) {
    console.error('讀取刪除的問題ID失敗:', e);
  }

  const saveSavedQuestions = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedQuestions.value));
    } catch (error) {
      console.error('儲存問題時出錯:', error);
    }
  };

  // Helpers for editing flow (pure data helpers)
  const findSavedByOriginalText = (originalText) => {
    return savedQuestions.value.find(q => q.originalText === originalText) || null;
  };

  const ensureSavedQuestion = (question) => {
    let saved = findSavedByOriginalText(question.text);
    if (!saved) {
      saveCurrentQuestion(question);
      saved = findSavedByOriginalText(question.text);
    }
    return saved;
  };

  const getInitialEditTitle = (question) => {
    const saved = findSavedByOriginalText(question.text);
    const defaultTitle = truncateText(question.text);
    if (saved) {
      return saved.title !== defaultTitle ? saved.title : question.text;
    }
    return question.text;
  };

  const saveCurrentQuestion = (question) => {
    const questionToSave = {
      id: Date.now().toString(),
      title: truncateText(question.text),
      originalText: question.text,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    const existingIndex = savedQuestions.value.findIndex(q => q.originalText === question.text);
    if (existingIndex !== -1) {
      savedQuestions.value[existingIndex].timestamp = questionToSave.timestamp;
      savedQuestions.value[existingIndex].url = questionToSave.url;
    } else {
      savedQuestions.value.unshift(questionToSave);
    }
    saveSavedQuestions();
  };

  const updateQuestionTitle = (questionId, newTitle) => {
    const q = savedQuestions.value.find(q => q.id === questionId);
    if (q) {
      q.title = (newTitle || '').trim() || truncateText(q.originalText);
      saveSavedQuestions();
    }
  };

  const getDisplayTitle = (question) => {
    const saved = savedQuestions.value.find(q => q.originalText === question.text);
    if (saved && saved.title !== truncateText(question.text)) {
      return truncateText(saved.title);
    }
    return truncateText(question.text);
  };

  const deleteQuestionToLocalStorage = (questionId) => {
    deletedQuestionIds.value.add(questionId);
    savedQuestions.value = savedQuestions.value.filter(q => q.id !== questionId);
    saveSavedQuestions();
    try {
      localStorage.setItem(deletedKey, JSON.stringify([...deletedQuestionIds.value]));
    } catch (e) {
      console.error('更新刪除的問題ID失敗:', e);
    }
  };

  return {
    savedQuestions,
    deletedQuestionIds,
    saveCurrentQuestion,
    updateQuestionTitle,
    getDisplayTitle,
    deleteQuestionToLocalStorage,
    findSavedByOriginalText,
    ensureSavedQuestion,
    getInitialEditTitle
  };
}
