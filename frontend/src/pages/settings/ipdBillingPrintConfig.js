/**
 * IPD Billing Slip & Inpatient Tax Invoice print configuration.
 * Persisted under key: print_slip_ipd_bill
 */
export const IPD_BILLING_SETTINGS_KEY = "print_slip_ipd_bill";

const field = (label, show = true) => ({ label, show });

export const DEFAULT_IPD_BILLING_SETTINGS = {
  // Hospital Letterhead & Brand Identity
  hospital: {
    name: "Narayan Hospital",
    subtitle: "NABH & NABL ACCREDITED TERTIARY CARE HOSPITAL & RESEARCH INSTITUTE",
    registrationNo: "REG/UP/2024/098",
    address: "Sector 4, Central Hospital Road, Jaipur - 302020 (Rajasthan)",
    phone: "+91 7388660408 / +91 9811223344",
    email: "billing@narayanhospital.com",
    website: "www.narayanhospital.com",
    logoUrl: "/images/Narayan_Logo.png",
    logoHeight: 52,
    logoPosition: "left", // 'left' | 'center' | 'right'
    letterheadMode: "full", // 'full' (print hospital header) | 'stationery' (leave blank margin for pre-printed letterhead)
    stationeryTopMargin: 45, // in mm for pre-printed paper
    accreditations: ["NABH ACCREDITED", "NABL CERTIFIED LABS", "ISO 9001:2015"],
    showAccreditationBadges: true,
  },

  // Document Classification & Header
  header: {
    title: "INPATIENT ADMISSION & FINAL TAX INVOICE",
    subTitle: "Tax Invoice Issued Under Section 31 of CGST Act 2017 & Hospital Regulatory Bylaws",
    badgeLabel: "TAX INVOICE & ADM SLIP",
    copyType: "ORIGINAL FOR RECIPIENT", // 'ORIGINAL FOR RECIPIENT' | 'DUPLICATE FOR HOSPITAL' | 'TRIPLICATE FOR TPA' | 'PATIENT RECORD'
    showCopyBadge: true,
    showLogo: true,
    showBarcode: true,
    showQRCode: true,
    showTaxBox: true,
    showTopUHID: true,
    showTopAdmissionNo: true,
  },

  // GST & Compliance Settings
  gst: {
    enabled: true,
    mode: "exempt", // 'exempt' (0% healthcare exemption) | 'taxable' (standard/composite) | 'item_wise'
    taxRate: 0, // overall default GST % (0, 5, 12, 18)
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    isInterState: false, // if true, uses IGST instead of CGST+SGST
    showTaxTable: true, // detailed HSN/SAC GST breakdown table
    roomRentGstEnabled: true, // applies 5% GST on non-ICU room rents exceeding ₹5,000/day as per GST rules
    hospitalGstin: "08AAACN1234F1Z8",
    hospitalPan: "AAACN1234F",
    stateName: "Rajasthan",
    stateCode: "08",
    cin: "U85110RJ2024PTC123456",
    defaultSacCode: "999311 (Inpatient Healthcare)",
    reverseCharge: "No",
    placeOfSupply: "08 - Rajasthan",
    exemptionNotification: "Healthcare services are exempted from GST vide Notification No. 12/2017-Central Tax (Rate) Serial No. 74.",
  },

  // Page Geometry & Appearance
  page: {
    size: "A4", // 'A4' | 'A5' | 'Thermal' | 'Letter'
    orientation: "portrait", // 'portrait' | 'landscape'
    margin: 8,
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: 10,
    compact: false,
    showPageNumber: true,
    showGeneratedAt: true,
    showWatermark: false,
    watermarkText: "TAX INVOICE",
    watermarkOpacity: 0.05,
    roundOffToRupee: true, // auto round off total amount to nearest integer rupee
  },

  // Styling & Color Palettes
  style: {
    theme: "navy", // 'navy' | 'emerald' | 'slate' | 'monochrome'
    primary: "#0f2e5a",
    accent: "#0284c7",
    text: "#17263b",
    muted: "#64748b",
    border: "#cbd5e1",
    headerBg: "#f1f5f9",
    zebraStriping: true,
  },

  // Patient Demographics Fields
  patient: {
    enabled: true,
    title: "PATIENT DEMOGRAPHICS",
    fields: {
      name: field("Patient Name"),
      uhid: field("Patient UHID"),
      ageGender: field("Age / Gender"),
      mobile: field("Contact / Phone"),
      address: field("Patient Address"),
      bloodGroup: field("Blood Group"),
      guardian: field("Guardian / Attendant"),
      relation: field("Relation"),
      payer: field("Payer / TPA Sponsor", false),
      corporate: field("Corporate / Employer", false),
      policyNo: field("Policy / Card No.", false),
      claimNo: field("Claim / Pre-Auth No.", false),
      patientGstin: field("Patient / Corporate GSTIN", false),
    },
  },

  // Admission & Clinical Records Fields
  admission: {
    enabled: true,
    title: "INPATIENT ADMISSION & VISIT RECORD",
    fields: {
      invoiceNo: field("Invoice / Bill No."),
      invoiceDate: field("Invoice Date"),
      admissionNo: field("IPD Admission No."),
      admissionDate: field("Date & Time of Admission"),
      dischargeDate: field("Date of Discharge / Status"),
      stay: field("Length of Stay (LOS)"),
      wardBed: field("Ward / Bed No."),
      consultant: field("Attending Consultant"),
      consultantQual: field("Doctor Qualification", false),
      department: field("Specialty / Department"),
      referredBy: field("Referred By"),
      diagnosis: field("Primary Clinical Diagnosis"),
      dischargeCondition: field("Condition at Discharge", false),
    },
  },

  // Itemized Charges Table
  charges: {
    enabled: true,
    title: "ITEMIZED INPATIENT CHARGES & SERVICE BREAKDOWN",
    groupByDepartment: true, // Group by department / category for hospital-grade presentation
    showDepartmentTotals: true, // Subtotal per department group
    showDepartmentSummary: true, // Summary badges at top of table
    showDiscountsBreakdown: true, // Concession chips beneath item
    showHsnSac: true, // HSN/SAC code column
    showUnitRate: true,
    columns: {
      sr: { label: "#", show: true, width: "4%" },
      date: { label: "DATE", show: true, width: "11%" },
      department: { label: "DEPARTMENT", show: false, width: "15%" },
      code: { label: "HSN / SAC", show: true, width: "10%" },
      description: { label: "PARTICULARS / SERVICE / MEDICINE DESCRIPTION", show: true, width: "40%" },
      qty: { label: "QTY", show: true, width: "6%" },
      rate: { label: "RATE (₹)", show: true, width: "11%" },
      discount: { label: "DISC (₹)", show: true, width: "9%" },
      amount: { label: "NET (₹)", show: true, width: "13%" },
    },
  },

  // Settlement, Ledger & Totals
  settlement: {
    enabled: true,
    title: "SETTLEMENT RECONCILIATION & TOTALS",
    showAmountInWords: true,
    showPaymentBreakdown: true,
    showPaymentReceiptsTable: true,
    showGSTBreakupCard: true,
    showRoundOff: true,
    showOfficialStamp: true,
    stampStyle: "circular", // 'circular' | 'rectangular' | 'badge'
    stampTextPaid: "✓ PAID & SETTLED IN FULL",
    stampTextDue: "⚠ BALANCE PAYABLE",
    stampTextExcess: "★ EXCESS ADVANCE CREDIT",
  },

  // Bank & UPI Payment Details
  bankDetails: {
    show: true,
    title: "HOSPITAL BANK & UPI REMITTANCE DETAILS",
    bankName: "State Bank of India",
    accountName: "Narayan Multispeciality Hospital Pvt Ltd",
    accountNo: "3988220019234",
    ifsc: "SBIN0001234",
    branch: "Central Hospital Road, Jaipur",
    upiId: "narayan.hospital@sbi",
    showUpiQr: true, // generates instant UPI QR code when balance is due
  },

  // Signatures & Legal Declarations
  signatures: {
    enabled: true,
    showCashier: true,
    cashierTitle: "Billing Cashier",
    cashierSub: "Narayan HIMS Counter",
    showAccounts: true,
    accountsTitle: "Accounts Officer",
    accountsSub: "Audit & Reconciliation",
    showDoctor: false,
    doctorTitle: "Treating Consultant",
    doctorSub: "Department Incharge",
    showPatient: true,
    patientTitle: "Patient / Attendant Signature",
    patientSub: "Received Bills, Drugs & Reports",
    showSuperintendent: true,
    superintendentTitle: "Medical Superintendent",
    superintendentSub: "Authorized Signatory",
    patientDeclaration: "I hereby confirm that I have received all inpatient services, drugs, consumables, and original investigation reports as billed. All queries and charges have been clearly explained and verified.",
  },

  // Terms & Conditions, Disclaimer & Footer
  terms: {
    enabled: true,
    title: "TERMS & CONDITIONS",
    items: [
      "This is an authenticated computer-generated Inpatient Tax Invoice issued in compliance with GST Act and Hospital Bylaws.",
      "Medicines, surgical consumables, and implants billed strictly as per approved Hospital Formulary / NPPA capped rates.",
      "In case of any billing clarifications or dispute, kindly present this slip at Inpatient Accounts Desk within 7 working days.",
      "Healthcare services provided by clinical establishments to inpatients are exempt from GST under Notification No. 12/2017-CT(Rate) Sl. 74.",
      "Cheques are subject to realization. Online payments via UPI / NEFT should be referenced with the IPD Admission Number.",
    ],
    footerTagline: "NARAYAN HOSPITAL • Sector 4, Hospital Road, Jaipur - 302020 • 24x7 Emergency: +91 9811223344",
    disclaimer: "Thank you for choosing Narayan Hospital. Wishing you a healthy and speedy recovery.",
  },
};

