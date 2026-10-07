import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import { mockStore } from "../../../mock/mockStore";
import patientService from "../../../api/services/patientService";
import "./OPDTokenQueue.css";

// ── Department & Doctor Fee Structure ──────────────────────────────────────────
const DEPARTMENT_FEES = {
  "General Medicine": 500,
  Cardiology: 700,
  Orthopedics: 600,
  Pediatrics: 400,
  Gynecology: 600,
  "General Surgery": 750,
  Neurology: 800,
  Dermatology: 500,
  ENT: 450,
  Ophthalmology: 450,
  Urology: 700,
};

const DOCTOR_LIST = {
  "General Medicine": [
    { id: "d1", name: "Dr. Amit Sharma", degree: "MBBS, MD (Medicine)", status: "Available", room: "101" },
    { id: "d2", name: "Dr. Neha Singh", degree: "MBBS, MD (Medicine)", status: "Available", room: "102" },
    { id: "d3", name: "Dr. Raj Verma", degree: "MBBS, MD (Medicine)", status: "Busy", room: "103" },
  ],
  Cardiology: [
    { id: "d4", name: "Dr. Priya Deshmukh", degree: "MD (Cardiology)", status: "Available", room: "201" },
    { id: "d5", name: "Dr. Suresh Gupta", degree: "DM (Cardiology)", status: "Available", room: "202" },
  ],
  Orthopedics: [
    { id: "d6", name: "Dr. Anand Kulkarni", degree: "MS (Ortho)", status: "Available", room: "301" },
    { id: "d7", name: "Dr. Vikram Rao", degree: "DNB (Ortho)", status: "Available", room: "302" },
  ],
  Pediatrics: [
    { id: "d8", name: "Dr. Arvind Saxena", degree: "MD (Pediatrics)", status: "Available", room: "401" },
  ],
  Gynecology: [
    { id: "d9", name: "Dr. Meenakshi Iyer", degree: "DGO (Gynae)", status: "Available", room: "501" },
  ],
  "General Surgery": [
    { id: "d10", name: "Dr. Rajesh Sharma", degree: "MS (Surgery)", status: "Available", room: "601" },
  ],
  Neurology: [
    { id: "d11", name: "Dr. Vinay Patil", degree: "DM (Neuro)", status: "Available", room: "701" },
  ],
  Dermatology: [
    { id: "d12", name: "Dr. Sneha Joshi", degree: "MD (Derma)", status: "Available", room: "801" },
  ],
  ENT: [
    { id: "d13", name: "Dr. Kiran Rathi", degree: "MS (ENT)", status: "Available", room: "901" },
  ],
  Ophthalmology: [
    { id: "d14", name: "Dr. Rohit Agarwal", degree: "MS (Ophthal)", status: "Available", room: "1001" },
  ],
  Urology: [
    { id: "d15", name: "Dr. Manoj Chaurasia", degree: "MCh (Urology)", status: "Available", room: "1101" },
  ],
};

// ── Complaint Categories & Popular Complaints Dataset ──────────────────────────
const COMPLAINT_CATEGORIES = [
  {
    category: "Common Complaints",
    items: ["Fever", "Cough", "Cold / Runny Nose", "Headache", "Body Pain", "Weakness / Fatigue", "Other / अन्य"],
  },
  {
    category: "Respiratory",
    items: ["Breathing Difficulty", "Cough", "Chest Congestion", "Sore Throat"],
  },
  {
    category: "Gastrointestinal",
    items: ["Abdominal Pain", "Vomiting", "Diarrhea", "Acidity"],
  },
  {
    category: "Cardiac",
    items: ["Chest Pain", "Palpitations", "Shortness of Breath"],
  },
];

const POPULAR_COMPLAINTS = [
  "Fever", "Cough", "Cold", "Headache", "Chest Pain",
  "Vomiting", "Abdominal Pain", "Body Pain", "Weakness", "Other"
];

