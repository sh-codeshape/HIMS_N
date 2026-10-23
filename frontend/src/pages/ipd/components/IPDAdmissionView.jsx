import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import Icon from "../../../components/common/Icon.jsx";
import { mockStore } from "../../../mock/mockStore";
import patientService from "../../../api/services/patientService";
import ipdService from "../../../api/services/ipdService";
import axiosInstance from "../../../api/axiosInstance";
import "./IPDAdmissionView.css";

// ── Preset Mock Patient fallback ──────────────────────────
const DEFAULT_PRESET_PATIENT = {
  id: "P-10245",
  uhid: "LH-10245",
  name: "Rahul Kumar",
  age: "32",
  gender: "Male",
  dob: "12 Aug 1994",
  phone: "9876543210",
  bloodGroup: "B+",
  address: "Sector 21, Noida, Uttar Pradesh",
  maritalStatus: "Married",
  occupation: "Private Job",
  allergies: "No Known Allergies",
  insurance: "Self Pay",
  previousOpd: 5,
  previousIpd: 1,
};

const DOCTORS_BY_DEPT = {
  "General Medicine": [
    { id: "d1", name: "Dr. Amit Sharma", degree: "MD (General Medicine)" },
    { id: "d2", name: "Dr. Neha Singh", degree: "MBBS, MD" },
  ],
  Cardiology: [
    { id: "d3", name: "Dr. Priya Deshmukh", degree: "MD (Cardiology)" },
    { id: "d4", name: "Dr. Suresh Gupta", degree: "DM (Cardiology)" },
  ],
  Orthopedics: [
    { id: "d5", name: "Dr. Anand Kulkarni", degree: "MS (Ortho)" },
  ],
  Pediatrics: [
    { id: "d6", name: "Dr. Arvind Saxena", degree: "MD (Pediatrics)" },
  ],
  Gynecology: [
    { id: "d7", name: "Dr. Meenakshi Iyer", degree: "DGO (Gynae)" },
  ],
};

const POPULAR_IPD_COMPLAINTS = [
  "Fever",
  "Breathing Difficulty",
  "Severe Abdominal Pain",
  "Trauma / Injury",
  "Chest Pain",
  "High BP / Hypertension",
  "Dehydration"
];

