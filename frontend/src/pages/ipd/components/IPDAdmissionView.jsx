import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import Icon from "../../../components/common/Icon.jsx";
import { mockStore } from "../../../mock/mockStore";
import patientService from "../../../api/services/patientService";
import ipdService from "../../../api/services/ipdService";
import doctorService from "../../../services/doctorService";
import axiosInstance from "../../../api/axiosInstance";
import "./IPDAdmissionView.css";

const POPULAR_IPD_COMPLAINTS = [
  "Fever / High Grade Pyrexia",
  "Breathing Difficulty / Dyspnea",
  "Severe Abdominal Pain",
  "Trauma / Fracture / Road Accident",
  "Chest Pain / Cardiac Observation",
  "High BP / Hypertensive Crisis",
  "Severe Vomiting & Dehydration",
  "Post-Operative Inpatient Care",
  "Diabetic Ketoacidosis / High Sugar",
  "Acute Gastroenteritis",
  "Pneumonia / Chest Infection",
  "Renal Colic / Kidney Stone",
  "Burn Injury & Dressing Care",
  "Neurological Deficit / Stroke",
  "General Weakness / Syncope"
];

const POPULAR_ADMISSION_REASONS = [
  "Inpatient Observation & Medical Management",
  "IV Antibiotics & Fluid Therapy",
  "Elective / Emergency Surgery & Post-Op Care",
  "ICU / Critical Care & Vital Monitoring",
  "Respiratory Distress & Nebulization Support",
  "Chest Pain / Cardiac Care & ECG Monitoring",
  "Severe Dehydration & Gastroenteritis Management",
  "Orthopedic Traction / Fracture Care",
  "Diabetic Ketoacidosis / Blood Sugar Stabilization",
  "Post-Operative Recovery & Nursing Care",
  "Pain Management & Palliative Care",
  "Pediatric High Grade Pyrexia / Observation",
];

const IPD_ADVANCE_SERVICES = [
  { name: "IPD Registration Fee", defaultAmount: 100 },
  { name: "Bed Advance Deposit (General Ward)", defaultAmount: 5000 },
  { name: "Bed Advance Deposit (ICU / Critical Care)", defaultAmount: 10000 },
  { name: "Bed Advance Deposit (Private Deluxe Room)", defaultAmount: 8000 },
  { name: "Nursing & Daily RMO Care Advance", defaultAmount: 1500 },
  { name: "Operation Theater (OT) Booking Advance", defaultAmount: 15000 },
  { name: "Diagnostic & Lab Investigation Deposit", defaultAmount: 2500 },
  { name: "Pharmacy & Medicine Deposit", defaultAmount: 3000 },
  { name: "Emergency Casualty / Triage Charge", defaultAmount: 500 },
  { name: "Oxygen / Respiratory Equipment Advance", defaultAmount: 1200 },
  { name: "Other Miscellaneous Inpatient Advance", defaultAmount: 0 },
];

