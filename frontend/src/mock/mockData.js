/**
 * Comprehensive Mock Data and Mock Store for HIMS Frontend
 * Enables full standalone development and preview without backend server dependency.
 */

// Helper to create a valid base64url JWT that jwt-decode can parse
export function createMockJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days expiry
    iat: Math.floor(Date.now() / 1000),
    ...payload,
  };

  const toB64 = (obj) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  return `${toB64(header)}.${toB64(fullPayload)}.mock_signature_${Date.now()}`;
}

export const MOCK_USERS = {
  admin: {
    id: "usr_admin_01",
    name: "Dr. Rajesh Sharma (Admin)",
    email: "admin@kgnandahospital.com",
    role: "admin",
    department: "Administration & Surgery",
    employeeId: "EMP-ADM-001",
  },
  super_admin: {
    id: "usr_super_01",
    name: "Executive Director Verma",
    email: "superadmin@kgnandahospital.com",
    role: "super_admin",
    department: "Executive Management",
    employeeId: "EMP-DIR-000",
  },
  doctor: {
    id: "usr_doc_01",
    name: "Dr. Priya Deshmukh, MD",
    email: "dr.priya@kgnandahospital.com",
    role: "doctor",
    department: "General Medicine & Cardiology",
    employeeId: "EMP-DOC-108",
  },
  reception: {
    id: "usr_rec_01",
    name: "Neha Gupta (Front Desk)",
    email: "reception@kgnandahospital.com",
    role: "reception",
    department: "Front Office & Registration",
    employeeId: "EMP-REC-204",
  },
  pharmacy: {
    id: "usr_pharma_01",
    name: "Vikram Mehta (Pharmacist)",
    email: "pharmacy@kgnandahospital.com",
    role: "pharmacy",
    department: "Central Pharmacy & Stores",
    employeeId: "EMP-PHR-305",
  },
};

export const INITIAL_PATIENTS = [
  {
    id: "P-10021",
    uhid: "HIMS-2026-00481",
    name: "Aarav Gupta",
    age: 34,
    gender: "Male",
    phone: "+91 98765 43210",
    bloodGroup: "O+",
    doctor: "Dr. Priya Deshmukh",
    department: "Cardiology",
    category: "OPD",
    status: "Active",
    registeredAt: "2026-09-25 09:15",
    address: "B-42, Civil Lines, Jaipur",
    guardianName: "Sunil Gupta (Father)",
    vitals: { bp: "120/80", pulse: "74 bpm", temp: "98.4 F", spo2: "99%", weight: "68 kg" },
  },
  {
    id: "P-10022",
    uhid: "HIMS-2026-00482",
    name: "Sunita Verma",
    age: 48,
    gender: "Female",
    phone: "+91 98123 76543",
    bloodGroup: "B+",
    doctor: "Dr. Rajesh Sharma",
    department: "General Surgery",
    category: "IPD",
    status: "Admitted",
    bedNo: "ICU-Bed-04",
    registeredAt: "2026-09-24 14:20",
    address: "Plot 12, Malviya Nagar, Jaipur",
    guardianName: "Ramesh Verma (Husband)",
    vitals: { bp: "135/88", pulse: "82 bpm", temp: "99.1 F", spo2: "97%", weight: "62 kg" },
  },
  {
    id: "P-10023",
    uhid: "HIMS-2026-00483",
    name: "Mohammad Farooq",
    age: 52,
    gender: "Male",
    phone: "+91 97890 12345",
    bloodGroup: "A+",
    doctor: "Dr. Anand Kulkarni",
    department: "Orthopedics",
    category: "OPD",
    status: "In Consultation",
    registeredAt: "2026-09-25 10:00",
    address: "C-15, Johari Bazar, Jaipur",
    guardianName: "Zoya Farooq (Wife)",
    vitals: { bp: "128/82", pulse: "76 bpm", temp: "98.6 F", spo2: "98%", weight: "74 kg" },
  },
  {
    id: "P-10024",
    uhid: "HIMS-2026-00484",
    name: "Kavita Meena",
    age: 27,
    gender: "Female",
    phone: "+91 94140 98765",
    bloodGroup: "AB+",
    doctor: "Dr. Meenakshi Iyer",
    department: "Gynecology & Obstetrics",
    category: "IPD",
    status: "Admitted",
    bedNo: "Ward-B-12",
    registeredAt: "2026-09-23 18:30",
    address: "Flat 302, Vaishali Nagar, Jaipur",
    guardianName: "Deepak Meena (Husband)",
    vitals: { bp: "116/74", pulse: "78 bpm", temp: "98.5 F", spo2: "99%", weight: "58 kg" },
  },
  {
    id: "P-10025",
    uhid: "HIMS-2026-00485",
    name: "Rohan Bhatia",
    age: 12,
    gender: "Male",
    phone: "+91 99280 44332",
    bloodGroup: "O-",
    doctor: "Dr. Arvind Saxena",
    department: "Pediatrics",
    category: "OPD",
    status: "Waiting",
    registeredAt: "2026-09-25 11:30",
    address: "H-8, Raja Park, Jaipur",
    guardianName: "Manish Bhatia (Father)",
    vitals: { bp: "105/68", pulse: "88 bpm", temp: "100.2 F", spo2: "99%", weight: "38 kg" },
  },
  {
    id: "P-10026",
    uhid: "HIMS-2026-00486",
    name: "Gurpreet Singh",
    age: 61,
    gender: "Male",
    phone: "+91 96541 22334",
    bloodGroup: "B+",
    doctor: "Dr. Rajesh Sharma",
    department: "Urology",
    category: "IPD",
    status: "Admitted",
    bedNo: "Pvt-Room-102",
    registeredAt: "2026-09-22 11:00",
    address: "A-88, Mansarovar, Jaipur",
    guardianName: "Jaswinder Singh (Son)",
    vitals: { bp: "142/90", pulse: "80 bpm", temp: "98.8 F", spo2: "96%", weight: "81 kg" },
  },
];

