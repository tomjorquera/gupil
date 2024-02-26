export class LlamaCPP {
  static endpointChat = "/v1/chat/completions";
  static endpointComplete = "/completion";

  constructor({endpoint, modelname}) {
    this.endpoint = endpoint;
    this.modelname = modelname;
  }

  static configuration = {
    name: chrome.i18n.getMessage("llamacppConfigName"),
    description: chrome.i18n.getMessage("llamacppConfigDescr"),
    builder: async (options) => new LlamaCPP(options),
    options: [
      {
        id: "endpoint",
        label: chrome.i18n.getMessage("llamacppConfigEndpointLabel"),
        description: chrome.i18n.getMessage("llamacppConfigEndpointDescr"),
        default_value: "http://localhost:8080",
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
              msg: chrome.i18n.getMessage("llamacppConfigEndpointError"),
            };
          }

        }
      },
    ],
  };

  async *chat(messages, options = {}) {
    const response = await fetch(this.endpoint + LlamaCPP.endpointChat, {
      method: "POST",
      body: JSON.stringify({
        model: "unused",
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
        const answer = JSON.parse(entry.replace("data: ", "")).choices[0];
        if ("content" in answer.delta) {
          yield answer.delta.content;
        }
      }
    }
  }

  async *complete(prompt, sys, options = {}) {
    // NOTE; llamacpp provide "true" completion endpoint,
    // so we just ignore the sys prompt
    const response = await fetch(this.endpoint + LlamaCPP.endpointComplete, {
      method: "POST",
      body: JSON.stringify({
        model: this.modelname,
        prompt,
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
        const answer = JSON.parse(entry.replace("data: ", ""));
        if (!answer.stop) {
          yield answer.content;
        }
      }
    }
  }
}
