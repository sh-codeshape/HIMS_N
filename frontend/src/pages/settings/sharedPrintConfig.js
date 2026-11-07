/**
 * sharedPrintConfig.js
 *
 * Central Master Configuration & Layout Engine for:
 * 1. Shared Hospital Header (Branding, Logo, Name, Address, Accreditations, Barcodes)
 * 2. Shared Document Footer (Policies, Rules, Helplines, Signatures, Official Stamp)
 * 3. Shared Patient Demographics (Standardized demographic fields with select/remove per slip)
 * 4. Per-Slip Data Visibility (Active/Inactive toggle per slip type)
 * 5. 100% Independent Moveable Element Positioning (Free placement X/Y with zero sibling sync)
 *
 * Persisted in DB under key: print_slip_shared_master
 */
import settingsService from "../../api/services/settingsService.js";

export const SHARED_PRINT_SETTINGS_KEY = "print_slip_shared_master";

export const FONT_FAMILIES = [
  { label: "Inter (Modern Clean)", value: "Inter, system-ui, sans-serif" },
  { label: "Roboto (Google Crisp)", value: "Roboto, system-ui, sans-serif" },
  { label: "Arial / Helvetica (Standard)", value: "Arial, Helvetica, sans-serif" },
  { label: "Poppins (Geometric & Bold)", value: "'Poppins', sans-serif" },
  { label: "Merriweather (Classic Serif)", value: "'Merriweather', Georgia, serif" },
  { label: "Times New Roman (Formal)", value: "'Times New Roman', serif" },
  { label: "Courier / Monospace (Code/Data)", value: "'Courier New', Courier, monospace" },
];

/**
 * All supported Slip Types in the hospital
 */
export const SLIP_TYPES = [
  {
    id: "all",
    label: "🌐 Global Master (All Slips)",
    badge: "Master Default",
    desc: "Global defaults applied across all hospital encounter slips",
    defaultTitle: "HOSPITAL ENCOUNTER & CLINICAL SLIP",
    defaultCopy: "ORIGINAL FOR PATIENT",
  },
  {
    id: "opd",
    label: "📋 OPD Consultation Slip",
    badge: "Outpatient",
    desc: "Outpatient registration, token & clinical consultation slip",
    defaultTitle: "OPD CONSULTATION SLIP",
    defaultCopy: "PATIENT COPY",
  },
  {
    id: "ipd_admission",
    label: "🩺 IPD Admission Ticket",
    badge: "Inpatient",
    desc: "Inpatient admission registration, room/bed assignment ticket",
    defaultTitle: "IPD ADMISSION TICKET",
    defaultCopy: "ORIGINAL FOR PATIENT",
  },
  {
    id: "ipd_billing",
    label: "💳 IPD Billing Slip / Invoice",
    badge: "Accounts",
    desc: "Interim billing receipt, final inpatient tax invoice",
    defaultTitle: "INPATIENT FINAL TAX INVOICE",
    defaultCopy: "ORIGINAL RECIPIENT",
  },
  {
    id: "ipd_discharge",
    label: "📄 IPD Discharge Summary",
    badge: "Clinical Summary",
    desc: "Patient discharge summary, clinical instructions & medications",
    defaultTitle: "IPD DISCHARGE SUMMARY",
    defaultCopy: "CONFIDENTIAL MEDICAL RECORD",
  },
  {
    id: "ipd_receipt",
    label: "🧾 Payment Receipt Slip (Half Page)",
    badge: "Payment Receipt",
    desc: "Inpatient cash counter receipt, advance deposit & voucher slip (Compact Half Page)",
    defaultTitle: "OFFICIAL PAYMENT RECEIPT & CASH VOUCHER",
    defaultCopy: "ORIGINAL FOR PATIENT",
  },
];

export const DEFAULT_SHARED_CONFIG = {
  // ── 1. Hospital Brand & Letterhead ──
  hospital: {
    name: "Narayan Hospital",
    subtitle: "NABH & NABL ACCREDITED TERTIARY CARE HOSPITAL & RESEARCH INSTITUTE",
    slogan: "Better Care. Healthier Tomorrow.",
    registrationNo: "REG/UP/2024/098",
    address: "Sector 4, Central Hospital Road, Jaipur - 302020 (Rajasthan)",
    phone: "+91 7388660408",
    emergencyPhone: "+91 9811223344",
    email: "info@narayanhospital.com",
    website: "www.narayanhospital.com",
    logoUrl: "/images/Narayan_Logo.png",
    logoHeight: 48,
    logoWidth: 150,
    showLogo: true,
    showHeaderAddress: false,
    accreditations: ["NABH ACCREDITED", "ISO 9001:2015", "NABL CERTIFIED LABS"],
    showAccreditationBadges: true,
  },

  // ── 2. Document Title & Barcode Banner Defaults ──
  header: {
    title: "HOSPITAL ENCOUNTER & CLINICAL SLIP",
    subTitle: "Official Computer Generated Document",
    copyType: "ORIGINAL FOR PATIENT",
    showCopyBadge: true,
    showBarcode: true,
    showTopUHID: true,
    showTopAdmissionNo: true,
  },

  // ── 3. Shared Inpatient / Outpatient Footer & Policies ──
  footer: {
    termsTitle: "HOSPITAL INSTRUCTIONS & POLICIES",
    termsItems: [
      "Please preserve this slip for consultation, investigation reports, and billing reconciliation.",
      "Visiting hours are strictly 04:00 PM to 06:00 PM. Attendant pass is mandatory for entry.",
      "Hospital management is not responsible for personal cash, jewellery, or valuables.",
      "All consultations, medications, and clinical investigations are billed per approved hospital schedule.",
    ],
    helpline: "24x7 Helpline: +91 7388660408 • Emergency Trauma: +91 9811223344",
    tagline: "NARAYAN HOSPITAL • Sector 4, Hospital Road, Jaipur - 302020 • www.narayanhospital.com",
    disclaimer: "Thank you for choosing Narayan Hospital. Wishing you a healthy and speedy recovery.",
    signatures: {
      doctor: { show: true, title: "Treating Consultant", sub: "Admitting / Attending Doctor" },
      nurse: { show: true, title: "Duty Nursing Officer", sub: "Ward / Counter Incharge" },
      attendant: { show: true, title: "Patient / Attendant Signature", sub: "Consent & Acknowledgment" },
      cashier: { show: true, title: "Accounts / Billing Officer", sub: "Authorized Signatory" },
      stamp: { show: true, title: "OFFICIAL HOSPITAL STAMP" },
    },
  },

  // ── 4. Shared Patient Demographics Catalog ──
  patientDemographics: {
    title: "PATIENT DEMOGRAPHICS",
    fields: {
      name: { key: "name", label: "Patient Full Name", show: true, span: 1 },
      uhid: { key: "uhid", label: "UHID No.", show: true, span: 1 },
      ageGender: { key: "ageGender", label: "Age / Gender", show: true, span: 1 },
      mobile: { key: "mobile", label: "Contact Phone", show: true, span: 1 },
      bloodGroup: { key: "bloodGroup", label: "Blood Group", show: true, span: 1 },
      guardian: { key: "guardian", label: "Guardian / Attendant", show: true, span: 1 },
      relation: { key: "relation", label: "Relationship", show: true, span: 1 },
      address: { key: "address", label: "Full Residential Address", show: true, span: 3 },
      payer: { key: "payer", label: "Payer / Billing Category", show: true, span: 1 },
      policyNo: { key: "policyNo", label: "Policy / TPA Card No.", show: false, span: 1 },
      mlcCase: { key: "mlcCase", label: "MLC / Police Case", show: false, span: 1 },
      admissionDate: { key: "admissionDate", label: "Encounter / Admission Date", show: true, span: 1 },
      doctor: { key: "doctor", label: "Treating Doctor", show: true, span: 1 },
      department: { key: "department", label: "Department / Specialty", show: true, span: 1 },
    },
  },

  // ── 5. Per-Slip Active/Inactive Data & Titles ──
  slipConfigs: {
    all: {
      title: "HOSPITAL ENCOUNTER & CLINICAL SLIP",
      copyBadge: "ORIGINAL FOR PATIENT",
      inactiveElements: ["header.address"],
    },
    opd: {
      title: "OPD CONSULTATION SLIP",
      copyBadge: "PATIENT COPY",
      inactiveElements: [
        "header.address",
        "ticket.topAdmissionNo",
        "signatures.nurse",
        "signatures.cashier",
        "patient.payer",
      ],
    },
    ipd_admission: {
      title: "IPD ADMISSION TICKET",
      copyBadge: "ORIGINAL FOR PATIENT",
      inactiveElements: [
        "header.address",
        "signatures.cashier",
      ],
    },
    ipd_billing: {
      title: "INPATIENT FINAL TAX INVOICE",
      copyBadge: "ORIGINAL RECIPIENT",
      inactiveElements: [
        "header.address",
        "signatures.nurse",
        "terms.card",
      ],
    },
    ipd_discharge: {
      title: "IPD DISCHARGE SUMMARY",
      copyBadge: "CONFIDENTIAL MEDICAL RECORD",
      inactiveElements: [
        "header.address",
        "signatures.cashier",
        "signatures.attendant",
      ],
    },
    ipd_receipt: {
      title: "OFFICIAL PAYMENT RECEIPT & CASH VOUCHER",
      copyBadge: "ORIGINAL FOR PATIENT",
      inactiveElements: [
        "header.address",
        "signatures.nurse",
        "signatures.doctor",
        "patient.doctor",
        "patient.guardian",
      ],
    },
  },

  // ── 6. Page Geometry Defaults ──
  page: {
    size: "A4",
    orientation: "portrait",
    margin: 6,
    fontFamily: "Inter, system-ui, sans-serif",
  },

  // ── 7. Independent Element Positioning & Typography Overrides (NO SYNC) ──
  fieldStyles: {
    "header.address": { show: false },
  },
};

