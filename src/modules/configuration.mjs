/**
 * This module handles configuration options
 */

import { Ollama } from "/modules/provider/ollama.mjs"

export const SYS_PROMPT = "systemprompt";
export const SYS_PROMPT_PLACEHOLDER = "#PAGE_TEXT_CONTENT#";
export const COMMON_SETTINGS = "_common_settings";
const SELECTED_CONFIGURATION = "_selected_configuration";

/**
 * Available configurators.
 */
export const configurators = [
  Ollama.configuration,
];

/**
 * Associated builder for each configurator.
 */
let builders = {};
for (const configurator of configurators) {
  builders[configurator.name] = configurator.builder;
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
    validate: (_) => { return { is_valid: true }; },
  }
]

/**
 * Check the option values and set inputs validity.
 *
 * Returns whether all the options are valid or not.
 */
export function validateOptions(optionValues) {
  let valid = true;
  for (const [option, input] of optionValues) {
    const validation = option.validate(input.value);
    if (!validation.is_valid) {
      input.setCustomValidity(validation.msg);
      valid = false;
    } else {
      input.setCustomValidity("");
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
  await browser.storage.sync.set({ [SELECTED_CONFIGURATION]: name});
  await saveOptions(name, optionValues);
}


/** Save common options. */
export async function saveCommonOptions(optionValues) {
  await saveOptions(COMMON_SETTINGS, optionValues);
}

/** Load saved options, or default values. */
export async function loadOptions(name) {
  return (await browser.storage.sync.get(name))[name];
}

/** Get the provided configured in the options. */
export async function getConfiguredProvider() {
  const name = (await browser.storage.sync.get(SELECTED_CONFIGURATION))[SELECTED_CONFIGURATION];
  const options = (await browser.storage.sync.get(name))[name];
  return await builders[name](options);
}

export async function getCommonSettings() {
  return (await browser.storage.sync.get(COMMON_SETTINGS))[COMMON_SETTINGS];
}

/** Set settings to their default value. */
async function setDefaultSettings() {
  for (const configurator of configurators) {
    let configSettings = {};
    for (const option of configurator.options) {
      configSettings[option.id] = option.default_value;
    }
    await browser.storage.sync.set({ [configurator.name] : configSettings})
  }

  let configSettings = {};
  for (const option of commonOptions) {
    configSettings[option.id] = option.default_value;
  }
  await browser.storage.sync.set({ [COMMON_SETTINGS] : configSettings})

  await browser.storage.sync.set({ [SELECTED_CONFIGURATION] : configurators[0].name})
}

let settings = (await browser.storage.sync.get());
if (Object.keys(settings).length == 0) {
  await setDefaultSettings();
}