export default function OPDTokenQueue() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Form Section 1: Visit Details
  const [visitType, setVisitType] = useState("New Visit");
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Form Section 2: Patient Complaint State
  const [selectedComplaints, setSelectedComplaints] = useState(["Fever", "Body Pain"]);
  const [complaintSearch, setComplaintSearch] = useState("");
  const [showComplaintDropdown, setShowComplaintDropdown] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherComplaintText, setOtherComplaintText] = useState("");
  const [duration, setDuration] = useState("3");
  const [durationUnit, setDurationUnit] = useState("Days");
  const [symptoms, setSymptoms] = useState("");
  const complaintRef = useRef(null);

  // Attendant Details (Optional)
  const [attendantName, setAttendantName] = useState("");
  const [attendantRelation, setAttendantRelation] = useState("");
  const [attendantPhone, setAttendantPhone] = useState("");

  // Form Section 3: Department & Doctor
  const [department, setDepartment] = useState("General Medicine");
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTOR_LIST["General Medicine"][0]);

  // Form Section 4: Consultation Details
  const [consultationType, setConsultationType] = useState("General OPD");

  // Form Section 5: Fee & Billing
  const [registrationFee] = useState(100);
  const [consultationFee, setConsultationFee] = useState(500);
  const [serviceFee, setServiceFee] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Form Section 6: Payment Details
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");

  // Print Slip Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [opdSlipData, setOpdSlipData] = useState(null);

  // Close search dropdown & complaint dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (complaintRef.current && !complaintRef.current.contains(e.target)) {
        setShowComplaintDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load patient list and check URL parameter `?uhid=...`
  useEffect(() => {
    const loadFromUrl = async () => {
      const uhidParam = searchParams.get("uhid");
      if (uhidParam) {
        try {
          const results = await patientService.search({ uhid: uhidParam });
          if (results && results.length > 0) {
            const found = results[0];
            setSelectedPatient(found);
            setSearchQuery(`${found.full_name || found.name || found.first_name} (${found.uhid})`);
            if (found.department && DOCTOR_LIST[found.department]) {
              setDepartment(found.department);
            }
            try {
              const headId = found.family_head_id || found.id;
              const family = await patientService.getFamilyMembers(headId);
              setFamilyMembers(family);
            } catch (err) {
              console.error("Failed to fetch family members:", err);
            }
          }
        } catch (error) {
          console.error("Failed to fetch patient by UHID:", error);
        }
      } else {
        setSelectedPatient(null);
        setFamilyMembers([]);
      }
    };
    loadFromUrl();
  }, [searchParams]);

  // Update Consultation Fee & Selected Doctor when Department changes
  useEffect(() => {
    const fee = DEPARTMENT_FEES[department] || 500;
    setConsultationFee(fee);
    const docs = DOCTOR_LIST[department] || [];
    if (docs.length > 0) {
      setSelectedDoctor(docs[0]);
    } else {
      setSelectedDoctor(null);
    }
  }, [department]);

  // Handle Patient Search Input Change
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    try {
      const results = await patientService.search({ query: query.trim() });
      setSearchResults(results.slice(0, 6));
      setShowDropdown(true);
    } catch (error) {
      console.error("Failed to search patients:", error);
    }
  };

  const handleSelectPatient = async (p) => {
    setSelectedPatient(p);
    setSearchQuery(`${p.full_name || p.name || p.first_name} (${p.uhid})`);
    setShowDropdown(false);
    toast.success(`Patient selected: ${p.full_name || p.name || p.first_name}`);
    try {
      const headId = p.family_head_id || p.id;
      const family = await patientService.getFamilyMembers(headId);
      setFamilyMembers(family);
    } catch (err) {
      console.error("Failed to fetch family members:", err);
    }
  };

  // Complaint Selection Handlers
  const toggleComplaint = (item) => {
    if (selectedComplaints.includes(item)) {
      setSelectedComplaints(selectedComplaints.filter((c) => c !== item));
    } else {
      setSelectedComplaints([...selectedComplaints, item]);
    }
  };

  const removeComplaint = (item) => {
    setSelectedComplaints(selectedComplaints.filter((c) => c !== item));
  };

  const addCustomComplaint = () => {
    if (complaintSearch.trim() && !selectedComplaints.includes(complaintSearch.trim())) {
      setSelectedComplaints([...selectedComplaints, complaintSearch.trim()]);
      setComplaintSearch("");
      setShowComplaintDropdown(false);
    }
  };

  const handleAddOtherComplaint = () => {
    const val = otherComplaintText.trim();
    if (val) {
      if (!selectedComplaints.includes(val)) {
        setSelectedComplaints([...selectedComplaints, val]);
      }
      setOtherComplaintText("");
      setShowOtherInput(false);
    }
  };

  // Billing Calculations
  const subTotal = Number(consultationFee || 0) + Number(registrationFee || 0) + Number(serviceFee || 0);
  const totalAmount = Math.max(0, subTotal - Number(discount || 0));

  // Form Submit Handler
  const handleRegisterOPD = (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Please search and select a patient first for OPD registration!");
      return;
    }

    const chiefComplaintText = selectedComplaints.length > 0
      ? selectedComplaints.join(", ")
      : (complaintSearch.trim() || "General Consultation");

    if (!selectedDoctor) {
      toast.error("Please select a Doctor");
      return;
    }

    const tokenNo = `A-0${Math.floor(Math.random() * 800 + 100)}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    const slipInfo = {
      tokenNo,
      date: formattedDate,
      patientName: selectedPatient.full_name || selectedPatient.name || `${selectedPatient.first_name || ""} ${selectedPatient.last_name || ""}`.trim(),
      uhid: selectedPatient.uhid,
      phone: selectedPatient.phone || selectedPatient.mobile1 || selectedPatient.mobile || "—",
      age: selectedPatient.age || selectedPatient.ageYrs || "32",
      gender: selectedPatient.gender || "Male",
      address: selectedPatient.address || "Sector 21, Noida, Uttar Pradesh",
      doctor: selectedDoctor.name,
      doctorDegree: selectedDoctor.degree,
      roomNo: selectedDoctor.room,
      department,
      chiefComplaint: `${chiefComplaintText} (${duration} ${durationUnit})`,
      symptoms,
      visitType,
      consultationType,
      registrationFee,
      consultationFee,
      serviceFee,
      discount,
      totalAmount,
      paymentMode,
      paymentStatus,
      attendantName,
      attendantRelation,
      attendantPhone
    };

    mockStore.addOPDToken({
      tokenNo,
      patientName: slipInfo.patientName,
      uhid: slipInfo.uhid,
      doctor: selectedDoctor.name,
      department,
      chiefComplaint: slipInfo.chiefComplaint,
      fee: totalAmount,
      paymentMode,
      paymentStatus,
      status: "Waiting",
      roomNo: selectedDoctor.room,
      attendantName,
      attendantRelation,
      attendantPhone
    });

    setOpdSlipData(slipInfo);
    setShowPrintModal(true);
    toast.success(`OPD Token #${tokenNo} generated successfully!`);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const currentDoctors = DOCTOR_LIST[department] || [];

  return (
    <div className="opd-container">
      {/* ── TOP HEADER & BREADCRUMB ── */}
      <div className="opd-page-header">
        <div>
          <h1 className="opd-page-title">OPD Registration</h1>
          <div className="opd-breadcrumb">
            <span>Home</span> &gt; <span>OPD</span> &gt; <span className="active">OPD Registration</span>
          </div>
        </div>
      </div>

      {/* ── PATIENT SEARCH BAR ── */}
      <div ref={searchRef} className="opd-search-card">
        <label className="opd-search-label">
          Search Patient (UHID / Mobile / Name) <span className="font-normal text-slate-400">· मरीज खोजें</span>
        </label>
        <div className="opd-search-row">
          <div className="opd-search-input-wrapper">
            <Icon name="LuSearch" size={16} className="opd-search-icon" />
            <input
              type="text"
              className="opd-search-input"
              placeholder="Search by UHID / Mobile Number / Patient Name / नाम या मोबाइल से खोजें"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            />
            {searchQuery && (
              <button
                type="button"
                className="opd-search-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setShowDropdown(false);
                }}
              >
                <Icon name="LuX" size={14} />
              </button>
            )}
          </div>
          <button type="button" className="opd-btn-search">
            <Icon name="LuSearch" size={14} /> Search
          </button>
          <span className="opd-or-divider">OR</span>
          <button
            type="button"
            className="opd-btn-new-patient"
            onClick={() => navigate("/registration/register-patient")}
          >
            + New Patient Registration
          </button>
        </div>

        {/* Search Dropdown Results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="opd-search-dropdown">
            {searchResults.map((pt) => (
              <div
                key={pt.uhid || pt.id}
                className="opd-dropdown-item"
                onClick={() => handleSelectPatient(pt)}
              >
                <div className="opd-dropdown-avatar">
                  {(pt.full_name || pt.name || pt.first_name || "P")[0].toUpperCase()}
                </div>
                <div className="opd-dropdown-info">
                  <div className="opd-dropdown-name">
                    {pt.full_name || pt.name || `${pt.first_name || ""} ${pt.last_name || ""}`.trim()}
                    <span className="opd-dropdown-uhid-badge">{pt.uhid}</span>
                  </div>
                  <div className="opd-dropdown-sub">
                    📞 {pt.phone || pt.mobile1 || pt.mobile || "—"} | {pt.age || pt.ageYrs || "32"} Yrs / {pt.gender || "Male"} | 🩸 {pt.blood_group || pt.bloodGroup || "B+"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PATIENT BANNER CARD (BLANK PROMPT IF NOT SELECTED) ── */}
      {selectedPatient ? (
        <div className="opd-patient-banner">
          <div className="opd-pb-left">
            <div className="opd-pb-avatar">
              <img
                src={selectedPatient.avatarUrl || ""}
                alt="Patient Avatar"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="opd-pb-avatar-fallback">
                {(selectedPatient.full_name || selectedPatient.name || selectedPatient.first_name || "P")[0].toUpperCase()}
              </div>
            </div>

            <div className="opd-pb-info-grid">
              <div className="opd-pb-name-row">
                <h2 className="opd-pb-name">
                  {selectedPatient.full_name || selectedPatient.name || `${selectedPatient.first_name || ""} ${selectedPatient.last_name || ""}`.trim()}
                </h2>
              </div>

              <div className="opd-pb-meta-grid">
                <div className="opd-meta-item">
                  <span className="lbl">UHID :</span>
                  <span className="val bold">{selectedPatient.uhid || "LH-10245"}</span>
                </div>
                <div className="opd-meta-item">
                  <span className="lbl">Phone :</span>
                  <span className="val">{selectedPatient.phone || selectedPatient.mobile1 || "9876543210"}</span>
                </div>
                <div className="opd-meta-item">
                  <span className="lbl">Age / Gender :</span>
                  <span className="val bold">{selectedPatient.age || "32"} Years / {selectedPatient.gender || "Male"}</span>
                </div>

                <div className="opd-meta-item">
                  <span className="lbl">Address :</span>
                  <span className="val">{selectedPatient.address || "Sector 21, Noida, Uttar Pradesh"}</span>
                </div>
               
              </div>
            </div>
          </div>

          <div className="opd-pb-right">
            <button type="button" className="opd-btn-view-profile">
              <Icon name="LuEye" size={14} /> View Full Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="opd-patient-banner opd-banner-empty">
          <Icon name="LuUser" size={32} className="empty-user-icon" />
          <div className="empty-text">
            <h3>No Patient Selected</h3>
            <p>Please search patient by UHID, Mobile Number or Name above, or register a new patient.</p>
          </div>
        </div>
      )}

      {/* ── FAMILY MEMBER SELECTOR ── */}
      {familyMembers.length > 1 && (
        <div className="opd-card mb-4 p-4 border border-blue-100 bg-blue-50/30 rounded-xl">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Book Appointment For:</h4>
          <div className="flex gap-2 flex-wrap">
            {familyMembers.map(member => (
              <button
                key={member.id}
                type="button"
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  selectedPatient?.id === member.id 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                }`}
                onClick={async () => {
                  try {
                    const fullMember = await patientService.getById(member.id);
                    setSelectedPatient(fullMember);
                    toast.success(`Switched patient to ${fullMember.full_name || fullMember.first_name}`);
                  } catch(e) {
                    setSelectedPatient(member);
                  }
                }}
              >
                {member.first_name} {member.last_name || ''} 
                <span className="text-xs opacity-75 ml-1">
                  ({member.relation_to_head || (member.id === (member.family_head_id || member.id) ? 'Head' : 'Self')})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN FORM CONTAINER: 2 COLUMNS ── */}
      <form onSubmit={handleRegisterOPD} className="opd-form-grid">
        {/* ── LEFT COLUMN ── */}
        <div className="opd-left-col">
          {/* SECTION 1: VISIT DETAILS */}
          <div className="opd-card">
            <h3 className="opd-card-title">
              <Icon name="LuCalendar" size={16} className="title-icon" /> 1. Visit Details
            </h3>
            <div className="opd-form-row col-2">
              <div className="opd-field-group">
                <label className="opd-label">Visit Type <span className="req">*</span></label>
                <div className="opd-btn-group">
                  {[
                    { en: "New Visit", hi: "नया" },
                    { en: "Follow-up", hi: "फॉलो-अप" },
                    
                    { en: "Emergency", hi: "आपात" }
                  ].map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      className={`opd-toggle-btn ${visitType === item.en ? "active" : ""}`}
                      onClick={() => setVisitType(item.en)}
                    >
                      {item.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="opd-field-group">
                <label className="opd-label">
                  Visit Date <span className="req">*</span> <span className="font-normal text-slate-400">· तारीख (DD/MM/YYYY)</span>
                </label>
                <input
                  type="date"
                  className="opd-input"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                />
              </div>
            </div>

            <div className="opd-form-row col-3" style={{ marginTop: '16px' }}>
              <div className="opd-field-group">
                <label className="opd-label">
                  Attendant Name <span className="font-normal text-slate-400">· परिचारक (Optional)</span>
                </label>
                <input
                  type="text"
                  className="opd-input"
                  placeholder="Enter attendant name"
                  value={attendantName}
                  onChange={(e) => setAttendantName(e.target.value)}
                />
              </div>
              <div className="opd-field-group">
                <label className="opd-label">Relation <span className="font-normal text-slate-400">· संबंध</span></label>
                <select 
                  className="opd-select"
                  value={attendantRelation}
                  onChange={(e) => setAttendantRelation(e.target.value)}
                >
                  <option value="">-- Select Relation --</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="opd-field-group">
                <label className="opd-label">Attendant Phone <span className="font-normal text-slate-400">· मोबाइल</span></label>
                <input
                  type="text"
                  className="opd-input"
                  placeholder="10-digit mobile"
                  value={attendantPhone}
                  onChange={(e) => setAttendantPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PATIENT COMPLAINT (SELECT & CHIPS DESIGN) */}
          <div className="opd-card">
            <h3 className="opd-card-title">
              <Icon name="LuFileText" size={16} className="title-icon" /> 2. Patient Complaint <span className="font-normal text-slate-400 text-xs">· मरीज की समस्या</span>
            </h3>

            <div className="opd-form-row col-1">
              {/* Complaint Search / Select */}
              <div className="opd-field-group" ref={complaintRef}>
                <label className="opd-label">
                  Chief Complaint / Main Problem <span className="req">*</span> <span className="font-normal text-slate-400">· समस्या</span>
                </label>
                <div className="complaint-search-wrapper">
                  <Icon name="LuSearch" size={16} className="complaint-search-icon" />
                  <input
                    type="text"
                    className="opd-input complaint-search-input"
                    placeholder="Search complaint / समस्या खोजें या चुनें..."
                    value={complaintSearch}
                    onChange={(e) => {
                      setComplaintSearch(e.target.value);
                      setShowComplaintDropdown(true);
                    }}
                    onFocus={() => setShowComplaintDropdown(true)}
                  />
                  <span className="complaint-dropdown-arrow">▼</span>

                  {/* Dropdown Menu */}
                  {showComplaintDropdown && (
                    <div className="complaint-dropdown-menu">
                      {COMPLAINT_CATEGORIES.map((cat) => {
                        const filtered = cat.items.filter((item) =>
                          item.toLowerCase().includes(complaintSearch.toLowerCase())
                        );
                        if (filtered.length === 0) return null;
                        return (
                          <div key={cat.category} className="complaint-cat-block">
                            <div className="complaint-cat-title">{cat.category}</div>
                            {filtered.map((item) => {
                              const isSelected = selectedComplaints.includes(item);
                              return (
                                <div
                                  key={item}
                                  className={`complaint-dropdown-item ${isSelected ? "selected" : ""}`}
                                  onClick={() => {
                                    if (item === "Other" || item.includes("Other")) {
                                      setShowOtherInput(true);
                                      setShowComplaintDropdown(false);
                                    } else {
                                      toggleComplaint(item);
                                      setComplaintSearch("");
                                      setShowComplaintDropdown(false);
                                    }
                                  }}
                                >
                                  <span>{item}</span>
                                  {isSelected && <span className="check-mark">✓</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}

                      {complaintSearch.trim() ? (
                        <div
                          className="complaint-dropdown-item custom-add-btn"
                          onClick={addCustomComplaint}
                        >
                          + Add Custom: "{complaintSearch}"
                        </div>
                      ) : (
                        <div
                          className="complaint-dropdown-item custom-add-btn"
                          onClick={() => {
                            setShowOtherInput(true);
                            setShowComplaintDropdown(false);
                          }}
                        >
                          + Other / अन्य (Type Custom Problem)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Other Complaint Input Box */}
                {showOtherInput && (
                  <div className="other-complaint-box">
                    <input
                      type="text"
                      className="opd-input other-complaint-input"
                      placeholder="Type other problem / अन्य समस्या दर्ज करें..."
                      value={otherComplaintText}
                      onChange={(e) => setOtherComplaintText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddOtherComplaint();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="other-add-btn"
                      onClick={handleAddOtherComplaint}
                    >
                      + Add / जोड़ें
                    </button>
                    <button
                      type="button"
                      className="other-cancel-btn"
                      onClick={() => {
                        setShowOtherInput(false);
                        setOtherComplaintText("");
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Popular Complaints Chips */}
              <div className="opd-field-group">
                <label className="opd-label-sub">Popular Complaints</label>
                <div className="popular-chips-flex">
                  {POPULAR_COMPLAINTS.map((item) => {
                    const isSelected = selectedComplaints.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`chip-btn ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          if (item === "Other" || item.includes("Other")) {
                            setShowOtherInput(true);
                          } else {
                            toggleComplaint(item);
                          }
                        }}
                      >
                        {isSelected ? `✓ ${item}` : `+ ${item}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Complaints Tag Pills */}
              {selectedComplaints.length > 0 && (
                <div className="opd-field-group">
                  <label className="opd-label-sub">Selected Complaints ({selectedComplaints.length})</label>
                  <div className="selected-tags-flex">
                    {selectedComplaints.map((item) => (
                      <span key={item} className="selected-tag-pill">
                        {item}
                        <button
                          type="button"
                          className="tag-remove-btn"
                          onClick={() => removeComplaint(item)}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Symptoms / Notes */}
              <div className="opd-field-group">
                <label className="opd-label">
                  Additional Symptoms / Notes <span className="font-normal text-slate-400">· लक्षण / अतिरिक्त विवरण</span>
                </label>
                <textarea
                  className="opd-textarea"
                  rows={2}
                  placeholder="Enter any additional symptoms or notes (e.g. Patient has mild weakness and headache)..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: DEPARTMENT & DOCTOR */}
          <div className="opd-card">
            <h3 className="opd-card-title">
              <Icon name="LuStethoscope" size={16} className="title-icon" /> 3. Department & Doctor
            </h3>
            <div className="opd-form-row col-1">
              <div className="opd-field-group">
                <div className="flex-justify-between">
                  <label className="opd-label">Department <span className="req">*</span></label>
                  <span className="opd-avail-doc-text">
                    Available Doctors ({department}){" "}
                    <button type="button" className="opd-refresh-link" onClick={() => toast.success("Refreshed doctor list")}>
                      <Icon name="LuRefreshCw" size={12} /> Refresh
                    </button>
                  </span>
                </div>
                <select
                  className="opd-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">— Select department / विभाग चुनें —</option>
                  {Object.keys(DOCTOR_LIST).map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Cards Row */}
              <div className="opd-doctors-grid">
                {currentDoctors.map((doc) => {
                  const isSelected = selectedDoctor?.name === doc.name;
                  return (
                    <div
                      key={doc.name}
                      className={`opd-doctor-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedDoctor(doc)}
                    >
                      <input
                        type="radio"
                        name="doctorSelection"
                        checked={isSelected}
                        onChange={() => setSelectedDoctor(doc)}
                        className="opd-doc-radio"
                      />
                      <div className="opd-doc-info">
                        <div className="opd-doc-name">{doc.name}</div>
                        <div className="opd-doc-degree">{doc.degree}</div>
                        <div className="opd-doc-footer">
                          <span
                            className={`opd-doc-status ${
                              doc.status === "Available" ? "status-avail" : "status-busy"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="opd-right-col">
          {/* SECTION 5: OPD FEE & CHARGES */}
          <div className="opd-card">
            <h3 className="opd-card-title">
              <Icon name="LuDollarSign" size={16} className="title-icon" /> 5. OPD Fee & Charges
            </h3>
            <div className="opd-billing-box">
              <div className="billing-row">
                <span className="lbl">Registration Fee</span>
                <span className="val">₹ {registrationFee.toFixed(2)}</span>
              </div>
              <div className="billing-row">
                <span className="lbl">Consultation Fee</span>
                <span className="val">₹ {consultationFee.toFixed(2)}</span>
              </div>
             

              <div className="billing-divider" />

              <div className="billing-row bold-row">
                <span className="lbl">Sub Total</span>
                <span className="val">₹ {subTotal.toFixed(2)}</span>
              </div>

              <div className="billing-row align-center">
                <span className="lbl">Discount </span>
                <div className="input-currency-wrapper">
                  <input
                    type="number"
                    className="opd-input small"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                  <span className="currency-sym">₹</span>
                </div>
              </div>

              <div className="total-amount-card">
                <span className="total-title">Total Amount </span>
                <span className="total-value">₹ {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* SECTION 6: PAYMENT DETAILS */}
          <div className="opd-card">
            <h3 className="opd-card-title">
              <Icon name="LuCreditCard" size={16} className="title-icon" /> 6. Payment Details
            </h3>
            <div className="opd-payment-form">
              <label className="opd-label">Payment Mode <span className="req">*</span></label>
              <div className="opd-radio-grid-3">
                {["Cash", "UPI", "Insurance/TPA"].map((mode) => (
                  <label key={mode} className="radio-label">
                    <input
                      type="radio"
                      name="paymentMode"
                      value={mode}
                      checked={paymentMode === mode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    />
                    {mode}
                  </label>
                ))}
              </div>

              <div className="payment-status-row">
                <div className="opd-field-group">
                  <label className="opd-label">Payment Status</label>
                  <div className="opd-radio-inline">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="payStatus"
                        value="Paid"
                        checked={paymentStatus === "Paid"}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                      />
                      Paid 
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="payStatus"
                        value="Pending"
                        checked={paymentStatus === "Pending"}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                      />
                      Pending 
                    </label>
                  </div>
                </div>

                <div className="opd-field-group">
                  <label className="opd-label">Received Amount</label>
                  <div className="input-currency-wrapper">
                    <input
                      type="number"
                      className="opd-input small"
                      value={totalAmount}
                      readOnly
                    />
                    <span className="currency-sym">₹</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER ACTION BUTTONS */}
          <div className="opd-footer-actions">
            <button
              type="button"
              className="opd-btn-cancel"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="opd-btn-draft"
              onClick={() => toast.success("Draft saved successfully")}
            >
              Save as Draft
            </button>
            <button type="submit" className="opd-btn-register">
              Register OPD <Icon name="LuArrowRight" size={16} />
            </button>
          </div>
        </div>
      </form>

      {/* ── OPD CONSULTATION RECEIPT PRINT MODAL ── */}
      {showPrintModal && opdSlipData && (
        <div className="opd-modal-overlay">
          <div className="opd-print-modal">
            <div className="opd-print-header">
              <h3>🎫 OPD Consultation Receipt & Slip</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowPrintModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            {/* PRINTABLE SLIP CONTENT */}
            <div className="printable-slip" id="opd-printable-receipt">
              {/* Top Accent Gradient Bar */}
              <div className="slip-top-accent-bar"></div>

              {/* Clean Header Bar (No Hospital Name/Logo - Ready for Letterhead Paper) */}
              <div className="slip-hospital-header">
                <div className="slip-title-badge-wrap">
                  <span className="slip-badge-title">OPD CONSULTATION SLIP</span>
                </div>

                <div className="token-inline-box">
                  <span className="token-inline-lbl">TOKEN NO</span>
                  <span className="token-num-highlight">{opdSlipData.tokenNo}</span>
                </div>
              </div>

              {/* Patient & Consultation Details 2-Column Structured Grid */}
              <div className="slip-details-grid">
                <div className="slip-detail-item">
                  <span className="lbl">Date & Time:</span>
                  <span className="val font-semibold">{opdSlipData.date}</span>
                </div>
               
                <div className="slip-detail-item">
                  <span className="lbl">UHID:</span>
                  <span className="val font-mono font-bold">{opdSlipData.uhid}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Patient Name:</span>
                  <span className="val font-bold text-slate-800">{opdSlipData.patientName}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Age / Gender:</span>
                  <span className="val">{opdSlipData.age} Yrs / {opdSlipData.gender}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Phone:</span>
                  <span className="val">{opdSlipData.phone}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Department:</span>
                  <span className="val">{opdSlipData.department}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Doctor:</span>
                  <span className="val font-medium">{opdSlipData.doctor} ({opdSlipData.doctorDegree})</span>
                </div>
                <div className="slip-detail-item full-width">
                  <span className="lbl">Chief Complaint:</span>
                  <span className="val font-medium">{opdSlipData.chiefComplaint}</span>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <div className="slip-fee-table">
                <div className="fee-line">
                  <span>Registration Fee</span>
                  <span>₹ {opdSlipData.registrationFee.toFixed(2)}</span>
                </div>
                <div className="fee-line">
                  <span>Consultation Fee</span>
                  <span>₹ {opdSlipData.consultationFee.toFixed(2)}</span>
                </div>
                {opdSlipData.serviceFee > 0 && (
                  <div className="fee-line">
                    <span>Service Fee</span>
                    <span>₹ {opdSlipData.serviceFee.toFixed(2)}</span>
                  </div>
                )}
                {opdSlipData.discount > 0 && (
                  <div className="fee-line text-emerald-600">
                    <span>Discount</span>
                    <span>- ₹ {opdSlipData.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="fee-line total">
                  <span>Amount Paid ({opdSlipData.paymentMode})</span>
                  <span>₹ {opdSlipData.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Section */}
              <div className="slip-footer">
                <div className="footer-left">
                  <p className="thank-msg">Thank you! Wish you good health!</p>
                  <p className="computer-gen">* This is a computer generated OPD token receipt.</p>
                </div>
                <div className="footer-right">
                  <div className="sig-line"></div>
                  <span className="signature">Authorized Receptionist Signature</span>
                </div>
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="opd-print-actions">
              <button
                type="button"
                className="btn-print-action"
                onClick={handlePrintSlip}
              >
                🖨️ Print OPD Slip
              </button>
              <button
                type="button"
                className="btn-close-action"
                onClick={() => setShowPrintModal(false)}
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
