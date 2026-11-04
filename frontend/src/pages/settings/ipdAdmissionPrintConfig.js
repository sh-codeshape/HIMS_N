/**
 * IPD Admission Ticket print configuration & element layout schema.
 * Persisted under key: print_slip_ipd
 */
export const IPD_ADMISSION_SETTINGS_KEY = "print_slip_ipd";

export const field = (label, show = true) => ({ label, show });

export const FONT_FAMILIES = [
  { label: "Inter (Modern Clean)", value: "Inter, system-ui, sans-serif" },
  { label: "Roboto (Google Crisp)", value: "Roboto, system-ui, sans-serif" },
  { label: "Arial / Helvetica (Standard)", value: "Arial, Helvetica, sans-serif" },
  { label: "Poppins (Geometric & Bold)", value: "'Poppins', sans-serif" },
  { label: "Merriweather (Classic Serif)", value: "'Merriweather', Georgia, serif" },
  { label: "Times New Roman (Formal)", value: "'Times New Roman', serif" },
  { label: "Courier / Monospace (Code/Data)", value: "'Courier New', Courier, monospace" },
];

export const ELEMENT_DEFINITIONS = [
  { key: "hospitalHeader", name: "🏥 Hospital Letterhead & Brand", desc: "Top hospital identity, logo, address and accreditations", type: "card" },
  { key: "ticketHeader", name: "🏷️ Document Title & Barcode Badge", desc: "Ticket title banner, UHID, IPD number and barcodes", type: "card" },
  { key: "patientCard", name: "👤 Patient Demographics Card", desc: "Patient identity, age/gender, contact and attendant info", type: "card" },
  { key: "admissionCard", name: "🩺 Clinical Admission & Bed Details", desc: "Admission type, date, department, doctor, problem, duration and bed allotted", type: "card" },
  { key: "financialCard", name: "💳 Admission Fee & Advance Deposit", desc: "Registration fee, initial advance payment, receipt no and mode", type: "card" },
  { key: "termsCard", name: "📜 Terms & Conditions Metadata", desc: "Hospital rules, visiting hours, attendant pass policy", type: "card" },
  { key: "signaturesCard", name: "✍️ Signatures & Official Stamp", desc: "Treating consultant, nursing officer, attendant signature and hospital stamp", type: "card" },
];

