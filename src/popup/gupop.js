function listenForClicks() {
  document.addEventListener("click", (e) => {
    const optionName = e.target.textContent;
    switch (optionName) {
      case "Summarize":
        chrome.tabs
          .query({ active: true, currentWindow: true })
          .then((tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
              contentquery: "summarize",
            });
          });
        return;
      case "ELI5":
        console.log("Selected ELI5");
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

//browser.tabs
//.executeScript({ file: "/content_scripts/gupil.js" })
//.then(listenForClicks);

listenForClicks();
