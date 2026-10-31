import React, { useState, useEffect, useCallback } from "react";
import Icon from "../../../components/common/Icon.jsx";
import opdService from "../../../api/services/opdService";
import patientService from "../../../api/services/patientService";
import PrintSlipHandler from "../../../services/PrintSlipHandler";
import OPDConsultationSlip from "../../../components/slips/OPDConsultationSlip.jsx";
import settingsService from "../../../api/services/settingsService.js";
import { DEFAULT_HOSPITAL_CONFIG } from "../../../data/printlslip.data.jsx";
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
  const [slipSettings, setSlipSettings] = useState(null);

  useEffect(() => {
    settingsService
      .getSetting("print_slip_opd")
      .then((data) => {
        if (data) setSlipSettings(data);
      })
      .catch(() => {});
  }, []);

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

  const handlePrintReport = (targetRow, targetPatient) => {
    const row = targetRow || viewRow;
    const patient = targetPatient || viewPatient || {};
    const w = window.open("", "_blank", "width=900,height=750");
    if (!w) return;

    const esc = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const fullName =
      patient.full_name || patient.name || row?.patientName || "Unknown Patient";
    const address = [
      patient.address || patient.address_line1 || "",
      patient.city ? ", " + patient.city : "",
      patient.state ? ", " + patient.state : "",
      patient.pincode || patient.postal_code
        ? " (" + (patient.pincode || patient.postal_code) + ")"
        : "",
    ].join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>OPD Patient Consultation Report</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; padding: 24px; color: #081a3d; background: #fff; }
    .header { background: linear-gradient(100deg, #081a3d, #1e5a8e); border-bottom: 3.5px solid #f5c542; border-radius: 8px 8px 0 0; padding: 14px 20px; color: #fff; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 18px; margin: 0; font-weight: 800; letter-spacing: .2px; }
    .header .muted { color: #dbe9f6; font-size: 11.5px; margin-top: 3px; }
    .badge { background: #f5c542; color: #081a3d; font-weight: 800; font-size: 12px; padding: 5px 12px; border-radius: 6px; }
    h2 { font-size: 12.5px; margin: 16px 0 6px; color: #081a3d; background: #f0f7ff; padding: 6px 12px; border-left: 4px solid #123a6b; border-radius: 4px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td { border: 1px solid #d3e3f1; padding: 8px 10px; font-size: 12px; }
    .label { background: #f8fbfe; font-weight: 700; width: 22%; color: #123a6b; }
    .foot { margin-top: 24px; padding-top: 10px; border-top: 1.5px solid #d3e3f1; font-size: 11px; color: #55698a; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${esc(DEFAULT_HOSPITAL_CONFIG.hospital?.name || "Hospital")}</h1>
      <div class="muted">OPD Patient Consultation Report</div>
    </div>
    <div class="badge">Token: ${esc(row?.tokenNo || "-")}</div>
  </div>
  <h2>1. Patient Details</h2>
  <table>
    <tr><td class="label">Patient Name</td><td><strong>${esc(fullName)}</strong></td><td class="label">UHID</td><td><strong style="color:#1d4ed8">${esc(patient.uhid || row?.uhid || "-")}</strong></td></tr>
    <tr><td class="label">Gender / Age</td><td>${esc(patient.gender || row?.gender || "-")} / ${esc(patient.age || patient.ageYrs || "-")} Yrs</td><td class="label">Mobile No.</td><td>${esc(patient.phone || patient.mobile1 || row?.phone || "-")}</td></tr>
    <tr><td class="label">Blood Group</td><td>${esc(patient.blood_group || patient.bloodGroup || "-")}</td><td class="label">Date / Time</td><td>${esc(row?.date || "")} ${esc(row?.time || "")}</td></tr>
    <tr><td class="label">Token Number</td><td>${esc(row?.tokenNo || "-")}</td><td class="label">Address</td><td>${esc(address.trim() || "-")}</td></tr>
  </table>
  <h2>2. Consultation Details</h2>
  <table>
    <tr><td class="label">Doctor</td><td><strong>${esc(row?.doctor || "-")}</strong></td><td class="label">Department</td><td>${esc(row?.department || "-")}</td></tr>
    <tr><td class="label">Chief Complaint</td><td colspan="3">${esc(row?.chiefComplaint || "-")}</td></tr>
    <tr><td class="label">Current Status</td><td colspan="3"><span style="display:inline-block;padding:2px 8px;border-radius:12px;background:#e0f2fe;color:#0284c7;font-weight:700;">${esc(row?.status || "-")}</span></td></tr>
  </table>
  <div class="foot">${esc(DEFAULT_HOSPITAL_CONFIG.hospital?.name || "Hospital")} &bull; Hospital Management System &bull; OPD Report</div>
</body>
</html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 300);
  };

  const handlePrintSlip = async (targetRow, targetPatient) => {
    const row = targetRow || viewRow;
    let patient = targetPatient || viewPatient;
    if (!patient && row?.patientId) {
      try {
        patient = await patientService.getById(row.patientId);
      } catch (err) {
        console.error("Failed to load patient for slip print:", err);
      }
    }

    const booking = {
      patient_name: patient?.full_name || patient?.name || row?.patientName || "—",
      uhid: patient?.uhid || row?.uhid,
      age: patient?.age || patient?.ageYrs || row?.age,
      gender: patient?.gender || row?.gender,
      mobile: patient?.phone || patient?.mobile1 || row?.phone,
      address: [
        patient?.address || patient?.address_line1 || "",
        patient?.city || row?.city || "",
        patient?.state || row?.state || "",
      ].filter(Boolean).join(", "),
      token_number: row?.tokenNo,
      date: row?.date,
      time_slot: row?.time,
      doctor_name: row?.doctor,
      department_name: row?.department,
      problemDescription: row?.chiefComplaint,
      status: row?.status,
      consultation_fee: row?.fee || 500,
    };

    PrintSlipHandler.printBooking(booking, slipSettings || {});
  };

  const handleDirectPrint = async (row) => {
    setViewRow(row);
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
                onClick={() => handlePrintSlip()}
                className="opdr-btn opdr-btn--navy"
                title="Print Official A4 Consultation Slip"
              >
                <Icon name="LuReceipt" size={15} /> Print OPD Slip
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

            <div className="opdr-modal-body" style={{ background: "#f8fafc", padding: "16px", maxHeight: "78vh", overflowY: "auto" }}>
              <OPDConsultationSlip data={printSlip} settings={slipSettings || {}} />
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
                onClick={() => PrintSlipHandler.printBooking(printSlip, slipSettings || {})}
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