export const FIELD_TARGETS = [
  // ── Hospital Brand & Header Elements (Top Priority) ──
  {
    key: "header.hospitalName",
    cardKey: "hospitalHeader",
    name: "Hospital Name / Brand Heading",
    section: "Hospital Letterhead",
    rowId: "h_row1",
    rowName: "Header Brand Line 1",
    siblings: ["header.logo", "header.regNo"],
  },
  {
    key: "header.logo",
    cardKey: "hospitalHeader",
    name: "Hospital Brand Logo",
    section: "Hospital Letterhead",
    rowId: "h_row1",
    rowName: "Header Brand Line 1",
    siblings: ["header.hospitalName", "header.regNo"],
  },
  {
    key: "header.regNo",
    cardKey: "hospitalHeader",
    name: "Hospital Registration No. Tag",
    section: "Hospital Letterhead",
    rowId: "h_row1",
    rowName: "Header Brand Line 1",
    siblings: ["header.hospitalName", "header.logo"],
  },
  {
    key: "header.subtitle",
    cardKey: "hospitalHeader",
    name: "Hospital Subtitle / NABH Line",
    section: "Hospital Letterhead",
    rowId: "h_row2",
    rowName: "Header Subtitle Line 2",
    siblings: ["header.emergencyPhone"],
  },
  {
    key: "header.emergencyPhone",
    cardKey: "hospitalHeader",
    name: "24x7 Emergency Contact Badge",
    section: "Hospital Letterhead",
    rowId: "h_row2",
    rowName: "Header Subtitle Line 2",
    siblings: ["header.subtitle"],
  },
  {
    key: "header.address",
    cardKey: "hospitalHeader",
    name: "Hospital Physical Address",
    section: "Hospital Letterhead",
    rowId: "h_row3",
    rowName: "Header Contact Line 3",
    siblings: ["header.phoneEmail"],
  },
  {
    key: "header.phoneEmail",
    cardKey: "hospitalHeader",
    name: "Telephone, Helpline & Email",
    section: "Hospital Letterhead",
    rowId: "h_row3",
    rowName: "Header Contact Line 3",
    siblings: ["header.address"],
  },
  {
    key: "header.accreditations",
    cardKey: "hospitalHeader",
    name: "Accreditation Badges (NABH / ISO / NABL)",
    section: "Hospital Letterhead",
    rowId: "h_row4",
    rowName: "Header Accreditations",
    siblings: [],
  },

  // ── Ticket Header & Barcode Banner ──
  {
    key: "ticket.title",
    cardKey: "ticketHeader",
    name: "Document Main Title (IPD Admission Ticket)",
    section: "Ticket Header & Barcode",
    rowId: "t_row1",
    rowName: "Ticket Banner Line",
    siblings: ["ticket.copyBadge", "ticket.barcode"],
  },
  {
    key: "ticket.copyBadge",
    cardKey: "ticketHeader",
    name: "Copy Type Badge (ORIGINAL FOR PATIENT)",
    section: "Ticket Header & Barcode",
    rowId: "t_row1",
    rowName: "Ticket Banner Line",
    siblings: ["ticket.title", "ticket.barcode"],
  },
  {
    key: "ticket.barcode",
    cardKey: "ticketHeader",
    name: "UHID Barcode & Admission Tag",
    section: "Ticket Header & Barcode",
    rowId: "t_row1",
    rowName: "Ticket Banner Line",
    siblings: ["ticket.title", "ticket.copyBadge"],
  },
  // ── Patient Demographics Fields ──
  {
    key: "patient.name",
    cardKey: "patientCard",
    name: "Patient Full Name",
    section: "Patient Demographics",
    rowId: "p_row1",
    rowName: "Demographics Row 1",
    siblings: ["patient.uhid", "patient.ageGender"],
  },
  {
    key: "patient.uhid",
    cardKey: "patientCard",
    name: "Patient UHID No.",
    section: "Patient Demographics",
    rowId: "p_row1",
    rowName: "Demographics Row 1",
    siblings: ["patient.name", "patient.ageGender"],
  },
  {
    key: "patient.ageGender",
    cardKey: "patientCard",
    name: "Age / Gender",
    section: "Patient Demographics",
    rowId: "p_row1",
    rowName: "Demographics Row 1",
    siblings: ["patient.name", "patient.uhid"],
  },
  {
    key: "patient.mobile",
    cardKey: "patientCard",
    name: "Contact Phone",
    section: "Patient Demographics",
    rowId: "p_row2",
    rowName: "Demographics Row 2",
    siblings: ["patient.bloodGroup", "patient.guardian"],
  },
  {
    key: "patient.bloodGroup",
    cardKey: "patientCard",
    name: "Blood Group Badge",
    section: "Patient Demographics",
    rowId: "p_row2",
    rowName: "Demographics Row 2",
    siblings: ["patient.mobile", "patient.guardian"],
  },
  {
    key: "patient.guardian",
    cardKey: "patientCard",
    name: "Guardian / Attendant & Relation",
    section: "Patient Demographics",
    rowId: "p_row2",
    rowName: "Demographics Row 2",
    siblings: ["patient.mobile", "patient.bloodGroup"],
  },
  {
    key: "patient.address",
    cardKey: "patientCard",
    name: "Full Residential Address",
    section: "Patient Demographics",
    rowId: "p_row3",
    rowName: "Demographics Row 3",
    siblings: [],
  },

  // ── Clinical & Admission Target Fields (All 9 covered) ──
  {
    key: "admission.admissionType",
    cardKey: "admissionCard",
    name: "Admission Type Badge",
    section: "Clinical Admission",
    rowId: "adm_row1",
    rowName: "Admission Row 1",
    siblings: ["admission.admissionDate", "admission.department"],
  },
  {
    key: "admission.admissionDate",
    cardKey: "admissionCard",
    name: "Admission Date & Time",
    section: "Clinical Admission",
    rowId: "adm_row1",
    rowName: "Admission Row 1",
    siblings: ["admission.admissionType", "admission.department"],
  },
  {
    key: "admission.department",
    cardKey: "admissionCard",
    name: "Admitting Department",
    section: "Clinical Admission",
    rowId: "adm_row1",
    rowName: "Admission Row 1",
    siblings: ["admission.admissionType", "admission.admissionDate"],
  },
  {
    key: "admission.doctor",
    cardKey: "admissionCard",
    name: "Treating Doctor / Consultant",
    section: "Clinical Admission",
    rowId: "adm_row2",
    rowName: "Admission Row 2",
    siblings: ["admission.duration", "admission.bedAllotted"],
  },
  {
    key: "admission.duration",
    cardKey: "admissionCard",
    name: "Duration of Problem / Stay",
    section: "Clinical Admission",
    rowId: "adm_row2",
    rowName: "Admission Row 2",
    siblings: ["admission.doctor", "admission.bedAllotted"],
  },
  {
    key: "admission.bedAllotted",
    cardKey: "admissionCard",
    name: "Bed Allotted & Ward Box",
    section: "Clinical Admission",
    rowId: "adm_row2",
    rowName: "Admission Row 2",
    siblings: ["admission.doctor", "admission.duration"],
  },
  {
    key: "admission.patientProblem",
    cardKey: "admissionCard",
    name: "Patient Problem / Complaints Box",
    section: "Clinical Admission",
    rowId: "adm_row3",
    rowName: "Admission Row 3",
    siblings: [],
  },
  {
    key: "admission.provisionalDiagnosis",
    cardKey: "admissionCard",
    name: "Provisional Clinical Diagnosis",
    section: "Clinical Admission",
    rowId: "adm_row4",
    rowName: "Admission Row 4",
    siblings: ["admission.referredBy"],
  },
  {
    key: "admission.referredBy",
    cardKey: "admissionCard",
    name: "Referred By Counter",
    section: "Clinical Admission",
    rowId: "adm_row4",
    rowName: "Admission Row 4",
    siblings: ["admission.provisionalDiagnosis"],
  },

  // ── Financial Particulars ──
  {
    key: "financial.registrationFee",
    cardKey: "financialCard",
    name: "IPD Registration Fee",
    section: "Admission Fee & Deposit",
    rowId: "fin_row1",
    rowName: "Fee Row 1",
    siblings: ["financial.advancePayment", "financial.paymentMode"],
  },
  {
    key: "financial.advancePayment",
    cardKey: "financialCard",
    name: "Initial Advance Deposit",
    section: "Admission Fee & Deposit",
    rowId: "fin_row1",
    rowName: "Fee Row 1",
    siblings: ["financial.registrationFee", "financial.paymentMode"],
  },
  {
    key: "financial.paymentMode",
    cardKey: "financialCard",
    name: "Payment Mode (Cash/UPI)",
    section: "Admission Fee & Deposit",
    rowId: "fin_row1",
    rowName: "Fee Row 1",
    siblings: ["financial.registrationFee", "financial.advancePayment"],
  },
  {
    key: "financial.receiptNo",
    cardKey: "financialCard",
    name: "Receipt / Txn Reference",
    section: "Admission Fee & Deposit",
    rowId: "fin_row2",
    rowName: "Fee Row 2",
    siblings: ["financial.amountInWords"],
  },
  {
    key: "financial.amountInWords",
    cardKey: "financialCard",
    name: "Amount in Words",
    section: "Admission Fee & Deposit",
    rowId: "fin_row2",
    rowName: "Fee Row 2",
    siblings: ["financial.receiptNo"],
  },
];

