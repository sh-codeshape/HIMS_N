import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import { mockStore } from "../../../mock/mockStore";
import patientService from "../../../api/services/patientService";
import opdService from "../../../api/services/opdService";
import doctorService from "../../../services/doctorService";
import PrintSlipHandler from "../../../services/PrintSlipHandler";
import OPDConsultationSlip from "../../../components/slips/OPDConsultationSlip.jsx";
import settingsService from "../../../api/services/settingsService.js";
import "./OPDTokenQueue.css";

// ── Complaint Categories & Popular Complaints Dataset ──────────────────────────
const COMPLAINT_CATEGORIES = [
  {
    category: "Common Complaints",
    items: ["Fever", "Cough", "Cold / Runny Nose", "Headache", "Body Pain", "Weakness / Fatigue", "Dizziness", "Other / अन्य"],
  },
  {
    category: "Respiratory",
    items: ["Breathing Difficulty", "Cough", "Chest Congestion", "Sore Throat", "Asthma Attack"],
  },
  {
    category: "Gastrointestinal",
    items: ["Abdominal Pain", "Vomiting", "Diarrhea", "Acidity / Gas", "Loss of Appetite", "Constipation"],
  },
  {
    category: "Cardiac",
    items: ["Chest Pain", "Palpitations", "Shortness of Breath", "High BP Check"],
  },
  {
    category: "Orthopedic",
    items: ["Joint Pain", "Backache", "Knee Pain", "Neck Stiffness", "Muscle Pain"],
  },
  {
    category: "ENT & Skin",
    items: ["Ear Ache", "Skin Rash", "Itching", "Allergy / Swelling"],
  },
];

const POPULAR_COMPLAINTS = [
  "Fever", "Cough", "Cold", "Headache", "Chest Pain",
  "Vomiting", "Abdominal Pain", "Body Pain", "Weakness", "Other"
];


// Safe Date Formatter for Patient Details Modal
const formatPatientDate = (val) => {
  if (!val || val === "—") return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return val;
  }
};

const formatAadhaar = (val) => {
  if (!val || val === "—") return "—";
  const digits = String(val).replace(/\D/g, "").slice(0, 12);
  const parts = digits.match(/.{1,4}/g);
  return parts ? parts.join(" ") : val;
};

const formatPatientDateTime = (val) => {
  if (!val || val === "—") return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return (
      d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) +
      ", " +
      d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    );
  } catch {
    return val;
  }
};

