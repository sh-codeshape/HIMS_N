import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer.jsx";
import Icon from "../../components/common/Icon.jsx";
import "./RegisterPatient.css";

// Comprehensive Mock Database of Hospital Registered Patients
const MOCK_OLD_PATIENTS = [
  {
    uhid: "UHID-2024-00101",
    patientId: "PID-101",
    title: "Mr.",
    firstName: "Ramesh",
    middleName: "Kumar",
    lastName: "Sharma",
    gender: "Male",
    dob: "1979-05-14",
    age: "45",
    maritalStatus: "Married",
    bloodGroup: "B+",
    guardianType: "Father",
    guardianName: "Ram Prasad Sharma",
    mobile1: "9876543210",
    mobile2: "9456123456",
    email: "ramesh.sharma@example.com",
    address: "12/48 Alambagh, VIP Road",
    city: "Lucknow",
    state: "Uttar Pradesh",
    pin: "226001",
    idType: "Aadhaar Card",
    idNo: "4512 8901 2345",
    department: "General Medicine",
    doctor: "Dr. Rajesh Sharma (MD - Medicine)",
    patientType: "General",
    totalVisits: 4,
    lastVisitDate: "12-Aug-2026",
  },
  {
    uhid: "UHID-2024-00102",
    patientId: "PID-102",
    title: "Mrs.",
    firstName: "Pooja",
    middleName: "",
    lastName: "Verma",
    gender: "Female",
    dob: "1996-08-22",
    age: "28",
    maritalStatus: "Married",
    bloodGroup: "O+",
    guardianType: "Husband",
    guardianName: "Vikash Verma",
    mobile1: "9812345678",
    mobile2: "",
    email: "pooja.verma@example.com",
    address: "Flat 402, Royal Palms, Sector 14",
    city: "New Delhi",
    state: "Delhi",
    pin: "110085",
    idType: "Aadhaar Card",
    idNo: "7812 3456 9012",
    department: "Gynecology & Obstetrics",
    doctor: "Dr. Sunita Gupta (MS - Gynecologist)",
    patientType: "Ayushman Bharat",
    totalVisits: 2,
    lastVisitDate: "05-Sep-2026",
  },
  {
    uhid: "UHID-2024-00103",
    patientId: "PID-103",
    title: "Mr.",
    firstName: "Mohammad",
    middleName: "",
    lastName: "Aslam",
    gender: "Male",
    dob: "1972-11-03",
    age: "54",
    maritalStatus: "Married",
    bloodGroup: "A+",
    guardianType: "Son",
    guardianName: "Tariq Aslam",
    mobile1: "9922334455",
    mobile2: "9871122334",
    email: "aslam.m@example.com",
    address: "45 Civil Lines, Station Road",
    city: "Kanpur",
    state: "Uttar Pradesh",
    pin: "208001",
    idType: "PAN Card",
    idNo: "ABCDE1234F",
    department: "Cardiology",
    doctor: "Dr. Amit Verma (DM - Cardiology)",
    patientType: "General",
    totalVisits: 6,
    lastVisitDate: "18-Sep-2026",
  },
  {
    uhid: "UHID-2024-00104",
    patientId: "PID-104",
    title: "Mrs.",
    firstName: "Sunita",
    middleName: "",
    lastName: "Devi",
    gender: "Female",
    dob: "1963-03-10",
    age: "63",
    maritalStatus: "Widow",
    bloodGroup: "AB+",
    guardianType: "Son",
    guardianName: "Rajesh Kumar",
    mobile1: "9765432190",
    mobile2: "",
    email: "",
    address: "B-32 Sigra, Cantt Road",
    city: "Varanasi",
    state: "Uttar Pradesh",
    pin: "221001",
    idType: "Voter ID",
    idNo: "UPT1294859",
    department: "Orthopedics",
    doctor: "Dr. Manoj Tripathi (MS - Orthopedics)",
    patientType: "BPL",
    totalVisits: 3,
    lastVisitDate: "28-Jul-2026",
  },
];

const genUHID = () => {
  const d = new Date();
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `UHID-${d.getFullYear()}-${seq}`;
};