export const COLOR_PALETTES = {
  navy: {
    name: "Executive Navy (Hospital Premier)",
    primary: "#0f2e5a",
    accent: "#0284c7",
    text: "#17263b",
    muted: "#64748b",
    border: "#cbd5e1",
    headerBg: "#f1f5f9",
  },
  emerald: {
    name: "Emerald Clinical (Healthcare Green)",
    primary: "#064e3b",
    accent: "#059669",
    text: "#0f172a",
    muted: "#475569",
    border: "#a7f3d0",
    headerBg: "#ecfdf5",
  },
  slate: {
    name: "Royal Slate (Corporate Minimalist)",
    primary: "#1e293b",
    accent: "#4f46e5",
    text: "#0f172a",
    muted: "#64748b",
    border: "#cbd5e1",
    headerBg: "#f8fafc",
  },
  monochrome: {
    name: "High-Contrast Monochrome (Ink Saver)",
    primary: "#111827",
    accent: "#374151",
    text: "#000000",
    muted: "#4b5563",
    border: "#9ca3af",
    headerBg: "#f3f4f6",
  },
};

export const PRESETS = {
  standard: {
    name: "Standard Inpatient Tax Invoice (NABH Compliant)",
    description: "Official NABH/NABL hospital tax invoice with department grouping, payment audit, and status stamp.",
    apply: (curr) => ({
      ...curr,
      hospital: { ...curr.hospital, letterheadMode: "full" },
      page: { ...curr.page, compact: false, size: "A4" },
      charges: { ...curr.charges, groupByDepartment: true, showDepartmentTotals: true, showDepartmentSummary: true },
      gst: { ...curr.gst, mode: "exempt", showTaxTable: true },
      settlement: { ...curr.settlement, showPaymentReceiptsTable: true, showPaymentBreakdown: true },
      bankDetails: { ...curr.bankDetails, show: true },
    }),
  },
  taxable_gst: {
    name: "GST Taxable Invoice with Full HSN/SAC Breakup",
    description: "Configured for taxable supplies (deluxe room rents, pharmacy, aesthetic) with CGST, SGST, IGST columns.",
    apply: (curr) => ({
      ...curr,
      gst: {
        ...curr.gst,
        mode: "taxable",
        taxRate: 5,
        cgstRate: 2.5,
        sgstRate: 2.5,
        showTaxTable: true,
      },
      charges: {
        ...curr.charges,
        groupByDepartment: true,
        showHsnSac: true,
        columns: {
          ...curr.charges.columns,
          code: { label: "HSN / SAC", show: true, width: "10%" },
        },
      },
    }),
  },
  tpa: {
    name: "Corporate & Insurance / TPA Claim Dossier",
    description: "Includes TPA policy, claim pre-auth, corporate name, HSN codes, and patient declaration for insurance claims.",
    apply: (curr) => ({
      ...curr,
      header: { ...curr.header, copyType: "TRIPLICATE FOR TPA / INSURANCE" },
      patient: {
        ...curr.patient,
        fields: {
          ...curr.patient.fields,
          payer: { label: "Payer / TPA Sponsor", show: true },
          corporate: { label: "Corporate / Employer", show: true },
          policyNo: { label: "Policy / Member ID", show: true },
          claimNo: { label: "Pre-Auth / Claim Approval No.", show: true },
          patientGstin: { label: "Corporate GSTIN", show: true },
        },
      },
      admission: {
        ...curr.admission,
        fields: {
          ...curr.admission.fields,
          diagnosis: { label: "Primary Clinical Diagnosis", show: true },
          dischargeCondition: { label: "Condition at Discharge", show: true },
        },
      },
      charges: {
        ...curr.charges,
        groupByDepartment: true,
        showHsnSac: true,
        columns: {
          ...curr.charges.columns,
          code: { label: "HSN / SAC", show: true, width: "10%" },
        },
      },
      signatures: {
        ...curr.signatures,
        showDoctor: true,
        showPatient: true,
      },
    }),
  },
  stationery: {
    name: "Pre-printed Hospital Stationery Mode",
    description: "Leaves a 45mm top blank margin to print directly on physical pre-printed hospital letterhead paper.",
    apply: (curr) => ({
      ...curr,
      hospital: {
        ...curr.hospital,
        letterheadMode: "stationery",
        stationeryTopMargin: 45,
      },
      header: {
        ...curr.header,
        showLogo: false,
      },
    }),
  },
  compact: {
    name: "Compact Summary Invoice (Ink & Paper Saver)",
    description: "Single-sheet compact invoice with tightened padding and condensed rows.",
    apply: (curr) => ({
      ...curr,
      page: { ...curr.page, compact: true, size: "A4", fontSize: 9 },
      charges: { ...curr.charges, groupByDepartment: false, showDepartmentSummary: false },
      settlement: { ...curr.settlement, showPaymentReceiptsTable: false, showPaymentBreakdown: true },
      bankDetails: { ...curr.bankDetails, show: false },
    }),
  },
};

