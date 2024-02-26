/**
 * This module handle state of user sessions
 */
import * as storage from "/modules/storage.mjs"
import * as tabs from "/modules/tabs.mjs"

async function currentTabId() {
  return (
    await tabs.query({
      active: true,
      currentWindow: true,
    })
  )[0].id.toString();
}

async function updateState(tabId, state) {
  const newState = {};
  newState[tabId] = state;
  storage.session.set(newState);
}

/**
 * Get the state of the given tab.
 */
export async function getState(tabId) {
  const storedInfo = await storage.session.get(tabId);
  let currentState = storedInfo[tabId];
  if (!currentState) {
    currentState = {
      history: [],
      error: null,
      waiting: false,
      ongoingReply: null,
    };
  }
  return currentState;
}

/**
 * Get the state of the current tab.
 */
export async function currentTabState() {
  const tabId = await currentTabId();
  return await getState(tabId);
}

/**
 * listen to changes in current tab state
 */
export function listenToChanges(callback) {
  storage.session.onChanged.addListener(async (changes) => {
    const tabId = await currentTabId();
    if (tabId in changes) {
      callback(changes[tabId].newValue);
    }
  });
}

/**
 * Add a new message to the history of the given tab
 */
export async function updateHistory(tabId, newMsg) {
  const currentState = await getState(tabId);
  currentState.error = null;
  currentState.history.push(newMsg);
  await updateState(tabId, currentState);
}

/**
 * Update ongoing message to the history of the given tab
 */
export async function updateOngoing(tabId, ongoingReply) {
  const currentState = await getState(tabId);
  currentState.error = null;
  currentState.waiting = false;
  currentState.ongoingReply = ongoingReply;
  await updateState(tabId, currentState);
}

export async function isWaiting(tabId) {
  const currentState = await getState(tabId);
  currentState.error = null;
  currentState.waiting = true;
  await updateState(tabId, currentState);
}

/**
 * Set error status for the given tab
 */
export async function updateError(tabId, error) {
  const currentState = await getState(tabId);
  currentState.error = error;
  currentState.waiting = false;
  currentState.history = [];
  await updateState(tabId, currentState);
}
