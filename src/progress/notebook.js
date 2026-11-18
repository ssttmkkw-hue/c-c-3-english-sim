import { normalize } from '../dialogue/match.js';

const KEY = 'plaza-english-notebook';
const MAX = 80;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => item && typeof item.text === 'string' && item.text.trim());
  } catch (err) {
    return [];
  }
}

export function createNotebook() {
  let items = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (err) { /* private mode */ }
  }

  function copy(item) {
    return {
      id: item.id,
      text: item.text,
      zh: item.zh || '',
      source: item.source || '',
      conversationId: item.conversationId || '',
      count: Number(item.count) || 0,
      best: Number(item.best) || 0,
      savedAt: item.savedAt || 0,
    };
  }

  function add(entry) {
    const raw = typeof entry === 'string' ? { text: entry } : (entry || {});
    const text = String(raw.text || '').trim();
    if (!text) return null;
    const id = normalize(text) || text.toLowerCase();
    let item = items.find((row) => row.id === id);
    if (!item) {
      item = {
        id,
        text,
        zh: String(raw.zh || ''),
        source: String(raw.source || ''),
        conversationId: String(raw.conversationId || ''),
        count: 0,
        best: 0,
        savedAt: Date.now(),
      };
      items.unshift(item);
      if (items.length > MAX) items.length = MAX;
    } else {
      if (raw.zh && !item.zh) item.zh = String(raw.zh);
      if (raw.source && !item.source) item.source = String(raw.source);
      if (raw.conversationId && !item.conversationId) item.conversationId = String(raw.conversationId);
    }
    save();
    return copy(item);
  }

  function record(text, score) {
    const id = normalize(text) || String(text || '').trim().toLowerCase();
    const item = items.find((row) => row.id === id);
    if (!item) return null;
    const value = Math.max(0, Math.min(1, Number(score) || 0));
    item.count = (Number(item.count) || 0) + 1;
    item.best = Math.max(Number(item.best) || 0, value);
    save();
    return copy(item);
  }

  function remove(id) {
    const key = String(id || '').trim();
    const norm = normalize(key);
    const before = items.length;
    items = items.filter((row) => row.id !== key && row.id !== norm && row.text !== key);
    if (items.length === before) return false;
    save();
    return true;
  }

  function list() {
    return items.map(copy);
  }

  function has(text) {
    const id = normalize(text);
    return items.some((row) => row.id === id);
  }

  return { add, record, remove, list, has };
}
