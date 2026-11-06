import { formatDate } from '../utils/formatters.js';
import { getHospitalConfig } from '../data/printlslip.data.jsx';
import settingsService from '../api/services/settingsService.js';
import {
  DEFAULT_SHARED_CONFIG,
  SHARED_PRINT_CSS,
  buildSharedHeaderHTML,
  buildSharedDemographicsHTML,
  buildSharedFooterHTML,
  mergeSharedSettings,
  loadSharedPrintSettings,
} from '../pages/settings/sharedPrintConfig.js';

/**
 * PrintSlipHandler — Opens a dedicated print window with the patient slip
 * rendered as self-contained HTML + inline CSS.
 *
 * Faithfully matches the Narayan Hospital OPD Consultation Slip design
 * with dynamic branding, colors, shapes, and layout persisted via PostgreSQL settings.
 */
export class PrintSlipHandler {
  static _globalConfig = null;
  static _cachedDbSettings = null;

  static setGlobalConfig(config) {
    this._globalConfig = config;
  }

  static async loadDbSettings(forceRefresh = false) {
    if (this._cachedDbSettings && !forceRefresh) {
      return this._cachedDbSettings;
    }
    try {
      const [shared, opd] = await Promise.all([
        loadSharedPrintSettings().catch(() => null),
        settingsService.getSetting('print_slip_opd').catch(() => null),
      ]);
      const merged = {
        ...(opd || {}),
        ...(shared || {}),
        useSharedHeaderFooter: true,
        hospital: { ...(opd?.hospital || {}), ...(shared?.hospital || {}) },
        header: { ...(opd?.header || {}), ...(shared?.header || {}) },
        footer: { ...(opd?.footer || {}), ...(shared?.footer || {}) },
        patientDemographics: { ...(opd?.patientDemographics || {}), ...(shared?.patientDemographics || {}) },
        fieldStyles: { ...(opd?.fieldStyles || {}), ...(shared?.fieldStyles || {}) },
        slipConfigs: { ...(opd?.slipConfigs || {}), ...(shared?.slipConfigs || {}) },
      };
      this._cachedDbSettings = merged;
      return merged;
    } catch (e) {
      console.warn('Could not load DB slip settings, using fallbacks:', e?.message);
    }
    return null;
  }

  static _resolveConfig(booking = {}, customConfig = {}) {
    const dbSettings = this._cachedDbSettings || {};
    const mergedOverrides = {
      ...dbSettings,
      ...(this._globalConfig || {}),
      ...(customConfig || {}),
    };
    return getHospitalConfig(booking, mergedOverrides);
  }

  /**
   * Print a single booking slip.
   * If DB settings are not yet loaded, loads them before printing.
   */
  static async printBooking(booking, customConfig = {}) {
    if (!booking) return console.warn('PrintSlipHandler: No booking provided');
    if (!this._cachedDbSettings) {
      await this.loadDbSettings();
    }
    const html = this._buildSlipHTML(booking, customConfig);
    const success = await this._printViaIframe(html);
    if (!success) {
      this._openPrintWindow(booking, customConfig);
    }
  }

  static _printViaIframe(html) {
    return new Promise((resolve) => {
      try {
        let frame = document.getElementById("opd-silent-print-frame");
        if (frame) {
          try { frame.remove(); } catch (_) {}
        }
        frame = document.createElement("iframe");
        frame.id = "opd-silent-print-frame";
        frame.style.position = "fixed";
        frame.style.top = "-9999px";
        frame.style.left = "-9999px";
        frame.style.width = "1px";
        frame.style.height = "1px";
        frame.style.border = "none";
        frame.style.opacity = "0.01";
        frame.style.pointerEvents = "none";
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
            console.warn("OPD iframe print invocation failed:", e);
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
        console.warn("OPD iframe print error:", err);
        resolve(false);
      }
    });
  }

  static getSlipHTML(booking, customConfig = {}) {
    return this._buildSlipHTML(booking, customConfig);
  }

