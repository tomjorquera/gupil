import { Ollama } from "/modules/provider/ollama.mjs";

// Polyfill for chrome https://bugs.chromium.org/p/chromium/issues/detail?id=929585
ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
  const reader = this.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    !(
      "type" in request &&
      request.type == "contentquery" &&
      "pageContent" in request
    )
  ) {
    return;
  }
  if (request.request == "action") {
    if (!(request.content in actions)) {
      throw new Error(`Undefined action ${request.content}`);
    }
    execute(actions[request.content], request.pageContent);
    return;
  }
  if (request.request == "chat") {
    execute(request.content, request.pageContent);
    return;
  }
  throw new Error(`Unknown request ${request}`);
});

const model = new Ollama("http://localhost:11434", "openhermes:latest");

const actions = {
  summarize: "Please summarize the page content.",
  eli5: "Please describe the page content in simple terms.",
};

async function execute(content, pageContent) {
  const currentWindow = await chrome.windows.getCurrent();
  const currentTab = (
    await chrome.tabs.query({
      windowId: currentWindow.id,
      active: true,
    })
  )[0];
  const storedInfo = await chrome.storage.session.get(currentTab.url);
  let currentStorage = storedInfo[currentTab.url];
  if (!currentStorage) {
    currentStorage = {
      history: [],
    };
  }

  const sys = {
    role: "system",
    content: `You are an in-browser assistant helping a user interact with a web page. Here is the page content ${pageContent}`,
  };

  const query = {
    role: "user",
    content,
  };

  currentStorage.history.push(query);
  let ongoingReply = "";
  for await (const chunk of model.chat([sys, query])) {
    ongoingReply += chunk;
    currentStorage.ongoingReply = ongoingReply;
    storedInfo[currentTab.url] = currentStorage;
    chrome.storage.session.set(storedInfo);
  }
  currentStorage.ongoingReply = null;
  currentStorage.history.push({
    role: "assistant",
    content: ongoingReply,
  });
  storedInfo[currentTab.url] = currentStorage;
  chrome.storage.session.set(storedInfo);
}
