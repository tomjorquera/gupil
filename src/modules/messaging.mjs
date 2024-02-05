/**
 * This module contains message passing internals.
 *
 * The goal of this module is to abstract and centralize the message processing
 * pipeline that enriches requests with the page content before processing them.
 *
 * This pipeline is used as only content scripts may access the current tab
 * content.
 *
 * I works in the following steps:
 * - caller send request with user content with `sendRequest`
 * - the request is captured by the content script with
 *  `listenToPageContentRequests`, which resend it with the page content`
 * - the background script receives the message with `onReadyMessage`
 */

/** Send a request for the current tab with user-provided content. */
export function sendRequest(userContent) {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const tabId = tabs[0].id;
    chrome.tabs.sendMessage(tabId, {
      tabId: tabId.toString(),
      type: "contentquery",
      userContent,
    });
  });
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
        request.type == "contentquery" &&
        !("pageContent" in request)
      )
    ) {
      return true;
    }
    const query = {
      ...request,
      pageContent: document.getRootNode().body.innerText,
    };
    chrome.runtime.sendMessage(query);
    return true;
  });
}

/** Listen to complete requests and run some callback. */
export function onReadyMessage(callback) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      !(
        "type" in request &&
        request.type == "contentquery" &&
        "pageContent" in request
      )
    ) {
      return;
    }
    callback(request);
  });
}