  static _buildSlipHTML(booking = {}, customConfig = {}) {
    const dbConfig = this._cachedDbSettings || {};
    const sharedConfig = mergeSharedSettings(DEFAULT_SHARED_CONFIG, {
      ...dbConfig,
      ...(customConfig || {}),
    });

    const page = sharedConfig.page || {};
    const styling = sharedConfig.styling || {};
    const particularsConfig = dbConfig.particulars || {};

    const paperSize = (page.size || styling.paperSize || "A4").toUpperCase();
    const orientation = page.orientation || "portrait";
    const marginMm = Number(page.margin !== undefined ? page.margin : 6);

    const isA5 = paperSize === "A5";
    const isLetter = paperSize === "LETTER";
    const maxSlipWidth = isA5 ? "138mm" : isLetter ? "198mm" : "194mm";

    // Normalized patient & encounter data matching OPDConsultationSlip
    const patientName = booking.patient_name || booking.patientName || booking.name || "Adeesh";
    const age = booking.age || booking.ageYrs || "44";
    const gender = booking.gender || "Male";
    const phone = booking.mobile || booking.phone || booking.mobile1 || "+91 7287901826";
    const address = [
      booking.address || booking.address_line1 || "Jansa, Varanasi",
      booking.city ? `, ${booking.city}` : "",
      booking.state ? `, ${booking.state}` : ", Uttar Pradesh",
      booking.pinCode || booking.pincode ? `, ${booking.pinCode || booking.pincode}` : ", 221405",
    ].join("").replace(/^,\s*/, "");

    const token =
      booking.token_number ||
      booking.tokenNo ||
      booking.token ||
      booking.opd_token ||
      "T-311026-GEN-03";

    const encounterNo = booking.encounterNo || booking.uhid || "OPD-26-0044";
    const encounterDate = formatDate(
      booking.encounterDate || booking.date || booking.preferredDate || booking.created_at || new Date()
    );

    const normalizedEncounter = {
      patientName,
      uhid: encounterNo,
      encounterNo,
      tokenNo: token,
      ageGender: `${age} Yrs / ${gender}`,
      mobile: phone,
      address,
      bloodGroup: booking.bloodGroup || "B+",
      admissionDate: encounterDate,
      doctor: booking.doctor || booking.doctor_name || "Dr. Adeesh Singh",
      department: booking.department || "General Medicine",
      ...booking,
    };

    // Particulars Table Rows
    let billingRows = [];
    if (Array.isArray(booking.particulars) && booking.particulars.length > 0) {
      billingRows = booking.particulars;
    } else {
      const consultFee = Number(booking.consultFee || booking.consultationFee || 500);
      const regFee = Number(booking.regFee || booking.registrationFee || 100);
      billingRows = [
        { id: "1", particular: "OPD Consultation Fee", amount: consultFee },
        { id: "2", particular: "Registration Fee", amount: regFee },
      ];
    }
    const totalAmount =
      booking.totalAmount !== undefined
        ? Number(booking.totalAmount)
        : billingRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const headerHtml = buildSharedHeaderHTML(sharedConfig, {
      isPreview: false,
      slipType: "opd",
      encounterData: normalizedEncounter,
    });

    const demoHtml = buildSharedDemographicsHTML(
      sharedConfig,
      normalizedEncounter,
      null,
      { isPreview: false, slipType: "opd" }
    );

    const footerHtml = buildSharedFooterHTML(sharedConfig, {
      isPreview: false,
      slipType: "opd",
    });

    const docTitle = sharedConfig.slipConfigs?.opd?.title || "OPD Consultation Slip";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${docTitle} — ${patientName}</title>
<style>
  @page {
    size: ${paperSize} ${orientation};
    margin: ${marginMm}mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    color: #0f172a;
    background: #ffffff;
    font-family: ${page.fontFamily || "Inter, system-ui, sans-serif"};
    font-size: 10.5px;
    line-height: 1.35;
  }
  .opd-print-page {
    width: 100%;
    max-width: ${maxSlipWidth};
    margin: 0 auto;
    padding: 4px 6px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  ${SHARED_PRINT_CSS}

  /* OPD Particulars & Billing Table */
  .opd-slip-table-wrap {
    margin-top: 6px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
  }
  .opd-slip-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }
  .opd-slip-table th {
    background: #f1f5f9;
    padding: 5px 8px;
    font-weight: 700;
    border-bottom: 1px solid #cbd5e1;
    text-align: left;
    color: #334155;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .opd-slip-table td {
    padding: 5px 8px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 10px;
    color: #0f172a;
  }
  .opd-slip-table .th-num, .opd-slip-table .td-num {
    width: 32px;
    text-align: center;
  }
  .opd-slip-table .th-amt, .opd-slip-table .td-amt {
    text-align: right;
  }
  .opd-slip-table .total-row td {
    background: #f8fafc;
    border-top: 1.5px solid #cbd5e1;
    font-weight: 800;
  }

  @media print {
    body { margin: 0; padding: 0; }
    .opd-print-page { width: 100% !important; max-width: 100% !important; padding: 0 !important; }
  }
</style>
</head>
<body>
  <div class="opd-print-page">
    <!-- 1. Master Shared Header & Letterhead -->
    ${headerHtml}

    <!-- 2. Master Shared Patient Demographics -->
    <div style="margin-top: 4px;">
      ${demoHtml}
    </div>

    <!-- 3. OPD Consultation Particulars & Charges -->
    ${particularsConfig.showTable !== false ? `
    <div class="opd-slip-table-wrap">
      <table class="opd-slip-table">
        <thead>
          <tr>
            <th class="th-num">${particularsConfig.headerIndex || "#"}</th>
            <th>${particularsConfig.headerParticulars || "Particulars"}</th>
            <th class="th-amt">${particularsConfig.headerAmount || "Amount (₹)"}</th>
          </tr>
        </thead>
        <tbody>
          ${billingRows.map((row, idx) => `
            <tr>
              <td class="td-num">${idx + 1}</td>
              <td>${row.particular || row.service || "OPD Consultation Fee"}</td>
              <td class="td-amt">₹ ${Number(row.amount || 0).toFixed(2)}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="2" style="text-align: center; font-weight: 800;">
              ${particularsConfig.totalLabel || "Total Amount"}
            </td>
            <td class="td-amt" style="font-weight: 900;">₹ ${totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    ` : ""}

    <!-- 4. Master Shared Footer, Terms, Signatures & Stamp -->
    <div style="margin-top: 6px;">
      ${footerHtml}
    </div>
  </div>
</body>
</html>`;
  }

    static _openPrintWindow(booking, customConfig = {}) {
    const html = this._buildSlipHTML(booking, customConfig);

    const printWin = window.open('', '_blank', 'width=920,height=720,scrollbars=yes');
    if (!printWin) {
      alert('Please allow pop-ups to print the patient slip.');
      return;
    }

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();

    printWin.onload = () => {
      setTimeout(() => {
        printWin.focus();
        printWin.print();
      }, 250);
    };

    setTimeout(() => {
      if (!printWin.closed) {
        printWin.focus();
        printWin.print();
      }
    }, 800);
  }
}

export default PrintSlipHandler;
