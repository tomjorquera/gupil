async function updateContent() {
  const current_window = await browser.windows.getCurrent();
  const current_tab = (
    await browser.tabs.query({
      windowId: current_window.id,
      active: true,
    })
  )[0];
  const contentBox = document.querySelector("#content");
  const storedInfo = await browser.storage.session.get(current_tab.url);
  contentBox.textContent = storedInfo[current_tab.url];
}

function onStorageChange(changes, area) {
  updateContent();
}
browser.storage.onChanged.addListener(onStorageChange);

browser.tabs.onActivated.addListener(updateContent);
browser.tabs.onUpdated.addListener(updateContent);
