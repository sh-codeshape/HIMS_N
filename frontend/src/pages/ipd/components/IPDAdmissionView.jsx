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
              <span className="ipd-titlebar-subtitle">Inpatient Registration & Bed Allocation · इंडोर मरीज भर्ती एवं बेड आवंटन</span>
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
                <span className="erp-banner-icon"><Icon name="LuSearch" size={14} /></span>
                <span>Search Patient / Old Record <span className="erp-hint">· पुराने मरीज की खोज</span></span>
              </div>
              <div className="erp-side-panel-body">
                <div className="erp-side-search-box">
                  <Icon name="LuSearch" size={18} className="text-slate-400" />
                  <input
                    type="text"
                    className="erp-side-search-input"
                    placeholder="Search by UHID / Mobile Number / Patient Name / नाम, UHID या फोन से खोजें..."
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

            {/* BOX 2: SELECTED PATIENT PROFILE (FETCHED FROM REGISTRATION) */}
            <div className="erp-side-panel erp-top-profile-panel">
              <div className="erp-side-panel-header">
                <span className="erp-banner-icon"><Icon name="LuUser" size={14} /></span>
                <span>Selected Patient Profile <span className="erp-hint">· चयनित मरीज का विवरण</span></span>
                {selectedPatient && (selectedPatient.uhid || selectedPatient.name) && (
                  <span className="erp-fetched-badge">
                    ✓ Fetched from Registration
                  </span>
                )}
              </div>
              <div className="erp-side-panel-body">
                {selectedPatient && (selectedPatient.name || selectedPatient.uhid) ? (
                  <div className="erp-patient-profile-card">
                    <div className="erp-patient-avatar">
                      {selectedPatient.name ? selectedPatient.name.charAt(0).toUpperCase() : "P"}
                    </div>
                    <div className="erp-patient-profile-info">
                      <h3 className="erp-profile-name">{selectedPatient.name}</h3>
                      <div className="erp-profile-tags">
                        <span className="erp-badge-uhid">UHID: {selectedPatient.uhid || "N/A"}</span>
                        <span className="erp-badge-blood">🩸 {selectedPatient.bloodGroup || "O+"}</span>
                        <span className="erp-badge-uhid">{selectedPatient.age || "—"} Yrs / {selectedPatient.gender || "—"}</span>
                        <span className="erp-badge-uhid">{selectedPatient.insurance || "Self Pay"}</span>
                      </div>
                      <div className="erp-profile-meta-list">
                        <div>
                          <span>📞 Phone:</span> <strong>{selectedPatient.phone || "—"}</strong>
                          <span className="ml-3">📍 Address:</span> <strong>{selectedPatient.address || "—"}</strong>
                        </div>
                        <div>
                          <span>⚠️ Allergies:</span> <strong className="text-amber-900">{selectedPatient.allergies || "No Known Allergies"}</strong>
                          <span className="ml-3">💍 Status:</span> <strong>{selectedPatient.maritalStatus || "Single"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="erp-patient-profile-empty">
                    <span className="empty-icon">🔍</span>
                    <div className="empty-msg-wrap">
                      <span className="empty-title">No Patient Selected Yet</span>
                      <span className="empty-sub">Search patient by UHID, Mobile Number, or Name to auto-load registration details.</span>
                    </div>
                  </div>
                )}
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
                  <span className="erp-banner-icon"><Icon name="LuClipboardList" size={14} /></span>
                  <span>Admission Specifications <span className="erp-hint">· भर्ती विवरण</span></span>
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

              {/* 2. CLINICAL & ADMISSION REASON (PREMIUM MULTI-SELECT) */}
              <div className="erp-section-panel erp-panel-clinical">
                <div className="erp-section-banner erp-banner-clinical">
                  <span className="erp-banner-icon"><Icon name="LuStethoscope" size={14} /></span>
                  <span>Clinical & Admission Reason <span className="erp-hint">· भर्ती का कारण</span></span>
                </div>
                <div className="erp-section-inner">
                  {/* Complaints Multi-Select Dropdown */}
                  <div className="erp-field-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="erp-label mb-0">
                        Chief Complaint / Symptoms <span className="erp-req">*</span>
                        <span className="text-[11.5px] text-slate-500 font-normal ml-1">
                          (Select multiple symptoms or add custom)
                        </span>
                      </label>
                      {selectedComplaints.length > 0 && (
                        <span className="erp-symptom-count-badge">
                          {selectedComplaints.length} selected
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <select
                        className="erp-select flex-1"
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
                            : "+ Add another symptom / अन्य लक्षण जोड़ें..."}
                        </option>
                        {POPULAR_IPD_COMPLAINTS.map((c) => (
                          <option
                            key={c}
                            value={c}
                            disabled={selectedComplaints.includes(c)}
                          >
                            {selectedComplaints.includes(c) ? `✓ ${c} (Added)` : c}
                          </option>
                        ))}
                        <option value="Other">+ Other / अन्य समस्या (Custom)...</option>
                      </select>
                      <button
                        type="button"
                        className="erp-btn-sm-action"
                        onClick={() => setShowOtherComplaintInput(true)}
                        title="Add Custom Symptom"
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
                      <div className="erp-tags-wrap mt-2 flex flex-wrap gap-1.5 items-center">
                        {selectedComplaints.map((c) => (
                          <span key={c} className="erp-tag-chip">
                            {c}
                            <button
                              type="button"
                              className="erp-tag-chip-remove"
                              onClick={() => removeComplaint(c)}
                              title={`Remove ${c}`}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        {selectedComplaints.length > 1 && (
                          <button
                            type="button"
                            className="text-xs text-slate-400 hover:text-red-600 underline font-semibold ml-1 cursor-pointer"
                            onClick={() => setSelectedComplaints([])}
                          >
                            Clear All
                          </button>
                        )}
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

                  

                   
                  </div>

                  {/* Reason for Admission Multi-Select & Clinical Notes */}
                  <div className="erp-field-group mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="erp-label mb-0">
                        Reason for Admission / Clinical Notes <span className="erp-req">*</span>
                        <span className="text-[11.5px] text-slate-500 font-normal ml-1">
                          (Select multiple reasons or add custom)
                        </span>
                      </label>
                      {selectedReasons.length > 0 && (
                        <span className="erp-symptom-count-badge">
                          {selectedReasons.length} selected
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      <select
                        className="erp-select flex-1"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          toggleAdmissionReason(val);
                        }}
                        value=""
                      >
                        <option value="">
                          {selectedReasons.length === 0
                            ? "Select Reason for Admission / भर्ती का मुख्य कारण चुनें..."
                            : "+ Add another reason / अन्य कारण जोड़ें..."}
                        </option>
                        {POPULAR_ADMISSION_REASONS.map((r) => (
                          <option
                            key={r}
                            value={r}
                            disabled={selectedReasons.includes(r)}
                          >
                            {selectedReasons.includes(r) ? `✓ ${r} (Added)` : r}
                          </option>
                        ))}
                        <option value="Other">+ Custom Reason / अन्य कारण (Custom)...</option>
                      </select>
                      <button
                        type="button"
                        className="erp-btn-sm-action"
                        onClick={() => setShowOtherReasonInput(true)}
                        title="Add Custom Reason"
                      >
                        + Custom
                      </button>
                    </div>

                    {/* Inline Other Reason Input */}
                    {showOtherReasonInput && (
                      <div className="mt-2 flex gap-2 items-center bg-sky-50 p-2 rounded-lg border border-sky-200">
                        <input
                          type="text"
                          className="erp-input flex-1"
                          placeholder="Type custom reason / अन्य कारण लिखें..."
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

                    {/* Active Reason Badges */}
                    {selectedReasons.length > 0 && (
                      <div className="erp-tags-wrap mt-2 flex flex-wrap gap-1.5 items-center">
                        {selectedReasons.map((r) => (
                          <span key={r} className="erp-tag-chip">
                            {r}
                            <button
                              type="button"
                              className="erp-tag-chip-remove"
                              onClick={() => removeAdmissionReason(r)}
                              title={`Remove ${r}`}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        {selectedReasons.length > 1 && (
                          <button
                            type="button"
                            className="text-xs text-slate-400 hover:text-red-600 underline font-semibold ml-1 cursor-pointer"
                            onClick={() => {
                              setSelectedReasons([]);
                              setReasonForAdmission("");
                            }}
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    )}

                    <div className="mt-2">
                      <label className="text-[11.5px] font-semibold text-slate-600 mb-1 block">
                        Detailed Clinical Notes / विस्तृत विवरण:
                      </label>
                      <textarea
                        className="erp-textarea"
                        rows={2}
                        placeholder="Patient requires inpatient observation, vital monitoring, and medical treatment..."
                        value={reasonForAdmission}
                        onChange={(e) => setReasonForAdmission(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="ipd-erp-right-col">
              {/* 4. BED / ROOM ALLOCATION (WITH AVAILABLE BEDS MATRIX) */}
              <div className="erp-section-panel">
                <div className="erp-section-banner">
                  <span className="erp-banner-icon"><Icon name="LuBed" size={14} /></span>
                  <span>Bed / Room Allocation & Ward Matrix <span className="erp-hint">· बेड आवंटन</span></span>
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

             
              {/* 6. ADMISSION FORM FEE & ADVANCE DETAIL (SELECTABLE & ADD-ON ENABLED) */}
              <div className="erp-side-panel">
                <div className="erp-side-panel-header">
                  <span className="erp-banner-icon"><Icon name="LuCreditCard" size={14} /></span>
                  <span>Admission Fee & Advance Detail <span className="erp-hint">· अग्रिम शुल्क</span></span>
                </div>
                <div className="erp-side-panel-body">
                  {/* Advance Particulars Table */}
                  <div className="erp-fee-table-wrap">
                    <table className="erp-fee-table">
                      <thead>
                        <tr>
                          <th className="col-hash">#</th>
                          <th className="col-particular">PARTICULAR / SERVICE CHARGE</th>
                          <th className="col-amount">AMOUNT (₹)</th>
                          <th className="col-action">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advanceParticulars.map((row, index) => (
                          <tr key={row.id}>
                            <td className="cell-hash">{String(index + 1).padStart(2, "0")}</td>
                            <td className="cell-particular">
                              <select
                                className="erp-select text-[12.5px] font-semibold"
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
                            <td className="cell-amount">
                              <div className="relative flex items-center">
                                <span className="absolute left-2.5 font-bold text-slate-500 text-xs pointer-events-none">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  className="erp-fee-amount-input"
                                  value={row.amount}
                                  onChange={(e) => handleParticularChange(row.id, "amount", Number(e.target.value))}
                                />
                              </div>
                            </td>
                            <td className="cell-action">
                              <button
                                type="button"
                                className="erp-btn-trash-fee"
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

                  {/* Add-on button */}
                  <div className="flex justify-between items-center mb-3">
                    <button
                      type="button"
                      className="erp-btn-add-fee-row"
                      onClick={handleAddParticularRow}
                    >
                      <Icon name="LuPlus" size={14} />
                      <span>+ Add Particular / Add-on Charge</span>
                    </button>
                  </div>

                  {/* Payment Details 3-Column Grid */}
                  <div className="erp-grid-3">
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
                        className="erp-input font-bold text-slate-900"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(Number(e.target.value))}
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

           
            </div>
          </div>

          {/* ── BOTTOM ACTION BUTTONS BAR ── */}
          <div className="ipd-erp-footer-actions">
            <div className="ipd-footer-summary-chip">
              <span className="chip-label">Total Advance:</span>
              <span className="chip-amount">₹ {totalAdvance.toFixed(2)}</span>
              <span className="chip-sub">({paymentMode} • {paymentStatus})</span>
            </div>

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
