import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PageContainer from "../../components/common/PageContainer.jsx";
import Icon from "../../components/common/Icon.jsx";
import ipdService from "../../api/services/ipdService";
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

  // Open Discharge Modal
  const handleOpenDischargeModal = (admission) => {
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
    setDischargeModalOpen(true);
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

    if (!clearanceChecklist.billingCleared) {
      toast.error("Please verify Billing & Dues clearance before discharge!");
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
    try {
      const summary = await ipdService.getDischargeSummary(admission.id);
      setCurrentSummary(summary || {
        final_diagnosis: admission.admission_diagnosis || "General Observation",
        hospital_course: "Course of inpatient stay was unremarkable and responsive to medical therapy.",
        procedures_performed: "Diagnostic and therapeutic care under standard protocol.",
        condition_at_discharge: admission.discharge_condition || "Stable",
        follow_up_instructions: "Review in OPD with laboratory reports.",
        follow_up_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
        diet_advice: "Light, home-cooked food. Avoid heavy spices.",
        activity_advice: "Adequate rest for 5 days.",
        data: {
          medications: [
            { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "SOS", days: "3 Days" },
            { name: "Cap Pantoprazole 40mg", dosage: "1 Cap", frequency: "OD (Empty Stomach)", days: "5 Days" }
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
    <PageContainer
      title="IPD Patient Discharge & Summary"
      subtitle="Comprehensive clinical discharge management, bed de-allocation, and summary printing"
    >
      <div className="ipd-discharge-container">
        {/* KPI Summary Cards */}
        <div className="ipd-kpi-grid">
          <div className="ipd-kpi-card">
            <div className="ipd-kpi-icon-box ipd-kpi-icon-box--blue">
              <Icon name="LuBed" size={24} />
            </div>
            <div className="ipd-kpi-details">
              <span className="ipd-kpi-title">Active Inpatients</span>
              <span className="ipd-kpi-value">{totalAdmitted}</span>
              <span className="ipd-kpi-sub">Currently occupying beds</span>
            </div>
          </div>

          <div className="ipd-kpi-card">
            <div className="ipd-kpi-icon-box ipd-kpi-icon-box--emerald">
              <Icon name="LuLogOut" size={24} />
            </div>
            <div className="ipd-kpi-details">
              <span className="ipd-kpi-title">Discharges Today</span>
              <span className="ipd-kpi-value">{dischargedTodayCount}</span>
              <span className="ipd-kpi-sub">Beds sanitized & cleared</span>
            </div>
          </div>

          <div className="ipd-kpi-card">
            <div className="ipd-kpi-icon-box ipd-kpi-icon-box--amber">
              <Icon name="LuClock" size={24} />
            </div>
            <div className="ipd-kpi-details">
              <span className="ipd-kpi-title">Average Length of Stay</span>
              <span className="ipd-kpi-value">{avgStay} Days</span>
              <span className="ipd-kpi-sub">Hospital ALOS benchmark</span>
            </div>
          </div>

          <div className="ipd-kpi-card">
            <div className="ipd-kpi-icon-box ipd-kpi-icon-box--purple">
              <Icon name="LuFileText" size={24} />
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
                  <th>Patient Details</th>
                  <th>IPD Admission #</th>
                  <th>Ward & Bed</th>
                  <th>Admit Date / Stay</th>
                  <th>Attending Consultant</th>
                  <th>Diagnosis / Reason</th>
                  {activeTab === "admitted" ? (
                    <>
                      <th>Clearances</th>
                      <th>Action</th>
                    </>
                  ) : (
                    <>
                      <th>Discharge Type</th>
                      <th>Discharged On</th>
                      <th>Summary Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                      <Icon name="LuClock" size={24} style={{ marginBottom: 8, display: "inline-block" }} />
                      <div>Loading inpatient records...</div>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
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
                            <span className="ipd-patient-name">
                              {row.first_name} {row.last_name}
                            </span>
                            <span className="ipd-patient-sub">
                              <span>UHID: <strong>{row.uhid || "—"}</strong></span>
                              <span>•</span>
                              <span>{row.gender ? row.gender.toUpperCase() : "—"}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>
                            {row.admission_no}
                          </span>
                        </td>
                        <td>
                          <span className="ipd-bed-badge">
                            <Icon name="LuBed" size={13} />
                            {row.ward_name || "Ward"} - {row.bed_name || "Bed"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <span style={{ fontSize: 12.5, color: "#475569" }}>
                              {new Date(row.admitted_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                            <span className="ipd-stay-pill">{daysStay} Days Stay</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{docName}</span>
                        </td>
                        <td style={{ maxWidth: 220 }}>
                          <span style={{ fontSize: 12.5, color: "#334155" }}>
                            {row.admission_diagnosis || "Under Clinical Care"}
                          </span>
                        </td>

                        {activeTab === "admitted" ? (
                          <>
                            <td>
                              <div className="ipd-checklist-pills">
                                {(() => {
                                  const hasCharges = (row.total_charges ?? 0) > 0;
                                  const billingCleared = hasCharges && (row.total_payments ?? 0) >= (row.total_charges ?? 0);
                                  const pharmacyCleared = billingCleared;
                                  return [
                                    {
                                      label: "Bill",
                                      cleared: billingCleared,
                                    },
                                    {
                                      label: "Rx",
                                      cleared: pharmacyCleared,
                                    },
                                  ].map((item) => (
                                    <span
                                      key={item.label}
                                      className={`ipd-chk-pill ${item.cleared ? "ipd-chk-pill--cleared" : "ipd-chk-pill--pending"}`}
                                    >
                                      {item.cleared ? (
                                        <Icon name="LuCheckCircle" size={11} />
                                      ) : (
                                        <Icon name="LuAlertCircle" size={11} />
                                      )}
                                      {item.label}
                                    </span>
                                  ));
                                })()}
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="ipd-btn-discharge"
                                onClick={() => handleOpenDischargeModal(row)}
                              >
                                <Icon name="LuLogOut" size={14} /> Discharge
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <span className={`ipd-status-tag ipd-status-tag--${row.discharge_type || "normal"}`}>
                                {row.discharge_type ? row.discharge_type.toUpperCase() : "NORMAL"}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: 12.5, color: "#475569" }}>
                                {row.discharged_at
                                  ? new Date(row.discharged_at).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })
                                  : "—"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="ipd-btn-summary"
                                onClick={() => handleOpenSummary(row)}
                              >
                                <Icon name="LuPrinter" size={14} /> Summary Slip
                              </button>
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
        {dischargeModalOpen && selectedAdmission && (
          <div className="ipd-modal-overlay">
            <div className="ipd-modal-card">
              <div className="ipd-modal-header">
                <div>
                  <h3 className="ipd-modal-title">Initiate Inpatient Discharge</h3>
                  <span style={{ fontSize: 12.5, color: "#64748b" }}>
                    Patient: <strong>{selectedAdmission.first_name} {selectedAdmission.last_name}</strong> (UHID: {selectedAdmission.uhid}) • Bed: <strong>{selectedAdmission.bed_name}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  className="ipd-modal-close-btn"
                  onClick={() => setDischargeModalOpen(false)}
                >
                  <Icon name="LuX" size={20} />
                </button>
              </div>

              <form onSubmit={handleConfirmDischarge}>
                <div className="ipd-modal-body">
                  {/* Step 1: Clearance Verification */}
                  <div className="ipd-form-section">
                    <h4 className="ipd-form-section-title">1. Hospital Clearance Verification</h4>
                    <div className="ipd-clearance-checklist">
                      <label className="ipd-checklist-label">
                        <input
                          type="checkbox"
                          checked={clearanceChecklist.billingCleared}
                          onChange={(e) =>
                            setClearanceChecklist({ ...clearanceChecklist, billingCleared: e.target.checked })
                          }
                        />
                        <span>Billing & Cash Dues Cleared</span>
                      </label>
                      <label className="ipd-checklist-label">
                        <input
                          type="checkbox"
                          checked={clearanceChecklist.pharmacyReturned}
                          onChange={(e) =>
                            setClearanceChecklist({ ...clearanceChecklist, pharmacyReturned: e.target.checked })
                          }
                        />
                        <span>Pharmacy Unused Drugs Returned</span>
                      </label>
                      <label className="ipd-checklist-label">
                        <input
                          type="checkbox"
                          checked={clearanceChecklist.nursingChartHandover}
                          onChange={(e) =>
                            setClearanceChecklist({ ...clearanceChecklist, nursingChartHandover: e.target.checked })
                          }
                        />
                        <span>Nursing Chart & Vitals Handover</span>
                      </label>
                    </div>
                  </div>

                  {/* Step 2: Disposition & Condition */}
                  <div className="ipd-form-section">
                    <h4 className="ipd-form-section-title">2. Discharge Disposition & Condition</h4>
                    <div className="ipd-form-row">
                      <div className="ipd-form-group">
                        <label>Discharge Type</label>
                        <select
                          className="ipd-form-control"
                          value={dischargeForm.discharge_type}
                          onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_type: e.target.value })}
                        >
                          {DISCHARGE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="ipd-form-group">
                        <label>Condition at Discharge</label>
                        <select
                          className="ipd-form-control"
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

                  {/* Step 3: Clinical Discharge Summary */}
                  <div className="ipd-form-section">
                    <h4 className="ipd-form-section-title">3. Clinical Summary & Hospital Course</h4>
                    <div className="ipd-form-group">
                      <label>Final Clinical Diagnosis</label>
                      <input
                        type="text"
                        className="ipd-form-control"
                        value={dischargeForm.final_diagnosis}
                        onChange={(e) => setDischargeForm({ ...dischargeForm, final_diagnosis: e.target.value })}
                        placeholder="e.g. Acute Appendicitis - Post Laparoscopic Appendectomy"
                        required
                      />
                    </div>

                    <div className="ipd-form-group">
                      <label>Hospital Course & Response to Treatment</label>
                      <textarea
                        className="ipd-form-control"
                        value={dischargeForm.hospital_course}
                        onChange={(e) => setDischargeForm({ ...dischargeForm, hospital_course: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="ipd-form-group">
                      <label>Procedures & Investigations Done</label>
                      <input
                        type="text"
                        className="ipd-form-control"
                        value={dischargeForm.procedures_performed}
                        onChange={(e) => setDischargeForm({ ...dischargeForm, procedures_performed: e.target.value })}
                        placeholder="e.g. USG Abdomen, Routine Hematology, Appendectomy"
                      />
                    </div>
                  </div>

                  {/* Step 4: Discharge Medications */}
                  <div className="ipd-form-section">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 className="ipd-form-section-title">4. Discharge Medication Schedule</h4>
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        <Icon name="LuPlus" size={14} /> Add Medicine
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {dischargeForm.medications.map((med, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="Medicine Name & Strength"
                            className="ipd-form-control"
                            value={med.name}
                            onChange={(e) => handleMedChange(idx, "name", e.target.value)}
                            required
                          />
                          <input
                            type="text"
                            placeholder="Dosage"
                            className="ipd-form-control"
                            value={med.dosage}
                            onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Freq (OD/BD/TDS)"
                            className="ipd-form-control"
                            value={med.frequency}
                            onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            className="ipd-form-control"
                            value={med.days}
                            onChange={(e) => handleMedChange(idx, "days", e.target.value)}
                          />
                          {dischargeForm.medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(idx)}
                              style={{ background: "#fee2e2", border: "none", color: "#dc2626", padding: "8px", borderRadius: 6, cursor: "pointer" }}
                            >
                              <Icon name="LuX" size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 5: Follow-up & Advice */}
                  <div className="ipd-form-section">
                    <h4 className="ipd-form-section-title">5. Post-Discharge Advice & Follow-Up</h4>
                    <div className="ipd-form-row">
                      <div className="ipd-form-group">
                        <label>Follow-up Date</label>
                        <input
                          type="date"
                          className="ipd-form-control"
                          value={dischargeForm.follow_up_date}
                          onChange={(e) => setDischargeForm({ ...dischargeForm, follow_up_date: e.target.value })}
                        />
                      </div>
                      <div className="ipd-form-group">
                        <label>Dietary Instructions</label>
                        <input
                          type="text"
                          className="ipd-form-control"
                          value={dischargeForm.diet_advice}
                          onChange={(e) => setDischargeForm({ ...dischargeForm, diet_advice: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="ipd-form-group">
                      <label>Follow-up Instructions & Emergency Warning Signs</label>
                      <textarea
                        className="ipd-form-control"
                        value={dischargeForm.follow_up_instructions}
                        onChange={(e) => setDischargeForm({ ...dischargeForm, follow_up_instructions: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="ipd-modal-footer">
                  <button
                    type="button"
                    className="ipd-btn-summary"
                    onClick={() => setDischargeModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ipd-btn-discharge"
                    style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                  >
                    <Icon name="LuCheckCircle" size={15} /> Confirm Discharge & Release Bed
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Official Discharge Slip Modal */}
        {printModalOpen && selectedAdmission && currentSummary && (
          <div className="ipd-modal-overlay">
            <div className="ipd-modal-card ipd-print-modal-card">
              <div className="ipd-modal-header">
                <h3 className="ipd-modal-title">Clinical Discharge Summary Document</h3>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    <Icon name="LuPrinter" size={15} /> Print Summary Slip
                  </button>
                  <button
                    type="button"
                    className="ipd-modal-close-btn"
                    onClick={() => setPrintModalOpen(false)}
                  >
                    <Icon name="LuX" size={20} />
                  </button>
                </div>
              </div>

              <div className="ipd-modal-body" style={{ background: "#f8fafc" }}>
                <div className="ipd-print-sheet">
                  {/* Hospital Header */}
                  <div className="ipd-print-header">
                    <div>
                      <h1 className="ipd-print-hospital-name">NARAYAN SUPER SPECIALITY HOSPITAL</h1>
                      <p className="ipd-print-hospital-sub">
                        Plot 12, Healthcare City, Institutional Area • Helpline: +91 11-45678900 • NABH & NABL Accredited
                      </p>
                    </div>
                    <div className="ipd-print-title-badge">
                      DISCHARGE SUMMARY
                    </div>
                  </div>

                  {/* Patient Demographics */}
                  <div className="ipd-print-meta-grid">
                    <div className="ipd-print-meta-item">
                      <span>Patient Name:</span>
                      <span>{selectedAdmission.first_name} {selectedAdmission.last_name}</span>
                    </div>
                    <div className="ipd-print-meta-item">
                      <span>UHID:</span>
                      <span>{selectedAdmission.uhid || "—"}</span>
                    </div>
                    <div className="ipd-print-meta-item">
                      <span>IPD Admission No:</span>
                      <span>{selectedAdmission.admission_no}</span>
                    </div>
                    <div className="ipd-print-meta-item">
                      <span>Ward & Bed:</span>
                      <span>{selectedAdmission.ward_name || "Ward"} / {selectedAdmission.bed_name || "Bed"}</span>
                    </div>
                    <div className="ipd-print-meta-item">
                      <span>Admission Date:</span>
                      <span>{new Date(selectedAdmission.admitted_at).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="ipd-print-meta-item">
                      <span>Discharge Date:</span>
                      <span>{selectedAdmission.discharged_at ? new Date(selectedAdmission.discharged_at).toLocaleString("en-IN") : new Date().toLocaleString("en-IN")}</span>
                    </div>
                    <div className="ipd-print-meta-item">
                      <span>Discharge Disposition:</span>
                      <span style={{ textTransform: "uppercase" }}>{selectedAdmission.discharge_type || "NORMAL"}</span>
                    </div>
                    <div className="ipd-print-meta-item">
                      <span>Consultant In-Charge:</span>
                      <span>
                        {selectedAdmission.doctor_first_name
                          ? `Dr. ${selectedAdmission.doctor_first_name} ${selectedAdmission.doctor_last_name || ""}`
                          : "Dr. On-Duty Specialist"}
                      </span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="ipd-print-section">
                    <h5 className="ipd-print-section-title">Final Clinical Diagnosis</h5>
                    <p className="ipd-print-section-text" style={{ fontWeight: 700, color: "#0f172a" }}>
                      {currentSummary.final_diagnosis || selectedAdmission.admission_diagnosis || "Acute Clinical Condition"}
                    </p>
                  </div>

                  {/* Clinical Course */}
                  <div className="ipd-print-section">
                    <h5 className="ipd-print-section-title">Brief History & Hospital Course</h5>
                    <p className="ipd-print-section-text">
                      {currentSummary.hospital_course || "Patient was admitted under care, stabilized with supportive treatment and scheduled medications. Response to therapy was satisfactory."}
                    </p>
                  </div>

                  {/* Procedures */}
                  {currentSummary.procedures_performed && (
                    <div className="ipd-print-section">
                      <h5 className="ipd-print-section-title">Procedures / Key Investigations</h5>
                      <p className="ipd-print-section-text">{currentSummary.procedures_performed}</p>
                    </div>
                  )}

                  {/* Discharge Medications */}
                  <div className="ipd-print-section">
                    <h5 className="ipd-print-section-title">Discharge Medications (Rx)</h5>
                    <table className="ipd-rx-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Medicine Name</th>
                          <th>Dosage</th>
                          <th>Frequency & Timing</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentSummary.data?.medications || [
                          { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "SOS", days: "3 Days" },
                          { name: "Cap Pantoprazole 40mg", dosage: "1 Cap", frequency: "OD (Empty Stomach)", days: "5 Days" }
                        ]).map((m, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{m.name}</td>
                            <td>{m.dosage}</td>
                            <td>{m.frequency}</td>
                            <td>{m.days}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Advice & Follow up */}
                  <div className="ipd-print-section">
                    <h5 className="ipd-print-section-title">Follow-up Advice & Emergency Instructions</h5>
                    <p className="ipd-print-section-text">
                      <strong>Follow-up Date:</strong> {currentSummary.follow_up_date || "After 5 days in OPD"}
                      <br />
                      <strong>Diet Advice:</strong> {currentSummary.diet_advice || "Standard balanced diet."}
                      <br />
                      <strong>Instructions:</strong> {currentSummary.follow_up_instructions || "In case of emergency or severe discomfort, contact emergency department immediately."}
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="ipd-print-signatures">
                    <div className="ipd-sig-box">Patient / Attendant Signature</div>
                    <div className="ipd-sig-box">Resident Medical Officer</div>
                    <div className="ipd-sig-box">Authorized Consultant Signature</div>
                  </div>
                </div>
              </div>

              <div className="ipd-modal-footer">
                <button
                  type="button"
                  className="ipd-btn-summary"
                  onClick={() => setPrintModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  <Icon name="LuPrinter" size={15} /> Print Summary Slip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
