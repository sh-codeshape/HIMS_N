/**
 * IPDBillingPrintHandler.js — Inpatient Billing & Tax Invoice Print Handler
 *
 * Facade delegating to the unified PrintEngine.
 * Guarantees 100% adherence to Master Shared Letterhead, Demographics & Footer.
 */
import printEngine from "./printEngine.js";

export function buildBillingHTML(data = null, settings = null, isPrint = true) {
  return printEngine.buildSlipHTML("ipd_billing", data, settings, { isPreview: !isPrint });
}

export class IPDBillingPrintHandler {
  static async loadDbSettings(forceRefresh = false) {
    return printEngine.loadSlipSettings("ipd_billing", forceRefresh);
  }

  static async getSettings(forceRefresh = false) {
    return printEngine.loadSlipSettings("ipd_billing", forceRefresh);
  }

  static async saveSettings(settings) {
    return printEngine.saveSlipSettings("ipd_billing", settings);
  }

  static async printBillingSlip(payload = null, settingsOverride = null) {
    return printEngine.printSlip("ipd_billing", payload, settingsOverride);
  }

  static buildBillingHTML(data, settings = null, isPrint = true) {
    return buildBillingHTML(data, settings, isPrint);
  }
}

export default IPDBillingPrintHandler;
