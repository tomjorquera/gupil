/**
 * This module handle state of user sessions
 */

async function currentTabId() {
  return (
    await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })
  )[0].id.toString();
}

async function updateState(tabId, state) {
  const newState = {};
  newState[tabId] = state;
  chrome.storage.session.set(newState);
}

/**
 * Get the state of the given tab.
 */
export async function getState(tabId) {
  const storedInfo = await chrome.storage.session.get(tabId);
  let currentState = storedInfo[tabId];
  if (!currentState) {
    currentState = {
      history: [],
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
  chrome.storage.onChanged.addListener(async (changes) => {
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
  currentState.ongoingReply = ongoingReply;
  await updateState(tabId, currentState);
}

/**
 * Set error status for the given tab
 */
export async function updateError(tabId, error) {
  const currentState = await getState(tabId);
  currentState.error = error;
  currentState.history = [];
  await updateState(tabId, currentState);
}