export const COLOR_PALETTES = {
  emerald: {
    name: "Clinical Emerald (Inpatient Green)",
    primary: "#064e3b",
    accent: "#059669",
    border: "#a7f3d0",
    headerBg: "#ecfdf5",
    text: "#0f172a",
  },
  navy: {
    name: "Executive Navy (Hospital Premier)",
    primary: "#0f2e5a",
    accent: "#0284c7",
    border: "#cbd5e1",
    headerBg: "#f1f5f9",
    text: "#17263b",
  },
  indigo: {
    name: "Royal Indigo (Tertiary Care)",
    primary: "#312e81",
    accent: "#4f46e5",
    border: "#c7d2fe",
    headerBg: "#eef2ff",
    text: "#0f172a",
  },
  slate: {
    name: "Medical Slate (Neutral Minimal)",
    primary: "#1e293b",
    accent: "#0284c7",
    border: "#e2e8f0",
    headerBg: "#f8fafc",
    text: "#0f172a",
  },
  ruby: {
    name: "Ruby Care (Emergency & Trauma)",
    primary: "#881337",
    accent: "#e11d48",
    border: "#fecdd3",
    headerBg: "#fff1f2",
    text: "#1c1917",
  },
  amber: {
    name: "Warm Amber (Clinical Gold)",
    primary: "#78350f",
    accent: "#d97706",
    border: "#fde68a",
    headerBg: "#fffbeb",
    text: "#1f2937",
  },
};

