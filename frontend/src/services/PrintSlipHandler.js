import { formatDate } from '../utils/formatters.js'
import { getHospitalConfig } from '../data/printlslip.data.jsx'

/**
 * PrintSlipHandler — Opens a dedicated print window with the patient slip
 * rendered as self-contained HTML + inline CSS.
 * Supports full-page A4 layout, side-by-side two-column Gynaecology couple panels,
 * and spacious vitals writing areas.
 *
 * Fully dynamic: Hospital name, logo, contacts, helpline numbers, document titles,
 * and counter notices can be passed from the Database/API (via booking object or customConfig),
 * with a seamless fallback to the frontend mock configuration in `src/data/printlslip.data.jsx`.
 */
export class PrintSlipHandler {
  /**
   * Runtime global configuration override (optional, e.g. set after tenant/DB fetch).
   * @type {Object|null}
   */
  static _globalConfig = null

  /**
   * Set a global configuration override across the application.
   * @param {Object} config
   */
  static setGlobalConfig(config) {
    this._globalConfig = config
  }

  /**
   * Helper to detect if a booking is for Gynaecology / Infertility.
   * @param {Object} b
   * @returns {boolean}
   */
  static isGynaeBooking(b) {
    if (!b) return false
    const text = [
      b.department_name,
      b.department,
      b.doctor_specialization,
      b.doctor_name,
      b.doctor,
      b.service_name,
      b.doctorId?.specialization,
      b.doctorId?.department,
      b.doctorId?.role,
      b.departmentId?.name,
      b.problemDescription,
      b.problem_description,
      b.chiefComplaint,
      b.chief_complaint,
      b.symptoms,
    ]
      .filter(Boolean)
      .join(' ')
    return /gyn|obstetric|स्त्री|infertility|निःसंतानता|बांझपन/i.test(text)
  }

  /**
   * Resolve active configuration using the hierarchy:
   * 1. Explicit customConfig passed to call
   * 2. Booking DB fields (hospital_name, hospital_logo, etc.)
   * 3. Static _globalConfig
   * 4. Frontend mock fallback from `data/printlslip.data.jsx`
   *
   * @param {Object} booking
   * @param {Object} [customConfig={}]
   * @returns {Object}
   */
  static _resolveConfig(booking = {}, customConfig = {}) {
    const mergedOverrides = {
      ...(this._globalConfig || {}),
      ...(customConfig || {}),
    }
    return getHospitalConfig(booking, mergedOverrides)
  }

  /**
   * Print a single booking slip.
   * @param {Object} booking
   * @param {Object} [customConfig={}] - Optional hospital/branding config overrides
   */
  static printBooking(booking, customConfig = {}) {
    if (!booking) return console.warn('PrintSlipHandler: No booking provided')
    this._openPrintWindow(booking, customConfig)
  }

  /**
   * Generates and returns the complete printable HTML string (e.g. for previews, iframes).
   * @param {Object} booking
   * @param {Object} [customConfig={}]
   * @returns {string}
   */
  static getSlipHTML(booking, customConfig = {}) {
    return this._buildSlipHTML(booking, customConfig)
  }

  /** Build the full HTML document for the print window. */
  static _buildSlipHTML(booking, customConfig = {}) {
    const config = this._resolveConfig(booking, customConfig)

    const isIPD =
      booking.type === 'HOSPITALIZATION' ||
      booking.service_name?.toLowerCase().includes('ipd') ||
      booking.service_name?.toLowerCase().includes('hospitalization') ||
      booking.visitType?.toLowerCase().includes('ipd') ||
      booking.visitType?.toLowerCase().includes('hospitalization')

    // Determine gynae layout: respect manual override if specified, otherwise auto-detect
    const isGynae =
      config.clinical?.showGynaePanels === true
        ? true
        : config.clinical?.showGynaePanels === false
        ? false
        : this.isGynaeBooking(booking)

    const defaultTitle = isIPD
      ? (config.titles?.ipd || 'IPD Admission Ticket')
      : (config.titles?.opd || 'OPD Consultation Slip')
    const docTitle = customConfig.docTitle || defaultTitle

    const isOldPatient = Boolean(
      booking.isOld || booking.is_old || booking.patientType === 'Old'
    )
    const patientStatusLabel = isOldPatient
      ? ' (Old Patient पुराना मरीज)'
      : ' (नया मरीज)'

    const rawToken =
      booking.token_number ||
      booking.tokenNo ||
      booking.token ||
      booking.opd_token ||
      booking.token_no
    const tokenDisplay = rawToken
      ? String(rawToken).startsWith('T-')
        ? rawToken
        : `Token #${rawToken}`
      : booking.time_slot || '—'

    const generatedTime = new Date().toLocaleString(
      config.header?.timeFormat || 'en-IN',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }
    )

