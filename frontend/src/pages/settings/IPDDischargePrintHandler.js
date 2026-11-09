/**
 * IPDDischargePrintHandler.js — Inpatient Discharge Summary Print Handler
 *
 * Facade delegating to the unified PrintEngine.
 * Guarantees 100% adherence to Master Shared Letterhead, Demographics & Footer.
 */
import printEngine from "./printEngine.js";

export function buildIPDDischargeHTML(data = null, settings = null, autoPrint = true) {
  return printEngine.buildSlipHTML("ipd_discharge", data, settings, { isPreview: !autoPrint });
}

export class IPDDischargePrintHandler {
  static async getSettings(forceRefresh = false) {
    return printEngine.loadSlipSettings("ipd_discharge", forceRefresh);
  }

  static async loadDbSettings(forceRefresh = false) {
    return printEngine.loadSlipSettings("ipd_discharge", forceRefresh);
  }

  static async saveSettings(settings) {
    return printEngine.saveSlipSettings("ipd_discharge", settings);
  }

  static async printDischargeSummary(payload = null, settingsOverride = null) {
    return printEngine.printSlip("ipd_discharge", payload, settingsOverride);
  }

  static buildIPDDischargeHTML(data, settings = null, autoPrint = true) {
    return buildIPDDischargeHTML(data, settings, autoPrint);
  }
}

export default IPDDischargePrintHandler;
