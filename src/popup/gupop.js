async function ensureContentScriptIsLoaded(tabId) {
  await chrome.scripting.executeScript({
    files: ["/content_scripts/gupil.js"],
    target: {
      tabId,
    },
  });
}

function openSidebar() {
  if ("sidebarAction" in chrome) {
    // on Firefox
    chrome.sidebarAction.open();
  } else {
    // on Chrome
    chrome.tabs.query({
      active: true,
      currentWindow: true,
    }).then((tabs) => {
      const tabId = tabs[0].id;
      chrome.sidePanel.open({ tabId });
    });
  }
}

Promise.all([
  import("/modules/messaging.mjs"),
  import("/modules/configuration.mjs"),
]).then(async (modules) => {
  const [messaging, config] = modules;

  const chatBtn = document.getElementById("action-chat");
  chatBtn.onclick = openSidebar;

  const availableActions = await config.getQuickActions();
  if (availableActions?.length) {
    const currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    console.log(currentTab.url);
    const content = document.getElementById("popup-content");
    content.appendChild(document.createElement("hr"));
    for (const [ alias, action ] of availableActions) {
      if (alias == "" || action == "") {
        continue;
      }
      const actionButton = document.createElement("button");
      actionButton.innerText = alias;
      actionButton.onclick = async (e) => {
        e.preventDefault();
        openSidebar();
        await chrome.permissions.request({
          permissions: [ "scripting" ],
          origins: [ currentTab.url ],
        });
        await ensureContentScriptIsLoaded(currentTab.id);
        await messaging.sendRequest(action);

      };
      content.appendChild(actionButton);
    }
  }

  // localize
  document.querySelectorAll("[data-locale]").forEach((elem) => {
    elem.innerText = chrome.i18n.getMessage(elem.dataset.locale);
  });
});