export default function IPDAdmissionView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState([]);

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
  const [selectedReasons, setSelectedReasons] = useState(["Inpatient Observation & Medical Management"]);
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

  // ── Advance / Payment Details & Add-on Particulars ──
  const [advanceParticulars, setAdvanceParticulars] = useState([
    { id: 1, service: "IPD Registration Fee", amount: 100, isFixed: true },
    { id: 2, service: "Bed Advance Deposit (General Ward)", amount: 5000, isFixed: false },
  ]);

  const totalAdvance = advanceParticulars.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const registrationFee = advanceParticulars.find((p) => p.service.toLowerCase().includes("registration"))?.amount || 100;
  const bedAdvance = advanceParticulars.find((p) => p.service.toLowerCase().includes("bed"))?.amount || 0;
  const otherCharges = advanceParticulars
    .filter((p) => !p.service.toLowerCase().includes("registration") && !p.service.toLowerCase().includes("bed"))
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [amountReceived, setAmountReceived] = useState(5100);

  useEffect(() => {
    setAmountReceived(totalAdvance);
  }, [totalAdvance]);

  const handleAddParticularRow = () => {
    const newId = advanceParticulars.length > 0 ? Math.max(...advanceParticulars.map((p) => p.id)) + 1 : 1;
    setAdvanceParticulars((prev) => [
      ...prev,
      { id: newId, service: "Nursing & Daily RMO Care Advance", amount: 1500, isFixed: false },
    ]);
  };

  const handleRemoveParticularRow = (id) => {
    if (advanceParticulars.length <= 1) {
      toast.error("At least one fee particular is required");
      return;
    }
    setAdvanceParticulars((prev) => prev.filter((p) => p.id !== id));
  };

  const handleParticularChange = (id, field, value) => {
    setAdvanceParticulars((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === "service") {
            const matched = IPD_ADVANCE_SERVICES.find((s) => s.name === value);
            return {
              ...item,
              service: value,
              amount: matched ? matched.defaultAmount : item.amount,
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

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
          doctorService.getDepartments().catch(() => []),
          doctorService.getDoctors().catch(() => []),
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
          name: d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Doctor",
          departmentId: d.department_id || d.departmentId,
          specialization: d.specialization || d.department,
          qualifications: d.qualification || d.qualifications || "",
          registrationNo: d.registration_no || "",
          is_active: d.is_active !== undefined ? d.is_active : true,
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
      const docs = doctors.filter((d) => {
        const matchId = d.departmentId && department.id && String(d.departmentId) === String(department.id);
        const matchName = d.specialization && department.name && d.specialization.toLowerCase() === department.name.toLowerCase();
        return matchId || matchName;
      });
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

  const toggleAdmissionReason = (item) => {
    if (item === "Other" || item.includes("Other")) {
      setShowOtherReasonInput(true);
      return;
    }
    if (selectedReasons.includes(item)) {
      const updated = selectedReasons.filter((r) => r !== item);
      setSelectedReasons(updated);
      setReasonForAdmission(updated.join(", "));
    } else {
      const updated = [...selectedReasons, item];
      setSelectedReasons(updated);
      setReasonForAdmission(updated.join(", "));
    }
  };

  const removeAdmissionReason = (item) => {
    const updated = selectedReasons.filter((r) => r !== item);
    setSelectedReasons(updated);
    setReasonForAdmission(updated.join(", "));
  };

  const handleAddOtherReason = () => {
    const trimmed = otherReasonText.trim();
    if (trimmed) {
      if (!selectedReasons.includes(trimmed)) {
        const updated = [...selectedReasons, trimmed];
        setSelectedReasons(updated);
        setReasonForAdmission(updated.join(", "));
      }
      setOtherReasonText("");
      setShowOtherReasonInput(false);
    }
  };

  const handleResetForm = () => {
    setSelectedPatient(null);
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
    setSelectedReasons(["Inpatient Observation & Medical Management"]);
    setReasonForAdmission("Patient requires inpatient observation and treatment.");
    setWardType("General Ward");
    setRoomType("Multi Bed");
    setFloor("1st Floor");
    setRoomNo("101");
    setAttendantName("Raj Kumar");
    setRelationship("Brother");
    setAttendantMobile("9876500000");
    setAlternateMobile("9876500001");
    setAdvanceParticulars([
      { id: 1, service: "IPD Registration Fee", amount: 100, isFixed: true },
      { id: 2, service: "Bed Advance Deposit (General Ward)", amount: 5000, isFixed: false },
    ]);
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
      {/* ── TOP HEADER & BREADCRUMB (MATCHING OPD REGISTRATION) ── */}
      <div className="opd-page-header">
        <div className="opd-header-left">
          <div className="opd-header-icon">
            <Icon name="LuBedDouble" size={26} />
          </div>
          <div>
            <h1 className="opd-page-title">IPD Registration</h1>
           
           
          </div>
        </div>
      </div>

      <form onSubmit={handleConfirmAdmission} className="opd-form-flow">
        {/* ── 1. PATIENT SEARCH CARD ── */}
        <div ref={patientSearchRef} className="opd-search-card">
          <label className="opd-search-label">
            Search Patient (UHID / Mobile / Name) <span className="opd-hint">· मरीज खोजें</span>
          </label>
          <div className="opd-search-row">
            <div className="opd-search-input-wrapper">
              <Icon name="LuSearch" size={16} className="opd-search-icon" />
              <input
                type="text"
                className="opd-search-input"
                placeholder="Search by UHID / Mobile Number / Patient Name / नाम या मोबाइल से खोजें"
                value={patientSearchQuery}
                onChange={handlePatientSearchChange}
                onFocus={() => {
                  if (patientSearchQuery.trim()) setShowPatientDropdown(true);
                }}
              />
              {patientSearchQuery && (
                <button
                  type="button"
                  className="opd-search-clear-btn"
                  onClick={() => {
                    setPatientSearchQuery("");
                    setPatientSearchResults([]);
                    setShowPatientDropdown(false);
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

          {/* Autocomplete Dropdown List */}
          {showPatientDropdown && patientSearchResults.length > 0 && (
            <div className="opd-search-dropdown">
              {patientSearchResults.map((pt) => {
                const pName =
                  pt.full_name ||
                  pt.name ||
                  `${pt.first_name || pt.firstName || ""} ${pt.last_name || pt.lastName || ""}`.trim() ||
                  "Patient";
                const pPhone = pt.phone || pt.mobile1 || pt.mobile || "N/A";
                return (
                  <div
                    key={pt.uhid || pt.id}
                    className="opd-dropdown-item"
                    onClick={() => handleSelectOldPatient(pt)}
                  >
                    <div className="opd-dropdown-avatar">
                      {(pName || "P")[0].toUpperCase()}
                    </div>
                    <div className="opd-dropdown-info">
                      <div className="opd-dropdown-name">
                        {pName}
                        <span className="opd-dropdown-uhid-badge">{pt.uhid}</span>
                      </div>
                      <div className="opd-dropdown-sub">
                        📞 {pPhone} | {pt.age || pt.ageYrs || "?"} Yrs / {pt.gender || "—"} | 🩸 {pt.blood_group || pt.bloodGroup || "O+"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 2. PATIENT BANNER CARD (SELECTED / EMPTY) ── */}
        {selectedPatient && (selectedPatient.name || selectedPatient.uhid) ? (
          <div className="opd-patient-banner">
            <div className="opd-pb-left">
              <div className="opd-pb-avatar">
                <div className="opd-pb-avatar-fallback">
                  {(selectedPatient.name || "P")[0].toUpperCase()}
                </div>
              </div>

              <div className="opd-pb-info-grid">
                <div className="opd-pb-name-row">
                  <h2 className="opd-pb-name">{selectedPatient.name}</h2>
                  <span className="opd-badge-status">Registered</span>
                  <span className="opd-badge-blood">🩸 {selectedPatient.bloodGroup || "O+"}</span>
                </div>

                <div className="opd-pb-meta-grid">
                  <div className="opd-meta-item">
                    <span className="lbl">UHID :</span>
                    <span className="val bold font-mono text-blue-700">{selectedPatient.uhid || "—"}</span>
                  </div>
                  <div className="opd-meta-item">
                    <span className="lbl">Phone :</span>
                    <span className="val">{selectedPatient.phone || "—"}</span>
                  </div>
                  <div className="opd-meta-item">
                    <span className="lbl">Age / Gender :</span>
                    <span className="val bold">{selectedPatient.age || "—"} Yrs / {selectedPatient.gender || "—"}</span>
                  </div>
                  <div className="opd-meta-item">
                    <span className="lbl">Address :</span>
                    <span className="val">{selectedPatient.address || "—"}</span>
                  </div>
                  <div className="opd-meta-item">
                    <span className="lbl">Payer / Insurance :</span>
                    <span className="val">{selectedPatient.insurance || "Self Pay"}</span>
                  </div>
                </div>
              </div>
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

        {/* ── 3. SECTION: IPD ADMISSION DETAILS ── */}
        <div className="opd-card">
          <div className="opd-card-title">
            <Icon name="LuClipboardList" size={16} className="title-icon" />
            <span>IPD Admission Details <span className="opd-hint">· भर्ती एवं प्रवेश विवरण</span></span>
          </div>

          <div className="opd-form-grid opd-grid-4">
            <div>
              <label className="opd-label">
                Admission Type <span className="req">*</span> <span className="opd-hint">· भर्ती प्रकार</span>
              </label>
              <select
                className="opd-select font-semibold"
                value={admissionType}
                onChange={(e) => setAdmissionType(e.target.value)}
              >
                <option value="Emergency">Emergency (आपातकालीन)</option>
                <option value="Planned">Planned (नियोजित)</option>
                <option value="Referral">Referral (रेफरल)</option>
                <option value="Transfer">Transfer (स्थानांतरण)</option>
              </select>
            </div>

            <div>
              <label className="opd-label">
                Admission Date <span className="req">*</span> <span className="opd-hint">· भर्ती तिथि</span>
              </label>
              <input
                type="date"
                className="opd-input"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="opd-label">
                Admission Time <span className="req">*</span> <span className="opd-hint">· भर्ती समय</span>
              </label>
              <input
                type="time"
                className="opd-input cursor-pointer"
                value={admissionTime}
                onChange={(e) => setAdmissionTime(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="opd-label">
                Department <span className="req">*</span> <span className="opd-hint">· विभाग</span>
              </label>
              <select
                className="opd-select font-semibold"
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

            <div className="opd-col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="opd-label mb-0">
                  Doctor to Consult / Attending Doctor <span className="req">*</span> <span className="opd-hint">· चिकित्सक चुनें</span>
                </label>
                {selectedDoctor && (
                  <span className="opd-status-available">● Available</span>
                )}
              </div>
              <select
                className="opd-select font-semibold"
                value={selectedDoctor?.id || ""}
                onChange={(e) => {
                  const selected = doctors.find((d) => d.id === e.target.value);
                  setSelectedDoctor(selected || null);
                }}
              >
                <option value="">Select Doctor</option>
                {(department
                  ? doctors.filter((d) => {
                      const matchId = d.departmentId && department.id && String(d.departmentId) === String(department.id);
                      const matchName = d.specialization && department.name && d.specialization.toLowerCase() === department.name.toLowerCase();
                      return matchId || matchName;
                    })
                  : doctors
                ).map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} {doc.qualifications ? `(${doc.qualifications})` : ""} {doc.is_active === false ? "(On Leave)" : ""}
                  </option>
                ))}
              </select>
            </div>

           

            <div>
              <label className="opd-label">
                Expected Discharge <span className="opd-hint">· संभावित छुट्टी तिथि</span>
              </label>
              <input
                type="date"
                className="opd-input"
                value={expectedDischargeDate}
                onChange={(e) => setExpectedDischargeDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── 4. SECTION: CLINICAL & ADMISSION REASON ── */}
        <div className="opd-card">
          <div className="opd-card-title">
            <Icon name="LuStethoscope" size={16} className="title-icon" />
            <span>Clinical &amp; Admission Reason <span className="opd-hint">· परामर्श एवं नैदानिक विवरण</span></span>
          </div>

          <div className="opd-form-grid opd-grid-3">
            {/* Chief Complaints */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="opd-label mb-0">
                  Chief Complaint / Symptoms <span className="req">*</span> <span className="opd-hint">· मरीज की समस्या (Multiple Select)</span>
                </label>
                {selectedComplaints.length > 0 && (
                  <span className="opd-badge-count">{selectedComplaints.length} selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  className="opd-select flex-1"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    toggleComplaint(val);
                  }}
                  value=""
                >
                  <option value="">
                    {selectedComplaints.length === 0
                      ? "Select Chief Complaint / मुख्य लक्षण चुनें..."
                      : "+ Add more problem / और समस्या जोड़ें..."}
                  </option>
                  {POPULAR_IPD_COMPLAINTS.map((c) => (
                    <option key={c} value={c} disabled={selectedComplaints.includes(c)}>
                      {selectedComplaints.includes(c) ? `✓ ${c} (Added)` : c}
                    </option>
                  ))}
                  <option value="Other">+ Custom / अन्य समस्या...</option>
                </select>
                <button
                  type="button"
                  className="opd-btn-tag-action"
                  onClick={() => setShowOtherComplaintInput(true)}
                  title="Add Custom Symptom"
                >
                  + Custom
                </button>
              </div>

              {showOtherComplaintInput && (
                <div className="opd-custom-input-row mt-2">
                  <input
                    type="text"
                    className="opd-input flex-1"
                    placeholder="Type custom symptom / लक्षण लिखें..."
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
                  <button type="button" className="opd-btn-tag-save" onClick={handleAddOtherComplaint}>+ Add</button>
                  <button type="button" className="opd-btn-tag-cancel" onClick={() => { setShowOtherComplaintInput(false); setOtherComplaintText(""); }}>✕</button>
                </div>
              )}

              {selectedComplaints.length > 0 && (
                <div className="opd-tags-wrapper mt-2">
                  {selectedComplaints.map((c) => (
                    <span key={c} className="opd-tag">
                      {c}
                      <button type="button" onClick={() => removeComplaint(c)}>✕</button>
                    </span>
                  ))}
                  {selectedComplaints.length > 1 && (
                    <button type="button" className="opd-clear-all-link" onClick={() => setSelectedComplaints([])}>Clear All</button>
                  )}
                </div>
              )}
            </div>

            {/* Duration & Diagnosis */}
            <div>
              <label className="opd-label">
                Duration <span className="opd-hint">· लक्षण की अवधि</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  className="opd-input w-24"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <select
                  className="opd-select flex-1"
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value)}
                >
                  <option value="Days">Days (दिन)</option>
                  <option value="Hours">Hours (घंटे)</option>
                  <option value="Weeks">Weeks (सप्ताह)</option>
                </select>
              </div>
             
            </div>

           
          </div>
        </div>

        {/* ── 5. SECTION: BED & WARD ALLOCATION ── */}
        <div className="opd-card">
          <div className="opd-card-title">
            <Icon name="LuBed" size={16} className="title-icon" />
            <span>Bed &amp; Ward Allocation <span className="opd-hint">· वार्ड एवं बेड आवंटन</span></span>
          </div>

          <div className="opd-form-grid opd-grid-4">
            <div>
              <label className="opd-label">
                Ward Type <span className="req">*</span> <span className="opd-hint">· वार्ड का प्रकार</span>
              </label>
              <select
                className="opd-select font-semibold"
                value={wardType}
                onChange={(e) => setWardType(e.target.value)}
              >
                <option value="General Ward">General Ward</option>
                <option value="ICU">ICU (Intensive Care)</option>
                <option value="Private Room">Private Room</option>
                <option value="Semi-Private Room">Semi-Private Room</option>
              </select>
            </div>

            <div>
              <label className="opd-label">
                Room Type <span className="opd-hint">· कमरे का प्रकार</span>
              </label>
              <select
                className="opd-select"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
              >
                <option value="Multi Bed">Multi Bed Ward</option>
                <option value="Single Deluxe">Single Deluxe</option>
                <option value="Twin Sharing">Twin Sharing</option>
                <option value="Isolation">Isolation</option>
              </select>
            </div>

            <div>
              <label className="opd-label">
                Floor <span className="opd-hint">· मंजिल</span>
              </label>
              <select
                className="opd-select"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              >
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
              </select>
            </div>

            <div>
              <label className="opd-label">
                Selected Bed <span className="req">*</span> <span className="opd-hint">· चयनित बेड</span>
              </label>
              <div className="opd-selected-bed-box">
                <Icon name="LuBed" size={16} className="text-teal-700" />
                <span className="font-extrabold text-teal-900 text-[13px]">
                  {selectedBed || "Select Bed Below"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Bed Matrix Grid */}
          <div className="opd-bed-matrix-box mt-3">
            <div className="opd-bed-matrix-head">
              <span className="opd-bed-matrix-title">
                Interactive Bed Grid — <strong>{wardType}</strong>
              </span>
              <div className="opd-bed-legend">
                <span className="opd-legend-item"><span className="opd-dot-avail"></span> Available</span>
                <span className="opd-legend-item"><span className="opd-dot-occ"></span> Occupied</span>
                <span className="opd-legend-item"><span className="opd-dot-sel"></span> Selected</span>
              </div>
            </div>

            <div className="opd-bed-cards-grid">
              {(filteredBeds.length > 0 ? filteredBeds : availableBedsGrid).map((b) => {
                const normalizedStatus = normalizeBedStatus(b.status || b.current_status || "available");
                const isAvailable = normalizedStatus === "available";
                const isSelected = selectedBed === b.bedNo;

                return (
                  <div
                    key={b.id || b.bedNo}
                    className={`opd-bed-card ${isAvailable ? "avail" : "occ"} ${isSelected ? "sel" : ""}`}
                    onClick={() => {
                      if (isAvailable) setSelectedBed(b.bedNo);
                    }}
                  >
                    <div className="opd-bed-card-main">
                      <span className="opd-bed-icon">🛏️</span>
                      <div className="opd-bed-text">
                        <span className="opd-bed-no">{b.bedNo}</span>
                        <span className="opd-bed-room">{b.floor || "Ward Bed"}</span>
                      </div>
                    </div>
                    <span className="opd-bed-badge">
                      {isSelected ? "Selected ✓" : isAvailable ? "Available" : "Occupied"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

       

        {/* ── 7. SECTION: IPD REGISTRATION FEE & ADVANCE (MATCHING SCREENSHOT 2) ── */}
        <div className="opd-card">
          <div className="opd-card-title">
            <Icon name="LuCreditCard" size={16} className="title-icon" />
            <span>IPD Registration Fee &amp; Advance <span className="opd-hint">· शुल्क एवं अग्रिम भुगतान विवरण</span></span>
          </div>

          <div className="opd-fee-table-container">
            <table className="opd-fee-table">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>#</th>
                  <th style={{ width: "55%" }}>PARTICULAR / SERVICE</th>
                  <th style={{ width: "15%" }}>CHARGE</th>
                  <th style={{ width: "10%" }}>DAYS / QTY</th>
                  <th style={{ width: "15%" }}>AMOUNT</th>
                  <th style={{ width: "8%" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {advanceParticulars.map((row, index) => (
                  <tr key={row.id}>
                    <td className="opd-cell-hash">{String(index + 1).padStart(2, "0")}</td>
                    <td>
                      <select
                        className="opd-select font-semibold text-[13px]"
                        value={row.service}
                        onChange={(e) => handleParticularChange(row.id, "service", e.target.value)}
                      >
                        {IPD_ADVANCE_SERVICES.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name} {s.defaultAmount > 0 ? `(₹${s.defaultAmount})` : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="opd-charge-box">
                        <span className="opd-curr">₹</span>
                        <input
                          type="number"
                          min="0"
                          className="opd-charge-input"
                          value={row.amount}
                          onChange={(e) => handleParticularChange(row.id, "amount", Number(e.target.value))}
                        />
                      </div>
                    </td>
                    <td>
                      <select className="opd-select opd-select-qty">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="5">5</option>
                      </select>
                    </td>
                    <td className="opd-cell-amount font-bold">
                      ₹ {Number(row.amount || 0).toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="opd-btn-trash"
                        onClick={() => handleRemoveParticularRow(row.id)}
                        title="Remove charge item"
                        disabled={advanceParticulars.length <= 1}
                      >
                        <Icon name="LuTrash2" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="opd-fee-footer-row mt-3">
            <button
              type="button"
              className="opd-btn-add-row"
              onClick={handleAddParticularRow}
            >
              + Add Particular Row
            </button>

            <div className="opd-fee-summary-inputs">
              <div className="opd-mini-field">
                <label>Payment Mode</label>
                <select
                  className="opd-select opd-select-sm"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash (नकद)</option>
                  <option value="Card">Card (कार्ड)</option>
                  <option value="UPI">UPI (क्यूआर)</option>
                  <option value="Insurance">Insurance (बीमा)</option>
                </select>
              </div>

              <div className="opd-mini-field">
                <label>Payment Status</label>
                <select
                  className="opd-select opd-select-sm font-bold text-emerald-800"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="Paid">Paid (प्राप्त)</option>
                  <option value="Pending">Pending (लंबित)</option>
                  <option value="Partial">Partial (आंशिक)</option>
                </select>
              </div>

              <div className="opd-total-pill-badge">
                <span>TOTAL: <strong>₹ {totalAdvance.toFixed(2)}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 8. BOTTOM ACTION BAR (MATCHING SCREENSHOT 2) ── */}
        <div className="opd-bottom-actions-card">
          <div className="opd-bottom-total-badge">
            <span>TOTAL PAYABLE: <strong>₹ {totalAdvance.toFixed(0)}</strong> ({paymentMode} • {paymentStatus})</span>
          </div>

          <div className="opd-bottom-buttons">
            <button
              type="button"
              className="opd-btn-cancel-action"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
           
            {ipdSlipData && (
              <button
                type="button"
                className="opd-btn-print-action"
                onClick={() => setShowPrintModal(true)}
              >
                <Icon name="LuPrinter" size={15} /> Modify / Print
              </button>
            )}
            <button
              type="submit"
              className="opd-btn-submit-action"
            >
              <Icon name="LuCheckCircle" size={16} /> IPD Registration
            </button>
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
