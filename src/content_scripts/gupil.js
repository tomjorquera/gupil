(async () => {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.gupilHasRun) {
    return;
  }
  window.gupilHasRun = true;

  const messaging = await import(
    chrome.runtime.getURL("/modules/messaging.mjs")
  );

  messaging.listenToPageContentRequests();
})();
