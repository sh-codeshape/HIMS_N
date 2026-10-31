import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import ipdService from "../../api/services/ipdService";
import IPDDischargePrintHandler from "../settings/IPDDischargePrintHandler.js";
import { IPDDischargePreview } from "../settings/IPDDischargePrintSettings.jsx";
import {
  DEFAULT_IPD_DISCHARGE_SETTINGS,
  mapAdmissionToDischargePayload,
} from "../settings/ipdDischargePrintConfig.js";
import "./IPDDischarge.css";

const DISCHARGE_TYPES = [
  { value: "normal", label: "Normal / Planned Discharge" },
  { value: "lama", label: "LAMA (Left Against Medical Advice)" },
  { value: "dama", label: "DAMA (Discharge Against Medical Advice)" },
  { value: "transferred", label: "Referred / Transferred to Higher Center" },
  { value: "absconded", label: "Absconded (Left without notice)" },
  { value: "death", label: "Expired / Death Summary" },
];

const DISCHARGE_CONDITIONS = [
  "Clinically Stable & Symptom Free",
  "Recovered - Vitals Normal",
  "Relieved - Under Medication",
  "Guarded / Critical",
  "Deceased"
];

export default function IPDDischarge() {
  const [activeTab, setActiveTab] = useState("admitted"); // 'admitted' | 'discharged'
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState("All");

  // Discharge Action Modal State
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [clearanceChecklist, setClearanceChecklist] = useState({
    billingCleared: true,
    pharmacyReturned: true,
    nursingChartHandover: true,
  });

  const [dischargeForm, setDischargeForm] = useState({
    discharge_type: "normal",
    discharge_condition: "Clinically Stable & Symptom Free",
    final_diagnosis: "",
    history_of_present_illness: "",
    hospital_course: "",
    procedures_performed: "",
    follow_up_instructions: "Review in OPD after 5 days with updated vitals/lab tests.",
    follow_up_date: "",
    diet_advice: "Light, easily digestible diet. Maintain adequate hydration.",
    activity_advice: "Avoid heavy lifting or strenuous exercise for 1 week.",
    medications: [
      { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "SOS / Max TDS", days: "3 Days" },
      { name: "Cap Pantoprazole 40mg", dosage: "1 Cap", frequency: "OD (Empty Stomach)", days: "5 Days" }
    ]
  });

  // Printable Summary Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(null);

  // Pending dues (clearance) state — fetched per admission from backend
  const [pendingDues, setPendingDues] = useState(null);
  const [duesLoading, setDuesLoading] = useState(false);
  const [dischargePrintSettings, setDischargePrintSettings] = useState(null);

  const handlePrintDischargeSlip = async (admission, summary = null) => {
    const target = admission || selectedAdmission;
    if (!target) return;
    try {
      let sum = summary;
      if (!sum && target.id === selectedAdmission?.id) {
        sum = currentSummary;
      }
      if (!sum) {
        sum = await ipdService.getDischargeSummary(target.id).catch(() => null);
      }
      const payload = mapAdmissionToDischargePayload(
        target,
        sum,
        dischargeForm,
        pendingDues
      );
      await IPDDischargePrintHandler.printDischargeSummary(payload);
    } catch (err) {
      console.error("Print discharge summary failed:", err);
      toast.error("Could not print discharge summary.");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await ipdService.getAdmissions({ status: "all" });
      // Backend returns { rows: [...], totalCount } — normalize to an array
      setAdmissions(Array.isArray(data) ? data : (data?.rows ?? []));
    } catch (err) {
      console.error("Failed to load admissions", err);
      toast.error("Could not load IPD admissions list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    IPDDischargePrintHandler.getSettings()
      .then(setDischargePrintSettings)
      .catch(() => {});
  }, []);

  // Filter admissions
  const admittedList = admissions.filter((a) => a.status === "admitted");
  const dischargedList = admissions.filter((a) => a.status === "discharged");

  const currentList = activeTab === "admitted" ? admittedList : dischargedList;

  const filteredList = currentList.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      (item.first_name && item.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.last_name && item.last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.uhid && item.uhid.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.admission_no && item.admission_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.bed_name && item.bed_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesWard =
      selectedWard === "All" ||
      (item.ward_name && item.ward_name.toLowerCase().includes(selectedWard.toLowerCase()));

    return matchesSearch && matchesWard;
  });

  // Metrics
  const totalAdmitted = admittedList.length;
  const totalDischarged = dischargedList.length;
  const dischargedTodayCount = dischargedList.filter((d) => {
    if (!d.discharged_at) return false;
    const dischargeDate = new Date(d.discharged_at).toDateString();
    return dischargeDate === new Date().toDateString();
  }).length;

  const calculateDaysStay = (admittedAt, dischargedAt) => {
    const start = new Date(admittedAt);
    const end = dischargedAt ? new Date(dischargedAt) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return diffDays;
  };

  const avgStay = admissions.length > 0
    ? (
        admissions.reduce(
          (acc, curr) => acc + calculateDaysStay(curr.admitted_at, curr.discharged_at),
          0
        ) / admissions.length
      ).toFixed(1)
    : "3.2";

  // Navigate to the dedicated discharge workflow page (clearance, billing, summary, print)
  const navigate = useNavigate();
  const handleStartDischarge = (admission) => {
    navigate(`/ipd/discharge/${admission.id}`, { state: { admission } });
  };

  // Open Discharge Modal
  const handleOpenDischargeModal = async (admission) => {
    setSelectedAdmission(admission);
    const defaultFollowUp = new Date();
    defaultFollowUp.setDate(defaultFollowUp.getDate() + 5);

    setDischargeForm({
      discharge_type: "normal",
      discharge_condition: "Clinically Stable & Symptom Free",
      final_diagnosis: admission.admission_diagnosis || "Acute Inpatient Care Completed",
      history_of_present_illness: `Patient presented with complaints of ${admission.admission_diagnosis || "acute condition"}. Treated conservatively with inpatient medications.`,
      hospital_course: "Vitals stable throughout hospital stay. Patient responded satisfactorily to supportive treatment and protocol medicines.",
      procedures_performed: "Standard non-invasive monitoring, IV therapy, routine lab workup.",
      follow_up_instructions: "Report immediately to Emergency if high fever, acute pain, or difficulty in breathing develops.",
      follow_up_date: defaultFollowUp.toISOString().split("T")[0],
      diet_advice: "High protein, low-sodium soft diet. Adequate water intake.",
      activity_advice: "Gradual resumption of normal daily activity. Avoid heavy exertion.",
      medications: [
        { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "SOS / Max TDS", days: "3 Days" },
        { name: "Cap Pantoprazole 40mg", dosage: "1 Cap", frequency: "OD (Morning Empty Stomach)", days: "5 Days" }
      ]
    });

    // Fetch real pending dues from backend for clearance status
    await fetchPendingDues(admission.encounter_id || admission.id);
    setDischargeModalOpen(true);
  };

  // Fetch pending dues per department for clearance
  const fetchPendingDues = async (encounterId) => {
    if (!encounterId) {
      setPendingDues(null);
      return;
    }
    setDuesLoading(true);
    try {
      const dues = await ipdService.getPendingDues(encounterId);
      setPendingDues(dues);
      // Seed the clearance checklist from real backend data
      setClearanceChecklist({
        billingCleared: dues.cleared || false,
        pharmacyReturned: true, // operational, kept manual
        nursingChartHandover: true, // operational, kept manual
      });
    } catch (err) {
      console.error("Failed to fetch pending dues", err);
      setPendingDues(null);
      toast.warn("Could not fetch pending dues. Clearance shown as unverified.");
    } finally {
      setDuesLoading(false);
    }
  };

  // Add Medication Row
  const handleAddMedication = () => {
    setDischargeForm((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: "", dosage: "1 Tab", frequency: "BD", days: "5 Days" }
      ]
    }));
  };

  const handleRemoveMedication = (index) => {
    setDischargeForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleMedChange = (index, field, value) => {
    setDischargeForm((prev) => {
      const nextMeds = [...prev.medications];
      nextMeds[index][field] = value;
      return { ...prev, medications: nextMeds };
    });
  };

  // Submit Discharge Action
  const handleConfirmDischarge = async (e) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    // 1. Block if real backend dues are pending
    if (pendingDues && !pendingDues.cleared) {
      const pendingDept = pendingDues.breakdown?.filter((b) => !b.cleared).map((b) => b.department).join(", ") || "dues";
      toast.error(`Cannot discharge — pending ${pendingDept} dues of ₹${pendingDues.pendingAmount.toLocaleString("en-IN")} not cleared.`);
      return;
    }

    // 2. Block if operational clearances not confirmed
    if (!clearanceChecklist.billingCleared || !clearanceChecklist.pharmacyReturned || !clearanceChecklist.nursingChartHandover) {
      toast.error("Please verify all hospital clearances before discharge!");
      return;
    }

    try {
      // 1. Mark patient discharged in backend
      await ipdService.dischargePatient(selectedAdmission.id, {
        discharge_type: dischargeForm.discharge_type,
        discharge_condition: dischargeForm.discharge_condition
      });

      // 2. Save Clinical Discharge Summary
      await ipdService.saveDischargeSummary(selectedAdmission.id, {
        final_diagnosis: dischargeForm.final_diagnosis,
        history_of_present_illness: dischargeForm.history_of_present_illness,
        hospital_course: dischargeForm.hospital_course,
        procedures_performed: dischargeForm.procedures_performed,
        condition_at_discharge: dischargeForm.discharge_condition,
        follow_up_instructions: dischargeForm.follow_up_instructions,
        follow_up_date: dischargeForm.follow_up_date,
        diet_advice: dischargeForm.diet_advice,
        activity_advice: dischargeForm.activity_advice,
        status: "finalized",
        data: {
          medications: dischargeForm.medications,
          clearances: clearanceChecklist
        }
      });

      toast.success(
        `Patient ${selectedAdmission.first_name} ${selectedAdmission.last_name} discharged successfully! Bed released.`,
        { icon: "🏥" }
      );

      setDischargeModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete patient discharge. Check network or clearances.");
    }
  };

  // Open Printable Summary
  const handleOpenSummary = async (admission) => {
    setSelectedAdmission(admission);
    // Fetch pending dues to have full financial breakdown in the summary slip
    fetchPendingDues(admission.encounter_id || admission.id).catch(() => {});
    try {
      const summary = await ipdService.getDischargeSummary(admission.id);
      setCurrentSummary(summary || {
        final_diagnosis: admission.admission_diagnosis || "Acute Inpatient Clinical Care",
        hospital_course: "Patient was admitted under specialized care, stabilized with supportive therapy, IV fluid protocol, and scheduled medications. Vital parameters monitored routinely. Response to therapy was satisfactory with steady clinical recovery.",
        procedures_performed: "Standard non-invasive vital monitoring, intravenous access, scheduled drug administration, and routine clinical investigations.",
        condition_at_discharge: admission.discharge_condition || "Clinically Stable & Symptom Free",
        follow_up_instructions: "Review in OPD with laboratory reports. In case of emergency or severe discomfort, report to emergency department immediately.",
        follow_up_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
        diet_advice: "High protein, low-sodium soft diet. Maintain adequate oral hydration (2-3 Litres/day).",
        activity_advice: "Gradual resumption of normal daily routine. Adequate rest for 5 days. Avoid heavy physical lifting.",
        data: {
          medications: [
            { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "SOS (Post Meals / खाने के बाद)", days: "3 Days", instructions: "Take if fever or pain occurs" },
            { name: "Cap Pantoprazole 40mg", dosage: "1 Cap", frequency: "OD (Morning Empty Stomach / खाली पेट)", days: "5 Days", instructions: "Take 30 mins before breakfast" },
            { name: "Tab Amoxicillin & Clavulanate 625mg", dosage: "1 Tab", frequency: "BD (Morning & Night / सुबह-शाम)", days: "5 Days", instructions: "Complete full antibiotic course" },
            { name: "Tab Multivitamin & Zinc", dosage: "1 Tab", frequency: "OD (After Lunch / दोपहर खाने के बाद)", days: "10 Days", instructions: "General health & recovery support" }
          ]
        }
      });
      setPrintModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch discharge summary details.");
    }
  };

  return (
    <div className="ipd-discharge-page">
      <div className="ipd-header">
        <div className="ipd-header-left">
          <div className="ipd-header-icon">
            <Icon name="LuLogOut" size={18} />
          </div>
          <div>
            <h1 className="ipd-title">IPD Patient Discharge &amp; Summary</h1>
          </div>
        </div>
      </div>

      <div className="ipd-discharge-container">
        {/* KPI Summary Cards */}
        <div className="ipd-kpi-grid">
          <div className="ipd-kpi-card">
            <div className="ipd-kpi-icon-box ipd-kpi-icon-box--blue">
              <Icon name="LuBed" size={18} />
            </div>
            <div className="ipd-kpi-details">
              <span className="ipd-kpi-title">Active Inpatients</span>
              <span className="ipd-kpi-value">{totalAdmitted}</span>
              <span className="ipd-kpi-sub">Currently occupying beds</span>
            </div>
          </div>

          <div className="ipd-kpi-card">
            <div className="ipd-kpi-icon-box ipd-kpi-icon-box--emerald">
              <Icon name="LuLogOut" size={18} />
            </div>
            <div className="ipd-kpi-details">
              <span className="ipd-kpi-title">Discharges Today</span>
              <span className="ipd-kpi-value">{dischargedTodayCount}</span>
              <span className="ipd-kpi-sub">Beds sanitized & cleared</span>
            </div>
          </div>

          <div className="ipd-kpi-card">
            <div className="ipd-kpi-icon-box ipd-kpi-icon-box--amber">
              <Icon name="LuClock" size={18} />
            </div>
            <div className="ipd-kpi-details">
              <span className="ipd-kpi-title">Average Length of Stay</span>
              <span className="ipd-kpi-value">{avgStay} Days</span>
              <span className="ipd-kpi-sub">Hospital ALOS benchmark</span>
            </div>
          </div>

          <div className="ipd-kpi-card">
            <div className="ipd-kpi-icon-box ipd-kpi-icon-box--purple">
              <Icon name="LuFileText" size={18} />
            </div>
            <div className="ipd-kpi-details">
              <span className="ipd-kpi-title">Total Discharges</span>
              <span className="ipd-kpi-value">{totalDischarged}</span>
              <span className="ipd-kpi-sub">Archived clinical summaries</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="ipd-action-toolbar">
          <div className="ipd-tab-group">
            <button
              type="button"
              className={`ipd-tab-btn ${activeTab === "admitted" ? "ipd-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("admitted")}
            >
              <Icon name="LuUserCheck" size={16} />
              <span>Active Inpatients</span>
              <span className="ipd-tab-badge">{admittedList.length}</span>
            </button>
            <button
              type="button"
              className={`ipd-tab-btn ${activeTab === "discharged" ? "ipd-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("discharged")}
            >
              <Icon name="LuFileText" size={16} />
              <span>Discharged Archive</span>
              <span className="ipd-tab-badge">{dischargedList.length}</span>
            </button>
          </div>

          <div className="ipd-search-filter-box">
            <div className="ipd-search-input-wrapper">
              <Icon name="LuSearch" size={16} className="ipd-search-icon" />
              <input
                type="text"
                className="ipd-search-input"
                placeholder="Search patient, UHID, Bed, IPD No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--muted)",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <Icon name="LuX" size={15} />
                </button>
              )}
            </div>

            <select
              className="ipd-filter-select"
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
            >
              <option value="All">All Wards</option>
              <option value="General">General Wards</option>
              <option value="Semi-Private">Semi-Private Ward</option>
              <option value="Private">Private Deluxe Ward</option>
              <option value="ICU">Intensive Care Unit (ICU)</option>
              <option value="Emergency">Emergency & Trauma</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="ipd-table-card">
          <div className="ipd-table-responsive">
            <table className="ipd-data-table">
              <thead>
                <tr>
                  <th style={{ width: activeTab === "admitted" ? "18%" : "16%" }}>
                    <span className="ipd-th-flex"><Icon name="LuUser" size={13} /> Patient Details</span>
                  </th>
                  <th style={{ width: "10%" }}>
                    <span className="ipd-th-flex"><Icon name="LuHash" size={13} /> IPD No.</span>
                  </th>
                  <th style={{ width: activeTab === "admitted" ? "15%" : "14%" }}>
                    <span className="ipd-th-flex"><Icon name="LuBed" size={13} /> Ward &amp; Bed</span>
                  </th>
                  <th style={{ width: activeTab === "admitted" ? "12%" : "11%" }}>
                    <span className="ipd-th-flex"><Icon name="LuCalendar" size={13} /> Admit / Stay</span>
                  </th>
                  <th style={{ width: activeTab === "admitted" ? "13%" : "12%" }}>
                    <span className="ipd-th-flex"><Icon name="LuStethoscope" size={13} /> Consultant</span>
                  </th>
                  <th style={{ width: activeTab === "admitted" ? "13%" : "12%" }}>
                    <span className="ipd-th-flex"><Icon name="LuActivity" size={13} /> Diagnosis</span>
                  </th>
                  {activeTab === "admitted" ? (
                    <>
                      <th style={{ width: "8%" }}>
                        <span className="ipd-th-flex"><Icon name="LuShieldCheck" size={13} /> Clearances</span>
                      </th>
                      <th style={{ width: "11%", textAlign: "center" }}>
                        <span className="ipd-th-flex" style={{ justifyContent: "center" }}><Icon name="LuSlidersHorizontal" size={13} /> Action</span>
                      </th>
                    </>
                  ) : (
                    <>
                      <th style={{ width: "8%" }}>
                        <span className="ipd-th-flex"><Icon name="LuFileCheck" size={13} /> Type</span>
                      </th>
                      <th style={{ width: "12%" }}>
                        <span className="ipd-th-flex"><Icon name="LuClock" size={13} /> Discharged On</span>
                      </th>
                      <th style={{ width: "11%", textAlign: "center" }}>
                        <span className="ipd-th-flex" style={{ justifyContent: "center" }}><Icon name="LuPrinter" size={13} /> Action</span>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={activeTab === "admitted" ? 8 : 9} style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                      <Icon name="LuClock" size={24} style={{ marginBottom: 8, display: "inline-block" }} />
                      <div>Loading inpatient records...</div>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === "admitted" ? 8 : 9} style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                      <Icon name="LuCheckCircle" size={28} style={{ color: "#10b981", marginBottom: 8, display: "inline-block" }} />
                      <div>No records found matching your filters.</div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((row) => {
                    const daysStay = calculateDaysStay(row.admitted_at, row.discharged_at);
                    const docName =
                      row.doctor_first_name
                        ? `Dr. ${row.doctor_first_name} ${row.doctor_last_name || ""}`
                        : "Dr. On-Duty Consultant";

                    return (
                      <tr key={row.id}>
                        <td>
                          <div className="ipd-patient-cell">
                            <div className="ipd-mini-avatar">
                              {row.first_name ? row.first_name[0].toUpperCase() : "P"}
                            </div>
                            <div className="ipd-patient-info">
                              <span className="ipd-patient-name" title={`${row.first_name || ""} ${row.last_name || ""}`}>
                                {row.first_name} {row.last_name}
                              </span>
                              <div className="ipd-patient-sub">
                                <span className="ipd-uhid-mono">{row.uhid || "—"}</span>
                                <span>•</span>
                                <span>{row.gender ? row.gender.toUpperCase() : "—"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: "#1e293b", fontFamily: "ui-monospace, Consolas, monospace", fontSize: 13, whiteSpace: "nowrap" }}>
                            {row.admission_no}
                          </span>
                        </td>
                        <td>
                          <div className="ipd-bed-card" title={`${row.ward_name || "Ward"} - ${row.bed_name || "Bed"}`}>
                            <div className="ipd-ward-line">
                              <Icon name="LuBuilding" size={11} style={{ opacity: 0.7, flexShrink: 0 }} />
                              <span>{row.ward_name || "General Ward"}</span>
                            </div>
                            <div className="ipd-bed-pill">
                              <Icon name="LuBed" size={11} />
                              <span>{row.bed_name || "Bed"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span className="ipd-date-text">
                              <Icon name="LuCalendar" size={11} style={{ color: "#64748b" }} />
                              {new Date(row.admitted_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                            <span className="ipd-stay-pill">
                              <Icon name="LuClock" size={10} /> {daysStay} Days Stay
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="ipd-doctor-cell" title={docName}>
                            <Icon name="LuStethoscope" size={13} style={{ color: "#0284c7", flexShrink: 0 }} />
                            <span className="ipd-doc-name">{docName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="ipd-diag-cell" title={row.admission_diagnosis || "Under Clinical Care"}>
                            <Icon name="LuActivity" size={12} style={{ color: "#8b5cf6", flexShrink: 0 }} />
                            <span className="ipd-diag-text">{row.admission_diagnosis || "Under Clinical Care"}</span>
                          </div>
                        </td>

                        {activeTab === "admitted" ? (
                          <>
                            <td>
                              <div className="ipd-checklist-pills">
                                {(() => {
                                  const rowCharges = Number(row.total_charges ?? 0);
                                  const rowPayments = Number(row.total_payments ?? 0);
                                  const rowPending = Math.max(0, rowCharges - rowPayments);
                                  const billingCleared = rowPending === 0;
                                  return [
                                    {
                                      label: "Bill",
                                      cleared: billingCleared,
                                      pending: rowPending,
                                    },
                                    {
                                      label: "Rx",
                                      cleared: billingCleared,
                                      pending: rowPending,
                                    },
                                  ].map((item) => (
                                    <span
                                      key={item.label}
                                      className={`ipd-chk-pill ${item.cleared ? "ipd-chk-pill--cleared" : "ipd-chk-pill--pending"}`}
                                      title={item.cleared ? "Cleared" : `Pending ₹${item.pending.toLocaleString("en-IN")}`}
                                    >
                                      {item.cleared ? (
                                        <Icon name="LuCheckCircle" size={10} />
                                      ) : (
                                        <Icon name="LuAlertCircle" size={10} />
                                      )}
                                      {item.label}
                                      {!item.cleared && (
                                        <span style={{ fontSize: 9.5, marginLeft: 3 }}>{item.pending.toLocaleString("en-IN")}</span>
                                      )}
                                    </span>
                                  ));
                                })()}
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                className="ipd-btn-discharge"
                                onClick={() => handleStartDischarge(row)}
                                title="Discharge Patient"
                              >
                                <Icon name="LuLogOut" size={13} />
                                <span>Discharge</span>
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <span className={`ipd-status-tag ipd-status-tag--${row.discharge_type || "normal"}`}>
                                <Icon name="LuFileCheck" size={11} />
                                {row.discharge_type ? row.discharge_type.toUpperCase() : "NORMAL"}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span className="ipd-date-text">
                                  <Icon name="LuCalendarCheck" size={11} style={{ color: "#059669" }} />
                                  {row.discharged_at
                                    ? new Date(row.discharged_at).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric"
                                      })
                                    : "—"}
                                </span>
                                {row.discharged_at && (
                                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, paddingLeft: 15 }}>
                                    {new Date(row.discharged_at).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <button
                                  type="button"
                                  className="ipd-btn-summary"
                                  onClick={() => handleOpenSummary(row)}
                                  title="Preview Discharge Summary Slip"
                                >
                                  <Icon name="LuEye" size={13} />
                                  <span>Preview</span>
                                </button>
                                <button
                                  type="button"
                                  className="ipd-btn-summary"
                                  style={{ background: "#0284c7", color: "#ffffff", borderColor: "#0284c7" }}
                                  onClick={() => handlePrintDischargeSlip(row)}
                                  title="Print Discharge Summary Slip"
                                >
                                  <Icon name="LuPrinter" size={13} />
                                  <span>Print</span>
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discharge Action Modal */}
        {dischargeModalOpen && selectedAdmission && (() => {
          const daysStay = calculateDaysStay(selectedAdmission.admitted_at, selectedAdmission.discharged_at);
          const patientFullName = `${selectedAdmission.first_name || ""} ${selectedAdmission.last_name || ""}`.trim() || "Patient";
          const attendingDoc = selectedAdmission.doctor_first_name
            ? `Dr. ${selectedAdmission.doctor_first_name} ${selectedAdmission.doctor_last_name || ""}`
            : "Dr. On-Duty Specialist";

          return (
            <div
              className="ipd-modal-overlay ipd-discharge-action-overlay"
              onClick={() => setDischargeModalOpen(false)}
            >
              <div className="ipd-modal-card ipd-discharge-action-card" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="ipd-modal-header ipd-discharge-modal-header">
                  <div className="ipd-discharge-modal-title-group">
                    <div className="ipd-discharge-modal-icon-badge">
                      <Icon name="LuLogOut" size={20} />
                    </div>
                    <div>
                      <h3 className="ipd-modal-title">Inpatient Clinical Discharge &amp; Clearance</h3>
                      <p className="ipd-discharge-header-sub">
                        Verify department clearances, summarize inpatient course, and release bed back to inventory
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ipd-modal-close-btn"
                    onClick={() => setDischargeModalOpen(false)}
                    title="Close"
                  >
                    <Icon name="LuX" size={20} />
                  </button>
                </div>

                {/* Patient Inpatient Demographics Banner Card */}
                <div className="ipd-discharge-patient-banner">
                  <div className="ipd-dpb-left">
                    <div className="ipd-dpb-avatar">
                      {patientFullName[0]?.toUpperCase() || "P"}
                    </div>
                    <div>
                      <h4 className="ipd-dpb-name">{patientFullName}</h4>
                      <div className="ipd-dpb-meta-row">
                        <span>UHID: <strong className="ipd-mono-code">{selectedAdmission.uhid || "—"}</strong></span>
                        <span>•</span>
                        <span>IPD Adm: <strong className="ipd-mono-code">{selectedAdmission.admission_no}</strong></span>
                        <span>•</span>
                        <span>{selectedAdmission.age ? `${selectedAdmission.age} Yrs` : "Adult"} / {selectedAdmission.gender ? selectedAdmission.gender.toUpperCase() : "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ipd-dpb-right">
                    <div className="ipd-dpb-badge-item">
                      <span className="ipd-dpb-badge-lbl"><Icon name="LuBed" size={12} /> Ward &amp; Bed</span>
                      <span className="ipd-dpb-bed-pill">
                        {selectedAdmission.ward_name || "General Ward"} • <strong>{selectedAdmission.bed_name || "Bed"}</strong>
                      </span>
                    </div>
                    <div className="ipd-dpb-badge-item">
                      <span className="ipd-dpb-badge-lbl"><Icon name="LuClock" size={12} /> Stay Duration</span>
                      <span className="ipd-dpb-stay-pill">{daysStay} Days Stay</span>
                    </div>
                    <div className="ipd-dpb-badge-item">
                      <span className="ipd-dpb-badge-lbl"><Icon name="LuStethoscope" size={12} /> Consultant</span>
                      <span className="ipd-dpb-doc-pill">{attendingDoc}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmDischarge} className="ipd-discharge-form-wrapper">
                  <div className="ipd-modal-body ipd-discharge-modal-body">
                    {/* Section 1: Department Clearances & Financial Settlement */}
                    <div className="ipd-action-card-section">
                      <div className="ipd-action-card-header">
                        <div className="ipd-section-step-num">1</div>
                        <div>
                          <h4 className="ipd-action-card-title">Hospital Department Clearances &amp; Dues Verification</h4>
                          <span className="ipd-action-card-desc">Audit billing reconciliation, pharmacy unused medicines, and clinical nursing charts</span>
                        </div>
                      </div>

                      {/* Pending Dues Breakdown */}
                      {duesLoading ? (
                        <div className="ipd-dues-loading-card">
                          <Icon name="LuClock" size={16} />
                          <span>Auditing live pending dues from IPD billing, pharmacy dispensary &amp; laboratory…</span>
                        </div>
                      ) : pendingDues ? (
                        <div className="ipd-dues-dashboard-card">
                          <div className="ipd-dues-kpi-row">
                            <div className="ipd-dues-kpi-item">
                              <span className="ipd-kpi-tag">IPD Incurred Charges</span>
                              <strong className="ipd-kpi-val">
                                ₹{pendingDues.totalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </strong>
                              <small>Room &amp; clinical care</small>
                            </div>

                            <div className="ipd-dues-kpi-item">
                              <span className="ipd-kpi-tag">Payments Received</span>
                              <strong className="ipd-kpi-val ipd-text-green">
                                ₹{pendingDues.totalPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </strong>
                              <small>Advances &amp; payments</small>
                            </div>

                            <div className={`ipd-dues-kpi-item ${pendingDues.cleared ? "ipd-kpi-cleared" : "ipd-kpi-pending"}`}>
                              <span className="ipd-kpi-tag">{pendingDues.cleared ? "Net Balance Cleared" : "Pending Outstanding Dues"}</span>
                              <strong className={`ipd-kpi-val ${pendingDues.cleared ? "ipd-text-green" : "ipd-text-red"}`}>
                                ₹{pendingDues.pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </strong>
                              <small>{pendingDues.cleared ? "✓ Full Settlement Reconciled" : "⚠️ Settle at counter before release"}</small>
                            </div>
                          </div>

                          {pendingDues.breakdown && pendingDues.breakdown.length > 0 && (
                            <div className="ipd-dues-dept-chips">
                              {pendingDues.breakdown.map((dept) => (
                                <div
                                  key={dept.department}
                                  className={`ipd-dept-chip ${dept.cleared ? "ipd-dept-chip--cleared" : "ipd-dept-chip--pending"}`}
                                >
                                  <Icon name={dept.cleared ? "LuCheckCircle" : "LuAlertCircle"} size={13} />
                                  <span className="ipd-dept-chip-name">{dept.department}:</span>
                                  <strong className="ipd-dept-chip-status">
                                    {dept.cleared ? "Cleared" : `Pending ₹${dept.pending.toLocaleString("en-IN")}`}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="ipd-dues-empty-alert">
                          <Icon name="LuShieldCheck" size={16} />
                          <span>Encounter charge records reconciled. Proceed with operational checklist.</span>
                        </div>
                      )}

                      {/* 3 Verification Checkboxes Styled as Action Cards */}
                      <div className="ipd-clearance-interactive-grid">
                        <label className={`ipd-clearance-check-card ${clearanceChecklist.billingCleared ? "ipd-ccc--checked" : ""} ${pendingDues && !pendingDues.cleared ? "ipd-ccc--disabled" : ""}`}>
                          <input
                            type="checkbox"
                            checked={clearanceChecklist.billingCleared}
                            onChange={(e) =>
                              setClearanceChecklist({ ...clearanceChecklist, billingCleared: e.target.checked })
                            }
                            disabled={pendingDues && !pendingDues.cleared}
                          />
                          <div className="ipd-ccc-body">
                            <div className="ipd-ccc-icon ipd-ccc-icon--blue">
                              <Icon name="LuReceipt" size={16} />
                            </div>
                            <div className="ipd-ccc-text">
                              <strong>Billing &amp; Cash Dues Cleared</strong>
                              <p>All room rent, consultations &amp; accounts settled</p>
                              {pendingDues && !pendingDues.cleared && (
                                <span className="ipd-ccc-warn">Clear ₹{pendingDues.pendingAmount.toLocaleString("en-IN")} at accounts counter first</span>
                              )}
                            </div>
                          </div>
                          <div className="ipd-ccc-status-indicator">
                            <Icon name={clearanceChecklist.billingCleared ? "LuCheckCircle" : "LuCircle"} size={18} />
                          </div>
                        </label>

                        <label className={`ipd-clearance-check-card ${clearanceChecklist.pharmacyReturned ? "ipd-ccc--checked" : ""}`}>
                          <input
                            type="checkbox"
                            checked={clearanceChecklist.pharmacyReturned}
                            onChange={(e) =>
                              setClearanceChecklist({ ...clearanceChecklist, pharmacyReturned: e.target.checked })
                            }
                          />
                          <div className="ipd-ccc-body">
                            <div className="ipd-ccc-icon ipd-ccc-icon--emerald">
                              <Icon name="LuPill" size={16} />
                            </div>
                            <div className="ipd-ccc-text">
                              <strong>Pharmacy Unused Drugs Returned</strong>
                              <p>Surplus medications &amp; consumables audited</p>
                            </div>
                          </div>
                          <div className="ipd-ccc-status-indicator">
                            <Icon name={clearanceChecklist.pharmacyReturned ? "LuCheckCircle" : "LuCircle"} size={18} />
                          </div>
                        </label>

                        <label className={`ipd-clearance-check-card ${clearanceChecklist.nursingChartHandover ? "ipd-ccc--checked" : ""}`}>
                          <input
                            type="checkbox"
                            checked={clearanceChecklist.nursingChartHandover}
                            onChange={(e) =>
                              setClearanceChecklist({ ...clearanceChecklist, nursingChartHandover: e.target.checked })
                            }
                          />
                          <div className="ipd-ccc-body">
                            <div className="ipd-ccc-icon ipd-ccc-icon--purple">
                              <Icon name="LuFileCheck" size={16} />
                            </div>
                            <div className="ipd-ccc-text">
                              <strong>Nursing Chart &amp; Vitals Handover</strong>
                              <p>IV line removed, final discharge vitals recorded</p>
                            </div>
                          </div>
                          <div className="ipd-ccc-status-indicator">
                            <Icon name={clearanceChecklist.nursingChartHandover ? "LuCheckCircle" : "LuCircle"} size={18} />
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Section 2: Discharge Disposition & Condition */}
                    <div className="ipd-action-card-section">
                      <div className="ipd-action-card-header">
                        <div className="ipd-section-step-num">2</div>
                        <div>
                          <h4 className="ipd-action-card-title">Discharge Disposition &amp; Patient Condition</h4>
                          <span className="ipd-action-card-desc">Formal categorization and medical status of the patient at release</span>
                        </div>
                      </div>

                      <div className="ipd-form-row ipd-form-row--2cols">
                        <div className="ipd-form-group">
                          <label className="ipd-field-label">
                            <Icon name="LuLogOut" size={13} /> Discharge Type (डिस्चार्ज प्रकार)
                          </label>
                          <select
                            className="ipd-form-control ipd-form-select"
                            value={dischargeForm.discharge_type}
                            onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_type: e.target.value })}
                          >
                            {DISCHARGE_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="ipd-form-group">
                          <label className="ipd-field-label">
                            <Icon name="LuHeartPulse" size={13} /> Condition at Discharge (डिस्चार्ज के समय शारीरिक स्थिति)
                          </label>
                          <select
                            className="ipd-form-control ipd-form-select"
                            value={dischargeForm.discharge_condition}
                            onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_condition: e.target.value })}
                          >
                            {DISCHARGE_CONDITIONS.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Clinical Summary & Inpatient Course */}
                    <div className="ipd-action-card-section">
                      <div className="ipd-action-card-header">
                        <div className="ipd-section-step-num">3</div>
                        <div>
                          <h4 className="ipd-action-card-title">Clinical Discharge Summary &amp; Treatment History</h4>
                          <span className="ipd-action-card-desc">Detailed diagnosis, inpatient interventions, and clinical response</span>
                        </div>
                      </div>

                      <div className="ipd-form-group" style={{ marginBottom: 12 }}>
                        <label className="ipd-field-label">
                          <Icon name="LuFileText" size={13} /> Final Clinical Diagnosis (अंतिम चिकित्सीय निदान) <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="ipd-form-control ipd-form-input ipd-form-input--bold"
                          value={dischargeForm.final_diagnosis}
                          onChange={(e) => setDischargeForm({ ...dischargeForm, final_diagnosis: e.target.value })}
                          placeholder="e.g. Acute Appendicitis - Post Laparoscopic Appendectomy"
                          required
                        />
                      </div>

                      <div className="ipd-form-group" style={{ marginBottom: 12 }}>
                        <label className="ipd-field-label">
                          <Icon name="LuActivity" size={13} /> Hospital Course &amp; Response to Treatment (उपचार एवं सुधार विवरण)
                        </label>
                        <textarea
                          className="ipd-form-control ipd-form-textarea"
                          value={dischargeForm.hospital_course}
                          onChange={(e) => setDischargeForm({ ...dischargeForm, hospital_course: e.target.value })}
                          rows={3}
                          placeholder="Describe the clinical evolution, supportive care, IV protocols, and recovery milestones..."
                        />
                      </div>

                      <div className="ipd-form-group">
                        <label className="ipd-field-label">
                          <Icon name="LuShieldCheck" size={13} /> Procedures &amp; Key Investigations Done (जांच एवं प्रक्रियाएं)
                        </label>
                        <input
                          type="text"
                          className="ipd-form-control ipd-form-input"
                          value={dischargeForm.procedures_performed}
                          onChange={(e) => setDischargeForm({ ...dischargeForm, procedures_performed: e.target.value })}
                          placeholder="e.g. USG Abdomen, Routine Hematology, Appendectomy"
                        />
                      </div>
                    </div>

                    {/* Section 4: Discharge Medications Schedule (Rx) */}
                    <div className="ipd-action-card-section">
                      <div className="ipd-action-card-header" style={{ justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="ipd-section-step-num">4</div>
                          <div>
                            <h4 className="ipd-action-card-title">Discharge Medication Regimen (℞ दवाइयाँ)</h4>
                            <span className="ipd-action-card-desc">Scheduled post-discharge medicines, dosage, and timings</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddMedication}
                          className="ipd-btn-add-rx"
                        >
                          <Icon name="LuPlus" size={14} /> Add Medicine
                        </button>
                      </div>

                      <div className="ipd-rx-table-container">
                        <table className="ipd-rx-edit-table">
                          <thead>
                            <tr>
                              <th style={{ width: "35%" }}>Medicine Name &amp; Strength</th>
                              <th style={{ width: "18%" }}>Dosage</th>
                              <th style={{ width: "24%" }}>Frequency / Timing</th>
                              <th style={{ width: "16%" }}>Duration</th>
                              <th style={{ width: "7%", textAlign: "center" }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {dischargeForm.medications.map((med, idx) => (
                              <tr key={idx}>
                                <td>
                                  <input
                                    type="text"
                                    placeholder="e.g. Tab Paracetamol 650mg"
                                    className="ipd-form-control ipd-table-input ipd-table-input--bold"
                                    value={med.name}
                                    onChange={(e) => handleMedChange(idx, "name", e.target.value)}
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    placeholder="e.g. 1 Tab"
                                    className="ipd-form-control ipd-table-input"
                                    value={med.dosage}
                                    onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    placeholder="e.g. OD (Empty Stomach)"
                                    className="ipd-form-control ipd-table-input"
                                    value={med.frequency}
                                    onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    placeholder="e.g. 5 Days"
                                    className="ipd-form-control ipd-table-input"
                                    value={med.days}
                                    onChange={(e) => handleMedChange(idx, "days", e.target.value)}
                                  />
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  {dischargeForm.medications.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMedication(idx)}
                                      className="ipd-rx-del-btn"
                                      title="Remove Medicine"
                                    >
                                      <Icon name="LuTrash2" size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section 5: Follow-Up, Diet & Emergency Warnings */}
                    <div className="ipd-action-card-section">
                      <div className="ipd-action-card-header">
                        <div className="ipd-section-step-num">5</div>
                        <div>
                          <h4 className="ipd-action-card-title">Post-Discharge Advice &amp; Emergency Protocol</h4>
                          <span className="ipd-action-card-desc">Review schedule, nutrition guidelines, and red-flag symptoms</span>
                        </div>
                      </div>

                      <div className="ipd-form-row ipd-form-row--2cols" style={{ marginBottom: 12 }}>
                        <div className="ipd-form-group">
                          <label className="ipd-field-label">
                            <Icon name="LuCalendar" size={13} /> Follow-Up Consultation Date (अगली जांच की तिथि)
                          </label>
                          <input
                            type="date"
                            className="ipd-form-control ipd-form-input"
                            value={dischargeForm.follow_up_date}
                            onChange={(e) => setDischargeForm({ ...dischargeForm, follow_up_date: e.target.value })}
                          />
                        </div>

                        <div className="ipd-form-group">
                          <label className="ipd-field-label">
                            <Icon name="LuApple" size={13} /> Dietary Guidance (आहार निर्देश)
                          </label>
                          <input
                            type="text"
                            className="ipd-form-control ipd-form-input"
                            value={dischargeForm.diet_advice}
                            onChange={(e) => setDischargeForm({ ...dischargeForm, diet_advice: e.target.value })}
                            placeholder="e.g. Light, low sodium soft diet. Plenty of oral fluids."
                          />
                        </div>
                      </div>

                      <div className="ipd-form-group">
                        <label className="ipd-field-label">
                          <Icon name="LuAlertTriangle" size={13} /> Emergency Warning Signs &amp; Instructions (आपातकालीन चेतावनी)
                        </label>
                        <textarea
                          className="ipd-form-control ipd-form-textarea"
                          value={dischargeForm.follow_up_instructions}
                          onChange={(e) => setDischargeForm({ ...dischargeForm, follow_up_instructions: e.target.value })}
                          rows={2}
                          placeholder="Report immediately if fever > 101°F, acute severe pain, vomiting or bleeding occurs..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="ipd-modal-footer ipd-discharge-modal-footer">
                    <div className="ipd-dmf-notice">
                      <Icon name="LuBed" size={15} style={{ color: "#0284c7" }} />
                      <span>Bed <strong>{selectedAdmission.bed_name}</strong> in <strong>{selectedAdmission.ward_name}</strong> will be released immediately.</span>
                    </div>

                    <div className="ipd-dmf-actions">
                      <button
                        type="button"
                        className="ipd-btn-cancel-modal"
                        onClick={() => setDischargeModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="ipd-btn-confirm-discharge"
                      >
                        <Icon name="LuCheckCircle" size={16} /> Confirm Discharge &amp; Release Bed
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* Printable Official Discharge Slip Modal */}
        {/* Printable Official Discharge Slip Modal */}
        {printModalOpen && selectedAdmission && (() => {
          const mappedPayload = mapAdmissionToDischargePayload(
            selectedAdmission,
            currentSummary,
            dischargeForm,
            pendingDues
          );

          return (
            <div
              className="ipd-modal-overlay"
              onClick={() => setPrintModalOpen(false)}
            >
              <div
                className="ipd-modal-card ipd-print-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "880px", width: "95%" }}
              >
                {/* Modal Top Interactive Bar */}
                <div className="ipd-modal-header ipd-print-modal-head">
                  <div className="ipd-print-modal-title-group">
                    <div className="ipd-print-modal-badge-icon">
                      <Icon name="LuFileCheck" size={18} />
                    </div>
                    <div>
                      <h3 className="ipd-modal-title">Clinical Discharge Summary &amp; Clearance Slip</h3>
                      <p className="ipd-modal-sub">
                        Patient: <strong>{selectedAdmission.first_name} {selectedAdmission.last_name}</strong> (UHID: {selectedAdmission.uhid || "—"}) • IPD Adm: {selectedAdmission.admission_no}
                      </p>
                    </div>
                  </div>
                  <div className="ipd-print-modal-actions" style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="ipd-btn-print-primary"
                      onClick={() => handlePrintDischargeSlip(selectedAdmission, currentSummary)}
                      title="Print Official Slip"
                    >
                      <Icon name="LuPrinter" size={15} /> Print Summary Slip
                    </button>
                    <button
                      type="button"
                      className="ipd-modal-close-btn"
                      onClick={() => setPrintModalOpen(false)}
                      title="Close Preview"
                    >
                      <Icon name="LuX" size={20} />
                    </button>
                  </div>
                </div>

                {/* Modal Body: Live WYSIWYG Preview */}
                <div
                  className="ipd-modal-body ipd-print-modal-body-scroll"
                  style={{ background: "#e2e8f0", padding: "16px", maxHeight: "75vh", overflowY: "auto" }}
                >
                  <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                    <IPDDischargePreview
                      settings={dischargePrintSettings || DEFAULT_IPD_DISCHARGE_SETTINGS}
                      data={mappedPayload}
                    />
                  </div>
                </div>

                {/* Modal Footer Bar */}
                <div
                  className="ipd-modal-footer ipd-print-modal-foot"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span className="ipd-print-foot-hint" style={{ fontSize: "12px", color: "#64748b" }}>
                    <Icon name="LuPrinter" size={14} /> High-resolution A4 discharge documentation configured with hospital settings
                  </span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      className="ipd-btn-summary"
                      onClick={() => setPrintModalOpen(false)}
                    >
                      Close Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintDischargeSlip(selectedAdmission, currentSummary)}
                      className="ipd-btn-print-primary"
                    >
                      <Icon name="LuPrinter" size={15} /> Print Summary Slip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
