Promise.all([
  import("/modules/messaging.mjs"),
  import("/modules/state.mjs"),
]).then(async (modules) => {

  const [messaging, state] = modules;

  async function ensureContentScriptIsLoaded(tabId) {
    await browser.scripting.executeScript({
      files: ["/content_scripts/gupil.js"],
      target: {
        tabId,
      },
    });
  }

  async function sendRequest() {
    const msgInput = document.getElementById("msg-input");
    const msgText = msgInput.value;
    if (!msgText) return;
    msgInput.value = "";
    await messaging.sendRequest(msgText);
  }

  async function update(currentState) {
    if (currentState) {
      const contentBox = document.querySelector("#content");
      contentBox.textContent = "";
      if (currentState.error) {
        displayErr(currentState.error);
        return;
      }
      for (entry of currentState.history) {
        appendMsg(contentBox, entry.role, entry.content);
      }
      if (currentState.ongoingReply) {
        appendMsg(contentBox, "assistant", currentState.ongoingReply);
      }
      contentBox.scrollTop = contentBox.scrollHeight;
      currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    }
  }

  function appendMsg(container, role, content) {
    const displayName = role == "user" ? "You" : role == "assistant" ? "Gupil" : "Error";
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

  async function displayErr(err) {
    const contentBox = document.querySelector("#content");
    contentBox.textContent = "";
    appendMsg(contentBox, "error", err.message);
  }

  async function submit() {
    await chrome.permissions.request({
      permissions: [ "scripting" ],
      origins: [ currentTab.url ],
    });
    await ensureContentScriptIsLoaded(currentTab.id);
    await sendRequest();
  }

  const msgForm = document.getElementById("msg-form");
  msgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });

  let currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  state.listenToChanges(update);

  chrome.tabs.onActivated.addListener(
    async () => await state.currentTabState().then(update),
  );
  chrome.tabs.onUpdated.addListener(
    async () => await state.currentTabState().then(update),
  );
});
