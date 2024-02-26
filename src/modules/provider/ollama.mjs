export class Ollama {
  static endpointChat = "/api/chat";
  static endpointComplete = "/api/generate";

  constructor({endpoint, modelname}) {
    this.endpoint = endpoint;
    this.modelname = modelname;
  }

  static configuration = {
    name: chrome.i18n.getMessage("ollamaConfigName"),
    description: chrome.i18n.getMessage("ollamaConfigDescr", chrome.runtime.getURL("").slice(0, -1)),
    builder: async (options) => new Ollama(options),
    options: [
      {
        id: "endpoint",
        label: chrome.i18n.getMessage("ollamaConfigEndpointLabel"),
        description: chrome.i18n.getMessage("ollamaConfigEndpointDescr"),
        default_value: "http://localhost:11434",
        htmlBuilder: () => {
          const res = document.createElement("input");
          res.setAttribute("type", "url");
          return res;
        },
        validate: (value) => {
          try {
            new URL(value);
            return {
              is_valid: true,
            };
          } catch (_) {
            return {
              is_valid: false,
              msg: chrome.i18n.getMessage("ollamaConfigEndpointError"),
            };
          }

        }
      },
      {
        id: "modelname",
        label: chrome.i18n.getMessage("ollamaConfigModelLabel"),
        description: chrome.i18n.getMessage("ollamaConfigModelDescr"),
        default_value: "openhermes:latest",
        htmlBuilder: () => document.createElement("input") ,
        validate: (value) => {
          if (value.split(":").length != 2) {
            return {
              is_valid: false,
              msg: chrome.i18n.getMessage("ollamaConfigModelError"),
            }
          }
          return {
            is_valid: true,
          };
        }
      },
    ],
  };

  async *chat(messages, options = {}) {
    const response = await fetch(this.endpoint + Ollama.endpointChat, {
      method: "POST",
      body: JSON.stringify({
        model: this.modelname,
        messages,
        options,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(response.status + " " + response.statusText);
    }

    const decoder = new TextDecoder("utf-8");
    for await (const chunk of response.body) {
      const content = decoder.decode(chunk);
      const entries = content.split("\n");
      for (const entry of entries) {
        if (entry == "") {
          continue;
        }
        const answer = JSON.parse(entry);
        if (!answer.done) {
          yield answer.message.content;
        }
      }
    }
  }

  async *complete(prompt, sys, options = {}) {
    const response = await fetch(this.endpoint + Ollama.endpointComplete, {
      method: "POST",
      body: JSON.stringify({
        model: this.modelname,
        prompt,
        options,
        stream: true,
        raw: true,
        sys,
      }),
    });

    if (!response.ok) {
      throw new Error(response.status + " " + response.statusText);
    }

    const decoder = new TextDecoder("utf-8");
    for await (const chunk of response.body) {
      const content = decoder.decode(chunk);
      const entries = content.split("\n");
      for (const entry of entries) {
        if (entry == "") {
          continue;
        }
        const answer = JSON.parse(entry);
        if (!answer.done) {
          yield answer.response;
        }
      }
    }
  }
}
