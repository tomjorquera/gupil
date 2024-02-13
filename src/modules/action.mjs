/**
 * Ensure content_script is actually loaded in the specified tab.
 *
 * Note: You *need* to call the following before to ensure we get the proper
 * permissions (and to ask user to allow to execute in the tab context if
 * need be):
 * ```
 * await chrome.permissions.request({
 *   permissions: [ "scripting" ],
 *   origins: [ currentTab.url ],
 * });
 * ```
 * This *cannot* be put into an async function, as doing so make the browser to
 * lose track of the caller context, and permissions requests need to be traced
 * back to a user action (such as `onClick`).
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