export const DEFAULT_IPD_ADMISSION_SETTINGS = {
  // 1. Hospital Letterhead
  hospital: {
    name: "Narayan Hospital",
    subtitle: "NABH & NABL ACCREDITED TERTIARY CARE HOSPITAL & RESEARCH INSTITUTE",
    slogan: "Better Care. Healthier Tomorrow.",
    registrationNo: "REG/UP/2024/098",
    address: "Sector 4, Central Hospital Road, Jaipur - 302020 (Rajasthan)",
    phone: "+91 7388660408",
    emergencyPhone: "+91 9811223344",
    email: "admissions@narayanhospital.com",
    website: "www.narayanhospital.com",
    logoUrl: "/images/Narayan_Logo.png",
    logoHeight: 48,
    logoPosition: "left", // 'left' | 'center' | 'right'
    textAlign: "left", // 'left' | 'center' | 'right'
    headerLayout: "standard", // 'standard' | 'centered' | 'split'
    showLogo: true,
    accreditations: ["NABH ACCREDITED", "ISO 9001:2015", "NABL CERTIFIED LABS"],
    showAccreditationBadges: true,
  },

  // 2. Ticket Header & Classification
  header: {
    title: "IPD ADMISSION TICKET",
    subTitle: "Inpatient Encounter & Bed Allotment Slip",
    copyType: "ORIGINAL FOR PATIENT",
    showCopyBadge: true,
    showLogo: true,
    showBarcode: true,
    showQRCode: true,
    showTopUHID: true,
    showTopAdmissionNo: true,
    showTimestamp: true,
  },

  // 3. Page Geometry (Strict Single-Page Guarantee)
  page: {
    size: "A4",
    orientation: "portrait",
    margin: 6,
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 10,
    showWatermark: false,
    watermarkText: "ADMISSION TICKET",
  },

  // 4. Patient Demographics Fields
  patient: {
    enabled: true,
    title: "PATIENT DEMOGRAPHICS",
    fields: {
      name: field("Patient Name"),
      uhid: field("UHID No."),
      ageGender: field("Age / Gender"),
      mobile: field("Contact / Phone"),
      address: field("Patient Address"),
      bloodGroup: field("Blood Group"),
      guardian: field("Guardian / Attendant"),
      relation: field("Relation"),
      payer: field("Payer / Category", false),
      policyNo: field("Policy / Card No.", false),
    },
  },

  // 5. Clinical & Admission Details
  admission: {
    enabled: true,
    title: "CLINICAL ADMISSION & WARD RECORD",
    fields: {
      admissionType: field("Admission Type / Category"),
      admissionDate: field("Date & Time of Admission"),
      department: field("Admitting Department"),
      doctor: field("Treating Consultant / Doctor"),
      patientProblem: field("Patient Problem / Chief Complaints"),
      duration: field("Duration of Problem / Stay"),
      bedAllotted: field("Allotted Bed / Ward / Room"),
      provisionalDiagnosis: field("Provisional Clinical Diagnosis"),
      referredBy: field("Referred By", false),
      mlcCase: field("Medico-Legal Case (MLC)", false),
    },
  },

  // 6. Registration Fee & Advance Deposit
  financial: {
    enabled: true,
    title: "ADMISSION FEE & ADVANCE DEPOSIT",
    fields: {
      registrationFee: field("IPD Registration Fee"),
      advancePayment: field("Initial Advance Deposit"),
      paymentMode: field("Payment Mode"),
      receiptNo: field("Advance Receipt / Txn No."),
      amountInWords: field("Amount in Words"),
    },
  },

  // 7. Terms & Conditions Metadata
  terms: {
    enabled: true,
    title: "INPATIENT ADMISSION TERMS & HOSPITAL RULES",
    items: [
      "Please keep this admission ticket safe until discharge reconciliation.",
      "Only one attendant pass is issued with this admission ticket for ward/room entry.",
      "Visiting hours are strictly 04:00 PM to 06:00 PM. Children under 12 are not permitted in ICU/wards.",
      "Hospital management is not responsible for any personal cash, jewelry, or valuables kept in patient rooms.",
      "Initial advance deposit will be adjusted in the final IPD billing invoice at discharge.",
    ],
    footerTagline: "NARAYAN HOSPITAL • Sector 4, Hospital Road, Jaipur - 302020 • 24x7 Emergency: +91 9811223344",
    disclaimer: "Wishing you a comfortable stay and a healthy, speedy recovery.",
  },

  // 8. Signatures & Official Stamp
  signatures: {
    enabled: true,
    showDoctor: true,
    doctorTitle: "Treating Consultant",
    doctorSub: "Admitting Physician",
    showNurse: true,
    nurseTitle: "Duty Nursing Officer",
    nurseSub: "Ward Incharge",
    showAttendant: true,
    attendantTitle: "Patient / Attendant Signature",
    attendantSub: "Consent & Acknowledgment",
    showStamp: true,
    stampTitle: "ADMISSION DESK STAMP",
  },

  // 9. Card-Level Element Styles
  elementStyles: {
    hospitalHeader: {
      offsetY: 0,
      offsetX: 0,
      fontSize: 13,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "700",
      borderWidth: 1,
      borderRadius: 8,
      borderColor: "#cbd5e1",
      bgMode: "gradient",
      bgColor: "#ffffff",
      bgGradientEnd: "#f8fafc",
      bgGradientAngle: 135,
      textColor: "#0f172a",
      show: true,
    },
    ticketHeader: {
      offsetY: 0,
      offsetX: 0,
      fontSize: 12,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "700",
      borderWidth: 1,
      borderRadius: 8,
      borderColor: "#86efac",
      bgMode: "gradient",
      bgColor: "#ecfdf5",
      bgGradientEnd: "#d1fae5",
      bgGradientAngle: 90,
      textColor: "#064e3b",
      show: true,
    },
    patientCard: {
      offsetY: 0,
      offsetX: 0,
      fontSize: 11,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "600",
      borderWidth: 1,
      borderRadius: 8,
      borderColor: "#e2e8f0",
      bgMode: "solid",
      bgColor: "#ffffff",
      bgGradientEnd: "#f8fafc",
      bgGradientAngle: 135,
      textColor: "#1e293b",
      show: true,
    },
    admissionCard: {
      offsetY: 0,
      offsetX: 0,
      fontSize: 11,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "600",
      borderWidth: 1,
      borderRadius: 8,
      borderColor: "#e2e8f0",
      bgMode: "solid",
      bgColor: "#ffffff",
      bgGradientEnd: "#f8fafc",
      bgGradientAngle: 135,
      textColor: "#1e293b",
      show: true,
    },
    financialCard: {
      offsetY: 0,
      offsetX: 0,
      fontSize: 11,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "600",
      borderWidth: 1.5,
      borderRadius: 8,
      borderColor: "#86efac",
      bgMode: "gradient",
      bgColor: "#f0fdf4",
      bgGradientEnd: "#dcfce7",
      bgGradientAngle: 135,
      textColor: "#14532d",
      show: true,
    },
    termsCard: {
      offsetY: 0,
      offsetX: 0,
      fontSize: 9.5,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "500",
      borderWidth: 1,
      borderRadius: 6,
      borderColor: "#e2e8f0",
      bgMode: "solid",
      bgColor: "#f8fafc",
      bgGradientEnd: "#f1f5f9",
      bgGradientAngle: 135,
      textColor: "#475569",
      show: true,
    },
    signaturesCard: {
      offsetY: 0,
      offsetX: 0,
      fontSize: 10,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "600",
      borderWidth: 0,
      borderRadius: 0,
      borderColor: "transparent",
      bgMode: "solid",
      bgColor: "transparent",
      bgGradientEnd: "#ffffff",
      bgGradientAngle: 135,
      textColor: "#1e293b",
      show: true,
    },
  },

  // 10. Granular Field-Level Style Overrides (Horizontal Sync & Micro-alignment)
  fieldStyles: {},
};