/**
 * All individual Header, Demographics & Footer targets available for
 * independent positioning (X/Y) & customization.
 */
export const SHARED_ELEMENT_TARGETS = [
  // ── Header Letterhead Elements ──
  {
    key: "header.card",
    section: "Hospital Header",
    name: "🏥 Hospital Letterhead Box Container",
    desc: "Outer box, borders and background for the entire hospital brand header",
    defaultTag: "div",
  },
  {
    key: "header.hospitalName",
    section: "Hospital Header",
    name: "🏥 Hospital Name / Heading",
    desc: "Primary hospital legal brand name",
    defaultTag: "h1",
  },
  {
    key: "header.logo",
    section: "Hospital Header",
    name: "🖼️ Hospital Brand Logo",
    desc: "Hospital emblem / graphic logo",
    defaultTag: "img",
  },
  {
    key: "header.subtitle",
    section: "Hospital Header",
    name: "📋 Subtitle / Facility Category",
    desc: "Super speciality or accreditation subtitle",
    defaultTag: "p",
  },
  {
    key: "header.slogan",
    section: "Hospital Header",
    name: "💬 Tagline / Slogan",
    desc: "Inspirational hospital slogan",
    defaultTag: "p",
  },
  {
    key: "header.regNo",
    section: "Hospital Header",
    name: "🏷️ Registration Number Tag",
    desc: "Govt / State clinical registration number",
    defaultTag: "span",
  },
  {
    key: "header.emergencyPhone",
    section: "Hospital Header",
    name: "🚨 24x7 Emergency Phone Badge",
    desc: "Emergency trauma helpline number",
    defaultTag: "span",
  },
  {
    key: "header.address",
    section: "Hospital Header",
    name: "📍 Header Address (Hidden • Moved to Footer)",
    desc: "Hospital physical address moved to footer for a compact hospital letterhead",
    defaultTag: "p",
  },
  {
    key: "header.phoneEmail",
    section: "Hospital Header",
    name: "📞 Phone, Email & Website",
    desc: "Contact numbers and email address",
    defaultTag: "p",
  },
  {
    key: "header.accreditations",
    section: "Hospital Header",
    name: "🎖️ Accreditation Badges (NABH/ISO)",
    desc: "NABH, ISO, NABL certification pills",
    defaultTag: "div",
  },

  // ── Document Title & Barcode Banner ──
  {
    key: "ticket.card",
    section: "Document Banner",
    name: "🎫 Document Title & Barcode Banner Section",
    desc: "Outer blue banner container and border for document title, copy badge, UHID/IPD tags & barcode",
    defaultTag: "div",
  },
  {
    key: "ticket.title",
    section: "Document Banner",
    name: "📄 Slip / Document Main Title",
    desc: "Title of the document (OPD Slip / Admission Ticket / Tax Invoice)",
    defaultTag: "h2",
  },
  {
    key: "ticket.copyBadge",
    section: "Document Banner",
    name: "📑 Copy Type Badge",
    desc: "ORIGINAL / DUPLICATE / PATIENT RECORD pill",
    defaultTag: "span",
  },
  {
    key: "ticket.barcode",
    section: "Document Banner",
    name: "📊 Barcode & QR Code",
    desc: "Machine-readable UHID/Encounter barcode",
    defaultTag: "div",
  },
  {
    key: "ticket.topUhid",
    section: "Document Banner",
    name: "👤 Top Patient UHID Tag",
    desc: "Prominent top UHID identifier tag",
    defaultTag: "div",
  },
  {
    key: "ticket.topAdmissionNo",
    section: "Document Banner",
    name: "🔢 Top Encounter / IPD No Tag",
    desc: "Prominent top IPD / Token number tag",
    defaultTag: "div",
  },

  // ── Patient Demographics Card ──
  {
    key: "patient.card",
    section: "Patient Demographics",
    name: "📁 Demographics Card Container",
    desc: "Outer box containing patient info",
    defaultTag: "div",
  },
  {
    key: "patient.name",
    section: "Patient Demographics",
    name: "👤 Patient Full Name",
    desc: "Patient title and full name",
    defaultTag: "div",
  },
  {
    key: "patient.uhid",
    section: "Patient Demographics",
    name: "🆔 UHID No. Field",
    desc: "Unique Health Identifier",
    defaultTag: "div",
  },
  {
    key: "patient.ageGender",
    section: "Patient Demographics",
    name: "🎂 Age & Gender",
    desc: "Patient age and gender",
    defaultTag: "div",
  },
  {
    key: "patient.mobile",
    section: "Patient Demographics",
    name: "📱 Contact Mobile Phone",
    desc: "Primary patient / attendant contact number",
    defaultTag: "div",
  },
  {
    key: "patient.bloodGroup",
    section: "Patient Demographics",
    name: "🩸 Blood Group Badge",
    desc: "ABO/Rh blood group badge",
    defaultTag: "div",
  },
  {
    key: "patient.guardian",
    section: "Patient Demographics",
    name: "👨‍👩‍👧 Guardian / Attendant Name",
    desc: "Next of kin name and relation",
    defaultTag: "div",
  },
  {
    key: "patient.address",
    section: "Patient Demographics",
    name: "🏡 Residential Address",
    desc: "Full home address line",
    defaultTag: "div",
  },
  {
    key: "patient.payer",
    section: "Patient Demographics",
    name: "💳 Payer / Category",
    desc: "Insurance, TPA, or Private cash category",
    defaultTag: "div",
  },
  {
    key: "patient.doctor",
    section: "Patient Demographics",
    name: "🩺 Consultant Doctor",
    desc: "Treating physician / surgeon name",
    defaultTag: "div",
  },
  {
    key: "patient.department",
    section: "Patient Demographics",
    name: "🏥 Department / Specialty",
    desc: "Clinical department name",
    defaultTag: "div",
  },

  // ── Middle Clinical / Charges Table Body Container ──
  {
    key: "body.card",
    section: "Clinical / Ledger Body",
    name: "📄 Middle Clinical / Table Box",
    desc: "Outer container box for middle clinical details or particulars table",
    defaultTag: "div",
  },

  // ── Footer Elements ──
  {
    key: "terms.card",
    section: "Footer Policies",
    name: "📜 Terms & Policies Box",
    desc: "Hospital rules & instructions box",
    defaultTag: "div",
  },
  {
    key: "terms.title",
    section: "Footer Policies",
    name: "📌 Policies Header Title",
    desc: "Title of the policies box",
    defaultTag: "h3",
  },
  {
    key: "terms.list",
    section: "Footer Policies",
    name: "📝 Policies Bullet List",
    desc: "List of terms and conditions",
    defaultTag: "ol",
  },
  {
    key: "terms.helpline",
    section: "Footer Policies",
    name: "📞 Footer Contact & Helpline Number",
    desc: "Hospital phone & 24x7 emergency helpline line at bottom of slip",
    defaultTag: "div",
  },
  {
    key: "terms.address",
    section: "Footer Policies",
    name: "📍 Footer Hospital Physical Address",
    desc: "Hospital physical address and location details at bottom of slip",
    defaultTag: "div",
  },
  {
    key: "terms.footerTagline",
    section: "Footer Policies",
    name: "💬 Footer Hospital Tagline",
    desc: "Hospital slogan and website link at bottom of slip",
    defaultTag: "div",
  },
  {
    key: "terms.disclaimer",
    section: "Footer Policies",
    name: "💖 Recovery Wishes / Disclaimer",
    desc: "Warm closing message for patient",
    defaultTag: "div",
  },
  {
    key: "signatures.card",
    section: "Footer Signatures",
    name: "✍️ Signatures & Stamp Row",
    desc: "Full container for signatures and stamp",
    defaultTag: "div",
  },
  {
    key: "signatures.doctor",
    section: "Footer Signatures",
    name: "🩺 Treating Consultant Signature",
    desc: "Doctor signature line & designation",
    defaultTag: "div",
  },
  {
    key: "signatures.nurse",
    section: "Footer Signatures",
    name: "👩‍⚕️ Nursing Officer Signature",
    desc: "Duty nurse signature line & designation",
    defaultTag: "div",
  },
  {
    key: "signatures.attendant",
    section: "Footer Signatures",
    name: "🤝 Patient / Attendant Signature",
    desc: "Attendant consent signature line",
    defaultTag: "div",
  },
  {
    key: "signatures.cashier",
    section: "Footer Signatures",
    name: "💳 Cashier / Billing Signatory",
    desc: "Accounts / Billing officer signature line",
    defaultTag: "div",
  },
  {
    key: "signatures.stamp",
    section: "Footer Signatures",
    name: "⭕ Official Hospital Stamp Box",
    desc: "Official seal / hospital stamp box",
    defaultTag: "div",
  },
];

/**
 * Realistic preview data for each specific slip
 */
