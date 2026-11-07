import settingsService from "../../api/services/settingsService.js";
import {
  DEFAULT_IPD_BILLING_SETTINGS,
  IPD_BILLING_SETTINGS_KEY,
  mergeIPDBillingSettings,
  cloneIPDBillingSettings,
  SAMPLE_IPD_BILLING_DATA,
  numberToWords,
} from "./ipdBillingPrintConfig.js";
import {
  DEFAULT_SHARED_CONFIG,
  SHARED_PRINT_CSS,
  buildSharedHeaderHTML,
  mergeSharedSettings,
  loadSharedPrintSettings,
  getCachedSharedSettings,
} from "./sharedPrintConfig.js";

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

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

// SVG Barcode Generator (clean Code 128 / vector-rendered barcode)
function generateSvgBarcode(code = "INV-0001", width = 180, height = 36) {
  const bars = [];
  let x = 8;
  const hash = String(code)
    .split("")
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 7);
  let seed = Math.abs(hash);

  for (let i = 0; i < 48; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const w = (seed % 3) + 1;
    const isBar = (seed >> 3) % 2 === 0;
    if (isBar && x < width - 10) {
      bars.push(`<rect x="${x}" y="2" width="${w}" height="${height - 14}" fill="#0f172a" />`);
    }
    x += w + 1;
    if (x >= width - 10) break;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
      ${bars.join("")}
      <text x="${width / 2}" y="${height - 2}" font-family="monospace" font-size="8" fill="#475569" text-anchor="middle" font-weight="600">${esc(code)}</text>
    </svg>
  `;
}

// Quick UPI QR Code generator URL
function getUpiQrUrl(upiId, amount, name, ref) {
  if (!upiId) return "";
  const params = new URLSearchParams({
    pa: upiId,
    pn: name || "Narayan Hospital",
    am: Number(amount || 0).toFixed(2),
    cu: "INR",
    tn: `Bill Settlement ${ref || ""}`,
  });
  const upiString = `upi://pay?${params.toString()}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=4&data=${encodeURIComponent(upiString)}`;
}

