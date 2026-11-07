/**
 * IPD Admission Ticket Print Engine.
 * Formats a strict Single-Page inpatient admission ticket with element-by-element
 * styling (slider offsets, font sizes, border boldness, background gradients, and colors).
 * Supports both Print Output and Interactive Click-to-Inspect Preview with Horizontal Alignment Guides.
 */
import {
  DEFAULT_IPD_ADMISSION_SETTINGS,
  SAMPLE_IPD_ADMISSION_DATA,
  mergeIPDAdmissionSettings,
} from "./ipdAdmissionPrintConfig.js";
import {
  DEFAULT_SHARED_CONFIG,
  SHARED_PRINT_CSS,
  buildSharedHeaderHTML,
  mergeSharedSettings,
  getCachedSharedSettings,
} from "./sharedPrintConfig.js";

/**
 * Generate inline CSS style string for a configured element block.
 */
function getBlockInlineStyle(elConfig, defaultPad = "8px 12px", extraCss = "") {
  if (!elConfig) return "";
  if (elConfig.show === false) return "display: none !important;";

  const bg =
    elConfig.bgMode === "gradient"
      ? `background: linear-gradient(${elConfig.bgGradientAngle ?? 135}deg, ${elConfig.bgColor || "#ffffff"} 0%, ${elConfig.bgGradientEnd || "#f8fafc"} 100%);`
      : `background: ${elConfig.bgColor || "transparent"};`;

  const border =
    elConfig.borderWidth && Number(elConfig.borderWidth) > 0
      ? `border: ${elConfig.borderWidth}px solid ${elConfig.borderColor || "#cbd5e1"};`
      : `border: none;`;

  const radius = `border-radius: ${elConfig.borderRadius ?? 8}px;`;
  const fontFam = elConfig.fontFamily ? `font-family: ${elConfig.fontFamily};` : "";
  const fontSz = elConfig.fontSize ? `font-size: ${elConfig.fontSize}px;` : "";
  const fontWt = elConfig.fontWeight ? `font-weight: ${elConfig.fontWeight};` : "";
  const textClr = elConfig.textColor ? `color: ${elConfig.textColor};` : "";

  const offsetX = Number(elConfig.offsetX) || 0;
  const offsetY = Number(elConfig.offsetY) || 0;
  const transform =
    offsetX !== 0 || offsetY !== 0 ? `transform: translate(${offsetX}px, ${offsetY}px);` : "";

  return `
    padding: ${defaultPad};
    ${bg}
    ${border}
    ${radius}
    ${fontFam}
    ${fontSz}
    ${fontWt}
    ${textClr}
    ${transform}
    ${extraCss}
  `.replace(/\s+/g, " ").trim();
}

/**
 * Compute field-level inline style combining card default and field-specific override
 */
function getFieldComputedStyle(fieldKey, cardKey, settings, extraCss = "") {
  const f = settings.fieldStyles?.[fieldKey] || {};
  if (f.show === false) {
    return "display: none !important;";
  }
  const offsetX = Number(f.offsetX) || 0;
  const offsetY = Number(f.offsetY) || 0;

  // Rock-solid positioning using relative left/top + display: inline-block
  const positionStyle =
    offsetX !== 0 || offsetY !== 0
      ? `position: relative !important; left: ${offsetX}px !important; top: ${offsetY}px !important; display: inline-block !important; z-index: 15;`
      : "position: relative !important;";
  const fontSz = f.fontSize ? `font-size: ${f.fontSize}px !important;` : "";
  const fontWt = f.fontWeight ? `font-weight: ${f.fontWeight} !important;` : "";
  const textClr = f.textColor ? `color: ${f.textColor} !important;` : "";
  const textAln = f.textAlign ? `text-align: ${f.textAlign} !important;` : "";
  const bgClr = f.bgColor ? `background-color: ${f.bgColor} !important;` : "";
  const brdClr = f.borderColor ? `border-color: ${f.borderColor} !important;` : "";

  return `
    ${positionStyle}
    ${fontSz}
    ${fontWt}
    ${textClr}
    ${textAln}
    ${bgClr}
    ${brdClr}
    ${extraCss}
  `.replace(/\s+/g, " ").trim();
}

/**
 * Generate SVG Barcode
 */
function generateBarcodeSvg(value) {
  const clean = String(value || "IPD-000000").replace(/[^a-zA-Z0-9-]/g, "");
  let bars = "";
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const w1 = (code % 3) + 1.2;
    const w2 = (code % 2) + 1;
    bars += `<rect x="${i * 7}" y="0" width="${w1}" height="28" fill="#0f172a"/>`;
    bars += `<rect x="${i * 7 + w1 + 1}" y="0" width="${w2}" height="28" fill="#0f172a"/>`;
  }
  return `
    <svg viewBox="0 0 ${clean.length * 7 + 10} 28" class="barcode-svg" preserveAspectRatio="none" style="height: 24px; width: 110px;">
      ${bars}
    </svg>
  `;
}

