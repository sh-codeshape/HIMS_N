import React, { useState, useEffect, useCallback } from "react";
import Icon from "../../../components/common/Icon.jsx";
import opdService from "../../../api/services/opdService";
import patientService from "../../../api/services/patientService";
import { useAuth } from "../../../auth";
import { ROLES } from "../../../auth/roles";

const OPD_STATUSES = [
  { value: "planned", label: "Planned", color: "#475569", bg: "#e8eef5" },
  { value: "arrived", label: "In Consultation", color: "#1d4ed8", bg: "#dbeafe" },
  { value: "in_progress", label: "In Progress", color: "#0369a1", bg: "#d4eefb" },
  { value: "on_hold", label: "On Hold", color: "#b45309", bg: "#fef0c7" },
  { value: "finished", label: "Completed", color: "#047857", bg: "#d5f5e6" },
  { value: "cancelled", label: "Cancelled", color: "#b91c1c", bg: "#fde2e2" },
  { value: "entered_in_error", label: "Entered in Error", color: "#7c2d12", bg: "#ffe4cc" },
];
const getOpdStatus = (val) => OPD_STATUSES.find((s) => s.value === val) || OPD_STATUSES[0];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500];

/* ------------------------------------------------------------------ */
/*  Premium theme (UI only)                                            */
/* ------------------------------------------------------------------ */
const THEME_CSS = `
.opdr {
  --navy-900: #071428;
  --navy-800: #0b1e36;
  --navy-700: #12315a;
  --navy-600: #1b4a82;
  --sky-50: #f3f8fd;
  --sky-100: #e6f0fa;
  --sky-200: #cfe2f3;
  --sky-300: #b5d0e8;
  --gold: #f5c542;
  --gold-dark: #d9a416;
  --ink: #0b1e36;
  --muted: #5b6f88;
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  color: var(--ink);
}
.opdr * { box-sizing: border-box; }

/* Outer shell */
.opdr-shell {
  position: relative;
  border-radius: 22px;
  padding: 3px;
  background: linear-gradient(135deg, #1b4a82 0%, #0b1e36 45%, #f5c542 100%);
  box-shadow: 0 24px 60px -18px rgba(11,30,54,.45), 0 2px 0 rgba(255,255,255,.4) inset;
}
.opdr-card {
  border-radius: 19px;
  overflow: hidden;
  background:
    radial-gradient(900px 300px at 100% -10%, rgba(181,208,232,.55), transparent 60%),
    linear-gradient(180deg, var(--sky-50) 0%, #ffffff 40%);
}

/* Banner */
.opdr-banner {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;
  padding: 18px 26px;
  background: linear-gradient(100deg, var(--navy-900) 0%, var(--navy-700) 60%, var(--navy-600) 100%);
  border-bottom: 3px solid var(--gold);
  position: relative;
}
.opdr-banner::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(420px 120px at 85% 0%, rgba(245,197,66,.18), transparent 70%);
}
.opdr-title-wrap { display: flex; align-items: center; gap: 14px; position: relative; z-index: 1; }
.opdr-logo {
  width: 46px; height: 46px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(145deg, #ffd766, #e0a916);
  color: var(--navy-900);
  box-shadow: 0 8px 18px -6px rgba(245,197,66,.7), inset 0 1px 0 rgba(255,255,255,.6);
}
.opdr-title { margin: 0; font-size: 19px; font-weight: 800; color: #fff; letter-spacing: .2px; }
.opdr-sub { margin: 3px 0 0; font-size: 12px; color: #a9c1de; }
.opdr-count {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.18);
  backdrop-filter: blur(6px);
  border-radius: 14px; padding: 8px 16px;
}
.opdr-count b { font-size: 22px; color: var(--gold); font-weight: 800; line-height: 1; }
.opdr-count span { font-size: 11px; color: #cfe0f2; font-weight: 600; line-height: 1.25; }

/* Filter bar */
.opdr-filters {
  margin: 20px 24px 0;
  padding: 14px 16px;
  display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px;
  background: linear-gradient(180deg, var(--sky-100), var(--sky-200));
  border: 1px solid var(--sky-300);
  border-radius: 16px;
  box-shadow: 0 1px 0 #fff inset, 0 8px 20px -14px rgba(11,30,54,.5);
}
.opdr-field { display: flex; flex-direction: column; gap: 4px; }
.opdr-field label { font-size: 11px; font-weight: 700; color: var(--navy-700); letter-spacing: .3px; }
.opdr-input {
  height: 38px; border-radius: 10px; border: 1.5px solid var(--sky-300);
  background: #fff; padding: 0 12px; font-size: 13px; color: var(--ink);
  outline: none; transition: border-color .15s, box-shadow .15s;
  font-family: inherit;
}
.opdr-input:focus { border-color: var(--navy-600); box-shadow: 0 0 0 3px rgba(27,74,130,.18); }
.opdr-search {
  display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px;
  border-radius: 10px; border: 1.5px solid var(--sky-300); background: #fff; color: var(--muted);
  min-width: 250px; flex: 1 1 250px; transition: border-color .15s, box-shadow .15s;
}
.opdr-search:focus-within { border-color: var(--navy-600); box-shadow: 0 0 0 3px rgba(27,74,130,.18); }
.opdr-search input {
  border: none; outline: none; background: transparent; width: 100%;
  font-size: 13px; color: var(--ink); font-family: inherit;
}
.opdr-btn {
  height: 38px; padding: 0 18px; border-radius: 10px; font-size: 12.5px; font-weight: 700;
  cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 6px;
  transition: transform .12s, box-shadow .15s, filter .15s;
}
.opdr-btn:hover { transform: translateY(-1px); }
.opdr-btn:active { transform: translateY(0); }
.opdr-btn-primary {
  border: none; color: #fff;
  background: linear-gradient(180deg, #1b4a82, #0b1e36);
  box-shadow: 0 8px 16px -8px rgba(11,30,54,.8), inset 0 1px 0 rgba(255,255,255,.2);
}
.opdr-btn-ghost { border: 1.5px solid var(--navy-700); color: var(--navy-700); background: #fff; }
.opdr-btn-ghost:hover { background: var(--navy-800); color: #fff; }

/* Table */
.opdr-table-wrap { margin: 20px 24px 0; border-radius: 16px; border: 1px solid var(--sky-300); background: #fff; overflow: hidden; box-shadow: 0 14px 30px -22px rgba(11,30,54,.6); }
.opdr-scroll { overflow-x: auto; }
.opdr-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
.opdr-table thead tr { background: linear-gradient(180deg, var(--sky-200), var(--sky-300)); }
.opdr-table th {
  padding: 13px 14px; font-size: 12px; font-weight: 800; color: var(--navy-800);
  border-bottom: 2px solid var(--navy-700); white-space: nowrap;
}
.opdr-table tbody tr { border-bottom: 1px solid #e7eef6; transition: background .15s; }
.opdr-table tbody tr:nth-child(even) { background: #f8fbfe; }
.opdr-table tbody tr:hover { background: #eaf3fc; box-shadow: inset 3px 0 0 var(--gold); }
.opdr-table td { padding: 13px 14px; vertical-align: middle; }
.opdr-empty { padding: 46px 12px !important; text-align: center; color: var(--muted); }
.opdr-empty-ic {
  width: 54px; height: 54px; margin: 0 auto 10px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  background: var(--sky-100); color: var(--navy-600); border: 1px dashed var(--sky-300);
}

.opdr-token {
  display: inline-block; font-weight: 800; color: var(--gold);
  background: linear-gradient(145deg, var(--navy-700), var(--navy-900));
  padding: 4px 11px; border-radius: 8px; font-size: 12px; letter-spacing: .4px;
  box-shadow: 0 6px 12px -6px rgba(11,30,54,.7);
}
.opdr-patient { display: flex; align-items: center; gap: 10px; }
.opdr-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 13px; color: #fff;
  background: linear-gradient(145deg, #2f78c4, #12315a);
  box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px var(--sky-300);
}
.opdr-pname { font-weight: 700; color: var(--ink); }
.opdr-uhid { font-size: 11.5px; color: var(--muted); font-family: ui-monospace, Consolas, monospace; }

.opdr-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 700; padding: 4px 11px; border-radius: 999px;
  border: 1px solid transparent; font-family: inherit; white-space: nowrap;
}
.opdr-badge i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; display: inline-block; }
button.opdr-badge { cursor: pointer; transition: filter .15s, transform .12s; }
button.opdr-badge:hover { filter: brightness(.95); transform: translateY(-1px); }

.opdr-act {
  display: inline-flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 9px;
  font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: inherit;
  transition: transform .12s, box-shadow .15s;
}
.opdr-act:hover { transform: translateY(-1px); box-shadow: 0 8px 14px -8px rgba(11,30,54,.6); }
.opdr-act-print { background: linear-gradient(180deg, #1b4a82, #0b1e36); color: #fff; border: none; }
.opdr-act-status { background: #fff7dc; color: #8a6200; border: 1px solid #f1d27a; }

/* Pagination */
.opdr-foot {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
  padding: 18px 26px 22px;
}
.opdr-info { color: var(--navy-700); font-size: 12px; font-weight: 700; }
.opdr-pages { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.opdr-pg {
  min-width: 34px; height: 34px; padding: 0 10px; border-radius: 10px;
  border: 1.5px solid var(--sky-300); background: #fff; color: var(--navy-700);
  font-weight: 700; font-size: 12px; cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center; transition: all .15s;
}
.opdr-pg:hover:not(:disabled) { border-color: var(--navy-600); background: var(--sky-100); }
.opdr-pg.active {
  background: linear-gradient(180deg, #1b4a82, #0b1e36); color: var(--gold);
  border-color: var(--navy-800); box-shadow: 0 8px 14px -8px rgba(11,30,54,.9);
}
.opdr-pg:disabled { background: #f1f5f9; color: #a3b1c2; cursor: not-allowed; }
.opdr-size { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--navy-700); }
.opdr-size select { height: 34px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; padding: 0 10px; }

/* Modals */
.opdr-overlay {
  position: fixed; inset: 0; z-index: 1000; padding: 16px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(7,20,40,.62); backdrop-filter: blur(5px);
  animation: opdrFade .18s ease-out;
}
@keyframes opdrFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes opdrPop { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .opdr-overlay, .opdr-modal { animation: none !important; } }

.opdr-modal-shell { border-radius: 22px; padding: 3px; background: linear-gradient(135deg, #1b4a82, #0b1e36 50%, #f5c542); box-shadow: 0 40px 90px -20px rgba(0,0,0,.6); width: 100%; }
.opdr-modal {
  border-radius: 19px; overflow: hidden; background: linear-gradient(180deg, var(--sky-50), #fff);
  display: flex; flex-direction: column; max-height: 90vh; animation: opdrPop .22s ease-out;
}
.opdr-mhead {
  display: flex; align-items: center; justify-content: space-between; padding: 14px 20px;
  background: linear-gradient(100deg, var(--navy-900), var(--navy-700)); border-bottom: 3px solid var(--gold);
}
.opdr-mhead h3 { margin: 0; font-size: 15px; font-weight: 800; color: #fff; letter-spacing: .3px; display: flex; align-items: center; gap: 10px; }
.opdr-x {
  width: 32px; height: 32px; border-radius: 9px; border: none; cursor: pointer;
  background: #dc2626; color: #fff; font-size: 20px; line-height: 1; font-weight: 700;
  display: flex; align-items: center; justify-content: center; transition: background .15s, transform .12s;
}
.opdr-x:hover { background: #ef4444; transform: scale(1.06); }
.opdr-mbody { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.opdr-mfoot {
  display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px;
  border-top: 1px solid var(--sky-300); background: var(--sky-100);
}

.opdr-hero {
  display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 16px;
  background: linear-gradient(100deg, var(--navy-800), var(--navy-600)); color: #fff;
  box-shadow: 0 14px 26px -16px rgba(11,30,54,.9);
}
.opdr-hero .opdr-avatar { width: 52px; height: 52px; font-size: 18px; background: linear-gradient(145deg, #ffd766, #d9a416); color: var(--navy-900); box-shadow: 0 0 0 3px rgba(255,255,255,.35); }
.opdr-hero h2 { margin: 0; font-size: 18px; font-weight: 800; }
.opdr-hero p { margin: 4px 0 0; font-size: 12px; color: #bcd2ea; }
.opdr-hero p strong { color: var(--gold); font-family: ui-monospace, Consolas, monospace; }

.opdr-panel { border-radius: 14px; overflow: hidden; border: 1px solid var(--sky-300); background: #fff; box-shadow: 0 10px 22px -18px rgba(11,30,54,.7); }
.opdr-panel-h {
  padding: 10px 16px; font-size: 12.5px; font-weight: 800; color: var(--navy-800);
  background: linear-gradient(180deg, var(--sky-200), var(--sky-300)); border-bottom: 1px solid var(--sky-300);
  display: flex; align-items: center; gap: 8px;
}
.opdr-panel-h::before { content: ""; width: 4px; height: 14px; border-radius: 2px; background: var(--navy-700); }
.opdr-dt { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.opdr-dt td { padding: 10px 14px; border-bottom: 1px solid #e7eef6; border-right: 1px solid #e7eef6; }
.opdr-dt tr:last-child td { border-bottom: none; }
.opdr-dt td:last-child { border-right: none; }
.opdr-dt td.l { width: 20%; background: var(--sky-50); font-weight: 700; color: var(--muted); }
.opdr-dt td.v { font-weight: 600; color: var(--ink); }

@media (max-width: 720px) {
  .opdr-banner, .opdr-filters, .opdr-table-wrap { margin-left: 12px; margin-right: 12px; }
  .opdr-banner { margin: 0; padding: 16px; }
}
`;