export default function OPDTokenQueue() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showPatientModal, setShowPatientModal] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Form Section 1: Visit Details
  const [visitType, setVisitType] = useState("New Visit");
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [visitDetailsOpen, setVisitDetailsOpen] = useState(false);

  // Form Section 2: Patient Complaint State (Starts completely empty)
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [complaintSearch, setComplaintSearch] = useState("");
  const [showComplaintDropdown, setShowComplaintDropdown] = useState(false);
  const [activeComplaintCat, setActiveComplaintCat] = useState("All");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherComplaintText, setOtherComplaintText] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState("Days");
  const [symptoms, setSymptoms] = useState("");
  const complaintRef = useRef(null);
  const complaintInputRef = useRef(null);

  // Attendant Details (Optional)
  const [attendantName, setAttendantName] = useState("");
  const [attendantRelation, setAttendantRelation] = useState("");
  const [attendantPhone, setAttendantPhone] = useState("");

  // Form Section 3: Department & Doctor (loaded dynamically from DB)
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [department, setDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Form Section 4: Consultation Details
  const [consultationType, setConsultationType] = useState("General OPD");

  // Form Section 5: Fee & Billing
  const [showFeeSection, setShowFeeSection] = useState(false);
  // Fee Particulars Table Rows (Matching Image 1)
  const [particulars, setParticulars] = useState([
    { id: 1, service: "OPD Consultation Fee", charge: 500, qty: 1, amount: 500 },
    { id: 2, service: "Registration Fee", charge: 100, qty: 1, amount: 100 }
  ]);

  const handleParticularChange = (id, field, value) => {
    setParticulars((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === "service") {
          if (value === "OPD Consultation Fee") updated.charge = consultationFee;
          else if (value === "Registration Fee") updated.charge = registrationFee;
          else if (value === "Emergency OPD Fee") updated.charge = 700;
          else if (value === "Follow-up Consultation Fee") updated.charge = 300;
          else if (value === "Dressing / Minor Procedure") updated.charge = 200;
          else if (value === "Nursing / Service Charge") updated.charge = 150;
        }
        const charge = Number(updated.charge) || 0;
        const qty = Number(updated.qty) || 1;
        updated.amount = charge * qty;

        if (updated.service === "OPD Consultation Fee") setConsultationFee(charge);
        if (updated.service === "Registration Fee") setRegistrationFee(charge);

        return updated;
      })
    );
  };

  const handleAddParticularRow = () => {
    const newId = particulars.length > 0 ? Math.max(...particulars.map((p) => p.id)) + 1 : 1;
    setParticulars((prev) => [
      ...prev,
      { id: newId, service: "", charge: 0, qty: 1, amount: 0 }
    ]);
  };

  const handleRemoveParticularRow = (id) => {
    if (particulars.length <= 1) {
      toast.error("At least one fee row is required");
      return;
    }
    setParticulars((prev) => prev.filter((p) => p.id !== id));
  };
  const [registrationFee, setRegistrationFee] = useState(100);
  const [consultationFee, setConsultationFee] = useState(500);
  const [serviceFee, setServiceFee] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Form Section 6: Payment Details
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");

  // Print Slip Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [opdSlipData, setOpdSlipData] = useState(null);
  const [slipSettings, setSlipSettings] = useState(null);

  // Load custom hospital slip settings from database
  useEffect(() => {
    settingsService
      .getSetting("print_slip_opd")
      .then((data) => {
        if (data) setSlipSettings(data);
      })
      .catch(() => {});
  }, []);

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
            if (found.department) {
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

  // Load departments and doctors dynamically from DB
  const loadDoctorsAndDepartments = async () => {
    try {
      setLoadingDoctors(true);
      const [depts, docs] = await Promise.all([
        doctorService.getDepartments(),
        doctorService.getDoctors(),
      ]);
      setDepartments(depts || []);
      setDoctors(docs || []);
      // Do not auto-select depts[0] - user selects the department himself!
    } catch (err) {
      console.error("Failed to load departments and doctors:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    loadDoctorsAndDepartments();
  }, []);

  // Filter doctors belonging to the selected department
  const currentDoctors = useMemo(() => {
    if (!department) return doctors;
    const clean = department.toLowerCase().trim();
    return doctors.filter((doc) => {
      const matchSpec = (doc.specialization || "").toLowerCase().trim() === clean;
      const matchDept = (doc.department || "").toLowerCase().trim() === clean;
      const matchId = String(doc.department_id || doc.departmentId || "").toLowerCase() === clean;
      return matchSpec || matchDept || matchId;
    });
  }, [doctors, department]);

  // Update Consultation Fee when Selected Doctor or Visit Type changes (Doctor is NOT forced auto-selected)
  useEffect(() => {
    if (selectedDoctor) {
      const stillValid = currentDoctors.find(
        (d) => d.name === selectedDoctor?.name || d.id === selectedDoctor?.id
      );
      if (stillValid) {
        const fee =
          visitType === "Emergency"
            ? (stillValid.emergency_fee || 800)
            : visitType === "Re-visit / Follow-up"
            ? (stillValid.old_patient_fee || 300)
            : (stillValid.consultation_fee || 500);
        setConsultationFee(fee);
      } else {
        setSelectedDoctor(null);
        setConsultationFee(500);
      }
    }
  }, [department, currentDoctors, visitType]);

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

  // Billing Calculations - Calculated dynamically from particulars table rows
  const subTotal = particulars.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalAmount = Math.max(0, subTotal - Number(discount || 0));

  // Form Submit Handler
  const handleRegisterOPD = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Please search and select a patient first for OPD registration!");
      return;
    }

    const chiefComplaintText = selectedComplaints.length > 0
      ? selectedComplaints.join(", ")
      : (complaintSearch.trim() || "General Consultation");

    // Doctor consultation is now optional as requested
    const docId = selectedDoctor?.id || selectedDoctor?.practitioner_id || undefined;

    try {
      const payload = {
        patient_id: selectedPatient.id,
        facility_id: "00000000-0000-0000-0000-000000000000", // Fallback facility ID
        primary_practitioner_id: docId,
        chief_complaint: `${chiefComplaintText}${duration ? ` (${duration} ${durationUnit})` : ""}`,
        attendant_name: attendantName || undefined,
        attendant_relation: attendantRelation || undefined,
        attendant_phone: attendantPhone || undefined
      };

      const result = await opdService.issueToken(payload);
      const generatedToken = result?.token_number || result?.opd_token || `A-0${Math.floor(Math.random() * 800 + 100)}`;

      const now = new Date();
      const formattedDate = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
      const slipInfo = {
        tokenNo: generatedToken,
        date: formattedDate,
        patientName: selectedPatient.full_name || selectedPatient.name || `${selectedPatient.first_name || ""} ${selectedPatient.last_name || ""}`.trim(),
        uhid: selectedPatient.uhid,
        phone: selectedPatient.phone || selectedPatient.mobile1 || selectedPatient.mobile || "—",
        age: selectedPatient.age || selectedPatient.ageYrs || "—",
        gender: selectedPatient.gender || "—",
        address: [
          selectedPatient.address_line1 || selectedPatient.address,
          selectedPatient.city,
          selectedPatient.state,
          selectedPatient.postal_code || selectedPatient.pincode
        ].filter(Boolean).join(", ") || "—",
        doctor: selectedDoctor?.name || "General OPD / On Duty Doctor",
        doctorDegree: selectedDoctor?.qualification || selectedDoctor?.degree || "",
        roomNo: selectedDoctor?.address || selectedDoctor?.room || "OPD",
        department: department || "General OPD",
        chiefComplaint: `${chiefComplaintText}${duration ? ` (${duration} ${durationUnit})` : ""}`,
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

      setOpdSlipData(slipInfo);
      setShowPrintModal(true);
      toast.success(`OPD Token #${generatedToken} generated successfully!`);
    } catch (err) {
      console.error("Failed to generate OPD token:", err);
      const backendMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message;
      toast.error(backendMessage || "Failed to generate OPD token. Please try again.");
    }
  };

  const handlePrintSlip = () => {
    if (opdSlipData) {
      PrintSlipHandler.printBooking(opdSlipData, slipSettings || {});
    } else {
      window.print();
    }
  };

  return (
    <div className="opd-container">
      {/* ── TOP HEADER & BREADCRUMB ── */}
      <div className="opd-page-header">
        <div className="opd-header-left">
          <div className="opd-header-icon">
            <Icon name="LuClipboardList" size={26} />
          </div>
          <div>
            <h1 className="opd-page-title">OPD Registration</h1>
            
           
          </div>
        </div>
      </div>

      

      {/* ── PATIENT SEARCH BAR ── */}
      <div ref={searchRef} className="opd-search-card">
       
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
            <div className="opd-pb-avatar-wrap">
              <div className="opd-pb-avatar-box">
                {(selectedPatient.full_name || selectedPatient.name || selectedPatient.first_name || "P")[0].toUpperCase()}
              </div>
              <div className="opd-pb-avatar-badge" title="Registered Patient">
                <Icon name="LuCheck" size={11} />
              </div>
            </div>

            <div className="opd-pb-info-col">
              <div className="opd-pb-name-row">
                <h2 className="opd-pb-name">
                  {selectedPatient.full_name || selectedPatient.name || `${selectedPatient.first_name || ""} ${selectedPatient.last_name || ""}`.trim() || "Patient"}
                </h2>
                <span className="opd-pb-tag opd-pb-tag-success">
                  ● Registered Patient
                </span>
                {(selectedPatient.blood_group || selectedPatient.bloodGroup) && (
                  <span className="opd-pb-tag opd-pb-tag-blood">
                    🩸 {selectedPatient.blood_group || selectedPatient.bloodGroup}
                  </span>
                )}
                {selectedPatient.gender && (
                  <span className="opd-pb-tag opd-pb-tag-gender">
                    {String(selectedPatient.gender).toLowerCase() === "female" ? "♀ Female" : "♂ Male"}
                  </span>
                )}
              </div>

              <div className="opd-pb-meta-pills">
                <div className="opd-pb-pill">
                  <span className="pill-lbl">UHID:</span>
                  <span className="pill-val monospace">{selectedPatient.uhid || "—"}</span>
                </div>

                <div className="opd-pb-pill">
                  <Icon name="LuPhone" size={13} className="pill-icon" />
                  <span className="pill-lbl">Phone:</span>
                  <span className="pill-val">{selectedPatient.phone || selectedPatient.mobile1 || selectedPatient.mobile || "—"}</span>
                </div>

                <div className="opd-pb-pill">
                  <Icon name="LuUser" size={13} className="pill-icon" />
                  <span className="pill-lbl">Age / Gender:</span>
                  <span className="pill-val">
                    {selectedPatient.age ? `${selectedPatient.age} Yrs` : "—"} / {selectedPatient.gender || "—"}
                  </span>
                </div>

                <div className="opd-pb-pill">
                  <Icon name="LuMapPin" size={13} className="pill-icon" />
                  <span className="pill-lbl">Address:</span>
                  <span
                    className="pill-val"
                    title={[
                      selectedPatient.address_line1 || selectedPatient.address,
                      selectedPatient.city,
                      selectedPatient.state,
                      selectedPatient.postal_code || selectedPatient.pincode
                    ].filter(Boolean).join(", ") || "—"}
                  >
                    {[
                      selectedPatient.address_line1 || selectedPatient.address,
                      selectedPatient.city,
                      selectedPatient.state,
                      selectedPatient.postal_code || selectedPatient.pincode
                    ].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>

                {(selectedPatient.aadhaar_number || selectedPatient.aadhaar) && (
                  <div className="opd-pb-pill">
                    <Icon name="LuShieldCheck" size={13} className="pill-icon" />
                    <span className="pill-lbl">Aadhaar:</span>
                    <span className="pill-val monospace">{formatAadhaar(selectedPatient.aadhaar_number || selectedPatient.aadhaar)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="opd-pb-right">
            <button
              type="button"
              className="opd-btn-view-patient"
              onClick={() => setShowPatientModal(true)}
              title="View Complete Patient Profile"
            >
              <Icon name="LuEye" size={15} />
              <span>View Patient</span>
            </button>
            <button
              type="button"
              className="opd-btn-clear-patient"
              onClick={() => {
                setSelectedPatient(null);
                setSearchQuery("");
                setFamilyMembers([]);
                toast.success("Patient unselected");
              }}
              title="Clear / Change Patient"
            >
              <Icon name="LuX" size={14} />
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
        <div className="opd-family">
          <h4 className="opd-family-title">Book Appointment For:</h4>
          <div className="opd-family-list">
            {familyMembers.map(member => (
              <button
                key={member.id}
                type="button"
                className={`opd-family-btn ${selectedPatient?.id === member.id ? "active" : ""}`}
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
                <span className="opd-family-rel">
                  ({member.relation_to_head || (member.id === (member.family_head_id || member.id) ? 'Head' : 'Self')})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN FORM CONTAINER: 2 COLUMNS ── */}
      <form onSubmit={handleRegisterOPD} className="opd-form-full">
        {/* SECTION 1: OPD CONSULTATION DETAILS */}
        <div className="opd-card">
          <h3 className="opd-card-title">
            <Icon name="LuStethoscope" size={16} className="title-icon" /> OPD Consultation Details <span className="opd-hint">· परामर्श विवरण</span>
          </h3>

          <div className="opd-form-row col-3">
            {/* 1. Patient Complaint Multi-Select Dropdown */}
            <div className="opd-field-group">
              <div className="flex-justify-between">
                <label className="opd-label">
                  Patient Complaint <span className="req">*</span> <span className="opd-hint">· मरीज की समस्या (Multiple Select)</span>
                </label>
                {selectedComplaints.length > 0 && (
                  <span className="opd-complaints-count-badge">
                    {selectedComplaints.length} selected
                  </span>
                )}
              </div>
              <select
                className="opd-select"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  if (val === "Other") {
                    setShowOtherInput(true);
                  } else {
                    if (!selectedComplaints.includes(val)) {
                      setSelectedComplaints([...selectedComplaints, val]);
                    }
                  }
                }}
              >
                <option value="">
                  {selectedComplaints.length === 0
                    ? "— Select Complaint / समस्या चुनें —"
                    : "+ Add more problem / और समस्या जोड़ें..."}
                </option>
                <option value="Fever" disabled={selectedComplaints.includes("Fever")}>
                  {selectedComplaints.includes("Fever") ? "✓ Fever (Added)" : "Fever (बुखार)"}
                </option>
                <option value="Cough & Cold" disabled={selectedComplaints.includes("Cough & Cold")}>
                  {selectedComplaints.includes("Cough & Cold") ? "✓ Cough & Cold (Added)" : "Cough & Cold (खांसी और जुकाम)"}
                </option>
                <option value="Headache" disabled={selectedComplaints.includes("Headache")}>
                  {selectedComplaints.includes("Headache") ? "✓ Headache (Added)" : "Headache (सिरदर्द)"}
                </option>
                <option value="Body Pain" disabled={selectedComplaints.includes("Body Pain")}>
                  {selectedComplaints.includes("Body Pain") ? "✓ Body Pain (Added)" : "Body Pain (बदन दर्द)"}
                </option>
                <option value="Chest Pain" disabled={selectedComplaints.includes("Chest Pain")}>
                  {selectedComplaints.includes("Chest Pain") ? "✓ Chest Pain (Added)" : "Chest Pain (छाती में दर्द)"}
                </option>
                <option value="Abdominal Pain" disabled={selectedComplaints.includes("Abdominal Pain")}>
                  {selectedComplaints.includes("Abdominal Pain") ? "✓ Abdominal Pain (Added)" : "Abdominal Pain (पेट दर्द)"}
                </option>
                <option value="Vomiting" disabled={selectedComplaints.includes("Vomiting")}>
                  {selectedComplaints.includes("Vomiting") ? "✓ Vomiting (Added)" : "Vomiting / Nausea (उल्टी / मतली)"}
                </option>
                <option value="Weakness" disabled={selectedComplaints.includes("Weakness")}>
                  {selectedComplaints.includes("Weakness") ? "✓ Weakness (Added)" : "Weakness / Fatigue (कमजोरी)"}
                </option>
                <option value="High Blood Pressure" disabled={selectedComplaints.includes("High Blood Pressure")}>
                  {selectedComplaints.includes("High Blood Pressure") ? "✓ High Blood Pressure (Added)" : "High Blood Pressure (उच्च रक्तचाप / बीपी)"}
                </option>
                <option value="Diabetes Consultation" disabled={selectedComplaints.includes("Diabetes Consultation")}>
                  {selectedComplaints.includes("Diabetes Consultation") ? "✓ Diabetes (Added)" : "Diabetes Consultation (शुगर समस्या)"}
                </option>
                <option value="Backache / Joint Pain" disabled={selectedComplaints.includes("Backache / Joint Pain")}>
                  {selectedComplaints.includes("Backache / Joint Pain") ? "✓ Joint Pain (Added)" : "Backache / Joint Pain (कमर / जोड़ों का दर्द)"}
                </option>
                <option value="Breathing Difficulty" disabled={selectedComplaints.includes("Breathing Difficulty")}>
                  {selectedComplaints.includes("Breathing Difficulty") ? "✓ Breathing (Added)" : "Breathing Difficulty (सांस लेने में तकलीफ)"}
                </option>
                <option value="Acidity / Gas" disabled={selectedComplaints.includes("Acidity / Gas")}>
                  {selectedComplaints.includes("Acidity / Gas") ? "✓ Acidity / Gas (Added)" : "Acidity / Gas (गैस / एसिडिटी)"}
                </option>
                <option value="Skin Rash / Allergy" disabled={selectedComplaints.includes("Skin Rash / Allergy")}>
                  {selectedComplaints.includes("Skin Rash / Allergy") ? "✓ Skin Rash (Added)" : "Skin Rash / Allergy (त्वचा रोग)"}
                </option>
                <option value="Injury / Trauma" disabled={selectedComplaints.includes("Injury / Trauma")}>
                  {selectedComplaints.includes("Injury / Trauma") ? "✓ Injury (Added)" : "Injury / Trauma (चोट / दर्द)"}
                </option>
                <option value="Follow-up Consultation" disabled={selectedComplaints.includes("Follow-up Consultation")}>
                  {selectedComplaints.includes("Follow-up Consultation") ? "✓ Follow-up (Added)" : "Follow-up Consultation (फॉलो-अप)"}
                </option>
                <option value="General Health Checkup" disabled={selectedComplaints.includes("General Health Checkup")}>
                  {selectedComplaints.includes("General Health Checkup") ? "✓ General Checkup (Added)" : "General Health Checkup (सामान्य जांच)"}
                </option>
                <option value="Other">+ Other / अन्य समस्या (Custom)...</option>
              </select>

              {showOtherInput && (
                <div className="opd-other-input-row">
                  <input
                    type="text"
                    className="opd-input"
                    placeholder="Type custom problem / अन्य समस्या दर्ज करें..."
                    value={otherComplaintText}
                    onChange={(e) => setOtherComplaintText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (otherComplaintText.trim()) {
                          if (!selectedComplaints.includes(otherComplaintText.trim())) {
                            setSelectedComplaints([...selectedComplaints, otherComplaintText.trim()]);
                          }
                          setOtherComplaintText("");
                          setShowOtherInput(false);
                        }
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="opd-btn-add-complaint"
                    onClick={() => {
                      if (otherComplaintText.trim()) {
                        if (!selectedComplaints.includes(otherComplaintText.trim())) {
                          setSelectedComplaints([...selectedComplaints, otherComplaintText.trim()]);
                        }
                        setOtherComplaintText("");
                        setShowOtherInput(false);
                      }
                    }}
                  >
                    + Add
                  </button>
                  <button
                    type="button"
                    className="opd-btn-cancel-complaint"
                    onClick={() => {
                      setOtherComplaintText("");
                      setShowOtherInput(false);
                    }}
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Selected Complaint Badges / Tags */}
              {selectedComplaints.length > 0 && (
                <div className="opd-selected-tags-container">
                  {selectedComplaints.map((item) => (
                    <span key={item} className="opd-complaint-pill">
                      <span>{item}</span>
                      <button
                        type="button"
                        className="pill-remove-btn"
                        onClick={() => removeComplaint(item)}
                        title={`Remove ${item}`}
                      >
                        <Icon name="LuX" size={11} />
                      </button>
                    </span>
                  ))}
                  {selectedComplaints.length > 1 && (
                    <button
                      type="button"
                      className="pill-clear-all"
                      onClick={() => setSelectedComplaints([])}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Department Dropdown */}
            <div className="opd-field-group">
              <div className="flex-justify-between">
                <label className="opd-label">
                  Department <span className="req">*</span> <span className="opd-hint">· विभाग</span>
                </label>
                <span className="opd-avail-doc-text">
                  <button
                    type="button"
                    className="opd-refresh-link"
                    onClick={async () => {
                      await loadDoctorsAndDepartments();
                      toast.success("Refreshed doctors and departments from DB");
                    }}
                  >
                    <Icon name="LuRefreshCw" size={12} /> Refresh
                  </button>
                </span>
              </div>
              <select
                className="opd-select"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setSelectedDoctor(null);
                }}
                disabled={loadingDoctors}
              >
                <option value="">— Select Department / विभाग चुनें —</option>
                {departments.map((dep) => {
                  const deptName = dep.name || dep;
                  return (
                    <option key={dep.id || deptName} value={deptName}>
                      {deptName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. Doctor Dropdown (Optional) */}
            <div className="opd-field-group">
              <div className="flex-justify-between">
                <label className="opd-label">
                  Doctor to Consult <span className="opd-hint">· चिकित्सक चुनें (Optional)</span>
                </label>
                {selectedDoctor && (
                  <span
                    className={`opd-doc-status ${
                      selectedDoctor.is_active !== false ? "status-avail" : "status-busy"
                    }`}
                  >
                    ● {selectedDoctor.is_active !== false ? "Available" : "On Leave"}
                  </span>
                )}
              </div>
              <select
                className="opd-select"
                value={selectedDoctor?.name || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedDoctor(null);
                    setConsultationFee(500);
                    return;
                  }
                  const doc = currentDoctors.find((d) => d.name === val || d.id === val);
                  if (doc) {
                    setSelectedDoctor(doc);
                    const fee =
                      visitType === "Emergency"
                        ? (doc.emergency_fee || 800)
                        : visitType === "Re-visit / Follow-up"
                        ? (doc.old_patient_fee || 300)
                        : (doc.consultation_fee || 500);
                    setConsultationFee(fee);
                  }
                }}
                disabled={loadingDoctors}
              >
                <option value="">— Select Doctor / डॉक्टर चुनें —</option>
                {currentDoctors.map((doc) => (
                  <option key={doc.id || doc.name} value={doc.name}>
                    {doc.name} ({doc.qualification || doc.degree || "Doctor"}) — {doc.is_active !== false ? "Available" : "On Leave"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          
        </div>

        {/* SECTION: OPD REGISTRATION FEE (TABLE / SINGLE ROW UI MATCHING IMAGE 1) */}
        <div className="opd-card opd-particulars-card">
          <h3 className="opd-card-title">
            <Icon name="LuCreditCard" size={16} className="title-icon" /> OPD Registration Fee <span className="opd-hint">· शुल्क एवं भुगतान विवरण</span>
          </h3>

          <div className="opd-particulars-table-wrapper">
            <table className="opd-particulars-table">
              <thead>
                <tr>
                  <th className="col-hash">#</th>
                  <th className="col-particular">PARTICULAR / SERVICE</th>
                  <th className="col-charge">CHARGE</th>
                  <th className="col-amount">AMOUNT</th>
                  <th className="col-action">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {particulars.map((row, index) => (
                  <tr key={row.id}>
                    <td className="cell-hash">{String(index + 1).padStart(2, '0')}</td>
                    <td className="cell-particular">
                      <select
                        className="opd-select opd-particular-select"
                        value={row.service}
                        onChange={(e) => handleParticularChange(row.id, 'service', e.target.value)}
                      >
                        <option value="">Select Particular / Service</option>
                        <option value="OPD Consultation Fee">OPD Consultation Fee (परामर्श शुल्क)</option>
                        <option value="Registration Fee">Registration Fee (पंजीकरण शुल्क)</option>
                        <option value="Follow-up Consultation Fee">Follow-up Consultation Fee</option>
                        <option value="Emergency OPD Fee">Emergency OPD Fee</option>
                        <option value="Dressing / Minor Procedure">Dressing / Minor Procedure</option>
                        <option value="Nursing / Service Charge">Nursing / Service Charge</option>
                        <option value="Other Service">Other Service Charge</option>
                      </select>
                    </td>
                    <td className="cell-charge">
                      <div className="opd-input-prefix-wrap">
                        <span className="opd-prefix">₹</span>
                        <input
                          type="number"
                          min="0"
                          className="opd-input"
                          placeholder="Select Charge"
                          value={row.charge}
                          onChange={(e) => handleParticularChange(row.id, 'charge', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="cell-amount">
                      ₹ {Number(row.amount || 0).toFixed(2)}
                    </td>
                    <td className="cell-action">
                      <button
                        type="button"
                        className="opd-btn-trash-row"
                        onClick={() => handleRemoveParticularRow(row.id)}
                        title="Remove row"
                      >
                        <Icon name="LuTrash2" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="opd-particulars-footer-row">
            <button
              type="button"
              className="opd-btn-add-particular-row"
              onClick={handleAddParticularRow}
            >
              + Add Particular Row
            </button>

            <div className="opd-billing-inline-fields">
              <div className="opd-inline-field">
                <label className="opd-label">Discount (₹)</label>
                <div className="opd-input-prefix-wrap" style={{ width: '105px' }}>
                  <span className="opd-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    className="opd-input"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="opd-inline-field">
                <label className="opd-label">Payment Mode</label>
                <select
                  className="opd-select"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash (नकद)</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="NetBanking">Net Banking</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Free">Free / Exempted</option>
                </select>
              </div>

              <div className="opd-inline-field">
                <label className="opd-label">Payment Status</label>
                <select
                  className="opd-select"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="Paid">Paid (प्राप्त)</option>
                  <option value="Pending">Pending (लंबित)</option>
                  <option value="Partial">Partial (आंशिक)</option>
                </select>
              </div>

              <div className="opd-inline-total-badge">
                <span className="lbl">Total:</span>
                <span className="val">₹ {Number(totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ACTIONS BAR ── */}
        <div className="opd-footer-actions-bar">
          <div className="opd-footer-summary-chip">
            <span className="chip-label">Total Payable:</span>
            <span className="chip-amount">₹{totalAmount}</span>
            <span className="chip-sub">({paymentMode} • {paymentStatus})</span>
          </div>

          <div className="opd-footer-btn-group">
            <button
              type="button"
              className="opd-btn-cancel"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button type="submit" className="opd-btn-register">
              <Icon name="LuCheckCircle" size={16} /> OPD Registration
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
            <div className="opd-slip-modal-wrapper" style={{ maxHeight: "78vh", overflowY: "auto", padding: "14px", background: "#f8fafc" }}>
              <OPDConsultationSlip data={opdSlipData} settings={slipSettings || {}} />
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
    {/* ── VIEW PATIENT DETAILS MODAL ── */}
      {showPatientModal && selectedPatient && (
        <div className="opd-modal-overlay" onClick={() => setShowPatientModal(false)}>
          <div className="opd-patient-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="opd-patient-modal-header">
              <div className="opd-modal-title-wrap">
                <div className="opd-modal-badge-icon">
                  <Icon name="LuUserCheck" size={20} />
                </div>
                <div>
                  <h3 className="opd-modal-title">Patient Profile & Medical Record</h3>
                  <div className="opd-modal-sub">
                    Hospital Identification: <span className="opd-uhid-badge">{selectedPatient.uhid || "—"}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="opd-modal-close-btn"
                onClick={() => setShowPatientModal(false)}
                title="Close Modal"
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="opd-patient-modal-body">
              {/* Patient Hero Card */}
              <div className="opd-modal-patient-hero">
                <div className="opd-modal-hero-avatar">
                  {(selectedPatient.full_name || selectedPatient.name || selectedPatient.first_name || "P")[0].toUpperCase()}
                </div>
                <div className="opd-modal-hero-info">
                  <div className="opd-modal-hero-name-row">
                    <h2 className="opd-modal-patient-name">
                      {selectedPatient.full_name || selectedPatient.name || `${selectedPatient.first_name || ""} ${selectedPatient.last_name || ""}`.trim() || "Patient"}
                    </h2>
                    <span className="opd-status-pill active">● Registered Patient</span>
                    {(selectedPatient.blood_group || selectedPatient.bloodGroup) && (
                      <span className="opd-blood-pill">🩸 {selectedPatient.blood_group || selectedPatient.bloodGroup}</span>
                    )}
                  </div>
                  <div className="opd-modal-hero-meta-row">
                    <span><strong>Age / Gender:</strong> {selectedPatient.age || "—"} Yrs / {selectedPatient.gender || "—"}</span>
                    <span className="meta-dot">•</span>
                    <span><strong>Category:</strong> {selectedPatient.category || selectedPatient.visit_type || "General OPD"}</span>
                    <span className="meta-dot">•</span>
                    <span><strong>UHID:</strong> <code className="opd-hero-code">{selectedPatient.uhid || "—"}</code></span>
                  </div>
                </div>
              </div>

              {/* Patient Details Cards Grid */}
              <div className="opd-modal-grid">
                {/* 1. Contact & Emergency Details */}
                <div className="opd-detail-card">
                  <h4 className="opd-detail-card-title">
                    <Icon name="LuPhone" size={15} /> Contact & Emergency Details
                  </h4>
                  <div className="opd-detail-list">
                    <div className="opd-detail-row">
                      <span className="opd-d-label">Primary Mobile:</span>
                      <span className="opd-d-val bold">{selectedPatient.phone || selectedPatient.mobile1 || selectedPatient.mobile || "—"}</span>
                    </div>
                    <div className="opd-detail-row">
                      <span className="opd-d-label">Alternate Phone:</span>
                      <span className="opd-d-val">{selectedPatient.alternate_phone || selectedPatient.altMobile || selectedPatient.mobile2 || "—"}</span>
                    </div>
                    <div className="opd-detail-row">
                      <span className="opd-d-label">Email Address:</span>
                      <span className="opd-d-val">{selectedPatient.email || "—"}</span>
                    </div>
                    <div className="opd-detail-row">
                      <span className="opd-d-label">Emergency Contact:</span>
                      <span className="opd-d-val">
                        {selectedPatient.emergency_name || selectedPatient.emergencyName || selectedPatient.guardianName || selectedPatient.father_name || "—"}
                      </span>
                    </div>
                    <div className="opd-detail-row">
                      <span className="opd-d-label">Emergency Phone:</span>
                      <span className="opd-d-val">{selectedPatient.emergency_phone || selectedPatient.emergencyPhone || "—"}</span>
                    </div>
                    <div className="opd-detail-row">
                      <span className="opd-d-label">Emergency Relation:</span>
                      <span className="opd-d-val">{selectedPatient.emergency_relation || selectedPatient.emergencyRelation || selectedPatient.relationToHead || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Residential Address */}
                <div className="opd-detail-card">
                  <h4 className="opd-detail-card-title">
                    <Icon name="LuMapPin" size={15} /> Residential Address
                  </h4>
                  <div className="opd-detail-list">
                    <div className="opd-detail-row">
                      <span className="opd-d-label">Street Address:</span>
                      <span className="opd-d-val">{selectedPatient.address_line1 || selectedPatient.address || "—"}</span>
                    </div>
                    <div className="opd-detail-row">
                      <span className="opd-d-label">City / District:</span>
                      <span className="opd-d-val">{selectedPatient.city || "—"}</span>
                    </div>
                    <div className="opd-detail-row">
                      <span className="opd-d-label">State:</span>
                      <span className="opd-d-val">{selectedPatient.state || "—"}</span>
                    </div>
                    <div className="opd-detail-row">
                      <span className="opd-d-label">Postal Pincode:</span>
                      <span className="opd-d-val bold">{selectedPatient.postal_code || selectedPatient.pincode || "—"}</span>
                    </div>
                    <div className="opd-detail-row">
                      <span className="opd-d-label">Country:</span>
                      <span className="opd-d-val">{selectedPatient.country || "India"}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Demographic & Identification */}
                <div className="opd-detail-card full-span">
                  <h4 className="opd-detail-card-title">
                    <Icon name="LuShieldCheck" size={15} /> Demographic & Identity Information
                  </h4>
                  <div className="opd-detail-columns">
                    <div className="opd-demog-item">
                      <span className="opd-d-label">Date of Birth (DOB)</span>
                      <span className="opd-d-val">{formatPatientDate(selectedPatient.dob || selectedPatient.date_of_birth)}</span>
                    </div>
                    <div className="opd-demog-item">
                      <span className="opd-d-label">Aadhaar Number</span>
                      <span className="opd-d-val monospace bold">
                        {formatAadhaar(selectedPatient.aadhaar_number || selectedPatient.aadhaar || selectedPatient.national_id)}
                      </span>
                    </div>
                    <div className="opd-demog-item">
                      <span className="opd-d-label">PAN Number</span>
                      <span className="opd-d-val monospace">{selectedPatient.pan_number || selectedPatient.pan || "—"}</span>
                    </div>
                    <div className="opd-demog-item">
                      <span className="opd-d-label">Marital Status</span>
                      <span className="opd-d-val">{selectedPatient.marital_status || selectedPatient.maritalStatus || "—"}</span>
                    </div>
                    <div className="opd-demog-item">
                      <span className="opd-d-label">Occupation</span>
                      <span className="opd-d-val">{selectedPatient.occupation || "—"}</span>
                    </div>
                    <div className="opd-demog-item">
                      <span className="opd-d-label">Registered Date</span>
                      <span className="opd-d-val">{formatPatientDateTime(selectedPatient.registeredAt || selectedPatient.created_at || selectedPatient.registration_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="opd-patient-modal-footer">
              <button
                type="button"
                className="opd-btn-modal-close"
                onClick={() => setShowPatientModal(false)}
              >
                Done / Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}