/**
 * In-memory per-user context store.
 *
 * Shape:
 * {
 *   lastAction      : string | null        — last function executed
 *   lastExpenseId   : string | null        — _id of the most recently touched single expense
 *   lastBatchIds    : string[]             — _ids from the last batch add (newest first)
 *   lastExpenseList : string[]             — _ids from the last get_expenses result
 *   updatedAt       : number               — epoch ms
 * }
 *
 * Swap the Map for Redis / MongoDB for persistence across restarts.
 */

const store = new Map();
const TTL_MS = 30 * 60 * 1000; // 30 minutes

function createEmpty() {
  return {
    lastAction: null,
    lastExpenseId: null,
    lastBatchIds: [],
    lastExpenseList: [],
    updatedAt: Date.now(),
  };
}

function getContext(userId) {
  const key = String(userId);
  const entry = store.get(key);
  if (!entry) return createEmpty();
  if (Date.now() - entry.updatedAt > TTL_MS) {
    store.delete(key);
    return createEmpty();
  }
  return entry;
}

function setContext(userId, patch) {
  const key = String(userId);
  const current = getContext(userId);
  store.set(key, { ...current, ...patch, updatedAt: Date.now() });
}

function clearContext(userId) {
  store.delete(String(userId));
}

module.exports = { getContext, setContext, clearContext };
