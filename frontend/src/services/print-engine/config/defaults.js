/**
 * defaults.js — Default configuration schemas and sample preview datasets
 * for all medical document types.
 */

export const SLIP_SETTINGS_KEYS = {
  all: "print_slip_shared_master",
  shared: "print_slip_shared_master",
  master: "print_slip_shared_master",
  opd: "print_slip_opd",
  ipd_admission: "print_slip_ipd",
  ipd: "print_slip_ipd",
  ipd_billing: "print_slip_ipd_bill",
  ipd_discharge: "print_slip_ipd_discharge",
  ipd_receipt: "print_slip_ipd_receipt",
};

export function normalizeSlipType(slipType = "opd") {
  const s = String(slipType || "opd").toLowerCase().trim();
  if (s === "ipd" || s === "admission") return "ipd_admission";
  if (s === "bill" || s === "billing" || s === "ipd_bill") return "ipd_billing";
  if (s === "discharge") return "ipd_discharge";
  if (s === "receipt") return "ipd_receipt";
  return s;
}

export const esc = (value) =>
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

export const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export function numberToWords(amount) {
  const num = Math.floor(Math.abs(Number(amount) || 0));
  if (num === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }

  return `${inWords(num)} Rupees Only`;
}

export function getUpiQrUrl(upiId, amount, name, ref) {
  if (!upiId) return "";
  const params = new URLSearchParams({
    pa: upiId,
    pn: name || "Hospital Counter",
    am: Number(amount || 0).toFixed(2),
    cu: "INR",
    tn: `Bill Settlement ${ref || ""}`,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=4&data=${encodeURIComponent(
    `upi://pay?${params.toString()}`
  )}`;
}

export const DEFAULT_SLIP_CONFIGS = {
  opd: {
    title: "OPD CONSULTATION SLIP",
    copyBadge: "PATIENT COPY",
    showParticulars: true,
    consultationFee: 500,
    registrationFee: 100,
    serviceFee: 0,
    discount: 0,
  },
  ipd_admission: {
    title: "IPD ADMISSION TICKET",
    copyBadge: "ORIGINAL ADMISSION RECORD",
    showBedCard: true,
    showVitals: true,
    advanceDeposit: 5000,
  },
  ipd_billing: {
    title: "INPATIENT FINAL TAX INVOICE",
    copyBadge: "OFFICIAL SETTLEMENT COPY",
    showTax: false,
    gstMode: "exempt", // "exempt" | "exclusive" | "inclusive"
    showUpiQr: false,
    upiId: "",
    totalLabel: "Total Amount",
    payableLabel: "Payable Amount",
    dueLabel: "Balance Due",
    paidLabel: "Advance Received",
    paymentsTitle: "Advance & Payments Received",
    discountLabel: "Discount",
    groupCharges: true,
    paymentBreakdown: true,
  },
  ipd_discharge: {
    title: "IPD DISCHARGE SUMMARY",
    copyBadge: "CLINICAL RECORD COPY",
    showTimeline: true,
    showMedications: true,
    showAdvice: true,
    showVitals: true,
    showInvestigations: true,
    showBillingClearance: true,
  },
  ipd_receipt: {
    title: "OFFICIAL PAYMENT RECEIPT & CASH VOUCHER",
    copyBadge: "OFFICIAL COUNTER RECEIPT",
  },
};

/**
 * Rich mock datasets strictly used in Designer Previews (isPreview: true).
 * NEVER used in live clinical prints!
 */
export const PREVIEW_SAMPLE_DATA = {
  opd: {
    patientName: "Adeesh Singh",
    uhid: "UHID-2026-004481",
    encounterNo: "OPD-26-0912",
    tokenNo: "A-14",
    age: "44",
    gender: "Male",
    mobile: "+91 9876543210",
    address: "Jansa, Varanasi, Uttar Pradesh - 221405",
    doctor: "Dr. Adeesh Singh",
    department: "General Medicine",
    encounterDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    consultationFee: 500,
    registrationFee: 100,
    serviceFee: 0,
    discount: 0,
    total: 600,
  },
  ipd_admission: {
    patientName: "Pooja Verma",
    uhid: "UHID-2026-003819",
    encounterNo: "ADM-26-0248",
    admissionNo: "ADM-26-0248",
    age: "31",
    gender: "Female",
    mobile: "+91 9123456789",
    address: "Bhadaini, Varanasi, UP - 221005",
    doctor: "Dr. Adeesh Singh",
    department: "Obstetrics & Gynaecology",
    ward: "Maternity Ward",
    bedNo: "MW-04",
    wardBed: "Maternity Ward • Bed MW-04",
    admissionDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    category: "Planned Medical Inpatient",
    advanceAmount: 5000,
    vitals: { bp: "118/76 mmHg", pulse: "74 bpm", temp: "98.4 °F", spo2: "99%" },
  },
  ipd_billing: {
    patientName: "Rameshwar Prasad",
    uhid: "UHID-2026-001290",
    encounterNo: "ADM-26-0182",
    billNo: "INV-26-0441",
    admissionNo: "ADM-26-0182",
    age: "58",
    gender: "Male",
    mobile: "+91 9839012345",
    address: "Pandeypur, Varanasi, UP - 221002",
    doctor: "Dr. Adeesh Singh",
    department: "General Medicine",
    wardBed: "ICU Step-down • Bed 12",
    admissionDate: "02 Nov 2026",
    dischargeDate: "07 Nov 2026",
    items: [
      { id: "1", date: "02-11-2026", particular: "ICU Bed & Nursing Charges (5 Days)", category: "Bed Charges", qty: 5, rate: 2500, amount: 12500 },
      { id: "2", date: "03-11-2026", particular: "Physician Inpatient Consultation", category: "Consultation", qty: 5, rate: 800, amount: 4000 },
      { id: "3", date: "03-11-2026", particular: "Complete Blood Profile & Biochemistry", category: "Laboratory", qty: 1, rate: 2200, amount: 2200 },
      { id: "4", date: "04-11-2026", particular: "IV Fluids & Inpatient Pharmacy Supplies", category: "Pharmacy", qty: 1, rate: 4350, amount: 4350 },
    ],
    payments: [
      { id: "p1", date: "02 Nov 2026", mode: "Online UPI", ref: "UPI-99238471", amount: 5000 },
      { id: "p2", date: "05 Nov 2026", mode: "Cash Counter", ref: "REC-26-0112", amount: 10000 },
    ],
    subtotal: 23050,
    discount: 500,
    netBillable: 22550,
    advancePaid: 15000,
    balanceDue: 7550,
    upiId: "narayan.hospital@upi",
  },
  ipd_discharge: {
    patient: {
      name: "Suresh Kumar",
      uhid: "UHID-2026-005112",
      age: "42 Years",
      gender: "Male",
      mobile: "+91 9415012345",
      address: "Rohania, Varanasi, UP - 221108",
      bloodGroup: "O+",
      allergies: "No known drug allergies reported",
    },
    admission: {
      ipdNumber: "ADM-26-0319",
      admissionDate: "03 Nov 2026, 11:30 AM",
      dischargeDate: "08 Nov 2026, 02:00 PM",
      stay: "5 Days",
      ward: "Male Medical Ward",
      bed: "Bed 07",
      department: "General Medicine",
      consultant: "Dr. Adeesh Singh",
      dischargeType: "NORMAL / PLANNED",
      dischargeCondition: "Clinically Stable & Symptom Free",
    },
    clinical: {
      primaryDiagnosis: "Acute Infective Gastroenteritis with Dehydration (Resolved)",
      secondaryDiagnosis: "Mild Essential Hypertension",
      hospitalCourse: "Patient admitted with vomiting, abdominal cramps and dehydration. Responded well to IV rehydration, antiemetics, and targeted antimicrobial coverage. Tolerating oral diet comfortably. Afebrile with stable hemodynamics for >48 hours.",
      investigations: "CBC: Hb 13.8, TLC 8,200. Serum Electrolytes: Na 138, K 4.1. LFT & RFT within normal limits.",
      procedures: "IV Cannulation, Peripheral Fluid Infusion, Bedside Continuous Vital Monitoring.",
    },
    vitals: {
      bp: "120/80 mmHg",
      pulse: "76 bpm",
      temperature: "98.6 °F",
      spo2: "99% on room air",
    },
    medicines: [
      { name: "Tab Rifaximin 400mg", dosage: "1 Tab", frequency: "Twice daily (BD)", duration: "5 Days", instructions: "Post meals" },
      { name: "Cap Probiotic Complex", dosage: "1 Cap", frequency: "Once daily (OD)", duration: "7 Days", instructions: "Morning with water" },
      { name: "ORS Sachet", dosage: "1 Sachet in 1L water", frequency: "As needed", duration: "3 Days", instructions: "Sip throughout day" },
      { name: "Tab Pantoprazole 40mg", dosage: "1 Tab", frequency: "Once daily (OD)", duration: "5 Days", instructions: "Before breakfast" },
    ],
    advice: {
      followUpDate: "13 Nov 2026 in OPD",
      followUpDepartment: "General Medicine OPD",
      diet: "Light bland diet, boiled water, plenty of oral fluids. Avoid spicy, oily, and outside food for 10 days.",
      activity: "Adequate bed rest for 48 hours. Resume light routine work gradually.",
      emergencyContact: "+91 7388660408 (24x7 Emergency Desk)",
    },
    billing: {
      isCleared: true,
      clearanceStatus: "CLEARED & SETTLED (NO DUES)",
    },
  },
  ipd_receipt: {
    receiptNo: "REC-26-0068",
    patientName: "Ram Chandra Yadav",
    uhid: "UHID-2026-004481",
    encounterNo: "ADM-26-0182",
    age: "52",
    gender: "Male",
    mobile: "+91 9839112233",
    amount: 5141,
    type: "Running Bill Interim Deposit",
    mode: "Cash Counter",
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    remarks: "Inpatient running advance payment",
    audit: {
      totalCharges: 12500,
      totalPaid: 10141,
      pendingBalance: 2359,
    },
  },
};