export const SAMPLE_IPD_BILLING_DATA = {
  generatedAt: "31 Oct 2026, 03:49 PM",
  invoiceNo: "INV-ADM-26-0024",
  invoiceDate: "31 Oct 2026",
  copyType: "ORIGINAL FOR RECIPIENT",
  patient: {
    name: "Tony Stark",
    uhid: "1026-0104",
    age: "46 Years",
    gender: "Male",
    mobile: "+91 8467931976",
    address: "Plot 104, Civil Lines, Varanasi, Uttar Pradesh - 221002",
    bloodGroup: "B+",
    guardian: "Pepper Potts",
    relation: "Spouse",
    payer: "Star Health & Allied Insurance Co.",
    corporate: "Stark Industries India Ltd.",
    policyNo: "POL-SH-2026-88194",
    claimNo: "CL-STAR-IPD-09214",
    patientGstin: "09AAACS9988P1Z5",
  },
  admission: {
    admissionNo: "ADM-26-0024",
    admissionDate: "30 Oct 2026, 01:01 PM",
    dischargeDate: "31 Oct 2026, 11:54 AM",
    stay: "1 Day (23 Hours)",
    ward: "Semi-Private Surgical Ward",
    bed: "SP-202-A",
    consultant: "Dr. Rajesh Varma",
    consultantQual: "MBBS, MD (Medicine), DM (Cardiology)",
    department: "General Medicine & Inpatient Care",
    referredBy: "Dr. Adeesh Singh (Senior Consultant)",
    diagnosis: "Acute Febrile Illness with Mild Dehydration (ICD-10: A90)",
    dischargeCondition: "Clinically Stable & Asymptomatic",
  },
  items: [
    {
      id: "1",
      date: "30 Oct 2026",
      department: "Bed & Room Charges",
      code: "999311",
      name: "Semi-Private Ward Bed Charges (Day 1)",
      qty: 1,
      rate: 2500,
      discount: 0,
      amount: 2500,
    },
    {
      id: "2",
      date: "30 Oct 2026",
      department: "Consultations & Doctor Visits",
      code: "999312",
      name: "Inpatient Senior Consultant Rounds (Dr. Rajesh Varma)",
      qty: 2,
      rate: 800,
      discount: 0,
      amount: 1600,
    },
    {
      id: "3",
      date: "30 Oct 2026",
      department: "Pharmacy & Consumables",
      code: "3004",
      name: "Inj. Ceftriaxone 1g IV + Infusion Set & Cannula",
      qty: 3,
      rate: 350,
      discount: 150,
      discountReason: "Hospital Staff Concession",
      referredBy: "Dr. Rajesh Varma",
      amount: 900,
    },
    {
      id: "4",
      date: "31 Oct 2026",
      department: "Laboratory & Pathology",
      code: "999316",
      name: "Complete Blood Count (CBC) + ESR",
      qty: 1,
      rate: 650,
      discount: 0,
      amount: 650,
    },
    {
      id: "5",
      date: "31 Oct 2026",
      department: "Radiology & Imaging",
      code: "999317",
      name: "Chest X-Ray PA View (Digital Bedside)",
      qty: 1,
      rate: 750,
      discount: 0,
      amount: 750,
    },
  ],
  departmentSummaries: [
    { label: "🛏️ Bed & Room Charges", amount: 2500 },
    { label: "🩺 Doctor Visits", amount: 1600 },
    { label: "💊 Pharmacy & Consumables", amount: 900 },
    { label: "🧪 Diagnostics & Radiology", amount: 1400 },
  ],
  totals: {
    grossCharges: 6550,
    concessions: 150,
    taxableAmount: 6400,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTax: 0,
    roundOff: 0,
    netBillable: 6400,
    advancePaid: 5000,
    interimPaid: 1400,
    totalPaid: 6400,
    balanceDue: 0,
    excessAdvance: 0,
    settlementStatus: "CLEARED", // 'CLEARED' | 'DUE' | 'EXCESS'
    amountInWords: "Rupees Six Thousand Four Hundred Only",
  },
  gstBreakdown: [
    {
      sac: "999311",
      description: "Inpatient Healthcare Services",
      taxable: 5750,
      cgstRate: 0,
      cgst: 0,
      sgstRate: 0,
      sgst: 0,
      igstRate: 0,
      igst: 0,
      totalTax: 0,
    },
    {
      sac: "3004",
      description: "Medicaments / Inpatient Consumables",
      taxable: 650,
      cgstRate: 0,
      cgst: 0,
      sgstRate: 0,
      sgst: 0,
      igstRate: 0,
      igst: 0,
      totalTax: 0,
    },
  ],
  payments: [
    {
      receiptNo: "REC-26-0041",
      date: "30 Oct 2026, 01:15 PM",
      mode: "Cash Handover",
      type: "Initial Admission Advance",
      amount: 5000,
      collectedBy: "Adeesh (Counter 1)",
    },
    {
      receiptNo: "REC-26-0078",
      date: "31 Oct 2026, 11:30 AM",
      mode: "UPI (Google Pay)",
      type: "Final Bill Settlement",
      amount: 1400,
      collectedBy: "Admin Cashier",
    },
  ],
};

