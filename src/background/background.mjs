import { onReadyMessage, sendRequest } from "/modules/messaging.mjs";
import { getState, isWaiting, updateError, updateHistory, updateOngoing } from "/modules/state.mjs";
import { getCommonSettings, getConfiguredProvider, getQuickActions, SYS_PROMPT, SYS_PROMPT_PLACEHOLDER } from "/modules/configuration.mjs";

import { ensureContentScriptIsLoaded, openSidebar } from "/modules/action.mjs";

// Polyfill for chrome https://bugs.chromium.org/p/chromium/issues/detail?id=929585
ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
  const reader = this.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
};

/** create custom chat menu with quick actions. */
async function gupilChatMenu() {
  let associatedActions = {};
  chrome.contextMenus.create({
    id: "cmd-chat",
    contexts: ["action"],
    title: chrome.i18n.getMessage("cmdChat"),
  });

  const availableActions = await getQuickActions();
  if (availableActions?.length) {
    chrome.contextMenus.create({
      id: "qa",
      contexts: ["action", "page"],
      title: chrome.i18n.getMessage("QuickActionsLegend"),
    });

    for (const [alias, selectedAction] of availableActions) {
      if (alias == "" || selectedAction == "") {
        continue;
      }
      chrome.contextMenus.create({
        id: `qa-${alias}`,
        contexts: ["action", "page"],
        title: alias,
        parentId: "qa",
      });
      associatedActions[`qa-${alias}`] = selectedAction;
    }
  }

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    openSidebar(tab.id);
    //chrome.sidePanel.open({ tab.id });
    ensureContentScriptIsLoaded(tab.id).then(() => {
      if (Object.hasOwn(associatedActions, info.menuItemId)) {
        sendRequest(associatedActions[info.menuItemId]);
      }
    });
  });
}
gupilChatMenu();

onReadyMessage(async (msg) => {
  const { tabId, userContent, pageContent } = msg;

  const model = await getConfiguredProvider();
  if (!model) {
    await updateError(tabId, {
      message: "No provider configured! Please select a provider in the extension options.",
    });
    return;
  }
  const settings = await getCommonSettings();

  try {
    const sys_prompt = settings[SYS_PROMPT].replace(SYS_PROMPT_PLACEHOLDER, pageContent)

    const sys = {
      role: "system",
      content: sys_prompt,
    };

    const query = {
      role: "user",
      content: userContent,
    };

    await updateHistory(tabId, query);
    await isWaiting(tabId);
    const current_history = (await getState(tabId)).history;
    let ongoingReply = "";
    for await (const chunk of model.chat([sys, ...current_history])) {
      ongoingReply += chunk;
      await updateOngoing(tabId, ongoingReply);
    }

    await updateHistory(tabId, {
      role: "assistant",
      content: ongoingReply,
    });
    await updateOngoing(tabId, null);
  } catch (err) {
    await updateError(tabId, err);
    throw err;
  }
});