export const INITIAL_OPD_QUEUE = [
  { tokenNo: "T-01", patientName: "Aarav Gupta", uhid: "HIMS-2026-00481", doctor: "Dr. Priya Deshmukh", department: "Cardiology", time: "09:30 AM", status: "Completed" },
  { tokenNo: "T-02", patientName: "Mohammad Farooq", uhid: "HIMS-2026-00483", doctor: "Dr. Anand Kulkarni", department: "Orthopedics", time: "10:00 AM", status: "In Consultation" },
  { tokenNo: "T-03", patientName: "Rohan Bhatia", uhid: "HIMS-2026-00485", doctor: "Dr. Arvind Saxena", department: "Pediatrics", time: "10:30 AM", status: "Waiting" },
  { tokenNo: "T-04", patientName: "Pooja Trivedi", uhid: "HIMS-2026-00487", doctor: "Dr. Priya Deshmukh", department: "Cardiology", time: "11:00 AM", status: "Waiting" },
  { tokenNo: "T-05", patientName: "Vikas Choudhary", uhid: "HIMS-2026-00488", doctor: "Dr. Rajesh Sharma", department: "General Surgery", time: "11:30 AM", status: "Waiting" },
];

export const INITIAL_BEDS = [
  { id: "B1", bedNo: "ICU-01", ward: "ICU", floor: "2nd Floor", status: "Occupied", patient: "Kamal Kishore (65M)", doctor: "Dr. Rajesh Sharma", admittedDate: "2026-09-21" },
  { id: "B2", bedNo: "ICU-02", ward: "ICU", floor: "2nd Floor", status: "Available", patient: null, doctor: null, admittedDate: null },
  { id: "B3", bedNo: "ICU-03", ward: "ICU", floor: "2nd Floor", status: "Maintenance", patient: null, doctor: null, admittedDate: null },
  { id: "B4", bedNo: "ICU-04", ward: "ICU", floor: "2nd Floor", status: "Occupied", patient: "Sunita Verma (48F)", doctor: "Dr. Rajesh Sharma", admittedDate: "2026-09-24" },
  { id: "B5", bedNo: "GEN-M-01", ward: "General Male", floor: "1st Floor", status: "Occupied", patient: "Dinesh Kumar (42M)", doctor: "Dr. Anand Kulkarni", admittedDate: "2026-09-23" },
  { id: "B6", bedNo: "GEN-M-02", ward: "General Male", floor: "1st Floor", status: "Available", patient: null, doctor: null, admittedDate: null },
  { id: "B7", bedNo: "GEN-M-03", ward: "General Male", floor: "1st Floor", status: "Available", patient: null, doctor: null, admittedDate: null },
  { id: "B8", bedNo: "GEN-F-01", ward: "General Female", floor: "1st Floor", status: "Occupied", patient: "Kavita Meena (27F)", doctor: "Dr. Meenakshi Iyer", admittedDate: "2026-09-23" },
  { id: "B9", bedNo: "GEN-F-02", ward: "General Female", floor: "1st Floor", status: "Available", patient: null, doctor: null, admittedDate: null },
  { id: "B10", bedNo: "PVT-101", ward: "Private Room", floor: "3rd Floor", status: "Available", patient: null, doctor: null, admittedDate: null },
  { id: "B11", bedNo: "PVT-102", ward: "Private Room", floor: "3rd Floor", status: "Occupied", patient: "Gurpreet Singh (61M)", doctor: "Dr. Rajesh Sharma", admittedDate: "2026-09-22" },
  { id: "B12", bedNo: "EMG-01", ward: "Emergency", floor: "Ground Floor", status: "Occupied", patient: "Trauma Intake #41", doctor: "Dr. Priya Deshmukh", admittedDate: "2026-09-25" },
];