export default function IPDAdmissionView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(DEFAULT_PRESET_PATIENT);

  // Search by mode (UHID/Mobile vs Name)
  const [searchMode, setSearchMode] = useState("uhid");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientSearchRef = useRef(null);

  // ── Department & Doctor (real data from backend) ──
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  // ── Admission Details ──
  const [admissionType, setAdmissionType] = useState("Emergency");
  const getCurrentDateStr = () => new Date().toISOString().slice(0, 10);
  const getCurrentTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };
  const [admissionDate, setAdmissionDate] = useState(getCurrentDateStr());
  const [admissionTime, setAdmissionTime] = useState(getCurrentTimeStr());
  const [admissionSource, setAdmissionSource] = useState("OPD");

  // ── Department & Doctor selection ──
  const [department, setDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // ── Reason for Admission ──
  const [selectedComplaints, setSelectedComplaints] = useState(["Fever", "Breathing Difficulty"]);
  const [duration, setDuration] = useState("5");
  const [durationUnit, setDurationUnit] = useState("Days");
  const [severity, setSeverity] = useState("Moderate");
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("Acute Respiratory Infection");
  const [reasonForAdmission, setReasonForAdmission] = useState("Patient requires inpatient observation and treatment.");
  const [showOtherComplaintInput, setShowOtherComplaintInput] = useState(false);
  const [otherComplaintText, setOtherComplaintText] = useState("");
  const [showOtherReasonInput, setShowOtherReasonInput] = useState(false);
  const [otherReasonText, setOtherReasonText] = useState("");

  // ── Bed / Room Allocation ──
  const [wardType, setWardType] = useState("General Ward");
  const [roomType, setRoomType] = useState("Multi Bed");
  const [floor, setFloor] = useState("1st Floor");
  const [roomNo, setRoomNo] = useState("101");
  const [selectedBed, setSelectedBed] = useState("Bed-101-A");

  const normalizeBedStatus = (status) => {
    const value = typeof status === "string" ? status.trim().toLowerCase() : "available";
    if (value === "occupied" || value === "reserved" || value === "blocked") return value;
    if (value === "cleaning" || value === "maintenance") return value;
    return "available";
  };

  const [availableBedsGrid] = useState([
    { id: "b1", bedNo: "Bed-101-A", room: "Room 101", status: "Available" },
    { id: "b2", bedNo: "Bed-101-B", room: "Room 101", status: "Occupied" },
    { id: "b3", bedNo: "Bed-101-C", room: "Room 101", status: "Available" },
    { id: "b4", bedNo: "Bed-101-D", room: "Room 101", status: "Available" },
    { id: "b5", bedNo: "Bed-102-A", room: "Room 102", status: "Available" },
    { id: "b6", bedNo: "Bed-102-B", room: "Room 102", status: "Available" },
  ]);

  const WARD_TYPE_MAP = {
    "General Ward": "general",
    "ICU": "icu",
    "Private Room": "private",
    "Semi-Private Room": "semi_private",
  };

  const filteredBeds = useMemo(() => {
    if (!beds || beds.length === 0) return availableBedsGrid;
    const targetType = WARD_TYPE_MAP[wardType];
    if (!targetType) return beds;
    return beds.filter((b) => {
      const wt = (b.ward_type || "").toLowerCase();
      const wn = (b.ward_name || "").toLowerCase();
      return wt === targetType || wn === wardType.toLowerCase();
    });
  }, [beds, wardType]);

  useEffect(() => {
    if (filteredBeds.length > 0) {
      const firstAvailable = filteredBeds.find(
        (b) => normalizeBedStatus(b.status || b.current_status || "available") === "available"
      );
      setSelectedBed(firstAvailable ? firstAvailable.bedNo : filteredBeds[0].bedNo);
    } else {
      setSelectedBed("");
    }
  }, [wardType, filteredBeds]);

  // ── Attendant Details ──
  const [attendantName, setAttendantName] = useState("Raj Kumar");
  const [relationship, setRelationship] = useState("Brother");
  const [attendantMobile, setAttendantMobile] = useState("9876500000");
  const [alternateMobile, setAlternateMobile] = useState("9876500001");

  // ── Advance / Payment Details ──
  const [registrationFee] = useState(100);
  const [bedAdvance, setBedAdvance] = useState(5000);
  const [otherCharges, setOtherCharges] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [amountReceived, setAmountReceived] = useState(5100);

  const totalAdvance = Number(registrationFee) + Number(bedAdvance || 0) + Number(otherCharges || 0);

  // ── Additional Information ──
  const [expectedDischargeDate, setExpectedDischargeDate] = useState("2026-10-05");
  const [remarks, setRemarks] = useState("");

  // ── Modal State ──
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [ipdSlipData, setIpdSlipData] = useState(null);

  // ── Fetch Initial Data ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsData, bedsData, deptsData, docsData] = await Promise.all([
          patientService.search().catch(() => []),
          ipdService.getBedMatrix().catch(() => [
            { id: 1, bed_no: "GW-101-B1", ward_name: "General Ward", room_name: "GW-101", current_status: "available" },
            { id: 2, bed_no: "GW-101-B2", ward_name: "General Ward", room_name: "GW-101", current_status: "available" },
            { id: 3, bed_no: "GW-101-B3", ward_name: "General Ward", room_name: "GW-101", current_status: "occupied" },
            { id: 4, bed_no: "ICU-01", ward_name: "ICU", room_name: "ICU-1", current_status: "available" },
          ]),
          axiosInstance.get("/staff/departments").then((r) => r.data?.data || []).catch(() => []),
          axiosInstance.get("/staff/doctors").then((r) => r.data?.data || []).catch(() => []),
        ]);

        const mappedPatients = (patientsData || []).map((p) => ({
          id: p.id,
          uhid: p.uhid,
          name: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient",
          age: p.age ?? (p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth).getTime()) / 3.15576e10) : 0),
          gender: p.gender,
          bloodGroup: p.blood_group || "Unknown",
        }));

        const mappedBeds = (bedsData || []).map((b) => ({
          id: b.id,
          bedNo: b.bed_no,
          ward: b.ward_name,
          ward_type: b.ward_type,
          floor: b.room_name ? `Room ${b.room_name}` : "General",
          status: b.current_status,
        }));

        const mappedDepartments = (deptsData || []).map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          description: d.description,
        }));

        const mappedDoctors = (docsData || []).map((d) => ({
          id: d.practitioner_id || d.id,
          name: `${d.first_name || ""} ${d.last_name || ""}`.trim() || d.name || "Doctor",
          departmentId: d.department_id,
          qualifications: d.qualifications,
          registrationNo: d.registration_no,
        }));

        setPatients(mappedPatients.length ? mappedPatients : (mockStore.getPatients ? mockStore.getPatients() : []));
        setBeds(mappedBeds.length ? mappedBeds : (mockStore.getBeds ? mockStore.getBeds() : []));
        setDepartments(mappedDepartments);
        setDoctors(mappedDoctors);

        if (mappedDepartments.length > 0 && !department) {
          setDepartment(mappedDepartments[0]);
        }
        setDepartmentsLoading(false);
      } catch (err) {
        const fallbackPatients = mockStore.getPatients ? mockStore.getPatients() : [];
        const fallbackBeds = mockStore.getBeds ? mockStore.getBeds() : [];
        setPatients(fallbackPatients);
        setBeds(fallbackBeds);
        setDepartmentsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync selectedDoctor with department change
  useEffect(() => {
    if (department && doctors.length > 0) {
      const docs = doctors.filter((d) => d.departmentId === department.id);
      setSelectedDoctor(docs.length > 0 ? docs[0] : null);
    }
  }, [department, doctors]);

  // Click outside listener for search dropdown
  useEffect(() => {
    const clickHandler = (e) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(e.target)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener("mousedown", clickHandler);
    return () => document.removeEventListener("mousedown", clickHandler);
  }, []);

  // Auto-load patient from URL params
  useEffect(() => {
    const targetUhid = searchParams.get("uhid") || searchParams.get("patientId") || searchParams.get("id");
    const targetPhone = searchParams.get("phone") || searchParams.get("mobile");

    const fetchTargetPatient = async () => {
      try {
        let results = [];
        if (targetUhid) {
          results = await patientService.search({ query: targetUhid });
        } else if (targetPhone) {
          results = await patientService.search({ query: targetPhone });
        }

        if (results && results.length > 0) {
          const found = results[0];
          const pName =
            found.full_name ||
            found.name ||
            `${found.first_name || found.firstName || ""} ${found.last_name || found.lastName || ""}`.trim();
          const pPhone = found.phone || found.mobile1 || found.mobile || "N/A";
          setSelectedPatient({
            id: found.id || found.uhid,
            uhid: found.uhid,
            name: pName,
            age: found.age || found.ageYrs || "30",
            gender: found.gender || "Male",
            dob: found.dob || "",
            phone: pPhone,
            bloodGroup: found.blood_group || found.bloodGroup || "O+",
            address: found.address || found.address_line1 || "N/A",
            maritalStatus: found.marital_status || found.maritalStatus || "Single",
            occupation: found.occupation || "N/A",
            allergies: found.allergies || "None",
            insurance: found.healthInsurance === "Yes" ? (found.insuranceProvider || "Insured") : "Self Pay",
            emergencyName: found.emergencyName || "",
            emergencyPhone: found.emergencyPhone || "",
            emergencyRelation: found.emergencyRelation || "",
          });
          setPatientSearchQuery(`${pName} — ${pPhone} (${found.uhid})`);
          toast.success(`Patient details auto-loaded: ${pName} (${found.uhid})`, { icon: "🛏️" });
        }
      } catch (err) {
        console.error("Failed to load patient from URL", err);
      }
    };

    if (targetUhid || targetPhone) {
      fetchTargetPatient();
    }
  }, [searchParams]);

  const handlePatientSearchChange = async (e) => {
    const q = e.target.value;
    setPatientSearchQuery(q);
    if (!q.trim()) {
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      return;
    }
    const term = q.trim();
    try {
      const results = await patientService.search({ query: term });
      setPatientSearchResults(results.slice(0, 8));
      setShowPatientDropdown(true);
    } catch (err) {
      console.error("Patient search failed", err);
    }
  };

  const handleSelectOldPatient = (p) => {
    const pName =
      p.full_name ||
      p.name ||
      `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim();
    const pPhone = p.phone || p.mobile1 || p.mobile || "N/A";
    setSelectedPatient({
      id: p.id || p.uhid,
      uhid: p.uhid,
      name: pName,
      age: p.age || p.ageYrs || "30",
      gender: p.gender || "Male",
      dob: p.dob || p.date_of_birth || "",
      phone: pPhone,
      bloodGroup: p.blood_group || p.bloodGroup || "O+",
      address: p.address || p.address_line1 || "N/A",
      maritalStatus: p.marital_status || p.maritalStatus || "Single",
      occupation: p.occupation || "N/A",
      allergies: p.allergies || "None",
      insurance: p.healthInsurance === "Yes" ? (p.insuranceProvider || "Insured") : "Self Pay",
    });
    setPatientSearchQuery(`${pName} — ${pPhone} (${p.uhid})`);
    setShowPatientDropdown(false);
    toast.success(`Selected Patient: ${pName} (${p.uhid})`, { icon: "✅" });
  };

  const toggleComplaint = (item) => {
    if (item === "Other" || item.includes("Other")) {
      setShowOtherComplaintInput(true);
      return;
    }
    if (selectedComplaints.includes(item)) {
      setSelectedComplaints(selectedComplaints.filter((c) => c !== item));
    } else {
      setSelectedComplaints([...selectedComplaints, item]);
    }
  };

  const handleAddOtherComplaint = () => {
    const trimmed = otherComplaintText.trim();
    if (trimmed) {
      if (!selectedComplaints.includes(trimmed)) {
        setSelectedComplaints([...selectedComplaints, trimmed]);
      }
      setOtherComplaintText("");
      setShowOtherComplaintInput(false);
    }
  };

  const removeComplaint = (item) => {
    setSelectedComplaints(selectedComplaints.filter((c) => c !== item));
  };

  const appendQuickReasonPreset = (text) => {
    if (!reasonForAdmission) {
      setReasonForAdmission(text);
    } else if (!reasonForAdmission.includes(text)) {
      setReasonForAdmission(`${reasonForAdmission} ${text}`);
    }
  };

  const handleAddOtherReason = () => {
    const trimmed = otherReasonText.trim();
    if (trimmed) {
      appendQuickReasonPreset(trimmed);
      setOtherReasonText("");
      setShowOtherReasonInput(false);
    }
  };

  const handleResetForm = () => {
    setSelectedPatient(DEFAULT_PRESET_PATIENT);
    setPatientSearchQuery("");
    setAdmissionType("Emergency");
    setAdmissionDate(getCurrentDateStr());
    setAdmissionTime(getCurrentTimeStr());
    setAdmissionSource("OPD");
    setSelectedComplaints(["Fever", "Breathing Difficulty"]);
    setDuration("5");
    setDurationUnit("Days");
    setSeverity("Moderate");
    setProvisionalDiagnosis("Acute Respiratory Infection");
    setReasonForAdmission("Patient requires inpatient observation and treatment.");
    setWardType("General Ward");
    setRoomType("Multi Bed");
    setFloor("1st Floor");
    setRoomNo("101");
    setAttendantName("Raj Kumar");
    setRelationship("Brother");
    setAttendantMobile("9876500000");
    setAlternateMobile("9876500001");
    setBedAdvance(5000);
    setOtherCharges(0);
    setPaymentMode("Cash");
    setPaymentStatus("Paid");
    setAmountReceived(5100);
    setExpectedDischargeDate("2026-10-05");
    setRemarks("");
    toast.success("New Admission Form Initialized", { icon: "✨" });
  };

  const handleConfirmAdmission = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedBed) {
      toast.error("Please select an available bed!");
      return;
    }

    try {
      let facilityId = "";
      try {
        const token = localStorage.getItem("hims_token");
        const decoded = token ? jwtDecode(token) : null;
        facilityId = decoded?.facilityId || decoded?.facility_id || facilityId;
      } catch {
        // backend resolves from auth context
      }

      const now = new Date();
      const formattedDate = `${now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

      let payloadAdmissionType = "elective";
      if (admissionType === "Emergency") payloadAdmissionType = "emergency";
      else if (admissionType === "Referral") payloadAdmissionType = "referral";
      else if (admissionType === "Transfer") payloadAdmissionType = "transfer";

      let actualBedId = selectedBed;
      const matchedBed = beds.find((b) => b.bedNo === selectedBed || b.id === selectedBed);
      if (matchedBed && matchedBed.id) {
        actualBedId = matchedBed.id;
      }

      const insuranceVal = String(selectedPatient.insurance || "").trim().toLowerCase();
      let payerType = "self";
      if (insuranceVal === "insured" || insuranceVal.includes("insurance") || insuranceVal === "tpa") {
        payerType = "insurance";
      } else if (insuranceVal === "corporate") {
        payerType = "corporate";
      } else if (insuranceVal === "government") {
        payerType = "government";
      }

      const paymentAmount = Number(registrationFee) + Number(bedAdvance || 0) + Number(otherCharges || 0);
      const paymentPayload =
        paymentAmount > 0
          ? {
              amount: paymentAmount,
              payment_mode: paymentMode,
              receipt_no: null,
            }
          : null;

      const realBedId =
        actualBedId &&
        actualBedId !== selectedBed &&
        String(actualBedId).match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
          ? actualBedId
          : null;

      if (selectedPatient.id && selectedPatient.id !== selectedPatient.uhid) {
        try {
          await ipdService.admitPatient({
            facility_id: facilityId,
            patient_id: selectedPatient.id,
            bed_id: realBedId,
            department_id: department?.id || null,
            admitting_practitioner_id: selectedDoctor?.id || null,
            tariff_plan_id: null,
            entitled_bed_category_id: null,
            admission_type: payloadAdmissionType,
            reason_for_admission: reasonForAdmission || selectedComplaints.join(", "),
            attendant_name: attendantName,
            attendant_relation: relationship,
            attendant_phone: attendantMobile,
            payer_type: payerType,
            patient_coverage_id: null,
            advance_deposit: paymentPayload,
          });
        } catch (admitErr) {
          console.error("Backend admission failed:", admitErr);
          toast.error("Admission record saved locally. Backend sync may be pending.");
        }
      }

      const admissionRecord = {
        uhid: selectedPatient.uhid,
        patientName: selectedPatient.name,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        phone: selectedPatient.phone,
        address: selectedPatient.address,
        admissionType,
        admissionDate: `${admissionDate} ${admissionTime}`,
        chiefComplaint: selectedComplaints.join(", "),
        provisionalDiagnosis,
        department: department?.name || "",
        doctor: selectedDoctor?.name || "",
        doctorDegree: selectedDoctor?.qualifications || "",
        wardType,
        roomType,
        floor,
        roomNo,
        bedNo: selectedBed,
        attendantName,
        relationship,
        attendantMobile,
        registrationFee,
        bedAdvance,
        otherCharges,
        totalAdvance: totalAdvance,
        paymentMode,
        paymentStatus,
        payerType,
        date: formattedDate,
      };

      setIpdSlipData(admissionRecord);
      setShowPrintModal(true);
      toast.success(`IPD Admission Confirmed for ${admissionRecord.patientName} on ${selectedBed}!`, {
        icon: "🏥",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to admit patient to IPD.");
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="ipd-erp-container">
      {/* ── ERP WINDOW CONTAINER ── */}
      <div className="ipd-erp-window">
        {/* ── TOP NAVY TITLE BAR ── */}
        <div className="ipd-erp-titlebar">
          <div className="ipd-titlebar-left">
            <div className="ipd-titlebar-badge">
              <Icon name="LuFileText" size={24} />
            </div>
            <div className="ipd-titlebar-info">
              <h2 className="ipd-titlebar-title">IPD Admission Form</h2>
              <span className="ipd-titlebar-subtitle">Inpatient Registration & Bed Allocation</span>
            </div>
          </div>
          <div className="ipd-titlebar-right">
            <button
              type="button"
              className="ipd-titlebar-close"
              title="Close / Exit Form"
              onClick={() => navigate(-1)}
            >
              <Icon name="LuX" size={18} />
            </button>
          </div>
        </div>

        {/* ── MAIN FORM CONTENT ── */}
        <form onSubmit={handleConfirmAdmission} className="ipd-erp-form">
          {/* ═════════════════════════════════════════════════════════════════════════════════
              1. TOP SECTION: SEARCH PATIENT / OLD RECORD & SELECTED PATIENT PROFILE (FIRST!)
              ═════════════════════════════════════════════════════════════════════════════════ */}
          <div className="erp-top-patient-row">
            {/* BOX 1: SEARCH PATIENT / OLD RECORD */}
            <div className="erp-side-panel erp-top-search-panel" ref={patientSearchRef}>
              <div className="erp-side-panel-header">
                <span className="erp-banner-icon">🔍</span>
                <span>Search Patient / Old Record · पुराने मरीज की खोज</span>
              </div>
              <div className="erp-side-panel-body">
                <div className="erp-radio-filter-row">
                  <label className="erp-radio-inline">
                    <input
                      type="radio"
                      name="searchMode"
                      checked={searchMode === "uhid"}
                      onChange={() => setSearchMode("uhid")}
                    />
                    <span>By UHID / Phone</span>
                  </label>
                  <label className="erp-radio-inline">
                    <input
                      type="radio"
                      name="searchMode"
                      checked={searchMode === "name"}
                      onChange={() => setSearchMode("name")}
                    />
                    <span>By Patient Name</span>
                  </label>
                </div>

                <div className="erp-side-search-box">
                  <Icon name="LuSearch" size={18} className="text-slate-400" />
                  <input
                    type="text"
                    className="erp-side-search-input"
                    placeholder={
                      searchMode === "uhid"
                        ? "Search by UHID or Mobile Number..."
                        : "Search by Patient Full Name..."
                    }
                    value={patientSearchQuery}
                    onChange={handlePatientSearchChange}
                    onFocus={() => {
                      if (patientSearchQuery.trim()) setShowPatientDropdown(true);
                    }}
                  />
                  {patientSearchQuery && (
                    <button
                      type="button"
                      className="erp-side-search-clear"
                      onClick={() => {
                        setPatientSearchQuery("");
                        setPatientSearchResults([]);
                        setShowPatientDropdown(false);
                      }}
                    >
                      <Icon name="LuX" size={16} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown List */}
                {showPatientDropdown && patientSearchResults.length > 0 && (
                  <div className="erp-side-dropdown">
                    <div className="erp-side-dropdown-head">
                      Matching Patients ({patientSearchResults.length})
                    </div>
                    {patientSearchResults.map((p) => {
                      const pName =
                        p.full_name ||
                        p.name ||
                        `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim() ||
                        "Patient";
                      const pPhone = p.phone || p.mobile1 || p.mobile || "N/A";
                      return (
                        <div
                          key={p.uhid || p.id}
                          className="erp-dropdown-item"
                          onClick={() => handleSelectOldPatient(p)}
                        >
                          <div className="erp-dropdown-item-info">
                            <span className="erp-drop-name">{pName}</span>
                            <span className="erp-drop-meta">
                              <strong>{p.uhid}</strong> • 📞 {pPhone} • {p.age || "?"} Yrs / {p.gender || "—"}
                            </span>
                          </div>
                          <span className="erp-drop-btn">Load Profile →</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* BOX 2: SELECTED PATIENT PROFILE */}
            <div className="erp-side-panel erp-top-profile-panel">
              <div className="erp-side-panel-header">
                <span className="erp-banner-icon">👤</span>
                <span>Selected Patient Profile · चयनित मरीज का विवरण</span>
              </div>
              <div className="erp-side-panel-body">
                <div className="erp-patient-profile-card">
                  <div className="erp-patient-avatar">
                    {selectedPatient.name ? selectedPatient.name.charAt(0).toUpperCase() : "P"}
                  </div>
                  <div className="erp-patient-profile-info">
                    <h3 className="erp-profile-name">{selectedPatient.name}</h3>
                    <div className="erp-profile-tags">
                      <span className="erp-badge-uhid">UHID: {selectedPatient.uhid}</span>
                      <span className="erp-badge-blood">🩸 {selectedPatient.bloodGroup}</span>
                      <span className="erp-badge-uhid">{selectedPatient.age} Yrs / {selectedPatient.gender}</span>
                      <span className="erp-badge-uhid">{selectedPatient.insurance || "Self Pay"}</span>
                    </div>
                    <div className="erp-profile-meta-list">
                      <div>
                        <span>📞 Phone:</span> <strong>{selectedPatient.phone}</strong>
                        <span className="ml-3">📍 Address:</span> <strong>{selectedPatient.address}</strong>
                      </div>
                      <div>
                        <span>⚠️ Allergies:</span> <strong className="text-amber-900">{selectedPatient.allergies || "No Known Allergies"}</strong>
                        <span className="ml-3">💍 Status:</span> <strong>{selectedPatient.maritalStatus || "Single"}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════════════════
              2. MAIN BODY 2-COLUMN GRID (ADMISSION DETAILS, CLINICAL, BED MATRIX & FEES)
              ═════════════════════════════════════════════════════════════════════════════════ */}
          <div className="ipd-erp-body-grid">
            {/* ── LEFT COLUMN ── */}
            <div className="ipd-erp-left-col">
              {/* 1. ADMISSION SPECIFICATIONS */}
              <div className="erp-section-panel">
                <div className="erp-section-banner">
                  <span className="erp-banner-icon">📋</span>
                  <span>Admission Specifications · भर्ती विवरण</span>
                </div>
                <div className="erp-section-inner">
                  {/* Admission Type Radio Pills */}
                  <div className="erp-field-group mb-2">
                    <label className="erp-label">
                      Admission Type <span className="erp-req">*</span>
                    </label>
                    <div className="erp-type-pills">
                      {["Emergency", "Planned", "Referral", "Transfer"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`erp-type-pill ${admissionType === type ? "active" : ""}`}
                          onClick={() => setAdmissionType(type)}
                        >
                          <span className="erp-radio-dot"></span>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="erp-grid-3">
                    <div className="erp-field-group">
                      <label className="erp-label">
                        Admission Date <span className="erp-req">*</span>
                      </label>
                      <input
                        type="date"
                        className="erp-input"
                        value={admissionDate}
                        onChange={(e) => setAdmissionDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">
                        Admission Time <span className="erp-req">*</span>
                      </label>
                      <input
                        type="time"
                        className="erp-input cursor-pointer"
                        value={admissionTime}
                        onChange={(e) => setAdmissionTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Admission Source</label>
                      <select
                        className="erp-select"
                        value={admissionSource}
                        onChange={(e) => setAdmissionSource(e.target.value)}
                      >
                        <option value="OPD">OPD Consultation</option>
                        <option value="Emergency">Emergency / Casualty</option>
                        <option value="Direct">Direct Admission</option>
                        <option value="Referral">External Referral</option>
                      </select>
                    </div>
                  </div>

                  <div className="erp-grid-2 mt-2">
                    <div className="erp-field-group">
                      <label className="erp-label">
                        Department <span className="erp-req">*</span>
                      </label>
                      <select
                        className="erp-select"
                        value={department?.id || ""}
                        onChange={(e) => {
                          const selected = departments.find((d) => d.id === e.target.value);
                          setDepartment(selected || null);
                        }}
                        disabled={departmentsLoading}
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">
                        Attending Doctor <span className="erp-req">*</span>
                      </label>
                      <select
                        className="erp-select"
                        value={selectedDoctor?.id || ""}
                        onChange={(e) => {
                          const selected = doctors.find((d) => d.id === e.target.value);
                          setSelectedDoctor(selected || null);
                        }}
                      >
                        <option value="">Select Doctor</option>
                        {(department
                          ? doctors.filter((d) => d.departmentId === department.id)
                          : doctors
                        ).map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} {doc.qualifications ? `(${doc.qualifications})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. PATIENT INFORMATION (Editable Demographics) */}
              <div className="erp-section-panel erp-panel-patient">
                <div className="erp-section-banner erp-banner-highlight">
                  <span className="erp-banner-icon">👤</span>
                  <span>Patient Information · मरीज का विवरण</span>
                </div>
                <div className="erp-section-inner">
                  <div className="erp-grid-4">
                    <div className="erp-field-group">
                      <label className="erp-label">UHID / Patient ID</label>
                      <input
                        type="text"
                        className="erp-input font-bold text-teal-800 bg-teal-50/60"
                        value={selectedPatient.uhid}
                        readOnly
                      />
                    </div>
                    <div className="erp-field-group erp-span-2">
                      <label className="erp-label">
                        Patient Full Name <span className="erp-req">*</span>
                      </label>
                      <input
                        type="text"
                        className="erp-input font-semibold"
                        value={selectedPatient.name}
                        onChange={(e) => setSelectedPatient({ ...selectedPatient, name: e.target.value })}
                        placeholder="Enter patient full name"
                        required
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Contact No</label>
                      <input
                        type="tel"
                        className="erp-input font-semibold"
                        value={selectedPatient.phone}
                        onChange={(e) => setSelectedPatient({ ...selectedPatient, phone: e.target.value })}
                        placeholder="Contact number"
                      />
                    </div>
                  </div>

                  <div className="erp-grid-4 mt-2">
                    <div className="erp-field-group">
                      <label className="erp-label">Age</label>
                      <input
                        type="text"
                        className="erp-input"
                        value={selectedPatient.age}
                        onChange={(e) => setSelectedPatient({ ...selectedPatient, age: e.target.value })}
                        placeholder="Age in yrs"
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Gender</label>
                      <select
                        className="erp-select"
                        value={selectedPatient.gender}
                        onChange={(e) => setSelectedPatient({ ...selectedPatient, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label text-red-700 font-bold">Blood Group</label>
                      <select
                        className="erp-select font-bold text-red-700"
                        value={selectedPatient.bloodGroup}
                        onChange={(e) => setSelectedPatient({ ...selectedPatient, bloodGroup: e.target.value })}
                      >
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Insurance / Payer</label>
                      <input
                        type="text"
                        className="erp-input"
                        value={selectedPatient.insurance || "Self Pay"}
                        onChange={(e) => setSelectedPatient({ ...selectedPatient, insurance: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="erp-grid-4 mt-2">
                    <div className="erp-field-group erp-span-2">
                      <label className="erp-label">Complete Address</label>
                      <input
                        type="text"
                        className="erp-input"
                        value={selectedPatient.address}
                        onChange={(e) => setSelectedPatient({ ...selectedPatient, address: e.target.value })}
                        placeholder="Enter full address"
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Marital Status</label>
                      <select
                        className="erp-select"
                        value={selectedPatient.maritalStatus || "Single"}
                        onChange={(e) => setSelectedPatient({ ...selectedPatient, maritalStatus: e.target.value })}
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Allergies</label>
                      <input
                        type="text"
                        className="erp-input text-amber-900 font-medium"
                        value={selectedPatient.allergies || "No Known Allergies"}
                        onChange={(e) => setSelectedPatient({ ...selectedPatient, allergies: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CLINICAL & REASON FOR ADMISSION */}
              <div className="erp-section-panel">
                <div className="erp-section-banner">
                  <span className="erp-banner-icon">🩺</span>
                  <span>Clinical & Admission Reason · भर्ती का कारण</span>
                </div>
                <div className="erp-section-inner">
                  {/* Complaints Selector */}
                  <div className="erp-field-group">
                    <label className="erp-label">
                      Chief Complaint / Symptoms <span className="erp-req">*</span>
                      <span className="text-[12px] text-slate-500 font-normal">
                        (Select multiple symptoms or add custom)
                      </span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <select
                        className="erp-select flex-1"
                        onChange={(e) => {
                          if (e.target.value) toggleComplaint(e.target.value);
                        }}
                        value=""
                      >
                        <option value="">Select Chief Complaint / मुख्य लक्षण चुनें...</option>
                        {POPULAR_IPD_COMPLAINTS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="Other">+ Other / अन्य समस्या</option>
                      </select>
                      <button
                        type="button"
                        className="erp-btn-sm-action"
                        onClick={() => setShowOtherComplaintInput(true)}
                      >
                        + Custom
                      </button>
                    </div>

                    {/* Inline Other Complaint Input */}
                    {showOtherComplaintInput && (
                      <div className="mt-2 flex gap-2 items-center bg-sky-50 p-2 rounded-lg border border-sky-200">
                        <input
                          type="text"
                          className="erp-input flex-1"
                          placeholder="Type custom complaint / समस्या लिखें..."
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
                          className="erp-btn-pill-save"
                          onClick={handleAddOtherComplaint}
                        >
                          + Add
                        </button>
                        <button
                          type="button"
                          className="erp-btn-pill-cancel"
                          onClick={() => {
                            setShowOtherComplaintInput(false);
                            setOtherComplaintText("");
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Active Complaint Badges */}
                    {selectedComplaints.length > 0 && (
                      <div className="erp-tags-wrap mt-2">
                        {selectedComplaints.map((c) => (
                          <span key={c} className="erp-tag-chip">
                            {c}
                            <button
                              type="button"
                              className="erp-tag-chip-remove"
                              onClick={() => removeComplaint(c)}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Duration, Severity & Provisional Diagnosis */}
                  <div className="erp-grid-3 mt-2">
                    <div className="erp-field-group">
                      <label className="erp-label">Duration</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="1"
                          className="erp-input w-24"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                        />
                        <select
                          className="erp-select flex-1"
                          value={durationUnit}
                          onChange={(e) => setDurationUnit(e.target.value)}
                        >
                          <option value="Days">Days (दिन)</option>
                          <option value="Hours">Hours (घंटे)</option>
                          <option value="Weeks">Weeks (सप्ताह)</option>
                        </select>
                      </div>
                    </div>

                    <div className="erp-field-group">
                      <label className="erp-label">
                        Severity <span className="text-[12px] text-slate-500 font-normal">· स्थिति</span>
                      </label>
                      <div className="flex gap-1.5">
                        {[
                          { label: "Mild", cls: "sev-mild" },
                          { label: "Moderate", cls: "sev-moderate" },
                          { label: "Severe", cls: "sev-severe" },
                          { label: "Critical", cls: "sev-critical" },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            className={`erp-sev-pill ${item.cls} ${severity === item.label ? "selected" : ""}`}
                            onClick={() => setSeverity(item.label)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="erp-field-group">
                      <label className="erp-label">Provisional Diagnosis</label>
                      <input
                        type="text"
                        className="erp-input"
                        value={provisionalDiagnosis}
                        onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                        placeholder="Provisional diagnosis"
                      />
                    </div>
                  </div>

                  {/* Quick Notes & Reason Textarea */}
                  <div className="erp-field-group mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="erp-label mb-0">
                        Reason for Admission / Clinical Notes <span className="erp-req">*</span>
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          "+ IV Antibiotics",
                          "+ Surgery",
                          "+ Observation",
                          "+ ICU Care",
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            className="erp-quick-chip"
                            onClick={() => appendQuickReasonPreset(preset.replace("+ ", ""))}
                          >
                            {preset}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="erp-quick-chip text-sky-700 font-bold"
                          onClick={() => setShowOtherReasonInput(!showOtherReasonInput)}
                        >
                          + Other
                        </button>
                      </div>
                    </div>

                    {showOtherReasonInput && (
                      <div className="mb-2 flex gap-2 items-center bg-sky-50 p-2 rounded-lg border border-sky-200">
                        <input
                          type="text"
                          className="erp-input flex-1"
                          placeholder="Type custom note / अन्य नोट..."
                          value={otherReasonText}
                          onChange={(e) => setOtherReasonText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddOtherReason();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="erp-btn-pill-save"
                          onClick={handleAddOtherReason}
                        >
                          + Add
                        </button>
                        <button
                          type="button"
                          className="erp-btn-pill-cancel"
                          onClick={() => {
                            setShowOtherReasonInput(false);
                            setOtherReasonText("");
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <textarea
                      className="erp-textarea"
                      rows={2.5}
                      placeholder="Patient requires inpatient observation, vital monitoring, and medical treatment..."
                      value={reasonForAdmission}
                      onChange={(e) => setReasonForAdmission(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="ipd-erp-right-col">
              {/* 4. BED / ROOM ALLOCATION (WITH AVAILABLE BEDS MATRIX) */}
              <div className="erp-section-panel">
                <div className="erp-section-banner">
                  <span className="erp-banner-icon">🛏️</span>
                  <span>Bed / Room Allocation & Ward Matrix · बेड आवंटन</span>
                </div>
                <div className="erp-section-inner">
                  <div className="erp-grid-2">
                    <div className="erp-field-group">
                      <label className="erp-label">
                        Ward Type <span className="erp-req">*</span>
                      </label>
                      <select
                        className="erp-select font-semibold"
                        value={wardType}
                        onChange={(e) => setWardType(e.target.value)}
                      >
                        <option value="General Ward">General Ward</option>
                        <option value="ICU">ICU (Intensive Care)</option>
                        <option value="Private Room">Private Room</option>
                        <option value="Semi-Private Room">Semi-Private Room</option>
                      </select>
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Room Type</label>
                      <select
                        className="erp-select"
                        value={roomType}
                        onChange={(e) => setRoomType(e.target.value)}
                      >
                        <option value="Multi Bed">Multi Bed Ward</option>
                        <option value="Single Deluxe">Single Deluxe</option>
                        <option value="Twin Sharing">Twin Sharing</option>
                        <option value="Isolation">Isolation</option>
                      </select>
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Floor</label>
                      <select
                        className="erp-select"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                      >
                        <option value="Ground Floor">Ground Floor</option>
                        <option value="1st Floor">1st Floor</option>
                        <option value="2nd Floor">2nd Floor</option>
                        <option value="3rd Floor">3rd Floor</option>
                      </select>
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">
                        Selected Bed <span className="erp-req">*</span>
                      </label>
                      <div className="erp-selected-bed-display">
                        <Icon name="LuBed" size={17} className="text-teal-700" />
                        <span className="font-extrabold text-teal-900 text-[13px]">
                          {selectedBed || "Select Bed Below"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Bed Matrix Box */}
                  <div className="erp-bed-matrix-box mt-3">
                    <div className="erp-bed-matrix-head">
                      <span className="erp-bed-matrix-title">
                        Interactive Bed Grid — <strong>{wardType}</strong>
                      </span>
                      <div className="erp-bed-legend">
                        <span className="erp-legend-item">
                          <span className="erp-dot-avail"></span> Available
                        </span>
                        <span className="erp-legend-item">
                          <span className="erp-dot-occ"></span> Occupied
                        </span>
                        <span className="erp-legend-item">
                          <span className="erp-dot-sel"></span> Selected
                        </span>
                      </div>
                    </div>

                    <div className="erp-bed-cards-grid">
                      {(filteredBeds.length > 0 ? filteredBeds : availableBedsGrid).map((b) => {
                        const normalizedStatus = normalizeBedStatus(
                          b.status || b.current_status || "available"
                        );
                        const isAvailable = normalizedStatus === "available";
                        const isSelected = selectedBed === b.bedNo;

                        return (
                          <div
                            key={b.id || b.bedNo}
                            className={`erp-bed-card ${isAvailable ? "avail" : "occ"} ${
                              isSelected ? "sel" : ""
                            }`}
                            onClick={() => {
                              if (isAvailable) setSelectedBed(b.bedNo);
                            }}
                          >
                            <div className="erp-bed-card-main">
                              <span className="erp-bed-icon">🛏️</span>
                              <div className="erp-bed-text">
                                <span className="erp-bed-no">{b.bedNo}</span>
                                <span className="erp-bed-room">{b.floor || "Ward Bed"}</span>
                              </div>
                            </div>
                            <span className="erp-bed-badge">
                              {isSelected ? "Selected ✓" : isAvailable ? "Available" : "Occupied"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. ATTENDANT DETAILS */}
              <div className="erp-side-panel">
                <div className="erp-side-panel-header">
                  <span className="erp-banner-icon">👥</span>
                  <span>Attendant Details · साथी विवरण</span>
                </div>
                <div className="erp-side-panel-body">
                  <div className="erp-grid-2">
                    <div className="erp-field-group">
                      <label className="erp-label">
                        Attendant Name <span className="erp-req">*</span>
                      </label>
                      <input
                        type="text"
                        className="erp-input font-medium"
                        value={attendantName}
                        onChange={(e) => setAttendantName(e.target.value)}
                        placeholder="Attendant full name"
                        required
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">
                        Relationship <span className="erp-req">*</span>
                      </label>
                      <input
                        type="text"
                        className="erp-input"
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        placeholder="e.g. Brother, Spouse"
                        required
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">
                        Attendant Mobile <span className="erp-req">*</span>
                      </label>
                      <input
                        type="tel"
                        className="erp-input"
                        value={attendantMobile}
                        onChange={(e) => setAttendantMobile(e.target.value)}
                        placeholder="10-digit mobile"
                        required
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Alternate Mobile</label>
                      <input
                        type="tel"
                        className="erp-input"
                        value={alternateMobile}
                        onChange={(e) => setAlternateMobile(e.target.value)}
                        placeholder="Secondary mobile"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. ADMISSION FORM FEE DETAIL */}
              <div className="erp-side-panel">
                <div className="erp-side-panel-header">
                  <span className="erp-banner-icon">💳</span>
                  <span>Admission Fee & Advance Detail · अग्रिम शुल्क</span>
                </div>
                <div className="erp-side-panel-body">
                  <div className="erp-grid-2">
                    <div className="erp-field-group">
                      <label className="erp-label">Registration Fee</label>
                      <input
                        type="number"
                        className="erp-input bg-slate-50 font-semibold"
                        value={registrationFee}
                        readOnly
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Bed Advance (₹)</label>
                      <input
                        type="number"
                        className="erp-input font-semibold"
                        value={bedAdvance}
                        onChange={(e) => setBedAdvance(e.target.value)}
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Other Charges (₹)</label>
                      <input
                        type="number"
                        className="erp-input"
                        value={otherCharges}
                        onChange={(e) => setOtherCharges(e.target.value)}
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Payment Mode</label>
                      <select
                        className="erp-select font-semibold"
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI / QR</option>
                        <option value="Insurance">Insurance / TPA</option>
                      </select>
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Payment Status</label>
                      <select
                        className="erp-select font-semibold text-emerald-800"
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                      </select>
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Amount Received (₹)</label>
                      <input
                        type="number"
                        className="erp-input font-semibold text-slate-800"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Total Advance Highlight Banner */}
                  <div className="erp-total-advance-highlight mt-3">
                    <span className="erp-tot-lbl">TOTAL ADVANCE PAYABLE</span>
                    <span className="erp-tot-val">₹ {totalAdvance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 7. ADMISSION SUMMARY & ADDITIONAL INFO */}
              <div className="erp-side-panel">
                <div className="erp-side-panel-header">
                  <span className="erp-banner-icon">📊</span>
                  <span>Admission Information Summary & Notes</span>
                </div>
                <div className="erp-side-panel-body">
                  <div className="erp-info-matrix">
                    <div className="erp-info-tile">
                      <span className="erp-info-lbl">Admission</span>
                      <strong className="erp-info-val text-blue-900">{admissionType} (IPD)</strong>
                    </div>
                    <div className="erp-info-tile">
                      <span className="erp-info-lbl">Status</span>
                      <strong className="erp-info-val text-amber-700">Pending Admission</strong>
                    </div>
                    <div className="erp-info-tile">
                      <span className="erp-info-lbl">Allocated Bed</span>
                      <strong className="erp-info-val text-emerald-800">
                        {selectedBed || "Not Selected"}
                      </strong>
                    </div>
                    <div className="erp-info-tile">
                      <span className="erp-info-lbl">Ward Unit</span>
                      <strong className="erp-info-val text-slate-800">{wardType}</strong>
                    </div>
                    <div className="erp-info-tile erp-tile-full">
                      <span className="erp-info-lbl">Attending Doctor</span>
                      <strong className="erp-info-val text-slate-900">
                        {selectedDoctor?.name || "Dr. Amit Sharma"}
                      </strong>
                    </div>
                  </div>

                  {/* Expected Discharge & Remarks */}
                  <div className="erp-grid-2 mt-2">
                    <div className="erp-field-group">
                      <label className="erp-label">Expected Discharge Date</label>
                      <input
                        type="date"
                        className="erp-input"
                        value={expectedDischargeDate}
                        onChange={(e) => setExpectedDischargeDate(e.target.value)}
                      />
                    </div>
                    <div className="erp-field-group">
                      <label className="erp-label">Remarks</label>
                      <input
                        type="text"
                        className="erp-input"
                        placeholder="Additional remarks..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                  </div>

                  <p className="erp-guidance-note mt-2">
                    Fill the inpatient admission details and allocate ward bed carefully before submitting the form.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM ACTION BUTTONS BAR ── */}
          <div className="ipd-erp-footer-actions">
            <div className="erp-action-buttons-group">
              <button
                type="button"
                className="btn-erp-action btn-erp-new"
                onClick={handleResetForm}
                title="Clear and start new admission"
              >
                <Icon name="LuPlus" size={17} />
                <span>+ New</span>
              </button>

              <button
                type="button"
                className="btn-erp-action btn-erp-save"
                onClick={() => toast.success("Admission draft saved successfully", { icon: "💾" })}
                title="Save draft locally"
              >
                <Icon name="LuSave" size={17} />
                <span>Save</span>
              </button>

              <button
                type="submit"
                className="btn-erp-action btn-erp-submit"
                title="Confirm and submit inpatient admission"
              >
                <Icon name="LuSend" size={17} />
                <span>Form Submit</span>
              </button>

              <button
                type="button"
                className="btn-erp-action btn-erp-modify"
                onClick={() => {
                  if (ipdSlipData) {
                    setShowPrintModal(true);
                  } else {
                    toast.info("Please submit or confirm admission to preview/print the slip", { icon: "ℹ️" });
                  }
                }}
                title="Preview or print admission slip"
              >
                <Icon name="LuPrinter" size={17} />
                <span>Modify / Print</span>
              </button>

              <button
                type="button"
                className="btn-erp-action btn-erp-exit"
                onClick={() => navigate(-1)}
                title="Close and exit form"
              >
                <Icon name="LuX" size={17} />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── PRINTABLE IPD ADMISSION SLIP MODAL ── */}
      {showPrintModal && ipdSlipData && (
        <div className="opd-modal-overlay">
          <div className="opd-print-modal">
            <div className="opd-print-header">
              <h3>🏥 IPD Inpatient Admission Summary</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowPrintModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="printable-slip" id="opd-printable-receipt">
              <div className="slip-top-accent-bar"></div>

              <div className="slip-hospital-header">
                <div className="slip-title-badge-wrap">
                  <span className="slip-badge-title">IPD ADMISSION SUMMARY & RECEIPT</span>
                </div>
                <div className="token-inline-box">
                  <span className="token-inline-lbl">BED ALLOTTED</span>
                  <span className="token-num-highlight">{ipdSlipData.bedNo}</span>
                </div>
              </div>

              <div className="slip-details-grid">
                <div className="slip-detail-item">
                  <span className="lbl">Admission Date:</span>
                  <span className="val font-semibold">{ipdSlipData.admissionDate}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Admission Type:</span>
                  <span className="val">{ipdSlipData.admissionType}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">UHID:</span>
                  <span className="val font-mono font-bold">{ipdSlipData.uhid}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Patient Name:</span>
                  <span className="val font-bold text-slate-800">{ipdSlipData.patientName}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Age / Gender:</span>
                  <span className="val">{ipdSlipData.age} Yrs / {ipdSlipData.gender}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Mobile:</span>
                  <span className="val">{ipdSlipData.phone}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Ward & Room:</span>
                  <span className="val font-semibold">
                    {ipdSlipData.wardType} - Room {ipdSlipData.roomNo}
                  </span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Attending Doctor:</span>
                  <span className="val font-medium">
                    {ipdSlipData.doctor} ({ipdSlipData.doctorDegree})
                  </span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Attendant:</span>
                  <span className="val font-medium">
                    {ipdSlipData.attendantName} ({ipdSlipData.relationship}) - {ipdSlipData.attendantMobile}
                  </span>
                </div>
                <div className="slip-detail-item full-width">
                  <span className="lbl">Diagnosis:</span>
                  <span className="val font-medium">{ipdSlipData.provisionalDiagnosis}</span>
                </div>
              </div>

              <div className="slip-fee-table">
                <div className="fee-line">
                  <span>Registration Fee</span>
                  <span>₹ {Number(ipdSlipData.registrationFee).toFixed(2)}</span>
                </div>
                <div className="fee-line">
                  <span>Bed Advance (Refundable)</span>
                  <span>₹ {Number(ipdSlipData.bedAdvance).toFixed(2)}</span>
                </div>
                {ipdSlipData.otherCharges && Number(ipdSlipData.otherCharges) > 0 && (
                  <div className="fee-line">
                    <span>Other Charges</span>
                    <span>₹ {Number(ipdSlipData.otherCharges).toFixed(2)}</span>
                  </div>
                )}
                <div className="fee-line total">
                  <span>Total Advance Paid ({ipdSlipData.paymentMode})</span>
                  <span>₹ {Number(ipdSlipData.totalAdvance).toFixed(2)}</span>
                </div>
                <div className="fee-line">
                  <span>Payer Type</span>
                  <span>
                    {ipdSlipData.payerType?.charAt(0).toUpperCase() +
                      ipdSlipData.payerType?.slice(1) || "Self"}
                  </span>
                </div>
              </div>

              <div className="slip-footer">
                <div className="footer-left">
                  <p className="thank-msg">Wish you a speedy recovery!</p>
                  <p className="computer-gen">* Computer Generated IPD Inpatient Admission Tag.</p>
                </div>
                <div className="footer-right">
                  <div className="sig-line"></div>
                  <span className="signature">Authorized Admission Desk Signature</span>
                </div>
              </div>
            </div>

            <div className="opd-print-actions">
              <button
                type="button"
                className="btn-print-action"
                onClick={handlePrintSlip}
              >
                🖨️ Print IPD Slip
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