export function cloneIPDBillingSettings(value) {
  return JSON.parse(JSON.stringify(value));
}

export function mergeIPDBillingSettings(base, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return base;
  const result = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      result[key] = mergeIPDBillingSettings(base[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function numberToWords(amount) {
  const num = Math.round(Number(amount || 0));
  if (num === 0) return "Rupees Zero Only";

  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ",
    "Seventeen ", "Eighteen ", "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return "Overflow";
    const nArr = ("000000000" + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArr) return "";
    let str = "";
    str += Number(nArr[1]) !== 0 ? (a[Number(nArr[1])] || b[nArr[1][0]] + " " + a[nArr[1][1]]) + "Crore " : "";
    str += Number(nArr[2]) !== 0 ? (a[Number(nArr[2])] || b[nArr[2][0]] + " " + a[nArr[2][1]]) + "Lakh " : "";
    str += Number(nArr[3]) !== 0 ? (a[Number(nArr[3])] || b[nArr[3][0]] + " " + a[nArr[3][1]]) + "Thousand " : "";
    str += Number(nArr[4]) !== 0 ? (a[Number(nArr[4])] || b[nArr[4][0]] + " " + a[nArr[4][1]]) + "Hundred " : "";
    str += Number(nArr[5]) !== 0 ? (str !== "" ? "and " : "") + (a[Number(nArr[5])] || b[nArr[5][0]] + " " + a[nArr[5][1]]) : "";
    return str.trim();
  }

  return `Rupees ${inWords(num)} Only`;
}

/**
 * Adapter mapping live IPDBilling state to the billing slip payload contract.
 */
export function mapPatientToBillingPayload(patient = {}, billItems = [], payments = [], summary = {}) {
  const items = (billItems || []).map((item, idx) => ({
    id: item.id || String(idx + 1),
    date: item.date || item.created_at || patient.admissionDate || "—",
    department: item.category || item.department || "General Charges",
    code: item.code || item.hsn_sac || (item.category === "Medicines" ? "3004" : "999311"),
    name: item.name || item.particular || "Inpatient Service",
    qty: Number(item.qty || item.quantity || 1),
    rate: Number(item.rate || item.unitPrice || 0),
    discount: Number(item.discountAmount || item.discount || 0),
    discountReason: item.discountReason || item.discountReference || "",
    referredBy: item.referredBy || "",
    amount: Number(item.amount || item.netAmount || 0),
  }));

  const grossCharges = Number(summary.grossCharges ?? items.reduce((acc, it) => acc + (it.qty * it.rate), 0));
  const concessions = Number(summary.concessions ?? items.reduce((acc, it) => acc + it.discount, 0));
  const taxableAmount = Math.max(0, grossCharges - concessions);

  const cgstAmount = Number(summary.cgstAmount || 0);
  const sgstAmount = Number(summary.sgstAmount || 0);
  const igstAmount = Number(summary.igstAmount || 0);
  const totalTax = cgstAmount + sgstAmount + igstAmount;

  const rawNet = taxableAmount + totalTax;
  const roundedNet = Math.round(rawNet);
  const roundOff = Number((roundedNet - rawNet).toFixed(2));
  const netBillable = Number(summary.netBillable ?? (summary.roundOffToRupee ? roundedNet : rawNet));

  const paymentList = (payments || []).map((p, idx) => ({
    receiptNo: p.receiptNo || p.receipt_no || `REC-${idx + 1}`,
    date: p.date ? `${p.date} ${p.time || ""}` : (p.created_at || "—"),
    mode: p.mode || p.payment_method || "Cash",
    type: p.isAdvance || p.type === "Advance" ? "Admission Advance" : "Interim / Settlement",
    amount: Number(p.amount || 0),
    collectedBy: p.collectedBy || p.cashier || "Counter Cashier",
  }));

  const advancePaid = paymentList
    .filter((p) => p.type.includes("Advance"))
    .reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = Number(summary.totalPaid ?? paymentList.reduce((acc, p) => acc + p.amount, 0));
  const interimPaid = Math.max(0, totalPaid - advancePaid);

  const balanceDue = Number(summary.pendingAmount ?? Math.max(0, netBillable - totalPaid));
  const excessAdvance = Number(summary.excessAdvance ?? Math.max(0, totalPaid - netBillable));

  let settlementStatus = "CLEARED";
  if (balanceDue > 0) settlementStatus = "DUE";
  else if (excessAdvance > 0) settlementStatus = "EXCESS";

  const deptMap = {};
  items.forEach((it) => {
    deptMap[it.department] = (deptMap[it.department] || 0) + it.amount;
  });
  const departmentSummaries = Object.entries(deptMap).map(([label, amount]) => ({
    label,
    amount,
  }));

  // GST Breakdown
  const gstBreakdown = [
    {
      sac: "999311",
      description: "Inpatient Healthcare Services",
      taxable: taxableAmount,
      cgstRate: 0,
      cgst: 0,
      sgstRate: 0,
      sgst: 0,
      igstRate: 0,
      igst: 0,
      totalTax: 0,
    },
  ];

  return {
    generatedAt: new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    invoiceNo: patient.admissionNo ? `INV-${patient.admissionNo}` : `INV-${Date.now().toString().slice(-6)}`,
    invoiceDate: new Date().toLocaleDateString("en-IN"),
    copyType: "ORIGINAL FOR RECIPIENT",
    patient: {
      name: patient.name || "Patient",
      uhid: patient.uhid || "—",
      age: patient.age ? `${patient.age} Y` : "—",
      gender: patient.gender || "—",
      mobile: patient.mobile || patient.phone || "—",
      address: patient.address || "Jansa, Varanasi, Uttar Pradesh, 221405",
      bloodGroup: patient.bloodGroup || "—",
      guardian: patient.guardian || patient.guardian_name || "—",
      relation: patient.relation || patient.guardian_relationship || "Attendant",
      payer: patient.payer || patient.insuranceProvider || "Direct Self-Pay",
      corporate: patient.corporate || patient.companyName || "",
      policyNo: patient.policyNo || patient.tpaNumber || "—",
      claimNo: patient.claimNo || patient.preAuthNo || "",
      patientGstin: patient.patientGstin || "",
    },
    admission: {
      admissionNo: patient.admissionNo || "—",
      admissionDate: patient.admissionDate || "—",
      dischargeDate: patient.dischargeDate || (patient.isDischarged ? "Completed" : "Under Active Inpatient Care"),
      stay: patient.stayDays ? `${patient.stayDays} Day${patient.stayDays > 1 ? "s" : ""}` : (patient.stay || "1 Day"),
      ward: patient.ward || "Inpatient Care Ward",
      bed: patient.bedNo || patient.bed || "Bed",
      consultant: patient.consultant || "Treating Consultant",
      consultantQual: patient.consultantQual || "Senior Consultant Physician",
      department: patient.department || "General Medicine",
      referredBy: patient.referredBy ? `Dr. ${patient.referredBy}` : "Self Walk-in",
      diagnosis: patient.diagnosis || patient.primaryDiagnosis || "Inpatient Clinical Management",
      dischargeCondition: patient.dischargeCondition || "Stable at Discharge",
    },
    items,
    departmentSummaries,
    gstBreakdown,
    totals: {
      grossCharges,
      concessions,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      roundOff,
      netBillable,
      advancePaid,
      interimPaid,
      totalPaid,
      balanceDue,
      excessAdvance,
      settlementStatus,
      amountInWords: numberToWords(netBillable),
    },
    payments: paymentList,
  };
}