export const SLIP_SAMPLE_DATA = {
  all: {
    patientName: "Ramesh Chandra Sharma",
    uhid: "UHID-2026-004481",
    ipdNo: "IPD-26-0198",
    encounterNo: "OPD-26-0044",
    tokenNo: "T-311026-GEN-03",
    ageGender: "48 Yrs / Male",
    mobile: "+91 98765 43210",
    address: "Plot 42, Gayatri Nagar, Hospital Road, Jaipur, Rajasthan - 302020",
    bloodGroup: "B Positive (B+)",
    guardian: "Sunita Sharma",
    relation: "Wife / Next of Kin",
    payer: "Self / Private Inpatient",
    policyNo: "N/A",
    mlcCase: "No (Non-Accidental)",
    admissionDate: "04 Nov 2026, 11:30 AM",
    doctor: "Dr. Adeesh Singh (MD, FICP)",
    department: "General Medicine & Critical Care",
  },
  opd: {
    patientName: "Adeesh Kumar Singh",
    uhid: "UHID-2026-001290",
    encounterNo: "OPD-26-0044",
    tokenNo: "T-311026-GEN-03",
    ageGender: "34 Yrs / Male",
    mobile: "+91 72879 01826",
    address: "Jansa, Varanasi, Uttar Pradesh - 221405",
    bloodGroup: "B+",
    guardian: "Rajendra Singh",
    relation: "Father",
    payer: "Cash / Self",
    admissionDate: "06 Nov 2026, 10:15 AM",
    doctor: "Dr. Adeesh Singh",
    department: "General Medicine",
  },
  ipd_admission: {
    patientName: "Ramesh Chandra Sharma",
    uhid: "UHID-2026-004481",
    ipdNo: "IPD-26-0198",
    encounterNo: "IPD-26-0198",
    tokenNo: "ADMIT-0198",
    ageGender: "48 Yrs / Male",
    mobile: "+91 98765 43210",
    address: "Plot 42, Gayatri Nagar, Hospital Road, Jaipur - 302020",
    bloodGroup: "B+",
    guardian: "Sunita Sharma",
    relation: "Wife",
    payer: "Star Health Insurance (TPA)",
    policyNo: "POL-SH-992182",
    admissionDate: "04 Nov 2026, 11:30 AM",
    doctor: "Dr. Adeesh Singh (MD, FICP)",
    department: "General Medicine & Critical Care",
  },
  ipd_billing: {
    patientName: "Ramesh Chandra Sharma",
    uhid: "UHID-2026-004481",
    ipdNo: "IPD-26-0198",
    encounterNo: "BILL-2026-8812",
    tokenNo: "INV-8812",
    ageGender: "48 Yrs / Male",
    mobile: "+91 98765 43210",
    address: "Plot 42, Gayatri Nagar, Hospital Road, Jaipur - 302020",
    bloodGroup: "B+",
    guardian: "Sunita Sharma",
    relation: "Wife",
    payer: "Star Health Insurance (TPA)",
    admissionDate: "04 Nov 2026, 11:30 AM",
    doctor: "Dr. Adeesh Singh (MD, FICP)",
    department: "General Medicine & Critical Care",
  },
  ipd_discharge: {
    patientName: "Ramesh Chandra Sharma",
    uhid: "UHID-2026-004481",
    ipdNo: "IPD-26-0198",
    encounterNo: "DISCH-2026-0198",
    tokenNo: "DIS-0198",
    ageGender: "48 Yrs / Male",
    mobile: "+91 98765 43210",
    address: "Plot 42, Gayatri Nagar, Hospital Road, Jaipur - 302020",
    bloodGroup: "B+",
    guardian: "Sunita Sharma",
    relation: "Wife",
    payer: "Star Health Insurance (TPA)",
    admissionDate: "04 Nov 2026",
    doctor: "Dr. Adeesh Singh (MD, FICP)",
    department: "General Medicine & Critical Care",
  },
  ipd_receipt: {
    patientName: "Ramesh Chandra Sharma",
    uhid: "UHID-2026-004481",
    ipdNo: "IPD-26-0198",
    encounterNo: "REC-26-0068",
    tokenNo: "REC-26-0068",
    ageGender: "48 Yrs / Male",
    mobile: "+91 98765 43210",
    address: "Plot 42, Gayatri Nagar, Hospital Road, Jaipur - 302020",
    bloodGroup: "B+",
    guardian: "Sunita Sharma",
    relation: "Wife",
    payer: "Cash Counter",
    admissionDate: "04 Nov 2026",
    doctor: "Dr. Adeesh Singh (MD, FICP)",
    department: "General Medicine & Critical Care",
    receiptNo: "REC-26-0068",
    receiptDate: "06 Nov 2026, 04:44 PM",
    receiptCategory: "Running Bill Interim Payment",
    paymentMode: "Cash Counter",
    receivedAmount: 5141,
    amountInWords: "Rupees Five Thousand One Hundred Forty One Only",
    notes: "Running Bill Interim Payment received for Test 1",
    totalCharges: 3000,
    totalPaid: 5141,
    remainingBalance: 0,
    excessAdvance: 2141,
  },
};

export const SAMPLE_SHARED_DATA = SLIP_SAMPLE_DATA.all;

/**
 * Deep merge utility for settings objects.
 */
export function mergeSharedSettings(target, source) {
  if (!source || typeof source !== "object") return target;
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val !== undefined && val !== null) {
      if (
        typeof val === "object" &&
        !Array.isArray(val) &&
        typeof target[key] === "object" &&
        !Array.isArray(target[key])
      ) {
        result[key] = mergeSharedSettings(target[key], val);
      } else {
        result[key] = val;
      }
    }
  }

  return result;
}

/**
 * Check if a specific data element is Active on a given slip type
 */
export function isElementActiveOnSlip(key, slipType = "all", settings = DEFAULT_SHARED_CONFIG) {
  const fs = settings.fieldStyles?.[key];
  if (fs?.show === false) return false;

  // If viewing global master, master fieldStyles dictate visibility
  if (!slipType || slipType === "all") {
    return fs?.show !== false;
  }

  // Check slip-specific inactive elements
  const slipCfg = settings.slipConfigs?.[slipType];
  const inactives = slipCfg?.inactiveElements;
  if (Array.isArray(inactives) && inactives.includes(key)) {
    return false;
  }

  return true;
}

/**
 * Helper to toggle an element between Active and Inactive for a specific slip
 */
export function toggleSlipElementActive(settings, slipType, elementKey, active) {
  const next = JSON.parse(JSON.stringify(settings));
  if (!next.slipConfigs) next.slipConfigs = {};

  if (!slipType || slipType === "all") {
    // Modify global master fieldStyles
    if (!next.fieldStyles) next.fieldStyles = {};
    if (!next.fieldStyles[elementKey]) next.fieldStyles[elementKey] = {};
    next.fieldStyles[elementKey].show = active;
    return next;
  }

  if (!next.slipConfigs[slipType]) {
    next.slipConfigs[slipType] = {
      title: "",
      copyBadge: "",
      inactiveElements: [],
    };
  }
  const currentInactives = Array.isArray(next.slipConfigs[slipType].inactiveElements)
    ? [...next.slipConfigs[slipType].inactiveElements]
    : [];

  if (active) {
    // Remove from inactive list
    next.slipConfigs[slipType].inactiveElements = currentInactives.filter((k) => k !== elementKey);
  } else {
    // Add to inactive list if not already present
    if (!currentInactives.includes(elementKey)) {
      next.slipConfigs[slipType].inactiveElements = [...currentInactives, elementKey];
    }
  }

  return next;
}

/**
 * Generate rock-solid CSS inline style for an element based on its fieldStyles override.
 * Uses position: relative !important; left: Xpx; top: Ypx; and display: inline-block !important;
 * so any element (block, inline, flex-item) is physically shifted without sibling layout sync conflicts!
 */
