/**
 * Ensure content_script is actually loaded in the specified tab.
 */
export async function ensureContentScriptIsLoaded(tabId) {
  await chrome.scripting.executeScript({
    files: ["/content_scripts/gupil.js"],
    target: {
      tabId,
    },
  });
}

/** open the sidebar using the browser specific method. */
export function openSidebar(tabId) {
  if ("sidebarAction" in chrome) {
    // on Firefox
    chrome.sidebarAction.open();
  } else {
    chrome.sidePanel.open({ tabId });
  }
}
