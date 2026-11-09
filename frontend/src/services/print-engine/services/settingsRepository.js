/**
 * settingsRepository.js — Network persistence layer for print configuration.
 * 
 * Rules:
 * - Distinguishes 404 (setting genuinely absent) from 500/network offline errors.
 * - Does NOT swallow network errors; callers know when the database is unavailable.
 * - Saves slip-specific settings exclusively to their own key, preserving Master isolation.
 */

import axiosInstance from "../../../api/axiosInstance.js";
import { SLIP_SETTINGS_KEYS, normalizeSlipType } from "../config/defaults.js";

export class SettingsRepository {
  /**
   * Retrieves raw setting from database by key.
   * Returns null if key is not found (404), throws if server/network fails.
   */
  async getSettingByKey(key) {
    try {
      const res = await axiosInstance.get(`/settings/${key}`, { skipErrorToast: true });
      return res.data?.data || null;
    } catch (err) {
      const status = err?.response?.status;
      // 404: Setting not configured yet in DB (valid first-time scenario)
      if (status === 404) {
        return null;
      }
      // If backend returned 200 with null or error message
      if (err?.response?.data && err.response.data.success === false) {
        throw new Error(err.response.data.message || `Failed to fetch setting ${key}`);
      }
      // Outage, 500, network loss, or unauthorized: Propagate so UI can inform user!
      console.error(`SettingsRepository: Error fetching "${key}":`, err?.message);
      throw err;
    }
  }

  /**
   * Upserts setting into database.
   * Throws if write fails.
   */
  async updateSettingByKey(key, value) {
    try {
      const res = await axiosInstance.put(`/settings/${key}`, { value });
      return res.data?.data || res.data;
    } catch (err) {
      console.error(`SettingsRepository: Error saving "${key}":`, err?.message);
      throw err;
    }
  }

  /**
   * Loads Shared Master configuration.
   */
  async loadMasterSettings() {
    return this.getSettingByKey(SLIP_SETTINGS_KEYS.master);
  }

  /**
   * Saves Shared Master configuration.
   */
  async saveMasterSettings(settings) {
    return this.updateSettingByKey(SLIP_SETTINGS_KEYS.master, settings);
  }

  /**
   * Loads slip-specific configuration.
   */
  async loadSlipSpecificSettings(slipType) {
    const normType = normalizeSlipType(slipType);
    const dbKey = SLIP_SETTINGS_KEYS[normType] || SLIP_SETTINGS_KEYS.opd;
    return this.getSettingByKey(dbKey);
  }

  /**
   * Saves slip-specific configuration to its dedicated key.
   * NEVER touches or pollutes Master settings.
   */
  async saveSlipSpecificSettings(slipType, settings) {
    const normType = normalizeSlipType(slipType);
    const dbKey = SLIP_SETTINGS_KEYS[normType] || SLIP_SETTINGS_KEYS.opd;
    return this.updateSettingByKey(dbKey, settings);
  }
}

export const settingsRepository = new SettingsRepository();
export default settingsRepository;
