/**
 * slipVersionService.js — Multi-version snapshot & retrieval manager for print slips.
 * 
 * Rules:
 * - Completely isolated per slip type (opd, ipd_admission, ipd_billing, etc.).
 * - On saving: prompts for version name and permanent save flag.
 * - Auto-rotation: retains at least the last 5 non-permanent versions.
 * - Permanent versions (isPermanent: true) are pinned forever and never auto-pruned.
 * - Dual persistence: Persists to DB setting `print_slip_versions_<type>` with localStorage mirror.
 */

import axiosInstance from "../../../api/axiosInstance.js";
import { normalizeSlipType } from "../config/defaults.js";

const LOCAL_STORAGE_PREFIX = "hims_print_versions_";
const MAX_RECENT_VERSIONS = 5;

export class SlipVersionService {
  getSettingKey(slipType) {
    const norm = normalizeSlipType(slipType);
    return `print_slip_versions_${norm}`;
  }

  getLocalStorageKey(slipType) {
    const norm = normalizeSlipType(slipType);
    return `${LOCAL_STORAGE_PREFIX}${norm}`;
  }

  /**
   * Retrieves all saved version snapshots for a slip type.
   */
  async getVersions(slipType) {
    const dbKey = this.getSettingKey(slipType);
    const localKey = this.getLocalStorageKey(slipType);

    let versions = [];

    // 1. Try DB first
    try {
      const res = await axiosInstance.get(`/settings/${dbKey}`, { skipErrorToast: true });
      const raw = res.data?.data;
      if (raw && Array.isArray(raw.versions)) {
        versions = raw.versions;
      }
    } catch (_) {
      // Fallback to local storage if DB call returns 404 or fails
    }

    // 2. Fallback / merge with local storage
    if (versions.length === 0 && typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(localKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            versions = parsed;
          }
        }
      } catch (_) {}
    }

    // Sort descending by timestamp (newest first)
    versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return versions;
  }

  /**
   * Saves a new version snapshot for a slip type.
   * Enforces keeping at least last 5 recent versions + all permanent versions.
   */
  async saveVersion(slipType, settings, versionName, isPermanent = false) {
    const norm = normalizeSlipType(slipType);
    const dbKey = this.getSettingKey(slipType);
    const localKey = this.getLocalStorageKey(slipType);

    const existingVersions = await this.getVersions(norm);

    const now = new Date();
    const formattedDate = now.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const newSnapshot = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: versionName && versionName.trim().length > 0
        ? versionName.trim()
        : `Version ${existingVersions.length + 1} • ${formattedDate}`,
      timestamp: now.toISOString(),
      formattedDate,
      isPermanent: Boolean(isPermanent),
      slipType: norm,
      settings: JSON.parse(JSON.stringify(settings || {})),
      summary: {
        title: settings?.slipConfigs?.[norm]?.title || "Medical Slip",
        copyBadge: settings?.slipConfigs?.[norm]?.copyBadge || "Patient Copy",
        showTerms: !settings?.slipConfigs?.[norm]?.inactiveElements?.includes("terms.card"),
        showSignatures: !settings?.slipConfigs?.[norm]?.inactiveElements?.includes("signatures.card"),
        inactiveCount: (settings?.slipConfigs?.[norm]?.inactiveElements || []).length,
      },
    };

    // Separate permanent from recent
    const permanentVersions = existingVersions.filter((v) => v.isPermanent);
    const recentVersions = existingVersions.filter((v) => !v.isPermanent);

    let updatedList = [];
    if (isPermanent) {
      updatedList = [newSnapshot, ...permanentVersions, ...recentVersions.slice(0, MAX_RECENT_VERSIONS)];
    } else {
      const trimmedRecent = [newSnapshot, ...recentVersions].slice(0, MAX_RECENT_VERSIONS);
      updatedList = [...permanentVersions, ...trimmedRecent];
    }

    // Sort descending by timestamp
    updatedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Persist to DB
    try {
      await axiosInstance.put(`/settings/${dbKey}`, {
        value: {
          versions: updatedList,
          lastUpdated: now.toISOString(),
        },
      });
    } catch (err) {
      console.warn(`SlipVersionService: Failed to save versions to DB for ${norm}:`, err?.message);
    }

    // Persist to localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(localKey, JSON.stringify(updatedList));
      } catch (_) {}
    }

    return {
      newVersion: newSnapshot,
      allVersions: updatedList,
    };
  }

  /**
   * Toggles permanent flag for an existing version snapshot.
   */
  async togglePermanent(slipType, versionId) {
    const norm = normalizeSlipType(slipType);
    const dbKey = this.getSettingKey(slipType);
    const localKey = this.getLocalStorageKey(slipType);

    const versions = await this.getVersions(norm);
    const target = versions.find((v) => v.id === versionId);
    if (!target) return versions;

    target.isPermanent = !target.isPermanent;

    // Persist update
    try {
      await axiosInstance.put(`/settings/${dbKey}`, {
        value: {
          versions,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (_) {}

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(localKey, JSON.stringify(versions));
      } catch (_) {}
    }

    return versions;
  }

  /**
   * Deletes a specific version snapshot.
   */
  async deleteVersion(slipType, versionId) {
    const norm = normalizeSlipType(slipType);
    const dbKey = this.getSettingKey(slipType);
    const localKey = this.getLocalStorageKey(slipType);

    const versions = await this.getVersions(norm);
    const filtered = versions.filter((v) => v.id !== versionId);

    try {
      await axiosInstance.put(`/settings/${dbKey}`, {
        value: {
          versions: filtered,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (_) {}

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(localKey, JSON.stringify(filtered));
      } catch (_) {}
    }

    return filtered;
  }
}

export const slipVersionService = new SlipVersionService();
export default slipVersionService;
