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
    form.appendChild(fieldSet);

    for (const option of configurator.options) {
      const label = document.createElement("label");
      label.innerHTML = option.label;
      const input = option.htmlBuilder();
      input.value = configuratorSettings[option.id];
      input.setAttribute("title", option.description);
      const warning = document.createElement("span");
      warning.setAttribute("class", "config-err");
      warning.innerHTML = "⚠";
      warning.style.visibility = "hidden";

      const optionDiv = document.createElement("div");
      optionDiv.setAttribute("class", "config-entry");
      optionDiv.appendChild(label);
      optionDiv.appendChild(input);
      optionDiv.appendChild(warning);
      fieldSet.appendChild(optionDiv);

      configuratorOptionValues.push([option, input, warning]);

    }

    let commonOptionValues = []

    const commonFieldSet = document.createElement("fieldset");
    const commonLegend = document.createElement("legend");
    commonLegend.innerHTML = chrome.i18n.getMessage("commonOptionsLegend");
    commonFieldSet.append(commonLegend);
    form.appendChild(commonFieldSet);

    const commonSettings = await config.loadOptions(config.COMMON_SETTINGS);
    for (const option of config.commonOptions) {
      const label = document.createElement("label");
      label.innerHTML = option.label;
      const input = option.htmlBuilder();
      input.value = commonSettings[option.id];
      input.setAttribute("title", option.description);
      const warning = document.createElement("span");
      warning.setAttribute("class", "config-err");
      warning.innerHTML = "⚠";
      warning.style.visibility = "hidden";

      const optionDiv = document.createElement("div");
      optionDiv.setAttribute("class", "config-entry");
      optionDiv.appendChild(label);
      optionDiv.appendChild(input);
      optionDiv.appendChild(warning);
      commonFieldSet.appendChild(optionDiv);

      commonOptionValues.push([option, input, warning]);
    }

    let qaValues = []

    const qaFieldSet = document.createElement("fieldset");
    const qaLegend = document.createElement("legend");
    qaLegend.innerHTML = chrome.i18n.getMessage("quickActionsLegend");
    qaFieldSet.append(qaLegend);
    form.appendChild(qaFieldSet);

    const qaSettings = await config.loadOptions(config.QUICK_ACTIONS);
    let i = 0;
    for (const [qaAlias, qaValue] of qaSettings){
      i += 1;
      const label = document.createElement("label");
      label.innerHTML = chrome.i18n.getMessage("quickActionLabel") + " " + i;
      const inputAlias = document.createElement("input");
      inputAlias.value = qaAlias;
      inputAlias.setAttribute("title", chrome.i18n.getMessage("quickActionDescrAlias"));
      const inputValue = document.createElement("textArea");
      inputValue.value = qaValue;
      inputValue.setAttribute("title", chrome.i18n.getMessage("quickActionDescrValue"));

      const optionDiv = document.createElement("div");
      optionDiv.setAttribute("class", "config-entry");
      optionDiv.appendChild(label);
      optionDiv.appendChild(inputAlias);
      optionDiv.appendChild(inputValue);
      qaFieldSet.appendChild(optionDiv);

      qaValues.push([inputAlias, inputValue]);
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
        await config.saveQuickActions(qaValues);
      }
    });
  }
  form.appendChild(submit);
  providerConfig.appendChild(form);

})
