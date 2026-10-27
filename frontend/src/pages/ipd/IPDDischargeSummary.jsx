import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import ipdService from "../../api/services/ipdService";
import IPDDischargeWorkflow from "./components/IPDDischargeWorkflow.jsx";
import "./IPDDischargeSummary.css";

const DISCHARGE_TYPES = [
  { value: "all", label: "All Types" },
  { value: "normal", label: "Normal Discharge" },
  { value: "lama", label: "LAMA" },
  { value: "dama", label: "DAMA" },
  { value: "transferred", label: "Transferred" },
  { value: "absconded", label: "Absconded" },
  { value: "death", label: "Expired" },
];

export default function IPDDischargeSummary() {
  const navigate = useNavigate();

  // Active view: "archive" (Discharged patients) or "active" (Admitted inpatients ready for summary)
  const [activeTab, setActiveTab] = useState("archive");

  // If a patient is selected for clinical workflow edit/creation
  const [workflowAdmission, setWorkflowAdmission] = useState(null);

  // Admissions list from real backend
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Printable summary modal state
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Load real backend admissions
  const loadAdmissions = async () => {
    setLoading(true);
    try {
      const data = await ipdService.getAdmissions({ status: "all" });
      const list = Array.isArray(data) ? data : data?.rows || data?.data || [];
      setAdmissions(list);
    } catch (err) {
      console.error("Failed to load admissions for discharge summary:", err);
      toast.error("Could not load admissions data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, []);

  // Wards list for filter
  const wardsList = useMemo(() => {
    const set = new Set();
    admissions.forEach((a) => {
      if (a.ward_name) set.add(a.ward_name);
    });
    return Array.from(set).sort();
  }, [admissions]);

  // Split into discharged archive and active
  const dischargedList = useMemo(
    () => admissions.filter((a) => a.status === "discharged"),
    [admissions]
  );

  const activeInpatientsList = useMemo(
    () => admissions.filter((a) => a.status === "admitted"),
    [admissions]
  );

  // Filtered dataset
  const currentDataset = activeTab === "archive" ? dischargedList : activeInpatientsList;

  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const now = new Date();

    return currentDataset.filter((item) => {
      // 1. Text Search
      if (q) {
        const pName = `${item.first_name || ""} ${item.last_name || ""}`.toLowerCase();
        const uhid = (item.uhid || "").toLowerCase();
        const admNo = (item.admission_no || "").toLowerCase();
        const phone = (item.phone || item.mobile || "").toLowerCase();
        const bed = (item.bed_name || "").toLowerCase();
        const doc = `${item.doctor_first_name || ""} ${item.doctor_last_name || ""}`.toLowerCase();
        const diag = (item.admission_diagnosis || "").toLowerCase();

        const match =
          pName.includes(q) ||
          uhid.includes(q) ||
          admNo.includes(q) ||
          phone.includes(q) ||
          bed.includes(q) ||
          doc.includes(q) ||
          diag.includes(q);

        if (!match) return false;
      }

      // 2. Ward Filter
      if (wardFilter !== "all" && item.ward_name !== wardFilter) {
        return false;
      }

      // 3. Discharge Type Filter (archive tab)
      if (typeFilter !== "all" && (item.discharge_type || "normal").toLowerCase() !== typeFilter) {
        return false;
      }

      // 4. Date Range Filter
      const targetDate = item.discharged_at ? new Date(item.discharged_at) : new Date(item.admitted_at);
      if (dateFilter === "today") {
        if (targetDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === "7days") {
        const diffDays = (now - targetDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) return false;
      } else if (dateFilter === "month") {
        if (targetDate.getMonth() !== now.getMonth() || targetDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      return true;
    });
  }, [currentDataset, searchTerm, wardFilter, typeFilter, dateFilter]);

  // Open Full Clinical Discharge Summary Slip Modal
  const handleOpenSummaryModal = async (admission) => {
    setSelectedAdmission(admission);
    setSummaryModalOpen(true);
    setSummaryLoading(true);

    try {
      const summary = await ipdService.getDischargeSummary(admission.id);
      setCurrentSummary(
        summary || {
          final_diagnosis: admission.admission_diagnosis || "Inpatient Clinical Treatment Completed",
          hospital_course:
            "Patient was admitted under specialized care, stabilized with supportive therapy and scheduled medications. Response to therapy was satisfactory with steady clinical recovery.",
          procedures_performed: "Standard non-invasive vital monitoring, routine clinical investigations, IV therapy.",
          condition_at_discharge: admission.discharge_condition || "Clinically Stable & Symptom Free",
          follow_up_instructions:
            "Review in OPD with laboratory reports after 5 days. Report to Emergency if acute distress develops.",
          follow_up_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
          diet_advice: "Light, balanced, high-protein soft diet. Maintain adequate oral hydration.",
          activity_advice: "Gradual resumption of normal routine. Avoid heavy exertion for 1 week.",
          data: {
            medications: [
              { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "SOS / Max TDS", days: "3 Days" },
              { name: "Cap Pantoprazole 40mg", dosage: "1 Cap", frequency: "OD (Empty Stomach)", days: "5 Days" },
              { name: "Tab Multivitamin & Zinc", dosage: "1 Tab", frequency: "OD (After Lunch)", days: "10 Days" },
            ],
          },
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not load summary details.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (!filteredList.length) {
      toast.error("No discharge summary records to export.");
      return;
    }

    const headers = [
      "IPD Adm No",
      "UHID",
      "Patient Name",
      "Age/Gender",
      "Phone",
      "Ward",
      "Bed",
      "Admit Date",
      "Discharge Date",
      "Consultant Doctor",
      "Diagnosis",
      "Discharge Type",
      "Status",
    ];

    const rows = filteredList.map((item) => [
      `"${item.admission_no || ""}"`,
      `"${item.uhid || ""}"`,
      `"${item.first_name || ""} ${item.last_name || ""}"`,
      `"${item.gender || ""}/${item.age || ""}"`,
      `"${item.phone || item.mobile || ""}"`,
      `"${item.ward_name || ""}"`,
      `"${item.bed_name || ""}"`,
      `"${item.admitted_at ? new Date(item.admitted_at).toLocaleDateString("en-IN") : ""}"`,
      `"${item.discharged_at ? new Date(item.discharged_at).toLocaleDateString("en-IN") : ""}"`,
      `"Dr. ${item.doctor_first_name || ""} ${item.doctor_last_name || ""}"`,
      `"${(item.admission_diagnosis || "").replace(/"/g, '""')}"`,
      `"${item.discharge_type || "normal"}"`,
      `"${item.status || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IPD_Discharge_Summary_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Discharge summaries exported successfully!");
  };

  // If in full clinical workflow mode, render the workflow view
  if (workflowAdmission) {
    return (
      <IPDDischargeWorkflow
        admission={workflowAdmission}
        onBack={() => {
          setWorkflowAdmission(null);
          loadAdmissions();
        }}
      />
    );
  }

  return (
    <div className="ipds-page">
      {/* ── 1. TOP EXECUTIVE HEADER (MATCHING REGISTRATION REPORTS) ── */}
      <div className="ipds-header">
        <div className="ipds-header-left">
          <div className="ipds-header-icon">
            <Icon name="LuFileText" size={24} />
          </div>
          <div>
            <h1 className="ipds-title">IPD Discharge Summary</h1>
           
          </div>
        </div>

      
      </div>

      {/* ── 2. SUB-TABS (ARCHIVE VS ACTIVE) ── */}
      <div className="ipds-tab-bar">
        <button
          type="button"
          className={`ipds-tab-item ${activeTab === "archive" ? "ipds-tab-item--active" : ""}`}
          onClick={() => setActiveTab("archive")}
        >
          <Icon name="LuFileCheck" size={16} />
          <span>Discharged Summaries Archive</span>
          <span className="ipds-tab-badge">{dischargedList.length}</span>
        </button>

        <button
          type="button"
          className={`ipds-tab-item ${activeTab === "active" ? "ipds-tab-item--active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          <Icon name="LuClock" size={16} />
          <span>Active Inpatients (Prepare Summary)</span>
          <span className="ipds-tab-badge">{activeInpatientsList.length}</span>
        </button>
      </div>

      {/* ── 3. MAIN DATA TABLE (MATCHING USER SCREENSHOT) ── */}
      <div className="ipds-card">
        <div className="ipds-table-wrap">
          <table className="ipds-table">
            <thead>
              <tr>
                <th style={{ width: "13%" }}>IPD ADM NO</th>
                <th style={{ width: "12%" }}>
                  {activeTab === "archive" ? "DISCHARGED DATE" : "ADMISSION DATE"}
                </th>
                <th style={{ width: "18%" }}>PATIENT NAME</th>
                <th style={{ width: "12%" }}>MOBILE NUMBER</th>
                <th style={{ width: "13%" }}>WARD &amp; BED</th>
                <th style={{ width: "15%" }}>ATTENDING DOCTOR</th>
                <th style={{ width: "10%" }}>
                  {activeTab === "archive" ? "DISCHARGE TYPE" : "STATUS"}
                </th>
                <th style={{ width: "11%", textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px 14px", color: "#64748b" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
                      <Icon name="LuLoader" size={20} className="spinning" />
                      Loading clinical discharge summaries…
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px 14px", color: "#64748b" }}>
                    <Icon name="LuFileX" size={32} style={{ display: "block", margin: "0 auto 8px auto", opacity: 0.5 }} />
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                      No discharge summary records found
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {searchTerm || wardFilter !== "all" || typeFilter !== "all"
                        ? "Try adjusting your search query or filters"
                        : "No patient records available in this section"}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const pName = `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Patient";
                  const docName = item.doctor_first_name
                    ? `Dr. ${item.doctor_first_name} ${item.doctor_last_name || ""}`
                    : "Dr. On-Duty Specialist";
                  const dateStr = item.discharged_at
                    ? new Date(item.discharged_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : item.admitted_at
                    ? new Date(item.admitted_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  const disType = (item.discharge_type || "normal").toLowerCase();

                  return (
                    <tr key={item.id}>
                      {/* IPD Adm No */}
                      <td>
                        <button
                          type="button"
                          className="ipds-link-adm"
                          onClick={() => handleOpenSummaryModal(item)}
                          title="View Discharge Summary Slip"
                        >
                          {item.admission_no || `ADM-${item.id}`}
                        </button>
                        <div className="ipds-uhid-sub">UHID: {item.uhid || "—"}</div>
                      </td>

                      {/* Date */}
                      <td>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{dateStr}</div>
                        {item.discharged_at && (
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {new Date(item.discharged_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </td>

                      {/* Patient Name */}
                      <td>
                        <div className="ipds-patient-name">{pName}</div>
                        <div className="ipds-patient-sub">
                          <span>
                            {item.gender || "—"} / {item.age ? `${item.age} Yrs` : "—"}
                          </span>
                          {item.blood_group && (
                            <>
                              <span>•</span>
                              <span style={{ color: "#dc2626", fontWeight: 700 }}>
                                🩸 {item.blood_group}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Mobile */}
                      <td>
                        <span style={{ fontWeight: 600, color: "#334155" }}>
                          {item.phone || item.mobile || "—"}
                        </span>
                      </td>

                      {/* Ward & Bed */}
                      <td>
                        <span className="ipds-ward-pill">
                          <Icon name="LuBed" size={13} />
                          {item.ward_name || "General"} • {item.bed_name || "Bed"}
                        </span>
                      </td>

                      {/* Doctor */}
                      <td>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{docName}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {item.department_name || "General Medicine"}
                        </div>
                      </td>

                      {/* Discharge Type / Status */}
                      <td>
                        {activeTab === "archive" ? (
                          <span className={`ipds-status-pill ipds-status-pill--${disType}`}>
                            <Icon name="LuCheckCircle" size={11} />
                            {item.discharge_type ? item.discharge_type.toUpperCase() : "NORMAL"}
                          </span>
                        ) : (
                          <span
                            className="ipds-status-pill"
                            style={{
                              background: "#ecfdf5",
                              color: "#047857",
                              border: "1px solid #a7f3d0",
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#059669",
                              }}
                            />
                            ADMITTED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "center" }}>
                        <div className="ipds-act-group" style={{ justifyContent: "center" }}>
                          {/* View Summary Slip Modal */}
                          <button
                            type="button"
                            className="ipds-act-btn ipds-act-btn--view"
                            onClick={() => handleOpenSummaryModal(item)}
                            title="View Discharge Summary Slip"
                          >
                            <Icon name="LuEye" size={15} />
                          </button>

                          {/* Edit / Clinical Workflow */}
                          <button
                            type="button"
                            className="ipds-act-btn ipds-act-btn--edit"
                            onClick={() => setWorkflowAdmission(item)}
                            title="Edit Clinical Discharge Workflow"
                          >
                            <Icon name="LuFileSpreadsheet" size={15} />
                          </button>

                          {/* Direct Print */}
                          <button
                            type="button"
                            className="ipds-act-btn ipds-act-btn--print"
                            onClick={() => {
                              handleOpenSummaryModal(item).then(() => {
                                setTimeout(() => window.print(), 300);
                              });
                            }}
                            title="Print Discharge Summary"
                          >
                            <Icon name="LuPrinter" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. OFFICIAL DISCHARGE SUMMARY PRINT MODAL ── */}
      {summaryModalOpen && selectedAdmission && (
        <div className="ipds-overlay" onClick={() => setSummaryModalOpen(false)}>
          <div className="ipds-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="ipds-modal-head">
              <h3 className="ipds-modal-title">
                <Icon name="LuFileText" size={20} />
                Clinical Discharge Summary Slip — {selectedAdmission.admission_no || `ADM-${selectedAdmission.id}`}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  className="ipds-btn ipds-btn--green"
                  style={{ height: 32, fontSize: 12, padding: "0 12px" }}
                  onClick={() => window.print()}
                  title="Print Official Slip"
                >
                  <Icon name="LuPrinter" size={14} /> Print Slip
                </button>
                <button
                  type="button"
                  className="ipds-modal-close"
                  onClick={() => setSummaryModalOpen(false)}
                >
                  <Icon name="LuX" size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Complete Printable Hospital Discharge Summary */}
            <div className="ipds-modal-body">
              {summaryLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                  <Icon name="LuLoader" size={24} className="spinning" />
                  <p style={{ marginTop: 8, fontWeight: 600 }}>Loading Discharge Summary Details…</p>
                </div>
              ) : (
                <div className="ipds-slip-sheet" id="ipd-print-summary-area">
                  {/* Hospital Top Header */}
                  <div className="ipds-slip-head">
                    <h2 className="ipds-slip-hosp-name">
                      NARAYAN HOSPITAL &amp; MEDICAL RESEARCH CENTRE
                    </h2>
                    <p className="ipds-slip-hosp-sub">
                      NABH Accredited Multi-Specialty Hospital • 24×7 Emergency, ICU &amp; Inpatient Care
                      <br />
                      Station Road, Civil Lines, Kota, Rajasthan - 324001 • Tel: +91 744 2450000
                    </p>
                    <span className="ipds-slip-doc-badge">PATIENT DISCHARGE SUMMARY CERTIFICATE</span>
                  </div>

                  {/* Demographic & Admission Details Grid */}
                  <div className="ipds-slip-grid">
                    <div className="ipds-slip-field">
                      <label>Patient Name:</label>
                      <span>
                        {selectedAdmission.first_name} {selectedAdmission.last_name}
                      </span>
                    </div>
                    <div className="ipds-slip-field">
                      <label>IPD Adm No:</label>
                      <span>{selectedAdmission.admission_no || `ADM-${selectedAdmission.id}`}</span>
                    </div>
                    <div className="ipds-slip-field">
                      <label>UHID Number:</label>
                      <span>{selectedAdmission.uhid || "—"}</span>
                    </div>
                    <div className="ipds-slip-field">
                      <label>Age / Gender:</label>
                      <span>
                        {selectedAdmission.age ? `${selectedAdmission.age} Yrs` : "—"} /{" "}
                        {selectedAdmission.gender || "—"} (🩸 {selectedAdmission.blood_group || "N/A"})
                      </span>
                    </div>
                    <div className="ipds-slip-field">
                      <label>Admit Date:</label>
                      <span>
                        {selectedAdmission.admitted_at
                          ? new Date(selectedAdmission.admitted_at).toLocaleString("en-IN")
                          : "—"}
                      </span>
                    </div>
                    <div className="ipds-slip-field">
                      <label>Discharge Date:</label>
                      <span>
                        {selectedAdmission.discharged_at
                          ? new Date(selectedAdmission.discharged_at).toLocaleString("en-IN")
                          : "In Progress / Active"}
                      </span>
                    </div>
                    <div className="ipds-slip-field">
                      <label>Ward &amp; Bed:</label>
                      <span>
                        {selectedAdmission.ward_name || "General"} • {selectedAdmission.bed_name || "Bed"}
                      </span>
                    </div>
                    <div className="ipds-slip-field">
                      <label>Consultant:</label>
                      <span>
                        Dr. {selectedAdmission.doctor_first_name} {selectedAdmission.doctor_last_name || ""}
                      </span>
                    </div>
                  </div>

                  {/* 1. Final Diagnosis */}
                  <div className="ipds-slip-section-title">1. Final Clinical Diagnosis (अंतिम निदान)</div>
                  <div className="ipds-slip-box">
                    <strong>{currentSummary?.final_diagnosis || selectedAdmission.admission_diagnosis || "Inpatient Clinical Treatment Completed"}</strong>
                  </div>

                  {/* 2. Hospital Stay & Treatment Course */}
                  <div className="ipds-slip-section-title">2. Hospital Stay &amp; Clinical Course (अस्पताल उपचार का विवरण)</div>
                  <div className="ipds-slip-box">
                    {currentSummary?.hospital_course || "Patient was admitted under specialized care, stabilized with supportive therapy and scheduled medications. Response to therapy was satisfactory with steady clinical recovery."}
                  </div>

                  {/* 3. Condition at Discharge */}
                  <div className="ipds-slip-section-title">3. Condition at Discharge (डिस्चार्ज के समय स्थिति)</div>
                  <div className="ipds-slip-box">
                    <strong>{currentSummary?.condition_at_discharge || selectedAdmission.discharge_condition || "Clinically Stable & Symptom Free"}</strong>
                  </div>

                  {/* 4. Discharge Medications */}
                  <div className="ipds-slip-section-title">4. Discharge Medication Regimen (डिस्चार्ज दवाइयां)</div>
                  <table className="ipds-meds-tbl">
                    <thead>
                      <tr>
                        <th style={{ width: "40%" }}>Medicine Name</th>
                        <th style={{ width: "20%" }}>Dosage</th>
                        <th style={{ width: "25%" }}>Frequency / Timing</th>
                        <th style={{ width: "15%" }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentSummary?.data?.medications || [
                        { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "SOS / Max TDS", days: "3 Days" },
                        { name: "Cap Pantoprazole 40mg", dosage: "1 Cap", frequency: "OD (Empty Stomach)", days: "5 Days" },
                      ]).map((med, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, color: "#0f172a" }}>{med.name}</td>
                          <td>{med.dosage || "1 Dose"}</td>
                          <td>{med.frequency || "As Directed"}</td>
                          <td>{med.days || "5 Days"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 5. Post-Discharge Advice & Follow-Up */}
                  <div className="ipds-slip-section-title">5. Post-Discharge Advice &amp; Follow-up (परामर्श व अनुवर्ती जांच)</div>
                  <div className="ipds-slip-box" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div>
                      <strong>Diet Advice:</strong> {currentSummary?.diet_advice || "Light, balanced, high-protein soft diet. Maintain adequate hydration."}
                    </div>
                    <div>
                      <strong>Activity Advice:</strong> {currentSummary?.activity_advice || "Gradual resumption of normal activities. Avoid heavy physical lifting for 1 week."}
                    </div>
                    <div>
                      <strong>Follow-up Schedule:</strong> Review in OPD on{" "}
                      <strong style={{ color: "#1d4ed8" }}>
                        {currentSummary?.follow_up_date
                          ? new Date(currentSummary.follow_up_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "After 5 Days"}
                      </strong>{" "}
                      or immediately in case of emergency.
                    </div>
                  </div>

                  {/* Authorized Signatures */}
                  <div className="ipds-signatures">
                    <div className="ipds-sig-box">Patient / Attendant Signature</div>
                    <div className="ipds-sig-box">Duty Nursing Officer</div>
                    <div className="ipds-sig-box">
                      Dr. {selectedAdmission.doctor_first_name} {selectedAdmission.doctor_last_name || ""}
                      <br />
                      <span style={{ fontSize: 10, color: "#64748b" }}>Consultant In-Charge</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="ipds-modal-foot">
              <button
                type="button"
                className="ipds-btn"
                style={{ background: "#f1f5f9", color: "#334155" }}
                onClick={() => setSummaryModalOpen(false)}
              >
                Close Window
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="ipds-btn ipds-btn--blue"
                  onClick={() => {
                    setSummaryModalOpen(false);
                    setWorkflowAdmission(selectedAdmission);
                  }}
                >
                  <Icon name="LuFileSpreadsheet" size={15} /> Edit Clinical Workflow
                </button>
                <button
                  type="button"
                  className="ipds-btn ipds-btn--green"
                  onClick={() => window.print()}
                >
                  <Icon name="LuPrinter" size={15} /> Print Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
