import("/modules/configuration.mjs").then(async (config) => {
  const settings = await config.loadOptions();
  const providerConfig = document.getElementById("providerConfig");

  const form = document.createElement("form");
  form.setAttribute("class", "config");

  const submit = document.createElement("button");
  submit.setAttribute("type", "submit");
  submit.innerText = chrome.i18n.getMessage("optionsSubmitBtn");

  for (const configurator of config.configurators) {
    const configuratorSettings = settings[configurator.name];

    const configDiv = document.createElement("div");
    configDiv.innerHTML = configurator.description;
    form.appendChild(configDiv);

    optionValues = []

    const fieldSet = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.innerHTML = configurator.name;
    fieldSet.append(legend);

    for (const option of configurator.options) {
      const label = document.createElement("label");
      label.innerHTML = option.label;
      const input = document.createElement("input");
      input.value = configuratorSettings[option.id];
      input.setAttribute("title", option.description);

      const optionDiv = document.createElement("div");
      optionDiv.setAttribute("class", "config-entry");
      optionDiv.appendChild(label);
      optionDiv.appendChild(input);
      fieldSet.appendChild(optionDiv);

      optionValues.push([option, input]);

      form.appendChild(fieldSet);
    }

    form.addEventListener("change", () => {
      const valid = config.validateOptions(form, optionValues);
      submit.disabled = !valid;
    });

    form.addEventListener("submit", () => {
      const valid = config.validateOptions(form, optionValues);
      if (valid) {
        config.saveOptions(configurator, optionValues);
      }
    });
  }

  form.appendChild(submit);
  providerConfig.appendChild(form);

})
