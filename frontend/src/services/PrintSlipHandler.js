import { formatDate } from '../utils/formatters.js';
import { getHospitalConfig } from '../data/printlslip.data.jsx';
import settingsService from '../api/services/settingsService.js';

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
      const data = await settingsService.getSetting('print_slip_opd');
      if (data) {
        this._cachedDbSettings = data;
        return data;
      }
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

  static _buildSlipHTML(booking, customConfig = {}) {
    const config = this._resolveConfig(booking, customConfig);
    const dbConfig = this._cachedDbSettings || {};

    const hospital = {
      ...(config.hospital || {}),
      ...(dbConfig.hospital || {}),
      ...(customConfig.hospital || {}),
    };

    const styling = {
      ...(config.styling || {}),
      ...(dbConfig.styling || {}),
      ...(customConfig.styling || {}),
    };

    const page = {
      ...(config.page || {}),
      ...(dbConfig.page || {}),
      ...(customConfig.page || {}),
    };

    const header = {
      ...(config.header || {}),
      ...(dbConfig.header || {}),
      ...(customConfig.header || {}),
    };

    const patientDetailsConfig = {
      ...(dbConfig.patientDetails || {}),
      ...(customConfig.patientDetails || {}),
    };

    const visitDetailsConfig = {
      ...(dbConfig.visitDetails || {}),
      ...(customConfig.visitDetails || {}),
    };

    const footer = {
      ...(dbConfig.footer || {}),
      ...(customConfig.footer || {}),
    };

    const paperSize = (page.size || styling.paperSize || 'A4').toUpperCase();
    const orientation = page.orientation || 'portrait';
    const marginMm = Number(page.margin !== undefined ? page.margin : 8);

    const isA5 = paperSize === 'A5';
    const isLetter = paperSize === 'LETTER';
    const maxSlipWidth = isA5 ? '138mm' : isLetter ? '198mm' : '194mm';
    const slipPadding = isA5 ? '14px 18px 12px' : '20px 24px 16px';
    const sizeClass = isA5 ? 'size-a5' : isLetter ? 'size-letter' : 'size-a4';

    const primaryColor = styling.primaryColor || '#0B3B60';
    const secondaryColor = styling.secondaryColor || '#E0F2FE';
    const accentColor = styling.accentColor || '#0284C7';
    const slipBorderColor = styling.slipBorderColor || '#93C5FD';
    const borderRadius =
      styling.shape === 'sharp'
        ? '0px'
        : styling.shape === 'subtle'
        ? '6px'
        : styling.shape === 'pill'
        ? '20px'
        : styling.borderRadius || '12px';

    const hospitalName = hospital.name || 'Narayan Hospital';
    const hospitalSubtitle = hospital.subtitle || 'Super Speciality Healthcare & Research Institute';
    const hospitalSlogan = hospital.slogan || 'Better Care. Healthier Tomorrow.';

    const rawLogo = hospital.logo?.src || '/images/Narayan_Logo.png';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const logoUrl =
      rawLogo.startsWith('http://') || rawLogo.startsWith('https://') || rawLogo.startsWith('data:')
        ? rawLogo
        : `${origin}${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`;

    const logoHeight = hospital.logo?.height || '48px';
    const logoMaxWidth = hospital.logo?.maxWidth || '160px';

    // Patient & Encounter Data
    const patientName = booking.patient_name || booking.patientName || booking.name || 'Adeesh';
    const age = booking.age || booking.ageYrs || '44';
    const gender = booking.gender || 'Male';
    const phone = booking.mobile || booking.phone || booking.mobile1 || '+91 7287901826';
    const address = [
      booking.address || booking.address_line1 || 'Jansa, Varanasi',
      booking.city ? `, ${booking.city}` : '',
      booking.state ? `, ${booking.state}` : ', Uttar Pradesh',
      booking.pinCode || booking.pincode ? `, ${booking.pinCode || booking.pincode}` : ', 221405',
    ].join('').replace(/^,\s*/, '');

    const token =
      booking.token_number ||
      booking.tokenNo ||
      booking.token ||
      booking.opd_token ||
      'T-311026-GEN-03';

    const visitType = booking.visitType || booking.category || 'OPD Consultation';
    const encounterNo = booking.encounterNo || booking.uhid || 'OPD-26-0044';
    const encounterDate = formatDate(
      booking.encounterDate || booking.date || booking.preferredDate || booking.created_at || new Date()
    );
    const source = booking.source || booking.bookingSource || 'Offline';
    const status = booking.status || 'Arrived';

    // Particulars
    let billingRows = [];
    if (Array.isArray(booking.particulars) && booking.particulars.length > 0) {
      billingRows = booking.particulars;
    } else {
      const consultFee = Number(booking.consultFee || booking.consultationFee || 500);
      const regFee = Number(booking.regFee || booking.registrationFee || 100);
      billingRows = [
        { id: '1', particular: 'OPD Consultation Fee', amount: consultFee },
        { id: '2', particular: 'Registration Fee', amount: regFee },
      ];
    }
    const totalAmount =
      booking.totalAmount !== undefined
        ? Number(booking.totalAmount)
        : billingRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const docTitle = header.badgeTitle || 'OPD Consultation Slip';

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
  }
  html, body {
    margin: 0;
    padding: 0;
    color: #0f172a;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .slip {
    position: relative;
    border: 1.5px solid ${slipBorderColor};
    border-radius: ${borderRadius};
    padding: ${slipPadding};
    background: #ffffff;
    box-sizing: border-box;
    width: 100%;
    max-width: ${maxSlipWidth};
    margin: 0 auto;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  @media print {
    body { margin: 0; padding: 0; }
    .slip { width: 100%; max-width: 100%; border-color: ${slipBorderColor}; }
  }

  /* Size Modifiers */
  .slip.size-a5 {
    font-size: 11px;
  }
  .slip.size-a5 .hosp-name { font-size: 17px; }
  .slip.size-a5 .hosp-sub { font-size: 11px; }
  .slip.size-a5 .slogan { font-size: 10px; }
  .slip.size-a5 .banner-title { font-size: 14px; }
  .slip.size-a5 .token-val { font-size: 15px; }
  .slip.size-a5 .card { padding: 8px 10px; }
  .slip.size-a5 .card-head { font-size: 11px; margin-bottom: 6px; }
  .slip.size-a5 .rows-wrap { font-size: 10.5px; gap: 3px; }
  .slip.size-a5 .lbl { width: 85px; }
  .slip.size-a5 th, .slip.size-a5 td { padding: 5px 8px; font-size: 10.5px; }
  .slip.size-a5 .stamp-box { width: 110px; height: 42px; min-height: 42px; max-height: 42px; font-size: 9px; }

  /* Decorative Wave Elements */
  .wave-top {
    position: absolute;
    top: 0;
    right: 0;
    width: 55%;
    height: 52px;
    pointer-events: none;
    z-index: 0;
    opacity: 0.85;
  }
  .wave-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 22px;
    pointer-events: none;
    z-index: 0;
  }

  /* Header */
  .header {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
    border-bottom: 1.5px solid #E2E8F0;
    margin-bottom: 14px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .logo-img {
    height: ${logoHeight};
    max-width: ${logoMaxWidth};
    object-fit: contain;
  }
  .title-group {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .hosp-name {
    font-size: 22px;
    font-weight: 800;
    color: ${primaryColor};
    margin: 0;
  }
  .divider {
    font-size: 22px;
    font-weight: 300;
    color: #94A3B8;
  }
  .hosp-sub {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }
  .slogan {
    font-size: 12px;
    font-style: italic;
    font-weight: 600;
    color: #0369A1;
    text-align: right;
  }

  /* Banner & Token Row */
  .title-row {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 260px;
    gap: 16px;
    margin-bottom: 14px;
  }
  .banner {
    background: ${primaryColor};
    color: #ffffff;
    border-radius: calc(${borderRadius} - 2px);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
  }
  .banner-title {
    font-size: 18px;
    font-weight: 800;
  }
  .token-box {
    background: ${secondaryColor};
    border: 1.5px solid ${slipBorderColor};
    border-radius: calc(${borderRadius} - 2px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 14px;
  }
  .token-lbl {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    color: ${primaryColor};
    letter-spacing: 0.8px;
  }
  .token-val {
    font-size: 18px;
    font-weight: 800;
    color: ${primaryColor};
    font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
  }

  /* Two Columns Details Grid */
  .details-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 14px;
  }
  .card {
    border: 1.5px solid ${slipBorderColor};
    border-radius: calc(${borderRadius} - 2px);
    background: #ffffff;
    padding: 12px 16px;
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 800;
    color: ${primaryColor};
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 6px;
    margin-bottom: 8px;
  }
  .rows-wrap {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
  }
  .row {
    display: flex;
    align-items: baseline;
    line-height: 1.4;
  }
  .lbl {
    width: 105px;
    min-width: 105px;
    color: #475569;
    font-weight: 600;
  }
  .colon {
    width: 14px;
    text-align: center;
    color: #475569;
    font-weight: bold;
  }
  .val {
    flex: 1;
    color: #0F172A;
    font-weight: 700;
  }

  /* Pill Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }
  .badge-source {
    background: #E0F2FE;
    color: #0369A1;
    border: 1px solid #BAE6FD;
  }
  .badge-status {
    background: #DCFCE7;
    color: #15803D;
    border: 1px solid #86EFAC;
  }

  /* Table */
  .table-wrap {
    position: relative;
    z-index: 1;
    border: 1.5px solid ${slipBorderColor};
    border-radius: calc(${borderRadius} - 2px);
    overflow: hidden;
    margin-bottom: 14px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  th {
    background: ${primaryColor};
    color: #ffffff;
    padding: 7px 14px;
    font-weight: 800;
    text-align: left;
  }
  td {
    padding: 7px 14px;
    border-bottom: 1px solid #E2E8F0;
    color: #1e293b;
    font-weight: 600;
  }
  .th-num, .td-num { width: 44px; text-align: center; }
  .th-amt, .td-amt { width: 140px; text-align: right; font-weight: 700; }
  .total-row td {
    background: ${secondaryColor};
    color: ${primaryColor};
    font-size: 13px;
    font-weight: 800;
    border-top: 1.5px solid ${slipBorderColor};
  }

  /* Footer */
  .footer {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding-top: 8px;
    border-top: 1.5px solid #E2E8F0;
    margin-top: 10px;
  }
  .footer-info {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
  .info-icon {
    background: ${primaryColor};
    color: #ffffff;
    width: 20px;
    height: 20px;
    min-width: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
  }
  .bullet-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 10.5px;
    color: #334155;
    font-weight: 600;
  }
  .helpline-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .footer-divider {
    width: 1px;
    height: 28px;
    background: #CBD5E1;
  }
  .helpline {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 800;
    color: ${primaryColor};
    white-space: nowrap;
  }
  .stamp-box {
    width: 140px;
    height: 48px;
    min-height: 48px;
    max-height: 48px;
    flex-shrink: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px dashed ${accentColor};
    border-radius: 6px;
    padding: 4px 8px;
    text-align: center;
    font-size: 10px;
    font-weight: 800;
    color: ${accentColor};
    line-height: 1.2;
  }
</style>
</head>
<body>

<div class="slip ${sizeClass}">
  <!-- Top Wave -->
  <svg class="wave-top" viewBox="0 0 400 60" preserveAspectRatio="none">
    <path d="M0,0 C120,45 250,10 400,35 L400,0 L0,0 Z" fill="#0284C7" fill-opacity="0.3"/>
    <path d="M50,0 C160,50 280,15 400,45 L400,0 L50,0 Z" fill="#38BDF8" fill-opacity="0.4"/>
  </svg>

  <!-- Bottom Wave -->
  <svg class="wave-bottom" viewBox="0 0 800 24" preserveAspectRatio="none">
    <path d="M0,12 C200,24 600,0 800,16 L800,24 L0,24 Z" fill="${primaryColor}"/>
  </svg>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <img src="${logoUrl}" alt="${hospitalName}" class="logo-img" onerror="this.src='/NarayanLogo.png';"/>
      <div class="title-group">
        <h1 class="hosp-name">${hospitalName}</h1>
        ${hospitalSubtitle ? `<span class="divider">|</span><span class="hosp-sub">${hospitalSubtitle}</span>` : ''}
      </div>
    </div>
    ${hospitalSlogan ? `<div class="slogan">${hospitalSlogan}</div>` : ''}
  </div>

  <!-- Title & Token Banner -->
  <div class="title-row">
    <div class="banner">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3"/><path d="M9 12.5v3.5a3 3 0 0 0 6 0V11"/><circle cx="15" cy="10" r="2"/><circle cx="3" cy="3" r="1.5"/><circle cx="15" cy="3" r="1.5"/>
      </svg>
      <div class="banner-title">${docTitle}</div>
    </div>
    <div class="token-box">
      <span class="token-lbl">OPD Token</span>
      <span class="token-val">${token}</span>
    </div>
  </div>

  <!-- Details Grid -->
  <div class="details-grid">
    <!-- Patient Details -->
    <div class="card">
      <div class="card-head">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>${patientDetailsConfig.cardTitle || 'Patient Details'}</span>
      </div>
      <div class="rows-wrap">
        <div class="row"><span class="lbl">Name</span><span class="colon">:</span><span class="val">${patientName}</span></div>
        <div class="row"><span class="lbl">Age / Gender</span><span class="colon">:</span><span class="val">${age} Yrs / ${gender}</span></div>
        <div class="row"><span class="lbl">Mobile No.</span><span class="colon">:</span><span class="val">${phone}</span></div>
        <div class="row"><span class="lbl">Address</span><span class="colon">:</span><span class="val">${address}</span></div>
      </div>
    </div>

    <!-- Visit Details -->
    <div class="card">
      <div class="card-head">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
        <span>${visitDetailsConfig.cardTitle || 'Visit & Clinical Details'}</span>
      </div>
      <div class="rows-wrap">
        <div class="row"><span class="lbl">Visit Type</span><span class="colon">:</span><span class="val">${visitType}</span></div>
        <div class="row"><span class="lbl">Encounter No.</span><span class="colon">:</span><span class="val">${encounterNo}</span></div>
        <div class="row"><span class="lbl">Encounter Date</span><span class="colon">:</span><span class="val">${encounterDate}</span></div>
        <div class="row"><span class="lbl">Source</span><span class="colon">:</span><span class="val"><span class="badge badge-source">${source}</span></span></div>
        <div class="row"><span class="lbl">Status</span><span class="colon">:</span><span class="val"><span class="badge badge-status">✓ ${status}</span></span></div>
      </div>
    </div>
  </div>

  <!-- Particulars Table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th class="th-num">#</th>
          <th>Particulars</th>
          <th class="th-amt">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${billingRows.map((r, i) => `<tr><td class="td-num">${i + 1}</td><td>${r.particular || r.service || 'OPD Consultation Fee'}</td><td class="td-amt">₹ ${Number(r.amount || 0).toFixed(2)}</td></tr>`).join('')}
        <tr class="total-row">
          <td colspan="2" style="text-align:center">Total Amount</td>
          <td class="td-amt">₹ ${totalAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-info">
      <div class="info-icon">i</div>
      <div class="bullet-list">
        ${(footer.infoBullets || ['Please carry this slip for consultation.', 'For any assistance, contact reception.']).map(b => `<span>• ${b}</span>`).join('')}
      </div>
    </div>
    <div class="helpline-wrap">
      <div class="footer-divider"></div>
      <div class="helpline">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        <span>${footer.helpline?.label || 'Helpline:'} ${footer.helpline?.number || hospital.phone || '+91 7388660408'}</span>
      </div>
      <div class="footer-divider"></div>
    </div>
    <div class="stamp-box">${footer.stamp?.label || 'HOSPITAL STAMP'}</div>
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
