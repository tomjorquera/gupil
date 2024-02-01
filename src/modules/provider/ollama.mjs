export class Ollama {
  static endpointComplete = "/api/generate";
  static endpointChat = "/api/chat";

  constructor(endpoint, modelname, system = null) {
    this.endpoint = endpoint;
    this.modelname = modelname;
    this.system = system;
  }

  async *complete(prompt, options = {}) {
    const response = await fetch(this.endpoint + Ollama.endpointComplete, {
      method: "POST",
      body: JSON.stringify({
        model: this.modelname,
        prompt,
        options,
        system: this.system,
        stream: true,
      }),
    });

    const decoder = new TextDecoder("utf-8");
    for await (const chunk of response.body) {
      const answer = JSON.parse(decoder.decode(chunk));
      if (!answer.done) {
        yield answer.response;
      }
    }
  }

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