/**
 * Builds the complete, single-page printable HTML string.
 */
export function buildAdmissionTicketHTML(
  data = SAMPLE_IPD_ADMISSION_DATA,
  settings = DEFAULT_IPD_ADMISSION_SETTINGS,
  options = { isPreview: false, activeTargetKey: null }
) {
  const cfg = mergeIPDAdmissionSettings(DEFAULT_IPD_ADMISSION_SETTINGS, settings || {});
  const d = { ...SAMPLE_IPD_ADMISSION_DATA, ...(data || {}) };
  const styles = cfg.elementStyles || {};
  const isPreview = options?.isPreview === true;
  const activeKey = options?.activeTargetKey || null;

  // Master Shared Header Configuration
  const cachedShared = getCachedSharedSettings() || {};
  const isUsingShared = cfg.useSharedHeaderFooter !== false;

  const sharedConfig = mergeSharedSettings(DEFAULT_SHARED_CONFIG, {
    ...cfg,
    hospital: isUsingShared
      ? { ...(cfg.hospital || {}), ...(cachedShared.hospital || {}) }
      : { ...(DEFAULT_SHARED_CONFIG.hospital || {}), ...(cfg.hospital || {}) },
    header: isUsingShared
      ? { ...(cfg.header || {}), ...(cachedShared.header || {}) }
      : { ...(DEFAULT_SHARED_CONFIG.header || {}), ...(cfg.header || {}) },
    fieldStyles: isUsingShared
      ? { ...(cfg.fieldStyles || {}), ...(cachedShared.fieldStyles || {}) }
      : { ...(DEFAULT_SHARED_CONFIG.fieldStyles || {}), ...(cfg.fieldStyles || {}) },
    slipConfigs: isUsingShared
      ? { ...(cfg.slipConfigs || {}), ...(cachedShared.slipConfigs || {}) }
      : { ...(DEFAULT_SHARED_CONFIG.slipConfigs || {}), ...(cfg.slipConfigs || {}) },
  });

  const sharedHeaderHtml = buildSharedHeaderHTML(sharedConfig, {
    isPreview: isPreview,
    slipType: "ipd_admission",
    encounterData: {
      uhid: d.uhid,
      ipdNo: d.ipdNo,
      encounterNo: d.ipdNo,
      tokenNo: d.ipdNo,
      patientName: d.patientName,
      doctor: d.doctor,
      department: d.department,
      ...d,
    },
    titleOverride: cfg.header?.title || "IPD ADMISSION TICKET",
    copyBadgeOverride: cfg.header?.copyType || "ORIGINAL",
  });

  const hospitalStyle = getBlockInlineStyle(styles.hospitalHeader, "8px 12px");
  const headerStyle = getBlockInlineStyle(styles.ticketHeader, "6px 12px");
  const patientStyle = getBlockInlineStyle(styles.patientCard, "8px 12px");
  const admissionStyle = getBlockInlineStyle(styles.admissionCard, "8px 12px");
  const financialStyle = getBlockInlineStyle(styles.financialCard, "8px 12px");
  const termsStyle = getBlockInlineStyle(styles.termsCard, "6px 10px");
  const sigStyle = getBlockInlineStyle(styles.signaturesCard, "6px 4px");

  const pageMargin = cfg.page?.margin ?? 6;
  const pageFont = cfg.page?.fontFamily || "Inter, system-ui, sans-serif";

  // Visible field helper
  const isShow = (section, fieldKey) => cfg[section]?.fields?.[fieldKey]?.show !== false;
  const getLabel = (section, fieldKey, fallback) => cfg[section]?.fields?.[fieldKey]?.label || fallback;

  // Clickable interactive attributes for preview
  const clickableAttr = (key, type = "field") => {
    if (!isPreview) return "";
    return `data-target-key="${key}" data-target-type="${type}" onclick="event.stopPropagation(); window.parent.postMessage({ type: 'SELECT_TARGET', key: '${key}' }, '*')"`;
  };

  // Helper for rendering horizontal alignment guide if active
  const renderGuide = (key) => {
    if (!isPreview || activeKey !== key) return "";
    const f = cfg.fieldStyles?.[key] || {};
    const y = f.offsetY || 0;
    return `
      <div class="row-alignment-guide">
        <span class="guide-y-tag">Y: ${y > 0 ? `+${y}` : y}px</span>
      </div>
    `;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>IPD Admission Ticket - ${d.patientName || "Patient"}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: ${pageMargin}mm;
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
      font-family: ${pageFont};
      font-size: 10.5px;
      line-height: 1.35;
    }
    .ticket-page {
      width: 100%;
      max-width: 195mm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }

    /* Master Shared Print & Positioning CSS */
    ${SHARED_PRINT_CSS}

    /* ── 1. HOSPITAL LETTERHEAD ── */
    .hospital-block {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 2px;
      position: relative;
    }
    .hospital-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    .hospital-logo {
      height: ${cfg.hospital?.logoHeight || 48}px;
      max-width: 150px;
      object-fit: contain;
    }
    .hospital-name {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.01em;
      margin: 0 0 2px 0;
      line-height: 1.15;
    }
    .hospital-sub {
      font-size: 9.5px;
      font-weight: 600;
      color: #475569;
      margin: 0 0 2px 0;
    }
    .hospital-addr {
      font-size: 9px;
      color: #64748b;
      margin: 0;
      line-height: 1.25;
    }
    .hospital-right {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
    }
    .hospital-reg-badge {
      display: inline-block;
      padding: 2px 7px;
      font-size: 9px;
      font-weight: 700;
      background: #e2e8f0;
      color: #334155;
      border-radius: 4px;
    }
    .hospital-em-phone {
      font-size: 10px;
      font-weight: 700;
      color: #dc2626;
    }
    .accreditation-badges {
      display: flex;
      gap: 4px;
      margin-top: 2px;
    }
    .acc-pill {
      font-size: 8px;
      font-weight: 800;
      background: #f1f5f9;
      color: #0284c7;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid #bae6fd;
    }

    /* ── 2. TICKET TITLE & BARCODE HEADER ── */
    .ticket-header-block {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      position: relative;
    }
    .ticket-title-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ticket-main-title {
      font-size: 13px;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.02em;
    }
    .ticket-copy-badge {
      font-size: 8.5px;
      font-weight: 700;
      padding: 2px 6px;
      background: #0284c7;
      color: #ffffff;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .ticket-barcode-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .top-id-tag {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }
    .top-id-tag small {
      display: block;
      font-size: 8px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    /* ── CARD SECTIONS GENERAL ── */
    .section-card {
      margin: 0;
      position: relative;
    }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    /* ── FIELD GRIDS ── */
    .field-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px 12px;
      position: relative;
    }
    .field-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px 12px;
      position: relative;
    }
    .field-cell {
      display: flex;
      flex-direction: column;
      gap: 1px;
      position: relative;
      transition: all 0.12s ease;
    }
    .field-cell.span-2 {
      grid-column: span 2;
    }
    .field-cell.span-3 {
      grid-column: span 3;
    }
    .field-label {
      font-size: 8.5px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .field-val {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      word-break: break-word;
    }
    .highlight-pill {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 800;
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }
    .bed-allotted-box {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      color: #14532d;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 11.5px;
      font-weight: 800;
      display: inline-block;
    }

    /* ── FINANCIAL TABLE ── */
    .fee-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    .fee-table th {
      background: rgba(0,0,0,0.04);
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 6px;
      border: 1px solid rgba(0,0,0,0.08);
      text-align: left;
    }
    .fee-table td {
      padding: 4px 6px;
      border: 1px solid rgba(0,0,0,0.08);
      font-size: 10px;
      font-weight: 600;
    }
    .fee-total-row {
      background: rgba(16, 185, 129, 0.12);
      font-weight: 800;
      font-size: 11px;
    }

    /* ── TERMS & CONDITIONS ── */
    .terms-list {
      margin: 0;
      padding-left: 16px;
      display: flex;
      flex-direction: column;
      gap: 2.5px;
    }
    .terms-list li {
      font-size: 8.5px;
      line-height: 1.25;
      color: #475569;
    }
    .terms-footer-tagline {
      margin-top: 4px;
      padding-top: 3px;
      border-top: 1px dashed #cbd5e1;
      font-size: 8px;
      color: #64748b;
      text-align: center;
      font-weight: 600;
    }

    /* ── SIGNATURES & STAMP ── */
    .signatures-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      align-items: flex-end;
      margin-top: 4px;
    }
    .sig-col {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }
    .sig-line {
      width: 90%;
      border-top: 1.5px solid #64748b;
      margin-bottom: 4px;
    }
    .sig-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .sig-sub {
      font-size: 8px;
      color: #64748b;
      margin: 0;
    }
    .stamp-box {
      border: 1.5px dashed #94a3b8;
      border-radius: 6px;
      height: 48px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ── INTERACTIVE PREVIEW & ALIGNMENT GUIDES ── */
    ${
      isPreview
        ? `
      [data-target-key]:hover {
        outline: 1.5px dashed #0284c7 !important;
        cursor: pointer !important;
      }
      [data-target-key="${activeKey}"] {
        outline: 2px solid #0284c7 !important;
        outline-offset: 2px !important;
        background-color: rgba(2, 132, 199, 0.08) !important;
        position: relative !important;
      }
      .row-alignment-guide {
        position: absolute;
        left: -12px;
        right: -12px;
        top: 50%;
        border-top: 1.5px dashed #0284c7;
        pointer-events: none;
        z-index: 50;
      }
      .guide-y-tag {
        position: absolute;
        right: 0;
        top: -15px;
        background: #0284c7;
        color: #ffffff;
        font-size: 8px;
        font-weight: 800;
        padding: 1px 5px;
        border-radius: 3px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      }
    `
        : ""
    }

    @media print {
      body {
        width: 100% !important;
        background: transparent !important;
      }
      .ticket-page {
        max-width: 100% !important;
      }
      .row-alignment-guide, [data-target-key] {
        outline: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="ticket-page">
    <!-- ── 1. HOSPITAL LETTERHEAD & DOCUMENT BANNER ── -->
    ${
      isUsingShared
        ? sharedHeaderHtml
        : `
    ${
      styles.hospitalHeader?.show !== false
        ? `
    <div class="hospital-block" style="${hospitalStyle}" ${clickableAttr("hospitalHeader", "card")}>
      <div class="hospital-left">
        ${
          cfg.hospital?.showLogo && cfg.hospital?.logoUrl && cfg.fieldStyles?.["header.logo"]?.show !== false
            ? `<img src="${cfg.hospital.logoUrl}" alt="Logo" class="hospital-logo" style="${getFieldComputedStyle("header.logo", "hospitalHeader", cfg)}" ${clickableAttr("header.logo")} />`
            : ""
        }
        <div>
          <h1 class="hospital-name" style="${getFieldComputedStyle("header.hospitalName", "hospitalHeader", cfg)}" ${clickableAttr("header.hospitalName")}>${cfg.fieldStyles?.["header.hospitalName"]?.customText || cfg.hospital?.name || "Narayan Hospital"}</h1>
          <p class="hospital-sub" style="${getFieldComputedStyle("header.subtitle", "hospitalHeader", cfg)}" ${clickableAttr("header.subtitle")}>${cfg.fieldStyles?.["header.subtitle"]?.customText || cfg.hospital?.subtitle || ""}</p>
          <p class="hospital-addr" style="${getFieldComputedStyle("header.address", "hospitalHeader", cfg)}" ${clickableAttr("header.address")}>${cfg.fieldStyles?.["header.address"]?.customText || cfg.hospital?.address || ""}</p>
          <p class="hospital-addr" style="${getFieldComputedStyle("header.phoneEmail", "hospitalHeader", cfg)}" ${clickableAttr("header.phoneEmail")}>${cfg.fieldStyles?.["header.phoneEmail"]?.customText || `📞 ${cfg.hospital?.phone || ""} ${cfg.hospital?.email ? `• ✉️ ${cfg.hospital.email}` : ""}`}</p>
        </div>
      </div>
      <div class="hospital-right">
        ${cfg.hospital?.registrationNo && cfg.fieldStyles?.["header.regNo"]?.show !== false ? `<span class="hospital-reg-badge" style="${getFieldComputedStyle("header.regNo", "hospitalHeader", cfg)}" ${clickableAttr("header.regNo")}>${cfg.fieldStyles?.["header.regNo"]?.customText || `Reg: ${cfg.hospital.registrationNo}`}</span>` : ""}
        ${cfg.hospital?.emergencyPhone && cfg.fieldStyles?.["header.emergencyPhone"]?.show !== false ? `<span class="hospital-em-phone" style="${getFieldComputedStyle("header.emergencyPhone", "hospitalHeader", cfg)}" ${clickableAttr("header.emergencyPhone")}>${cfg.fieldStyles?.["header.emergencyPhone"]?.customText || `🚨 24x7 Emergency: ${cfg.hospital.emergencyPhone}`}</span>` : ""}
        ${
          cfg.hospital?.showAccreditationBadges && Array.isArray(cfg.hospital?.accreditations) && cfg.fieldStyles?.["header.accreditations"]?.show !== false
            ? `
          <div class="accreditation-badges" style="${getFieldComputedStyle("header.accreditations", "hospitalHeader", cfg)}" ${clickableAttr("header.accreditations")}>
            ${cfg.hospital.accreditations.map((acc) => `<span class="acc-pill">${acc}</span>`).join("")}
          </div>
        `
            : ""
        }
      </div>
    </div>
    `
        : ""
    }

    <!-- ── 2. TICKET TITLE & BARCODE BADGE ── -->
    ${
      styles.ticketHeader?.show !== false
        ? `
    <div class="ticket-header-block" style="${headerStyle}" ${clickableAttr("ticketHeader", "card")}>
      <div class="ticket-title-wrap">
        <h2 class="ticket-main-title" style="${getFieldComputedStyle("ticket.title", "ticketHeader", cfg)}" ${clickableAttr("ticket.title")}>${cfg.fieldStyles?.["ticket.title"]?.customText || cfg.header?.title || "IPD ADMISSION TICKET"}</h2>
        ${cfg.header?.showCopyBadge && cfg.fieldStyles?.["ticket.copyBadge"]?.show !== false ? `<span class="ticket-copy-badge" style="${getFieldComputedStyle("ticket.copyBadge", "ticketHeader", cfg)}" ${clickableAttr("ticket.copyBadge")}>${cfg.fieldStyles?.["ticket.copyBadge"]?.customText || cfg.header?.copyType || "ORIGINAL"}</span>` : ""}
      </div>
      <div class="ticket-barcode-wrap">
        ${
          cfg.header?.showTopUHID && d.uhid && cfg.fieldStyles?.["ticket.topUhid"]?.show !== false
            ? `
          <div class="top-id-tag" style="${getFieldComputedStyle("ticket.topUhid", "ticketHeader", cfg)}" ${clickableAttr("ticket.topUhid")}>
            <small>PATIENT UHID</small>
            ${d.uhid}
          </div>
        `
            : ""
        }
        ${
          cfg.header?.showTopAdmissionNo && d.ipdNo && cfg.fieldStyles?.["ticket.topAdmissionNo"]?.show !== false
            ? `
          <div class="top-id-tag" style="${getFieldComputedStyle("ticket.topAdmissionNo", "ticketHeader", cfg)}" ${clickableAttr("ticket.topAdmissionNo")}>
            <small>IPD ADMISSION NO</small>
            ${d.ipdNo}
          </div>
        `
            : ""
        }
        ${cfg.header?.showBarcode && cfg.fieldStyles?.["ticket.barcode"]?.show !== false ? `
          <div style="${getFieldComputedStyle("ticket.barcode", "ticketHeader", cfg)}" ${clickableAttr("ticket.barcode")}>
            ${generateBarcodeSvg(d.ipdNo || d.uhid)}
          </div>
        ` : ""}
      </div>
    </div>
    `
        : ""
    }
    `
    }

    <!-- ── 3. PATIENT DEMOGRAPHICS CARD ── -->
    ${
      cfg.patient?.enabled !== false && styles.patientCard?.show !== false
        ? `
    <div class="section-card" style="${patientStyle}" ${clickableAttr("patientCard", "card")}>
      <div class="section-head">
        <h3 class="section-title">👤 ${cfg.patient?.title || "PATIENT DEMOGRAPHICS"}</h3>
        <span style="font-size: 8.5px; color: #64748b;">Encounter Date: <strong>${d.admissionDate || ""}</strong></span>
      </div>
      <div class="field-grid-3">
        ${
          isShow("patient", "name")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("patient.name", "patientCard", cfg)}" ${clickableAttr("patient.name")}>
            ${renderGuide("patient.name")}
            <span class="field-label">${getLabel("patient", "name", "Patient Name")}</span>
            <span class="field-val" style="font-size: 12px; color: #0284c7;">${d.patientName || "—"}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("patient", "uhid")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("patient.uhid", "patientCard", cfg)}" ${clickableAttr("patient.uhid")}>
            ${renderGuide("patient.uhid")}
            <span class="field-label">${getLabel("patient", "uhid", "UHID No.")}</span>
            <span class="field-val">${d.uhid || "—"}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("patient", "ageGender")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("patient.ageGender", "patientCard", cfg)}" ${clickableAttr("patient.ageGender")}>
            ${renderGuide("patient.ageGender")}
            <span class="field-label">${getLabel("patient", "ageGender", "Age / Gender")}</span>
            <span class="field-val">${d.ageGender || "—"}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("patient", "mobile")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("patient.mobile", "patientCard", cfg)}" ${clickableAttr("patient.mobile")}>
            ${renderGuide("patient.mobile")}
            <span class="field-label">${getLabel("patient", "mobile", "Contact Phone")}</span>
            <span class="field-val">${d.mobile || "—"}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("patient", "bloodGroup")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("patient.bloodGroup", "patientCard", cfg)}" ${clickableAttr("patient.bloodGroup")}>
            ${renderGuide("patient.bloodGroup")}
            <span class="field-label">${getLabel("patient", "bloodGroup", "Blood Group")}</span>
            <span class="field-val"><span class="highlight-pill" style="background:#fee2e2; color:#b91c1c; border-color:#fca5a5;">🩸 ${d.bloodGroup || "—"}</span></span>
          </div>
        `
            : ""
        }
        ${
          isShow("patient", "guardian")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("patient.guardian", "patientCard", cfg)}" ${clickableAttr("patient.guardian")}>
            ${renderGuide("patient.guardian")}
            <span class="field-label">${getLabel("patient", "guardian", "Guardian / Attendant")}</span>
            <span class="field-val">${d.guardian || "—"} ${d.relation ? `(${d.relation})` : ""}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("patient", "address")
            ? `
          <div class="field-cell span-3" style="${getFieldComputedStyle("patient.address", "patientCard", cfg)}" ${clickableAttr("patient.address")}>
            ${renderGuide("patient.address")}
            <span class="field-label">${getLabel("patient", "address", "Address")}</span>
            <span class="field-val" style="font-size: 10px; font-weight: 500;">${d.address || "—"}</span>
          </div>
        `
            : ""
        }
      </div>
    </div>
    `
        : ""
    }

    <!-- ── 4. CLINICAL ADMISSION & WARD DETAILS CARD (TARGET 9 FIELDS) ── -->
    ${
      cfg.admission?.enabled !== false && styles.admissionCard?.show !== false
        ? `
    <div class="section-card" style="${admissionStyle}" ${clickableAttr("admissionCard", "card")}>
      <div class="section-head">
        <h3 class="section-title">🩺 ${cfg.admission?.title || "CLINICAL ADMISSION & ENCOUNTER RECORD"}</h3>
        <span style="font-size: 8.5px; font-weight: 700; color: #059669;">● Inpatient Bed Confirmed</span>
      </div>
      <div class="field-grid-3">
        <!-- 1. ADMISSION TYPE -->
        ${
          isShow("admission", "admissionType")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("admission.admissionType", "admissionCard", cfg)}" ${clickableAttr("admission.admissionType")}>
            ${renderGuide("admission.admissionType")}
            <span class="field-label">${getLabel("admission", "admissionType", "Admission Type")}</span>
            <span class="field-val">
              <span class="highlight-pill" style="background: #fef3c7; color: #92400e; border-color: #fde68a;">
                🚨 ${d.admissionType || "Emergency"}
              </span>
            </span>
          </div>
        `
            : ""
        }

        <!-- 2. ADMISSION DATE & TIME -->
        ${
          isShow("admission", "admissionDate")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("admission.admissionDate", "admissionCard", cfg)}" ${clickableAttr("admission.admissionDate")}>
            ${renderGuide("admission.admissionDate")}
            <span class="field-label">${getLabel("admission", "admissionDate", "Admission Date & Time")}</span>
            <span class="field-val">📅 ${d.admissionDate || "—"}</span>
          </div>
        `
            : ""
        }

        <!-- 3. DEPARTMENT -->
        ${
          isShow("admission", "department")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("admission.department", "admissionCard", cfg)}" ${clickableAttr("admission.department")}>
            ${renderGuide("admission.department")}
            <span class="field-label">${getLabel("admission", "department", "Department / Specialty")}</span>
            <span class="field-val" style="color: #0369a1;">🏥 ${d.department || "General Medicine"}</span>
          </div>
        `
            : ""
        }

        <!-- 4. DOCTOR TO CONSULT -->
        ${
          isShow("admission", "doctor")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("admission.doctor", "admissionCard", cfg)}" ${clickableAttr("admission.doctor")}>
            ${renderGuide("admission.doctor")}
            <span class="field-label">${getLabel("admission", "doctor", "Treating Consultant")}</span>
            <span class="field-val" style="font-size: 11.5px; font-weight: 800; color: #1e3a8a;">👨‍⚕️ ${d.doctor || "On Duty Doctor"}</span>
          </div>
        `
            : ""
        }

        <!-- 5. DURATION OF STAY / ILLNESS -->
        ${
          isShow("admission", "duration")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("admission.duration", "admissionCard", cfg)}" ${clickableAttr("admission.duration")}>
            ${renderGuide("admission.duration")}
            <span class="field-label">${getLabel("admission", "duration", "Duration of Problem / Stay")}</span>
            <span class="field-val">⏱️ ${d.duration || "—"}</span>
          </div>
        `
            : ""
        }

        <!-- 6. BED ALLOTTED -->
        ${
          isShow("admission", "bedAllotted")
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("admission.bedAllotted", "admissionCard", cfg)}" ${clickableAttr("admission.bedAllotted")}>
            ${renderGuide("admission.bedAllotted")}
            <span class="field-label">${getLabel("admission", "bedAllotted", "Bed Allotted / Ward")}</span>
            <div class="bed-allotted-box">🛏️ ${d.bedAllotted || "General Ward"}</div>
          </div>
        `
            : ""
        }

        <!-- 7. PATIENT PROBLEM / CHIEF COMPLAINTS -->
        ${
          isShow("admission", "patientProblem")
            ? `
          <div class="field-cell span-3" style="${getFieldComputedStyle("admission.patientProblem", "admissionCard", cfg, "background: #f8fafc; padding: 4px 8px; border-radius: 5px; border: 1px dashed #cbd5e1;")}" ${clickableAttr("admission.patientProblem")}>
            ${renderGuide("admission.patientProblem")}
            <span class="field-label">${getLabel("admission", "patientProblem", "Patient Problem / Complaints")}</span>
            <span class="field-val" style="color: #b91c1c; font-weight: 700;">⚠️ ${d.patientProblem || "General Consultation"}</span>
          </div>
        `
            : ""
        }

        <!-- 8. PROVISIONAL CLINICAL DIAGNOSIS -->
        ${
          isShow("admission", "provisionalDiagnosis")
            ? `
          <div class="field-cell span-2" style="${getFieldComputedStyle("admission.provisionalDiagnosis", "admissionCard", cfg)}" ${clickableAttr("admission.provisionalDiagnosis")}>
            ${renderGuide("admission.provisionalDiagnosis")}
            <span class="field-label">${getLabel("admission", "provisionalDiagnosis", "Provisional Diagnosis")}</span>
            <span class="field-val" style="font-size: 10.5px;">${d.provisionalDiagnosis || "—"}</span>
          </div>
        `
            : ""
        }

        ${
          isShow("admission", "referredBy") && d.referredBy
            ? `
          <div class="field-cell" style="${getFieldComputedStyle("admission.referredBy", "admissionCard", cfg)}" ${clickableAttr("admission.referredBy")}>
            ${renderGuide("admission.referredBy")}
            <span class="field-label">${getLabel("admission", "referredBy", "Referred By")}</span>
            <span class="field-val">${d.referredBy}</span>
          </div>
        `
            : ""
        }
      </div>
    </div>
    `
        : ""
    }

    <!-- ── 5. REGISTRATION FEE & ADVANCE DEPOSIT CARD (TARGET FIELDS) ── -->
    ${
      cfg.financial?.enabled !== false && styles.financialCard?.show !== false
        ? `
    <div class="section-card" style="${financialStyle}" ${clickableAttr("financialCard", "card")}>
      <div class="section-head">
        <h3 class="section-title">💳 ${cfg.financial?.title || "ADMISSION FEE & ADVANCE PAYMENT DETAILS"}</h3>
        <span style="font-size: 8.5px; font-weight: 700;">Receipt: <strong>${d.receiptNo || "RCP-IPD-001"}</strong></span>
      </div>
      
      <table class="fee-table">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 50%;">PARTICULAR / INPATIENT SERVICE</th>
            <th style="width: 25%;">PAYMENT MODE / REFERENCE</th>
            <th style="width: 20%; text-align: right;">AMOUNT (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${
            isShow("financial", "registrationFee")
              ? `
            <tr style="${getFieldComputedStyle("financial.registrationFee", "financialCard", cfg)}" ${clickableAttr("financial.registrationFee")}>
              <td>01</td>
              <td><strong>${getLabel("financial", "registrationFee", "IPD Registration Fee")}</strong></td>
              <td>Admission Counter</td>
              <td style="text-align: right; font-weight: 700;">₹ ${Number(d.registrationFee || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          `
              : ""
          }
          ${
            isShow("financial", "advancePayment")
              ? `
            <tr style="${getFieldComputedStyle("financial.advancePayment", "financialCard", cfg)}" ${clickableAttr("financial.advancePayment")}>
              <td>02</td>
              <td><strong>${getLabel("financial", "advancePayment", "Initial Advance Deposit (Adjustable at Final Bill)")}</strong></td>
              <td>${d.paymentMode || "Cash"}</td>
              <td style="text-align: right; font-weight: 700;">₹ ${Number(d.advancePayment || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          `
              : ""
          }
          <tr class="fee-total-row">
            <td colspan="3" style="text-align: right; text-transform: uppercase;">Total Inpatient Deposit Paid at Admission:</td>
            <td style="text-align: right; color: #065f46; font-size: 12px;">₹ ${Number((Number(d.registrationFee) || 0) + (Number(d.advancePayment) || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      ${
        isShow("financial", "amountInWords") && d.amountInWords
          ? `
        <div style="margin-top: 4px; font-size: 8.5px; color: #475569; ${getFieldComputedStyle("financial.amountInWords", "financialCard", cfg)}" ${clickableAttr("financial.amountInWords")}>
          <strong>Amount in Words:</strong> <em>${d.amountInWords}</em>
        </div>
      `
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- ── 6. INPATIENT TERMS & CONDITIONS METADATA (LIKE IPD BILLING) ── -->
    ${
      cfg.terms?.enabled !== false && styles.termsCard?.show !== false && cfg.fieldStyles?.["terms.card"]?.show !== false
        ? `
    <div class="section-card" style="${termsStyle}; ${getFieldComputedStyle("terms.card", "termsCard", cfg)}" ${clickableAttr("termsCard", "card")}>
      <div class="section-head" style="margin-bottom: 4px; padding-bottom: 2px;">
        <h3 class="section-title" style="font-size: 8.5px; ${getFieldComputedStyle("terms.title", "termsCard", cfg)}" ${clickableAttr("terms.title")}>📜 ${cfg.fieldStyles?.["terms.title"]?.customText || cfg.terms?.title || "INPATIENT ADMISSION TERMS & HOSPITAL RULES"}</h3>
      </div>
      <ol class="terms-list" style="${getFieldComputedStyle("terms.list", "termsCard", cfg)}" ${clickableAttr("terms.list")}>
        ${(cfg.terms?.items || []).map((term) => `<li>${term}</li>`).join("")}
      </ol>
      ${
        cfg.terms?.footerTagline && cfg.fieldStyles?.["terms.footerTagline"]?.show !== false
          ? `<div class="terms-footer-tagline" style="${getFieldComputedStyle("terms.footerTagline", "termsCard", cfg)}" ${clickableAttr("terms.footerTagline")}>${cfg.fieldStyles?.["terms.footerTagline"]?.customText || cfg.terms.footerTagline}</div>`
          : ""
      }
      ${
        (cfg.hospital?.phone || cfg.fieldStyles?.["terms.helpline"]?.customText) && cfg.fieldStyles?.["terms.helpline"]?.show !== false
          ? `<div class="terms-footer-helpline" style="font-size: 8px; font-weight: 700; color: #0b3b60; text-align: center; margin-top: 3px; padding-top: 2px; border-top: 1px solid #e2e8f0; ${getFieldComputedStyle("terms.helpline", "termsCard", cfg)}" ${clickableAttr("terms.helpline")}>📞 ${cfg.fieldStyles?.["terms.helpline"]?.customText || `24x7 Helpline: ${cfg.hospital?.phone || "+91 7388660408"}${cfg.hospital?.emergencyPhone ? ` • Emergency: ${cfg.hospital.emergencyPhone}` : ""}`}</div>`
          : ""
      }
      ${
        (cfg.hospital?.address || cfg.fieldStyles?.["terms.address"]?.customText) && cfg.fieldStyles?.["terms.address"]?.show !== false
          ? `<div class="terms-footer-address" style="font-size: 7.5px; font-weight: 600; color: #475569; text-align: center; margin-top: 1px; ${getFieldComputedStyle("terms.address", "termsCard", cfg)}" ${clickableAttr("terms.address")}>📍 ${cfg.fieldStyles?.["terms.address"]?.customText || `${cfg.hospital?.name ? `${cfg.hospital.name} • ` : ""}${cfg.hospital?.address}`}</div>`
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- ── 7. SIGNATURES & OFFICIAL STAMP ── -->
    ${
      cfg.signatures?.enabled !== false && styles.signaturesCard?.show !== false && cfg.fieldStyles?.["signatures.card"]?.show !== false
        ? `
    <div class="section-card" style="${sigStyle}; ${getFieldComputedStyle("signatures.card", "signaturesCard", cfg)}" ${clickableAttr("signaturesCard", "card")}>
      <div class="signatures-row">
        ${
          cfg.signatures?.showDoctor && cfg.fieldStyles?.["signatures.doctor"]?.show !== false
            ? `
          <div class="sig-col" style="${getFieldComputedStyle("signatures.doctor", "signaturesCard", cfg)}" ${clickableAttr("signatures.doctor")}>
            <div class="sig-line"></div>
            <p class="sig-title">${cfg.signatures?.doctorTitle || "Treating Consultant"}</p>
            <p class="sig-sub">${cfg.signatures?.doctorSub || "Signature & Reg No."}</p>
          </div>
        `
            : "<div></div>"
        }
        ${
          cfg.signatures?.showNurse && cfg.fieldStyles?.["signatures.nurse"]?.show !== false
            ? `
          <div class="sig-col" style="${getFieldComputedStyle("signatures.nurse", "signaturesCard", cfg)}" ${clickableAttr("signatures.nurse")}>
            <div class="sig-line"></div>
            <p class="sig-title">${cfg.signatures?.nurseTitle || "Duty Nursing Officer"}</p>
            <p class="sig-sub">${cfg.signatures?.nurseSub || "Ward Handover"}</p>
          </div>
        `
            : "<div></div>"
        }
        ${
          cfg.signatures?.showAttendant && cfg.fieldStyles?.["signatures.attendant"]?.show !== false
            ? `
          <div class="sig-col" style="${getFieldComputedStyle("signatures.attendant", "signaturesCard", cfg)}" ${clickableAttr("signatures.attendant")}>
            <div class="sig-line"></div>
            <p class="sig-title">${cfg.signatures?.attendantTitle || "Patient / Attendant"}</p>
            <p class="sig-sub">${cfg.signatures?.attendantSub || "Verified & Acknowledged"}</p>
          </div>
        `
            : "<div></div>"
        }
        ${
          cfg.signatures?.showStamp && cfg.fieldStyles?.["signatures.stamp"]?.show !== false
            ? `
          <div class="sig-col" style="${getFieldComputedStyle("signatures.stamp", "signaturesCard", cfg)}" ${clickableAttr("signatures.stamp")}>
            <div class="stamp-box">
              <span>${cfg.signatures?.stampTitle || "HOSPITAL ADMISSION STAMP"}</span>
            </div>
          </div>
        `
            : "<div></div>"
        }
      </div>
    </div>
    `
        : ""
    }
  </div>
</body>
</html>`;
}

/**
 * Trigger browser printing in an invisible iframe
 */
export function printAdmissionTicket(data, settings) {
  const html = buildAdmissionTicketHTML(data, settings, { isPreview: false });

  let iframe = document.getElementById("ipd-ticket-print-iframe");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "ipd-ticket-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
  }, 350);
}

export const IPDAdmissionPrintHandler = {
  buildAdmissionTicketHTML,
  printAdmissionTicket,
};

export default IPDAdmissionPrintHandler;
