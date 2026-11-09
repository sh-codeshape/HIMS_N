/**
 * PrintSlipHandler.js — OPD Consultation Slip Print Handler
 *
 * Facade delegating to the unified PrintEngine.
 * Guarantees 100% adherence to Master Shared Letterhead, Demographics & Footer.
 */
import printEngine from "./printEngine.js";

export class PrintSlipHandler {
  static _globalConfig = null;

  static setGlobalConfig(config) {
    this._globalConfig = config;
  }

  static async loadDbSettings(forceRefresh = false) {
    return printEngine.loadSlipSettings("opd", forceRefresh);
  }

  static async getSettings() {
    return printEngine.loadSlipSettings("opd", false);
  }

  static async printBooking(booking, customConfig = {}) {
    if (!booking) {
      console.warn("PrintSlipHandler: No booking provided");
      return;
    }
    const mergedConfig = {
      ...(this._globalConfig || {}),
      ...(customConfig || {}),
    };
    return printEngine.printSlip("opd", booking, Object.keys(mergedConfig).length > 0 ? mergedConfig : null);
  }

  static getSlipHTML(booking, customConfig = {}) {
    const mergedConfig = {
      ...(this._globalConfig || {}),
      ...(customConfig || {}),
    };
    return printEngine.buildSlipHTML("opd", booking, Object.keys(mergedConfig).length > 0 ? mergedConfig : null);
  }
}

export default PrintSlipHandler;
