/**
 * This module handles configuration options
 */

import { Ollama } from "/modules/provider/ollama.mjs"

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
 * Check the option values of a given form and validate it.
 *
 * Returns whether all the options are valid or not.
 */
export function validateOptions(form, optionValues) {
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

  form.reportValidity();
  return valid;
}

/** Save the current options. */
export async function saveOptions(selected_configurator, optionValues) {
  let configuratorSettings = {}
  for (const [option, input] of optionValues) {
    configuratorSettings[option.id] = input.value
  }
  let settings = (await browser.storage.sync.get("settings"))["settings"];
  if (!settings) {
    settings = {};
  }
  const name = selected_configurator.name;
  settings["selected_configurator"] = name;
  settings[name] = configuratorSettings
  browser.storage.sync.set({ settings });
}


/** Load saved options, or default values. */
export async function loadOptions() {
  let settings = (await browser.storage.sync.get("settings"))["settings"];
  if (!settings) {
    settings = {};
    for (const configurator of configurators) {
      let configSettings = {};
      settings[configurator.name] = configSettings;
      for (const option of configurator.options) {
        configSettings[option.id] = option.default_value;
      }
    }
  }
  return settings;
}

/** Get the provided configured in the options. */
export async function getConfiguredProvider() {
  const options = await loadOptions();
  const name = options["selected_configurator"];
  return await builders[name](options[name]);
}
