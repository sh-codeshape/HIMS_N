import React, { useState, useEffect } from "react";
import Icon from "../../../components/common/Icon.jsx";
import { mockStore } from "../../../mock/mockStore";
import { ROLES, ROLE_LABELS } from "../../../auth/roles";
import { useAuth } from "../../../auth";
import "./RegistrationReportsTable.css";

// Standard Real-World Hospital Patient Statuses
const STATUS_OPTIONS = [
  { value: "Waiting", label: "Waiting in Queue", color: "#0284c7", bg: "#e0f2fe", icon: "LuClock", desc: "Token issued, waiting for doctor consultation" },
  { value: "In Consultation", label: "In Consultation", color: "#2563eb", bg: "#eff6ff", icon: "LuStethoscope", desc: "Inside doctor chamber for medical check-up" },
  { value: "Admitted", label: "Admitted (IPD)", color: "#7c3aed", bg: "#f3e8ff", icon: "LuBedDouble", desc: "Inpatient admission, ward and bed allotted" },
  { value: "Completed", label: "Consultation Completed", color: "#059669", bg: "#ecfdf5", icon: "LuCircleCheck", desc: "Doctor examination finished, prescription generated" },
  { value: "Discharged", label: "Discharged", color: "#475569", bg: "#f1f5f9", icon: "LuLogOut", desc: "Treatment completed, patient discharged from hospital" },
  { value: "Cancelled", label: "Cancelled / No Show", color: "#dc2626", bg: "#fef2f2", icon: "LuCircleX", desc: "Registration cancelled or patient did not show up" },
];

