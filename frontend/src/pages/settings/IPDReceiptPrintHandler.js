import settingsService from "../../api/services/settingsService.js";
import { numberToWords } from "./ipdBillingPrintConfig.js";
import {
  DEFAULT_SHARED_CONFIG,
  SHARED_PRINT_CSS,
  buildSharedHeaderHTML,
  buildSharedDemographicsHTML,
  buildSharedFooterHTML,
  mergeSharedSettings,
  loadSharedPrintSettings,
  getCachedSharedSettings,
  setCachedSharedSettings,
} from "./sharedPrintConfig.js";

export const IPD_RECEIPT_SETTINGS_KEY = "print_slip_ipd_receipt";

export const SAMPLE_RECEIPT_PAYLOAD = {
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

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] || c
  );

/**
 * Builds high-fidelity HTML for the Half-Page (A5) Payment Receipt Slip.
 * Reuses the Master Shared Header, Demographics, Footer, and Styles!
 */
export function buildReceiptHTML(receiptData = SAMPLE_RECEIPT_PAYLOAD, customSettings = null, isPrint = true) {
  const master = getCachedSharedSettings() || DEFAULT_SHARED_CONFIG;
  const cfg = mergeSharedSettings(master, customSettings || {});

  const pay = receiptData || SAMPLE_RECEIPT_PAYLOAD;
  const pat = pay.patient || SAMPLE_RECEIPT_PAYLOAD.patient;
  const audit = pay.audit || {
    totalCharges: 0,
    totalPaid: pay.amount || 0,
    pendingBalance: 0,
    excessCredit: 0,
  };

  const slipMeta = cfg.slipConfigs?.ipd_receipt || {};
  const docTitle = slipMeta.title || "OFFICIAL PAYMENT RECEIPT & CASH VOUCHER";
  const copyBadge = slipMeta.copyBadge || "ORIGINAL FOR PATIENT";

  // Build encounter dataset for shared header & demographics
  const encounterData = {
    patientName: pat.name,
    uhid: pat.uhid,
    ipdNo: pat.admissionNo,
    encounterNo: pay.receiptNo,
    tokenNo: pay.receiptNo,
    ageGender: `${pat.age || "—"} Y / ${pat.gender || "—"}`,
    mobile: pat.mobile || "—",
    address: pat.address || "—",
    doctor: pat.doctor || "—",
    department: pat.department || "—",
    guardian: pat.guardian || "—",
    wardBed: `${pat.ward || ""} ${pat.bedNo ? `- ${pat.bedNo}` : ""}`.trim(),
  };

  // Reusable Shared Header
  const headerHtml = buildSharedHeaderHTML(cfg, {
    isPreview: false,
    slipType: "ipd_receipt",
    titleOverride: docTitle,
    copyBadgeOverride: copyBadge,
    encounterData,
  });

  // Reusable Shared Demographics Block
  const demoHtml = buildSharedDemographicsHTML(cfg, encounterData, null, {
    isPreview: false,
    slipType: "ipd_receipt",
  });

  // Reusable Shared Footer
  const footerHtml = buildSharedFooterHTML(cfg, {
    isPreview: false,
    slipType: "ipd_receipt",
  });

  const amountVal = Number(pay.amount || 0);
  const wordsText = numberToWords(amountVal);

  const categoryName =
    pay.type === "Advance" || pay.category === "Advance"
      ? "Initial Advance Deposit"
      : pay.type === "Settlement" || pay.category === "Settlement"
      ? "Discharge Settlement"
      : pay.type === "Refund" || pay.category === "Refund"
      ? "Refund Payment"
      : "Running Bill Interim Payment";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Receipt - ${esc(pay.receiptNo || "REC-0001")}</title>
  <style>
    @page {
      size: A5 portrait;
      margin: ${cfg.page?.margin ?? 5}mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: ${cfg.page?.fontFamily || "Inter, system-ui, sans-serif"};
      font-size: 9px;
      line-height: 1.35;
    }
    .receipt-half-page {
      width: 100%;
      max-width: 142mm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
    }

    ${SHARED_PRINT_CSS}

    /* ── RECEIPT-SPECIFIC TRANSACTION CARD ── */
    .receipt-trans-card {
      border: 1.5px solid #0284c7;
      border-radius: 8px;
      padding: 8px 10px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .receipt-trans-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e0f2fe;
      padding-bottom: 4px;
      margin-bottom: 6px;
      background: #f0f9ff;
      margin: -8px -10px 8px -10px;
      padding: 6px 10px;
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
    }
    .receipt-trans-title {
      font-size: 10px;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .receipt-trans-badge {
      font-size: 8px;
      font-weight: 800;
      background: #0284c7;
      color: #ffffff;
      padding: 1px 6px;
      border-radius: 3px;
      font-family: monospace;
    }

    .receipt-amount-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 6px;
    }
    .receipt-amt-display {
      background: #f8fafc;
      border: 1.5px dashed #0284c7;
      border-radius: 6px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .receipt-amt-lbl {
      font-size: 7.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .receipt-amt-big {
      font-size: 18px;
      font-weight: 900;
      color: #059669;
      font-family: monospace;
      line-height: 1.2;
      margin: 2px 0;
    }
    .receipt-amt-words {
      font-size: 7.5px;
      color: #334155;
      font-style: italic;
      line-height: 1.3;
    }
    .receipt-amt-words strong {
      font-weight: 700;
      color: #0f172a;
    }

    .receipt-meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 8.5px;
    }
    .receipt-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .receipt-meta-row span {
      color: #64748b;
    }
    .receipt-meta-row strong {
      color: #0f172a;
      font-weight: 700;
    }

    /* Ledger Summary Bar */
    .receipt-ledger-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      background: #f1f5f9;
      border-radius: 6px;
      padding: 5px 8px;
      font-size: 8px;
      text-align: center;
      margin-top: 4px;
    }
    .receipt-ledger-cell span {
      display: block;
      color: #64748b;
      font-size: 7px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .receipt-ledger-cell strong {
      font-size: 9px;
      font-weight: 800;
      color: #0f172a;
    }

    @media print {
      body {
        width: 100% !important;
        background: transparent !important;
      }
      .receipt-half-page {
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-half-page">
    ${headerHtml}
    ${demoHtml}

    <!-- ── RECEIPT DETAILS CARD ── -->
    <div class="receipt-trans-card">
      <div class="receipt-trans-header">
        <span class="receipt-trans-title">💳 Official Cash &amp; Digital Payment Voucher</span>
        <span class="receipt-trans-badge">${esc(pay.receiptNo)}</span>
      </div>

      <div class="receipt-amount-grid">
        <div class="receipt-amt-display">
          <span class="receipt-amt-lbl">Received Net Amount</span>
          <div class="receipt-amt-big">₹ ${amountVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          <div class="receipt-amt-words">In Words: <strong>${esc(wordsText)}</strong></div>
        </div>

        <div class="receipt-meta-box">
          <div class="receipt-meta-row">
            <span>Category:</span>
            <strong>${esc(categoryName)}</strong>
          </div>
          <div class="receipt-meta-row">
            <span>Payment Mode:</span>
            <strong style="color: #0284c7;">${esc(pay.mode || "Cash Counter")}</strong>
          </div>
          <div class="receipt-meta-row">
            <span>Date &amp; Time:</span>
            <span>${esc(pay.date || "")} ${esc(pay.time || "")}</span>
          </div>
          <div class="receipt-meta-row">
            <span>Transaction Notes:</span>
            <span style="font-style: italic; color: #475569; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${esc(pay.remarks || "Counter Receipt")}
            </span>
          </div>
        </div>
      </div>

      <!-- Financial Snapshot Bar -->
      <div class="receipt-ledger-bar">
        <div class="receipt-ledger-cell">
          <span>Charges Incurred</span>
          <strong>₹ ${Number(audit.totalCharges || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
        </div>
        <div class="receipt-ledger-cell">
          <span>Receipts Recorded</span>
          <strong style="color: #059669;">₹ ${Number(audit.totalPaid || amountVal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
        </div>
        <div class="receipt-ledger-cell">
          <span>${Number(audit.excessCredit || 0) > 0 ? "Excess Advance Credit" : "Remaining Due"}</span>
          <strong style="color: ${Number(audit.excessCredit || 0) > 0 ? "#0284c7" : Number(audit.pendingBalance || 0) > 0 ? "#dc2626" : "#059669"};">
            ₹ ${Number(audit.excessCredit || audit.pendingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>
    </div>

    ${footerHtml}
  </div>
</body>
</html>`;
}

export class IPDReceiptPrintHandler {
  static _cachedSettings = null;

  static async loadDbSettings(forceRefresh = false) {
    if (this._cachedSettings && !forceRefresh) {
      return this._cachedSettings;
    }
    try {
      const data = await settingsService.getSetting(IPD_RECEIPT_SETTINGS_KEY);
      if (data && typeof data === "object" && Object.keys(data).length > 0) {
        this._cachedSettings = data;
        return data;
      }
    } catch (err) {
      console.warn("Could not fetch IPD receipt print settings from server, falling back to master:", err);
    }
    const master = (await loadSharedPrintSettings()) || DEFAULT_SHARED_CONFIG;
    this._cachedSettings = master;
    return master;
  }

  static async getSettings() {
    return this.loadDbSettings(false);
  }

  static async saveSettings(settings) {
    this._cachedSettings = settings;
    return await settingsService.updateSetting(IPD_RECEIPT_SETTINGS_KEY, settings);
  }

  static async printReceipt(payload = SAMPLE_RECEIPT_PAYLOAD, settingsOverride = null) {
    const settings = settingsOverride || (await this.loadDbSettings());
    const html = buildReceiptHTML(payload, settings, false);

    // Silent hidden iframe printing
    const printedViaIframe = await this._printViaIframe(html);
    if (!printedViaIframe) {
      this._printViaWindow(html);
    }
  }

  static _printViaIframe(html) {
    return new Promise((resolve) => {
      try {
        let frame = document.getElementById("hims-ipd-receipt-print-frame");
        if (frame) frame.remove();

        frame = document.createElement("iframe");
        frame.id = "hims-ipd-receipt-print-frame";
        frame.style.position = "fixed";
        frame.style.right = "0";
        frame.style.bottom = "0";
        frame.style.width = "0";
        frame.style.height = "0";
        frame.style.border = "none";
        frame.style.visibility = "hidden";
        document.body.appendChild(frame);

        const win = frame.contentWindow;
        if (!win) {
          resolve(false);
          return;
        }

        const doc = win.document;
        doc.open();
        doc.write(html);
        doc.close();

        let printed = false;
        const trigger = () => {
          if (printed) return;
          printed = true;
          try {
            win.focus();
            win.print();
            resolve(true);
          } catch (e) {
            console.warn("Iframe print invocation failed:", e);
            resolve(false);
          }
        };

        if (doc.readyState === "complete") {
          setTimeout(trigger, 250);
        } else {
          win.onload = () => setTimeout(trigger, 200);
          setTimeout(trigger, 600);
        }
      } catch (err) {
        console.warn("Iframe print error:", err);
        resolve(false);
      }
    });
  }

  static _printViaWindow(html) {
    const printWindow = window.open("", "_blank", "width=850,height=750,scrollbars=yes,menubar=yes,status=yes");
    if (!printWindow) {
      window.alert("Please allow pop-ups for this site to print the receipt slip.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (_) {}
    }, 350);
  }
}

export default IPDReceiptPrintHandler;
