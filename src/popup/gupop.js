Promise.all([
  import("/modules/action.mjs"),
  import("/modules/messaging.mjs"),
  import("/modules/configuration.mjs"),
]).then(async (modules) => {
  const [action, messaging, config] = modules;
  const currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

  const chatBtn = document.getElementById("action-chat");
  chatBtn.onclick = () => action.openSidebar(currentTab.id);

  const availableActions = await config.getQuickActions();
  if (availableActions?.length) {
    const content = document.getElementById("popup-content");
    content.appendChild(document.createElement("hr"));
    for (const [ alias, selectedAction ] of availableActions) {
      if (alias == "" || selectedAction == "") {
        continue;
      }
      const actionButton = document.createElement("button");
      actionButton.innerText = alias;
      actionButton.onclick = async (e) => {
        e.preventDefault();
        action.openSidebar(currentTab.id);
        await chrome.permissions.request({
          permissions: [ "scripting" ],
          origins: [ currentTab.url ],
        });
        await action.ensureContentScriptIsLoaded(currentTab.id);
        await messaging.sendRequest(selectedAction);

      };
      content.appendChild(actionButton);
    }
  }

  // localize
  document.querySelectorAll("[data-locale]").forEach((elem) => {
    elem.innerText = chrome.i18n.getMessage(elem.dataset.locale);
  });
});