    const appointmentDate = formatDate(
      booking.preferredDate || booking.date || booking.appointment_date || booking.created_at
    )

    const source =
      booking.source_label ||
      booking.created_by ||
      booking.bookingSource ||
      booking.source ||
      config.clinical?.defaultSource ||
      'WhatsApp Bot'

    const address = [
      booking.address || '',
      booking.district
        ? `, ${booking.district}`
        : booking.city
        ? `, ${booking.city}`
        : '',
      booking.pinCode
        ? ` — ${booking.pinCode}`
        : booking.pincode
        ? ` — ${booking.pincode}`
        : '',
    ].join('')

    const defaultFee = config.clinical?.defaultFee || 500
    const rawFee = isOldPatient
      ? booking.old_patient_fee ||
        booking.doctorId?.oldPatientFee ||
        booking.doctorId?.old_patient_fee ||
        booking.consultation_fee ||
        booking.consultationFee ||
        booking.doctor_fee ||
        booking.totalAmount ||
        booking.fee ||
        defaultFee
      : booking.consultation_fee ||
        booking.consultationFee ||
        booking.doctor_fee ||
        booking.totalAmount ||
        booking.doctorId?.consultationFee ||
        booking.fee ||
        defaultFee
    const feeDisplay = `₹${rawFee}`

