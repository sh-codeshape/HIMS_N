import React, { useState, useEffect, useCallback } from "react";
import Icon from "../../../components/common/Icon.jsx";
import opdService from "../../../api/services/opdService";
import patientService from "../../../api/services/patientService";
import { useAuth } from "../../../auth";
import { ROLES } from "../../../auth/roles";
import "./OPDReportsView.css";

const OPD_STATUSES = [
  { value: "planned", label: "Planned", color: "#0284c7", bg: "#e0f2fe" },
  { value: "arrived", label: "In Consultation", color: "#1d4ed8", bg: "#dbeafe" },
  { value: "in_progress", label: "In Progress", color: "#0369a1", bg: "#d4eefb" },
  { value: "on_hold", label: "On Hold", color: "#d97706", bg: "#fefce8" },
  { value: "finished", label: "Completed", color: "#059669", bg: "#ecfdf5" },
  { value: "cancelled", label: "Cancelled", color: "#dc2626", bg: "#fef2f2" },
  { value: "entered_in_error", label: "Entered in Error", color: "#7c2d12", bg: "#ffe4cc" },
];
const getOpdStatus = (val) => OPD_STATUSES.find((s) => s.value === val) || OPD_STATUSES[0];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500];

const getInitials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

// ─── Export to Excel CSV ──────────────────────────────────────────────────────
const exportToExcel = (data) => {
  if (!data || !data.length) return;
  const headers = [
    "Token", "UHID", "Patient Name", "Gender", "Phone",
    "Doctor", "Department", "Chief Complaint", "Date", "Time", "Status"
  ];
  const rows = data.map((item) => [
    item.tokenNo || "",
    item.uhid || "",
    item.patientName || "",
    item.gender || "",
    item.phone || "",
    item.doctor || "",
    item.department || "",
    item.chiefComplaint || "",
    item.date || "",
    item.time || "",
    item.status || "",
  ]);
  const csv = "data:text/csv;charset=utf-8,\uFEFF"
    + [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");
  const a = document.createElement("a");
  a.href = encodeURI(csv);
  a.download = `OPD_Consultation_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export default function OPDReportsView() {
  const { user } = useAuth();
  const isSuperAdmin =
    user?.role === ROLES.SUPER_ADMIN ||
    (Array.isArray(user?.roles) && user.roles.includes(ROLES.SUPER_ADMIN));

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusRow, setStatusRow] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [printSlip, setPrintSlip] = useState(null);

  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(getTodayStr());
  const [toDate, setToDate] = useState(getTodayStr());

  const applyDateRange = useCallback(() => {
    if (fromDate && toDate && fromDate > toDate) {
      const swap = fromDate;
      setFromDate(toDate);
      setToDate(swap);
    }
    setCurrentPage(1);
  }, [fromDate, toDate]);

  const resetFilters = useCallback(() => {
    const today = getTodayStr();
    setFromDate(today);
    setToDate(today);
    setSearch("");
    setCurrentPage(1);
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await opdService.getReports({
        from: fromDate || undefined,
        to: toDate || undefined,
        page: currentPage,
        limit: rowsPerPage,
        sortBy: "started_at",
        sortOrder: "DESC",
      });

      const data = Array.isArray(res) ? res : res.data ?? res.rows ?? [];
      const meta = res.meta ?? {};

      const mappedRows = data.map((item) => ({
        id: item.id,
        patientId: item.patient_id,
        tokenNo: item.custom_fields?.opd_token || item.encounter_no,
        patientName:
          [item.first_name, item.last_name].filter(Boolean).join(" ") ||
          "Unknown",
        uhid: item.uhid,
        gender: item.gender || "-",
        phone: item.phone || "-",
        doctor:
          [item.doc_first_name, item.doc_last_name].filter(Boolean).join(" ") ||
          "Unknown Doc",
        department: item.department_name || "General",
        chiefComplaint: item.chief_complaint || "-",
        date: new Date(item.started_at).toLocaleDateString("en-IN"),
        time: new Date(item.started_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        rawStatus: item.status || "planned",
        status: getOpdStatus(item.status || "planned").label,
        dateOfBirth: item.date_of_birth,
        customFields: item.custom_fields || {},
      }));

      setRows(mappedRows);
      setTotal(meta.total ?? mappedRows.length);
    } catch (err) {
      console.error("Failed to load OPD reports:", err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, currentPage, rowsPerPage]);

  const openRecordView = async (row) => {
    setViewRow(row);
    setViewPatient(null);
    if (!row.patientId) return;
    try {
      setViewLoading(true);
      const patient = await patientService.getById(row.patientId);
      setViewPatient(patient);
    } catch (err) {
      console.warn("Could not fetch full patient profile, using report encounter data:", err);
    } finally {
      setViewLoading(false);
    }
  };

  const handleOpenPrintSlip = async (row) => {
    let patient = null;
    if (row.patientId) {
      try {
        patient = await patientService.getById(row.patientId);
      } catch (err) {
        console.warn("Patient details fetch fallback to row data:", err);
      }
    }

    const calculatedAge = patient?.age ?? (row.dateOfBirth
      ? Math.floor((Date.now() - new Date(row.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      : null);

    const address = patient?.address || [
      patient?.address_line1,
      patient?.city,
      patient?.state,
      patient?.pincode ? `(${patient.pincode})` : ""
    ].filter(Boolean).join(", ") || "Kota, Rajasthan";

    const customFields = patient?.custom_fields || row.customFields || {};
    const regFee = Number(customFields.registration_fee ?? 100);
    const consultFee = Number(customFields.consultation_fee ?? 400);
    const totalFee = Number(customFields.total_fee ?? (regFee + consultFee));
    const paymentMode = customFields.payment_type || customFields.payment_mode || "Cash / Counter";

    setPrintSlip({
      token: row.tokenNo || "—",
      uhid: patient?.uhid || row.uhid || "—",
      patientName: patient?.full_name || patient?.name || row.patientName,
      age: calculatedAge ? `${calculatedAge} Yrs` : (patient?.age ? `${patient.age} Yrs` : "—"),
      gender: (patient?.gender || row.gender || "—").toUpperCase(),
      phone: patient?.phone || patient?.mobile1 || row.phone || "—",
      bloodGroup: patient?.blood_group || patient?.bloodGroup || customFields.blood_group || "B+",
      category: customFields.visit_type || "General OPD",
      doctor: row.doctor || "Dr. On-Duty Consultant",
      department: row.department || "General Medicine",
      chamber: customFields.chamber || "OPD Chamber 04",
      date: row.date,
      time: row.time,
      status: row.status,
      chiefComplaint: row.chiefComplaint && row.chiefComplaint !== "-" ? row.chiefComplaint : "General consultation & clinical checkup",
      diagnosis: customFields.provisional_diagnosis || "Under clinical evaluation",
      address,
      regFee,
      consultFee,
      totalFee,
      paymentMode,
      paymentStatus: "PAID",
      receiptNo: `REC-OPD-${String(row.tokenNo || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6) || "1001"}`
    });
  };

  const handleStatusUpdate = async () => {
    if (!statusRow || !newStatus) return;
    try {
      setUpdatingStatus(true);
      await opdService.updateStatus(statusRow.id, newStatus);
      setStatusRow(null);
      await loadReports();
    } catch (err) {
      console.error("Failed to update OPD status:", err);
      window.alert(err?.response?.data?.error?.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Client-side search filter on top of server-paginated results
  const filtered = search
    ? rows.filter(
        (item) =>
          item.patientName?.toLowerCase().includes(search.toLowerCase()) ||
          item.uhid?.toLowerCase().includes(search.toLowerCase()) ||
          item.doctor?.toLowerCase().includes(search.toLowerCase()) ||
          item.tokenNo?.toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const patientTitle = viewPatient?.full_name || viewPatient?.name || viewRow?.patientName;

  return (
    <div className="opdr-page">

      {/* ── 1. PAGE HEADER ── */}
      <div className="opdr-header">
        <div className="opdr-header-left">
          <div className="opdr-header-icon">
            <Icon name="LuStethoscope" size={22} />
          </div>
          <div>
            <h1 className="opdr-title">OPD Consultation Report</h1>
            <p className="opdr-subtitle">
              Outpatient consultation register with date-range filtering
            </p>
          </div>
        </div>

        <div className="opdr-header-right">
          <div className="opdr-count-badge">
            <b className="opdr-count-num">{total}</b>
            <span className="opdr-count-lbl">
              Total<br />Records
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. FILTER & CONTROLS BAR ── */}
      <div className="opdr-filters-card">
        <div className="opdr-filter-left">
          <div className="opdr-field">
            <span className="opdr-field-label">From</span>
            <input
              className="opdr-input-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="opdr-field">
            <span className="opdr-field-label">To</span>
            <input
              className="opdr-input-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={applyDateRange}
            className="opdr-btn opdr-btn--navy"
            title="Apply Date Range"
          >
            <Icon name="LuFilter" size={15} /> Apply Range
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="opdr-btn opdr-btn--ghost"
            title="Reset Filters"
          >
            <Icon name="LuRefreshCw" size={14} /> Reset
          </button>
        </div>

        <div className="opdr-filter-right">
          <div className="opdr-search">
            <Icon name="LuSearch" size={15} />
            <input
              type="text"
              placeholder="Search token, patient, doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="opdr-search-clear"
                onClick={() => setSearch("")}
                title="Clear Search"
              >
                <Icon name="LuX" size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => exportToExcel(filtered)}
            className="opdr-btn opdr-btn--green"
            title="Export Records to Excel CSV"
          >
            <Icon name="LuDownload" size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* ── 3. TABLE CARD ── */}
      <div className="opdr-card">
        <div className="opdr-table-wrap">
          <table className="opdr-table">
            <thead>
              <tr>
                <th>TOKEN</th>
                <th>PATIENT NAME</th>
                <th>DOCTOR</th>
                <th>DEPARTMENT</th>
                <th>COMPLAINT</th>
                <th>DATE</th>
                <th>TIME</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="opdr-empty">
                    <div className="opdr-empty-ic">
                      <Icon name="LuRefreshCw" size={24} className="spin" />
                    </div>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--navy-800)" }}>Loading consultation records...</p>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((item) => {
                  const st = getOpdStatus(item.rawStatus);

                  return (
                    <tr key={item.id}>
                      {/* Token */}
                      <td>
                        <button
                          type="button"
                          onClick={() => openRecordView(item)}
                          className="opdr-token-link"
                          title="View Consultation Record"
                        >
                          {item.tokenNo}
                        </button>
                      </td>

                      {/* Patient Name */}
                      <td>
                        <div className="opdr-patient-cell">
                          <div className="opdr-avatar">{getInitials(item.patientName)}</div>
                          <div>
                            <button
                              type="button"
                              onClick={() => openRecordView(item)}
                              className="opdr-pname-link"
                              title="View Details"
                            >
                              {item.patientName}
                            </button>
                            <div className="opdr-uhid-sub">{item.uhid || "—"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="opdr-doc-name">{item.doctor}</td>

                      {/* Department */}
                      <td className="opdr-dept">{item.department}</td>

                      {/* Complaint */}
                      <td className="opdr-complaint" title={item.chiefComplaint}>
                        {item.chiefComplaint}
                      </td>

                      {/* Date */}
                      <td className="opdr-date">{item.date}</td>

                      {/* Time */}
                      <td className="opdr-time">{item.time}</td>

                      {/* Status */}
                      <td>
                        {isSuperAdmin ? (
                          <button
                            type="button"
                            className="opdr-status-badge opdr-status-btn"
                            style={{
                              background: st.bg,
                              color: st.color,
                              borderColor: st.color + "44",
                            }}
                            onClick={() => {
                              setStatusRow(item);
                              setNewStatus(item.rawStatus);
                            }}
                            title="Click to change status"
                          >
                            <span
                              className="opdr-status-dot"
                              style={{ background: st.color }}
                            />
                            {item.status}
                            <Icon name="LuChevronDown" size={12} />
                          </button>
                        ) : (
                          <span
                            className="opdr-status-badge"
                            style={{
                              background: st.bg,
                              color: st.color,
                              borderColor: st.color + "44",
                            }}
                          >
                            <span
                              className="opdr-status-dot"
                              style={{ background: st.color }}
                            />
                            {item.status}
                          </span>
                        )}
                      </td>

                      {/* Actions (Matching Registration Report Premium Icons) */}
                      <td>
                        <div className="opdr-actions">
                          {/* View */}
                          <button
                            type="button"
                            onClick={() => openRecordView(item)}
                            title="View Consultation Details"
                            className="opdr-act opdr-act--view"
                          >
                            <Icon name="LuEye" size={15} />
                          </button>

                          {/* Print Slip */}
                          <button
                            type="button"
                            onClick={() => handleOpenPrintSlip(item)}
                            title="Print OPD Consultation Slip"
                            className="opdr-act opdr-act--print"
                          >
                            <Icon name="LuPrinter" size={15} />
                          </button>

                          {/* Status */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setStatusRow(item);
                                setNewStatus(item.rawStatus);
                              }}
                              title="Update Status"
                              className="opdr-act opdr-act--status"
                            >
                              <Icon name="LuRefreshCw" size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="opdr-empty">
                    <div className="opdr-empty-ic">
                      <Icon name="LuSearch" size={24} />
                    </div>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--navy-800)" }}>No matching consultation records found</p>
                    <small style={{ color: "var(--muted)" }}>Try adjusting your date range or search query.</small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 4. FOOTER & PAGINATION ── */}
        <div className="opdr-footer">
          <p className="opdr-count-text">
            Showing {total === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(startIndex + rowsPerPage, total)} of {total} records
          </p>

          <div className="opdr-pager">
            <button
              type="button"
              className="opdr-pg-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
            >
              Previous
            </button>

            {pageNumbers
              .slice(Math.max(0, safeCurrentPage - 3), Math.min(totalPages, safeCurrentPage + 2))
              .map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={"opdr-pg-btn" + (page === safeCurrentPage ? " opdr-pg-btn--active" : "")}
                >
                  {page}
                </button>
              ))}

            <button
              type="button"
              className="opdr-pg-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
            >
              Next
            </button>
          </div>

          <div className="opdr-size-select">
            <label htmlFor="opd-report-page-size">Rows per page</label>
            <select
              id="opd-report-page-size"
              className="opdr-select"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 5. RECORD VIEW MODAL (Matching Registration Form View) ── */}
      {viewRow && (
        <div className="opdr-overlay" onClick={() => setViewRow(null)}>
          <div className="opdr-modal" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="opdr-modal-head">
              <div className="opdr-modal-head-left">
                <div className="opdr-modal-icon">
                  <Icon name="LuFileText" size={20} />
                </div>
                <div>
                  <h3 className="opdr-modal-title">OPD Patient Consultation Report</h3>
                  <p className="opdr-modal-meta">
                    Token: <strong>{viewRow.tokenNo}</strong>
                    <span style={{ margin: "0 8px", opacity: 0.6 }}>•</span>
                    UHID: <strong style={{ color: "#ffd766" }}>{viewRow.uhid || "—"}</strong>
                  </p>
                </div>
              </div>
              <div className="opdr-head-actions">
                
                <button
                  type="button"
                  className="opdr-close-btn"
                  onClick={() => setViewRow(null)}
                  title="Close"
                >
                  <Icon name="LuCircleX" size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="opdr-modal-body">
              {viewLoading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>
                  <Icon name="LuRefreshCw" size={28} className="spin" />
                  <p style={{ marginTop: 8, fontWeight: 700 }}>Loading patient details...</p>
                </div>
              ) : (
                <>
                  {/* Banner */}
                  <div className="opdr-banner">
                    <div className="opdr-banner-left">
                      <div className="opdr-banner-avatar">
                        {getInitials(patientTitle)}
                      </div>
                      <div className="opdr-banner-info">
                        <h2>{patientTitle}</h2>
                        <div className="opdr-banner-meta">
                          <span>UHID: <strong style={{ color: "#1d4ed8" }}>{viewPatient?.uhid || viewRow.uhid}</strong></span>
                          <span>•</span>
                          <span>Token: <strong>{viewRow.tokenNo}</strong></span>
                          <span>•</span>
                          <span>Date: <strong>{viewRow.date} {viewRow.time}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span
                        className="opdr-status-badge"
                        style={{
                          background: getOpdStatus(viewRow.rawStatus).bg,
                          color: getOpdStatus(viewRow.rawStatus).color,
                          borderColor: getOpdStatus(viewRow.rawStatus).color + "44",
                        }}
                      >
                        <span
                          className="opdr-status-dot"
                          style={{ background: getOpdStatus(viewRow.rawStatus).color }}
                        />
                        {viewRow.status}
                      </span>
                    </div>
                  </div>

                  {/* Section 1: Patient Information */}
                  <div className="opdr-section">
                    <div className="opdr-sec-head">
                      <span className="opdr-sec-title">1. PATIENT DETAILS · व्यक्तिगत विवरण</span>
                    </div>
                    <table className="opdr-dtable">
                      <tbody>
                        <tr>
                          <td className="opdr-lbl">Patient Full Name</td>
                          <td className="opdr-val" style={{ width: "30%" }}>
                            {viewPatient?.full_name || viewPatient?.name || viewRow.patientName}
                          </td>
                          <td className="opdr-lbl">UHID Number</td>
                          <td className="opdr-val" style={{ color: "#1d4ed8", fontWeight: 800 }}>
                            {viewPatient?.uhid || viewRow.uhid || "—"}
                          </td>
                        </tr>
                        <tr>
                          <td className="opdr-lbl">Gender / Age</td>
                          <td className="opdr-val">
                            {viewPatient?.gender || viewRow.gender} /{" "}
                            {viewPatient?.age || viewPatient?.ageYrs || "—"} Yrs
                          </td>
                          <td className="opdr-lbl">Mobile Number</td>
                          <td className="opdr-val">
                            {viewPatient?.phone || viewPatient?.mobile1 || viewRow.phone || "—"}
                          </td>
                        </tr>
                        <tr>
                          <td className="opdr-lbl">Blood Group</td>
                          <td className="opdr-val" style={{ color: "#dc2626", fontWeight: 800 }}>
                            {viewPatient?.blood_group || viewPatient?.bloodGroup || "—"}
                          </td>
                          <td className="opdr-lbl">Consultation Date & Time</td>
                          <td className="opdr-val">
                            {viewRow.date} {viewRow.time}
                          </td>
                        </tr>
                        <tr>
                          <td className="opdr-lbl">Address</td>
                          <td className="opdr-val" colSpan={3}>
                            {[
                              viewPatient?.address || viewPatient?.address_line1 || "",
                              viewPatient?.city || "",
                              viewPatient?.state || "",
                              viewPatient?.pincode || viewPatient?.postal_code
                                ? `(${viewPatient?.pincode || viewPatient?.postal_code})`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section 2: Consultation & Clinical Information */}
                  <div className="opdr-section">
                    <div className="opdr-sec-head">
                      <span className="opdr-sec-title">2. CLINICAL & CONSULTATION DETAILS · परामर्श विवरण</span>
                    </div>
                    <table className="opdr-dtable">
                      <tbody>
                        <tr>
                          <td className="opdr-lbl">Attending Doctor</td>
                          <td className="opdr-val" style={{ width: "30%", color: "var(--navy-900)", fontWeight: 800 }}>
                            {viewRow.doctor}
                          </td>
                          <td className="opdr-lbl">Department</td>
                          <td className="opdr-val">{viewRow.department}</td>
                        </tr>
                        <tr>
                          <td className="opdr-lbl">Chief Complaint</td>
                          <td className="opdr-val" colSpan={3}>
                            {viewRow.chiefComplaint || "—"}
                          </td>
                        </tr>
                        <tr>
                          <td className="opdr-lbl">Consultation Status</td>
                          <td className="opdr-val" colSpan={3}>
                            <span
                              className="opdr-status-badge"
                              style={{
                                background: getOpdStatus(viewRow.rawStatus).bg,
                                color: getOpdStatus(viewRow.rawStatus).color,
                                borderColor: getOpdStatus(viewRow.rawStatus).color + "44",
                              }}
                            >
                              <span
                                className="opdr-status-dot"
                                style={{ background: getOpdStatus(viewRow.rawStatus).color }}
                              />
                              {viewRow.status}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="opdr-modal-foot">
              <button
                type="button"
                onClick={() => handleOpenPrintSlip(viewRow)}
                className="opdr-btn opdr-btn--green"
              >
                <Icon name="LuPrinter" size={15} /> Print Consultation Slip
              </button>
              <button
                type="button"
                onClick={() => setViewRow(null)}
                className="opdr-btn opdr-btn--ghost"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. STATUS UPDATE MODAL (SUPER ADMIN) ── */}
      {statusRow && (
        <div className="opdr-overlay" onClick={() => setStatusRow(null)}>
          <div className="opdr-modal opdr-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="opdr-modal-head">
              <div className="opdr-modal-head-left">
                <div className="opdr-modal-icon">
                  <Icon name="LuRefreshCw" size={16} />
                </div>
                <h3 className="opdr-modal-title">Update OPD Status</h3>
              </div>
              <button type="button" className="opdr-close-btn" onClick={() => setStatusRow(null)}>
                <Icon name="LuCircleX" size={18} />
              </button>
            </div>

            <div className="opdr-modal-body" style={{ gap: 10, overflowY: "auto" }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                Patient: <strong style={{ color: "var(--navy-900)" }}>{statusRow.patientName}</strong>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {OPD_STATUSES.map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setNewStatus(st.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border:
                        newStatus === st.value
                          ? `2px solid ${st.color}`
                          : "1.5px solid var(--sky-200)",
                      background: newStatus === st.value ? st.bg : "#fff",
                      color: newStatus === st.value ? st.color : "var(--navy-900)",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: st.color,
                      }}
                    />
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="opdr-modal-foot">
              <button
                type="button"
                onClick={() => setStatusRow(null)}
                className="opdr-btn opdr-btn--ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={updatingStatus}
                className="opdr-btn opdr-btn--navy"
                style={updatingStatus ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
              >
                {updatingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. PRINTABLE OPD CONSULTATION SLIP MODAL (PREMIUM UI + NO BLANK PAGE) ── */}
      {printSlip && (
        <div className="opdr-modal-overlay" onClick={() => setPrintSlip(null)}>
          <div className="opdr-modal-box opdr-modal-box--print" onClick={(e) => e.stopPropagation()}>
            <div className="opdr-modal-head">
              <div className="opdr-modal-head-left">
                <div className="opdr-modal-icon opdr-modal-icon--print">
                  <Icon name="LuPrinter" size={20} />
                </div>
                <div>
                  <h3 className="opdr-modal-title">OPD Patient Consultation Slip Preview</h3>
                  <p className="opdr-modal-meta">Hospital Outpatient Token &amp; Prescription Ticket · परामर्श पर्ची</p>
                </div>
              </div>
              <button
                type="button"
                className="opdr-close-btn"
                onClick={() => setPrintSlip(null)}
                title="Close"
              >
                <Icon name="LuCircleX" size={20} />
              </button>
            </div>

            <div className="opdr-modal-body" style={{ background: "#f8fafc", padding: "16px" }}>
              {/* Printable Appointment Slip (ID matches @media print) */}
              <div className="opdr-printable-slip" id="opdr-printable-slip">
                {/* Top Accent Strip */}
                <div className="opdr-slip-top-accent"></div>

                {/* Hospital Branding Header */}
                <div className="opdr-slip-hosp-header">
                  <div className="opdr-slip-brand">
                    <div className="opdr-slip-logo">
                      <Icon name="LuPlus" size={26} />
                    </div>
                    <div>
                      <h2 className="opdr-slip-hosp-name">NARAYAN HOSPITAL &amp; MEDICAL RESEARCH CENTRE</h2>
                      <p className="opdr-slip-hosp-sub">NABH Accredited Multi-Specialty Hospital • 24x7 Emergency &amp; Trauma Care</p>
                      <p className="opdr-slip-hosp-addr">Station Road, Civil Lines, Kota, Rajasthan - 324001 • Tel: +91 744 2450000</p>
                    </div>
                  </div>
                  <div className="opdr-slip-token-box">
                    <span className="opdr-slip-token-lbl">OPD TOKEN NUMBER</span>
                    <span className="opdr-slip-token-num">{printSlip.token}</span>
                    <span className="opdr-slip-token-date">{printSlip.date} • {printSlip.time}</span>
                  </div>
                </div>

                <div className="opdr-slip-title-bar">
                  <span>OUTPATIENT DEPARTMENT (OPD) CONSULTATION &amp; PRESCRIPTION SLIP · परामर्श पर्ची</span>
                </div>

                {/* 2-Column Info Grid */}
                <div className="opdr-slip-grid">
                  <div className="opdr-slip-row">
                    <span className="opdr-slip-lbl">Patient Name:</span>
                    <span className="opdr-slip-val font-bold">{printSlip.patientName}</span>
                  </div>
                  <div className="opdr-slip-row">
                    <span className="opdr-slip-lbl">UHID Number:</span>
                    <span className="opdr-slip-val font-mono font-bold text-blue-900">{printSlip.uhid}</span>
                  </div>
                  <div className="opdr-slip-row">
                    <span className="opdr-slip-lbl">Age / Gender:</span>
                    <span className="opdr-slip-val">{printSlip.age} / {printSlip.gender}</span>
                  </div>
                  <div className="opdr-slip-row">
                    <span className="opdr-slip-lbl">Contact Mobile:</span>
                    <span className="opdr-slip-val">{printSlip.phone}</span>
                  </div>
                  <div className="opdr-slip-row">
                    <span className="opdr-slip-lbl">Blood Group:</span>
                    <span className="opdr-slip-val font-bold text-red-600">🩸 {printSlip.bloodGroup || "B+"}</span>
                  </div>
                  <div className="opdr-slip-row">
                    <span className="opdr-slip-lbl">Patient Category:</span>
                    <span className="opdr-slip-val font-bold text-teal-800">{printSlip.category}</span>
                  </div>
                  <div className="opdr-slip-row">
                    <span className="opdr-slip-lbl">Consultant Doctor:</span>
                    <span className="opdr-slip-val font-bold text-navy-900">{printSlip.doctor}</span>
                  </div>
                  <div className="opdr-slip-row">
                    <span className="opdr-slip-lbl">Specialty / Dept:</span>
                    <span className="opdr-slip-val font-semibold">{printSlip.department}</span>
                  </div>
                  <div className="opdr-slip-row">
                    <span className="opdr-slip-lbl">Consultation Room:</span>
                    <span className="opdr-slip-val font-semibold">{printSlip.chamber}</span>
                  </div>
                  <div className="opdr-slip-row">
                    <span className="opdr-slip-lbl">Visit Status:</span>
                    <span className="opdr-slip-val font-bold text-emerald-800">{printSlip.status}</span>
                  </div>
                  <div className="opdr-slip-row full">
                    <span className="opdr-slip-lbl">Chief Complaint:</span>
                    <span className="opdr-slip-val">{printSlip.chiefComplaint}</span>
                  </div>
                  <div className="opdr-slip-row full">
                    <span className="opdr-slip-lbl">Residential Address:</span>
                    <span className="opdr-slip-val">{printSlip.address}</span>
                  </div>
                </div>

                {/* Vitals Recording Section for Doctor / Nurse */}
                <div className="opdr-slip-vitals-box">
                  <div className="opdr-slip-vitals-title">NURSING TRIAGE &amp; VITALS RECORDING (प्रारंभिक जांच):</div>
                  <div className="opdr-slip-vitals-grid">
                    <div className="opdr-vitals-cell"><span>Pulse:</span> ______ bpm</div>
                    <div className="opdr-vitals-cell"><span>BP:</span> ______ mmHg</div>
                    <div className="opdr-vitals-cell"><span>Temp:</span> ______ °F</div>
                    <div className="opdr-vitals-cell"><span>SpO2:</span> ______ %</div>
                    <div className="opdr-vitals-cell"><span>Weight:</span> ______ kg</div>
                    <div className="opdr-vitals-cell"><span>Height:</span> ______ cm</div>
                  </div>
                </div>

                {/* Fee & Receipt Summary Box */}
                <div className="opdr-slip-fee-box">
                  <div className="opdr-slip-fee-header">
                    <span>FEE &amp; PAYMENT RECEIPT (भुगतान रसीद)</span>
                    <span className="opdr-receipt-no">Receipt: {printSlip.receiptNo}</span>
                  </div>
                  <div className="opdr-slip-fee-body">
                    <div className="opdr-slip-fee-col">
                      <span className="opdr-fee-label">Registration Fee:</span>
                      <strong className="opdr-fee-amount">₹ {Number(printSlip.regFee || 100).toFixed(2)}</strong>
                    </div>
                    <div className="opdr-slip-fee-col">
                      <span className="opdr-fee-label">Consultation Fee:</span>
                      <strong className="opdr-fee-amount">₹ {Number(printSlip.consultFee || 400).toFixed(2)}</strong>
                    </div>
                    <div className="opdr-slip-fee-col highlight">
                      <span className="opdr-fee-label">Total Amount Paid ({printSlip.paymentMode}):</span>
                      <strong className="opdr-fee-amount total">₹ {Number(printSlip.totalFee || 500).toFixed(2)}</strong>
                    </div>
                    <div className="opdr-slip-fee-col">
                      <span className="opdr-fee-label">Payment Status:</span>
                      <span className="opdr-fee-paid-badge">✓ {printSlip.paymentStatus} (प्राप्त)</span>
                    </div>
                  </div>
                </div>

                {/* Clinical Notes & Prescription Area for Doctor */}
                <div className="opdr-slip-rx-box">
                  <div className="opdr-slip-rx-header">
                    <span className="opdr-rx-symbol">℞</span>
                    <span className="opdr-rx-title">DOCTOR'S CLINICAL EVALUATION &amp; PRESCRIPTION (डॉक्टर परामर्श एवं दवा पर्ची):</span>
                  </div>
                  <div className="opdr-slip-rx-lines">
                    <div className="opdr-rx-line"></div>
                    <div className="opdr-rx-line"></div>
                    <div className="opdr-rx-line"></div>
                    <div className="opdr-rx-line"></div>
                  </div>
                </div>

                {/* Instructions & Footer */}
                <div className="opdr-slip-footer-notes">
                  <div className="opdr-slip-notes-left">
                    <p>• Please present this original slip at the Doctor's Consultation Chamber &amp; Hospital Pharmacy.</p>
                    <p>• Valid for 7 days from consultation date for routine follow-up checkup.</p>
                    <p className="opdr-slip-note-small">* Electronic consultation record generated by Narayan Hospital HIMS.</p>
                    {/* Barcode Graphic */}
                    <div className="opdr-slip-barcode">
                      <div className="opdr-barcode-lines"></div>
                      <span className="opdr-barcode-text">*{printSlip.uhid}-{printSlip.token}*</span>
                    </div>
                  </div>
                  <div className="opdr-slip-notes-right">
                    <div className="opdr-slip-sig-line"></div>
                    <span className="opdr-slip-signature">Authorized Hospital Signatory / Attending Consultant</span>
                    <span className="opdr-slip-timestamp">Generated: {new Date().toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="opdr-modal-foot" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="opdr-btn opdr-btn--ghost"
                onClick={() => setPrintSlip(null)}
              >
                Close Preview
              </button>
              <button
                type="button"
                className="opdr-btn opdr-btn--green"
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={16} /> Print Slip (पर्ची प्रिंट करें)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}