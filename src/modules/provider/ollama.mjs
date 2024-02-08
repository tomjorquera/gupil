export class Ollama {
  static endpointChat = "/api/chat";

  constructor({endpoint, modelname}) {
    this.endpoint = endpoint;
    this.modelname = modelname;
  }

  static configuration = {
    name: chrome.i18n.getMessage("ollamaConfigName"),
    description: `By default, ollama restrict web origins. In order to enable the extension to use ollama, you need to set the <code>OLLAMA_ORIGINS</code> environment variable as follow:
<pre>
OLLAMA_ORGINS=${chrome.runtime.getURL("").slice(0, -1)}
</pre>
See <a href="https://github.com/ollama/ollama/blob/main/docs/faq.md#how-do-i-configure-ollama-server">https://github.com/ollama/ollama/blob/main/docs/faq.md#how-do-i-configure-ollama-server</a> for how to configure environment variables with ollama.`,
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
}
