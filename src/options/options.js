import("/modules/configuration.mjs").then(async (config) => {
  const providerConfig = document.getElementById("providerConfig");

  const form = document.createElement("form");
  form.setAttribute("class", "config");

  const submit = document.createElement("button");
  submit.setAttribute("type", "button");
  submit.innerText = chrome.i18n.getMessage("optionsSubmitBtn");

  for (const configurator of config.configurators) {
    const configuratorSettings = await config.loadOptions(configurator.name);

    const configDiv = document.createElement("div");
    configDiv.innerHTML = configurator.description;
    form.appendChild(configDiv);

    let configuratorOptionValues = []

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

      configuratorOptionValues.push([option, input]);

      form.appendChild(fieldSet);
    }

    let commonOptionValues = []

    const commonFieldSet = document.createElement("fieldset");
    const commonLegend = document.createElement("legend");
    commonLegend.innerHTML = chrome.i18n.getMessage("commonOptionsLegend");
    commonFieldSet.append(commonLegend);

    const commonSettings = await config.loadOptions(config.COMMON_SETTINGS);
    for (const option of config.commonOptions) {
      const label = document.createElement("label");
      label.innerHTML = option.label;
      const input = document.createElement("input");
      input.value = commonSettings[option.id];
      input.setAttribute("title", option.description);

      const optionDiv = document.createElement("div");
      optionDiv.setAttribute("class", "config-entry");
      optionDiv.appendChild(label);
      optionDiv.appendChild(input);
      commonFieldSet.appendChild(optionDiv);

      commonOptionValues.push([option, input]);

      form.appendChild(commonFieldSet);
    }

    form.addEventListener("change", () => {
      let valid = config.validateOptions(configuratorOptionValues);
      valid = valid && config.validateOptions(commonOptionValues);
      submit.disabled = !valid;
      form.reportValidity();
    });

    form.addEventListener("click", async () => {
      let valid = config.validateOptions(configuratorOptionValues);
      valid = valid && config.validateOptions(commonOptionValues);
      form.reportValidity();
      if (valid) {
        await config.saveConfiguratorOptions(configurator, configuratorOptionValues);
        await config.saveCommonOptions(commonOptionValues);
      }
    });
  }
  form.appendChild(submit);
  providerConfig.appendChild(form);

})