export function buildBillingHTML(data = SAMPLE_IPD_BILLING_DATA, settings = DEFAULT_IPD_BILLING_SETTINGS, isPrint = true) {
  const cfg = mergeIPDBillingSettings(DEFAULT_IPD_BILLING_SETTINGS, settings);
  const { hospital, header, gst, page, style, patient, admission, charges, settlement, bankDetails, signatures, terms } = cfg;

  const primary = style.primary || "#0f2e5a";
  const accent = style.accent || "#0284c7";
  const text = style.text || "#17263b";
  const muted = style.muted || "#64748b";
  const border = style.border || "#cbd5e1";
  const headerBg = style.headerBg || "#f1f5f9";
  const fontFam = page.fontFamily || "Inter, system-ui, -apple-system, sans-serif";
  const fontSize = page.fontSize || 10;
  const isCompact = page.compact === true;
  const isThermal = page.size === "Thermal";
  const isStationery = hospital.letterheadMode === "stationery";

  // Shared Master Header Configuration
  const cachedShared = getCachedSharedSettings() || {};
  const isUsingShared = settings.useSharedHeaderFooter !== false;

  const sharedConfig = mergeSharedSettings(DEFAULT_SHARED_CONFIG, {
    ...settings,
    hospital: isUsingShared
      ? { ...(settings.hospital || {}), ...(cachedShared.hospital || {}) }
      : { ...(DEFAULT_SHARED_CONFIG.hospital || {}), ...(settings.hospital || {}) },
    header: isUsingShared
      ? { ...(settings.header || {}), ...(cachedShared.header || {}) }
      : { ...(DEFAULT_SHARED_CONFIG.header || {}), ...(settings.header || {}) },
    fieldStyles: isUsingShared
      ? { ...(settings.fieldStyles || {}), ...(cachedShared.fieldStyles || {}) }
      : { ...(DEFAULT_SHARED_CONFIG.fieldStyles || {}), ...(settings.fieldStyles || {}) },
    slipConfigs: isUsingShared
      ? { ...(settings.slipConfigs || {}), ...(cachedShared.slipConfigs || {}) }
      : { ...(DEFAULT_SHARED_CONFIG.slipConfigs || {}), ...(settings.slipConfigs || {}) },
  });

  // Data extraction with safe fallbacks
  const p = data.patient || {};
  const adm = data.admission || {};
  const items = data.items || [];
  const totals = data.totals || {};
  const payments = data.payments || [];
  const deptSummaries = data.departmentSummaries || [];

  const invoiceNo = data.invoiceNo || `INV-${adm.admissionNo || "1001"}`;
  const invoiceDate = data.invoiceDate || new Date().toLocaleDateString("en-IN");
  const generatedAt = data.generatedAt || new Date().toLocaleString("en-IN");
  const copyType = header.copyType || data.copyType || "ORIGINAL FOR RECIPIENT";

  const normalizedEncounter = {
    patientName: p.name || "Patient",
    uhid: p.uhid || "UHID-2026-098",
    encounterNo: adm.admissionNo || "IPD-2026-4401",
    ipdNo: adm.admissionNo || "IPD-2026-4401",
    tokenNo: adm.admissionNo || "IPD-2026-4401",
    admissionDate: adm.admissionDate || "24 Oct 2026",
    doctor: adm.consultant || "Dr. S. K. Sharma",
    department: adm.department || "Cardiology",
    ...data,
  };

  const sharedHeaderHtml = buildSharedHeaderHTML(sharedConfig, {
    isPreview: !isPrint,
    slipType: "ipd_billing",
    encounterData: normalizedEncounter,
    titleOverride: header.title || "INPATIENT FINAL TAX INVOICE",
    copyBadgeOverride: copyType || "ORIGINAL FOR RECIPIENT",
  });

  // Financial Calculations with GST logic
  const grossCharges = Number(totals.grossCharges ?? items.reduce((acc, it) => acc + (it.qty * it.rate), 0));
  const concessions = Number(totals.concessions ?? items.reduce((acc, it) => acc + (it.discount || 0), 0));
  const taxableAmount = Math.max(0, grossCharges - concessions);

  let cgstRate = gst.cgstRate || 0;
  let sgstRate = gst.sgstRate || 0;
  let igstRate = gst.igstRate || 0;

  if (gst.mode === "taxable") {
    if (gst.isInterState) {
      igstRate = gst.taxRate || 5;
      cgstRate = 0;
      sgstRate = 0;
    } else {
      cgstRate = (gst.taxRate || 5) / 2;
      sgstRate = (gst.taxRate || 5) / 2;
      igstRate = 0;
    }
  }

  const cgstAmount = Number(totals.cgstAmount ?? ((taxableAmount * cgstRate) / 100));
  const sgstAmount = Number(totals.sgstAmount ?? ((taxableAmount * sgstRate) / 100));
  const igstAmount = Number(totals.igstAmount ?? ((taxableAmount * igstRate) / 100));
  const totalTax = cgstAmount + sgstAmount + igstAmount;

  const rawNet = taxableAmount + totalTax;
  const roundedNet = Math.round(rawNet);
  const roundOff = page.roundOffToRupee ? Number((roundedNet - rawNet).toFixed(2)) : 0;
  const finalNetBillable = page.roundOffToRupee ? roundedNet : rawNet;

  const totalPaid = Number(totals.totalPaid ?? payments.reduce((acc, py) => acc + py.amount, 0));
  const balanceDue = Math.max(0, finalNetBillable - totalPaid);
  const excessAdvance = Math.max(0, totalPaid - finalNetBillable);

  let settlementStatus = totals.settlementStatus || (balanceDue > 0 ? "DUE" : excessAdvance > 0 ? "EXCESS" : "CLEARED");

  // Page geometry rule
  const pageSizeRule = isThermal
    ? `@page { size: 80mm auto; margin: ${page.margin || 4}mm; }`
    : `@page { size: ${page.size || "A4"} ${page.orientation || "portrait"}; margin: ${page.margin || 8}mm; }`;

  // Filter columns
  const cols = charges.columns || {};
  const visibleCols = Object.keys(cols).filter((k) => cols[k]?.show !== false);

  // Group items by department if enabled
  let groupedItems = {};
  if (charges.groupByDepartment) {
    items.forEach((it) => {
      const dept = it.department || "Other Charges";
      if (!groupedItems[dept]) groupedItems[dept] = [];
      groupedItems[dept].push(it);
    });
  } else {
    groupedItems = { "ALL": items };
  }

  // Stamp styling
  let stampText = settlement.stampTextPaid || "✓ PAID & SETTLED IN FULL";
  let stampTheme = "stamp--paid";
  if (settlementStatus === "DUE") {
    stampText = `${settlement.stampTextDue || "⚠ BALANCE PAYABLE"}: ${money(balanceDue)}`;
    stampTheme = "stamp--due";
  } else if (settlementStatus === "EXCESS") {
    stampText = `${settlement.stampTextExcess || "★ EXCESS ADVANCE"}: ${money(excessAdvance)}`;
    stampTheme = "stamp--excess";
  }

  // Barcode and UPI QR
  const barcodeSvg = header.showBarcode ? generateSvgBarcode(invoiceNo, 180, 36) : "";
  const upiQrUrl = bankDetails.show && bankDetails.showUpiQr && balanceDue > 0
    ? getUpiQrUrl(bankDetails.upiId, balanceDue, hospital.name, adm.admissionNo)
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(header.title)} - ${esc(p.name || "")} (${esc(adm.admissionNo || "")})</title>
  <style>
    ${pageSizeRule}
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: ${fontFam};
      font-size: ${fontSize}px;
      color: ${text};
      line-height: 1.35;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .bill-wrap {
      width: 100%;
      max-width: ${isThermal ? "76mm" : "100%"};
      margin: 0 auto;
      padding: ${isThermal ? "2mm" : "0"};
      position: relative;
    }

    ${page.showWatermark ? `
    .watermark {
      position: fixed;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 58px;
      font-weight: 800;
      color: rgba(15, 46, 90, ${page.watermarkOpacity || 0.05});
      text-transform: uppercase;
      letter-spacing: 6px;
      pointer-events: none;
      z-index: 0;
      border: 6px dashed rgba(15, 46, 90, ${page.watermarkOpacity || 0.05});
      padding: 12px 28px;
      border-radius: 12px;
    }
    ` : ""}

    /* Stationery Top Margin Mode */
    ${isStationery ? `
    .stationery-spacer {
      height: ${hospital.stationeryTopMargin || 45}mm;
      width: 100%;
    }
    ` : ""}

    /* Master Shared Header & Positioning CSS */
    ${SHARED_PRINT_CSS}

    /* Letterhead Header */
    .bill-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
      border-bottom: 2.5px solid ${primary};
      padding-bottom: ${isCompact ? "6px" : "10px"};
      margin-bottom: ${isCompact ? "6px" : "10px"};
    }
    .bill-brand-left {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
    }
    .bill-logo {
      height: ${hospital.logoHeight || 52}px;
      max-width: 170px;
      object-fit: contain;
    }
    .bill-hosp-name {
      font-size: ${fontSize + 7}px;
      font-weight: 900;
      color: ${primary};
      text-transform: uppercase;
      letter-spacing: 0.6px;
      line-height: 1.15;
      margin-bottom: 2px;
    }
    .bill-hosp-sub {
      font-size: ${fontSize - 1.5}px;
      font-weight: 700;
      color: ${accent};
      letter-spacing: 0.4px;
      margin-bottom: 4px;
    }
    .bill-accred-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 4px;
    }
    .bill-accred-badge {
      background: #f8fafc;
      border: 1px solid ${border};
      color: ${primary};
      font-size: ${fontSize - 2.5}px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      letter-spacing: 0.3px;
    }
    .bill-hosp-meta {
      font-size: ${fontSize - 2}px;
      color: ${muted};
      line-height: 1.35;
    }

    /* Tax / GST Compliance Box */
    .bill-tax-box {
      border: 1.5px solid ${border};
      background: ${headerBg};
      border-radius: 4px;
      padding: 6px 10px;
      min-width: 210px;
      text-align: right;
      font-size: ${fontSize - 1.5}px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .bill-tax-title {
      font-size: ${fontSize - 1}px;
      font-weight: 800;
      color: ${primary};
      border-bottom: 1px dashed ${border};
      padding-bottom: 3px;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
    }
    .bill-tax-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 2px;
    }
    .bill-tax-row span {
      color: ${muted};
    }
    .bill-tax-row strong {
      color: ${text};
      font-family: monospace;
      font-size: ${fontSize - 1}px;
    }

    /* Document Title Banner */
    .bill-banner {
      background: ${primary};
      color: #ffffff;
      padding: ${isCompact ? "4px 8px" : "6px 12px"};
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 4px;
      margin-bottom: ${isCompact ? "6px" : "10px"};
    }
    .bill-banner-title {
      font-size: ${fontSize + 1.5}px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .bill-banner-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .bill-copy-pill {
      background: #ffd766;
      color: #0b2556;
      font-weight: 800;
      font-size: ${fontSize - 2}px;
      padding: 2px 7px;
      border-radius: 3px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .bill-banner-meta {
      font-size: ${fontSize - 2}px;
      font-weight: 500;
      opacity: 0.95;
    }

    /* Demographics & Admission Grid */
    .bill-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${isCompact ? "8px" : "12px"};
      margin-bottom: ${isCompact ? "6px" : "10px"};
    }
    .bill-card {
      border: 1px solid ${border};
      border-radius: 4px;
      overflow: hidden;
      background: #ffffff;
    }
    .bill-card-hdr {
      background: ${headerBg};
      border-bottom: 1px solid ${border};
      padding: ${isCompact ? "3px 8px" : "4px 10px"};
      font-size: ${fontSize - 1}px;
      font-weight: 800;
      color: ${primary};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .bill-card-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fontSize - 1}px;
    }
    .bill-card-table td {
      padding: ${isCompact ? "2.5px 6px" : "3.5px 8px"};
      vertical-align: top;
      border-bottom: 1px solid #f1f5f9;
    }
    .bill-card-table tr:last-child td {
      border-bottom: none;
    }
    .k-cell {
      width: 38%;
      color: ${muted};
      font-weight: 500;
      font-size: ${fontSize - 1.5}px;
    }
    .sep-cell {
      width: 4%;
      text-align: center;
      color: ${muted};
    }
    .v-cell {
      width: 58%;
      color: ${text};
      font-weight: 600;
    }
    .v-cell--code {
      font-family: monospace;
      color: ${primary};
      font-weight: 800;
      letter-spacing: 0.4px;
    }

    /* Itemized Table */
    .bill-table-section {
      margin-bottom: ${isCompact ? "6px" : "10px"};
      border: 1px solid ${border};
      border-radius: 4px;
      overflow: hidden;
    }
    .bill-table-hdr {
      background: ${headerBg};
      padding: ${isCompact ? "3px 8px" : "5px 10px"};
      font-size: ${fontSize - 1}px;
      font-weight: 800;
      color: ${primary};
      text-transform: uppercase;
      border-bottom: 1px solid ${border};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .bill-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fontSize - 1}px;
    }
    .bill-items-table th {
      background: ${primary};
      color: #ffffff;
      font-weight: 800;
      border: 1px solid ${primary};
      padding: ${isCompact ? "4px 6px" : "6px 8px"};
      text-align: left;
      font-size: ${fontSize - 1.5}px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .bill-items-table td {
      padding: ${isCompact ? "3px 6px" : "5px 8px"};
      border-bottom: 1px solid #cbd5e1;
      vertical-align: middle;
    }
    ${style.zebraStriping ? `
    .bill-items-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    ` : ""}

    /* Department Section Banner in Table */
    .dept-banner-row td {
      background: #f0f7ff !important;
      font-weight: 800;
      color: ${primary};
      padding: 6px 10px;
      font-size: ${fontSize - 0.5}px;
      border-top: 1.5px solid #cbd5e1;
      border-bottom: 1.5px solid #cbd5e1;
      border-left: 4px solid ${accent};
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .dept-subtotal-row td {
      background: #f8fafc !important;
      font-weight: 700;
      color: ${text};
      font-size: ${fontSize - 1.5}px;
      border-bottom: 1.5px solid ${border};
      padding: 3px 8px;
    }

    .disc-tag {
      font-size: ${fontSize - 2.5}px;
      color: #059669;
      font-weight: 600;
      margin-top: 2px;
    }
    .disc-strikethrough {
      text-decoration: line-through;
      color: ${muted};
      margin-right: 4px;
      font-weight: normal;
    }

    /* GST Breakdown Table */
    .gst-table-section {
      border: 1px solid ${border};
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: ${isCompact ? "6px" : "10px"};
      page-break-inside: avoid;
    }
    .gst-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fontSize - 1.5}px;
    }
    .gst-table th {
      background: #f8fafc;
      padding: 3px 6px;
      text-align: left;
      font-size: ${fontSize - 2}px;
      font-weight: 700;
      border-bottom: 1px solid ${border};
    }
    .gst-table td {
      padding: 3px 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .gst-exempt-note {
      padding: 5px 8px;
      background: #fafbfc;
      font-size: ${fontSize - 2.5}px;
      color: ${muted};
      font-style: italic;
      border-top: 1px dashed ${border};
    }

    /* Department Summary Chips */
    .bill-dept-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: ${isCompact ? "6px" : "10px"};
    }
    .dept-chip {
      background: #f1f5f9;
      border: 1px solid ${border};
      border-radius: 3px;
      padding: 2px 8px;
      font-size: ${fontSize - 2}px;
      font-weight: 600;
      color: ${text};
    }

    /* Settlement Card */
    .settlement-card {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 12px;
      border: 1.5px solid ${border};
      border-radius: 4px;
      padding: ${isCompact ? "6px 8px" : "8px 12px"};
      background: #ffffff;
      margin-bottom: ${isCompact ? "6px" : "10px"};
      page-break-inside: avoid;
    }
    .settlement-left {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
    }
    .words-box {
      background: ${headerBg};
      border-left: 3px solid ${primary};
      padding: 5px 8px;
      font-size: ${fontSize - 1}px;
    }
    .words-lbl {
      font-size: ${fontSize - 2.5}px;
      font-weight: 700;
      color: ${muted};
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .words-val {
      font-weight: 800;
      color: ${text};
      margin-top: 1px;
    }
    .audit-box {
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 6px 8px;
      font-size: ${fontSize - 1.5}px;
      background: #fafbfc;
    }
    .audit-title {
      font-weight: 800;
      color: ${primary};
      font-size: ${fontSize - 2}px;
      text-transform: uppercase;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 3px;
      margin-bottom: 4px;
    }
    .audit-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
      color: ${muted};
    }
    .audit-row strong {
      color: ${text};
    }
    .audit-row--total {
      border-top: 1px dashed #cbd5e1;
      padding-top: 3px;
      margin-top: 3px;
      font-weight: 800;
      color: #059669;
    }

    /* Authentic Rubber Stamp Seals */
    .stamp-wrap {
      margin-top: 6px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 16px;
    }
    .stamp-circular {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      border: 3.5px double;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(-6deg);
      padding: 5px;
      box-sizing: border-box;
      background: #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .stamp-inner-ring {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 1.5px dashed;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6px;
      box-sizing: border-box;
      text-align: center;
    }
    .stamp--paid {
      border-color: #047857;
      color: #047857;
      background: rgba(4, 120, 87, 0.03);
    }
    .stamp--paid .stamp-inner-ring {
      border-color: #059669;
    }
    .stamp--due {
      border-color: #be123c;
      color: #be123c;
      background: rgba(190, 18, 60, 0.03);
    }
    .stamp--due .stamp-inner-ring {
      border-color: #e11d48;
    }
    .stamp--excess {
      border-color: #0369a1;
      color: #0369a1;
      background: rgba(3, 105, 161, 0.03);
    }
    .stamp--excess .stamp-inner-ring {
      border-color: #0284c7;
    }
    .stamp-hosp-lbl {
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .stamp-star-row {
      font-size: 8px;
      letter-spacing: 2px;
      opacity: 0.85;
      margin-bottom: 2px;
    }
    .stamp-main-txt {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      line-height: 1.15;
      margin: 1px 0;
    }
    .stamp-meta-txt {
      font-size: 7px;
      font-weight: 700;
      opacity: 0.85;
      margin-top: 2px;
      letter-spacing: 0.3px;
    }

    /* Calculation Table */
    .calc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fontSize - 1}px;
    }
    .calc-table td {
      padding: 3px 4px;
      border-bottom: 1px solid #f1f5f9;
    }
    .calc-table .val {
      text-align: right;
      font-family: monospace;
      font-weight: 600;
    }
    .calc-row--sub td {
      border-top: 1.5px solid ${border};
      font-weight: 800;
      background: #f8fafc;
    }
    .calc-row--net td {
      border-top: 2.5px solid ${primary};
      border-bottom: 2.5px solid ${primary};
      font-size: ${fontSize + 0.5}px;
      font-weight: 900;
      padding: 5px 4px;
    }
    .calc-row--net.due {
      color: #be123c;
      background: #fff1f2;
    }
    .calc-row--net.cleared {
      color: #047857;
      background: #ecfdf5;
    }

    /* Bank Account & UPI Payment Section */
    .bank-upi-section {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      border: 1px solid ${border};
      border-radius: 4px;
      padding: 6px 10px;
      background: #fcfdfe;
      margin-bottom: ${isCompact ? "6px" : "10px"};
      page-break-inside: avoid;
    }
    .bank-title {
      font-size: ${fontSize - 1.5}px;
      font-weight: 800;
      color: ${primary};
      text-transform: uppercase;
      border-bottom: 1px dashed ${border};
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    .bank-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 12px;
      font-size: ${fontSize - 2}px;
    }
    .bank-row span {
      color: ${muted};
    }
    .bank-row strong {
      color: ${text};
      font-family: monospace;
    }
    .upi-qr-box {
      text-align: center;
      padding-left: 8px;
      border-left: 1px dashed ${border};
    }
    .upi-qr-img {
      width: 72px;
      height: 72px;
      display: block;
      margin: 0 auto;
    }
    .upi-qr-lbl {
      font-size: 7.5px;
      color: ${muted};
      font-weight: 600;
      margin-top: 2px;
    }

    /* Payment Receipts History Table */
    .receipts-section {
      border: 1px solid ${border};
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: ${isCompact ? "6px" : "10px"};
      page-break-inside: avoid;
    }
    .receipts-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fontSize - 1.5}px;
    }
    .receipts-table th {
      background: #f8fafc;
      padding: 3px 6px;
      text-align: left;
      font-size: ${fontSize - 2}px;
      font-weight: 700;
      border-bottom: 1px solid ${border};
    }
    .receipts-table td {
      padding: 2.5px 6px;
      border-bottom: 1px solid #e2e8f0;
    }

    /* Terms & Conditions */
    .bill-terms {
      border-top: 1px solid ${border};
      padding-top: 4px;
      margin-bottom: 8px;
      font-size: ${fontSize - 2.5}px;
      color: ${muted};
      line-height: 1.35;
      page-break-inside: avoid;
    }
    .bill-terms ul {
      list-style-type: none;
      padding: 0;
    }
    .bill-terms li {
      margin-bottom: 1.5px;
      position: relative;
      padding-left: 10px;
    }
    .bill-terms li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${primary};
      font-weight: bold;
    }

    /* Patient Declaration Box */
    .patient-decl-box {
      border: 1px dashed ${border};
      background: #fafbfc;
      border-radius: 3px;
      padding: 4px 8px;
      font-size: ${fontSize - 2.5}px;
      color: ${muted};
      font-style: italic;
      margin-top: 8px;
      margin-bottom: 4px;
    }

    /* Signatures */
    .bill-signatures {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 12px;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }
    .sig-box {
      flex: 1;
      text-align: center;
      padding: 0 4px;
    }
    .sig-line {
      height: 38px;
      border-bottom: 1.5px dashed #94a3b8;
      margin-bottom: 4px;
    }
    .sig-title {
      font-size: ${fontSize - 1.5}px;
      font-weight: 800;
      color: ${text};
    }
    .sig-sub {
      font-size: ${fontSize - 2.5}px;
      color: ${muted};
    }

    /* Footer Tagline */
    .bill-footer {
      border-top: 1px solid ${border};
      padding-top: 4px;
      text-align: center;
      font-size: ${fontSize - 2.5}px;
      color: ${muted};
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="bill-wrap">
    ${page.showWatermark ? `<div class="watermark">${esc(page.watermarkText || "TAX INVOICE")}</div>` : ""}

    <!-- Pre-printed Stationery Blank Top Margin (if enabled) -->
    ${isStationery ? `<div class="stationery-spacer"></div>` : ""}

    <!-- 1. Master Shared Letterhead & Document Banner -->
    ${!isStationery ? sharedHeaderHtml : ""}

    <!-- Optional Compliance & Tax Credentials Box (Rule 54 CGST) -->
    ${
      !isStationery && header.showTaxBox && gst.enabled !== false
        ? `
      <div class="bill-tax-box" style="margin-top: 6px; margin-bottom: 8px;">
        <div class="bill-tax-title">
          <span>TAX INVOICE CREDENTIALS</span>
          <span style="font-size: 8px; color: ${accent};">RULE 54 CGST</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 12px; margin-top: 4px;">
          ${gst.hospitalGstin ? `<div class="bill-tax-row"><span>GSTIN:</span> <strong>${esc(gst.hospitalGstin)}</strong></div>` : ""}
          ${gst.hospitalPan ? `<div class="bill-tax-row"><span>PAN:</span> <strong>${esc(gst.hospitalPan)}</strong></div>` : ""}
          ${gst.stateName ? `<div class="bill-tax-row"><span>STATE:</span> <strong>${esc(gst.stateName)} (${esc(gst.stateCode || "08")})</strong></div>` : ""}
          ${gst.cin ? `<div class="bill-tax-row"><span>CIN:</span> <strong>${esc(gst.cin)}</strong></div>` : ""}
          <div class="bill-tax-row"><span>REVERSE CHARGE:</span> <strong>${esc(gst.reverseCharge || "No")}</strong></div>
          <div class="bill-tax-row"><span>PLACE OF SUPPLY:</span> <strong>${esc(gst.placeOfSupply || "08 - Rajasthan")}</strong></div>
        </div>
      </div>
      `
        : ""
    }

    <!-- 3. Demographics & Admission Record Cards -->
    <div class="bill-grid">
      <!-- Patient Demographics Card -->
      ${
        patient.enabled !== false
          ? `
      <div class="bill-card">
        <div class="bill-card-hdr">
          <span>${esc(patient.title || "PATIENT DEMOGRAPHICS")}</span>
          <span style="font-size: ${fontSize - 2.5}px; color: ${muted}; font-weight: 500;">PATIENT MASTER RECORD</span>
        </div>
        <table class="bill-card-table">
          <tbody>
            ${patient.fields.name?.show !== false ? `<tr><td class="k-cell">${esc(patient.fields.name.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(p.name || "—")}</td></tr>` : ""}
            ${patient.fields.uhid?.show !== false ? `<tr><td class="k-cell">${esc(patient.fields.uhid.label)}</td><td class="sep-cell">:</td><td class="v-cell v-cell--code">${esc(p.uhid || "—")}</td></tr>` : ""}
            ${patient.fields.ageGender?.show !== false ? `<tr><td class="k-cell">${esc(patient.fields.ageGender.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc([p.age, p.gender].filter(Boolean).join(" / ") || "—")}</td></tr>` : ""}
            ${patient.fields.mobile?.show !== false ? `<tr><td class="k-cell">${esc(patient.fields.mobile.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(p.mobile || "—")}</td></tr>` : ""}
            ${patient.fields.bloodGroup?.show !== false ? `<tr><td class="k-cell">${esc(patient.fields.bloodGroup.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(p.bloodGroup || "—")}</td></tr>` : ""}
            ${patient.fields.address?.show !== false ? `<tr><td class="k-cell">${esc(patient.fields.address.label)}</td><td class="sep-cell">:</td><td class="v-cell" style="font-size: ${fontSize - 1.5}px;">${esc(p.address || "—")}</td></tr>` : ""}
            ${patient.fields.guardian?.show !== false && p.guardian ? `<tr><td class="k-cell">${esc(patient.fields.guardian.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(p.guardian)} ${p.relation ? `(${esc(p.relation)})` : ""}</td></tr>` : ""}
            ${patient.fields.payer?.show !== false && p.payer ? `<tr><td class="k-cell">${esc(patient.fields.payer.label)}</td><td class="sep-cell">:</td><td class="v-cell" style="color: ${accent};">${esc(p.payer)}</td></tr>` : ""}
            ${patient.fields.corporate?.show !== false && p.corporate ? `<tr><td class="k-cell">${esc(patient.fields.corporate.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(p.corporate)}</td></tr>` : ""}
            ${patient.fields.policyNo?.show !== false && p.policyNo ? `<tr><td class="k-cell">${esc(patient.fields.policyNo.label)}</td><td class="sep-cell">:</td><td class="v-cell font-mono">${esc(p.policyNo)}</td></tr>` : ""}
            ${patient.fields.claimNo?.show !== false && p.claimNo ? `<tr><td class="k-cell">${esc(patient.fields.claimNo.label)}</td><td class="sep-cell">:</td><td class="v-cell font-mono">${esc(p.claimNo)}</td></tr>` : ""}
            ${patient.fields.patientGstin?.show !== false && p.patientGstin ? `<tr><td class="k-cell">${esc(patient.fields.patientGstin.label)}</td><td class="sep-cell">:</td><td class="v-cell font-mono font-bold">${esc(p.patientGstin)}</td></tr>` : ""}
          </tbody>
        </table>
      </div>
      `
          : ""
      }

      <!-- Admission & Clinical Metadata Card -->
      ${
        admission.enabled !== false
          ? `
      <div class="bill-card">
        <div class="bill-card-hdr">
          <span>${esc(admission.title || "INPATIENT ADMISSION RECORD")}</span>
          <span style="font-size: ${fontSize - 2.5}px; color: ${muted}; font-weight: 500;">ENCOUNTER DETAILS</span>
        </div>
        <table class="bill-card-table">
          <tbody>
            ${admission.fields.invoiceNo?.show !== false ? `<tr><td class="k-cell">${esc(admission.fields.invoiceNo.label)}</td><td class="sep-cell">:</td><td class="v-cell v-cell--code">${esc(invoiceNo)}</td></tr>` : ""}
            ${admission.fields.invoiceDate?.show !== false ? `<tr><td class="k-cell">${esc(admission.fields.invoiceDate.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(invoiceDate)}</td></tr>` : ""}
            ${admission.fields.admissionNo?.show !== false ? `<tr><td class="k-cell">${esc(admission.fields.admissionNo.label)}</td><td class="sep-cell">:</td><td class="v-cell v-cell--code">${esc(adm.admissionNo || "—")}</td></tr>` : ""}
            ${admission.fields.admissionDate?.show !== false ? `<tr><td class="k-cell">${esc(admission.fields.admissionDate.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(adm.admissionDate || "—")}</td></tr>` : ""}
            ${admission.fields.dischargeDate?.show !== false ? `<tr><td class="k-cell">${esc(admission.fields.dischargeDate.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(adm.dischargeDate || "Under Active Care")}</td></tr>` : ""}
            ${admission.fields.wardBed?.show !== false ? `<tr><td class="k-cell">${esc(admission.fields.wardBed.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(adm.ward || "")} ${adm.bed ? `• Bed ${esc(adm.bed)}` : ""}</td></tr>` : ""}
            ${admission.fields.consultant?.show !== false ? `<tr><td class="k-cell">${esc(admission.fields.consultant.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(adm.consultant || "—")}</td></tr>` : ""}
            ${admission.fields.consultantQual?.show !== false && adm.consultantQual ? `<tr><td class="k-cell">${esc(admission.fields.consultantQual.label)}</td><td class="sep-cell">:</td><td class="v-cell" style="font-size: ${fontSize - 2}px; color: ${muted};">${esc(adm.consultantQual)}</td></tr>` : ""}
            ${admission.fields.department?.show !== false ? `<tr><td class="k-cell">${esc(admission.fields.department.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(adm.department || "—")}</td></tr>` : ""}
            ${admission.fields.stay?.show !== false && adm.stay ? `<tr><td class="k-cell">${esc(admission.fields.stay.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(adm.stay)}</td></tr>` : ""}
            ${admission.fields.referredBy?.show !== false && adm.referredBy ? `<tr><td class="k-cell">${esc(admission.fields.referredBy.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(adm.referredBy)}</td></tr>` : ""}
            ${admission.fields.diagnosis?.show !== false && adm.diagnosis ? `<tr><td class="k-cell">${esc(admission.fields.diagnosis.label)}</td><td class="sep-cell">:</td><td class="v-cell" style="color: ${primary};">${esc(adm.diagnosis)}</td></tr>` : ""}
            ${admission.fields.dischargeCondition?.show !== false && adm.dischargeCondition ? `<tr><td class="k-cell">${esc(admission.fields.dischargeCondition.label)}</td><td class="sep-cell">:</td><td class="v-cell">${esc(adm.dischargeCondition)}</td></tr>` : ""}
          </tbody>
        </table>
      </div>
      `
          : ""
      }
    </div>

    <!-- 4. Itemized Charges Table with Department Grouping -->
    ${
      charges.enabled !== false
        ? `
    <div class="bill-table-section">
      <div class="bill-table-hdr">
        <span>${esc(charges.title || "ITEMIZED INPATIENT CHARGES & SERVICE BREAKDOWN")}</span>
        <span style="font-size: ${fontSize - 2}px; font-weight: 600; color: ${muted};">Total Items: ${items.length}</span>
      </div>
      <table class="bill-items-table">
        <thead>
          <tr>
            ${visibleCols.map((k) => `<th style="width: ${cols[k].width || 'auto'}; ${k === 'sr' || k === 'qty' ? 'text-align: center;' : k === 'rate' || k === 'discount' || k === 'amount' ? 'text-align: right;' : ''}">${esc(cols[k].label)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${
            items.length === 0
              ? `<tr><td colspan="${visibleCols.length}" style="text-align: center; padding: 14px; color: ${muted};">No itemized charges posted for this encounter.</td></tr>`
              : Object.keys(groupedItems).map((deptKey) => {
                  const deptList = groupedItems[deptKey];
                  const deptSubtotal = deptList.reduce((acc, it) => acc + it.amount, 0);

                  const deptHeaderRow = charges.groupByDepartment && deptKey !== "ALL"
                    ? `<tr class="dept-banner-row"><td colspan="${visibleCols.length}">§ ${esc(deptKey.toUpperCase())} • ${deptList.length} SERVICE${deptList.length > 1 ? "S" : ""}</td></tr>`
                    : "";

                  const rows = deptList.map((item, idx) => `
                    <tr>
                      ${visibleCols
                        .map((k) => {
                          if (k === "sr") return `<td style="text-align: center; color: ${muted}; font-size: ${fontSize - 2}px;">${idx + 1}</td>`;
                          if (k === "date") return `<td style="font-family: monospace; font-size: ${fontSize - 2}px; color: ${muted};">${esc(item.date || adm.admissionDate || "—")}</td>`;
                          if (k === "department") return `<td><span style="background: #f1f5f9; padding: 1px 5px; border-radius: 2px; font-size: ${fontSize - 2}px; font-weight: 600;">${esc(item.department || "General")}</span></td>`;
                          if (k === "code") return `<td style="font-family: monospace; font-size: ${fontSize - 2}px; color: ${primary}; font-weight: 600;">${esc(item.code || "999311")}</td>`;
                          if (k === "description") {
                            const showDisc = charges.showDiscountsBreakdown && (Number(item.discount) > 0 || item.referredBy || item.discountReason);
                            return `
                              <td>
                                <strong style="color: ${text}; font-size: ${fontSize}px;">${esc(item.name)}</strong>
                                ${showDisc ? `
                                  <div class="disc-tag">
                                    ${Number(item.discount) > 0 ? `<span class="disc-strikethrough">${money(item.rate * item.qty)}</span> 🏷️ Disc: -${money(item.discount)} ${item.discountReason ? `(${esc(item.discountReason)})` : ""}` : ""}
                                    ${item.referredBy ? ` • Ref: ${esc(item.referredBy)}` : ""}
                                  </div>
                                ` : ""}
                              </td>
                            `;
                          }
                          if (k === "qty") return `<td style="text-align: center; font-weight: 700;">${item.qty}</td>`;
                          if (k === "rate") return `<td style="text-align: right; font-family: monospace;">${money(item.rate)}</td>`;
                          if (k === "discount") return `<td style="text-align: right; font-family: monospace; color: #059669; font-weight: 600;">${Number(item.discount) > 0 ? `-${money(item.discount)}` : "—"}</td>`;
                          if (k === "amount") return `<td style="text-align: right; font-family: monospace; font-weight: 800; color: ${primary};">${money(item.amount)}</td>`;
                          return `<td>—</td>`;
                        })
                        .join("")}
                    </tr>
                  `).join("");

                  const deptSubtotalRow = charges.groupByDepartment && charges.showDepartmentTotals && deptKey !== "ALL"
                    ? `
                    <tr class="dept-subtotal-row">
                      <td colspan="${visibleCols.length - 1}" style="text-align: right; text-transform: uppercase;">Subtotal for ${esc(deptKey)}:</td>
                      <td style="text-align: right; font-family: monospace; font-weight: 800; color: ${primary};">${money(deptSubtotal)}</td>
                    </tr>
                    `
                    : "";

                  return deptHeaderRow + rows + deptSubtotalRow;
                }).join("")
          }
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- 5. Department Summary Badges -->
    ${
      charges.showDepartmentSummary && deptSummaries.length > 0
        ? `
    <div class="bill-dept-chips">
      ${deptSummaries.map((ds) => `<div class="dept-chip">${esc(ds.label)}: <strong>${money(ds.amount)}</strong></div>`).join("")}
    </div>
    `
        : ""
    }

    <!-- 6. GST / Tax Breakdown Table -->
    ${
      gst.enabled && gst.showTaxTable
        ? `
    <div class="gst-table-section">
      <div class="bill-table-hdr">
        <span>GST &amp; STATUTORY TAX BREAKDOWN</span>
        <span style="font-size: ${fontSize - 2}px; color: ${muted};">
          ${gst.mode === "exempt" ? "GST Status: EXEMPT (Healthcare)" : `GST Rate: ${gst.taxRate}% (${gst.isInterState ? "IGST" : "CGST + SGST"})`}
        </span>
      </div>
      <table class="gst-table">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 14%;">HSN / SAC</th>
            <th style="width: 33%;">SERVICE / COMMODITY DESCRIPTION</th>
            <th style="width: 16%; text-align: right;">TAXABLE VALUE (₹)</th>
            ${
              gst.isInterState
                ? `<th style="width: 16%; text-align: right;">IGST (${igstRate}%)</th>`
                : `
                <th style="width: 16%; text-align: right;">CGST (${cgstRate}%)</th>
                <th style="width: 16%; text-align: right;">SGST (${sgstRate}%)</th>
                `
            }
            <th style="width: 16%; text-align: right;">TOTAL TAX (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td style="font-family: monospace; font-weight: 700; color: ${primary};">${esc(gst.defaultSacCode?.split(" ")[0] || "999311")}</td>
            <td>Inpatient Hospital Healthcare &amp; Medical Clinical Management</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700;">${money(taxableAmount)}</td>
            ${
              gst.isInterState
                ? `<td style="text-align: right; font-family: monospace;">${money(igstAmount)}</td>`
                : `
                <td style="text-align: right; font-family: monospace;">${money(cgstAmount)}</td>
                <td style="text-align: right; font-family: monospace;">${money(sgstAmount)}</td>
                `
            }
            <td style="text-align: right; font-family: monospace; font-weight: 800; color: ${primary};">${money(totalTax)}</td>
          </tr>
        </tbody>
      </table>
      ${
        gst.mode === "exempt" && gst.exemptionNotification
          ? `<div class="gst-exempt-note">ℹ️ ${esc(gst.exemptionNotification)}</div>`
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- 7. Settlement Reconciliation & Totals Box -->
    ${
      settlement.enabled !== false
        ? `
    <div class="settlement-card">
      <!-- Left side: Amount in words, audit notes, realistic rubber stamp -->
      <div class="settlement-left">
        ${
          settlement.showAmountInWords
            ? `
        <div class="words-box">
          <div class="words-lbl">Total Net Bill Amount In Words:</div>
          <div class="words-val">${esc(totals.amountInWords || numberToWords(finalNetBillable))}</div>
        </div>
        `
            : ""
        }

        ${
          settlement.showPaymentBreakdown
            ? `
        <div class="audit-box">
          <div class="audit-title">Inpatient Payments &amp; Deposits Ledger</div>
          <div class="audit-row">
            <span>Admission Advance Deposit:</span>
            <strong>${money(totals.advancePaid)}</strong>
          </div>
          <div class="audit-row">
            <span>Interim Running Payments:</span>
            <strong>${money(totals.interimPaid)}</strong>
          </div>
          <div class="audit-row audit-row--total">
            <span>Total Payments Collected:</span>
            <strong>${money(totalPaid)}</strong>
          </div>
        </div>
        `
            : ""
        }

        <!-- Official Hospital Rubber Seal -->
        ${
          settlement.showOfficialStamp !== false
            ? `
        <div class="stamp-wrap">
          <div class="stamp-circular ${stampTheme}">
            <div class="stamp-inner-ring">
              <div class="stamp-hosp-lbl">${esc(hospital.name)}</div>
              <div class="stamp-star-row">★ ★ ★</div>
              <div class="stamp-main-txt">${esc(stampText)}</div>
              <div class="stamp-meta-txt">DATE: ${esc(invoiceDate)} • AUTH COUNTER</div>
            </div>
          </div>
          ${
            header.showBarcode && barcodeSvg
              ? `<div style="text-align: center;">${barcodeSvg}</div>`
              : ""
          }
        </div>
        `
            : `
        ${
          header.showBarcode && barcodeSvg
            ? `<div style="margin-top: 8px; text-align: left;">${barcodeSvg}</div>`
            : ""
        }
        `
        }
      </div>

      <!-- Right side: Mathematical Totals Table -->
      <div>
        <table class="calc-table">
          <tbody>
            <tr>
              <td>Total Gross Inpatient Charges</td>
              <td class="val">${money(grossCharges)}</td>
            </tr>
            ${
              concessions > 0
                ? `
            <tr style="color: #059669; font-weight: 600;">
              <td>(-) Authorized Concession &amp; Waivers</td>
              <td class="val">(-) ${money(concessions)}</td>
            </tr>
            `
                : ""
            }
            <tr>
              <td>Net Taxable Amount</td>
              <td class="val">${money(taxableAmount)}</td>
            </tr>
            ${
              gst.enabled && totalTax > 0
                ? `
            <tr>
              <td>Add: GST (${gst.taxRate}%)</td>
              <td class="val">${money(totalTax)}</td>
            </tr>
            `
                : `
            <tr style="color: ${muted}; font-size: ${fontSize - 2}px;">
              <td>GST (0% Healthcare Exemption)</td>
              <td class="val">₹0.00</td>
            </tr>
            `
            }
            ${
              settlement.showRoundOff && roundOff !== 0
                ? `
            <tr style="color: ${muted}; font-size: ${fontSize - 2}px;">
              <td>Round Off Adjustment</td>
              <td class="val">${roundOff > 0 ? `+${money(roundOff)}` : money(roundOff)}</td>
            </tr>
            `
                : ""
            }
            <tr class="calc-row--net ${balanceDue > 0 ? "due" : "cleared"}">
              <td>
                <strong>FINAL INVOICED NET AMOUNT</strong>
              </td>
              <td class="val">
                <strong>${money(finalNetBillable)}</strong>
              </td>
            </tr>
            <tr>
              <td>(-) Less Total Payments &amp; Deposits Received</td>
              <td class="val" style="color: #059669; font-weight: 700;">(-) ${money(totalPaid)}</td>
            </tr>
            <tr class="calc-row--sub">
              <td>
                <strong>
                  ${
                    balanceDue > 0
                      ? "NET BALANCE DUE / OUTSTANDING"
                      : excessAdvance > 0
                      ? "EXCESS ADVANCE CREDIT (REFUNDABLE)"
                      : "FINAL SETTLEMENT STATUS"
                  }
                </strong>
              </td>
              <td class="val" style="color: ${balanceDue > 0 ? "#be123c" : "#059669"}; font-size: ${fontSize + 0.5}px;">
                <strong>${money(balanceDue > 0 ? balanceDue : excessAdvance > 0 ? excessAdvance : 0)}</strong>
                ${excessAdvance > 0 ? " <span style='font-size: 8px;'>(Excess)</span>" : ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    `
        : ""
    }

    <!-- 8. Payment Receipts Audit History Table (Optional) -->
    ${
      settlement.showPaymentReceiptsTable && payments.length > 0
        ? `
    <div class="receipts-section">
      <div class="bill-table-hdr">
        <span>OFFICIAL PAYMENT RECEIPTS AUDIT LOG (${payments.length} RECEIPTS ISSUED)</span>
        <span style="font-size: ${fontSize - 2}px; color: ${muted};">Verified by HIMS Cash Register</span>
      </div>
      <table class="receipts-table">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 20%;">RECEIPT NO</th>
            <th style="width: 25%;">DATE &amp; TIME</th>
            <th style="width: 20%;">PAYMENT MODE</th>
            <th style="width: 15%;">TRANSACTION TYPE</th>
            <th style="width: 15%; text-align: right;">AMOUNT (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${payments
            .map(
              (rc, i) => `
            <tr>
              <td>${i + 1}</td>
              <td style="font-family: monospace; font-weight: 700; color: ${primary};">${esc(rc.receiptNo)}</td>
              <td>${esc(rc.date)}</td>
              <td><strong>${esc(rc.mode)}</strong></td>
              <td><span style="font-size: ${fontSize - 2.5}px; color: ${muted};">${esc(rc.type || "Receipt")}</span></td>
              <td style="text-align: right; font-family: monospace; font-weight: 800; color: #059669;">${money(rc.amount)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- 9. Hospital Bank & Dynamic UPI QR Section -->
    ${
      bankDetails.show
        ? `
    <div class="bank-upi-section">
      <div>
        <div class="bank-title">${esc(bankDetails.title || "HOSPITAL BANK & UPI REMITTANCE DETAILS")}</div>
        <div class="bank-grid">
          <div class="bank-row"><span>Beneficiary Bank:</span> <strong>${esc(bankDetails.bankName)}</strong></div>
          <div class="bank-row"><span>Account Name:</span> <strong>${esc(bankDetails.accountName)}</strong></div>
          <div class="bank-row"><span>Account Number:</span> <strong>${esc(bankDetails.accountNo)}</strong></div>
          <div class="bank-row"><span>IFSC Code:</span> <strong>${esc(bankDetails.ifsc)}</strong></div>
          <div class="bank-row"><span>Branch:</span> <strong>${esc(bankDetails.branch)}</strong></div>
          <div class="bank-row"><span>UPI VPA:</span> <strong>${esc(bankDetails.upiId)}</strong></div>
        </div>
      </div>
      ${
        upiQrUrl && balanceDue > 0
          ? `
      <div class="upi-qr-box">
        <img src="${esc(upiQrUrl)}" alt="Scan to Pay Balance" class="upi-qr-img" />
        <div class="upi-qr-lbl">Scan with GPay/PhonePe<br>Pay Balance <strong>${money(balanceDue)}</strong></div>
      </div>
      `
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- 10. Terms & Conditions -->
    ${
      terms.enabled !== false && terms.items?.length > 0
        ? `
    <div class="bill-terms">
      <ul>
        ${terms.items.map((t) => `<li>${esc(t)}</li>`).join("")}
      </ul>
    </div>
    `
        : ""
    }

    <!-- 11. Patient Declaration -->
    ${
      signatures.enabled && signatures.patientDeclaration
        ? `
    <div class="patient-decl-box">
      <strong>Declaration:</strong> "${esc(signatures.patientDeclaration)}"
    </div>
    `
        : ""
    }

    <!-- 12. Signatures Block -->
    ${
      signatures.enabled !== false
        ? `
    <div class="bill-signatures">
      ${
        signatures.showCashier
          ? `
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-title">${esc(signatures.cashierTitle || "Billing Cashier")}</div>
        <div class="sig-sub">${esc(signatures.cashierSub || "Cashier Desk")}</div>
      </div>
      `
          : ""
      }
      ${
        signatures.showAccounts
          ? `
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-title">${esc(signatures.accountsTitle || "Accounts Officer")}</div>
        <div class="sig-sub">${esc(signatures.accountsSub || "Internal Audit")}</div>
      </div>
      `
          : ""
      }
      ${
        signatures.showDoctor
          ? `
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-title">${esc(signatures.doctorTitle || "Treating Consultant")}</div>
        <div class="sig-sub">${esc(signatures.doctorSub || "Clinical Verification")}</div>
      </div>
      `
          : ""
      }
      ${
        signatures.showPatient
          ? `
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-title">${esc(signatures.patientTitle || "Patient / Attendant Signature")}</div>
        <div class="sig-sub">${esc(signatures.patientSub || "Received Bills & Drugs")}</div>
      </div>
      `
          : ""
      }
      ${
        signatures.showSuperintendent
          ? `
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-title">${esc(signatures.superintendentTitle || "Medical Superintendent")}</div>
        <div class="sig-sub">${esc(signatures.superintendentSub || "Authorized Signatory")}</div>
      </div>
      `
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- 13. Footer Tagline -->
    ${
      terms.footerTagline || hospital.phone || hospital.address
        ? `
    <footer class="bill-footer">
      ${hospital.phone ? `<div style="font-weight: 700; color: ${primary}; margin-bottom: 2px;">📞 Helpline / Contact: ${esc(hospital.phone)}${hospital.emergencyPhone ? ` • Emergency: ${esc(hospital.emergencyPhone)}` : ""}</div>` : ""}
      ${hospital.address ? `<div style="margin-bottom: 2px;">📍 ${esc(hospital.name ? hospital.name + " • " : "")}${esc(hospital.address)}</div>` : ""}
      ${terms.footerTagline ? `<div>${esc(terms.footerTagline)}</div>` : ""}
      ${terms.disclaimer ? `<div style="font-size: ${fontSize - 3}px; margin-top: 2px; color: ${muted};">${esc(terms.disclaimer)}</div>` : ""}
    </footer>
    `
        : ""
    }
  </div>

  <script>
    (function() {
      function reportHeight() {
        try {
          var body = document.body;
          var html = document.documentElement;
          var height = Math.max(
            body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight
          );
          window.parent.postMessage({ type: 'HIMS_BILL_FRAME_HEIGHT', height: height }, '*');
        } catch(e) {}
      }
      window.addEventListener('load', reportHeight);
      window.addEventListener('resize', reportHeight);
      setTimeout(reportHeight, 200);
      setTimeout(reportHeight, 600);
    })();
  </script>

  ${
    isPrint
      ? `
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 300);
    });
  </script>
  `
      : ""
  }
</body>
</html>`;
}

export class IPDBillingPrintHandler {
  static _cachedSettings = null;

  static async loadDbSettings(forceRefresh = false) {
    if (!forceRefresh && this._cachedSettings) {
      return this._cachedSettings;
    }
    try {
      const [data, shared] = await Promise.all([
        settingsService.getSetting(IPD_BILLING_SETTINGS_KEY).catch(() => null),
        loadSharedPrintSettings().catch(() => null),
      ]);
      const cached = getCachedSharedSettings() || {};
      const masterShared = shared || cached;
      const merged = mergeIPDBillingSettings(DEFAULT_IPD_BILLING_SETTINGS, {
        ...(data || {}),
        useSharedHeaderFooter: true,
        hospital: { ...(data?.hospital || {}), ...(masterShared?.hospital || {}) },
        header: { ...(data?.header || {}), ...(masterShared?.header || {}) },
        footer: { ...(data?.footer || {}), ...(masterShared?.footer || {}) },
        fieldStyles: { ...(data?.fieldStyles || {}), ...(masterShared?.fieldStyles || {}) },
        slipConfigs: { ...(data?.slipConfigs || {}), ...(masterShared?.slipConfigs || {}) },
      });
      this._cachedSettings = merged;
      return merged;
    } catch (err) {
      console.warn("Could not fetch IPD billing print settings from server, using defaults:", err);
    }
    this._cachedSettings = cloneIPDBillingSettings(DEFAULT_IPD_BILLING_SETTINGS);
    return this._cachedSettings;
  }

  static async getSettings() {
    return this.loadDbSettings(false);
  }

  static async printBillingSlip(payload = SAMPLE_IPD_BILLING_DATA, settingsOverride = null) {
    const settings = settingsOverride || (await this.loadDbSettings());
    const html = buildBillingHTML(payload, settings, false);

    // Prefer silent hidden iframe printing
    const printedViaIframe = await this._printViaIframe(html);
    if (!printedViaIframe) {
      this._printViaWindow(html);
    }
  }

  static _printViaIframe(html) {
    return new Promise((resolve) => {
      try {
        let frame = document.getElementById("hims-ipd-billing-print-frame");
        if (frame) frame.remove();

        frame = document.createElement("iframe");
        frame.id = "hims-ipd-billing-print-frame";
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
    const printWindow = window.open("", "_blank", "width=1000,height=850,scrollbars=yes,menubar=yes,status=yes");
    if (!printWindow) {
      window.alert("Please allow pop-ups for this site to print the billing slip.");
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

export default IPDBillingPrintHandler;
