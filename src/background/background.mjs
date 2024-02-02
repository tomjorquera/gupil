import { Ollama } from "/modules/provider/ollama.mjs";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if ("action" in request) {
    if ((!request.action) in actions) {
      throw new Error(`Undefined action ${request.query}`);
    }
    execute(request.action, request.pagecontent);
  }
});

const model = new Ollama("http://localhost:11434", "openhermes:latest");

const actions = {
  summarize: "Please summarize the page content.",
  eli5: "Please describe the page content in simple terms.",
};

async function execute(action, content) {
  const currentWindow = await browser.windows.getCurrent();
  const currentTab = (
    await browser.tabs.query({
      windowId: currentWindow.id,
      active: true,
    })
  )[0];
  const storedInfo = await browser.storage.session.get(currentTab.url);
  let currentStorage = storedInfo[currentTab.url];
  if (!currentStorage) {
    currentStorage = {
      history: [],
    };
  }

  const sys = {
    role: "system",
    content: `You are an in-browser assistant helping a user interact with a web page. Here is the page content ${content}`,
  };

  const query = {
    role: "user",
    content: actions[action],
  };

  currentStorage.history.push(query);
  let ongoingReply = "";
  for await (const chunk of model.chat([sys, query])) {
    ongoingReply += chunk;
    currentStorage.ongoingReply = ongoingReply;
    storedInfo[currentTab.url] = currentStorage;
    browser.storage.session.set(storedInfo);
  }
  currentStorage.ongoingReply = null;
  currentStorage.history.push({
    role: "assistant",
    content: ongoingReply,
  });
  storedInfo[currentTab.url] = currentStorage;
  browser.storage.session.set(storedInfo);
}
