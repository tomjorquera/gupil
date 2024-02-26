/**
 * Tabs API
 *
 * The goal of this module is to offer a minimal async compatible API for tabs.
 */

export function query(obj) {
  return new Promise(resolve => {
    return chrome.tabs.query(obj, (res) => resolve(res));
  })
}

export function sendMessage(tabId, message, options) {
  return new Promise(resolve => {
    return chrome.tabs.sendMessage(tabId, message, options, (res) => resolve(res));
  })

}