export function getElementComputedStyle(key, fieldStyles = {}, extraCss = "", isInactive = false) {
  if (isInactive) {
    return "display: none !important;";
  }
  const f = fieldStyles[key] || {};
  if (f.show === false) {
    return "display: none !important;";
  }

  const offsetX = Number(f.offsetX) || 0;
  const offsetY = Number(f.offsetY) || 0;

  // Rock-solid positioning using relative coordinates + left + top
  const hasAlign = Boolean(f.textAlign);
  const isBlock = key.endsWith(".card") || key === "ticket.card" || key === "patient.address" || key === "terms.list" || key === "header.accreditations" || hasAlign;
  const displayCss = isBlock ? "display: block !important;" : "display: inline-block !important;";

  const positionStyle =
    offsetX !== 0 || offsetY !== 0
      ? `position: relative !important; left: ${offsetX}px !important; top: ${offsetY}px !important; ${displayCss} z-index: 15;`
      : isBlock ? "position: relative !important; display: block !important;" : "position: relative !important;";

  const fontSz = f.fontSize ? `font-size: ${f.fontSize}px !important;` : "";
  const fontWt = f.fontWeight ? `font-weight: ${f.fontWeight} !important;` : "";
  const textClr = f.textColor ? `color: ${f.textColor} !important;` : "";
  const textAln = f.textAlign ? `text-align: ${f.textAlign} !important;` : "";
  const textTrans = f.textTransform ? `text-transform: ${f.textTransform} !important;` : "";
  const bgClr = f.bgColor ? `background: ${f.bgColor} !important; background-color: ${f.bgColor} !important; background-image: none !important;` : "";
  const brdClr = f.borderColor ? `border-color: ${f.borderColor} !important;` : "";
  const brdNone = f.showBorder === false || f.border === "none" ? "border: none !important; box-shadow: none !important;" : "";
  const letterSp = f.letterSpacing !== undefined && f.letterSpacing !== "" ? `letter-spacing: ${String(f.letterSpacing).replace(/px$/, "")}px !important;` : "";

  // Height and Width overrides
  const heightStyle = f.height ? `height: ${f.height}${typeof f.height === "number" ? "px" : ""} !important; max-height: ${f.height}${typeof f.height === "number" ? "px" : ""} !important;` : "";
  const minHeightStyle = f.minHeight ? `min-height: ${f.minHeight}${typeof f.minHeight === "number" ? "px" : ""} !important;` : "";
  const widthStyle = f.width ? `width: ${f.width}${typeof f.width === "number" ? "px" : (f.width.endsWith("%") || f.width.endsWith("px") || f.width.endsWith("mm") ? "" : "px")} !important;` : "";

  // Dynamic Border & Corner Radius Controls
  let borderCombined = "";
  if (f.showBorder === false || f.border === "none" || f.borderWidth === 0 || f.borderWidth === "0px" || f.borderStyle === "none") {
    borderCombined = "border: none !important; box-shadow: none !important;";
  } else if (f.borderWidth !== undefined || f.borderStyle || f.borderColor) {
    const bw = f.borderWidth !== undefined ? (typeof f.borderWidth === "number" ? `${f.borderWidth}px` : f.borderWidth) : "1px";
    const bs = f.borderStyle || "solid";
    const bc = f.borderColor || "#cbd5e1";
    borderCombined = `border: ${bw} ${bs} ${bc} !important;`;
  } else if (brdClr || brdNone) {
    borderCombined = `${brdClr} ${brdNone}`;
  }

  const radiusStyle = f.borderRadius !== undefined && f.borderRadius !== ""
    ? `border-radius: ${typeof f.borderRadius === "number" ? `${f.borderRadius}px` : f.borderRadius} !important;`
    : "";

  const marginBtmStyle = f.marginBottom !== undefined && f.marginBottom !== ""
    ? `margin-bottom: ${typeof f.marginBottom === "number" ? `${f.marginBottom}px` : f.marginBottom} !important;`
    : "";

  // Scale and Zoom overrides
  const scaleNum = Number(f.scale);
  const isRight = f.textAlign === "right" || key.includes("right") || key === "ticket.barcode" || key === "ticket.topAdmissionNo" || key === "ticket.topUhid";
  const isCenter = f.textAlign === "center";
  const origin = isRight ? "right center" : isCenter ? "center center" : "left center";
  const scaleStyle = scaleNum && scaleNum !== 100 ? `transform: scale(${scaleNum / 100}) !important; transform-origin: ${origin} !important;` : "";
  const padStyle = f.padding !== undefined && f.padding !== "" ? `padding: ${f.padding}${typeof f.padding === "number" ? "px" : ""} !important;` : "";

  return `
    ${positionStyle}
    ${fontSz}
    ${fontWt}
    ${textClr}
    ${textAln}
    ${textTrans}
    ${bgClr}
    ${borderCombined}
    ${radiusStyle}
    ${letterSp}
    ${heightStyle}
    ${minHeightStyle}
    ${widthStyle}
    ${scaleStyle}
    ${padStyle}
    ${marginBtmStyle}
    ${extraCss}
  `
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate click attributes for the live preview iframe.
 */
export function getClickableAttr(key, isPreview = false) {
  if (!isPreview) return "";
  return `data-target-key="${key}" onclick="event.stopPropagation(); window.parent.postMessage({ type: 'SELECT_TARGET', key: '${key}' }, '*')"`;
}

/**
 * Generate vector barcode SVG
 */
export function generateBarcodeSvg(value, customHeight = 24, customWidth = 110) {
  const clean = String(value || "HOSP-000000").replace(/[^a-zA-Z0-9-]/g, "");
  const h = Number(customHeight) || 24;
  const w = Number(customWidth) || 110;
  let bars = "";
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const w1 = (code % 3) + 1.2;
    const w2 = (code % 2) + 1;
    bars += `<rect x="${i * 7}" y="0" width="${w1}" height="${h + 4}" fill="#0f172a"/>`;
    bars += `<rect x="${i * 7 + w1 + 1}" y="0" width="${w2}" height="${h + 4}" fill="#0f172a"/>`;
  }
  return `
    <svg viewBox="0 0 ${clean.length * 7 + 10} ${h + 4}" class="barcode-svg" preserveAspectRatio="none" style="height: ${h}px; width: ${w}px;">
      ${bars}
    </svg>
  `;
}

let _inMemorySharedSettings = null;

/**
 * Get locally cached shared settings for instantaneous cross-tab synchronization.
 */
export function getCachedSharedSettings() {
  if (_inMemorySharedSettings) return _inMemorySharedSettings;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage?.getItem("hims_shared_print_settings") : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      _inMemorySharedSettings = parsed;
      return parsed;
    }
  } catch (_) {}
  return null;
}

/**
 * Update locally cached shared settings for instantaneous cross-tab synchronization.
 */
export function setCachedSharedSettings(settings) {
  if (!settings) return;
  _inMemorySharedSettings = settings;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("hims_shared_print_settings", JSON.stringify(settings));
    }
  } catch (_) {}
}

/**
 * Load shared settings from DB with fallback and local cache.
 */
export async function loadSharedPrintSettings() {
  try {
    const data = await settingsService.getSetting(SHARED_PRINT_SETTINGS_KEY);
    if (data && typeof data === "object" && Object.keys(data).length > 0) {
      const mergedFromDb = mergeSharedSettings(DEFAULT_SHARED_CONFIG, data);
      // PostgreSQL is the single source of truth: refresh local cache with fresh DB data
      setCachedSharedSettings(mergedFromDb);
      return mergedFromDb;
    }
  } catch (err) {
    console.warn("Could not load shared print settings from DB, falling back to cache:", err);
  }
  const cached = getCachedSharedSettings();
  if (cached) {
    return mergeSharedSettings(DEFAULT_SHARED_CONFIG, cached);
  }
  return DEFAULT_SHARED_CONFIG;
}

/**
 * Save shared settings to DB and local cache.
 */
export async function saveSharedPrintSettings(settings) {
  setCachedSharedSettings(settings);
  return await settingsService.updateSetting(SHARED_PRINT_SETTINGS_KEY, settings);
}

/**
 * ⚡ Apply shared header, footer, and demographic styles to ALL slips in the database in parallel!
 */
export async function applySharedMasterToAllSlips(sharedSettings) {
  setCachedSharedSettings(sharedSettings);
  const keys = [
    "print_slip_opd",
    "print_slip_ipd",
    "print_slip_ipd_admission",
    "print_slip_ipd_bill",
    "print_slip_ipd_discharge",
    "print_slip_ipd_receipt",
  ];

  // Execute in parallel via Promise.all for fast (2-3s) execution instead of 30s sequential loop
  const results = await Promise.all(
    keys.map(async (key) => {
      try {
        const existing = (await settingsService.getSetting(key)) || {};
        const updated = {
          ...existing,
          useSharedHeaderFooter: true,
          hospital: {
            ...(existing.hospital || {}),
            ...(sharedSettings.hospital || {}),
          },
          header: {
            ...(existing.header || {}),
            ...(sharedSettings.header || {}),
          },
          footer: {
            ...(existing.footer || {}),
            ...(sharedSettings.footer || {}),
          },
          patientDemographics: {
            ...(existing.patientDemographics || {}),
            ...(sharedSettings.patientDemographics || {}),
          },
          fieldStyles: {
            ...(existing.fieldStyles || {}),
            ...(sharedSettings.fieldStyles || {}),
          },
          slipConfigs: {
            ...(existing.slipConfigs || {}),
            ...(sharedSettings.slipConfigs || {}),
          },
        };
        await settingsService.updateSetting(key, updated);
        return { key, success: true };
      } catch (err) {
        console.error(`Failed to apply shared master to ${key}:`, err);
        return { key, success: false, error: err.message };
      }
    })
  );

  return results;
}

/**
 * Builds the shared hospital header HTML block.
 * Respects per-slip Active/Inactive data toggles!
 */
