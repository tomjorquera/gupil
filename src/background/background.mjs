import { onReadyMessage } from "/modules/messaging.mjs";
import { getState, updateHistory, updateOngoing } from "/modules/state.mjs";
import { getConfiguredProvider } from "/modules/configuration.mjs";

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


onReadyMessage(async (msg) => {

  const model = await getConfiguredProvider();

  const { tabId, userContent, pageContent } = msg;

  const sys = {
    role: "system",
    content: `You are an in-browser assistant helping a user interact with a web page. Here is the page content ${pageContent}`,
  };

  const query = {
    role: "user",
    content: userContent,
  };

  await updateHistory(tabId, query);
  const current_history = (await getState(tabId)).history;
  let ongoingReply = "";
  for await (const chunk of model.chat([sys, ...current_history])) {
    ongoingReply += chunk;
    await updateOngoing(tabId, ongoingReply);
  }

  await updateHistory(tabId, {
    role: "assistant",
    content: ongoingReply,
  });
  await updateOngoing(tabId, null);
});