export const INITIAL_INVOICES = [
  { id: "INV-2026-101", invoiceNo: "INV-101", uhid: "HIMS-2026-00481", patientName: "Aarav Gupta", service: "Cardiology OPD Consultation + ECG", grossAmount: 1800, discount: 100, netAmount: 1700, paymentMode: "UPI / PhonePe", status: "Paid", date: "2026-09-25 09:45" },
  { id: "INV-2026-102", invoiceNo: "INV-102", uhid: "HIMS-2026-00482", patientName: "Sunita Verma", service: "IPD Surgery Advance Deposit", grossAmount: 50000, discount: 0, netAmount: 50000, paymentMode: "TPA Insurance (Star Health)", status: "Approved", date: "2026-09-24 15:10" },
  { id: "INV-2026-103", invoiceNo: "INV-103", uhid: "HIMS-2026-00483", patientName: "Mohammad Farooq", service: "Orthopedic OPD + X-Ray Knee", grossAmount: 2200, discount: 200, netAmount: 2000, paymentMode: "Cash", status: "Paid", date: "2026-09-25 10:25" },
  { id: "INV-2026-104", invoiceNo: "INV-104", uhid: "HIMS-2026-00485", patientName: "Rohan Bhatia", service: "Pediatric Consultation", grossAmount: 800, discount: 0, netAmount: 800, paymentMode: "Debit Card", status: "Paid", date: "2026-09-25 11:40" },
];

export const INITIAL_MEDICINES = [
  { id: "MED-01", name: "Paracetamol 650mg (Dolo)", generic: "Paracetamol", category: "Analgesic", batch: "BT-2409", stock: 1450, unitPrice: 32.5, expiry: "2027-08", supplier: "Micro Labs" },
  { id: "MED-02", name: "Augmentin 625 Duo", generic: "Amoxicillin + Clavulanic Acid", category: "Antibiotic", batch: "BT-9912", stock: 240, unitPrice: 210.0, expiry: "2026-11", supplier: "GSK Pharma" },
  { id: "MED-03", name: "Pan-D Capsule", generic: "Pantoprazole + Domperidone", category: "Antacid", batch: "BT-7741", stock: 890, unitPrice: 165.0, expiry: "2027-04", supplier: "Alkem" },
  { id: "MED-04", name: "Azithral 500mg", generic: "Azithromycin", category: "Antibiotic", batch: "BT-3320", stock: 45, unitPrice: 125.0, expiry: "2026-10", supplier: "Alembic" }, // Low stock & near expiry
  { id: "MED-05", name: "Telma 40mg", generic: "Telmisartan", category: "Antihypertensive", batch: "BT-8812", stock: 620, unitPrice: 195.0, expiry: "2027-12", supplier: "Glenmark" },
  { id: "MED-06", name: "Metformin 500mg SR", generic: "Metformin Hydrochloride", category: "Antidiabetic", batch: "BT-5561", stock: 950, unitPrice: 55.0, expiry: "2027-06", supplier: "USV Pharma" },
];

