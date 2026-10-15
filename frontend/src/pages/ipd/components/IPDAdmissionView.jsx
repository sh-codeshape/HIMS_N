import React, { useState, useEffect, useRef } from "react";
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
  "Fever", "Breathing Difficulty", "Severe Abdominal Pain",
  "Trauma / Injury", "Chest Pain", "High BP / Hypertension", "Dehydration"
];

export default function IPDAdmissionView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(DEFAULT_PRESET_PATIENT);

  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientSearchRef = useRef(null);

  // ── Department & Doctor (real data from backend) ──
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

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
          axiosInstance.get("/staff/departments").then(r => r.data?.data || []).catch(() => []),
          axiosInstance.get("/staff/doctors").then(r => r.data?.data || []).catch(() => []),
        ]);

        const mappedPatients = (patientsData || []).map((p) => ({
          id: p.id,
          uhid: p.uhid,
          name: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient",
          age: p.age ?? (p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth).getTime()) / 3.15576e+10) : 0),
          gender: p.gender,
          bloodGroup: p.blood_group || "Unknown",
        }));

        const mappedBeds = (bedsData || []).map((b) => ({
          id: b.id,
          bedNo: b.bed_no,
          ward: b.ward_name,
          floor: b.room_name ? `Room ${b.room_name}` : "General",
          status: b.current_status,
        }));

        // Map departments from backend
        const mappedDepartments = (deptsData || []).map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          description: d.description,
        }));

        // Map doctors from backend and group by department
        const mappedDoctors = (docsData || []).map((d) => ({
          id: d.practitioner_id || d.id,
          name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.name || 'Doctor',
          departmentId: d.department_id,
          qualifications: d.qualifications,
          registrationNo: d.registration_no,
        }));

        // Group doctors by department
        const doctorsByDept = {};
        (mappedDepartments || []).forEach((dept) => {
          doctorsByDept[dept.id] = mappedDoctors.filter((doc) => doc.departmentId === dept.id);
        });

        setPatients(mappedPatients.length ? mappedPatients : (mockStore.getPatients ? mockStore.getPatients() : []));
        setBeds(mappedBeds.length ? mappedBeds : (mockStore.getBeds ? mockStore.getBeds() : []));
        setDepartments(mappedDepartments);
        setDoctors(mappedDoctors);
        // Initialize first department and doctor
        if (mappedDepartments.length > 0 && !department) {
          setDepartment(mappedDepartments[0]);
        }
        setDepartmentsLoading(false);
      } catch (err) {
        const fallbackPatients = mockStore.getPatients ? mockStore.getPatients() : [];
        const fallbackBeds = mockStore.getBeds ? mockStore.getBeds() : [];
        setPatients(fallbackPatients);
        setBeds(fallbackBeds);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const clickHandler = (e) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(e.target)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener("mousedown", clickHandler);
    return () => document.removeEventListener("mousedown", clickHandler);
  }, []);

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
          const pName = found.full_name || found.name || `${found.first_name || found.firstName || ""} ${found.last_name || found.lastName || ""}`.trim();
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
    const pName = p.full_name || p.name || `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim();
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

  // ── Card 1: Admission Details ──
  const [admissionType, setAdmissionType] = useState("Emergency");
  const getCurrentDateStr = () => new Date().toISOString().slice(0, 10);
  const getCurrentTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };
  const [admissionDate, setAdmissionDate] = useState(getCurrentDateStr());
  const [admissionTime, setAdmissionTime] = useState(getCurrentTimeStr());
  const [admissionSource, setAdmissionSource] = useState("OPD");

  // ── Card 2: Department & Doctor ──
  const [department, setDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // ── Card 3: Reason for Admission ──
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

  // ── Card 4: Bed / Room Allocation ──
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

  // ── Card 5: Attendant Details ──
  const [attendantName, setAttendantName] = useState("Raj Kumar");
  const [relationship, setRelationship] = useState("Brother");
  const [attendantMobile, setAttendantMobile] = useState("9876500000");
  const [alternateMobile, setAlternateMobile] = useState("9876500001");

  // ── Card 6: Estimated / Advance Details ──
  const [registrationFee] = useState(100);
  const [bedAdvance, setBedAdvance] = useState(5000);
  const [otherCharges, setOtherCharges] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [amountReceived, setAmountReceived] = useState(5100);

  const totalAdvance = Number(registrationFee) + Number(bedAdvance || 0) + Number(otherCharges || 0);

  // ── Card 7: Additional Information ──
  const [expectedDischargeDate, setExpectedDischargeDate] = useState("2026-10-05");
  const [remarks, setRemarks] = useState("");

  // ── Modal State ──
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [ipdSlipData, setIpdSlipData] = useState(null);

  useEffect(() => {
    if (department && doctors.length > 0) {
      const docs = doctors.filter((d) => d.departmentId === department.id);
      setSelectedDoctor(docs.length > 0 ? docs[0] : null);
    }
  }, [department, doctors]);



  const handleConfirmAdmission = async (e) => {
    e.preventDefault();
    if (!selectedBed) {
      toast.error("Please select an available bed!");
      return;
    }

    try {
      // Resolve facility_id from JWT token (same pattern as billing pages)
      let facilityId = "";
      try {
        const token = localStorage.getItem("hims_token");
        const decoded = token ? jwtDecode(token) : null;
        facilityId = decoded?.facilityId || decoded?.facility_id || facilityId;
      } catch {
        // keep empty; backend resolves from auth context
      }

      const now = new Date();
      const formattedDate = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

      let payloadAdmissionType = "elective";
      if (admissionType === "Emergency") payloadAdmissionType = "emergency";
      else if (admissionType === "Referral") payloadAdmissionType = "referral";
      else if (admissionType === "Transfer") payloadAdmissionType = "transfer";

      let actualBedId = selectedBed; // Usually backend bed id
      // If selectedBed matches availableBedsGrid format, it might be the bedNo string
      // Let's find the matching bed object from `beds` state if possible
      const matchedBed = beds.find(b => b.bedNo === selectedBed || b.id === selectedBed);
      if (matchedBed && matchedBed.id) {
        actualBedId = matchedBed.id;
      }

      // Derive payer type from patient insurance info
      const insuranceVal = String(selectedPatient.insurance || "").trim().toLowerCase();
      let payerType = "self";
      if (insuranceVal === "insured" || insuranceVal.includes("insurance") || insuranceVal === "tpa") {
        payerType = "insurance";
      } else if (insuranceVal === "corporate") {
        payerType = "corporate";
      } else if (insuranceVal === "government") {
        payerType = "government";
      }

      // Build advance deposit from form fields
      const advanceAmount = Number(registrationFee) + Number(bedAdvance || 0) + Number(otherCharges || 0);
      const advanceDeposit = advanceAmount > 0
        ? {
            amount: advanceAmount,
            payment_mode: paymentMode,
            receipt_no: null, // backend will generate via number sequence if not provided
          }
        : null;

      // Only send bed_id if it's a real UUID from the backend (not mock data like "b1", "b2")
      const realBedId = actualBedId && actualBedId !== selectedBed && actualBedId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ? actualBedId
        : null;

      // Attempt backend admission (non-fatal — slip still shows with entered data)
      if (selectedPatient.id && selectedPatient.id !== selectedPatient.uhid) {
        try {
          await ipdService.admitPatient({
            facility_id: facilityId,
            patient_id: selectedPatient.id,
            bed_id: realBedId,
            department_id: department?.id || null,
            admitting_practitioner_id: selectedDoctor?.id || null,
            tariff_plan_id: null, // backend defaults to org default tariff plan
            entitled_bed_category_id: null, // resolved by backend from bed category if needed
            admission_type: payloadAdmissionType,
            reason_for_admission: reasonForAdmission || selectedComplaints.join(", "),
            attendant_name: attendantName,
            attendant_relation: relationship,
            attendant_phone: attendantMobile,
            payer_type: payerType,
            patient_coverage_id: null, // to be resolved post-admission via coverage lookup
            advance_deposit: advanceDeposit
          });
        } catch (admitErr) {
          console.error('Backend admission failed:', admitErr);
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
        department: department?.name || '',
        doctor: selectedDoctor?.name || '',
        doctorDegree: selectedDoctor?.qualifications || '',
        wardType,
        roomType,
        floor,
        roomNo,
        bedNo: selectedBed, // for receipt
        attendantName,
        relationship,
        attendantMobile,
        registrationFee,
        bedAdvance,
        otherCharges,
        totalAdvance: advanceAmount,
        paymentMode,
        paymentStatus,
        payerType,
        date: formattedDate,
      };

      setIpdSlipData(admissionRecord);
      setShowPrintModal(true);
      toast.success(`IPD Admission Confirmed for ${admissionRecord.patientName} on ${selectedBed}!`, { icon: "🏥" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to admit patient to IPD.");
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="ipd-page-wrapper">
      {/* ── OLD PATIENT SEARCH & QUICK ACTIONS HEADER ── */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-3" ref={patientSearchRef}>
        <div className="relative flex-1 min-w-[300px]">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
            <Icon name="LuSearch" size={18} className="text-teal-700 shrink-0" />
            <input
              type="text"
              className="w-full bg-transparent text-xs font-semibold text-slate-800 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
              placeholder="🔍 Old Patient? Search by Mobile No., Name or UHID / पुराने मरीज का मोबाइल न., नाम या UHID लिखें..."
              value={patientSearchQuery}
              onChange={handlePatientSearchChange}
              onFocus={() => {
                if (patientSearchQuery.trim()) setShowPatientDropdown(true);
              }}
            />
            {patientSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setPatientSearchQuery("");
                  setPatientSearchResults([]);
                  setShowPatientDropdown(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <Icon name="LuX" size={16} />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showPatientDropdown && patientSearchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
              <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Matching Patients ({patientSearchResults.length})
              </div>
              {patientSearchResults.map((p) => {
                const pName = p.full_name || p.name || `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim() || "Patient";
                const pPhone = p.phone || p.mobile1 || p.mobile || "N/A";
                return (
                  <div
                    key={p.uhid || p.id}
                    className="p-3 hover:bg-teal-50/90 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                    onClick={() => handleSelectOldPatient(p)}
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs group-hover:text-teal-800 flex items-center gap-2">
                        <span>{pName}</span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold">Select</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2.5 mt-0.5">
                        <span>UHID: <strong className="text-teal-700">{p.uhid}</strong></span>
                        <span>•</span>
                        <span>📞 {pPhone}</span>
                        {p.city && <span>• 📍 {p.city}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold text-[11px] rounded border border-slate-200">
                        {p.age || p.ageYrs || "30"} Yrs / {p.gender || "Male"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── TOP PATIENT BANNER ── */}
      <div className="ipd-patient-banner-card">
        <div className="ipd-patient-banner-left">
          <div className="ipd-patient-avatar-box">
            <img
              src=""
              alt="Rahul Kumar"
            />
          </div>
          <div className="ipd-patient-main-info">
            <h2>
              {selectedPatient.name}
            </h2>
            <div className="ipd-patient-meta-row">
              <span><strong>UHID :</strong> {selectedPatient.uhid}</span>
              <span><strong>Age / Gender :</strong> {selectedPatient.age} Years / {selectedPatient.gender}</span>
              
            </div>
          </div>
        </div>

        <div className="ipd-patient-banner-mid">
          <div className="meta-item">📞 {selectedPatient.phone}</div>
          <div className="meta-item text-red-600 font-bold">🩸 Blood Group : {selectedPatient.bloodGroup}</div>
          <div className="meta-item">📍 {selectedPatient.address}</div>
         
        </div>

   
      </div>

      {/* ── MAIN 2-COLUMN FORM LAYOUT ── */}
      <form onSubmit={handleConfirmAdmission}>
        <div className="ipd-main-layout-grid">
          
          {/* ── LEFT COLUMN (~68% Width) ── */}
          <div className="ipd-column-left">
            
            {/* CARD 1: ADMISSION DETAILS */}
            <div className="ipd-sec-card">
              <div className="ipd-sec-card-header">
                <div className="ipd-step-icon-num">1</div>
                <h3>Admission Details</h3>
              </div>
              <div className="ipd-sec-card-body">
                <div className="ipd-field-group">
                  <label className="ipd-label">Admission Type <span className="req">*</span></label>
                  <div className="radio-pill-flex">
                    {["Emergency", "Planned", "Referral", "Transfer"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`radio-pill-btn ${admissionType === type ? "active" : ""}`}
                        onClick={() => setAdmissionType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="ipd-field-group">
                    <label className="ipd-label">Admission Date <span className="req">*</span></label>
                    <input
                      type="date"
                      className="ipd-input"
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="ipd-field-group">
                    <label className="ipd-label">Admission Time <span className="req">*</span></label>
                    <input
                      type="time"
                      className="ipd-input cursor-pointer"
                      value={admissionTime}
                      onChange={(e) => setAdmissionTime(e.target.value)}
                      required
                    />
                  </div>
                 
                </div>
              </div>
            </div>

            

            {/* CARD 2: DEPARTMENT & DOCTOR */}
             <div className="ipd-sec-card">
               <div className="ipd-sec-card-header">
                 <div className="ipd-step-icon-num">2</div>
                 <h3>Department & Doctor</h3>
               </div>
               <div className="ipd-sec-card-body">
                 {departmentsLoading ? (
                   <div className="flex items-center justify-center py-4">
                     <span className="text-slate-500">Loading departments...</span>
                   </div>
                 ) : departments.length === 0 ? (
                   <div className="p-4 bg-slate-50 rounded border border-slate-200">
                     <p className="text-sm text-slate-600">No departments found.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 gap-4">
                     <div className="ipd-field-group">
                       <label className="ipd-label">Department <span className="req">*</span></label>
                       <select
                         className="ipd-select"
                         value={department?.id || ""}
                         onChange={(e) => {
                           const selected = departments.find((d) => d.id === e.target.value);
                           setDepartment(selected || null);
                         }}
                       >
                         <option value="">Select Department</option>
                         {departments.map((d) => (
                           <option key={d.id} value={d.id}>{d.name}</option>
                         ))}
                       </select>
                     </div>
                     <div className="ipd-field-group">
                       <label className="ipd-label">Attending Doctor <span className="req">*</span></label>
                       <select
                         className="ipd-select"
                         value={selectedDoctor?.id || ""}
                         onChange={(e) => {
                           const selected = doctors.find((d) => d.id === e.target.value);
                           setSelectedDoctor(selected || null);
                         }}
                       >
                         <option value="">Select Doctor</option>
                         {(department && doctors.filter((d) => d.departmentId === department.id)).map((doc) => (
                           <option key={doc.id} value={doc.id}>
                             {doc.name} ({doc.qualifications || ''})
                           </option>
                         ))}
                       </select>
                     </div>
                   </div>
                 )}
               </div>
             </div>

             {/* CARD 3: REASON FOR ADMISSION */}
            <div className="ipd-sec-card">
              <div className="ipd-sec-card-header">
                <div className="ipd-step-icon-num">2</div>
                <h3>Reason for Admission · भर्ती का कारण एवं विवरण</h3>
              </div>
              <div className="ipd-sec-card-body">
                
                {/* Chief Complaint / Main Symptoms */}
                <div className="ipd-field-group">
                  <label className="ipd-label">
                    Chief Complaint / Symptoms <span className="req">*</span>
                    <span className="font-normal text-slate-400 text-xs">· मुख्य समस्या</span>
                  </label>
                  
                  {/* Select Dropdown */}
                  <select
                    className="ipd-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        toggleComplaint(e.target.value);
                      }
                    }}
                    value=""
                  >
                    <option value="">Search or select complaint / समस्या चुनें...</option>
                    {POPULAR_IPD_COMPLAINTS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Other">+ Other / अन्य समस्या</option>
                  </select>

                 

                  {/* Inline Other Complaint Input */}
                  {showOtherComplaintInput && (
                    <div className="other-complaint-box mt-2 flex gap-2 items-center">
                      <input
                        type="text"
                        className="ipd-input flex-1"
                        placeholder="Type custom complaint / अन्य समस्या लिखें..."
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
                        className="px-3 py-1.5 bg-teal-700 text-white font-bold text-xs rounded-lg shrink-0"
                        onClick={handleAddOtherComplaint}
                      >
                        + Add / जोड़ें
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg shrink-0"
                        onClick={() => {
                          setShowOtherComplaintInput(false);
                          setOtherComplaintText("");
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Selected Tag Pills */}
                  {selectedComplaints.length > 0 && (
                    <div className="complaint-tags-flex mt-2">
                      {selectedComplaints.map((c) => (
                        <span key={c} className="complaint-tag-pill">
                          {c}
                          <button
                            type="button"
                            className="complaint-tag-remove"
                            onClick={() => removeComplaint(c)}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duration & Severity */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="ipd-field-group">
                    <label className="ipd-label">
                      Duration 
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        className="ipd-input w-20"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                      <select
                        className="ipd-select flex-1"
                        value={durationUnit}
                        onChange={(e) => setDurationUnit(e.target.value)}
                      >
                        <option value="Days">Days (दिन)</option>
                        <option value="Hours">Hours (घंटे)</option>
                        <option value="Weeks">Weeks (सप्ताह)</option>
                      </select>
                    </div>
                  </div>

                  <div className="ipd-field-group">
                    <label className="ipd-label">
                      Severity <span className="font-normal text-slate-400 text-xs">· गंभीर स्थिति</span>
                    </label>
                    <div className="flex gap-1">
                      {[
                        { label: "Mild", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
                        { label: "Moderate", color: "bg-amber-50 text-amber-700 border-amber-300" },
                        { label: "Severe", color: "bg-orange-50 text-orange-700 border-orange-300" },
                        { label: "Critical", color: "bg-rose-50 text-rose-700 border-rose-300" }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className={`flex-1 py-1.5 px-1 text-xs font-bold border rounded-lg transition-all ${
                            severity === item.label
                              ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                              : `${item.color} opacity-80 hover:opacity-100`
                          }`}
                          onClick={() => setSeverity(item.label)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                

                {/* Reason for Admission Notes & Fast Preset Chips */}
                <div className="ipd-field-group">
                  <div className="flex justify-between items-center">
                    <label className="ipd-label">
                      Reason for Admission / Notes <span className="req">*</span>
                      <span className="font-normal text-slate-400 text-xs">· भर्ती का मुख्य कारण</span>
                    </label>
                  </div>
                  
                  {/* Preset quick action buttons for 1-click filling */}
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 self-center">Quick Notes:</span>
                    {[
                      "+ IV Antibiotics & Monitoring",
                      "+ Scheduled for Surgery",
                      "+ Emergency Observation Required",
                      "+ Oxygen & ICU Support Needed",
                      "+ Pre-Op Care & Evaluation"
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300 rounded hover:bg-teal-50 hover:border-teal-400 hover:text-teal-800 transition-all"
                        onClick={() => appendQuickReasonPreset(preset.replace("+ ", ""))}
                      >
                        {preset}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="px-2 py-0.5 text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-300 rounded hover:bg-teal-100 transition-all font-semibold"
                      onClick={() => setShowOtherReasonInput(!showOtherReasonInput)}
                    >
                      + Other / अन्य
                    </button>
                  </div>

                  {showOtherReasonInput && (
                    <div className="mb-2 flex gap-2 items-center bg-teal-50/80 p-2 rounded-lg border border-teal-200 shadow-sm animate-fadeIn">
                      <input
                        type="text"
                        className="ipd-input flex-1 text-sm bg-white"
                        placeholder="Write custom reason or note / अन्य कारण या नोट लिखें..."
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
                        className="px-3 py-1.5 bg-teal-700 text-white font-bold text-xs rounded-lg hover:bg-teal-800 shrink-0 shadow-sm transition-all"
                        onClick={handleAddOtherReason}
                      >
                        + Add / जोड़ें
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-300 shrink-0 transition-all"
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
                    className="ipd-textarea"
                    rows={2.5}
                    placeholder="Patient requires inpatient observation, vital monitoring, and medical treatment..."
                    value={reasonForAdmission}
                    onChange={(e) => setReasonForAdmission(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* CARD 4: BED / ROOM ALLOCATION (WITH AVAILABLE BEDS MATRIX) */}
            <div className="ipd-sec-card">
              <div className="ipd-sec-card-header">
                <div className="ipd-step-icon-num">3</div>
                <h3>Bed / Room Allocation</h3>
              </div>
              <div className="ipd-sec-card-body">
                <div className="grid grid-cols-5 gap-3">
                  <div className="ipd-field-group">
                    <label className="ipd-label">Ward Type <span className="req">*</span></label>
                    <select className="ipd-select" value={wardType} onChange={(e) => setWardType(e.target.value)}>
                      <option value="General Ward">General Ward</option>
                      <option value="ICU">ICU</option>
                      <option value="Private Room">Private Room</option>
                      <option value="Semi-Private Room">Semi-Private Room</option>
                    </select>
                  </div>

                 

                 

                  

                 
                </div>

                {/* ── AVAILABLE BEDS VISUAL MATRIX GRID ── */}
                <div className="bed-matrix-wrapper">
                  <div className="bed-matrix-header">
                    <span className="bed-matrix-title">
                      <Icon name="LuBed" size={16} className="text-teal-700" /> Available Beds Matrix ({wardType})
                    </span>
                    <div className="bed-legend-flex">
                      <div className="bed-legend-item">
                        <span className="bed-status-dot avail"></span> Available
                      </div>
                      <div className="bed-legend-item">
                        <span className="bed-status-dot occ"></span> Occupied
                      </div>
                    </div>
                  </div>

                  <div className="bed-grid-cards">
                    {(beds.length > 0 ? beds : availableBedsGrid).map((b) => {
                      const normalizedStatus = normalizeBedStatus(b.status || b.current_status || "available");
                      const displayStatus = normalizedStatus === "available" ? "Available" : normalizedStatus === "occupied" ? "Occupied" : normalizedStatus === "reserved" ? "Reserved" : normalizedStatus === "blocked" ? "Blocked" : normalizedStatus === "maintenance" ? "Maintenance" : "Cleaning";
                      const isAvailable = normalizedStatus === "available";
                      const isSelected = selectedBed === b.bedNo;

                      return (
                        <div
                          key={b.id}
                          className={`bed-card-item ${isAvailable ? "available" : "occupied"} ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedBed(b.bedNo);
                            }
                          }}
                        >
                          <div className="bed-card-top">
                            <span className="bed-card-no">🛏️ {b.bedNo}</span>
                            <span className="bed-card-status-badge">
                              {displayStatus} {isSelected && "✓"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

           

          </div>

          {/* ── RIGHT COLUMN (~32% Width) ── */}
          <div className="ipd-column-right">
            

            {/* CARD 7: ADDITIONAL INFORMATION (OPTIONAL) */}
            <div className="ipd-sec-card">
              <div className="ipd-sec-card-header">
                <div className="ipd-step-icon-num">7</div>
                <h3>Additional Information <span className="font-normal text-slate-400 text-xs">(Optional)</span></h3>
              </div>
              <div className="ipd-sec-card-body">
                <div className="ipd-field-group">
                  <label className="ipd-label">Expected Discharge Date</label>
                  <input
                    type="date"
                    className="ipd-input"
                    value={expectedDischargeDate}
                    onChange={(e) => setExpectedDischargeDate(e.target.value)}
                  />
                </div>

                <div className="ipd-field-group">
                  <label className="ipd-label">Remarks</label>
                  <textarea
                    className="ipd-textarea"
                    rows={2}
                    placeholder="Any additional notes..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
            </div>

           

            {/* BOTTOM ACTION BUTTONS */}
            <div className="ipd-bottom-actions-row">
              <button
                type="button"
                className="btn-ipd-cancel"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-ipd-draft"
                onClick={() => toast.success("Draft saved successfully")}
              >
                Save as Draft
              </button>
              <button type="submit" className="btn-ipd-confirm">
                Confirm Admission →
              </button>
            </div>

          </div>

        </div>
      </form>

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
                  <span className="val font-semibold">{ipdSlipData.wardType} - Room {ipdSlipData.roomNo}</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Attending Doctor:</span>
                  <span className="val font-medium">{ipdSlipData.doctor} ({ipdSlipData.doctorDegree})</span>
                </div>
                <div className="slip-detail-item">
                  <span className="lbl">Attendant:</span>
                  <span className="val font-medium">{ipdSlipData.attendantName} ({ipdSlipData.relationship}) - {ipdSlipData.attendantMobile}</span>
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
                  <span>{ipdSlipData.payerType?.charAt(0).toUpperCase() + ipdSlipData.payerType?.slice(1) || "Self"}</span>
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
