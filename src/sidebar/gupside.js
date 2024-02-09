Promise.all([
  import("/modules/messaging.mjs"),
  import("/modules/state.mjs"),
]).then(async (modules) => {

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
    messaging.sendRequest(msgText);
  }

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
      window.scrollTo(0, document.body.scrollHeight);
      currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
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

  const [messaging, state] = modules;
  const msgForm = document.getElementById("msg-form");

  let currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

  msgForm.addEventListener("click", async (event) => {
    await chrome.permissions.request({
      permissions: [ "scripting" ],
      origins: [ currentTab.url ],
    });
    await ensureContentScriptIsLoaded(currentTab.id);
    await sendRequest();
  });

  state.listenToChanges(update);

  chrome.tabs.onActivated.addListener(
    async () => await state.currentTabState().then(update),
  );
  chrome.tabs.onUpdated.addListener(
    async () => await state.currentTabState().then(update),
  );
});