const getInitials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

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
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; padding: 28px; color: #0b1e36; }
    .header { background: linear-gradient(100deg, #071428, #12315a); border-bottom: 4px solid #f5c542; border-radius: 12px 12px 0 0; padding: 18px 22px; color: #fff; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 22px; margin: 0; letter-spacing: .3px; }
    .header .muted { color: #a9c1de; font-size: 12px; margin-top: 3px; }
    .badge { background: #f5c542; color: #071428; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 999px; }
    h2 { font-size: 13px; margin: 20px 0 8px; color: #0b1e36; background: #cfe2f3; padding: 8px 12px; border-left: 4px solid #12315a; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; }
    td { border: 1px solid #cfe2f3; padding: 9px 11px; font-size: 13px; }
    .label { background: #f3f8fd; font-weight: 700; width: 20%; color: #5b6f88; }
    .foot { margin-top: 28px; padding-top: 10px; border-top: 2px solid #cfe2f3; font-size: 11px; color: #5b6f88; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Narayan Hospital</h1>
      <div class="muted">OPD Patient Report</div>
    </div>
    <div class="badge">Token: ${esc(viewRow?.tokenNo || "-")}</div>
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
  <div class="foot">Narayan Hospital &bull; OPD Patient Report</div>
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

  const StatusBadge = ({ raw, as = "span", ...rest }) => {
    const st = getOpdStatus(raw);
    const Tag = as;
    return (
      <Tag
        className="opdr-badge"
        style={{ background: st.bg, color: st.color, borderColor: st.color + "33" }}
        {...rest}
      >
        <i />
        {st.label}
        {as === "button" && <Icon name="LuChevronDown" size={11} />}
      </Tag>
    );
  };

  const patientTitle = viewPatient?.full_name || viewPatient?.name || viewRow?.patientName;

  return (
    <div className="opdr">
      <style>{THEME_CSS}</style>

      <div className="opdr-shell">
        <div className="opdr-card">
          {/* Banner */}
          <div className="opdr-banner">
            <div className="opdr-title-wrap">
              <div className="opdr-logo">
                <Icon name="LuStethoscope" size={22} />
              </div>
              <div>
                <h3 className="opdr-title">OPD Consultation Report</h3>
                <p className="opdr-sub">
                  Outpatient consultation register with date-range filtering
                </p>
              </div>
            </div>
            <div className="opdr-count">
              <b>{total}</b>
              <span>
                Total
                <br />
                Records
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="opdr-filters">
            <div className="opdr-field">
              <label>From</label>
              <input
                className="opdr-input"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="opdr-field">
              <label>To</label>
              <input
                className="opdr-input"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <button type="button" onClick={applyDateRange} className="opdr-btn opdr-btn-primary">
              <Icon name="LuFilter" size={14} /> Apply Range
            </button>

            <button type="button" onClick={resetFilters} className="opdr-btn opdr-btn-ghost">
              <Icon name="LuRefreshCw" size={14} /> Reset
            </button>

            <div className="opdr-search">
              <Icon name="LuSearch" size={15} />
              <input
                type="text"
                placeholder="Search token, patient, doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="opdr-table-wrap">
            <div className="opdr-scroll">
              <table className="opdr-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Patient Name</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Complaint</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="opdr-empty">
                        Loading...
                      </td>
                    </tr>
                  ) : filtered.length > 0 ? (
                    filtered.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="opdr-token">{item.tokenNo}</span>
                        </td>
                        <td>
                          <div className="opdr-patient">
                            <div className="opdr-avatar">{getInitials(item.patientName)}</div>
                            <div>
                              <div className="opdr-pname">{item.patientName}</div>
                              <div className="opdr-uhid">{item.uhid}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: "#12315a" }}>{item.doctor}</td>
                        <td style={{ color: "#475569" }}>{item.department}</td>
                        <td
                          style={{
                            color: "#475569",
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.chiefComplaint}
                        </td>
                        <td style={{ color: "#5b6f88", whiteSpace: "nowrap" }}>{item.date}</td>
                        <td style={{ color: "#5b6f88", whiteSpace: "nowrap" }}>{item.time}</td>
                        <td>
                          {isSuperAdmin ? (
                            <StatusBadge
                              as="button"
                              type="button"
                              raw={item.rawStatus}
                              onClick={() => {
                                setStatusRow(item);
                                setNewStatus(item.rawStatus);
                              }}
                            />
                          ) : (
                            <StatusBadge raw={item.rawStatus} />
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => openRecordView(item)}
                              className="opdr-act opdr-act-print"
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
                                className="opdr-act opdr-act-status"
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
                      <td colSpan={9} className="opdr-empty">
                        <div className="opdr-empty-ic">
                          <Icon name="LuSearch" size={22} />
                        </div>
                        No matching records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="opdr-foot">
            <div className="opdr-info">
              Showing {total === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + rowsPerPage, total)} of {total} records
            </div>

            <div className="opdr-pages">
              <button
                type="button"
                className="opdr-pg"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
              >
                <Icon name="LuChevronLeft" size={15} />
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={"opdr-pg" + (page === safeCurrentPage ? " active" : "")}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="opdr-pg"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                <Icon name="LuChevronRight" size={15} />
              </button>
            </div>

            <div className="opdr-size">
              <label htmlFor="opd-report-page-size">Rows per page</label>
              <select
                id="opd-report-page-size"
                className="opdr-input"
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
      </div>

      {/* Status Modal */}
      {statusRow && (
        <div className="opdr-overlay">
          <div className="opdr-modal-shell" style={{ maxWidth: 380 }}>
            <div className="opdr-modal">
              <div className="opdr-mhead">
                <h3>
                  <Icon name="LuRefreshCw" size={16} /> Update OPD Status
                </h3>
                <button type="button" className="opdr-x" onClick={() => setStatusRow(null)}>
                  ×
                </button>
              </div>
              <div className="opdr-mbody">
                <p style={{ margin: 0, fontSize: 13, color: "#5b6f88" }}>
                  Patient:{" "}
                  <strong style={{ color: "#0b1e36" }}>{statusRow.patientName}</strong>
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
                        borderRadius: 12,
                        border:
                          newStatus === st.value
                            ? `2px solid ${st.color}`
                            : "1.5px solid #cfe2f3",
                        background: newStatus === st.value ? st.bg : "#fff",
                        color: newStatus === st.value ? st.color : "#12315a",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        boxShadow:
                          newStatus === st.value
                            ? "0 8px 16px -10px " + st.color
                            : "none",
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: st.color,
                          boxShadow: "0 0 0 3px " + st.bg,
                        }}
                      />
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="opdr-mfoot">
                <button
                  type="button"
                  onClick={() => setStatusRow(null)}
                  className="opdr-btn opdr-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus}
                  className="opdr-btn opdr-btn-primary"
                  style={updatingStatus ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                >
                  {updatingStatus ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record View / Print Modal */}
      {viewRow && (
        <div className="opdr-overlay" onClick={() => setViewRow(null)}>
          <div className="opdr-modal-shell" style={{ maxWidth: 880 }} onClick={(e) => e.stopPropagation()}>
            <div className="opdr-modal">
              <div className="opdr-mhead">
                <h3>
                  <Icon name="LuFileText" size={17} /> OPD Patient Report
                </h3>
                <button className="opdr-x" onClick={() => setViewRow(null)} title="Close">
                  ×
                </button>
              </div>

              <div className="opdr-mbody">
                {viewLoading ? (
                  <div style={{ padding: "40px 0", textAlign: "center", color: "#5b6f88" }}>
                    Loading patient details...
                  </div>
                ) : (
                  <>
                    <div className="opdr-hero">
                      <div className="opdr-avatar">{getInitials(patientTitle)}</div>
                      <div>
                        <h2>{patientTitle}</h2>
                        <p>
                          UHID: <strong>{viewPatient?.uhid || viewRow.uhid}</strong>
                          <span style={{ margin: "0 10px", opacity: 0.6 }}>|</span>
                          Token: <strong>{viewRow.tokenNo}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="opdr-panel">
                      <div className="opdr-panel-h">Patient Details</div>
                      <table className="opdr-dt">
                        <tbody>
                          <tr>
                            <td className="l">Patient Name</td>
                            <td className="v" style={{ width: "30%" }}>
                              {viewPatient?.full_name || viewPatient?.name || viewRow.patientName}
                            </td>
                            <td className="l">UHID</td>
                            <td className="v" style={{ color: "#1b4a82", fontFamily: "ui-monospace, Consolas, monospace" }}>
                              {viewPatient?.uhid || viewRow.uhid}
                            </td>
                          </tr>
                          <tr>
                            <td className="l">Gender / Age</td>
                            <td className="v">
                              {viewPatient?.gender || viewRow.gender} /{" "}
                              {viewPatient?.age || viewPatient?.ageYrs || "-"} Yrs
                            </td>
                            <td className="l">Mobile</td>
                            <td className="v">
                              {viewPatient?.phone || viewPatient?.mobile1 || viewRow.phone || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="l">Blood Group</td>
                            <td className="v" style={{ color: "#dc2626", fontWeight: 800 }}>
                              {viewPatient?.blood_group || viewPatient?.bloodGroup || "-"}
                            </td>
                            <td className="l">Date / Time</td>
                            <td className="v">
                              {viewRow.date} {viewRow.time}
                            </td>
                          </tr>
                          <tr>
                            <td className="l" style={{ verticalAlign: "top" }}>Address</td>
                            <td className="v" colSpan={3}>
                              {viewPatient?.address || viewPatient?.address_line1 || "-"}
                              {viewPatient?.city ? ", " + viewPatient.city : ""}
                              {viewPatient?.state ? ", " + viewPatient.state : ""}
                              {viewPatient?.pincode || viewPatient?.postal_code
                                ? " (" + (viewPatient.pincode || viewPatient.postal_code) + ")"
                                : ""}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="opdr-panel">
                      <div className="opdr-panel-h">Consultation Details</div>
                      <table className="opdr-dt">
                        <tbody>
                          <tr>
                            <td className="l">Doctor</td>
                            <td className="v" style={{ width: "30%" }}>{viewRow.doctor}</td>
                            <td className="l">Department</td>
                            <td className="v">{viewRow.department}</td>
                          </tr>
                          <tr>
                            <td className="l">Chief Complaint</td>
                            <td className="v" colSpan={3}>{viewRow.chiefComplaint}</td>
                          </tr>
                          <tr>
                            <td className="l">Status</td>
                            <td className="v" colSpan={3}>
                              <StatusBadge raw={viewRow.rawStatus} />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              <div className="opdr-mfoot">
                <button
                  onClick={handlePrintReport}
                  className="opdr-btn"
                  style={{
                    border: "none",
                    color: "#fff",
                    background: "linear-gradient(180deg, #10b981, #047857)",
                    boxShadow: "0 8px 16px -8px rgba(4,120,87,.8)",
                  }}
                >
                  <Icon name="LuPrinter" size={14} /> Print
                </button>
                <button onClick={() => setViewRow(null)} className="opdr-btn opdr-btn-ghost">
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