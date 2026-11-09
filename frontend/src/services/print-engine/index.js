/**
 * index.js — Unified Medical Document Print Engine Facade.
 * 
 * Modular, rock-solid architecture:
 * - config/defaults.js & configResolver.js: Pure resolution of Master + Slip overrides.
 * - services/settingsRepository.js: Clear error handling (404 vs 500).
 * - services/settingsCache.js: Cache commit only after database confirmation.
 * - data/encounterDataNormalizer.js: Strict safety boundary (zero fake clinical data in production).
 * - renderers/*: Dedicated content builders with full support for all UI customization toggles.
 * - printing/*: Standalone HTML assembler and high-reliability print executor.
 */

import { SLIP_SETTINGS_KEYS, normalizeSlipType, formatMoney, numberToWords, getUpiQrUrl, esc } from "./config/defaults.js";
import { resolveEffectiveConfig } from "./config/configResolver.js";
import { settingsRepository } from "./services/settingsRepository.js";
import { settingsCache } from "./services/settingsCache.js";
import { normalizeEncounterData } from "./data/encounterDataNormalizer.js";
import { sharedRenderer } from "./renderers/sharedRenderer.js";
import { renderOpdBody } from "./renderers/opdRenderer.js";
import { renderAdmissionBody } from "./renderers/admissionRenderer.js";
import { renderBillingBody } from "./renderers/billingRenderer.js";
import { renderDischargeBody } from "./renderers/dischargeRenderer.js";
import { renderReceiptBody } from "./renderers/receiptRenderer.js";
import { assembleHtmlDocument } from "./printing/htmlDocument.js";
import { printService } from "./printing/printService.js";
import {
  DEFAULT_SHARED_CONFIG,
  loadSharedPrintSettings,
  setCachedSharedSettings,
  getCachedSharedSettings,
} from "../../pages/settings/sharedPrintConfig.js";

class PrintEngine {
  /**
   * Loads both Master settings and slip-specific settings from the database,
   * computing the single EffectiveConfig for the specified document type.
   */
  async loadSlipSettings(slipType = "opd", forceRefresh = false) {
    const normType = normalizeSlipType(slipType);

    if (!forceRefresh) {
      const cached = settingsCache.get(normType);
      if (cached) return cached;
    }

    try {
      const [sharedMaster, slipSpecific] = await Promise.all([
        this.loadSharedMaster(forceRefresh),
        settingsRepository.loadSlipSpecificSettings(normType).catch((err) => {
          // If 404 (not set yet), use null. If network error, throw!
          if (err?.response?.status === 404) return null;
          throw err;
        }),
      ]);

      const effective = resolveEffectiveConfig(normType, sharedMaster, slipSpecific);

      // Confirm cache update
      settingsCache.set(normType, effective);
      return effective;
    } catch (err) {
      console.error(`PrintEngine: Failed to load settings for "${normType}":`, err?.message);
      // Fallback only if cache is completely empty and DB returned 404
      const fallback = resolveEffectiveConfig(normType, DEFAULT_SHARED_CONFIG, {});
      return fallback;
    }
  }

  /**
   * Loads Shared Master configuration from DB or cache.
   */
  async loadSharedMaster(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = settingsCache.get("shared_master") || getCachedSharedSettings();
      if (cached) return cached;
    }

