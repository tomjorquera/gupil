async function updateContent() {
  const currentWindow = await browser.windows.getCurrent();
  const currentTab = (
    await browser.tabs.query({
      windowId: currentWindow.id,
      active: true,
    })
  )[0];
  const storage = await browser.storage.session.get(currentTab.url);
  const currentStorage = storage[currentTab.url];
  if (currentStorage) {
    const contentBox = document.querySelector("#content");
    contentBox.textContent = "";
    for (entry of currentStorage.history) {
      appendMsg(contentBox, entry.role, entry.content);
    }
    if (currentStorage.ongoingReply) {
      appendMsg(contentBox, "assistant", currentStorage.ongoingReply);
    }
  }
}

function appendMsg(container, role, content) {
  const displayName = role == "user" ? "You" : "Gupil";
  const msg = document.createElement("div");
  msg.setAttribute("class", `msg msg-${role}`);

  const roleNode = document.createElement("div");
  roleNode.appendChild(document.createTextNode(displayName));
  roleNode.setAttribute("class", "msg-role");

  const contentNode = document.createElement("div");
  contentNode.appendChild(document.createTextNode(content));
  contentNode.setAttribute("class", "msg-content");

  msg.appendChild(roleNode);
  msg.appendChild(contentNode);

  container.appendChild(msg);
}

function onStorageChange(changes, area) {
  updateContent();
}
browser.storage.onChanged.addListener(onStorageChange);

browser.tabs.onActivated.addListener(updateContent);
browser.tabs.onUpdated.addListener(updateContent);
