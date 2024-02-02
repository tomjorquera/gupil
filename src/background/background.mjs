import { Ollama } from "/modules/provider/ollama.mjs";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if ("summarize" in request) {
    summarize(request["summarize"]);
  }
});

const model = new Ollama("http://localhost:11434", "openhermes:latest");

async function summarize(content) {
  const current_window = await browser.windows.getCurrent();
  const current_tab = (
    await browser.tabs.query({
      windowId: current_window.id,
      active: true,
    })
  )[0];
  const storedInfo = await browser.storage.local.get(current_tab.url);
  const current_storage = storedInfo[Object.keys(storedInfo)[0]];

  const query = {
    role: "user",
    content: "Please summarize the following content:\n" + content,
  };

  let reply = "";
  for await (const chunk of model.chat([query])) {
    console.log(chunk);
    reply += chunk;

    const to_store = {};
    to_store[current_tab.url] = reply;
    browser.storage.session.set(to_store);
  }
}