const genPatientID = () => `PID-${Math.floor(Math.random() * 90000) + 10000}`;
const genTokenNo = () => `OPD-TK-${Math.floor(Math.random() * 90) + 10}`;
const genAdmissionNo = () => `IPD-ADM-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
const today = () => new Date().toISOString().split("T")[0];

const INITIAL_FORM = {
  uhid: genUHID(),
  patientId: genPatientID(),
  date: today(),
  isOldPatient: false,
  regType: "OPD", // "OPD" or "IPD" - asked in choice section & 4 buttons
  title: "Mr.",
  firstName: "",
  middleName: "",
  lastName: "",
  dob: "",
  age: "",
  gender: "Male",
  maritalStatus: "Single",
  bloodGroup: "",
  guardianType: "Father",
  guardianName: "",
  mobile1: "",
  mobile2: "",
  email: "",
  address: "",
  city: "Lucknow",
  state: "Uttar Pradesh",
  pin: "226001",
  idType: "Aadhaar Card",
  idNo: "",
  department: "General Medicine",
  doctor: "Dr. Rajesh Sharma (MD - Medicine)",
  shiftType: "Morning Shift",
  patientType: "General",
  visitType: "First Visit",
  consultCharge: "300",
  regFee: "50",
  ipdAdvance: "2000",
  chiefComplaint: "",
  priority: false,
  mlc: false,
  // IPD specific fields
  wardType: "General Ward (Male)",
  bedNo: "GW-104",
  admissionReason: "Observation & Treatment",
  attendantName: "",
  attendantRelation: "Spouse",
  attendantMobile: "",
  // Billing & Payment
  paymentMode: "Cash", // Cash by default as user requested
  cashReceived: "350",
  onlineRefNo: "",
  autoPrintReceipt: true,
};

export default function RegisterPatient() {
  const navigate = useNavigate();
  const [f, setF] = useState(INITIAL_FORM);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [photo, setPhoto] = useState(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [slipPrintFormat, setSlipPrintFormat] = useState("slip"); // "slip" (3-inch) or "a4" (full)
  const [registeredReceipt, setRegisteredReceipt] = useState(null);
  const photoRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setF((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDobChange = (e) => {
    const dob = e.target.value;
    if (dob) {
      const birthDate = new Date(dob);
      const diff = new Date().getFullYear() - birthDate.getFullYear();
      setF((p) => ({ ...p, dob, age: String(diff >= 0 ? diff : 0) }));
    } else {
      setF((p) => ({ ...p, dob: "", age: "" }));
    }
  };

  // Search Old Patient by UHID / Patient ID / Mobile
  const handleSearchOldPatient = (queryOverride) => {
    const term = (queryOverride !== undefined ? queryOverride : searchQuery).trim().toLowerCase();
    if (!term) {
      setSearchError("Please enter UHID, Patient ID or Mobile number to search");
      return;
    }
    setSearchError("");

    const found = MOCK_OLD_PATIENTS.find(
      (p) =>
        p.uhid.toLowerCase().includes(term) ||
        p.patientId.toLowerCase().includes(term) ||
        p.mobile1.includes(term) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(term)
    );

    if (found) {
      setF((prev) => ({
        ...prev,
        ...found,
        isOldPatient: true,
        visitType: "Re-Visit",
        regFee: "0", // Old patients renewal fee
        consultCharge: found.department === "Cardiology" ? "500" : "300",
        cashReceived: found.department === "Cardiology" ? "500" : "300",
      }));
      showToast(`✅ Patient Record Loaded: ${found.firstName} ${found.lastName} (${found.uhid})`);
    } else {
      // Dynamic fallback for any typed UHID
      if (term.includes("uhid") || term.includes("pid") || term.length >= 6) {
        const dummyUhid = term.toUpperCase().startsWith("UHID") ? term.toUpperCase() : `UHID-${term.toUpperCase()}`;
        setF((prev) => ({
          ...prev,
          uhid: dummyUhid,
          patientId: `PID-${Math.floor(1000 + Math.random() * 9000)}`,
          isOldPatient: true,
          visitType: "Re-Visit",
          regFee: "0",
          firstName: "Suresh",
          middleName: "Chand",
          lastName: "Gupta",
          gender: "Male",
          age: "51",
          mobile1: "9820011223",
          address: "Civil Lines, Main Road",
          city: "Lucknow",
          state: "Uttar Pradesh",
          pin: "226001",
          idType: "Aadhaar Card",
          idNo: "6543 2109 8765",
          department: "General Medicine",
          doctor: "Dr. Rajesh Sharma (MD - Medicine)",
        }));
        showToast(`✅ Record loaded for ${dummyUhid}`);
      } else {
        setSearchError("No patient record found with this ID/Mobile. Click any Demo Patient button below.");
      }
    }
  };

  // Switch to New Patient
  const handleSetNewPatient = () => {
    setF({
      ...INITIAL_FORM,
      uhid: genUHID(),
      patientId: genPatientID(),
      isOldPatient: false,
      visitType: "First Visit",
      regFee: "50",
      cashReceived: "350",
    });
    setSearchQuery("");
    setSearchError("");
    setPhoto(null);
    showToast("🆕 Form reset for New Patient Registration");
  };

  const totalPayable =
    f.regType === "IPD"
      ? (Number(f.regFee) || 0) + (Number(f.ipdAdvance) || 0)
      : (Number(f.regFee) || 0) + (Number(f.consultCharge) || 0);

  const cashChange = Math.max(0, (Number(f.cashReceived) || 0) - totalPayable);

  // 1. OPD Register Action Button
  const handleRegisterOPD = () => {
    if (!f.firstName.trim() || !f.mobile1.trim()) {
      showToast("⚠️ Patient First Name and Mobile Number are required!");
      return;
    }
    const token = genTokenNo();
    const receipt = {
      receiptNo: `OPD-REC-${Math.floor(Math.random() * 90000) + 10000}`,
      type: "OPD Registration",
      uhid: f.uhid,
      patientId: f.patientId,
      patientName: `${f.title} ${f.firstName} ${f.middleName ? f.middleName + " " : ""}${f.lastName}`.trim(),
      ageGender: `${f.age || "N/A"} Yrs / ${f.gender}`,
      mobile: f.mobile1,
      address: `${f.address ? f.address + ", " : ""}${f.city}, ${f.state}`,
      doctor: f.doctor,
      department: f.department,
      tokenNo: token,
      chamberNo: "Chamber #102",
      date: f.date,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      regFee: Number(f.regFee) || 0,
      consultCharge: Number(f.consultCharge) || 0,
      totalPaid: (Number(f.regFee) || 0) + (Number(f.consultCharge) || 0),
      paymentMode: f.paymentMode,
      cashReceived: Number(f.cashReceived) || totalPayable,
      cashChange: cashChange,
      isOldPatient: f.isOldPatient,
    };
    setRegisteredReceipt(receipt);
    setSlipModalOpen(true);
    showToast("🎉 OPD Registration successful! Slip generated.");
  };

  // 2. IPD Register Action Button
  const handleRegisterIPD = () => {
    if (!f.firstName.trim() || !f.mobile1.trim()) {
      showToast("⚠️ Patient First Name and Mobile Number are required!");
      return;
    }
    const admNo = genAdmissionNo();
    const receipt = {
      receiptNo: `IPD-ADM-REC-${Math.floor(Math.random() * 90000) + 10000}`,
      type: "IPD Admission Registration",
      admissionNo: admNo,
      uhid: f.uhid,
      patientId: f.patientId,
      patientName: `${f.title} ${f.firstName} ${f.middleName ? f.middleName + " " : ""}${f.lastName}`.trim(),
      ageGender: `${f.age || "N/A"} Yrs / ${f.gender}`,
      mobile: f.mobile1,
      address: `${f.address ? f.address + ", " : ""}${f.city}, ${f.state}`,
      doctor: f.doctor,
      department: f.department,
      wardBed: `${f.wardType} / Bed: ${f.bedNo || "GW-101"}`,
      admissionReason: f.admissionReason || "Observation & Management",
      attendant: `${f.attendantName || "Family"} (${f.attendantRelation || "Spouse"})`,
      date: f.date,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      regFee: Number(f.regFee) || 0,
      advancePaid: Number(f.ipdAdvance) || 2000,
      totalPaid: (Number(f.regFee) || 0) + (Number(f.ipdAdvance) || 2000),
      paymentMode: f.paymentMode,
      cashReceived: Number(f.cashReceived) || totalPayable,
      cashChange: cashChange,
      isOldPatient: f.isOldPatient,
    };
    setRegisteredReceipt(receipt);
    setSlipModalOpen(true);
    showToast("🏥 IPD Registration & Bed Allotment successful! Slip generated.");
  };

  // 3. Print Slip Action Button
  const handlePrintSlip = () => {
    if (!f.firstName.trim()) {
      showToast("⚠️ Please enter or select patient details before printing slip");
      return;
    }
    const receipt = {
      receiptNo: `REG-REC-${Math.floor(Math.random() * 90000) + 10000}`,
      type: f.regType === "IPD" ? "IPD Registration Slip" : "OPD Registration Slip",
      uhid: f.uhid,
      patientId: f.patientId,
      tokenNo: f.regType === "OPD" ? genTokenNo() : undefined,
      chamberNo: "Chamber #102",
      admissionNo: f.regType === "IPD" ? genAdmissionNo() : undefined,
      wardBed: f.regType === "IPD" ? `${f.wardType} / Bed: ${f.bedNo}` : undefined,
      patientName: `${f.title} ${f.firstName} ${f.middleName ? f.middleName + " " : ""}${f.lastName}`.trim(),
      ageGender: `${f.age || "N/A"} Yrs / ${f.gender}`,
      mobile: f.mobile1,
      address: `${f.address ? f.address + ", " : ""}${f.city}, ${f.state}`,
      doctor: f.doctor,
      department: f.department,
      date: f.date,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      regFee: Number(f.regFee) || 0,
      consultCharge: Number(f.consultCharge) || 0,
      totalPaid: totalPayable,
      paymentMode: f.paymentMode,
      cashReceived: Number(f.cashReceived) || totalPayable,
      cashChange: cashChange,
      isOldPatient: f.isOldPatient,
    };
    setRegisteredReceipt(receipt);
    setSlipModalOpen(true);
  };

  // 4. Cancel / Clear Action Button
  const handleCancel = () => {
    if (window.confirm("Are you sure you want to clear/cancel this registration?")) {
      handleSetNewPatient();
      showToast("Form cleared.");
    }
  };

  const triggerDirectPrint = () => {
    window.print();
  };

  return (
    <PageContainer
      title="Hospital Patient Registration Counter"
      subtitle="High-density, premium registration desk for OPD Consultation & IPD Inpatient Admissions"
    >
      {/* Toast Notification */}
      {toastMsg && <div className="prem-toast">{toastMsg}</div>}

      <div className="prem-reg-container">
        {/* ================= TOP SEARCH & LOOKUP BAR (PREMIUM) ================= */}
        <div className="prem-top-card">
          <div className="prem-top-row">
            {/* New / Old Toggle Tabs */}
            <div className="prem-type-switcher">
              <button
                type="button"
                className={`prem-switch-tab ${!f.isOldPatient ? "prem-switch-tab--active" : ""}`}
                onClick={handleSetNewPatient}
              >
                <Icon name="LuUserPlus" size={15} />
                <span>New Patient Registration</span>
              </button>
              <button
                type="button"
                className={`prem-switch-tab ${f.isOldPatient ? "prem-switch-tab--active prem-switch-tab--old" : ""}`}
                onClick={() => {
                  setF((p) => ({ ...p, isOldPatient: true, visitType: "Re-Visit", regFee: "0" }));
                  showToast("🔍 Enter UHID / Mobile No. to load patient records");
                }}
              >
                <Icon name="LuHistory" size={15} />
                <span>Old Patient (Re-visit / Lookup)</span>
              </button>
            </div>

            {/* Quick Chips */}
            <div className="prem-demo-group">
              <span className="prem-demo-title">
                <Icon name="LuSparkles" size={12} /> Quick Demo Patients:
              </span>
              {MOCK_OLD_PATIENTS.map((p) => (
                <button
                  key={p.uhid}
                  type="button"
                  className="prem-quick-chip"
                  onClick={() => {
                    setSearchQuery(p.uhid);
                    handleSearchOldPatient(p.uhid);
                  }}
                  title={`Load record for ${p.firstName} ${p.lastName}`}
                >
                  <span className="prem-chip-dot" />
                  <strong>{p.firstName}</strong> ({p.uhid.replace("UHID-2024-", "#")})
                </button>
              ))}
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="prem-search-row">
            <div className="prem-search-field">
              <Icon name="LuSearch" size={16} className="prem-search-icon" />
              <input
                type="text"
                placeholder="Enter UHID Number, Patient ID or Mobile No. (e.g. UHID-2024-00101, 9876543210)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchOldPatient()}
                className="prem-search-inp"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="prem-clear-search"
                  onClick={() => setSearchQuery("")}
                >
                  <Icon name="LuX" size={14} />
                </button>
              )}
              <button
                type="button"
                className="prem-fetch-btn"
                onClick={() => handleSearchOldPatient()}
              >
                <Icon name="LuUserCheck" size={14} /> Fetch Patient Data
              </button>
            </div>
          </div>

          {searchError && <div className="prem-error-strip">{searchError}</div>}

          {/* Banner when Old Patient loaded */}
          {f.isOldPatient && (
            <div className="prem-loaded-banner">
              <div className="prem-loaded-left">
                <span className="prem-badge prem-badge--old">OLD PATIENT RECORD VERIFIED</span>
                <span className="prem-uhid-tag">UHID: {f.uhid}</span>
                <span className="prem-pid-tag">PID: {f.patientId}</span>
                <span className="prem-visits-tag">
                  Total Visits: <strong>{f.totalVisits || 1}</strong> | Last Visit: {f.lastVisitDate || "Recent"}
                </span>
              </div>
              <button
                type="button"
                className="prem-reset-link"
                onClick={handleSetNewPatient}
              >
                <Icon name="LuPlus" size={13} /> Switch to Fresh New Patient
              </button>
            </div>
          )}
        </div>

        {/* ================= MAIN BALANCED 2-COLUMN LAYOUT ================= */}
        <div className="prem-main-grid">
          {/* ====== LEFT PANEL: CLEAN STRUCTURED FORM (3 CARDS) ====== */}
          <div className="prem-left-panel">
            {/* CARD 1: PATIENT DEMOGRAPHICS (Clean 4-column balanced grid) */}
            <div className="prem-card">
              <div className="prem-card-head">
                <div className="prem-card-head-left">
                  <div className="prem-card-icon-wrap prem-card-icon-wrap--blue">
                    <Icon name="LuUser" size={15} />
                  </div>
                  <span className="prem-card-title">1. Patient Personal Demographics</span>
                </div>
                <div className="prem-uhid-badge">
                  <span>Assigned UHID:</span>
                  <strong>{f.uhid}</strong>
                </div>
              </div>

              <div className="prem-card-body">
                {/* Clean Photo + Name Row */}
                <div className="prem-avatar-row">
                  <div
                    className="prem-avatar-box"
                    onClick={() => photoRef.current?.click()}
                    title="Click to upload or capture patient photo"
                  >
                    {photo ? (
                      <img src={photo} alt="Patient" />
                    ) : (
                      <div className="prem-avatar-empty">
                        <Icon name="LuCamera" size={18} />
                        <span>Upload Photo</span>
                      </div>
                    )}
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setPhoto(URL.createObjectURL(file));
                      }}
                    />
                  </div>

                  {/* 4 Name Fields */}
                  <div className="prem-name-grid">
                    <div className="prem-field">
                      <label>Title*</label>
                      <select name="title" value={f.title} onChange={handleInputChange}>
                        <option>Mr.</option>
                        <option>Mrs.</option>
                        <option>Ms.</option>
                        <option>Master</option>
                        <option>Baby</option>
                        <option>Dr.</option>
                      </select>
                    </div>

                    <div className="prem-field">
                      <label>First Name*</label>
                      <input
                        name="firstName"
                        value={f.firstName}
                        onChange={handleInputChange}
                        placeholder="First name (e.g. Ramesh)"
                        required
                      />
                    </div>

                    <div className="prem-field">
                      <label>Middle Name</label>
                      <input
                        name="middleName"
                        value={f.middleName}
                        onChange={handleInputChange}
                        placeholder="Middle name"
                      />
                    </div>

                    <div className="prem-field">
                      <label>Last Name*</label>
                      <input
                        name="lastName"
                        value={f.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name (e.g. Sharma)"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Demographic Grid: 4 Balanced Columns */}
                <div className="prem-grid-4">
                  <div className="prem-field">
                    <label>Gender*</label>
                    <select name="gender" value={f.gender} onChange={handleInputChange} required>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="prem-field">
                    <label>Date of Birth</label>
                    <input type="date" name="dob" value={f.dob} onChange={handleDobChange} />
                  </div>

                  <div className="prem-field">
                    <label>Age (Years)*</label>
                    <div className="prem-input-with-affix">
                      <input
                        type="number"
                        name="age"
                        value={f.age}
                        onChange={handleInputChange}
                        placeholder="45"
                        required
                      />
                      <span className="prem-affix">Yrs</span>
                    </div>
                  </div>

                  <div className="prem-field">
                    <label>Blood Group</label>
                    <select name="bloodGroup" value={f.bloodGroup} onChange={handleInputChange}>
                      <option value="">Select Blood</option>
                      <option>A+</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B-</option>
                      <option>AB+</option>
                      <option>AB-</option>
                      <option>O+</option>
                      <option>O-</option>
                    </select>
                  </div>

                  <div className="prem-field">
                    <label>Marital Status</label>
                    <select name="maritalStatus" value={f.maritalStatus} onChange={handleInputChange}>
                      <option>Single</option>
                      <option>Married</option>
                      <option>Widow</option>
                      <option>Divorced</option>
                    </select>
                  </div>

                  <div className="prem-field">
                    <label>Guardian Relation</label>
                    <select name="guardianType" value={f.guardianType} onChange={handleInputChange}>
                      <option>Father</option>
                      <option>Husband</option>
                      <option>Mother</option>
                      <option>Son</option>
                      <option>Daughter</option>
                      <option>Guardian</option>
                    </select>
                  </div>

                  <div className="prem-field prem-span-2">
                    <label>Guardian / Father Name</label>
                    <input
                      name="guardianName"
                      value={f.guardianName}
                      onChange={handleInputChange}
                      placeholder="Father's or Spouse's full name"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: CONTACT & NATIONAL IDENTIFICATION (Balanced 4 columns) */}
            <div className="prem-card">
              <div className="prem-card-head">
                <div className="prem-card-head-left">
                  <div className="prem-card-icon-wrap prem-card-icon-wrap--green">
                    <Icon name="LuPhoneCall" size={15} />
                  </div>
                  <span className="prem-card-title">2. Contact & Address Details</span>
                </div>
              </div>

              <div className="prem-card-body">
                <div className="prem-grid-4">
                  <div className="prem-field">
                    <label>Primary Mobile*</label>
                    <div className="prem-input-with-affix">
                      <span className="prem-affix">+91</span>
                      <input
                        name="mobile1"
                        value={f.mobile1}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  <div className="prem-field">
                    <label>Alternate Mobile</label>
                    <input
                      name="mobile2"
                      value={f.mobile2}
                      onChange={handleInputChange}
                      placeholder="Optional phone"
                      maxLength={10}
                    />
                  </div>

                  <div className="prem-field">
                    <label>Email Address</label>
                    <input
                      name="email"
                      type="email"
                      value={f.email}
                      onChange={handleInputChange}
                      placeholder="patient@example.com"
                    />
                  </div>

                  <div className="prem-field">
                    <label>ID Proof Type</label>
                    <select name="idType" value={f.idType} onChange={handleInputChange}>
                      <option>Aadhaar Card</option>
                      <option>Voter ID</option>
                      <option>PAN Card</option>
                      <option>Driving License</option>
                      <option>ABHA ID (Ayushman)</option>
                    </select>
                  </div>

                  <div className="prem-field prem-span-2">
                    <label>Residential Street Address</label>
                    <input
                      name="address"
                      value={f.address}
                      onChange={handleInputChange}
                      placeholder="House / Flat No., Colony or Street"
                    />
                  </div>

                  <div className="prem-field">
                    <label>City / District</label>
                    <input
                      name="city"
                      value={f.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Lucknow"
                    />
                  </div>

                  <div className="prem-field">
                    <label>State & Pincode</label>
                    <div className="prem-two-inputs">
                      <input
                        name="state"
                        value={f.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        style={{ width: "55%" }}
                      />
                      <input
                        name="pin"
                        value={f.pin}
                        onChange={handleInputChange}
                        placeholder="Pin"
                        maxLength={6}
                        style={{ width: "45%" }}
                      />
                    </div>
                  </div>

                  <div className="prem-field prem-span-4">
                    <label>National ID Proof Number</label>
                    <input
                      name="idNo"
                      value={f.idNo}
                      onChange={handleInputChange}
                      placeholder="Enter ID number (e.g. 4512 8901 2345)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: CONSULTATION & CLINICAL ASSIGNMENT */}
            <div className="prem-card">
              <div className="prem-card-head">
                <div className="prem-card-head-left">
                  <div className="prem-card-icon-wrap prem-card-icon-wrap--purple">
                    <Icon name="LuStethoscope" size={15} />
                  </div>
                  <span className="prem-card-title">3. Department & Consulting Doctor</span>
                </div>
              </div>

              <div className="prem-card-body">
                <div className="prem-grid-3">
                  <div className="prem-field">
                    <label>Department*</label>
                    <select name="department" value={f.department} onChange={handleInputChange} required>
                      <option>General Medicine</option>
                      <option>Cardiology</option>
                      <option>Orthopedics</option>
                      <option>Gynecology & Obstetrics</option>
                      <option>Pediatrics</option>
                      <option>ENT</option>
                      <option>Neurology</option>
                      <option>General Surgery</option>
                      <option>Emergency & Trauma</option>
                    </select>
                  </div>

                  <div className="prem-field">
                    <label>Consulting Doctor*</label>
                    <select name="doctor" value={f.doctor} onChange={handleInputChange} required>
                      <option>Dr. Rajesh Sharma (MD - Medicine)</option>
                      <option>Dr. Amit Verma (DM - Cardiology)</option>
                      <option>Dr. Sunita Gupta (MS - Gynecologist)</option>
                      <option>Dr. Priya Patel (MS - General Surgery)</option>
                      <option>Dr. Manoj Tripathi (MS - Orthopedics)</option>
                    </select>
                  </div>

                  <div className="prem-field">
                    <label>Patient Billing Category</label>
                    <select name="patientType" value={f.patientType} onChange={handleInputChange}>
                      <option>General</option>
                      <option>Ayushman Bharat (PM-JAY)</option>
                      <option>BPL / Poor</option>
                      <option>Senior Citizen</option>
                      <option>Hospital Staff / Dependent</option>
                      <option>TPA / Corporate Insurance</option>
                    </select>
                  </div>

                  <div className="prem-field prem-span-2">
                    <label>Chief Complaint / Presenting Symptoms</label>
                    <input
                      name="chiefComplaint"
                      value={f.chiefComplaint}
                      onChange={handleInputChange}
                      placeholder="e.g. Fever with chills, chest tightness, knee pain"
                    />
                  </div>

                  <div className="prem-field prem-flags-cell">
                    <label className="prem-toggle-check">
                      <input
                        type="checkbox"
                        name="priority"
                        checked={f.priority}
                        onChange={handleInputChange}
                      />
                      <span>🚨 Emergency Priority</span>
                    </label>
                    <label className="prem-toggle-check">
                      <input
                        type="checkbox"
                        name="mlc"
                        checked={f.mlc}
                        onChange={handleInputChange}
                      />
                      <span>⚖️ Medico-Legal (MLC)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: IPD INPATIENT DETAILS (Dynamically highlighted when IPD chosen) */}
            {f.regType === "IPD" && (
              <div className="prem-card prem-card--ipd-active">
                <div className="prem-card-head prem-card-head--ipd">
                  <div className="prem-card-head-left">
                    <div className="prem-card-icon-wrap prem-card-icon-wrap--purple-dark">
                      <Icon name="LuBedDouble" size={15} />
                    </div>
                    <span className="prem-card-title">4. IPD Inpatient Admission & Ward Allotment</span>
                  </div>
                  <span className="prem-badge prem-badge--ipd">INPATIENT ADMIT FILE</span>
                </div>

                <div className="prem-card-body">
                  <div className="prem-grid-3">
                    <div className="prem-field">
                      <label>Ward / Unit Allotment*</label>
                      <select name="wardType" value={f.wardType} onChange={handleInputChange}>
                        <option>General Ward (Male)</option>
                        <option>General Ward (Female)</option>
                        <option>Semi-Private Ward</option>
                        <option>Private Room (Deluxe)</option>
                        <option>ICU / CCU</option>
                        <option>Emergency Observation</option>
                      </select>
                    </div>

                    <div className="prem-field">
                      <label>Bed Number*</label>
                      <input
                        name="bedNo"
                        value={f.bedNo}
                        onChange={handleInputChange}
                        placeholder="e.g. GW-104, ICU-03"
                      />
                    </div>

                    <div className="prem-field">
                      <label>Admission Reason</label>
                      <input
                        name="admissionReason"
                        value={f.admissionReason}
                        onChange={handleInputChange}
                        placeholder="Clinical diagnosis for admission"
                      />
                    </div>

                    <div className="prem-field">
                      <label>Attendant / Next of Kin Name</label>
                      <input
                        name="attendantName"
                        value={f.attendantName}
                        onChange={handleInputChange}
                        placeholder="Relative / Attendant Name"
                      />
                    </div>

                    <div className="prem-field">
                      <label>Attendant Relation</label>
                      <select
                        name="attendantRelation"
                        value={f.attendantRelation}
                        onChange={handleInputChange}
                      >
                        <option>Spouse</option>
                        <option>Father</option>
                        <option>Mother</option>
                        <option>Son</option>
                        <option>Daughter</option>
                        <option>Brother / Sister</option>
                        <option>Relative / Other</option>
                      </select>
                    </div>

                    <div className="prem-field">
                      <label>Attendant Contact Mobile</label>
                      <input
                        name="attendantMobile"
                        value={f.attendantMobile}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ====== RIGHT PANEL: BILLING, CASH & 4 ACTION BUTTONS ====== */}
          <div className="prem-right-panel">
            {/* INVOICE BILLING & CASH COLLECTION CARD */}
            <div className="prem-billing-card">
              <div className="prem-bill-header">
                <div className="prem-bill-header-left">
                  <Icon name="LuReceipt" size={16} />
                  <span>Fee & Billing Counter</span>
                </div>
                <span className="prem-bill-date">{f.date}</span>
              </div>

              {/* Cash Acceptance Banner */}
              <div className="prem-cash-notice">
                <div className="prem-cash-icon-dot">
                  <Icon name="LuBanknote" size={14} />
                </div>
                <div className="prem-cash-notice-txt">
                  <strong>Counter Collection:</strong> Fee is collected at the reception counter in Cash or Online.
                </div>
              </div>

              {/* Fee Items */}
              <div className="prem-fee-list">
                <div className="prem-fee-row">
                  <span className="prem-fee-name">Registration Fee:</span>
                  <div className="prem-fee-val-wrap">
                    <span>₹</span>
                    <input
                      name="regFee"
                      value={f.regFee}
                      onChange={handleInputChange}
                      className="prem-fee-inp"
                    />
                  </div>
                </div>

                {f.regType === "OPD" ? (
                  <div className="prem-fee-row">
                    <span className="prem-fee-name">OPD Consultation Charge:</span>
                    <div className="prem-fee-val-wrap">
                      <span>₹</span>
                      <input
                        name="consultCharge"
                        value={f.consultCharge}
                        onChange={handleInputChange}
                        className="prem-fee-inp"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="prem-fee-row">
                    <span className="prem-fee-name">IPD Initial Bed Deposit:</span>
                    <div className="prem-fee-val-wrap">
                      <span>₹</span>
                      <input
                        name="ipdAdvance"
                        value={f.ipdAdvance}
                        onChange={handleInputChange}
                        className="prem-fee-inp"
                      />
                    </div>
                  </div>
                )}

                {/* Total Payable Box */}
                <div className="prem-total-box">
                  <div>
                    <div className="prem-total-lbl">Total Payable Amount:</div>
                    <div className="prem-total-sub">Inclusive of hospital charges</div>
                  </div>
                  <div className="prem-total-amount">₹ {totalPayable.toFixed(2)}</div>
                </div>
              </div>

              {/* Payment Methods Selector (Cash by default + Online/Card/Insurance) */}
              <div className="prem-pay-section">
                <label className="prem-pay-title">Select Payment Mode:</label>
                <div className="prem-pay-methods-grid">
                  {/* 1. CASH (Default & Highlighted) */}
                  <button
                    type="button"
                    className={`prem-pay-btn ${f.paymentMode === "Cash" ? "prem-pay-btn--active-cash" : ""}`}
                    onClick={() => setF((p) => ({ ...p, paymentMode: "Cash" }))}
                  >
                    <Icon name="LuBanknote" size={16} />
                    <span>Cash</span>
                    {f.paymentMode === "Cash" && <span className="prem-pay-check">✓</span>}
                  </button>

                  {/* 2. ONLINE / UPI */}
                  <button
                    type="button"
                    className={`prem-pay-btn ${f.paymentMode === "UPI / QR" ? "prem-pay-btn--active-online" : ""}`}
                    onClick={() => setF((p) => ({ ...p, paymentMode: "UPI / QR" }))}
                  >
                    <Icon name="LuQrCode" size={16} />
                    <span>UPI / QR</span>
                    {f.paymentMode === "UPI / QR" && <span className="prem-pay-check">✓</span>}
                  </button>

                  {/* 3. CARD */}
                  <button
                    type="button"
                    className={`prem-pay-btn ${f.paymentMode === "Card" ? "prem-pay-btn--active-card" : ""}`}
                    onClick={() => setF((p) => ({ ...p, paymentMode: "Card" }))}
                  >
                    <Icon name="LuCreditCard" size={16} />
                    <span>Card / POS</span>
                    {f.paymentMode === "Card" && <span className="prem-pay-check">✓</span>}
                  </button>

                  {/* 4. TPA / INSURANCE */}
                  <button
                    type="button"
                    className={`prem-pay-btn ${f.paymentMode === "TPA / Insurance" ? "prem-pay-btn--active-tpa" : ""}`}
                    onClick={() => setF((p) => ({ ...p, paymentMode: "TPA / Insurance" }))}
                  >
                    <Icon name="LuShieldCheck" size={16} />
                    <span>TPA / Claim</span>
                    {f.paymentMode === "TPA / Insurance" && <span className="prem-pay-check">✓</span>}
                  </button>
                </div>

                {/* Cash Calculator (When Cash is selected) */}
                {f.paymentMode === "Cash" && (
                  <div className="prem-cash-calc-box">
                    <div className="prem-cash-calc-row">
                      <span>Cash Received from Patient:</span>
                      <div className="prem-cash-inp-wrap">
                        <span>₹</span>
                        <input
                          name="cashReceived"
                          value={f.cashReceived}
                          onChange={handleInputChange}
                          className="prem-cash-inp"
                        />
                      </div>
                    </div>
                    <div className="prem-cash-change-row">
                      <span>Change to Return:</span>
                      <strong className={cashChange > 0 ? "prem-change-green" : ""}>
                        ₹ {cashChange.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )}

                {/* UPI QR Simulation (When UPI is selected) */}
                {f.paymentMode === "UPI / QR" && (
                  <div className="prem-upi-qr-box">
                    <div className="prem-upi-qr-mock">
                      <Icon name="LuQrCode" size={44} />
                    </div>
                    <div className="prem-upi-text">
                      <div className="prem-upi-id">UPI: hospital.metro@icici</div>
                      <div className="prem-upi-scan">Scan & Pay ₹ {totalPayable.toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================= USER REQUEST: "LAST MAI PUCHNA CHEYE OPD YA IPD" ================= */}
            <div className="prem-decision-card">
              <div className="prem-decision-head">
                <Icon name="LuHelpCircle" size={16} />
                <span>Visit Category: OPD ya IPD?</span>
              </div>
              <p className="prem-decision-desc">
                Ye registration OPD Consultation ke liye ho rha hai ya IPD Inpatient Admit ke liye?
              </p>

              <div className="prem-decision-options">
                <button
                  type="button"
                  className={`prem-choice-option ${f.regType === "OPD" ? "prem-choice-option--active-opd" : ""}`}
                  onClick={() => setF((p) => ({ ...p, regType: "OPD" }))}
                >
                  <div className="prem-radio-circle">
                    {f.regType === "OPD" && <div className="prem-radio-inner" />}
                  </div>
                  <div className="prem-choice-body">
                    <div className="prem-choice-name">OPD Consultation</div>
                    <div className="prem-choice-hint">Doctor Chamber Visit & Token Generation</div>
                  </div>
                  <span className="prem-choice-tag">OPD</span>
                </button>

                <button
                  type="button"
                  className={`prem-choice-option ${f.regType === "IPD" ? "prem-choice-option--active-ipd" : ""}`}
                  onClick={() => setF((p) => ({ ...p, regType: "IPD" }))}
                >
                  <div className="prem-radio-circle">
                    {f.regType === "IPD" && <div className="prem-radio-inner" />}
                  </div>
                  <div className="prem-choice-body">
                    <div className="prem-choice-name">IPD Inpatient Admit</div>
                    <div className="prem-choice-hint">Ward Allotment & Bed Admission File</div>
                  </div>
                  <span className="prem-choice-tag prem-choice-tag--ipd">IPD</span>
                </button>
              </div>
            </div>

            {/* ================= USER REQUEST: EXACT 4 ACTION BUTTONS ================= */}
            <div className="prem-actions-card">
              <span className="prem-actions-header">Registration Counter Actions (4 Buttons)</span>

              <div className="prem-actions-grid">
                {/* 1. OPD Register Button */}
                <button
                  type="button"
                  className="prem-btn-action prem-btn-action--opd"
                  onClick={handleRegisterOPD}
                  title="Register patient for OPD Consultation"
                >
                  <div className="prem-btn-icon">
                    <Icon name="LuStethoscope" size={17} />
                  </div>
                  <div className="prem-btn-txt">
                    <span className="prem-btn-title">OPD Register</span>
                    <span className="prem-btn-sub">Token & Slip Print</span>
                  </div>
                </button>

                {/* 2. IPD Register Button */}
                <button
                  type="button"
                  className="prem-btn-action prem-btn-action--ipd"
                  onClick={handleRegisterIPD}
                  title="Register patient for IPD Inpatient Admission"
                >
                  <div className="prem-btn-icon">
                    <Icon name="LuBedDouble" size={17} />
                  </div>
                  <div className="prem-btn-txt">
                    <span className="prem-btn-title">IPD Register</span>
                    <span className="prem-btn-sub">Admit & Bed Allot</span>
                  </div>
                </button>

                {/* 3. Print Slip Button */}
                <button
                  type="button"
                  className="prem-btn-action prem-btn-action--print"
                  onClick={handlePrintSlip}
                  title="Generate and print patient registration slip"
                >
                  <div className="prem-btn-icon">
                    <Icon name="LuPrinter" size={17} />
                  </div>
                  <div className="prem-btn-txt">
                    <span className="prem-btn-title">Print Slip</span>
                    <span className="prem-btn-sub">UHID Card / Slip</span>
                  </div>
                </button>

                {/* 4. Cancel Button */}
                <button
                  type="button"
                  className="prem-btn-action prem-btn-action--cancel"
                  onClick={handleCancel}
                  title="Clear form and reset"
                >
                  <div className="prem-btn-icon">
                    <Icon name="LuXCircle" size={17} />
                  </div>
                  <div className="prem-btn-txt">
                    <span className="prem-btn-title">Cancel</span>
                    <span className="prem-btn-sub">Clear Form</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= USER REQUEST: OFFICIAL PRINTABLE REGISTRATION SLIP MODAL ================= */}
      {slipModalOpen && registeredReceipt && (
        <div className="prem-modal-overlay" onClick={() => setSlipModalOpen(false)}>
          <div className="prem-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="prem-modal-head">
              <div className="prem-modal-title-wrap">
                <Icon name="LuFileCheck2" size={18} />
                <span>Hospital Registration Slip & Official Cash Receipt</span>
              </div>
              <div className="prem-modal-controls">
                {/* Print Format Switcher: 3-Inch Thermal vs A4 Full Slip */}
                <div className="prem-slip-format-toggle">
                  <button
                    type="button"
                    className={`prem-fmt-btn ${slipPrintFormat === "slip" ? "prem-fmt-btn--active" : ""}`}
                    onClick={() => setSlipPrintFormat("slip")}
                  >
                    3-Inch Thermal Slip
                  </button>
                  <button
                    type="button"
                    className={`prem-fmt-btn ${slipPrintFormat === "a4" ? "prem-fmt-btn--active" : ""}`}
                    onClick={() => setSlipPrintFormat("a4")}
                  >
                    A4 Full Receipt
                  </button>
                </div>
                <button
                  type="button"
                  className="prem-modal-close"
                  onClick={() => setSlipModalOpen(false)}
                >
                  <Icon name="LuX" size={18} />
                </button>
              </div>
            </div>

            {/* PRINTABLE SLIP CONTENT */}
            <div className={`prem-slip-content ${slipPrintFormat === "slip" ? "prem-slip-content--thermal" : "prem-slip-content--a4"}`} id="printableHospitalSlip">
              {/* Hospital Header */}
              <div className="prem-slip-hosp-header">
                <h2 className="prem-hosp-title">METRO MULTISPECIALITY HOSPITAL & RESEARCH INSTITUTE</h2>
                <div className="prem-hosp-sub">NABH ACCREDITED TERTIARY CARE CENTRE</div>
                <div className="prem-hosp-address">
                  Sector 12, Vikas Nagar, Lucknow - 226001 | 24x7 Helpline: 0522-2987654 / +91-9876543210
                </div>
                <div className="prem-slip-meta-bar">
                  <span className="prem-slip-badge-type">{registeredReceipt.type}</span>
                  <span className="prem-slip-receipt-no">Receipt: {registeredReceipt.receiptNo}</span>
                  <span className="prem-slip-datetime">{registeredReceipt.date} • {registeredReceipt.time}</span>
                </div>
              </div>

              {/* Barcode & UHID Bar */}
              <div className="prem-slip-barcode-strip">
                <div className="prem-barcode-font">|||||||| |||| ||||| |||||| |||| |||||||| ||||| |||||||</div>
                <div className="prem-barcode-label">UHID: {registeredReceipt.uhid} | PID: {registeredReceipt.patientId}</div>
              </div>

              {/* Patient Demographics & Doctor Details Table */}
              <table className="prem-slip-data-table">
                <tbody>
                  <tr>
                    <th>Patient Name:</th>
                    <td className="prem-data-bold">{registeredReceipt.patientName}</td>
                    <th>Age / Gender:</th>
                    <td>{registeredReceipt.ageGender}</td>
                  </tr>
                  <tr>
                    <th>UHID No:</th>
                    <td className="prem-uhid-blue">{registeredReceipt.uhid}</td>
                    <th>Mobile No:</th>
                    <td>{registeredReceipt.mobile}</td>
                  </tr>
                  <tr>
                    <th>Address / City:</th>
                    <td>{registeredReceipt.address || "Local"}</td>
                    <th>Patient Category:</th>
                    <td>{registeredReceipt.isOldPatient ? "Old Patient (Re-Visit)" : "New Patient Registration"}</td>
                  </tr>
                  <tr>
                    <th>Department:</th>
                    <td className="prem-data-bold">{registeredReceipt.department}</td>
                    <th>Consulting Doctor:</th>
                    <td className="prem-data-bold">{registeredReceipt.doctor}</td>
                  </tr>

                  {/* OPD Token Highlight Row */}
                  {registeredReceipt.tokenNo && (
                    <tr className="prem-token-highlight-row">
                      <th>OPD Token No:</th>
                      <td colSpan={3}>
                        <span className="prem-token-pill">{registeredReceipt.tokenNo}</span>
                        <span className="prem-token-chamber">({registeredReceipt.chamberNo})</span>
                      </td>
                    </tr>
                  )}

                  {/* IPD Admission Highlight Row */}
                  {registeredReceipt.admissionNo && (
                    <tr className="prem-adm-highlight-row">
                      <th>IPD Admission No:</th>
                      <td><strong>{registeredReceipt.admissionNo}</strong></td>
                      <th>Allotted Bed & Ward:</th>
                      <td className="prem-bed-bold">{registeredReceipt.wardBed}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Payment Summary */}
              <div className="prem-slip-payment-card">
                <div className="prem-payment-head">Official Payment Collection Receipt</div>
                <div className="prem-payment-lines">
                  <div className="prem-payment-line">
                    <span>Registration & Card Fee:</span>
                    <span>₹ {registeredReceipt.regFee.toFixed(2)}</span>
                  </div>
                  {registeredReceipt.consultCharge !== undefined && (
                    <div className="prem-payment-line">
                      <span>Doctor Consultation Charge:</span>
                      <span>₹ {registeredReceipt.consultCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {registeredReceipt.advancePaid !== undefined && (
                    <div className="prem-payment-line">
                      <span>IPD Admission Bed Advance:</span>
                      <span>₹ {registeredReceipt.advancePaid.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="prem-payment-line prem-payment-line--total">
                    <span>Total Amount Paid in {registeredReceipt.paymentMode.toUpperCase()}:</span>
                    <span className="prem-paid-sum">₹ {registeredReceipt.totalPaid.toFixed(2)}</span>
                  </div>

                  {registeredReceipt.paymentMode === "Cash" && (
                    <div className="prem-payment-cash-breakdown">
                      <span>Cash Received: ₹ {registeredReceipt.cashReceived.toFixed(2)}</span>
                      <span>Change Returned: ₹ {registeredReceipt.cashChange.toFixed(2)}</span>
                      <span className="prem-status-paid">PAID IN FULL (CASH)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Instructions */}
              <div className="prem-slip-footer-notes">
                <div className="prem-terms">
                  1. OPD Consultation is valid for 7 days with the same consultant doctor.<br />
                  2. Please present this slip at Doctor Chamber {registeredReceipt.chamberNo || "#102"} / IPD Nursing Station.<br />
                  3. For emergency & investigations, report to Reception Counter #1.
                </div>
                <div className="prem-sign-area">
                  <div className="prem-sign-box">
                    <span className="prem-sign-line">Cashier / Receptionist</span>
                    <span className="prem-sign-role">Authorized Signature</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="prem-modal-actions">
              <button
                type="button"
                className="prem-btn-print-slip"
                onClick={triggerDirectPrint}
              >
                <Icon name="LuPrinter" size={16} />
                <span>Print Slip Now (Thermal / A4)</span>
              </button>

              {registeredReceipt.type.includes("OPD") ? (
                <button
                  type="button"
                  className="prem-btn-nav-opd"
                  onClick={() => navigate("/opd/registration")}
                >
                  <Icon name="LuArrowRight" size={15} />
                  <span>Go to OPD Queue</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="prem-btn-nav-ipd"
                  onClick={() => navigate("/ipd/admission")}
                >
                  <Icon name="LuArrowRight" size={15} />
                  <span>Go to IPD Ward</span>
                </button>
              )}

              <button
                type="button"
                className="prem-btn-next-pat"
                onClick={() => {
                  setSlipModalOpen(false);
                  handleSetNewPatient();
                }}
              >
                Register Next Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
