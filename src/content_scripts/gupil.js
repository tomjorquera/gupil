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
    if (
      !(
        "type" in request &&
        request.type == "contentquery" &&
        !("pageContent" in request)
      )
    ) {
      return true;
    }
    query = {
      ...request,
      pageContent: document.getRootNode().body.innerText,
    };
    chrome.runtime.sendMessage(query);
    return true;
  });
})();
