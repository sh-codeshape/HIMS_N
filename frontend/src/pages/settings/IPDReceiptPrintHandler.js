/**
 * IPDReceiptPrintHandler.js — Payment Receipt Slip Print Handler (A5 Half Page)
 *
 * Facade delegating to the unified PrintEngine.
 * Guarantees 100% adherence to Master Shared Letterhead, Demographics & Footer.
 */
import printEngine from "./printEngine.js";
import { SLIP_SAMPLE_DATA } from "./sharedPrintConfig.js";

export const IPD_RECEIPT_SETTINGS_KEY = "print_slip_ipd_receipt";
export const SAMPLE_RECEIPT_PAYLOAD = SLIP_SAMPLE_DATA?.ipd_receipt || {
  receiptNo: "REC-26-0068",
  date: "06 Nov 2026",
  time: "04:44 PM",
  amount: 5141,
  mode: "Cash Counter",
  type: "Running Bill",
  remarks: "Running Bill Interim Payment received for Test 1",
  patient: {
    name: "Ramesh Chandra Sharma",
    uhid: "UHID-2026-004481",
    admissionNo: "IPD-26-0198",
    encounterNo: "IPD-26-0198",
    age: "48",
    gender: "Male",
    mobile: "+91 98765 43210",
    ward: "ICU Ward",
    bedNo: "Bed 04",
    doctor: "Dr. Adeesh Singh (MD, FICP)",
    department: "General Medicine & Critical Care",
    address: "Plot 42, Gayatri Nagar, Hospital Road, Jaipur - 302020",
    guardian: "Sunita Sharma (Wife)",
  },
  audit: {
    totalCharges: 3000,
    totalPaid: 5141,
    pendingBalance: 0,
    excessCredit: 2141,
  },
};

export function buildReceiptHTML(receiptData = null, customSettings = null, isPrint = true) {
  return printEngine.buildSlipHTML("ipd_receipt", receiptData, customSettings, { isPreview: !isPrint });
}

export class IPDReceiptPrintHandler {
  static async loadDbSettings(forceRefresh = false) {
    return printEngine.loadSlipSettings("ipd_receipt", forceRefresh);
  }

  static async getSettings(forceRefresh = false) {
    return printEngine.loadSlipSettings("ipd_receipt", forceRefresh);
  }

  static async saveSettings(settings) {
    return printEngine.saveSlipSettings("ipd_receipt", settings);
  }

  static async printReceipt(payload = null, settingsOverride = null) {
    return printEngine.printSlip("ipd_receipt", payload || SAMPLE_RECEIPT_PAYLOAD, settingsOverride);
  }

  static buildReceiptHTML(data, settings = null, isPrint = true) {
    return buildReceiptHTML(data, settings, isPrint);
  }
}

export default IPDReceiptPrintHandler;
