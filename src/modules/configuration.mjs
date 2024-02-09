/**
 * This module handles configuration options
 */

import { LlamaCPP } from "/modules/provider/llamacpp.mjs"
import { Ollama } from "/modules/provider/ollama.mjs"

export const SYS_PROMPT = "systemprompt";
export const SYS_PROMPT_PLACEHOLDER = "#PAGE_TEXT_CONTENT#";
export const COMMON_SETTINGS = "_common_settings";
export const QUICK_ACTIONS = "_quickaction";
const SELECTED_CONFIGURATION = "_selected_configuration";
const VERSION = "_version";
const VERSION_NUMBER = 1;

/**
 * Available configurators.
 */
export const configurators = [
  Ollama.configuration,
  LlamaCPP.configuration,
];

/**
 * Configurators by name.
 */
let configuratorsByName = {}
for (const configurator of configurators) {
  configuratorsByName[configurator.name] = configurator;
}

/**
 * Common options.
 */
export const commonOptions = [
  {
    id: SYS_PROMPT,
    label: chrome.i18n.getMessage("commonOptionSysLabel"),
    description: chrome.i18n.getMessage("commonOptionSysDescr"),
    default_value: chrome.i18n.getMessage("commonOptionSysDefault"),
    htmlBuilder: () => document.createElement("textarea") ,
    validate: (_) => { return { is_valid: true }; },
  },
];

/**
 * Check the option values and set inputs validity.
 *
 * Returns whether all the options are valid or not.
 */
export function validateOptions(optionValues) {
  let valid = true;
  for (const [option, input, warning] of optionValues) {
    const validation = option.validate(input.value);
    if (!validation.is_valid) {
      input.setCustomValidity(validation.msg);
      valid = false;
      warning.style.visibility="visible";
      warning.title = validation.msg;
    } else {
      input.setCustomValidity("");
      warning.style.visibility="hidden";
    }
  }

  return valid;
}

async function saveOptions(name, optionValues) {
  let newSettings = {};
  for (const [option, input] of optionValues) {
    newSettings[option.id] = input.value;
  }
  await browser.storage.sync.set({ [name]: newSettings });
}

/** Save the selected configurator options. */
export async function saveConfiguratorOptions(selected_configurator, optionValues) {
  const name = selected_configurator.name;
  await saveOptions(name, optionValues);
}


/** Save common options. */
export async function saveCommonOptions(optionValues) {
  await saveOptions(COMMON_SETTINGS, optionValues);
}

/** Save quick actions. */
export async function saveQuickActions(optionValues) {
  let newSettings = []
  for (const [alias, value] of optionValues) {
    newSettings.push([alias.value, value.value]);
  }
  await browser.storage.sync.set({ [QUICK_ACTIONS]: newSettings });
}

/** Load saved options, or default values. */
export async function loadOptions(name) {
  return (await browser.storage.sync.get(name))[name];
}

/** Get a new instance of the selected provider. */
export async function getConfiguredProvider() {
  const name = (await browser.storage.sync.get(SELECTED_CONFIGURATION))[SELECTED_CONFIGURATION];
  const options = (await browser.storage.sync.get(name))[name];
  return await configuratorsByName[name].builder(options);
}
/**
 * Set the selected configurator.
 */
export async function setSelectedConfigurator(name) {
  await browser.storage.sync.set({ [SELECTED_CONFIGURATION]: name});
}

/** Get the provided configured name in the options. */
export async function getSelectedConfigurator() {
  const name = (await browser.storage.sync.get(SELECTED_CONFIGURATION))[SELECTED_CONFIGURATION];
  return await configuratorsByName[name];
}

/** Get defined common settings. */
export async function getCommonSettings() {
  return (await browser.storage.sync.get(COMMON_SETTINGS))[COMMON_SETTINGS];
}

/** Get defined quick actions. */
export async function getQuickActions() {
  return (await browser.storage.sync.get(QUICK_ACTIONS))[QUICK_ACTIONS];
}

/** Set entry settings to their default value. */
async function setDefaultSettingsForEntry(name, options) {
    let configSettings = {};
    for (const option of options) {
      configSettings[option.id] = option.default_value;
    }
    await browser.storage.sync.set({ [name] : configSettings})
}

/** Set default quick actions. */
async function setDefaultQA() {
  await browser.storage.sync.set({ [QUICK_ACTIONS] : [
    [chrome.i18n.getMessage("quickActionDefaultAlias1"), chrome.i18n.getMessage("quickActionDefaultValue1")],
    [chrome.i18n.getMessage("quickActionDefaultAlias2"), chrome.i18n.getMessage("quickActionDefaultValue2")],
    [chrome.i18n.getMessage("quickActionDefaultAlias3"), chrome.i18n.getMessage("quickActionDefaultValue3")],
    [chrome.i18n.getMessage("quickActionDefaultAlias4"), chrome.i18n.getMessage("quickActionDefaultValue4")],
    [chrome.i18n.getMessage("quickActionDefaultAlias5"), chrome.i18n.getMessage("quickActionDefaultValue5")],
  ]})

  await browser.storage.sync.set({ [VERSION] : VERSION_NUMBER})
}

// Ensure default values are set for everything
for (const configurator of configurators) {
  let settings = await loadOptions(configurator.name);
  if (!settings) {
    setDefaultSettingsForEntry(configurator.name, configurator.options)
  }
}

let settings = await getCommonSettings();
if (!settings) {
  setDefaultSettingsForEntry(COMMON_SETTINGS, commonOptions)
}

let qa = await getQuickActions();
if (!qa) {
  setDefaultQA();
}
