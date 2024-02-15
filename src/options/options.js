import("/modules/configuration.mjs").then(async (config) => {

  const providerConfig = document.getElementById("providerConfig");

  const UNSELECTED = "_unselected";

  await refresh();

  async function refresh() {
    providerConfig.innerHTML= "";
    const configurator = await config.getSelectedConfigurator();

    const selectProvider = document.createElement("select");
    if (!configurator) {
      selectProvider.appendChild(new Option(chrome.i18n.getMessage("optionsNoProviderSelected"), UNSELECTED));
    }
    for (const configurator of config.configurators) {
      selectProvider.appendChild(new Option(configurator.name));
    }
    if (configurator) {
      selectProvider.value = configurator.name;
    }

    selectProvider.addEventListener("change", async () => {
      const selectedProvider = selectProvider.value
      if (selectedProvider == UNSELECTED) {
        return;
      }
      await config.setSelectedConfigurator(selectedProvider);
      refresh();
    });

    providerConfig.appendChild(selectProvider);

    if (configurator) {
      const form = document.createElement("form");
      form.setAttribute("class", "config");

      const configuratorOptionValues = await addSectionForConfigurator(form);
      const commonOptionValues = await addSectionForCommonSettings(form);
      const qaValues = await addSectionForQA(form);

      form.addEventListener("change", async (e) => {
        e.preventDefault();
        let valid = config.validateOptions(configuratorOptionValues);
        valid = valid && config.validateOptions(commonOptionValues);
        form.reportValidity();
        if (valid) {
          await config.saveConfiguratorOptions(await config.getSelectedConfigurator(), configuratorOptionValues);
          await config.saveCommonOptions(commonOptionValues);
          await config.saveQuickActions(qaValues);
          refresh();
        }
      });
      providerConfig.appendChild(form);
    }
  }

  async function addSectionForConfigurator(form) {
    const configurator = await config.getSelectedConfigurator();

    const configuratorSettings = await config.loadOptions(configurator.name);
    let configuratorOptionValues = []

    const configDiv = document.createElement("div");
    configDiv.innerHTML = configurator.description;
    form.appendChild(configDiv);

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
    return configuratorOptionValues;
  }

  async function addSectionForCommonSettings(form) {
    const commonSettings = await config.loadOptions(config.COMMON_SETTINGS);
    let commonOptionValues = []

    const commonFieldSet = document.createElement("fieldset");
    const commonLegend = document.createElement("legend");
    commonLegend.innerHTML = chrome.i18n.getMessage("commonOptionsLegend");
    commonFieldSet.append(commonLegend);
    form.appendChild(commonFieldSet);

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
    return commonOptionValues;
  }

  async function addSectionForQA(form) {
    const qaSettings = await config.loadOptions(config.QUICK_ACTIONS);
    let qaValues = []

    const qaFieldSet = document.createElement("fieldset");
    const qaLegend = document.createElement("legend");
    qaLegend.innerHTML = chrome.i18n.getMessage("quickActionsLegend");
    qaFieldSet.append(qaLegend);
    form.appendChild(qaFieldSet);

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
    return qaValues
  }

})