export function buildSharedHeaderHTML(
  settings = DEFAULT_SHARED_CONFIG,
  options = { isPreview: false, activeTargetKey: null, slipType: "all", titleOverride: null, copyBadgeOverride: null, encounterData: {} }
) {
  const cfg = mergeSharedSettings(DEFAULT_SHARED_CONFIG, settings || {});
  const fs = cfg.fieldStyles || {};
  const isPreview = options?.isPreview === true;
  const slipType = options?.slipType || "all";
  const data = options?.encounterData || SLIP_SAMPLE_DATA[slipType] || SLIP_SAMPLE_DATA.all;
  const activeKey = options?.activeTargetKey || null;

  const isActive = (k) => isElementActiveOnSlip(k, slipType, cfg);
  const getStyle = (k, extra = "") => getElementComputedStyle(k, fs, extra, !isActive(k));
  const click = (k) => getClickableAttr(k, isPreview);
  const getText = (k, fallback) => fs[k]?.customText || fallback;

  // Slip specific title / copy badge
  const slipCfg = cfg.slipConfigs?.[slipType] || cfg.slipConfigs?.all || {};
  const docTitle = getText("ticket.title", slipCfg.title || options?.titleOverride || cfg.header?.title || "HOSPITAL ENCOUNTER SLIP");
  const copyType = getText("ticket.copyBadge", slipCfg.copyBadge || options?.copyBadgeOverride || cfg.header?.copyType || "ORIGINAL FOR PATIENT");

  const hName = getText("header.hospitalName", cfg.hospital?.name || "Narayan Hospital");
  const hSub = getText("header.subtitle", cfg.hospital?.subtitle || "");
  const hSlogan = getText("header.slogan", cfg.hospital?.slogan || "");
  const hAddr = getText("header.address", cfg.hospital?.address || "");
  const hPhone = getText("header.phoneEmail", `📞 ${cfg.hospital?.phone || ""} ${cfg.hospital?.email ? `• ✉️ ${cfg.hospital.email}` : ""}`);
  const hReg = getText("header.regNo", cfg.hospital?.registrationNo ? `Reg: ${cfg.hospital.registrationNo}` : "");
  const hEmergency = getText("header.emergencyPhone", cfg.hospital?.emergencyPhone ? `🚨 24x7 Emergency: ${cfg.hospital.emergencyPhone}` : "");

  const logoH = fs["header.logo"]?.height || cfg.hospital?.logoHeight || 48;
  const logoScale = Number(fs["header.logo"]?.scale);
  const effectiveLogoH = logoScale && logoScale !== 100 ? Math.round(logoH * (logoScale / 100)) : logoH;

  const isBannerCardActive = isElementActiveOnSlip("ticket.card", slipType, cfg);
  const showTitle = isActive("ticket.title");
  const showCopyBadge = isActive("ticket.copyBadge") && cfg.header?.showCopyBadge && Boolean(copyType);
  const showTopUhid = isActive("ticket.topUhid") && cfg.header?.showTopUHID && Boolean(data.uhid || "UHID-000000");
  const showTopAdmission = isActive("ticket.topAdmissionNo") && cfg.header?.showTopAdmissionNo && Boolean(data.ipdNo || data.encounterNo || data.tokenNo);
  const showBarcode = isActive("ticket.barcode") && cfg.header?.showBarcode;

  const hasAnyBannerContent = showTitle || showCopyBadge || showTopUhid || showTopAdmission || showBarcode;

  return `
    <!-- ── 1. HOSPITAL LETTERHEAD ── -->
    ${
      isActive("header.card") && fs["header.card"]?.show !== false
        ? `
    <div class="shared-hospital-block" style="${getStyle("header.card")}" ${click("header.card")}>
      <div class="shared-hospital-left">
        ${
          isActive("header.logo") && cfg.hospital?.showLogo && cfg.hospital?.logoUrl
            ? `<img src="${cfg.hospital.logoUrl}" alt="Logo" class="shared-hospital-logo" style="height:${effectiveLogoH}px; max-height:${effectiveLogoH}px; max-width:${fs["header.logo"]?.width || 240}px; width:auto; ${getStyle("header.logo")}" ${click("header.logo")} />`
            : ""
        }
        <div class="shared-hospital-identity">
          ${isActive("header.hospitalName") ? `<h1 class="shared-hospital-name" style="${getStyle("header.hospitalName")}" ${click("header.hospitalName")}>${hName}</h1>` : ""}
          ${isActive("header.subtitle") && hSub ? `<p class="shared-hospital-sub" style="${getStyle("header.subtitle")}" ${click("header.subtitle")}>${hSub}</p>` : ""}
          ${isActive("header.slogan") && hSlogan ? `<p class="shared-hospital-slogan" style="${getStyle("header.slogan")}" ${click("header.slogan")}>${hSlogan}</p>` : ""}
          ${isActive("header.address") && cfg.hospital?.showHeaderAddress === true && hAddr ? `<p class="shared-hospital-addr" style="${getStyle("header.address")}" ${click("header.address")}>${hAddr}</p>` : ""}
          ${isActive("header.phoneEmail") && hPhone ? `<p class="shared-hospital-contact" style="${getStyle("header.phoneEmail")}" ${click("header.phoneEmail")}>${hPhone}</p>` : ""}
        </div>
      </div>
      <div class="shared-hospital-right">
        ${isActive("header.regNo") && hReg ? `<span class="shared-reg-badge" style="${getStyle("header.regNo")}" ${click("header.regNo")}>${hReg}</span>` : ""}
        ${isActive("header.emergencyPhone") && hEmergency ? `<span class="shared-em-badge" style="${getStyle("header.emergencyPhone")}" ${click("header.emergencyPhone")}>${hEmergency}</span>` : ""}
        ${
          isActive("header.accreditations") && cfg.hospital?.showAccreditationBadges && Array.isArray(cfg.hospital?.accreditations) && cfg.hospital.accreditations.length > 0
            ? `
          <div class="shared-accreditations-row" style="${getStyle("header.accreditations")}" ${click("header.accreditations")}>
            ${cfg.hospital.accreditations.map((acc) => `<span class="shared-acc-pill">${acc}</span>`).join("")}
          </div>
        `
            : ""
        }
      </div>
    </div>
    `
        : ""
    }

    <!-- ── 2. DOCUMENT BANNER & BARCODE ── -->
    ${
      isBannerCardActive && hasAnyBannerContent
        ? `
    <div class="shared-banner-block" style="${getStyle("ticket.card")}" ${click("ticket.card")}>
      <div class="shared-banner-left">
        ${showTitle ? `<h2 class="shared-doc-title" style="${getStyle("ticket.title")}" ${click("ticket.title")}>${docTitle}</h2>` : ""}
        ${showCopyBadge ? `<span class="shared-copy-pill" style="${getStyle("ticket.copyBadge")}" ${click("ticket.copyBadge")}>${copyType}</span>` : ""}
      </div>
      <div class="shared-banner-right">
        ${
          showTopUhid
            ? `
          <div class="shared-top-tag" style="${getStyle("ticket.topUhid")}" ${click("ticket.topUhid")}>
            <small>PATIENT UHID</small>
            <span>${data.uhid || "UHID-2026-004481"}</span>
          </div>
        `
            : ""
        }
        ${
          showTopAdmission
            ? `
          <div class="shared-top-tag" style="${getStyle("ticket.topAdmissionNo")}" ${click("ticket.topAdmissionNo")}>
            <small>${slipType === "opd" ? "TOKEN NO" : "ENCOUNTER / IPD NO"}</small>
            <span>${data.ipdNo || data.encounterNo || data.tokenNo || "IPD-26-0198"}</span>
          </div>
        `
            : ""
        }
        ${
          showBarcode
            ? `
          <div class="shared-barcode-wrap" style="${getStyle("ticket.barcode")}" ${click("ticket.barcode")}>
            ${generateBarcodeSvg(data.ipdNo || data.uhid || data.tokenNo || "IPD-26-0198", fs["ticket.barcode"]?.height, fs["ticket.barcode"]?.width)}
          </div>
        `
            : ""
        }
      </div>
    </div>
        `
        : ""
    }
  `;
}

/**
 * Builds the shared patient demographics HTML block.
 * Allows ANY slip to easily select or remove which fields to print!
 */
