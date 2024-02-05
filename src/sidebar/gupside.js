import("/modules/messaging.mjs").then((messaging) => {
  const msgForm = document.getElementById("msg-form");
  const msgInput = document.getElementById("msg-input");
  msgForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const msgText = msgInput.value;
    if (!msgText) return;
    msgInput.value = "";
    messaging.sendRequest(msgText);
  });

  async function updateContent() {
    const currentWindow = await chrome.windows.getCurrent();
    const currentTab = (
      await chrome.tabs.query({
        windowId: currentWindow.id,
        active: true,
      })
    )[0].id.toString();
    const storage = await chrome.storage.session.get(currentTab);
    const currentStorage = storage[currentTab];
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
  chrome.storage.onChanged.addListener(onStorageChange);

  chrome.tabs.onActivated.addListener(updateContent);
  chrome.tabs.onUpdated.addListener(updateContent);
});
