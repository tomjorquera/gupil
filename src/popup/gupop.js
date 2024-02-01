function listenForClicks() {
  document.addEventListener("click", (e) => {
    const optionName = e.target.textContent;
    console.log(optionName);
    switch (optionName) {
      case "Summarize":
        console.log("Selected Summarize");
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
document.querySelectorAll('[data-locale]').forEach(elem => {
  elem.innerText = browser.i18n.getMessage(elem.dataset.locale)
})


//browser.tabs
       //.executeScript({ file: "/content_scripts/gupil.js" })
       //.then(listenForClicks);

listenForClicks();
