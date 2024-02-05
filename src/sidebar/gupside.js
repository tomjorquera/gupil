Promise.all([
  import("/modules/messaging.mjs"),
  import("/modules/state.mjs"),
]).then(async (modules) => {
  const [messaging, state] = modules;
  const msgForm = document.getElementById("msg-form");
  const msgInput = document.getElementById("msg-input");
  msgForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const msgText = msgInput.value;
    if (!msgText) return;
    msgInput.value = "";
    messaging.sendRequest(msgText);
  });

  async function update(currentState) {
    if (currentState) {
      const contentBox = document.querySelector("#content");
      contentBox.textContent = "";
      for (entry of currentState.history) {
        appendMsg(contentBox, entry.role, entry.content);
      }
      if (currentState.ongoingReply) {
        appendMsg(contentBox, "assistant", currentState.ongoingReply);
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

  state.listenToChanges(update);

  chrome.tabs.onActivated.addListener(
    async () => await state.currentTabState().then(update),
  );
  chrome.tabs.onUpdated.addListener(
    async () => await state.currentTabState().then(update),
  );
});