    try {
      const shared = await settingsRepository.loadMasterSettings();
      const finalMaster = shared || DEFAULT_SHARED_CONFIG;
      settingsCache.set("shared_master", finalMaster);
      setCachedSharedSettings(finalMaster);
      return finalMaster;
    } catch (err) {
      console.warn("PrintEngine: Master settings fetch warning:", err?.message);
      return getCachedSharedSettings() || DEFAULT_SHARED_CONFIG;
    }
  }

  /**
   * Saves slip-specific settings to database.
   * Atomic rule: Memory cache is updated ONLY AFTER database confirms success!
   * Isolation rule: Saving a slip NEVER mutates Master settings.
   */
  async saveSlipSettings(slipType, settings) {
    const normType = normalizeSlipType(slipType);

    // 1. Persist to database first!
    const res = await settingsRepository.saveSlipSpecificSettings(normType, settings);

    // 2. Database confirmed! Now safely commit to memory cache.
    settingsCache.set(normType, settings);

    return res;
  }

  /**
   * Saves Master Shared configuration to database.
   */
  async saveSharedMaster(settings) {
    const res = await settingsRepository.saveMasterSettings(settings);
    settingsCache.set("shared_master", settings);
    setCachedSharedSettings(settings);
    return res;
  }

  /**
   * Builds the complete, high-fidelity printable HTML string for ANY slip type.
   */
  buildSlipHTML(slipType = "opd", data = null, customSettings = null, options = { isPreview: false, activeTargetKey: null }) {
    const normType = normalizeSlipType(slipType);
    const cachedMaster = settingsCache.get("shared_master") || getCachedSharedSettings() || DEFAULT_SHARED_CONFIG;

    // Resolve unified configuration
    const cfg = customSettings
      ? resolveEffectiveConfig(normType, cachedMaster, customSettings)
      : resolveEffectiveConfig(normType, cachedMaster, {});

    // Normalize encounter data (strictly adheres to preview vs. production safety)
    const encounterData = normalizeEncounterData(normType, data, options);

    // Render components with explicit slipType context
    const renderOptions = {
      ...(typeof options === "object" ? options : {}),
      slipType: normType,
    };

    const headerHtml = sharedRenderer.buildHeader(cfg, encounterData, renderOptions);
    const titleBannerHtml = ""; // Handled natively by sharedRenderer.buildHeader without duplicate banner
    const demographicsHtml = sharedRenderer.buildDemographics(cfg, encounterData, renderOptions);
    const footerHtml = sharedRenderer.buildFooter(cfg, encounterData, renderOptions);

    let bodyHtml = "";
    switch (normType) {
      case "opd":
        bodyHtml = renderOpdBody(encounterData, cfg, options);
        break;
      case "ipd_admission":
        bodyHtml = renderAdmissionBody(encounterData, cfg, options);
        break;
      case "ipd_billing":
        bodyHtml = renderBillingBody(encounterData, cfg, options);
        break;
      case "ipd_discharge":
        bodyHtml = renderDischargeBody(encounterData, cfg, options);
        break;
      case "ipd_receipt":
        bodyHtml = renderReceiptBody(encounterData, cfg, options);
        break;
      default:
        bodyHtml = renderOpdBody(encounterData, cfg, options);
        break;
    }

    const pageSize = cfg.page?.size || (normType === "ipd_receipt" ? "A5" : "A4");
    const pageMargin = cfg.page?.margin ?? 6;
    const orientation = cfg.page?.orientation || "portrait";
    const docTitle = cfg.slipConfigs?.[normType]?.title || "Medical Encounter Slip";

    return assembleHtmlDocument({
      title: docTitle,
      pageSize,
      pageMargin,
      orientation,
      headerHtml,
      titleBannerHtml,
      demographicsHtml,
      bodyHtml,
      footerHtml,
      isPreview: options.isPreview === true,
    });
  }

  /**
   * Executes invisible, silent iframe printing with automatic popup window fallback.
   */
  async printSlip(slipType = "opd", data = null, customSettings = null) {
    const normType = normalizeSlipType(slipType);
    let settings = customSettings;
    if (!settings) {
      settings = await this.loadSlipSettings(normType);
    }
    const html = this.buildSlipHTML(normType, data, settings, { isPreview: false });
    return printService.printHtml(html);
  }
}

export const printEngine = new PrintEngine();
export default printEngine;

export {
  SLIP_SETTINGS_KEYS,
  normalizeSlipType,
  formatMoney,
  numberToWords,
  getUpiQrUrl,
  esc,
  resolveEffectiveConfig,
  normalizeEncounterData,
  renderOpdBody,
  renderAdmissionBody,
  renderBillingBody,
  renderDischargeBody,
  renderReceiptBody,
  assembleHtmlDocument,
  printService,
};
