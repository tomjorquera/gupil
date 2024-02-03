function call_to_action(action) {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "contentquery",
      request: "action",
      content: action,
    });
  });
}

function listenForClicks() {
  document.addEventListener("click", (e) => {
    const optionName = e.target.textContent;
    switch (optionName) {
      case "Summarize":
        call_to_action("summarize");
        return;
      case "ELI5":
        call_to_action("eli5");
        return;
      case "Translate":
        console.log("Selected Translate");
        return;
      case "Chat":
        console.log("Selected Chat");
        return;
    }
  });
}

// localize
document.querySelectorAll("[data-locale]").forEach((elem) => {
  elem.innerText = chrome.i18n.getMessage(elem.dataset.locale);
});

listenForClicks();
