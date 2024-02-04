function call_to_action(action) {
  chrome.sidebarAction.open();
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "contentquery",
      content: action,
    });
  });
}

const availableActions = [
  {
    id: "summarize",
    title: chrome.i18n.getMessage("cmdSummarize"),
    action: () => call_to_action("Please summarize the page content."),
  },
  {
    id: "eli5",
    title: chrome.i18n.getMessage("cmdELI5"),
    action: () =>
      call_to_action("Please describe the page content in simple terms."),
  },
];

const chatBtn = document.getElementById("action-chat");
chatBtn.onclick = () => chrome.sidebarAction.open();

if (availableActions?.length) {
  const content = document.getElementById("popup-content");
  content.appendChild(document.createElement("hr"));
  for (const { id, title, action } of availableActions) {
    const actionButton = document.createElement("button");
    actionButton.innerText = title;
    actionButton.setAttribute("id", `action-{id}`);
    actionButton.onclick = action;
    content.appendChild(actionButton);
  }
}

// localize
document.querySelectorAll("[data-locale]").forEach((elem) => {
  elem.innerText = chrome.i18n.getMessage(elem.dataset.locale);
});
