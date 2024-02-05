import { onReadyMessage } from "/modules/messaging.mjs";
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

const model = new Ollama("http://localhost:11434", "openhermes:latest");

onReadyMessage(async (msg) => {
  const { tabId, userContent, pageContent } = msg;

  const storedInfo = await chrome.storage.session.get(tabId);
  let currentStorage = storedInfo[tabId];
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
    content: userContent,
  };

  currentStorage.history.push(query);
  let ongoingReply = "";
  for await (const chunk of model.chat([sys, query])) {
    ongoingReply += chunk;
    currentStorage.ongoingReply = ongoingReply;
    storedInfo[tabId] = currentStorage;
    chrome.storage.session.set(storedInfo);
  }
  currentStorage.ongoingReply = null;
  currentStorage.history.push({
    role: "assistant",
    content: ongoingReply,
  });
  storedInfo[tabId] = currentStorage;
  chrome.storage.session.set(storedInfo);
});
