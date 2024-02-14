/**
 * This module handles configuration options
 */

import { LlamaCPP } from "/modules/provider/llamacpp.mjs"
import { Ollama } from "/modules/provider/ollama.mjs"
import { OpenAI } from "/modules/provider/openai.mjs"

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
  OpenAI.configuration,
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
  await chrome.storage.sync.set({ [name]: newSettings });
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
  await chrome.storage.sync.set({ [QUICK_ACTIONS]: newSettings });
}

/** Load saved options, or default values. */
export async function loadOptions(name) {
  return (await chrome.storage.sync.get(name))[name];
}

/** Get a new instance of the selected provider. */
export async function getConfiguredProvider() {
  const name = (await chrome.storage.sync.get(SELECTED_CONFIGURATION))[SELECTED_CONFIGURATION];
  if (!name) {
    return null;
  }
  const options = (await chrome.storage.sync.get(name))[name];
  return await configuratorsByName[name].builder(options);
}
/**
 * Set the selected configurator.
 */
export async function setSelectedConfigurator(name) {
  await chrome.storage.sync.set({ [SELECTED_CONFIGURATION]: name});
}

/** Get the provided configured name in the options. */
export async function getSelectedConfigurator() {
  const name = (await chrome.storage.sync.get(SELECTED_CONFIGURATION))[SELECTED_CONFIGURATION];
  return await configuratorsByName[name];
}

/** Get defined common settings. */
export async function getCommonSettings() {
  return (await chrome.storage.sync.get(COMMON_SETTINGS))[COMMON_SETTINGS];
}

/** Get defined quick actions. */
export async function getQuickActions() {
  return (await chrome.storage.sync.get(QUICK_ACTIONS))[QUICK_ACTIONS];
}

/** Set entry settings to their default value. */
async function setDefaultSettingsForEntry(name, options) {
    let configSettings = {};
    for (const option of options) {
      configSettings[option.id] = option.default_value;
    }
    await chrome.storage.sync.set({ [name] : configSettings})
}

/** Set default quick actions. */
async function setDefaultQA() {
  await chrome.storage.sync.set({ [QUICK_ACTIONS] : [
    [chrome.i18n.getMessage("quickActionDefaultAlias1"), chrome.i18n.getMessage("quickActionDefaultValue1")],
    [chrome.i18n.getMessage("quickActionDefaultAlias2"), chrome.i18n.getMessage("quickActionDefaultValue2")],
    [chrome.i18n.getMessage("quickActionDefaultAlias3"), chrome.i18n.getMessage("quickActionDefaultValue3")],
    [chrome.i18n.getMessage("quickActionDefaultAlias4"), chrome.i18n.getMessage("quickActionDefaultValue4")],
    [chrome.i18n.getMessage("quickActionDefaultAlias5"), chrome.i18n.getMessage("quickActionDefaultValue5")],
  ]})

  await chrome.storage.sync.set({ [VERSION] : VERSION_NUMBER})
}

/** Returns true if the chat config is done, false otherwise */
export async function chatIsConfigured() {
  const name = (await chrome.storage.sync.get(SELECTED_CONFIGURATION))[SELECTED_CONFIGURATION];
  return !!name;
}


// Note: Cannot use await in init, chrome refuses await in background workers top-level

// Ensure default values are set for everything
for (const configurator of configurators) {
  loadOptions(configurator.name).then((settings) => {
    if (!settings) {
      setDefaultSettingsForEntry(configurator.name, configurator.options)
    }
  });
}

getCommonSettings().then((settings) => {
  if (!settings) {
    setDefaultSettingsForEntry(COMMON_SETTINGS, commonOptions)
  }
});

getQuickActions().then((qa) => {
  if (!qa) {
    setDefaultQA();
  }
});
