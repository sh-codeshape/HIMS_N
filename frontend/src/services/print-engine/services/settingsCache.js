/**
 * settingsCache.js — In-memory client cache with confirmed-write semantics.
 * 
 * Rules:
 * - Cache is populated on successful load.
 * - Cache is updated ONLY AFTER database confirms a save.
 * - Failed network requests NEVER dirty the cache.
 */

class SettingsCache {
  constructor() {
    this._store = new Map();
  }

  get(key) {
    return this._store.get(key) || null;
  }

  set(key, value) {
    if (value !== undefined && value !== null) {
      // Store clone to prevent external mutations
      this._store.set(key, JSON.parse(JSON.stringify(value)));
    }
  }

  invalidate(key) {
    this._store.delete(key);
  }

  clear() {
    this._store.clear();
  }
}

export const settingsCache = new SettingsCache();
export default settingsCache;
