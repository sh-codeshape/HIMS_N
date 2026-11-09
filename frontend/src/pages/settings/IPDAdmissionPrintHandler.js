/**
 * IPDAdmissionPrintHandler.js — Inpatient Admission Ticket Print Handler
 *
 * Facade delegating to the unified PrintEngine.
 * Guarantees 100% adherence to Master Shared Letterhead, Demographics & Footer.
 */
import printEngine from "./printEngine.js";

export function buildAdmissionTicketHTML(data = null, settings = null, options = { isPreview: false, activeTargetKey: null }) {
  return printEngine.buildSlipHTML("ipd_admission", data, settings, options);
}

export function printAdmissionTicket(data, settings = null) {
  return printEngine.printSlip("ipd_admission", data, settings);
}

export class IPDAdmissionPrintHandler {
  static async loadDbSettings(forceRefresh = false) {
    return printEngine.loadSlipSettings("ipd_admission", forceRefresh);
  }

  static async getSettings(forceRefresh = false) {
    return printEngine.loadSlipSettings("ipd_admission", forceRefresh);
  }

  static async saveSettings(settings) {
    return printEngine.saveSlipSettings("ipd_admission", settings);
  }

  static async printAdmissionTicket(data, settings = null) {
    return printEngine.printSlip("ipd_admission", data, settings);
  }

  static buildAdmissionTicketHTML(data, settings = null, options = { isPreview: false }) {
    return printEngine.buildSlipHTML("ipd_admission", data, settings, options);
  }
}

export default IPDAdmissionPrintHandler;
