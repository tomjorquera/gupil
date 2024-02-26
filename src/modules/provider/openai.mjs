export class OpenAI {
  static endpointChat = "/v1/chat/completions";
  static endpointComplete = OpenAI.endpointChat;

  constructor({endpoint, token, modelname}) {
    this.endpoint = endpoint;
    this.token = token;
    this.modelname = modelname;
  }

  static configuration = {
    name: chrome.i18n.getMessage("openaiConfigName"),
    description: chrome.i18n.getMessage("openaiConfigDescr"),
    builder: async (options) => new OpenAI(options),
    options: [
      {
        id: "endpoint",
        label: chrome.i18n.getMessage("openaiConfigEndpointLabel"),
        description: chrome.i18n.getMessage("openaiConfigEndpointDescr"),
        default_value: "https://api.openai.com",
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
              msg: chrome.i18n.getMessage("openaiConfigEndpointError"),
            };
          }
        },
      },
      {
        id: "token",
        label: chrome.i18n.getMessage("openaiConfigTokenLabel"),
        description: chrome.i18n.getMessage("openaiConfigTokenDescr"),
        default_value: chrome.i18n.getMessage("openaiConfigTokenDefault"),
        htmlBuilder: () => document.createElement("input"),
        validate: (_) => { return { is_valid: true }; },
      },
      {
        id: "modelname",
        label: chrome.i18n.getMessage("openaiConfigModelLabel"),
        description: chrome.i18n.getMessage("openaiConfigModelDescr"),
        default_value: "gpt-3.5-turbo",
        htmlBuilder: () => document.createElement("input"),
        validate: (_) => { return { is_valid: true }; },
      },
    ],
  };

  async *chat(messages, options = {}) {
    const response = await fetch(this.endpoint + OpenAI.endpointChat, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelname,
        messages,
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
        if (entry == "" || entry == "data: [DONE]") {
          continue;
        }
        const answer = JSON.parse(entry.replace("data: ", "")).choices[0];
        if ("content" in answer.delta) {
          yield answer.delta.content;
        }
      }
    }
  }



  async *complete(prompt, options = {}) {
    const messages = [
      { role: "system", content: "complete the following" },
      { role: "user", content: prompt },
    ];

    const response = await fetch(this.endpoint + OpenAI.endpointComplete, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelname,
        messages,
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
        if (entry == "" || entry == "data: [DONE]") {
          continue;
        }
        const answer = JSON.parse(entry.replace("data: ", "")).choices[0];
        if ("content" in answer.delta) {
          yield answer.delta.content;
        }
      }
    }
  }
}
