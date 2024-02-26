/**
 * This module contains message passing internals.
 *
 * The goal of this module is to abstract and centralize the message processing
 * pipeline that enriches requests with the page content before processing them.
 *
 * This pipeline is required as only content scripts may access the current tab
 * content.
 *
 * It works in the following steps:
 * - caller send request with user content with `sendChatRequest`
 * - the request is captured by the content script with
 *  `listenToPageContentRequests`, which resend it with the page content`
 * - the background script receives the message with `onReadyMessage`
 */


import * as tabs from "/modules/tabs.mjs";
import { updateError } from "/modules/state.mjs"

/** Send a request for the current tab with user-provided content. */
export async function sendChatRequest(userContent) {
  const tabsRes = await tabs.query({ active: true, currentWindow: true });
  const tabId = tabsRes[0].id;
  try {
    await tabs.sendMessage(tabId, {
      tabId: tabId.toString(),
      type: "chatquery",
      userContent,
    });
  } catch (err) {
    await updateError(tabId.toString(), err);
    throw err;
  }
}

export async function sendCompletionRequest() {
  const tabsRes = await tabs.query({ active: true, currentWindow: true });
  const tabId = tabsRes[0].id;
  try {
    await tabs.sendMessage(tabId, {
      tabId: tabId.toString(),
      type: "completionquery",
    });
  } catch (err) {
    await updateError(tabId.toString(), err);
    throw err;
  }
}

/** Listen to incomplete requests for a tab and resend them with tab content.
 *
 * (must be run from a content script)
 */
export function listenToPageContentRequests() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      !(
        "type" in request &&
          (request.type == "chatquery" || request.type == "completionquery") &&
        !("pageContent" in request)
      )
    ) {
      return false;
    }

    let pageContent;
    if (request.type == "chatquery") {
      pageContent = document.getRootNode().body.innerText;
    }
    if (request.type == "completionquery") {
      const activeElement = document.activeElement;
      if (activeElement.type != "textarea") {
        return false;
      }
      pageContent = activeElement.value;
    }
    const query = {
      ...request,
      pageContent,
    };
    try {
      chrome.runtime.sendMessage(query);
    } catch (err) {
      updateError(tabId.toString(), err);
      throw err;
    }
    sendResponse();
    return Promise.resolve();
  });
}

/** Listen to complete chat requests and run some callback. */
export function onChatReadyMessage(callback) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      (
        "type" in request &&
          request.type == "chatquery" &&
          "pageContent" in request
      )
    ) {
      callback(request);
      return Promise.resolve();
    }
    return false;
  });
}

/** Listen to complete completion requests and run some callback. */
export function onCompletionReadyMessage(callback) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      (
        "type" in request &&
          request.type == "completionquery" &&
          "pageContent" in request
      )
    ) {
      callback(request);
      return Promise.resolve();
    }
    return false;
  });
}
