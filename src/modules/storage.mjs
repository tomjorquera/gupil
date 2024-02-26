/**
 * Storage API
 *
 * The goal of this module is to offer a minimal async compatible API for storage.
 */

class Storage {
  constructor(storage_type) {
    this.storage_type = storage_type;
    this.onChanged = chrome.storage[this.storage_type].onChanged;
  }

  async get(obj) {
    return new Promise(resolve => {
      return chrome.storage[this.storage_type].get(obj, (res) => resolve(res));
    });
  }

  async set(obj) {
    return new Promise(resolve => {
      return chrome.storage[this.storage_type].set(obj, (res) => resolve(res));
    });
  }

}

export const sync = new Storage("sync");
export const session = new Storage("local");
