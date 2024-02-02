(() => {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.gupilHasRun) {
    return;
  }
  window.gupilHasRun = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if ("contentquery" in request) {
      query = {
        action: request.contentquery,
        pagecontent: document.getRootNode().body.innerHTML,
      };
      chrome.runtime.sendMessage(query);
    }
    return true;
  });
})();
