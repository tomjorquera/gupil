import * as tabs from "/modules/tabs.mjs";
import { onChatReadyMessage, onCompletionReadyMessage, sendChatRequest, sendCompletionRequest } from "/modules/messaging.mjs";
import { getState, isWaiting, updateError, updateHistory, updateOngoing } from "/modules/state.mjs";
import { getCommonSettings, getConfiguredProvider, getQuickActions, SYS_PROMPT_CHAT, SYS_PROMPT_COMPLETE, SYS_PROMPT_PLACEHOLDER } from "/modules/configuration.mjs";

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
    contexts: ["browser_action"], // TODO: change browser_action to "action" in Manifest v3
    title: chrome.i18n.getMessage("cmdChat"),
  });

  const availableActions = await getQuickActions();
  if (availableActions?.length) {
    chrome.contextMenus.create({
      id: "qa",
      contexts: ["browser_action", "page"], // TODO: change browser_action to "action" in Manifest v3
      title: chrome.i18n.getMessage("QuickActionsLegend"),
    });

    for (const [alias, selectedAction] of availableActions) {
      if (alias == "" || selectedAction == "") {
        continue;
      }
      chrome.contextMenus.create({
        id: `qa-${alias}`,
        contexts: ["browser_action", "page"], // TODO: change browser_action to "action" in Manifest v3
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
        sendChatRequest(associatedActions[info.menuItemId]);
      }
    });
  });
}
gupilChatMenu();

let currentTab;
async function update() {
  currentTab = (await tabs.query({ active: true, currentWindow: true }))[0];
}
chrome.tabs.onActivated.addListener(update);
chrome.tabs.onUpdated.addListener(update);
update()
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "complete") {
    await ensureContentScriptIsLoaded(currentTab.id);
    sendCompletionRequest();
  }
});

onChatReadyMessage(async (msg) => {
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
    const sys_prompt = settings[SYS_PROMPT_CHAT].replace(SYS_PROMPT_PLACEHOLDER, pageContent);

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

onCompletionReadyMessage(async (msg) => {
  const { tabId, pageContent } = msg;

  const model = await getConfiguredProvider();
  if (!model) {
    await updateError(tabId, {
      message: "No provider configured! Please select a provider in the extension options.",
    });
    return;
  }
  const settings = await getCommonSettings();

  try {
    const sys_prompt = settings[SYS_PROMPT_COMPLETE];

    let ongoingReply = "";
    for await (const chunk of model.complete(pageContent, sys_prompt)) {
      console.log(chunk);
      ongoingReply += chunk;
      await updateOngoing(tabId, ongoingReply);
    }
  } catch (err) {
    await updateError(tabId, err);
    throw err;
  }
});