    // Theme styles
    const themeStyles = isIPD ? config.theme?.ipd : config.theme?.opd
    const accentBg = themeStyles?.accentBg || (isIPD ? '#e8f5e9' : '#e3f2fd')
    const accentBorder = themeStyles?.accentBorder || (isIPD ? '#c8e6c9' : '#bbdefb')
    const accentText = themeStyles?.accentText || (isIPD ? '#1b5e20' : '#0d47a1')
    const titleColor = themeStyles?.titleColor || (isIPD ? '#2e7d32' : '#1d6fa5')
    const slipBorderColor = themeStyles?.slipBorder || (isIPD ? '#4caf50' : '#7ba4c9')
    const counterType = themeStyles?.counterType || (isIPD ? 'IPD admission' : 'OPD')
    const hindiCounter = themeStyles?.hindiCounter || (isIPD ? 'आईपीडी' : 'ओपीडी')

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${docTitle} — ${booking.patient_name || booking.patientName || 'Patient'}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 6mm 8mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body {
    height: 100%;
    color: #1a1a1a;
    background: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .slip {
    border: 2px solid ${slipBorderColor};
    border-radius: 8px;
    padding: 10px 14px;
    background: #fff;
    box-sizing: border-box;
    min-height: 282mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  @media print {
    body {
      margin: 0;
      padding: 0;
    }
    .slip {
      min-height: 282mm;
      max-height: 284mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .hospital-name { font-size: 22px; font-weight: 900; color: #0b3c5d; line-height: 1.1; }
  .hospital-tagline { font-size: 9.5px; font-weight: 700; color: #64748b; letter-spacing: 0.3px; margin-top: 1px; }
  .doc-title { font-size: 14px; font-weight: 800; color: ${titleColor}; margin-top: 2px; }
  .gen-time { font-size: 11px; font-weight: 600; color: #475569; text-align: right; }

  /* Stats Bar */
  .stats-bar {
    display: grid; grid-template-columns: repeat(4, 1fr);
    background: ${accentBg}; border: 1.5px solid ${accentBorder};
    border-radius: 6px; padding: 6px 12px; margin-bottom: 6px; gap: 8px;
  }
  .stat-label { font-size: 8.5px; font-weight: 900; color: #334155; text-transform: uppercase; letter-spacing: 0.4px; }
  .stat-value { font-size: 12.5px; font-weight: 800; color: ${accentText}; margin-top: 1px; }

  /* Two Columns: Patient Details & Visit Details */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; }
  .detail-box { border: 1.5px solid #94a3b8; border-radius: 6px; padding: 6px 10px; background: #fafafa; }
  .box-header {
    font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase;
    letter-spacing: 0.3px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 4px;
  }
  .highlight { color: #d97706; font-weight: 800; }
  .field-row { display: flex; font-size: 10.5px; line-height: 1.45; margin-bottom: 2px; }
  .field-name { font-weight: 800; color: #1e293b; min-width: 90px; }
  .field-val { color: #0f172a; font-weight: 700; flex: 1; }

  /* General Physical Vitals - Generous space & bold lines */
  .vitals-wrap { border: 1.5px solid #94a3b8; border-radius: 6px; overflow: hidden; margin-bottom: 5px; }
  .vitals-title { font-size: 9.5px; font-weight: 900; color: #0f172a; background: #f1f5f9; padding: 3px 8px; text-transform: uppercase; border-bottom: 1.5px solid #94a3b8; letter-spacing: 0.3px; }
  .vitals-grid { display: grid; grid-template-columns: repeat(5, 1fr); text-align: center; }
  .vital-header { font-size: 9.5px; font-weight: 800; color: #0f172a; padding: 4px 2px; border-right: 1.5px solid #cbd5e1; background: #f8fafc; }
  .vital-header:last-child { border-right: none; }
  .vital-cell { height: 38px; border-right: 1.5px solid #cbd5e1; border-top: 1.5px solid #cbd5e1; }
  .vital-cell:last-child { border-right: none; }

  /* Gynae Couple Panels in TWO COLUMNS (Side-by-Side) */
  .gynae-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 5px; }
  .gynae-panel { border: 1.5px solid #94a3b8; border-radius: 6px; overflow: hidden; background: #fff; display: flex; flex-direction: column; }
  .gynae-panel-female { border-color: #f472b6; }
  .gynae-panel-female .gynae-header { background: #fdf2f8; color: #831843; border-bottom: 1.5px solid #f472b6; }
  .gynae-panel-male { border-color: #38bdf8; }
  .gynae-panel-male .gynae-header { background: #f0f9ff; color: #0369a1; border-bottom: 1.5px solid #38bdf8; }
  .gynae-header {
    font-size: 9.5px; font-weight: 900; padding: 4px 8px; text-transform: uppercase;
    letter-spacing: 0.3px; display: flex; justify-content: space-between; align-items: center;
  }
  
  /* Female 2-column subgrid inside left panel */
  .gynae-grid-2col { display: grid; grid-template-columns: 1fr 1fr; flex: 1; }
  .lab-cell {
    border-right: 1.5px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1; padding: 4px 6px;
    display: flex; flex-direction: column; justify-content: space-between; min-height: 44px;
  }
  .lab-cell:nth-child(2n) { border-right: none; }
  .lab-cell-span2 { grid-column: span 2; border-right: none; }
  .lab-label { font-size: 8.5px; font-weight: 800; color: #0f172a; line-height: 1.15; }
  .lab-box { height: 26px; border-bottom: 2px dashed #475569; margin-top: 2px; }

  /* Male list inside right panel with generous writing slots */
  .gynae-male-list { display: flex; flex-direction: column; flex: 1; }
  .lab-male-item {
    border-bottom: 1.5px solid #cbd5e1; padding: 4px 6px;
    display: flex; flex-direction: column; justify-content: space-between; flex: 1; min-height: 44px;
  }
  .lab-male-item:last-child { border-bottom: none; }

  /* Prescription / Notes - Balanced space for physical/hormonal panels */
  .rx-box {
    flex: 1; border: 1.5px solid #94a3b8; border-radius: 6px; padding: 5px 10px;
    margin-bottom: 5px; min-height: 75px; display: flex; flex-direction: column;
  }
  .rx-title { font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 3px; }
  .rx-lines { flex: 1; display: flex; flex-direction: column; justify-content: space-around; min-height: 55px; }
  .ruled-line { border-bottom: 1.5px solid #94a3b8; margin: 4px 0; }

  /* Signature & Stamp */
  .sig-area { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px; padding-top: 2px; }
  .sig-title { font-size: 11px; font-weight: 800; color: #0f172a; }
  .notice { font-size: 8.5px; font-weight: 600; color: #334155; margin-top: 2px; line-height: 1.25; }
  .stamp { font-size: 10px; font-weight: 800; color: #475569; border: 1.5px dashed #64748b; padding: 6px 12px; border-radius: 4px; }

  /* Footer */
  .footer-bar {
    display: flex; align-items: center; justify-content: space-between;
    background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px;
    padding: 5px 10px; margin-top: 6px;
  }
  .contact { display: flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 800; color: #15803d; }
  .icon-circle {
    width: 18px; height: 18px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; font-size: 10px;
  }
  .wa-icon { background: #25d366; }
  .call-icon { background: #0284c7; }
</style>
</head>
<body>

${this._slipBlock(booking, {
  config,
  docTitle,
  patientStatusLabel,
  tokenDisplay,
  generatedTime,
  appointmentDate,
  source,
  address,
  accentBg,
  accentBorder,
  accentText,
  counterType,
  hindiCounter,
  isIPD,
  isGynae,
  feeDisplay,
})}

</body>
</html>`
  }

  /** Build one slip block HTML. */
  static _slipBlock(b, o) {
    const config = o.config

    // WhatsApp SVG icon (inline)
    const waSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`
    // Phone SVG icon (inline)
    const phoneSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`

    // Dynamic Hospital Branding
    const hospitalName = config.hospital?.name || 'Hospital'
    const hospitalTagline = config.hospital?.tagline ? `<div class="hospital-tagline">${config.hospital.tagline}</div>` : ''

    // Dynamic Logo handling: supports full URL, data URI, or relative path
    let logoImg = ''
    if (config.header?.showLogo !== false && config.hospital?.logo?.show !== false) {
      const rawLogo = config.hospital?.logo?.src || '/image/image.png'
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const logoUrl =
        rawLogo.startsWith('http://') ||
        rawLogo.startsWith('https://') ||
        rawLogo.startsWith('data:')
          ? rawLogo
          : `${origin}${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`

      const logoHeight = config.hospital?.logo?.height || '44px'
      const logoMaxWidth = config.hospital?.logo?.maxWidth || '140px'
      const logoAlt = config.hospital?.logo?.alt || `${hospitalName} Logo`

      logoImg = `<img src="${logoUrl}" style="height:${logoHeight}; max-width:${logoMaxWidth}; object-fit:contain; vertical-align:middle;" alt="${logoAlt}" onerror="this.style.display='none'"/>`
    }

    // Dynamic Physical Vitals
    const showVitals = config.clinical?.showPhysicalVitals !== false
    const generalVitalsHtml = showVitals
      ? `
  <div class="vitals-wrap">
    <div class="vitals-title">PHYSICAL VITALS (For Clinical Use)</div>
    <div class="vitals-grid">
      <div class="vital-header">BP (mmHg)</div>
      <div class="vital-header">Pulse (bpm)</div>
      <div class="vital-header">Temp (°F)</div>
      <div class="vital-header">Weight (kg)</div>
      <div class="vital-header">SpO2 (%)</div>
      <div class="vital-cell"></div>
      <div class="vital-cell"></div>
      <div class="vital-cell"></div>
      <div class="vital-cell"></div>
      <div class="vital-cell"></div>
    </div>
  </div>`
      : ''

    // Gynae Couple Panels (Husband & Wife Side-by-Side in TWO COLUMNS)
    const gynaePanelsHtml = o.isGynae
      ? `
  <!-- Gynaecology Couple Panel (Female & Male Side-by-Side in Two Columns) -->
  <div class="gynae-two-col">
    <!-- Left Column: Female Panel (Wife / पत्नी) -->
    <div class="gynae-panel gynae-panel-female">
      <div class="gynae-header">
        <span>🔬 FEMALE INVESTIGATION PANEL (WIFE / पत्नी)</span>
        <span style="font-size:8px;font-weight:600;opacity:0.85">TORCH &amp; Hormonal</span>
      </div>
      <div class="gynae-grid-2col">
        <div class="lab-cell"><span class="lab-label">Toxoplasma IgG</span><div class="lab-box"></div></div>
        <div class="lab-cell"><span class="lab-label">Toxoplasma IgM</span><div class="lab-box"></div></div>
        <div class="lab-cell"><span class="lab-label">Rubella IgG</span><div class="lab-box"></div></div>
        <div class="lab-cell"><span class="lab-label">Rubella IgM</span><div class="lab-box"></div></div>
        <div class="lab-cell"><span class="lab-label">CMV IgG</span><div class="lab-box"></div></div>
        <div class="lab-cell"><span class="lab-label">CMV IgM</span><div class="lab-box"></div></div>
        <div class="lab-cell"><span class="lab-label">Herpes Simplex IgG-1</span><div class="lab-box"></div></div>
        <div class="lab-cell"><span class="lab-label">Herpes Simplex IgM-1</span><div class="lab-box"></div></div>
        <div class="lab-cell"><span class="lab-label">TORCH Panel</span><div class="lab-box"></div></div>
        <div class="lab-cell"><span class="lab-label">Mantoux (Montouex)</span><div class="lab-box"></div></div>
        <div class="lab-cell lab-cell-span2"><span class="lab-label">Serum TSH</span><div class="lab-box"></div></div>
      </div>
    </div>

    <!-- Right Column: Male Panel (Husband / पति) -->
    <div class="gynae-panel gynae-panel-male">
      <div class="gynae-header">
        <span>🔬 MALE INVESTIGATION PANEL (HUSBAND / पति)</span>
        <span style="font-size:8px;font-weight:600;opacity:0.85">Semen Analysis &amp; Hormonal</span>
      </div>
      <div class="gynae-male-list">
        <div class="lab-male-item"><span class="lab-label">Sperm Count</span><div class="lab-box"></div></div>
        <div class="lab-male-item"><span class="lab-label">Sperm Motility</span><div class="lab-box"></div></div>
        <div class="lab-male-item"><span class="lab-label">Sluggish Motility</span><div class="lab-box"></div></div>
        <div class="lab-male-item"><span class="lab-label">Serum FSH</span><div class="lab-box"></div></div>
        <div class="lab-male-item"><span class="lab-label">Testosterone</span><div class="lab-box"></div></div>
        <div class="lab-male-item"><span class="lab-label">Serum TSH</span><div class="lab-box"></div></div>
      </div>
    </div>
  </div>`
      : ''

    // Dynamic Notice Text
    const noticeInfo = o.isIPD
      ? config.notices?.ipd || {
          en: `Please present this slip at the department ${o.counterType} counter.`,
          hi: `कृपया इस पर्ची को संबंधित विभाग के ${o.hindiCounter} काउंटर पर प्रस्तुत करें।`,
        }
      : config.notices?.opd || {
          en: `Please present this slip at the department ${o.counterType} counter.`,
          hi: `कृपया इस पर्ची को संबंधित विभाग के ${o.hindiCounter} काउंटर पर प्रस्तुत करें।`,
        }

    const signatureLabel = config.notices?.signatureLabel || "Doctor's Signature / हस्ताक्षर"
    const stampLabel = config.notices?.stampLabel || 'HOSPITAL STAMP / मुहर'

    // Dynamic Footer Contacts (WhatsApp & Helplines)
    const footerContactsHtml = []
    if (config.contacts?.whatsapp?.show && config.contacts?.whatsapp?.number) {
      const waLabel = config.contacts.whatsapp.label || 'WhatsApp'
      const waNum = config.contacts.whatsapp.display || config.contacts.whatsapp.number
      footerContactsHtml.push(
        `<div class="contact"><span class="icon-circle wa-icon">${waSvg}</span> ${waLabel} <strong>${waNum}</strong></div>`
      )
    }

    if (Array.isArray(config.contacts?.helplines)) {
      config.contacts.helplines.forEach((h) => {
        if (h && h.show !== false && h.number) {
          const prefix = h.label ? `${h.label} ` : ''
          footerContactsHtml.push(
            `<div class="contact"><span class="icon-circle call-icon">${phoneSvg}</span> ${prefix}<strong>${h.number}</strong></div>`
          )
        }
      })
    }

    // Patient & Doctor normalized fields
    const patientName = b.patient_name || b.patientName || b.name || b.full_name || '—'
    const patientAge = b.age || b.ageYrs ? `${b.age || b.ageYrs} Yrs` : '—'
    const patientGender = b.gender || '—'
    const patientMobile = b.mobile || b.phone || b.mobile1 || '—'
    const doctorName = b.doctor_name || b.doctor || b.doctorId?.name || config.clinical?.defaultDoctorName || 'General Doctor'
    const doctorQual = b.doctor_qualification || b.doctorDegree || b.doctorId?.qualification || b.doctorId?.degree || ''
    const visitTypeDesc = o.isIPD ? 'Hospitalization (IPD Admission)' : 'OPD Appointment'
    const dateLabel = o.isIPD ? 'Admission Date:' : 'Appt Date:'
    const uhid = b.uhid || b.patient_uhid || b.patientUhid || config.clinical?.defaultUhid || 'KGN-PENDING'
    const bookingStatus = b.status || b.paymentStatus || 'Confirmed'

    // Ruled prescription lines
    const lineCount = config.clinical?.prescriptionLines || 4
    const ruledLinesHtml = Array.from({ length: lineCount })
      .map(() => '<div class="ruled-line"></div>')
      .join('\n      ')

    return `<div class="slip">
  <!-- Header -->
  <div class="header">
    <div class="brand">
      ${logoImg}
      <div>
        <div class="hospital-name">${hospitalName}</div>
        ${hospitalTagline}
        <div class="doc-title">${o.docTitle}</div>
      </div>
    </div>
    <div class="gen-time">Generated: ${o.generatedTime}</div>
  </div>

  <!-- Stats Bar -->
  <div class="stats-bar">
    <div><div class="stat-label">UHID:</div><div class="stat-value">${uhid}</div></div>
    <div><div class="stat-label">TOKEN:</div><div class="stat-value">${o.tokenDisplay}</div></div>
    <div><div class="stat-label">DOCTOR FEE To Be Paid:</div><div class="stat-value">${o.feeDisplay}</div></div>
    <div><div class="stat-label">SOURCE:</div><div class="stat-value">${o.source}</div></div>
  </div>

  <!-- Two Column Details: Patient Details & Visit Details -->
  <div class="two-col">
    <div class="detail-box">
      <div class="box-header">PATIENT DETAILS<span class="highlight">${o.patientStatusLabel}</span></div>
      <div class="field-row"><span class="field-name">Name:</span><span class="field-val">${patientName}</span></div>
      <div class="field-row"><span class="field-name">Age/Gender:</span><span class="field-val">${patientAge} / ${patientGender}</span></div>
      <div class="field-row"><span class="field-name">Mobile:</span><span class="field-val">${patientMobile ? (String(patientMobile).startsWith('+') ? patientMobile : `+91 ${patientMobile}`) : '—'}</span></div>
      <div class="field-row"><span class="field-name">Address:</span><span class="field-val">${o.address || '—'}</span></div>
    </div>
    <div class="detail-box">
      <div class="box-header">VISIT &amp; CLINICAL DETAILS</div>
      <div class="field-row"><span class="field-name">Visit Type:</span><span class="field-val">${visitTypeDesc}</span></div>
      <div class="field-row"><span class="field-name">${dateLabel}</span><span class="field-val">${o.appointmentDate}</span></div>
      <div class="field-row"><span class="field-name">Doctor:</span><span class="field-val">${doctorName}${doctorQual ? ' — ' + doctorQual : ''}</span></div>
      <div class="field-row"><span class="field-name">Booking Status:</span><span class="field-val" style="font-weight:700;text-transform:capitalize">${bookingStatus}</span></div>
    </div>
  </div>

  <!-- Vitals & Investigations Section -->
  ${generalVitalsHtml}
  ${gynaePanelsHtml}

  <!-- Doctor's Prescription & Clinical Notes (Balanced ruled area) -->
  <div class="rx-box">
    <div class="rx-title">℞ DOCTOR'S CLINICAL NOTES &amp; PRESCRIPTION</div>
    <div class="rx-lines">
      ${ruledLinesHtml}
    </div>
  </div>

  <!-- Signature & Counter Info -->
  <div class="sig-area">
    <div>
      <div class="sig-title">${signatureLabel}</div>
      <div class="notice">${noticeInfo.en}<br/>${noticeInfo.hi}</div>
    </div>
    <div class="stamp">${stampLabel}</div>
  </div>

  <!-- Footer -->
  <div class="footer-bar">
    ${footerContactsHtml.join('\n    ')}
  </div>
</div>`
  }

  /** Open a fresh window, write the slip HTML, and trigger print. */
  static _openPrintWindow(booking, customConfig = {}) {
    const html = this._buildSlipHTML(booking, customConfig)

    const printWin = window.open('', '_blank', 'width=900,height=700,scrollbars=yes')
    if (!printWin) {
      alert('Please allow pop-ups to print the patient slip.')
      return
    }

    printWin.document.open()
    printWin.document.write(html)
    printWin.document.close()

    // Wait for the content to render fully, then trigger print
    printWin.onload = () => {
      setTimeout(() => {
        printWin.focus()
        printWin.print()
      }, 250)
    }

    // Fallback if onload doesn't fire (some browsers)
    setTimeout(() => {
      if (!printWin.closed) {
        printWin.focus()
        printWin.print()
      }
    }, 800)
  }
}

export default PrintSlipHandler
