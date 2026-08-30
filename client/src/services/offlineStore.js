const QUEUE_KEY = "pms:offlineQueue";

export function saveBoardCache(boardId, payload) {
  localStorage.setItem(`pms:cache:${boardId}`, JSON.stringify({ ...payload, cachedAt: new Date().toISOString() }));
}

export function getBoardCache(boardId) {
  try { return JSON.parse(localStorage.getItem(`pms:cache:${boardId}`)); } catch { return null; }
}

export function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; }
}

export function enqueue(operation) {
  const queued = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...operation };
  localStorage.setItem(QUEUE_KEY, JSON.stringify([...getQueue(), queued]));
  return queued;
}

export function replaceQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function draftKey(boardId) {
  return `pms:taskDraft:${boardId}`;
}
