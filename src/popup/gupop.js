Promise.all([
  import("/modules/messaging.mjs"),
  import("/modules/configuration.mjs"),
]).then(async (modules) => {
  const [messaging, config] = modules;

  async function call_to_action(action) {
    if ("sidebarAction" in chrome) {
      // only on Firefox
      chrome.sidebarAction.open();
    }
    await messaging.sendRequest(action);
  }

  const chatBtn = document.getElementById("action-chat");
  chatBtn.onclick = () => chrome.sidebarAction.open();

  const availableActions = await config.getQuickActions();
  if (availableActions?.length) {
    const content = document.getElementById("popup-content");
    content.appendChild(document.createElement("hr"));
    for (const [ alias, value ] of availableActions) {
      if (alias == "" || value == "") {
        continue;
      }
      const actionButton = document.createElement("button");
      actionButton.innerText = alias;
      actionButton.onclick = () => call_to_action(value);
      content.appendChild(actionButton);
    }
  }

  // localize
  document.querySelectorAll("[data-locale]").forEach((elem) => {
    elem.innerText = chrome.i18n.getMessage(elem.dataset.locale);
  });
});