export const SAMPLE_IPD_ADMISSION_DATA = {
  admissionType: "Emergency / Urgent",
  admissionDate: "04 Nov 2026, 11:30 AM",
  department: "General Medicine & Critical Care",
  doctor: "Dr. Adeesh Singh (MD, FICP)",
  patientProblem: "Severe Acute Abdominal Pain, High Grade Pyrexia with Recurrent Vomiting",
  duration: "3 Days",
  bedAllotted: "ICU Bed #04 (Floor 2 - Intensive Care Unit)",
  registrationFee: 500,
  advancePayment: 10000,
  provisionalDiagnosis: "Acute Cholecystitis / Peritonitis Under Inpatient Observation",
  referredBy: "Self / Dr. R. K. Sharma (OPD Counter)",
  mlcCase: "No (Non-Accidental)",
  paymentMode: "UPI / Digital Transfer (GPay / PhonePe)",
  receiptNo: "RCP-IPD-2026-0891",
  amountInWords: "Ten Thousand Five Hundred Rupees Only",
  uhid: "UHID-2026-004481",
  ipdNo: "IPD-26-0198",
  patientName: "Ramesh Chandra Sharma",
  ageGender: "48 Yrs / Male",
  mobile: "+91 98765 43210",
  address: "Plot 42, Gayatri Nagar, Hospital Road, Jaipur, Rajasthan - 302020",
  bloodGroup: "B Positive (B+)",
  guardian: "Sunita Sharma",
  relation: "Wife / Next of Kin",
  payer: "Self / Private Inpatient",
  policyNo: "N/A",
};

export function mergeIPDAdmissionSettings(target, source) {
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
        result[key] = mergeIPDAdmissionSettings(target[key], val);
      } else {
        result[key] = val;
      }
    }
  }

  return result;
}

export function cloneIPDAdmissionSettings(settings) {
  return JSON.parse(JSON.stringify(settings));
}