export function buildSharedDemographicsHTML(
  settings = DEFAULT_SHARED_CONFIG,
  data = null,
  selectedFieldsMap = null,
  options = { isPreview: false, activeTargetKey: null, slipType: "all" }
) {
  const cfg = mergeSharedSettings(DEFAULT_SHARED_CONFIG, settings || {});
  const fs = cfg.fieldStyles || {};
  const isPreview = options?.isPreview === true;
  const slipType = options?.slipType || "all";
  const sampleData = data || SLIP_SAMPLE_DATA[slipType] || SLIP_SAMPLE_DATA.all;

  const isActive = (k) => isElementActiveOnSlip(`patient.${k}`, slipType, cfg);
  const getStyle = (k, extra = "") => getElementComputedStyle(`patient.${k}`, fs, extra, !isActive(k));
  const click = (k) => getClickableAttr(`patient.${k}`, isPreview);

  // Field catalog from master config
  const fields = cfg.patientDemographics?.fields || {};
  const isShow = (k) => {
    if (!isActive(k)) return false;
    if (selectedFieldsMap && typeof selectedFieldsMap[k] !== "undefined") {
      return Boolean(selectedFieldsMap[k]?.show ?? selectedFieldsMap[k]);
    }
    return fields[k]?.show !== false;
  };

  const getLbl = (k, def) => {
    if (selectedFieldsMap?.[k]?.label) return selectedFieldsMap[k].label;
    return fields[k]?.label || def;
  };

  if (!isElementActiveOnSlip("patient.card", slipType, cfg)) {
    return "";
  }

  return `
    <div class="shared-demographics-card" style="${getElementComputedStyle("patient.card", fs)}" ${getClickableAttr("patient.card", isPreview)}>
      <div class="shared-demo-head">
        <h3 class="shared-demo-title">👤 ${cfg.patientDemographics?.title || "PATIENT DEMOGRAPHICS"}</h3>
        <span class="shared-encounter-date">Encounter Date: <strong>${sampleData.admissionDate || "Today"}</strong></span>
      </div>
      <div class="shared-demo-grid">
        ${
          isShow("name")
            ? `
          <div class="shared-field-cell" style="${getStyle("name")}" ${click("name")}>
            <span class="shared-field-label">${getLbl("name", "Patient Name")}</span>
            <span class="shared-field-val highlight-name">${sampleData.patientName || "—"}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("uhid")
            ? `
          <div class="shared-field-cell" style="${getStyle("uhid")}" ${click("uhid")}>
            <span class="shared-field-label">${getLbl("uhid", "UHID No.")}</span>
            <span class="shared-field-val">${sampleData.uhid || "—"}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("ageGender")
            ? `
          <div class="shared-field-cell" style="${getStyle("ageGender")}" ${click("ageGender")}>
            <span class="shared-field-label">${getLbl("ageGender", "Age / Gender")}</span>
            <span class="shared-field-val">${sampleData.ageGender || "—"}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("mobile")
            ? `
          <div class="shared-field-cell" style="${getStyle("mobile")}" ${click("mobile")}>
            <span class="shared-field-label">${getLbl("mobile", "Contact Phone")}</span>
            <span class="shared-field-val">${sampleData.mobile || "—"}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("bloodGroup")
            ? `
          <div class="shared-field-cell" style="${getStyle("bloodGroup")}" ${click("bloodGroup")}>
            <span class="shared-field-label">${getLbl("bloodGroup", "Blood Group")}</span>
            <span class="shared-field-val"><span class="shared-blood-pill">🩸 ${sampleData.bloodGroup || "—"}</span></span>
          </div>
        `
            : ""
        }
        ${
          isShow("guardian")
            ? `
          <div class="shared-field-cell" style="${getStyle("guardian")}" ${click("guardian")}>
            <span class="shared-field-label">${getLbl("guardian", "Guardian / Attendant")}</span>
            <span class="shared-field-val">${sampleData.guardian || "—"} ${sampleData.relation ? `(${sampleData.relation})` : ""}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("address")
            ? `
          <div class="shared-field-cell span-3" style="${getStyle("address")}" ${click("address")}>
            <span class="shared-field-label">${getLbl("address", "Full Residential Address")}</span>
            <span class="shared-field-val" style="font-weight: 500;">${sampleData.address || "—"}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("payer") && sampleData.payer
            ? `
          <div class="shared-field-cell" style="${getStyle("payer")}" ${click("payer")}>
            <span class="shared-field-label">${getLbl("payer", "Payer / Category")}</span>
            <span class="shared-field-val">${sampleData.payer}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("doctor") && sampleData.doctor
            ? `
          <div class="shared-field-cell" style="${getStyle("doctor")}" ${click("doctor")}>
            <span class="shared-field-label">${getLbl("doctor", "Consultant Doctor")}</span>
            <span class="shared-field-val" style="color: #0369a1;">🩺 ${sampleData.doctor}</span>
          </div>
        `
            : ""
        }
        ${
          isShow("department") && sampleData.department
            ? `
          <div class="shared-field-cell" style="${getStyle("department")}" ${click("department")}>
            <span class="shared-field-label">${getLbl("department", "Department")}</span>
            <span class="shared-field-val">🏥 ${sampleData.department}</span>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
}

/**
 * Builds the shared footer HTML block (Policies, Helplines, Signatures & Stamp).
 * Respects per-slip Active/Inactive data toggles!
 */
export function buildSharedFooterHTML(
  settings = DEFAULT_SHARED_CONFIG,
  options = { isPreview: false, activeTargetKey: null, slipType: "all" }
) {
  const cfg = mergeSharedSettings(DEFAULT_SHARED_CONFIG, settings || {});
  const fs = cfg.fieldStyles || {};
  const isPreview = options?.isPreview === true;
  const slipType = options?.slipType || "all";

  const isActive = (k) => isElementActiveOnSlip(k, slipType, cfg);
  const getStyle = (k, extra = "") => getElementComputedStyle(k, fs, extra, !isActive(k));
  const click = (k) => getClickableAttr(k, isPreview);
  const getText = (k, fallback) => fs[k]?.customText || fallback;

  const termsTitle = getText("terms.title", cfg.footer?.termsTitle || "HOSPITAL INSTRUCTIONS & POLICIES");
  const helplineRaw = typeof cfg.footer?.helpline === "object" ? cfg.footer?.helpline?.number : cfg.footer?.helpline;
  const defaultHelpline = helplineRaw || (cfg.hospital?.phone ? `24x7 Helpline: ${cfg.hospital.phone}${cfg.hospital?.emergencyPhone ? ` • Emergency: ${cfg.hospital.emergencyPhone}` : ""}` : "");
  const termsHelpline = getText("terms.helpline", defaultHelpline);
  const defaultAddress = cfg.footer?.address || cfg.hospital?.address ? `${cfg.hospital?.name ? `${cfg.hospital.name} • ` : ""}${cfg.footer?.address || cfg.hospital?.address}` : "";
  const termsAddress = getText("terms.address", defaultAddress);
  const termsTagline = getText("terms.footerTagline", cfg.footer?.tagline || "");
  const termsDisclaimer = getText("terms.disclaimer", cfg.footer?.disclaimer || "");

  const sig = cfg.footer?.signatures || {};

  return `
    <!-- ── SHARED FOOTER POLICIES & TERMS ── -->
    ${
      isActive("terms.card") && fs["terms.card"]?.show !== false
        ? `
      <div class="shared-terms-card" style="${getStyle("terms.card")}" ${click("terms.card")}>
        <div class="shared-terms-head">
          <h3 class="shared-terms-title" style="${getStyle("terms.title")}" ${click("terms.title")}>📜 ${termsTitle}</h3>
        </div>
        <ol class="shared-terms-list" style="${getStyle("terms.list")}" ${click("terms.list")}>
          ${(cfg.footer?.termsItems || []).map((t) => `<li>${t}</li>`).join("")}
        </ol>
        ${isActive("terms.helpline") && termsHelpline ? `<div class="shared-terms-helpline" style="${getStyle("terms.helpline")}" ${click("terms.helpline")}>📞 ${termsHelpline}</div>` : ""}
        ${isActive("terms.address") && termsAddress ? `<div class="shared-terms-addr" style="${getStyle("terms.address")}" ${click("terms.address")}>📍 ${termsAddress}</div>` : ""}
        ${isActive("terms.footerTagline") && termsTagline ? `<div class="shared-terms-tagline" style="${getStyle("terms.footerTagline")}" ${click("terms.footerTagline")}>${termsTagline}</div>` : ""}
        ${isActive("terms.disclaimer") && termsDisclaimer ? `<div class="shared-terms-disclaimer" style="${getStyle("terms.disclaimer")}" ${click("terms.disclaimer")}>${termsDisclaimer}</div>` : ""}
      </div>
    `
        : ""
    }

    <!-- ── SHARED SIGNATURES & STAMP ── -->
    ${
      isActive("signatures.card") && fs["signatures.card"]?.show !== false
        ? `
      <div class="shared-sig-card" style="${getStyle("signatures.card")}" ${click("signatures.card")}>
        <div class="shared-sig-grid">
          ${
            isActive("signatures.doctor") && sig.doctor?.show !== false
              ? `
            <div class="shared-sig-col" style="${getStyle("signatures.doctor")}" ${click("signatures.doctor")}>
              <div class="shared-sig-line"></div>
              <p class="shared-sig-title">${sig.doctor?.title || "Treating Consultant"}</p>
              <p class="shared-sig-sub">${sig.doctor?.sub || "Admitting / Attending Doctor"}</p>
            </div>
          `
              : "<div></div>"
          }
          ${
            isActive("signatures.nurse") && sig.nurse?.show !== false
              ? `
            <div class="shared-sig-col" style="${getStyle("signatures.nurse")}" ${click("signatures.nurse")}>
              <div class="shared-sig-line"></div>
              <p class="shared-sig-title">${sig.nurse?.title || "Duty Nursing Officer"}</p>
              <p class="shared-sig-sub">${sig.nurse?.sub || "Ward / Counter Incharge"}</p>
            </div>
          `
              : "<div></div>"
          }
          ${
            isActive("signatures.attendant") && sig.attendant?.show !== false
              ? `
            <div class="shared-sig-col" style="${getStyle("signatures.attendant")}" ${click("signatures.attendant")}>
              <div class="shared-sig-line"></div>
              <p class="shared-sig-title">${sig.attendant?.title || "Patient / Attendant Signature"}</p>
              <p class="shared-sig-sub">${sig.attendant?.sub || "Consent & Acknowledgment"}</p>
            </div>
          `
              : "<div></div>"
          }
          ${
            isActive("signatures.cashier") && sig.cashier?.show !== false
              ? `
            <div class="shared-sig-col" style="${getStyle("signatures.cashier")}" ${click("signatures.cashier")}>
              <div class="shared-sig-line"></div>
              <p class="shared-sig-title">${sig.cashier?.title || "Accounts / Billing Officer"}</p>
              <p class="shared-sig-sub">${sig.cashier?.sub || "Authorized Signatory"}</p>
            </div>
          `
              : ""
          }
          ${
            isActive("signatures.stamp") && sig.stamp?.show !== false
              ? `
            <div class="shared-stamp-col" style="${getStyle("signatures.stamp")}" ${click("signatures.stamp")}>
              <div class="shared-stamp-box">
                <span>${sig.stamp?.title || "OFFICIAL HOSPITAL STAMP"}</span>
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
  `;
}

/**
 * Builds realistic middle body content for a specific slip in the live preview
 */
function buildSlipBodyPreviewHTML(slipType = "all", settings = DEFAULT_SHARED_CONFIG, options = { isPreview: false }) {
  const fs = settings.fieldStyles || {};
  const isPreview = options?.isPreview === true;
  const isBodyActive = isElementActiveOnSlip("body.card", slipType, settings) && fs["body.card"]?.show !== false;
  if (!isBodyActive) return "";

  const bodyStyle = getElementComputedStyle("body.card", fs);
  const bodyClick = getClickableAttr("body.card", isPreview);

  if (slipType === "opd") {
    return `
      <div class="shared-slip-body-box" style="${bodyStyle}" ${bodyClick}>
        <div class="shared-body-head">
          <span class="shared-body-title">🩺 OPD CONSULTATION PARTICULARS &amp; CHARGES</span>
          <span class="shared-body-badge">Token: T-311026-GEN-03</span>
        </div>
        <table class="shared-particulars-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Service Particulars</th>
              <th style="text-align: right; width: 120px;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>OPD Specialist Consultation Fee (General Medicine)</td>
              <td style="text-align: right; font-weight: 700;">₹ 500.00</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Hospital Registration &amp; Patient Card Fee</td>
              <td style="text-align: right; font-weight: 700;">₹ 100.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align: right; font-weight: 800;">Total Amount Paid (Cash):</td>
              <td style="text-align: right; font-weight: 900; color: #0b3b60; font-size: 11px;">₹ 600.00</td>
            </tr>
          </tfoot>
        </table>
        <div class="shared-consultation-rx-area">
          <div style="font-weight: 800; color: #0284c7; margin-bottom: 2px;">℞ Clinical Notes / Prescriptions:</div>
          <div style="color: #64748b; font-style: italic; min-height: 40px; border-bottom: 1px dashed #cbd5e1; padding-top: 4px;">
            Patient presents with mild fever and acute viral symptoms. Advised CBC, hydration, and rest for 3 days.
          </div>
        </div>
      </div>
    `;
  }

  if (slipType === "ipd_admission") {
    return `
      <div class="shared-slip-body-box" style="${bodyStyle}" ${bodyClick}>
        <div class="shared-body-head">
          <span class="shared-body-title">🛏️ INPATIENT ADMISSION &amp; BED ALLOTMENT DETAILS</span>
          <span class="shared-body-badge">IPD No: IPD-26-0198</span>
        </div>
        <div class="shared-info-grid">
          <div class="shared-info-cell">
            <span class="shared-field-label">Admission Category</span>
            <span class="shared-field-val">Planned Medical Inpatient</span>
          </div>
          <div class="shared-info-cell">
            <span class="shared-field-label">Allotted Bed / Ward</span>
            <span class="shared-field-val" style="color: #0369a1;">Bed B-204 (Step-down ICU, 2nd Floor)</span>
          </div>
          <div class="shared-info-cell">
            <span class="shared-field-label">Advance Deposit Received</span>
            <span class="shared-field-val" style="color: #15803d;">₹ 10,000.00 (Online UPI / Rec: REC-9941)</span>
          </div>
          <div class="shared-info-cell" style="grid-column: span 3;">
            <span class="shared-field-label">Provisional Diagnosis</span>
            <span class="shared-field-val">Acute Gastroenteritis with Moderate Dehydration &amp; Hypokalemia</span>
          </div>
        </div>
      </div>
    `;
  }

  if (slipType === "ipd_billing") {
    return `
      <div class="shared-slip-body-box" style="${bodyStyle}" ${bodyClick}>
        <div class="shared-body-head">
          <span class="shared-body-title">💳 INPATIENT BILLING &amp; CHARGES LEDGER</span>
          <span class="shared-body-badge">Tax Invoice: BILL-2026-8812</span>
        </div>
        <table class="shared-particulars-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Particulars / Head</th>
              <th style="width: 60px; text-align: center;">Qty/Days</th>
              <th style="text-align: right; width: 100px;">Rate (₹)</th>
              <th style="text-align: right; width: 110px;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>ICU / Step-Down Bed &amp; Monitoring Charges</td>
              <td style="text-align: center;">4</td>
              <td style="text-align: right;">3,000.00</td>
              <td style="text-align: right; font-weight: 700;">12,000.00</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Treating Consultant Rounds &amp; Specialist Care</td>
              <td style="text-align: center;">4</td>
              <td style="text-align: right;">1,000.00</td>
              <td style="text-align: right; font-weight: 700;">4,000.00</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Inpatient Nursing &amp; Clinical Consumables</td>
              <td style="text-align: center;">4</td>
              <td style="text-align: right;">850.00</td>
              <td style="text-align: right; font-weight: 700;">3,400.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: right; font-weight: 800;">Gross Invoice Amount:</td>
              <td style="text-align: right; font-weight: 900;">₹ 19,400.00</td>
            </tr>
            <tr>
              <td colspan="4" style="text-align: right; color: #15803d; font-weight: 700;">Less: Advance Deposit Adjusted:</td>
              <td style="text-align: right; color: #15803d; font-weight: 800;">- ₹ 10,000.00</td>
            </tr>
            <tr style="background: #e0f2fe;">
              <td colspan="4" style="text-align: right; font-weight: 900; color: #0b3b60; font-size: 11px;">Net Balance Payable:</td>
              <td style="text-align: right; font-weight: 900; color: #0b3b60; font-size: 11.5px;">₹ 9,400.00</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  if (slipType === "ipd_discharge") {
    return `
      <div class="shared-slip-body-box" style="${bodyStyle}" ${bodyClick}>
        <div class="shared-body-head">
          <span class="shared-body-title">📋 CLINICAL DISCHARGE SUMMARY &amp; COURSE</span>
          <span class="shared-body-badge">Discharged: Stable</span>
        </div>
        <div class="shared-info-grid">
          <div class="shared-info-cell">
            <span class="shared-field-label">Date of Admission</span>
            <span class="shared-field-val">04 Nov 2026, 11:30 AM</span>
          </div>
          <div class="shared-info-cell">
            <span class="shared-field-label">Date of Discharge</span>
            <span class="shared-field-val" style="color: #0369a1;">08 Nov 2026, 02:00 PM</span>
          </div>
          <div class="shared-info-cell">
            <span class="shared-field-label">Condition at Discharge</span>
            <span class="shared-field-val" style="color: #15803d;">Hemodynamically Stable / Afebrile</span>
          </div>
          <div class="shared-info-cell" style="grid-column: span 3;">
            <span class="shared-field-label">Final Clinical Diagnosis</span>
            <span class="shared-field-val">Acute Infective Gastroenteritis (Resolved) with Electrolyte Rebalance</span>
          </div>
          <div class="shared-info-cell" style="grid-column: span 3;">
            <span class="shared-field-label">Discharge Medications &amp; Follow-up Advice</span>
            <span class="shared-field-val" style="font-weight: 500;">
              Tab Rifaximin 400mg BD x 5 days, Cap Probiotic OD x 7 days, ORS hydration. Follow-up after 5 days in OPD.
            </span>
          </div>
        </div>
      </div>
    `;
  }

  if (slipType === "ipd_receipt") {
    return `
      <div class="shared-slip-body-box" style="border: 1.5px solid #0284c7; background: #ffffff; ${bodyStyle}" ${bodyClick}>
        <div class="shared-body-head" style="background: #f0f9ff; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px;">
          <span class="shared-body-title" style="color: #0369a1; font-size: 11px;">🧾 PAYMENT RECEIPT &amp; TRANSACTION DETAILS</span>
          <span class="shared-body-badge" style="background: #0284c7; color: #ffffff; font-weight: 800;">REC-26-0068</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
          <!-- Left: Big Amount Box -->
          <div style="background: #f8fafc; border: 1.5px dashed #0284c7; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: center;">
            <span style="font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Amount Received</span>
            <div style="font-size: 22px; font-weight: 900; color: #059669; font-family: monospace; line-height: 1.2;">
              ₹ 5,141.00
            </div>
            <div style="font-size: 8.5px; color: #334155; font-style: italic; margin-top: 3px;">
              In Words: <strong>Rupees Five Thousand One Hundred Forty One Only</strong>
            </div>
          </div>

          <!-- Right: Payment Meta -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; font-size: 9px; display: flex; flex-direction: column; gap: 3px;">
            <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Receipt Category:</span> <strong style="color: #0f172a;">Running Bill Interim Payment</strong></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Payment Mode:</span> <strong style="color: #0f172a;">Cash Counter</strong></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Date &amp; Time:</span> <span style="font-weight: 700;">06 Nov 2026, 04:44 PM</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Remarks / Ref:</span> <span>Running Bill Interim Payment received for Test 1</span></div>
          </div>
        </div>

        <!-- Ledger Snapshot Bar -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 6px 8px; background: #f1f5f9; border-radius: 6px; font-size: 8.5px; text-align: center;">
          <div><span style="color: #64748b; display: block; font-size: 7.5px;">TOTAL CHARGES</span> <strong>₹ 3,000.00</strong></div>
          <div><span style="color: #64748b; display: block; font-size: 7.5px;">TOTAL RECEIPTS</span> <strong style="color: #059669;">₹ 5,141.00</strong></div>
          <div><span style="color: #64748b; display: block; font-size: 7.5px;">EXCESS ADVANCE CREDIT</span> <strong style="color: #0284c7;">₹ 2,141.00</strong></div>
        </div>
      </div>
    `;
  }

  // Fallback for "all" / Global Master
  return `
    <div class="shared-placeholder-box" style="${bodyStyle}" ${bodyClick}>
      <div class="shared-placeholder-title">📄 Slip-Specific Middle Body Area (Shared Master Preview)</div>
      <div>
        Each slip (OPD Consultation, IPD Admission Ticket, IPD Billing Slip, Discharge Summary) displays its own middle clinical or ledger content here.
        The Header, Footer, and Demographics above and below are SHARED from this Master Template!
      </div>
    </div>
  `;
}

/**
 * Core CSS rules shared across all slip layouts (Header, Demographics, Footer)
 */
export const SHARED_PRINT_CSS = `
  /* ── HEADER LETTERHEAD ── */
  .shared-hospital-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    position: relative;
  }
  .shared-hospital-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  .shared-hospital-logo {
    max-width: 150px;
    object-fit: contain;
  }
  .shared-hospital-identity {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .shared-hospital-name {
    font-size: 16px;
    font-weight: 800;
    color: #0b3b60;
    margin: 0;
    line-height: 1.2;
  }
  .shared-hospital-sub {
    font-size: 9px;
    font-weight: 600;
    color: #475569;
    margin: 0;
  }
  .shared-hospital-slogan {
    font-size: 8.5px;
    font-style: italic;
    color: #0284c7;
    margin: 0;
  }
  .shared-hospital-addr {
    font-size: 8.5px;
    color: #64748b;
    margin: 0;
  }
  .shared-hospital-contact {
    font-size: 8px;
    color: #64748b;
    margin: 0;
  }
  .shared-hospital-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
  }
  .shared-reg-badge {
    display: inline-block;
    padding: 2px 6px;
    font-size: 8.5px;
    font-weight: 700;
    background: #f1f5f9;
    color: #334155;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
  }
  .shared-em-badge {
    display: inline-block;
    font-size: 9.5px;
    font-weight: 800;
    color: #dc2626;
  }
  .shared-accreditations-row {
    display: flex;
    gap: 4px;
    margin-top: 2px;
  }
  .shared-acc-pill {
    font-size: 7.5px;
    font-weight: 800;
    background: #e0f2fe;
    color: #0369a1;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid #bae6fd;
  }

  /* ── BANNER BLOCK ── */
  .shared-banner-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    border: 1px solid #bae6fd;
    background: linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 8px;
    position: relative;
    margin-top: 6px;
  }
  .shared-banner-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .shared-doc-title {
    font-size: 13px;
    font-weight: 800;
    color: #0b3b60;
    margin: 0;
    letter-spacing: 0.02em;
  }
  .shared-copy-pill {
    font-size: 8px;
    font-weight: 700;
    padding: 2px 6px;
    background: #0284c7;
    color: #ffffff;
    border-radius: 4px;
  }
  .shared-banner-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .shared-top-tag {
    font-size: 10.5px;
    font-weight: 800;
    color: #0f172a;
    text-align: right;
  }
  .shared-top-tag small {
    display: block;
    font-size: 7.5px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
  }
  .shared-barcode-wrap {
    display: flex;
    align-items: center;
  }

  /* ── DEMOGRAPHICS CARD ── */
  .shared-demographics-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    background: #ffffff;
    position: relative;
    margin-top: 6px;
  }
  .shared-demo-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 4px;
    margin-bottom: 6px;
  }
  .shared-demo-title {
    font-size: 9.5px;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
  }
  .shared-encounter-date {
    font-size: 8.5px;
    color: #64748b;
  }
  .shared-demo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px 12px;
  }
  .shared-field-cell {
    display: flex;
    flex-direction: column;
    gap: 1px;
    position: relative;
  }
  .shared-field-cell.span-3 {
    grid-column: span 3;
  }
  .shared-field-label {
    font-size: 8px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
  }
  .shared-field-val {
    font-size: 10.5px;
    font-weight: 700;
    color: #0f172a;
  }
  .shared-field-val.highlight-name {
    font-size: 11.5px;
    color: #0284c7;
  }
  .shared-blood-pill {
    font-size: 9.5px;
    font-weight: 800;
    background: #fee2e2;
    color: #b91c1c;
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid #fca5a5;
  }

  /* ── FOOTER POLICIES ── */
  .shared-terms-card {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 6px 10px;
    background: #f8fafc;
    position: relative;
    margin-top: 6px;
  }
  .shared-terms-head {
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 2px;
    margin-bottom: 4px;
  }
  .shared-terms-title {
    font-size: 8.5px;
    font-weight: 800;
    color: #334155;
    margin: 0;
    text-transform: uppercase;
  }
  .shared-terms-list {
    margin: 0 0 4px 14px;
    padding: 0;
    font-size: 8px;
    color: #475569;
    line-height: 1.35;
  }
  .shared-terms-list li {
    margin-bottom: 1px;
  }
  .shared-terms-helpline {
    font-size: 8px;
    font-weight: 700;
    color: #0b3b60;
    text-align: center;
    margin-top: 3px;
    padding-top: 2px;
    border-top: 1px solid #e2e8f0;
  }
  .shared-terms-addr {
    font-size: 7.5px;
    font-weight: 600;
    color: #475569;
    text-align: center;
    margin-top: 1px;
  }
  .shared-terms-tagline {
    font-size: 8px;
    font-weight: 700;
    color: #0369a1;
    text-align: center;
    margin-top: 2px;
  }
  .shared-terms-disclaimer {
    font-size: 7.5px;
    font-style: italic;
    color: #64748b;
    text-align: center;
  }

  /* ── FOOTER SIGNATURES & STAMP ── */
  .shared-sig-card {
    padding: 6px 4px;
    position: relative;
    margin-top: 6px;
  }
  .shared-sig-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr) auto;
    gap: 12px;
    align-items: flex-end;
  }
  .shared-sig-col {
    text-align: center;
    position: relative;
  }
  .shared-sig-line {
    border-top: 1.5px dashed #94a3b8;
    width: 85%;
    margin: 0 auto 4px auto;
  }
  .shared-sig-title {
    font-size: 8.5px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  .shared-sig-sub {
    font-size: 7.5px;
    color: #64748b;
    margin: 0;
  }
  .shared-stamp-col {
    display: flex;
    justify-content: flex-end;
    position: relative;
  }
  .shared-stamp-box {
    width: 72px;
    height: 48px;
    border: 1.5px solid #0284c7;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 7px;
    font-weight: 800;
    color: #0284c7;
    background: rgba(2, 132, 199, 0.04);
    padding: 2px;
  }
`;

/**
 * Builds the complete WYSIWYG preview HTML document for the Master Shared Header & Footer designer.
 */
export function buildSharedPreviewHTML(
  settings = DEFAULT_SHARED_CONFIG,
  data = null,
  options = { isPreview: true, activeTargetKey: null, slipType: "all" }
) {
  const cfg = mergeSharedSettings(DEFAULT_SHARED_CONFIG, settings || {});
  const isPreview = options?.isPreview === true;
  const activeKey = options?.activeTargetKey || null;
  const slipType = options?.slipType || "all";
  const slipData = data || SLIP_SAMPLE_DATA[slipType] || SLIP_SAMPLE_DATA.all;

  const headerHtml = buildSharedHeaderHTML(cfg, {
    isPreview,
    activeTargetKey: activeKey,
    slipType,
    encounterData: slipData,
  });

  const demoHtml = buildSharedDemographicsHTML(cfg, slipData, null, {
    isPreview,
    activeTargetKey: activeKey,
    slipType,
  });

  const bodyHtml = buildSlipBodyPreviewHTML(slipType, cfg, { isPreview, activeTargetKey: activeKey });

  const footerHtml = buildSharedFooterHTML(cfg, {
    isPreview,
    activeTargetKey: activeKey,
    slipType,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Master Shared Header & Footer Preview - ${slipType.toUpperCase()}</title>
  <style>
    @page {
      size: ${slipType === "ipd_receipt" ? "A5 portrait" : "A4 portrait"};
      margin: ${cfg.page?.margin ?? (slipType === "ipd_receipt" ? 4 : 6)}mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: ${isPreview ? `${cfg.page?.margin ?? (slipType === "ipd_receipt" ? 4 : 6)}mm` : "0"};
      background: #ffffff;
      color: #0f172a;
      font-family: ${cfg.page?.fontFamily || "Inter, system-ui, sans-serif"};
      font-size: ${slipType === "ipd_receipt" ? "9px" : "10px"};
      line-height: 1.35;
    }
    @media print {
      html, body {
        padding: 0 !important;
        margin: 0 !important;
      }
    }
    .shared-preview-page {
      width: 100%;
      max-width: ${slipType === "ipd_receipt" ? "142mm" : "195mm"};
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: ${slipType === "ipd_receipt" ? "4px" : "6px"};
      position: relative;
    }

    ${SHARED_PRINT_CSS}

    /* ── SLIP-SPECIFIC MIDDLE BODY STYLES ── */
    .shared-slip-body-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      background: #ffffff;
    }
    .shared-body-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .shared-body-title {
      font-size: 9.5px;
      font-weight: 800;
      color: #0b3b60;
      text-transform: uppercase;
    }
    .shared-body-badge {
      font-size: 8px;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }
    .shared-particulars-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-bottom: 4px;
    }
    .shared-particulars-table th {
      background: #f8fafc;
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      text-align: left;
      font-size: 8px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }
    .shared-particulars-table td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .shared-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px 12px;
    }
    .shared-info-cell {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .shared-consultation-rx-area {
      margin-top: 6px;
      padding: 6px;
      border-radius: 6px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      font-size: 8.5px;
    }
    .shared-placeholder-box {
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 14px;
      background: #f8fafc;
      text-align: center;
      color: #64748b;
      font-size: 9.5px;
    }
    .shared-placeholder-title {
      font-weight: 700;
      color: #334155;
      font-size: 11px;
      margin-bottom: 3px;
    }

    /* ── INTERACTIVE PREVIEW OUTLINES (PREVIEW ONLY) ── */
    ${
      isPreview
        ? `
      [data-target-key] {
        cursor: pointer !important;
        transition: outline 0.1s ease, background-color 0.1s ease;
      }
      [data-target-key]:hover {
        outline: 1.5px dashed #0284c7 !important;
        outline-offset: 1px !important;
      }
      ${
        activeKey
          ? `
        [data-target-key="${activeKey}"] {
          outline: 2.5px dashed #0284c7 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.25) !important;
          background-color: rgba(2, 132, 199, 0.08) !important;
        }
      `
          : ""
      }
    `
        : ""
    }

    @media print {
      body {
        width: 100% !important;
        background: transparent !important;
      }
      .shared-preview-page {
        max-width: 100% !important;
      }
      [data-target-key] {
        outline: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }
    }
  </style>
</head>
<body>
  <div class="shared-preview-page">
    ${headerHtml}
    ${demoHtml}
    ${bodyHtml}
    ${footerHtml}
  </div>
</body>
</html>`;
}