export default function RegistrationReportsTable({ patients: initialPatients = [] }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [toastMsg, setToastMsg] = useState("");

  // Role: Defaults to logged-in user role (Reception - Neha Gupta by default)
  const [currentRole, setCurrentRole] = useState(user?.role || ROLES.RECEPTION);
  const staffName = user?.name || "Neha Gupta (Front Desk)";

  // Modals state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({});
  const [newStatus, setNewStatus] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");

  useEffect(() => {
    setPatients(initialPatients.length ? initialPatients : mockStore.getPatients());
  }, [initialPatients]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Tab state for View Dossier modal
  const [activeDossierTab, setActiveDossierTab] = useState("demographics");

  // ================= PERMISSION CHECKS =================
  const canView = true;
  const canEdit = [ROLES.RECEPTION, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(currentRole);
  const canChangeStatus = [ROLES.RECEPTION, ROLES.DOCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(currentRole);
  const canPrintSlip = [ROLES.RECEPTION, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(currentRole);
  const canDelete = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(currentRole);

  // ================= ACTION HANDLERS =================
  const handleOpenView = (p) => {
    setSelectedPatient(p);
    setActiveDossierTab("demographics");
    setViewModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    if (!canEdit) {
      showToast(`🔒 Access Restricted: Patient editing requires Reception or Admin role (Current: ${ROLE_LABELS[currentRole] || currentRole}).`);
      return;
    }
    setSelectedPatient(p);
    setEditFormData({
      name: p.name || "",
      phone: p.phone || "",
      address: p.address || "",
      department: p.department || "General Medicine",
      doctor: p.doctor || "",
      category: p.category || "OPD",
      age: p.age || "",
      gender: p.gender || "Male",
      bloodGroup: p.bloodGroup || "",
      guardian: p.guardian || p.guardianName || "",
      patientType: p.patientType || "New Patient",
      fee: p.fee || p.totalFee || "350",
      paymentMode: p.paymentMode || "CASH",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const updatedList = mockStore.updatePatient(selectedPatient.uhid, editFormData);
    setPatients(updatedList);
    setEditModalOpen(false);
    showToast(`✅ Patient record updated for ${selectedPatient.name} (${selectedPatient.uhid})`);
  };

  const handleOpenStatusModal = (p) => {
    if (!canChangeStatus) {
      showToast("🔒 Access Restricted: You do not have permission to update patient visit status.");
      return;
    }
    setSelectedPatient(p);
    setNewStatus(p.status || "Waiting");
    setStatusRemarks("");
    setStatusModalOpen(true);
  };

  const handleSaveStatus = () => {
    if (!selectedPatient || !newStatus) return;

    const updatedList = mockStore.updatePatient(selectedPatient.uhid, {
      status: newStatus,
      statusRemarks: statusRemarks || `Status marked as "${newStatus}" by ${staffName} (${ROLE_LABELS[currentRole]})`,
    });
    setPatients(updatedList);
    setStatusModalOpen(false);
    showToast(`🔄 Status updated to "${newStatus}" for ${selectedPatient.name}`);
  };

  const handleOpenDelete = (p) => {
    setSelectedPatient(p);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedPatient) return;

    if (!canDelete) {
      // Receptionist: Real-world hospital compliance cancellation workflow
      const updatedList = mockStore.updatePatient(selectedPatient.uhid, {
        status: "Cancelled",
        statusRemarks: `Registration cancelled & voided at Reception Counter by ${staffName}`,
      });
      setPatients(updatedList);
      setDeleteModalOpen(false);
      showToast(`⚠️ Registration marked as "Cancelled" (Reception Audit Policy).`);
      return;
    }

    // Admin / Super Admin permanent purge
    const updatedList = mockStore.deletePatient(selectedPatient.uhid);
    setPatients(updatedList);
    setDeleteModalOpen(false);
    showToast(`🗑️ Patient record for ${selectedPatient.uhid} permanently deleted from hospital registry.`);
  };

  const handleOpenSlip = (p) => {
    setSelectedPatient(p);
    setSlipModalOpen(true);
  };

  // ================= EXPORT CSV FUNCTIONALITY =================
  const handleExportCSV = () => {
    if (!filtered.length) {
      showToast("⚠️ No patient records found to export!");
      return;
    }

    const headers = [
      "UHID",
      "Patient ID",
      "Patient Name",
      "Age",
      "Gender",
      "Blood Group",
      "Category",
      "Department",
      "Consulting Doctor",
      "Mobile Number",
      "Residential Address",
      "Registration Timestamp",
      "Visit Status",
      "Payment Mode",
      "Amount Paid"
    ];

    const rows = filtered.map((p) => [
      `"${p.uhid || ""}"`,
      `"${p.id || ""}"`,
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${p.age || ""}"`,
      `"${p.gender || ""}"`,
      `"${p.bloodGroup || ""}"`,
      `"${p.category || "OPD"}"`,
      `"${(p.department || "").replace(/"/g, '""')}"`,
      `"${(p.doctor || "").replace(/"/g, '""')}"`,
      `"${p.phone || ""}"`,
      `"${(p.address || "").replace(/"/g, '""')}"`,
      `"${p.registeredAt || ""}"`,
      `"${p.status || "Waiting"}"`,
      `"${p.paymentMode || "CASH"}"`,
      `"${p.fee || p.totalFee || "350.00"}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hospital_Patient_Registry_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`📥 Exported ${filtered.length} patient records to CSV successfully!`);
  };

  // ================= FILTERING LOGIC =================
  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.uhid?.toLowerCase().includes(search.toLowerCase()) ||
      p.id?.toLowerCase().includes(search.toLowerCase()) ||
      p.doctor?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search);

    const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && (p.status === "Active" || p.status === "Waiting" || p.status === "In Consultation")) ||
      p.status === statusFilter;
    const matchesDept = deptFilter === "All" || p.department === deptFilter;

    return matchesSearch && matchesCat && matchesStatus && matchesDept;
  });

  // KPI Calculations
  const totalCount = patients.length;
  const opdCount = patients.filter((p) => p.category === "OPD" && p.status !== "Cancelled").length;
  const ipdCount = patients.filter((p) => p.category === "IPD" || p.status === "Admitted").length;
  const waitingCount = patients.filter((p) => p.status === "Waiting" || p.status === "Active").length;
  const completedCount = patients.filter((p) => p.status === "Completed" || p.status === "Discharged").length;

  return (
    <div className="rep-dashboard">
      {/* Toast Notification */}
      {toastMsg && <div className="rep-toast">{toastMsg}</div>}

      {/* ================= 1. LIVE KPI METRIC CARDS ================= */}
      <div className="rep-kpi-grid">
        <div className="rep-kpi-card">
          <div className="rep-kpi-icon rep-kpi-icon--blue">
            <Icon name="LuUsers" size={22} />
          </div>
          <div className="rep-kpi-info">
            <span className="rep-kpi-label">Total Registered</span>
            <span className="rep-kpi-val">{totalCount} Patients</span>
            <span className="rep-kpi-sub">Total Counter Footfall</span>
          </div>
        </div>

        <div className="rep-kpi-card">
          <div className="rep-kpi-icon rep-kpi-icon--cyan">
            <Icon name="LuClock" size={22} />
          </div>
          <div className="rep-kpi-info">
            <span className="rep-kpi-label">Waiting in Queue</span>
            <span className="rep-kpi-val">{waitingCount} Patients</span>
            <span className="rep-kpi-sub">Awaiting Consultation</span>
          </div>
        </div>

        <div className="rep-kpi-card">
          <div className="rep-kpi-icon rep-kpi-icon--purple">
            <Icon name="LuBedDouble" size={22} />
          </div>
          <div className="rep-kpi-info">
            <span className="rep-kpi-label">IPD Admitted</span>
            <span className="rep-kpi-val">{ipdCount} In Wards</span>
            <span className="rep-kpi-sub">Inpatient Bed Active</span>
          </div>
        </div>

        <div className="rep-kpi-card">
          <div className="rep-kpi-icon rep-kpi-icon--green">
            <Icon name="LuCircleCheck" size={22} />
          </div>
          <div className="rep-kpi-info">
            <span className="rep-kpi-label">Consulted / Done</span>
            <span className="rep-kpi-val">{completedCount} Finished</span>
            <span className="rep-kpi-sub">Prescriptions Done</span>
          </div>
        </div>

        <div className="rep-kpi-card">
          <div className="rep-kpi-icon rep-kpi-icon--emerald">
            <Icon name="LuIndianRupee" size={22} />
          </div>
          <div className="rep-kpi-info">
            <span className="rep-kpi-label">Counter Collection</span>
            <span className="rep-kpi-val">₹ {patients.reduce((sum, p) => sum + (parseFloat(p.fee || p.totalFee || 350) || 350), 0).toLocaleString("en-IN")}</span>
            <span className="rep-kpi-sub">Cash & Online Collected</span>
          </div>
        </div>
      </div>

      {/* ================= 2. REGISTRY TABLE CONTAINER (HOSPITAL RECORD LIST) ================= */}
      <div className="reg-rep-card">
        {/* Table Header & Multi-Filters */}
        <div className="reg-rep-header">
          <div>
            <div className="reg-rep-title-badge-row">
              <h3 className="reg-rep-title">Hospital Patient Registration Registry</h3>
              <span className="reg-rep-counter-tag">Showing {filtered.length} of {totalCount} Patients</span>
            </div>
            <p className="reg-rep-sub">
              Complete real-time patient queue, clinical allocation, billing status, and full hospital EMR records
            </p>
          </div>

          <div className="reg-rep-filters">
            {/* Search Input */}
            <div className="reg-rep-search">
              <Icon name="LuSearch" size={15} />
              <input
                type="text"
                placeholder="Search UHID, Patient, Doctor, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="reg-rep-clear-search" onClick={() => setSearch("")}>
                  <Icon name="LuX" size={13} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              className="reg-rep-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="OPD">OPD Consultation</option>
              <option value="IPD">IPD Admission</option>
              <option value="Emergency">Emergency Intake</option>
            </select>

            {/* Status Filter */}
            <select
              className="reg-rep-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Waiting">Waiting in Queue</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Admitted">Admitted</option>
              <option value="Completed">Completed</option>
              <option value="Discharged">Discharged</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Department Filter */}
            <select
              className="reg-rep-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              <option value="Cardiology">Cardiology</option>
              <option value="General Surgery">General Surgery</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Gynecology & Obstetrics">Gynecology & Obstetrics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Urology">Urology</option>
              <option value="General Medicine">General Medicine</option>
            </select>

            {/* 📥 EXPORT CSV BUTTON */}
            <button
              type="button"
              className="reg-rep-csv-btn"
              onClick={handleExportCSV}
              title="Download Patient Registry as CSV Excel spreadsheet"
            >
              <Icon name="LuDownload" size={14} /> Export CSV
            </button>

            {/* 🖨️ PRINT REGISTRY REPORT BUTTON */}
            <button
              type="button"
              className="reg-rep-export-btn"
              onClick={() => window.print()}
              title="Print official patient registry report"
            >
              <Icon name="LuPrinter" size={14} /> Print Report
            </button>
          </div>
        </div>

        {/* Table Wrap with guaranteed visible columns and sticky actions */}
        <div className="reg-rep-table-wrap">
          <table className="reg-rep-table">
            <thead>
              <tr>
                <th className="rep-col-uhid">UHID & Token</th>
                <th className="rep-col-name">Patient Name & Demographics</th>
                <th className="rep-col-cat">Category / Dept</th>
                <th className="rep-col-doctor">Consulting Doctor</th>
                <th className="rep-col-contact">Contact & City</th>
                <th className="rep-col-fee">Fee & Payment</th>
                <th className="rep-col-time">Reg. Time</th>
                <th className="rep-col-status">Live Status</th>
                <th className="rep-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="rep-no-data">
                    <Icon name="LuFolderSearch" size={36} />
                    <div className="rep-no-data-title">No patient records found</div>
                    <div className="rep-no-data-sub">Try adjusting your search query or filter selections.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const currentStatusObj =
                    STATUS_OPTIONS.find((s) => s.value === p.status) || STATUS_OPTIONS[0];

                  const tokenNumber = p.tokenNo || `T-${String(Math.abs((p.id || "").hashCode ? p.id.hashCode() % 40 : 12)).padStart(2, '0')}`;

                  return (
                    <tr key={p.uhid} className={p.status === "Cancelled" ? "rep-row-cancelled" : ""}>
                      {/* 1. UHID & Token */}
                      <td className="rep-col-uhid">
                        <div className="rep-uhid-block">
                          <button
                            type="button"
                            className="reg-rep-uhid-btn"
                            onClick={() => handleOpenView(p)}
                            title="Click to view full patient dossier"
                          >
                            <Icon name="LuClipboardList" size={13} />
                            <span>{p.uhid}</span>
                          </button>
                          <div className="rep-sub-badge-row">
                            <span className="rep-token-pill">Token #{tokenNumber}</span>
                            <span className="rep-type-pill">{p.patientType || "New"}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Patient Name & Demographics */}
                      <td className="rep-col-name">
                        <div className="rep-pat-name-clickable" onClick={() => handleOpenView(p)} title="Click to view full records">
                          {p.name}
                        </div>
                        <div className="reg-rep-demotext">
                          <span>{p.age} Yrs / {p.gender}</span>
                          {p.bloodGroup && <span className="rep-blood-chip">🩸 {p.bloodGroup}</span>}
                        </div>
                      </td>

                      {/* 3. Category & Department */}
                      <td className="rep-col-cat">
                        <span className={`reg-rep-pill reg-rep-pill--${(p.category || "OPD").toLowerCase()}`}>
                          {p.category || "OPD"}
                        </span>
                        <div className="rep-dept-text">{p.department}</div>
                      </td>

                      {/* 4. Consulting Doctor */}
                      <td className="rep-col-doctor">
                        <div className="rep-doctor-name">
                          <Icon name="LuStethoscope" size={13} className="rep-doc-icon" />
                          <span>{p.doctor}</span>
                        </div>
                        <div className="reg-rep-muted">
                          {p.category === "IPD" || p.status === "Admitted"
                            ? (p.bedNo ? `Bed: ${p.bedNo}` : "Ward Inpatient")
                            : "Chamber #104 (OPD)"}
                        </div>
                      </td>

                      {/* 5. Contact & City */}
                      <td className="rep-col-contact">
                        <div className="reg-rep-bold rep-phone-text">
                          <Icon name="LuPhone" size={12} /> {p.phone}
                        </div>
                        <div className="reg-rep-muted">{p.address || "Jaipur, RJ"}</div>
                      </td>

                      {/* 6. Fee & Payment */}
                      <td className="rep-col-fee">
                        <div className="rep-fee-amt">₹ {p.fee || p.totalFee || "350"}</div>
                        <div className="rep-fee-mode-badge">
                          <span className="rep-paid-tag">Paid ✓</span>
                          <span className="rep-mode-tag">{p.paymentMode || "CASH"}</span>
                        </div>
                      </td>

                      {/* 7. Registration Timestamp */}
                      <td className="rep-col-time rep-time-cell">
                        <div className="rep-time-main">{p.registeredAt?.split(" ")[1] || "10:30 AM"}</div>
                        <div className="rep-date-sub">{p.registeredAt?.split(" ")[0] || "2026-09-28"}</div>
                      </td>

                      {/* 8. Visit Status Badge with interactive change */}
                      <td className="rep-col-status">
                        <button
                          type="button"
                          className="rep-status-badge-btn"
                          style={{
                            color: currentStatusObj.color,
                            backgroundColor: currentStatusObj.bg,
                            borderColor: currentStatusObj.color + "55",
                          }}
                          onClick={() => handleOpenStatusModal(p)}
                          title="Click to change live patient status"
                        >
                          <span
                            className="rep-status-dot"
                            style={{ backgroundColor: currentStatusObj.color }}
                          />
                          <span>{p.status || "Waiting"}</span>
                          <Icon name="LuChevronDown" size={12} />
                        </button>
                      </td>

                      {/* 9. ACTIONS COLUMN - PROPERLY VISIBLE, STICKY & HIGH-CONTRAST */}
                      <td className="rep-col-actions">
                        <div className="rep-actions-cell">
                          {/* 1. VIEW DOSSIER (All Roles) */}
                          <button
                            type="button"
                            className="rep-action-btn rep-action-btn--view"
                            onClick={() => handleOpenView(p)}
                            title="View Full Patient Records & EMR Dossier"
                          >
                            <Icon name="LuEye" size={15} />
                            <span className="rep-btn-label">View</span>
                          </button>

                          {/* 2. EDIT RECORD (Reception & Admin) */}
                          <button
                            type="button"
                            className={`rep-action-btn rep-action-btn--edit ${!canEdit ? "rep-action-btn--disabled" : ""}`}
                            onClick={() => handleOpenEdit(p)}
                            title={
                              canEdit
                                ? "Edit Patient Details"
                                : `🔒 Edit Locked: Requires Reception or Admin`
                            }
                          >
                            <Icon name="LuSquarePen" size={15} />
                          </button>

                          {/* 3. CHANGE STATUS */}
                          <button
                            type="button"
                            className="rep-action-btn rep-action-btn--status"
                            onClick={() => handleOpenStatusModal(p)}
                            title="Update Visit Status"
                          >
                            <Icon name="LuRefreshCw" size={15} />
                          </button>

                          {/* 4. PRINT REGISTRATION SLIP */}
                          <button
                            type="button"
                            className="rep-action-btn rep-action-btn--print"
                            onClick={() => handleOpenSlip(p)}
                            title="Print OPD Registration Slip"
                          >
                            <Icon name="LuPrinter" size={15} />
                          </button>

                          {/* 5. DELETE / CANCEL */}
                          <button
                            type="button"
                            className={`rep-action-btn rep-action-btn--delete ${!canDelete ? "rep-action-btn--delete-restricted" : ""}`}
                            onClick={() => handleOpenDelete(p)}
                            title={canDelete ? "Delete Record Permanently" : "Cancel Registration"}
                          >
                            <Icon name={canDelete ? "LuTrash2" : "LuBan"} size={15} />
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

      {/* ================= MODAL 1: VIEW PATIENT DOSSIER (COMPREHENSIVE MULTI-TAB) ================= */}
      {viewModalOpen && selectedPatient && (() => {
        const currentStatusInfo = STATUS_OPTIONS.find((s) => s.value === selectedPatient.status) || STATUS_OPTIONS[0];
        const vitals = selectedPatient.vitals || {
          bp: "120/80 mmHg",
          pulse: "74 bpm",
          temp: "98.4 °F",
          spo2: "99%",
          weight: "68 kg",
          height: "172 cm",
          bmi: "23.0 (Normal)",
          allergies: "None Reported (NKDA)",
          sugar: "105 mg/dL",
          triage: "Standard (Green)"
        };

        return (
        <div className="rep-modal-overlay" onClick={() => setViewModalOpen(false)}>
          <div className="rep-modal-box rep-modal-box--wide rep-modal-dossier" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="rep-modal-head">
              <div className="rep-modal-head-title">
                <Icon name="LuHospital" size={18} />
                <span>Hospital Patient Master Dossier & Medical Record</span>
              </div>
              <div className="rep-modal-head-right">
                <button
                  type="button"
                  className="rep-modal-head-action-btn"
                  onClick={() => window.print()}
                  title="Print Complete Patient Medical Dossier"
                >
                  <Icon name="LuPrinter" size={14} /> Print Full Dossier
                </button>
                <button type="button" className="rep-modal-close" onClick={() => setViewModalOpen(false)}>
                  <Icon name="LuX" size={18} />
                </button>
              </div>
            </div>

            <div className="rep-dossier-body">
              {/* ——— Header Profile Bar ——— */}
              <div className="rep-dossier-header-bar">
                <div className="rep-dossier-avatar">
                  <Icon name="LuUser" size={32} />
                </div>
                <div className="rep-dossier-main-info">
                  <div className="rep-dossier-title-row">
                    <h3 className="rep-dossier-name">{selectedPatient.name}</h3>
                    <span className="rep-dossier-uhid-badge">{selectedPatient.uhid}</span>
                    <span className={`reg-rep-pill reg-rep-pill--${(selectedPatient.category || "OPD").toLowerCase()}`}>
                      {selectedPatient.category || "OPD"}
                    </span>
                    <span className="rep-type-pill">{selectedPatient.patientType || "New Patient"}</span>
                  </div>
                  <div className="rep-dossier-meta">
                    <span><strong>PID:</strong> {selectedPatient.id}</span>
                    <span><strong>Age/Gender:</strong> {selectedPatient.age} Yrs / {selectedPatient.gender}</span>
                    <span><strong>Blood:</strong> {selectedPatient.bloodGroup || "O+"}</span>
                    <span><strong>Phone:</strong> {selectedPatient.phone}</span>
                    <span><strong>Department:</strong> {selectedPatient.department}</span>
                    <span><strong>Doctor:</strong> {selectedPatient.doctor}</span>
                  </div>
                </div>
                <div className="rep-dossier-status-col">
                  <span
                    className="rep-status-badge-btn rep-status-badge-lg"
                    style={{
                      color: currentStatusInfo.color,
                      backgroundColor: currentStatusInfo.bg,
                      borderColor: currentStatusInfo.color + "55",
                      cursor: "default",
                    }}
                  >
                    <span className="rep-status-dot" style={{ backgroundColor: currentStatusInfo.color }} />
                    {selectedPatient.status || "Waiting"}
                  </span>
                  <span className="rep-dossier-token-tag">Token #{selectedPatient.tokenNo || "T-04"}</span>
                </div>
              </div>

              {/* ——— Dossier Tabs Navigation ——— */}
              <div className="rep-dossier-tabs-nav">
                <button
                  type="button"
                  className={`rep-dossier-tab-btn ${activeDossierTab === "demographics" ? "active" : ""}`}
                  onClick={() => setActiveDossierTab("demographics")}
                >
                  <Icon name="LuUserCheck" size={15} />
                  <span>1. Demographics & Profile</span>
                </button>
                <button
                  type="button"
                  className={`rep-dossier-tab-btn ${activeDossierTab === "registration" ? "active" : ""}`}
                  onClick={() => setActiveDossierTab("registration")}
                >
                  <Icon name="LuClipboardList" size={15} />
                  <span>2. Registration & Allocation</span>
                </button>
                <button
                  type="button"
                  className={`rep-dossier-tab-btn ${activeDossierTab === "vitals" ? "active" : ""}`}
                  onClick={() => setActiveDossierTab("vitals")}
                >
                  <Icon name="LuActivity" size={15} />
                  <span>3. Triage & Vitals</span>
                </button>
                <button
                  type="button"
                  className={`rep-dossier-tab-btn ${activeDossierTab === "medical" ? "active" : ""}`}
                  onClick={() => setActiveDossierTab("medical")}
                >
                  <Icon name="LuStethoscope" size={15} />
                  <span>4. Clinical History & Rx</span>
                </button>
                <button
                  type="button"
                  className={`rep-dossier-tab-btn ${activeDossierTab === "billing" ? "active" : ""}`}
                  onClick={() => setActiveDossierTab("billing")}
                >
                  <Icon name="LuIndianRupee" size={15} />
                  <span>5. Billing & Receipts</span>
                </button>
                <button
                  type="button"
                  className={`rep-dossier-tab-btn ${activeDossierTab === "timeline" ? "active" : ""}`}
                  onClick={() => setActiveDossierTab("timeline")}
                >
                  <Icon name="LuHistory" size={15} />
                  <span>6. Audit & History</span>
                </button>
              </div>

              {/* ——— TAB 1: DEMOGRAPHICS & PROFILE ——— */}
              {activeDossierTab === "demographics" && (
                <div className="rep-dossier-tab-content">
                  <div className="rep-dossier-section-title">
                    <Icon name="LuUser" size={15} /> Personal Demographics & Contact Information
                  </div>
                  <table className="rep-dossier-detail-table">
                    <tbody>
                      <tr>
                        <th>UHID Number</th>
                        <td style={{ fontFamily: "monospace", color: "#1d4ed8", fontWeight: 800 }}>{selectedPatient.uhid}</td>
                        <th>Hospital Patient ID</th>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{selectedPatient.id}</td>
                      </tr>
                      <tr>
                        <th>Patient Full Name</th>
                        <td><strong>{selectedPatient.name}</strong></td>
                        <th>Father / Guardian Name</th>
                        <td>{selectedPatient.guardian || selectedPatient.guardianName || selectedPatient.fatherName || "Sunil Gupta"}</td>
                      </tr>
                      <tr>
                        <th>Age & Date of Birth</th>
                        <td>{selectedPatient.age} Years (Approx DOB: {2026 - (parseInt(selectedPatient.age) || 30)}-01-15)</td>
                        <th>Gender & Marital Status</th>
                        <td>{selectedPatient.gender} • {selectedPatient.maritalStatus || "Married"}</td>
                      </tr>
                      <tr>
                        <th>Blood Group</th>
                        <td><span className="rep-blood-badge">🩸 {selectedPatient.bloodGroup || "O+"}</span></td>
                        <th>Occupation</th>
                        <td>{selectedPatient.occupation || "Service / Private"}</td>
                      </tr>
                      <tr>
                        <th>Primary Contact No.</th>
                        <td><strong>{selectedPatient.phone}</strong></td>
                        <th>Email Address</th>
                        <td>{selectedPatient.email || `${(selectedPatient.name || "patient").toLowerCase().replace(/\s+/g, ".")}@example.com`}</td>
                      </tr>
                      <tr>
                        <th>Residential Address</th>
                        <td colSpan={3}>{selectedPatient.address || "B-42, Civil Lines, Jaipur, Rajasthan - 302006"}</td>
                      </tr>
                      <tr>
                        <th>ID Proof Type</th>
                        <td>{selectedPatient.idProofType || "Aadhaar National ID Card"}</td>
                        <th>ID Number</th>
                        <td style={{ fontFamily: "monospace" }}>{selectedPatient.idProofNo || `XXXX-XXXX-${(selectedPatient.uhid || "00481").slice(-4)}`}</td>
                      </tr>
                      <tr>
                        <th>Emergency Contact</th>
                        <td>{selectedPatient.emergencyName || selectedPatient.guardian || "Family Member"}</td>
                        <th>Emergency Phone</th>
                        <td><strong>{selectedPatient.emergencyPhone || selectedPatient.phone}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* ——— TAB 2: REGISTRATION & ALLOCATION ——— */}
              {activeDossierTab === "registration" && (
                <div className="rep-dossier-tab-content">
                  <div className="rep-dossier-section-title">
                    <Icon name="LuHospital" size={15} /> Hospital Registration & Doctor Chamber Allocation
                  </div>
                  <table className="rep-dossier-detail-table">
                    <tbody>
                      <tr>
                        <th>Registration Type</th>
                        <td>
                          <span className={`reg-rep-pill reg-rep-pill--${(selectedPatient.category || "OPD").toLowerCase()}`}>
                            {selectedPatient.category || "OPD"} Consultation
                          </span>
                        </td>
                        <th>Visit Type</th>
                        <td>
                          <span className="rep-type-pill-lg">{selectedPatient.patientType || "New Registration"}</span>
                        </td>
                      </tr>
                      <tr>
                        <th>Clinical Department</th>
                        <td><strong>{selectedPatient.department}</strong></td>
                        <th>Attending Consultant</th>
                        <td><strong>{selectedPatient.doctor}</strong></td>
                      </tr>
                      <tr>
                        <th>OPD Chamber / Room</th>
                        <td><strong>Chamber #104 (OPD Block A - 1st Floor)</strong></td>
                        <th>Queue Token Number</th>
                        <td style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14, color: "#1d4ed8" }}>
                          Token #{selectedPatient.tokenNo || "T-04"}
                        </td>
                      </tr>
                      {(selectedPatient.category === "IPD" || selectedPatient.status === "Admitted") && (
                        <tr>
                          <th>IPD Ward & Bed</th>
                          <td><strong style={{ color: "#7c3aed" }}>{selectedPatient.bedNo || "ICU-Bed-04 (General Ward B)"}</strong></td>
                          <th>Admission Date & Time</th>
                          <td>{selectedPatient.registeredAt}</td>
                        </tr>
                      )}
                      <tr>
                        <th>Chief Complaints / Reason</th>
                        <td colSpan={3}>
                          {selectedPatient.complaints || "Routine medical consultation, mild fever, weakness and periodic health evaluation."}
                        </td>
                      </tr>
                      <tr>
                        <th>Registration Staff</th>
                        <td>{staffName} (Reception Counter #1)</td>
                        <th>Registration Timestamp</th>
                        <td style={{ fontFamily: "monospace" }}>{selectedPatient.registeredAt}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* ——— TAB 3: TRIAGE & VITALS ——— */}
              {activeDossierTab === "vitals" && (
                <div className="rep-dossier-tab-content">
                  <div className="rep-dossier-section-title">
                    <Icon name="LuActivity" size={15} /> Patient Triage Vitals & Baseline Physical Metrics
                  </div>
                  <div className="rep-vitals-grid">
                    <div className="rep-vital-box">
                      <div className="rep-vital-icon rep-vital-icon--red">
                        <Icon name="LuHeart" size={20} />
                      </div>
                      <div className="rep-vital-info">
                        <span className="rep-vital-label">Blood Pressure</span>
                        <span className="rep-vital-value">{vitals.bp || "120/80 mmHg"}</span>
                        <span className="rep-vital-status rep-vital-status--good">Normal Range</span>
                      </div>
                    </div>

                    <div className="rep-vital-box">
                      <div className="rep-vital-icon rep-vital-icon--blue">
                        <Icon name="LuActivity" size={20} />
                      </div>
                      <div className="rep-vital-info">
                        <span className="rep-vital-label">Pulse / Heart Rate</span>
                        <span className="rep-vital-value">{vitals.pulse || "74 bpm"}</span>
                        <span className="rep-vital-status rep-vital-status--good">Regular Rhythm</span>
                      </div>
                    </div>

                    <div className="rep-vital-box">
                      <div className="rep-vital-icon rep-vital-icon--amber">
                        <Icon name="LuThermometer" size={20} />
                      </div>
                      <div className="rep-vital-info">
                        <span className="rep-vital-label">Body Temperature</span>
                        <span className="rep-vital-value">{vitals.temp || "98.4 °F"}</span>
                        <span className="rep-vital-status rep-vital-status--good">Afebrile</span>
                      </div>
                    </div>

                    <div className="rep-vital-box">
                      <div className="rep-vital-icon rep-vital-icon--cyan">
                        <Icon name="LuWind" size={20} />
                      </div>
                      <div className="rep-vital-info">
                        <span className="rep-vital-label">SpO2 Oxygen</span>
                        <span className="rep-vital-value">{vitals.spo2 || "99 %"}</span>
                        <span className="rep-vital-status rep-vital-status--good">Adequate Saturation</span>
                      </div>
                    </div>

                    <div className="rep-vital-box">
                      <div className="rep-vital-icon rep-vital-icon--purple">
                        <Icon name="LuScale" size={20} />
                      </div>
                      <div className="rep-vital-info">
                        <span className="rep-vital-label">Weight & Height</span>
                        <span className="rep-vital-value">{vitals.weight || "68 kg"} / {vitals.height || "172 cm"}</span>
                        <span className="rep-vital-status">BMI: {vitals.bmi || "23.0 (Normal)"}</span>
                      </div>
                    </div>

                    <div className="rep-vital-box">
                      <div className="rep-vital-icon rep-vital-icon--emerald">
                        <Icon name="LuDroplets" size={20} />
                      </div>
                      <div className="rep-vital-info">
                        <span className="rep-vital-label">Blood Sugar (RBS)</span>
                        <span className="rep-vital-value">{vitals.sugar || "105 mg/dL"}</span>
                        <span className="rep-vital-status rep-vital-status--good">Euglycemic</span>
                      </div>
                    </div>
                  </div>

                  <table className="rep-dossier-detail-table" style={{ marginTop: 14 }}>
                    <tbody>
                      <tr>
                        <th>Known Allergies</th>
                        <td style={{ color: "#dc2626", fontWeight: 700 }}>
                          <Icon name="LuShieldAlert" size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                          {vitals.allergies || "No Known Drug Allergies (NKDA)"}
                        </td>
                        <th>Triage Priority</th>
                        <td>
                          <span className="rep-triage-badge rep-triage-badge--green">
                            ● Priority 3 - Standard Outpatient Care
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* ——— TAB 4: CLINICAL HISTORY & RX ——— */}
              {activeDossierTab === "medical" && (
                <div className="rep-dossier-tab-content">
                  <div className="rep-dossier-section-title">
                    <Icon name="LuFileHeart" size={15} /> Clinical Assessment, Diagnoses & Orders
                  </div>
                  <table className="rep-dossier-detail-table">
                    <tbody>
                      <tr>
                        <th>Primary Diagnosis</th>
                        <td><strong>Essential Hypertension & Mild Upper Respiratory Infection</strong></td>
                        <th>ICD-10 Code</th>
                        <td style={{ fontFamily: "monospace" }}>I10 / J06.9</td>
                      </tr>
                      <tr>
                        <th>Clinical History</th>
                        <td colSpan={3}>
                          Patient presented with mild headache and intermittent fatigue for past 4 days. No history of chest pain or palpitations. Non-smoker.
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="rep-dossier-section-title" style={{ marginTop: 14 }}>
                    <Icon name="LuPill" size={15} /> Prescribed Medications (Rx)
                  </div>
                  <table className="rep-dossier-rx-table">
                    <thead>
                      <tr>
                        <th>Medicine Name</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Tab. Telmisartan 40mg</strong></td>
                        <td>1 Tablet</td>
                        <td>Once Daily (1-0-0)</td>
                        <td>30 Days</td>
                        <td>After Breakfast</td>
                      </tr>
                      <tr>
                        <td><strong>Tab. Paracetamol 650mg</strong></td>
                        <td>1 Tablet</td>
                        <td>As Needed (SOS)</td>
                        <td>3 Days</td>
                        <td>After Meals (If fever)</td>
                      </tr>
                      <tr>
                        <td><strong>Cap. Vitamin D3 60,000 IU</strong></td>
                        <td>1 Capsule</td>
                        <td>Once Weekly</td>
                        <td>8 Weeks</td>
                        <td>With Warm Milk</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="rep-dossier-section-title" style={{ marginTop: 14 }}>
                    <Icon name="LuMicroscope" size={15} /> Diagnostic Investigations Ordered
                  </div>
                  <div className="rep-tests-chips">
                    <span className="rep-test-chip">✓ Complete Blood Count (CBC)</span>
                    <span className="rep-test-chip">✓ Lipid Profile Screening</span>
                    <span className="rep-test-chip">✓ Kidney Function Test (KFT)</span>
                    <span className="rep-test-chip">✓ 12-Lead ECG</span>
                  </div>
                </div>
              )}

              {/* ——— TAB 5: BILLING & RECEIPTS ——— */}
              {activeDossierTab === "billing" && (
                <div className="rep-dossier-tab-content">
                  <div className="rep-dossier-section-title">
                    <Icon name="LuIndianRupee" size={15} /> Fee Collection & Payment Receipt Breakdown
                  </div>
                  <table className="rep-dossier-detail-table">
                    <tbody>
                      <tr>
                        <th>Doctor Consultation Fee</th>
                        <td>₹ {selectedPatient.consultationFee || "300"}.00</td>
                        <th>Registration & File Fee</th>
                        <td>₹ {selectedPatient.registrationFee || "50"}.00</td>
                      </tr>
                      <tr>
                        <th>Nursing / Triage Charges</th>
                        <td>₹ 0.00 (Complimentary)</td>
                        <th>GST / Hospital Taxes (0%)</th>
                        <td>₹ 0.00 (Exempt)</td>
                      </tr>
                      <tr>
                        <th>Total Billed Amount</th>
                        <td><strong style={{ fontSize: 15, color: "#059669" }}>₹ {selectedPatient.fee || selectedPatient.totalFee || "350"}.00</strong></td>
                        <th>Payment Status</th>
                        <td>
                          <span className="rep-paid-badge-lg">
                            <Icon name="LuCheckCircle" size={14} /> PAID IN FULL
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <th>Payment Mode</th>
                        <td><strong>{selectedPatient.paymentMode || "CASH"}</strong></td>
                        <th>Official Receipt No.</th>
                        <td style={{ fontFamily: "monospace", fontWeight: 800, color: "#1d4ed8" }}>
                          {selectedPatient.receiptNo || `REC-2026-${(selectedPatient.uhid || "9812").slice(-4)}`}
                        </td>
                      </tr>
                      <tr>
                        <th>Counter Cashier</th>
                        <td>{staffName}</td>
                        <th>Transaction Timestamp</th>
                        <td style={{ fontFamily: "monospace" }}>{selectedPatient.registeredAt}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* ——— TAB 6: AUDIT TRAIL & TIMELINE ——— */}
              {activeDossierTab === "timeline" && (
                <div className="rep-dossier-tab-content">
                  <div className="rep-dossier-section-title">
                    <Icon name="LuHistory" size={15} /> Patient Journey & Live Audit Trail Log
                  </div>
                  <div className="rep-dossier-timeline">
                    {/* Live Current Status */}
                    <div className="rep-timeline-item">
                      <div className={`rep-timeline-dot rep-timeline-dot--${
                        selectedPatient.status === "Waiting" ? "blue" :
                        selectedPatient.status === "In Consultation" ? "purple" :
                        selectedPatient.status === "Completed" || selectedPatient.status === "Discharged" ? "green" :
                        selectedPatient.status === "Cancelled" ? "red" : "blue"
                      }`} />
                      <div className="rep-timeline-head">
                        <span className="rep-timeline-title">
                          Status: {currentStatusInfo.label}
                        </span>
                        <span className="rep-timeline-date">
                          {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="rep-timeline-desc">
                        {selectedPatient.statusRemarks || currentStatusInfo.desc}
                      </div>
                    </div>

                    {/* Vitals Recorded */}
                    <div className="rep-timeline-item">
                      <div className="rep-timeline-dot rep-timeline-dot--green" />
                      <div className="rep-timeline-head">
                        <span className="rep-timeline-title">Triage Vitals Recorded by Staff Nurse</span>
                        <span className="rep-timeline-date">{selectedPatient.registeredAt}</span>
                      </div>
                      <div className="rep-timeline-desc">
                        BP: {vitals.bp}, Pulse: {vitals.pulse}, Temp: {vitals.temp}, SpO2: {vitals.spo2}. Patient cleared for OPD chamber.
                      </div>
                    </div>

                    {/* Token & Slip Issued */}
                    <div className="rep-timeline-item">
                      <div className="rep-timeline-dot rep-timeline-dot--blue" />
                      <div className="rep-timeline-head">
                        <span className="rep-timeline-title">Token #{selectedPatient.tokenNo || "T-04"} & OPD Slip Issued</span>
                        <span className="rep-timeline-date">{selectedPatient.registeredAt}</span>
                      </div>
                      <div className="rep-timeline-desc">
                        Consultation token issued for {selectedPatient.department} — Dr. {selectedPatient.doctor}. Chamber #104.
                      </div>
                    </div>

                    {/* Patient Registration */}
                    <div className="rep-timeline-item">
                      <div className="rep-timeline-dot rep-timeline-dot--blue" />
                      <div className="rep-timeline-head">
                        <span className="rep-timeline-title">Patient Registered at Front Counter</span>
                        <span className="rep-timeline-date">{selectedPatient.registeredAt}</span>
                      </div>
                      <div className="rep-timeline-desc">
                        {selectedPatient.category || "OPD"} registration created by {staffName}. UHID {selectedPatient.uhid} allotted. Fee ₹ {selectedPatient.fee || selectedPatient.totalFee || "350"}.00 collected via {selectedPatient.paymentMode || "CASH"}.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dossier Footer Actions */}
            <div className="rep-modal-footer">
              <button
                type="button"
                className="rep-btn-print-slip"
                onClick={() => {
                  setViewModalOpen(false);
                  handleOpenSlip(selectedPatient);
                }}
              >
                <Icon name="LuPrinter" size={15} /> Print OPD Slip
              </button>
              {canEdit && (
                <button
                  type="button"
                  className="rep-btn-edit-action"
                  onClick={() => {
                    setViewModalOpen(false);
                    handleOpenEdit(selectedPatient);
                  }}
                >
                  <Icon name="LuSquarePen" size={15} /> Edit Record
                </button>
              )}
              {canChangeStatus && (
                <button
                  type="button"
                  className="rep-btn-save"
                  onClick={() => {
                    setViewModalOpen(false);
                    handleOpenStatusModal(selectedPatient);
                  }}
                >
                  <Icon name="LuRefreshCw" size={15} /> Update Status
                </button>
              )}
              <button type="button" className="rep-btn-close" onClick={() => setViewModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ================= MODAL 2: EDIT PATIENT RECORD ================= */}
      {editModalOpen && selectedPatient && (
        <div className="rep-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="rep-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="rep-modal-head">
              <div className="rep-modal-head-title">
                <Icon name="LuSquarePen" size={18} />
                <span>Edit Patient Record (UHID: {selectedPatient.uhid})</span>
              </div>
              <button type="button" className="rep-modal-close" onClick={() => setEditModalOpen(false)}>
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="rep-edit-form">
              <div className="rep-edit-notice">
                <Icon name="LuInfo" size={15} />
                <span>
                  Authorized Receptionist: <strong>{staffName}</strong>. Changes will be saved to hospital records.
                </span>
              </div>

              <div className="rep-edit-grid">
                <div className="rep-form-group rep-col-span-2">
                  <label>Full Patient Name*</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="rep-form-group">
                  <label>Mobile Number*</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="rep-form-group">
                  <label>Age (Years)*</label>
                  <input
                    type="number"
                    value={editFormData.age}
                    onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                    required
                  />
                </div>

                <div className="rep-form-group">
                  <label>Gender*</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="rep-form-group">
                  <label>Blood Group</label>
                  <select
                    value={editFormData.bloodGroup}
                    onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                  >
                    <option value="">Select</option>
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

                <div className="rep-form-group rep-col-span-2">
                  <label>Residential Address</label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  />
                </div>

                <div className="rep-form-group">
                  <label>Department</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  >
                    <option>General Medicine</option>
                    <option>Cardiology</option>
                    <option>Orthopedics</option>
                    <option>Gynecology & Obstetrics</option>
                    <option>General Surgery</option>
                    <option>Pediatrics</option>
                    <option>Urology</option>
                  </select>
                </div>

                <div className="rep-form-group">
                  <label>Consulting Doctor</label>
                  <input
                    type="text"
                    value={editFormData.doctor}
                    onChange={(e) => setEditFormData({ ...editFormData, doctor: e.target.value })}
                  />
                </div>
              </div>

              <div className="rep-modal-footer">
                <button type="submit" className="rep-btn-save">
                  <Icon name="LuSave" size={15} /> Save & Update Patient
                </button>
                <button type="button" className="rep-btn-close" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: CHANGE STATUS ================= */}
      {statusModalOpen && selectedPatient && (
        <div className="rep-modal-overlay" onClick={() => setStatusModalOpen(false)}>
          <div className="rep-modal-box rep-modal-box--sm" onClick={(e) => e.stopPropagation()}>
            <div className="rep-modal-head">
              <div className="rep-modal-head-title">
                <Icon name="LuRefreshCw" size={18} />
                <span>Update Patient Visit Status</span>
              </div>
              <button type="button" className="rep-modal-close" onClick={() => setStatusModalOpen(false)}>
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="rep-status-body">
              <div className="rep-status-pat-name">
                Patient: <strong>{selectedPatient.name}</strong> ({selectedPatient.uhid})
              </div>

              <label className="rep-status-label">Select Real-Time Visit Status:</label>
              <div className="rep-status-options-grid">
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    className={`rep-status-option-btn ${newStatus === st.value ? "rep-status-option-btn--active" : ""}`}
                    style={{
                      borderColor: newStatus === st.value ? st.color : "#cbd5e1",
                      backgroundColor: newStatus === st.value ? st.bg : "#ffffff",
                      color: newStatus === st.value ? st.color : "#334155",
                    }}
                    onClick={() => setNewStatus(st.value)}
                  >
                    <Icon name={st.icon} size={16} />
                    <div className="rep-status-btn-txt">
                      <span className="rep-status-btn-main">{st.label}</span>
                      <span className="rep-status-btn-desc">{st.desc}</span>
                    </div>
                    {newStatus === st.value && <span className="rep-status-check">✓</span>}
                  </button>
                ))}
              </div>

              <div className="rep-form-group" style={{ marginTop: 14 }}>
                <label>Status Change Remarks / Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Patient called into chamber, sent for X-ray..."
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="rep-modal-footer">
              <button type="button" className="rep-btn-save" onClick={handleSaveStatus}>
                <Icon name="LuCheck" size={15} /> Apply Status Update
              </button>
              <button type="button" className="rep-btn-close" onClick={() => setStatusModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: DELETE / CANCEL CONFIRMATION ================= */}
      {deleteModalOpen && selectedPatient && (
        <div className="rep-modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="rep-modal-box rep-modal-box--sm" onClick={(e) => e.stopPropagation()}>
            <div className="rep-modal-head" style={{ background: canDelete ? "#991b1b" : "#b45309" }}>
              <div className="rep-modal-head-title">
                <Icon name={canDelete ? "LuAlertTriangle" : "LuShieldAlert"} size={18} />
                <span>{canDelete ? "Confirm Patient Deletion" : "Hospital Deletion Security Policy"}</span>
              </div>
              <button type="button" className="rep-modal-close" onClick={() => setDeleteModalOpen(false)}>
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="rep-delete-body">
              {canDelete ? (
                <>
                  <p className="rep-delete-warning">
                    ⚠️ <strong>Warning:</strong> You are about to permanently delete the patient record for:
                  </p>
                  <div className="rep-delete-patient-tag">
                    <strong>{selectedPatient.name}</strong> ({selectedPatient.uhid})
                  </div>
                  <p className="rep-delete-sub">
                    This action will purge this registration entry from the hospital audit database. Only Hospital
                    Administrators have permission to perform this action.
                  </p>
                </>
              ) : (
                <>
                  <div className="rep-access-denied-badge">
                    <Icon name="LuLock" size={26} />
                    <h4>Front Desk Reception Policy</h4>
                  </div>
                  <p className="rep-delete-sub">
                    Under hospital audit & medico-legal regulations, front desk staff (<strong>{ROLE_LABELS[currentRole]}</strong>)
                    cannot permanently purge records from the hospital database.
                  </p>
                  <p className="rep-delete-sub">
                    Instead, you can safely <strong>Cancel / Void this registration</strong> (status will be marked as "Cancelled" and audit logged).
                  </p>
                </>
              )}
            </div>

            <div className="rep-modal-footer">
              {canDelete ? (
                <button type="button" className="rep-btn-delete-confirm" onClick={handleConfirmDelete}>
                  <Icon name="LuTrash2" size={15} /> Yes, Delete Permanently
                </button>
              ) : (
                <button type="button" className="rep-btn-cancel-status" onClick={handleConfirmDelete}>
                  <Icon name="LuXCircle" size={15} /> Mark as Cancelled Instead
                </button>
              )}
              <button type="button" className="rep-btn-close" onClick={() => setDeleteModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: PRINTABLE SLIP MODAL (FUNCTIONING PRINT) ================= */}
      {slipModalOpen && selectedPatient && (
        <div className="rep-modal-overlay" onClick={() => setSlipModalOpen(false)}>
          <div className="rep-modal-box rep-modal-box--slip" onClick={(e) => e.stopPropagation()}>
            <div className="rep-modal-head">
              <div className="rep-modal-head-title">
                <Icon name="LuPrinter" size={18} />
                <span>Hospital Registration Slip (Reprint Receipt)</span>
              </div>
              <button type="button" className="rep-modal-close" onClick={() => setSlipModalOpen(false)}>
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="rep-slip-paper" id="reprintSlipContent">
              <div className="rep-slip-head">
                <h3 className="rep-hosp-title">METRO MULTISPECIALITY HOSPITAL & TRAUMA CENTRE</h3>
                <div className="rep-hosp-sub">NABH ACCREDITED TERTIARY CARE FACILITY</div>
                <div className="rep-hosp-address">Vikas Nagar, Sector 12, Lucknow | 24x7 Emergency: 0522-2987654</div>
              </div>

              <div className="rep-slip-barcode">
                <div className="rep-barcode-lines">||||||| |||| ||||| |||||| |||| |||||||| ||||| |||||||</div>
                <div className="rep-barcode-text">UHID: {selectedPatient.uhid} | ID: {selectedPatient.id}</div>
              </div>

              <table className="rep-slip-table">
                <tbody>
                  <tr>
                    <th>Patient Name:</th>
                    <td><strong>{selectedPatient.name}</strong></td>
                    <th>Age / Gender:</th>
                    <td>{selectedPatient.age} Yrs / {selectedPatient.gender}</td>
                  </tr>
                  <tr>
                    <th>UHID No:</th>
                    <td className="rep-text-blue font-bold">{selectedPatient.uhid}</td>
                    <th>Mobile No:</th>
                    <td>{selectedPatient.phone}</td>
                  </tr>
                  <tr>
                    <th>Department:</th>
                    <td>{selectedPatient.department}</td>
                    <th>Consultant Doctor:</th>
                    <td><strong>{selectedPatient.doctor}</strong></td>
                  </tr>
                  <tr>
                    <th>Reg. Category:</th>
                    <td>{selectedPatient.category || "OPD Consultation"}</td>
                    <th>Visit Status:</th>
                    <td>{selectedPatient.status || "Waiting in Queue"}</td>
                  </tr>
                  <tr>
                    <th>Doctor Chamber:</th>
                    <td><strong>Chamber #104 (OPD Block A)</strong></td>
                    <th>Cashier Desk:</th>
                    <td>{staffName}</td>
                  </tr>
                </tbody>
              </table>

              <div className="rep-slip-receipt-row">
                <span>Fee Collected: <strong>₹ 350.00 (PAID IN FULL - CASH)</strong></span>
                <span>Official Receipt No: <strong>REC-2026-9812</strong></span>
              </div>

              <div className="rep-slip-terms">
                • Valid for 7 days consultation with Dr. {selectedPatient.doctor}.<br />
                • Please present this slip at OPD Chamber #104 / Nursing Station.<br />
                • For follow-up or reports, bring this UHID card.
              </div>
            </div>

            <div className="rep-modal-footer">
              <button type="button" className="rep-btn-print-slip" onClick={() => window.print()}>
                <Icon name="LuPrinter" size={15} /> Print Slip Now (A4 / Thermal)
              </button>
              <button type="button" className="rep-btn-close" onClick={() => setSlipModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