export const INITIAL_LAB_TESTS = [
  { id: "LAB-01", orderId: "ORD-901", patientName: "Aarav Gupta", testName: "Complete Blood Count (CBC)", department: "Hematology", sampleCollected: "Yes", status: "Completed", result: "Normal (Hb: 14.5, TLC: 7,800)", orderedAt: "2026-09-25 09:30" },
  { id: "LAB-02", orderId: "ORD-902", patientName: "Sunita Verma", testName: "Liver Function Test (LFT)", department: "Biochemistry", sampleCollected: "Yes", status: "In Testing", result: "Pending", orderedAt: "2026-09-25 10:15" },
  { id: "LAB-03", orderId: "ORD-903", patientName: "Gurpreet Singh", testName: "Kidney Function & Serum Creatinine", department: "Biochemistry", sampleCollected: "Yes", status: "Completed", result: "Creatinine: 1.4 mg/dL (Borderline)", orderedAt: "2026-09-24 16:00" },
  { id: "LAB-04", orderId: "ORD-904", patientName: "Kavita Meena", testName: "Thyroid Profile (T3, T4, TSH)", department: "Endocrinology", sampleCollected: "Pending", status: "Sample Pending", result: "Pending", orderedAt: "2026-09-25 11:00" },
];

export const INITIAL_DOCTORS = [
  { id: "DOC-1", name: "Dr. Rajesh Sharma", department: "General & Laparoscopic Surgery", opdRoom: "OPD-101", timing: "09:00 AM - 02:00 PM", status: "Available", patientsWaiting: 4 },
  { id: "DOC-2", name: "Dr. Priya Deshmukh", department: "Cardiology", opdRoom: "OPD-102", timing: "10:00 AM - 04:00 PM", status: "In Consultation", patientsWaiting: 6 },
  { id: "DOC-3", name: "Dr. Anand Kulkarni", department: "Orthopedics & Joint Replacement", opdRoom: "OPD-103", timing: "09:30 AM - 01:30 PM", status: "Available", patientsWaiting: 2 },
  { id: "DOC-4", name: "Dr. Meenakshi Iyer", department: "Obstetrics & Gynecology", opdRoom: "OPD-104", timing: "11:00 AM - 05:00 PM", status: "In OT", patientsWaiting: 3 },
  { id: "DOC-5", name: "Dr. Arvind Saxena", department: "Pediatrics & Neonatology", opdRoom: "OPD-105", timing: "09:00 AM - 01:00 PM", status: "Available", patientsWaiting: 5 },
];

export const INITIAL_APPOINTMENTS = [
  { id: "APT-101", patientName: "Aarav Gupta", phone: "+91 98765 43210", uhid: "HIMS-2026-00481", patientType: "OPD", category: "OPD", doctor: "Dr. Sadhana Chaurasiya", date: "2026-10-01", token: "T-01", status: "Confirmed" },
  { id: "APT-102", patientName: "Sunita Verma", phone: "+91 98123 76543", uhid: "HIMS-2026-00482", patientType: "IPD", category: "IPD", doctor: "Dr. Anand Prakash Tiwari", date: "2026-10-01", token: "T-02", status: "Pending" },
  { id: "APT-103", patientName: "Mohammad Farooq", phone: "+91 97890 12345", uhid: "HIMS-2026-00483", patientType: "OPD", category: "OPD", doctor: "Dr. Akhilesh Kumar Singh", date: "2026-10-01", token: "T-03", status: "Completed" },
  { id: "APT-104", patientName: "Kavita Meena", phone: "+91 94140 98765", uhid: "HIMS-2026-00484", patientType: "IPD", category: "IPD", doctor: "Dr. Meenakshi Iyer", date: "2026-10-01", token: "T-04", status: "Confirmed" },
  { id: "APT-105", patientName: "Rohan Bhatia", phone: "+91 99280 44332", uhid: "HIMS-2026-00485", patientType: "OPD", category: "OPD", doctor: "Dr. Sadhana Chaurasiya", date: "2026-10-01", token: "T-05", status: "Cancelled" },
  { id: "APT-106", patientName: "Gurpreet Singh", phone: "+91 96541 22334", uhid: "HIMS-2026-00486", patientType: "IPD", category: "IPD", doctor: "Dr. Anand Prakash Tiwari", date: "2026-10-01", token: "T-06", status: "Pending" },
];

