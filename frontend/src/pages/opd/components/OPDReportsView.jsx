import React, { useState, useEffect, useCallback } from "react";
import Icon from "../../../components/common/Icon.jsx";
import opdService from "../../../api/services/opdService";
import patientService from "../../../api/services/patientService";
import { useAuth } from "../../../auth";
import { ROLES } from "../../../auth/roles";

const OPD_STATUSES = [
  { value: "planned", label: "Planned", color: "#64748b", bg: "#f1f5f9" },
  { value: "arrived", label: "In Consultation", color: "#2563eb", bg: "#eff6ff" },
  { value: "in_progress", label: "In Progress", color: "#0284c7", bg: "#e0f2fe" },
  { value: "on_hold", label: "On Hold", color: "#d97706", bg: "#fffbeb" },
  { value: "finished", label: "Completed", color: "#059669", bg: "#ecfdf5" },
  { value: "cancelled", label: "Cancelled", color: "#dc2626", bg: "#fef2f2" },
  { value: "entered_in_error", label: "Entered in Error", color: "#7c2d12", bg: "#ffedd5" },
];
const getOpdStatus = (val) => OPD_STATUSES.find((s) => s.value === val) || OPD_STATUSES[0];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500];

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
      console.error("Failed to load patient details:", err);
    } finally {
      setViewLoading(false);
    }
  };

  const handlePrintReport = () => {
    const w = window.open("", "_blank", "width=900,height=750");
    if (!w) return;

    const esc = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const patient = viewPatient || {};
    const fullName =
      patient.full_name || patient.name || viewRow?.patientName || "Unknown Patient";
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
  <title>OPD Patient Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 16px 0 8px; color: #1e40af; }
    .muted { color: #64748b; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td { border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; }
    .label { background: #f1f5f9; font-weight: 700; width: 25%; }
    .header { border-bottom: 2px solid #1e40af; padding-bottom: 8px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Narayan Hospital</h1>
    <div class="muted">OPD Patient Report</div>
  </div>
  <h2>Patient Details</h2>
  <table>
    <tr><td class="label">Patient Name</td><td>${esc(fullName)}</td><td class="label">UHID</td><td>${esc(patient.uhid || viewRow?.uhid || "-")}</td></tr>
    <tr><td class="label">Gender / Age</td><td>${esc(patient.gender || viewRow?.gender || "-")} / ${esc(patient.age || patient.ageYrs || "-")} Yrs</td><td class="label">Mobile</td><td>${esc(patient.phone || patient.mobile1 || viewRow?.phone || "-")}</td></tr>
    <tr><td class="label">Blood Group</td><td>${esc(patient.blood_group || patient.bloodGroup || "-")}</td><td class="label">Date / Time</td><td>${esc(viewRow?.date || "")} ${esc(viewRow?.time || "")}</td></tr>
    <tr><td class="label">Token</td><td>${esc(viewRow?.tokenNo || "-")}</td><td class="label">Address</td><td>${esc(address.trim() || "-")}</td></tr>
  </table>
  <h2>Consultation Details</h2>
  <table>
    <tr><td class="label">Doctor</td><td>${esc(viewRow?.doctor || "-")}</td><td class="label">Department</td><td>${esc(viewRow?.department || "-")}</td></tr>
    <tr><td class="label">Chief Complaint</td><td colspan="3">${esc(viewRow?.chiefComplaint || "-")}</td></tr>
    <tr><td class="label">Status</td><td colspan="3">${esc(viewRow?.status || "-")}</td></tr>
  </table>
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

  return (
    <div
      style={{
        background: "#fff",
        padding: 24,
        borderRadius: 14,
        border: "1px solid #e2e8f0",
      }}
    >
      {/* Header + filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>
            OPD Consultation Report
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
            Outpatient consultation register with date-range filtering
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                background: "#f8fafc",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                background: "#f8fafc",
              }}
            />
          </div>

          <button
            type="button"
            onClick={applyDateRange}
            style={{
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Apply Range
          </button>

          <button
            type="button"
            onClick={resetFilters}
            style={{
              background: "#fff",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reset
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "6px 12px",
            }}
          >
            <Icon name="LuSearch" size={15} />
            <input
              type="text"
              placeholder="Search token, patient, doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 13,
              }}
            />
          </div>

        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f8fafc",
                color: "#64748b",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <th style={{ padding: "10px 12px" }}>Token</th>
              <th style={{ padding: "10px 12px" }}>Patient Name</th>
              <th style={{ padding: "10px 12px" }}>Doctor</th>
              <th style={{ padding: "10px 12px" }}>Department</th>
              <th style={{ padding: "10px 12px" }}>Complaint</th>
              <th style={{ padding: "10px 12px" }}>Date</th>
              <th style={{ padding: "10px 12px" }}>Time</th>
              <th style={{ padding: "10px 12px" }}>Status</th>
              <th style={{ padding: "10px 12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: "28px 12px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        fontWeight: 800,
                        color: "#1e40af",
                        background: "#eff6ff",
                        padding: "3px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {item.tokenNo}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>
                      {item.patientName}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>
                      {item.uhid}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontWeight: 600,
                      color: "#334155",
                    }}
                  >
                    {item.doctor}
                  </td>
                  <td style={{ padding: "12px", color: "#475569" }}>
                    {item.department}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "#475569",
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.chiefComplaint}
                  </td>
                  <td style={{ padding: "12px", color: "#64748b" }}>
                    {item.date}
                  </td>
                  <td style={{ padding: "12px", color: "#64748b" }}>
                    {item.time}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {isSuperAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusRow(item);
                          setNewStatus(item.rawStatus);
                        }}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 12,
                          border: "none",
                          cursor: "pointer",
                          background: getOpdStatus(item.rawStatus).bg,
                          color: getOpdStatus(item.rawStatus).color,
                        }}
                      >
                        {getOpdStatus(item.rawStatus).label}
                        {" "}
                        <Icon name="LuChevronDown" size={11} />
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: getOpdStatus(item.rawStatus).bg,
                          color: getOpdStatus(item.rawStatus).color,
                        }}
                      >
                        {getOpdStatus(item.rawStatus).label}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => openRecordView(item)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Icon name="LuPrinter" size={12} /> Print
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusRow(item);
                            setNewStatus(item.rawStatus);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "#f3e8ff",
                            color: "#7c3aed",
                            border: "1px solid #d8b4fe",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Icon name="LuRefreshCw" size={12} /> Status
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: "28px 12px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginTop: 18,
          flexWrap: "wrap",
        }}
      >
        <div style={{ color: "#475569", fontSize: 12, fontWeight: 600 }}>
          Showing {total === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + rowsPerPage, total)} of {total} records
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            style={{
              border: "1px solid #cbd5e1",
              background: safeCurrentPage === 1 ? "#f8fafc" : "#fff",
              color: safeCurrentPage === 1 ? "#94a3b8" : "#334155",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="LuChevronLeft" size={15} />
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              style={{
                minWidth: 34,
                height: 32,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: page === safeCurrentPage ? "#0f172a" : "#fff",
                color: page === safeCurrentPage ? "#fff" : "#334155",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                padding: "0 10px",
              }}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={safeCurrentPage === totalPages}
            style={{
              border: "1px solid #cbd5e1",
              background:
                safeCurrentPage === totalPages ? "#f8fafc" : "#fff",
              color:
                safeCurrentPage === totalPages ? "#94a3b8" : "#334155",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor:
                safeCurrentPage === totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="LuChevronRight" size={15} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label
            htmlFor="opd-report-page-size"
            style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}
          >
            Rows per page
          </label>
          <select
            id="opd-report-page-size"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              background: "#fff",
              color: "#0f172a",
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Status Modal */}
      {statusRow && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: 360,
              maxWidth: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 15, color: "#0f172a" }}>
                Update OPD Status
              </h3>
              <button
                type="button"
                onClick={() => setStatusRow(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 18 }}>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569" }}>
                Patient: <strong>{statusRow.patientName}</strong>
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
                      padding: "10px 12px",
                      borderRadius: 8,
                      border:
                        newStatus === st.value
                          ? `2px solid ${st.color}`
                          : "1px solid #e2e8f0",
                      background:
                        newStatus === st.value ? st.bg : "#fff",
                      color:
                        newStatus === st.value ? st.color : "#334155",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: st.color,
                      }}
                    />
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                padding: "12px 18px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={() => setStatusRow(null)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#334155",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={updatingStatus}
                style={{
                  border: "none",
                  background: updatingStatus ? "#94a3b8" : "#0f172a",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: updatingStatus ? "not-allowed" : "pointer",
                }}
              >
                {updatingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record View / Print Modal */}
      {viewRow && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 print:p-0 print:bg-white"
          onClick={() => setViewRow(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-h-none print:w-full"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1b3a5b] bg-[#0b1e36] text-white print:hidden">
              <h3 className="text-base font-bold text-white tracking-wide uppercase">OPD Patient Report</h3>
              <button onClick={() => setViewRow(null)} className="text-red-400 hover:text-red-300 p-1 rounded-lg" title="Close">
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 bg-white print:block">
              {viewLoading ? (
                <div className="py-10 text-center text-slate-500">Loading patient details...</div>
              ) : (
                <>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {viewPatient?.full_name || viewPatient?.name || viewRow.patientName}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        UHID: <strong className="text-blue-700 font-mono">{viewPatient?.uhid || viewRow.uhid}</strong>
                        <span className="mx-2">•</span>
                        Token: <strong className="text-slate-800">{viewRow.tokenNo}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Patient Details</h4>
                    </div>
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="w-1/4 bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Patient Name</td>
                          <td className="w-1/4 p-2.5 font-bold text-slate-900 border-r border-slate-200">{viewPatient?.full_name || viewPatient?.name || viewRow.patientName}</td>
                          <td className="w-1/4 bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">UHID</td>
                          <td className="w-1/4 p-2.5 font-mono font-bold text-blue-700">{viewPatient?.uhid || viewRow.uhid}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Gender / Age</td>
                          <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200">{viewPatient?.gender || viewRow.gender} / {viewPatient?.age || viewPatient?.ageYrs || "-"} Yrs</td>
                          <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Mobile</td>
                          <td className="p-2.5 font-medium text-slate-900">{viewPatient?.phone || viewPatient?.mobile1 || viewRow.phone || "-"}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Blood Group</td>
                          <td className="p-2.5 font-bold text-rose-600 border-r border-slate-200">{viewPatient?.blood_group || viewPatient?.bloodGroup || "-"}</td>
                          <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Date / Time</td>
                          <td className="p-2.5 font-medium text-slate-900">{viewRow.date} {viewRow.time}</td>
                        </tr>
                        <tr>
                          <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200 align-top">Address</td>
                          <td colSpan={3} className="p-2.5 font-medium text-slate-900">
                            {viewPatient?.address || viewPatient?.address_line1 || "-"}
                            {viewPatient?.city ? ", " + viewPatient.city : ""}
                            {viewPatient?.state ? ", " + viewPatient.state : ""}
                            {viewPatient?.pincode || viewPatient?.postal_code ? " (" + (viewPatient.pincode || viewPatient.postal_code) + ")" : ""}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Consultation Details</h4>
                    </div>
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="w-1/4 bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Doctor</td>
                          <td className="w-1/4 p-2.5 font-medium text-slate-900 border-r border-slate-200">{viewRow.doctor}</td>
                          <td className="w-1/4 bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Department</td>
                          <td className="w-1/4 p-2.5 font-medium text-slate-900">{viewRow.department}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Chief Complaint</td>
                          <td colSpan={3} className="p-2.5 font-medium text-slate-900">{viewRow.chiefComplaint}</td>
                        </tr>
                        <tr>
                          <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Status</td>
                          <td colSpan={3} className="p-2.5 font-bold text-slate-900">{viewRow.status}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex flex-wrap justify-between items-center gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handlePrintReport} className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 px-4 py-2 rounded-lg flex items-center gap-1.5">
                  Print
                </button>
                <button onClick={() => setViewRow(null)} className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-2 rounded-lg">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
