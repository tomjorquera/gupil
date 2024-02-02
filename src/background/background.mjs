import { Ollama } from "/modules/provider/ollama.mjs";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if ("summarize" in request) {
    summarize(request["summarize"]);
  }
});

const model = new Ollama("http://localhost:11434", "openhermes:latest");

async function summarize(content) {
  for await (const chunk of model.chat([
    {
      role: "user",
      content: "Please summarize the following content:\n" + content,
    },
  ])) {
    console.log(chunk);
  }
}
