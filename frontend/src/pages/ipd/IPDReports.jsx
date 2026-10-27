import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import ipdService from "../../api/services/ipdService";
import "./IPDReports.css";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const IPD_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "admitted", label: "Admitted (Active)", color: "#15803d", bg: "#f0fdf4", border: "#86efac" },
  { value: "discharged", label: "Discharged", color: "#1d4ed8", bg: "#eff6ff", border: "#93c5fd" },
  { value: "transferred", label: "Transferred", color: "#a21caf", bg: "#fdf4ff", border: "#f0abfc" },
  { value: "lama", label: "LAMA", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  { value: "dama", label: "DAMA", color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5" },
];

const getStatusConfig = (val) => {
  const norm = String(val || "").toLowerCase();
  return (
    IPD_STATUSES.find((s) => s.value === norm) || {
      value: norm,
      label: norm.toUpperCase(),
      color: "#475569",
      bg: "#f1f5f9",
      border: "#cbd5e1",
    }
  );
};

// Calculate Age helper
const calculateAge = (dob, fallbackAge) => {
  if (fallbackAge) return fallbackAge;
  if (!dob) return "—";
  try {
    const diff = Date.now() - new Date(dob).getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return age > 0 ? age : "1";
  } catch {
    return "—";
  }
};

// Calculate Days Stay helper
const calculateStayDays = (admittedAt, dischargedAt) => {
  if (!admittedAt) return 1;
  try {
    const start = new Date(admittedAt);
    const end = dischargedAt ? new Date(dischargedAt) : new Date();
    const diff = Math.max(0, end - start);
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  } catch {
    return 1;
  }
};

// Export to Excel CSV
const exportIPDToExcel = (records) => {
  if (!records || records.length === 0) {
    toast.error("No inpatient records to export!");
    return;
  }

  const headers = [
    "IPD Adm No",
    "UHID",
    "Patient Name",
    "Gender",
    "Age",
    "Phone",
    "Admit Date",
    "Discharge Date",
    "Ward",
    "Bed No",
    "Doctor",
    "Diagnosis",
    "Admission Type",
    "Attendant Name",
    "Attendant Mobile",
    "Status",
    "Total Charges (₹)",
    "Payments Received (₹)",
    "Balance Due (₹)",
  ];

  const rows = records.map((adm) => {
    const pName = `${adm.first_name || ""} ${adm.last_name || ""}`.trim() || "Inpatient";
    const doctorName = adm.doctor_first_name
      ? `Dr. ${adm.doctor_first_name} ${adm.doctor_last_name || ""}`.trim()
      : "On-Duty Specialist";
    const totalCharges = Number(adm.total_charges || 0);
    const totalPayments = Number(adm.total_payments || 0);
    const due = Math.max(0, totalCharges - totalPayments);

    return [
      adm.admission_no || adm.encounter_no || adm.id || "",
      adm.uhid || "",
      pName,
      adm.gender || "—",
      calculateAge(adm.date_of_birth, adm.age),
      adm.phone || adm.mobile || "—",
      adm.admitted_at ? new Date(adm.admitted_at).toLocaleString("en-IN") : "—",
      adm.discharged_at ? new Date(adm.discharged_at).toLocaleString("en-IN") : "—",
      adm.ward_name || "General Ward",
      adm.bed_name || "—",
      doctorName,
      adm.admission_diagnosis || adm.reason_for_admission || "Clinical Management",
      adm.admission_type || "Normal",
      adm.attendant_name || "—",
      adm.attendant_phone || "—",
      adm.status || "admitted",
      totalCharges.toFixed(2),
      totalPayments.toFixed(2),
      due.toFixed(2),
    ];
  });

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `IPD_Inpatient_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success(`Exported ${records.length} IPD records to Excel!`, { icon: "📊" });
};

export default function IPDReports() {
  const navigate = useNavigate();

  // Real data states from backend
  const [admissions, setAdmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals
  const [viewAdmission, setViewAdmission] = useState(null);
  const [transferModalAdm, setTransferModalAdm] = useState(null);
  const [newBedId, setNewBedId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [statusModalAdm, setStatusModalAdm] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState("");

  // Load real IPD data from backend API
  const loadRealIPDData = useCallback(async () => {
    setLoading(true);
    try {
      const [admRes, statsRes, bedsRes] = await Promise.allSettled([
        ipdService.getAdmissions({ status: "all" }),
        ipdService.getReportStats(),
        ipdService.getBedMatrix(),
      ]);

      if (admRes.status === "fulfilled") {
        const raw = admRes.value;
        const list = Array.isArray(raw) ? raw : raw?.rows || raw?.data || [];
        setAdmissions(list);
      } else {
        console.error("Admissions fetch error:", admRes.reason);
        setAdmissions([]);
      }

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
      }

      if (bedsRes.status === "fulfilled") {
        const rawBeds = bedsRes.value;
        const bedList = Array.isArray(rawBeds) ? rawBeds : rawBeds?.data || [];
        setBeds(bedList);
      }
    } catch (err) {
      console.error("Failed to load real IPD reports:", err);
      toast.error("Could not load real-time IPD data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRealIPDData();
  }, [loadRealIPDData]);

  // Extract unique ward names dynamically from real records
  const availableWards = useMemo(() => {
    const set = new Set();
    admissions.forEach((a) => {
      if (a.ward_name) set.add(a.ward_name);
    });
    beds.forEach((b) => {
      if (b.ward_name) set.add(b.ward_name);
    });
    return Array.from(set).sort();
  }, [admissions, beds]);

  // Filter admissions based on search, ward, status, date
  const filteredAdmissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return admissions.filter((adm) => {
      // 1. Search Query
      if (q) {
        const pName = `${adm.first_name || ""} ${adm.last_name || ""}`.toLowerCase();
        const uhid = String(adm.uhid || "").toLowerCase();
        const admNo = String(adm.admission_no || adm.encounter_no || adm.id || "").toLowerCase();
        const phone = String(adm.phone || adm.mobile || "").toLowerCase();
        const bed = String(adm.bed_name || "").toLowerCase();
        const doc = `${adm.doctor_first_name || ""} ${adm.doctor_last_name || ""}`.toLowerCase();
        const ward = String(adm.ward_name || "").toLowerCase();

        const match =
          pName.includes(q) ||
          uhid.includes(q) ||
          admNo.includes(q) ||
          phone.includes(q) ||
          bed.includes(q) ||
          doc.includes(q) ||
          ward.includes(q);

        if (!match) return false;
      }

      // 2. Ward Filter
      if (wardFilter !== "All" && adm.ward_name !== wardFilter) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter !== "all") {
        const s = String(adm.status || "").toLowerCase();
        if (s !== statusFilter) return false;
      }

      // 4. Date Filter
      if (dateFilter !== "all" && adm.admitted_at) {
        const admitted = new Date(adm.admitted_at);
        if (dateFilter === "today" && admitted < startOfToday) return false;
        if (dateFilter === "week") {
          const weekAgo = new Date(startOfToday);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (admitted < weekAgo) return false;
        }
        if (dateFilter === "month") {
          const monthAgo = new Date(startOfToday);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (admitted < monthAgo) return false;
        }
      }

      return true;
    });
  }, [admissions, search, wardFilter, statusFilter, dateFilter]);

  // Pagination calculation
  const totalRecords = filteredAdmissions.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedAdmissions = filteredAdmissions.slice(startIndex, startIndex + rowsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, wardFilter, statusFilter, dateFilter, rowsPerPage]);

  // Executive KPI summary data from real admissions & stats
  const activeCount = admissions.filter((a) => (a.status || "admitted").toLowerCase() === "admitted").length;
  const dischargedCount = admissions.filter((a) => (a.status || "").toLowerCase() === "discharged").length;
  const totalBedsCount = stats?.overview?.totalBeds || beds.length || 30;
  const availableBedsCount = Math.max(0, totalBedsCount - activeCount);
  const occupancyRate = totalBedsCount > 0 ? ((activeCount / totalBedsCount) * 100).toFixed(1) : "0";

  // Handle Quick Bed Transfer
  const handleConfirmTransfer = async () => {
    if (!transferModalAdm || !newBedId) {
      toast.error("Please select a target bed!");
      return;
    }
    try {
      await ipdService.transferBed({
        admission_id: transferModalAdm.id,
        target_bed_id: newBedId,
        reason: transferReason || "Inpatient Ward Re-allocation",
      });
      toast.success("Bed transfer completed successfully!", { icon: "🛏️" });
      setTransferModalAdm(null);
      setNewBedId("");
      setTransferReason("");
      loadRealIPDData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to transfer bed. Selected bed may be occupied.");
    }
  };

  // Handle Quick Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusModalAdm || !updatedStatus) return;
    try {
      if (updatedStatus === "discharged") {
        await ipdService.dischargePatient(statusModalAdm.id, {
          discharge_type: "normal",
          discharge_condition: "Clinically Stable",
        });
      }
      toast.success(`Patient status updated to ${updatedStatus}!`, { icon: "🔄" });
      setStatusModalAdm(null);
      loadRealIPDData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="ipdr-page">
      {/* ── 1. TOP EXECUTIVE HEADER (MATCHING REGISTRATION REPORTS) ── */}
      <div className="ipdr-header">
        <div className="ipdr-header-left">
          <div className="ipdr-header-icon">
            <Icon name="LuBedDouble" size={24} />
          </div>
          <div>
            <h1 className="ipdr-title">(IPD) Registration Reports</h1>
            
          </div>
        </div>

        <div className="ipdr-controls">
          {/* Search Box */}
          <div className="ipdr-search">
            <Icon name="LuSearch" size={16} />
            <input
              type="text"
              placeholder="Search name, UHID, adm no, bed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="ipdr-search-clear"
                onClick={() => setSearch("")}
                title="Clear Search"
              >
                <Icon name="LuX" size={14} />
              </button>
            )}
          </div>

          {/* Ward Filter */}
          <select
            className="ipdr-select"
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
          >
            <option value="All">All Wards</option>
            {availableWards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="ipdr-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {IPD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Time Filter */}
          <select
            className="ipdr-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Admitted Today</option>
            <option value="week">Admitted This Week</option>
            <option value="month">Admitted This Month</option>
          </select>

          {/* Export to Excel */}
          <button
            type="button"
            className="ipdr-btn ipdr-btn--green"
            onClick={() => exportIPDToExcel(filteredAdmissions)}
            title="Export filtered records to Excel CSV"
          >
            <Icon name="LuDownload" size={15} /> Export Excel
          </button>
        </div>
      </div>

      

      {/* ── 3. MAIN TABLE CARD (MATCHING USER SCREENSHOT) ── */}
      <div className="ipdr-card">
        <div className="ipdr-table-wrap">
          <table className="ipdr-table">
            <thead>
              <tr>
                <th>IPD ADM NO</th>
                <th>ADMIT DATE</th>
                <th>PATIENT NAME</th>
                <th>MOBILE NUMBER</th>
                <th>WARD &amp; BED</th>
                <th>ATTENDING DOCTOR</th>
                <th>STATUS</th>
                <th style={{ textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="ipdr-empty-box">
                    <Icon name="LuRefreshCw" size={28} className="spin" />
                    <p>Loading real-time inpatient records...</p>
                    <small>Fetching latest ward admissions from hospital database.</small>
                  </td>
                </tr>
              ) : paginatedAdmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="ipdr-empty-box">
                    <Icon name="LuFolderSearch" size={36} />
                    <p>No inpatient records found</p>
                    <small>Try adjusting your search query, ward filter, or status filter.</small>
                  </td>
                </tr>
              ) : (
                paginatedAdmissions.map((adm, idx) => {
                  const pName = `${adm.first_name || ""} ${adm.last_name || ""}`.trim() || "Inpatient";
                  const doctorName = adm.doctor_first_name
                    ? `Dr. ${adm.doctor_first_name} ${adm.doctor_last_name || ""}`.trim()
                    : "On-Duty Specialist";
                  const age = calculateAge(adm.date_of_birth, adm.age);
                  const gender = adm.gender ? adm.gender.charAt(0).toUpperCase() + adm.gender.slice(1) : "—";
                  const statusConf = getStatusConfig(adm.status);
                  const isIcu = (adm.ward_name || "").toLowerCase().includes("icu");
                  const isPrivate = (adm.ward_name || "").toLowerCase().includes("private");

                  return (
                    <tr key={adm.id || idx}>
                      {/* IPD ADM NO */}
                      <td>
                        <button
                          type="button"
                          className="ipdr-uhid-link"
                          onClick={() => setViewAdmission(adm)}
                          title="View Inpatient Admission Details"
                        >
                          {adm.admission_no || adm.encounter_no || `ADM-${String(adm.id).slice(-6)}`}
                        </button>
                        <div className="ipdr-sub-meta">UHID: {adm.uhid || "—"}</div>
                      </td>

                      {/* ADMIT DATE */}
                      <td>
                        <div style={{ fontWeight: 750, color: "#0f172a" }}>
                          {adm.admitted_at
                            ? new Date(adm.admitted_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </div>
                        <div className="ipdr-sub-meta">
                          {adm.admitted_at
                            ? new Date(adm.admitted_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </div>
                      </td>

                      {/* PATIENT NAME */}
                      <td>
                        <button
                          type="button"
                          className="ipdr-pname-link"
                          onClick={() => setViewAdmission(adm)}
                          title="View Inpatient Profile"
                        >
                          {pName}
                        </button>
                        <div className="ipdr-sub-meta">
                          {gender} / {age} Yrs • 🩸 {adm.blood_group || "O+"}
                        </div>
                      </td>

                      {/* MOBILE NUMBER */}
                      <td>{adm.phone || adm.mobile || "—"}</td>

                      {/* WARD & BED */}
                      <td>
                        <span
                          className={`ipdr-pill ${
                            isIcu ? "ipdr-pill--icu" : isPrivate ? "ipdr-pill--private" : "ipdr-pill--ward"
                          }`}
                        >
                          <Icon name="LuBed" size={12} />
                          {adm.ward_name || "General Ward"} • {adm.bed_name || "Bed"}
                        </span>
                      </td>

                      {/* ATTENDING DOCTOR */}
                      <td>
                        <div style={{ fontWeight: 750, color: "#1e293b" }}>{doctorName}</div>
                        <div className="ipdr-sub-meta">{adm.department || "General Medicine"}</div>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`ipdr-status-badge ${
                            adm.status === "admitted"
                              ? "ipdr-status--admitted"
                              : adm.status === "discharged"
                              ? "ipdr-status--discharged"
                              : adm.status === "transferred"
                              ? "ipdr-status--transferred"
                              : "ipdr-status--lama"
                          }`}
                        >
                          <span
                            className="ipdr-status-dot"
                            style={{ backgroundColor: statusConf.color }}
                          />
                          {statusConf.label}
                        </span>
                      </td>

                      {/* ACTIONS (MATCHING REGISTRATION REPORT BUTTONS) */}
                      <td>
                        <div className="ipdr-actions-cell" style={{ justifyContent: "center" }}>
                          {/* 1. View Inpatient Form (Blue) */}
                          <button
                            type="button"
                            className="ipdr-act-btn ipdr-act-btn--view"
                            onClick={() => setViewAdmission(adm)}
                            title="View Inpatient Clinical Record"
                          >
                            <Icon name="LuEye" size={15} />
                          </button>

                          {/* 2. Print Admission Record (Green) */}
                          <button
                            type="button"
                            className="ipdr-act-btn ipdr-act-btn--print"
                            onClick={() => {
                              setViewAdmission(adm);
                              setTimeout(() => window.print(), 250);
                            }}
                            title="Print Admission & Bed Slip"
                          >
                            <Icon name="LuPrinter" size={15} />
                          </button>

                          {/* 3. Bed Shift / Transfer (Gold) */}
                          <button
                            type="button"
                            className="ipdr-act-btn ipdr-act-btn--transfer"
                            onClick={() => {
                              setTransferModalAdm(adm);
                              setNewBedId("");
                              setTransferReason("");
                            }}
                            title="Bed Re-allocation / Transfer"
                          >
                            <Icon name="LuBed" size={14} />
                          </button>

                          {/* 4. Discharge / Update Status (Purple) */}
                          <button
                            type="button"
                            className="ipdr-act-btn ipdr-act-btn--discharge"
                            onClick={() => {
                              if (adm.status === "admitted") {
                                navigate(`/ipd/discharge?id=${adm.id}`);
                              } else {
                                setStatusModalAdm(adm);
                                setUpdatedStatus(adm.status || "admitted");
                              }
                            }}
                            title={adm.status === "admitted" ? "Open IPD Discharge Protocol" : "Update Status"}
                          >
                            <Icon name="LuRefreshCw" size={14} />
                          </button>

                          {/* 5. Cancel / Void (Red) */}
                          <button
                            type="button"
                            className="ipdr-act-btn ipdr-act-btn--cancel"
                            onClick={() => {
                              if (window.confirm(`Cancel admission record for ${pName}?`)) {
                                toast.success("Admission voided.");
                              }
                            }}
                            title="Cancel Inpatient Record"
                          >
                            <Icon name="LuBan" size={14} />
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

        {/* ── 4. FOOTER & PAGINATION ── */}
        <div className="ipdr-footer">
          <p className="ipdr-count-text">
            Showing {totalRecords === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(startIndex + rowsPerPage, totalRecords)} of {totalRecords} records
          </p>

          <div className="ipdr-pager">
            <button
              type="button"
              className="ipdr-pg-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              Previous
            </button>

            {pageNumbers
              .slice(Math.max(0, safePage - 3), Math.min(totalPages, safePage + 2))
              .map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`ipdr-pg-btn ${page === safePage ? "ipdr-pg-btn--active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

            <button
              type="button"
              className="ipdr-pg-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </button>
          </div>

          <div className="ipdr-size-select">
            <label htmlFor="ipdr-page-size-select">Rows per page:</label>
            <select
              id="ipdr-page-size-select"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 5. VIEW INPATIENT ADMISSION MODAL (MATCHING REGISTRATION FORM VIEW MODAL) ── */}
      {viewAdmission && (() => {
        const pName = `${viewAdmission.first_name || ""} ${viewAdmission.last_name || ""}`.trim() || "Inpatient";
        const admNo = viewAdmission.admission_no || viewAdmission.encounter_no || `ADM-${String(viewAdmission.id).slice(-6)}`;
        const uhid = viewAdmission.uhid || "—";
        const admitDateStr = viewAdmission.admitted_at
          ? new Date(viewAdmission.admitted_at).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";
        const age = calculateAge(viewAdmission.date_of_birth, viewAdmission.age);
        const gender = viewAdmission.gender
          ? viewAdmission.gender.charAt(0).toUpperCase() + viewAdmission.gender.slice(1)
          : "Male";
        const stayDays = calculateStayDays(viewAdmission.admitted_at, viewAdmission.discharged_at);
        const doctorName = viewAdmission.doctor_first_name
          ? `Dr. ${viewAdmission.doctor_first_name} ${viewAdmission.doctor_last_name || ""}`.trim()
          : "On-Duty Specialist";
        const statusConf = getStatusConfig(viewAdmission.status);
        const charges = Number(viewAdmission.total_charges || 0);
        const payments = Number(viewAdmission.total_payments || 0);
        const balance = Math.max(0, charges - payments);

        return (
          <div className="ipdr-overlay" onClick={() => setViewAdmission(null)}>
            <div className="ipdr-modal" id="ipdr-printable-modal" onClick={(e) => e.stopPropagation()}>
              {/* Header Bar */}
              <div className="ipdr-modal-head">
                <div className="ipdr-modal-head-left">
                  <div className="ipdr-modal-icon">
                    <Icon name="LuFileText" size={20} />
                  </div>
                  <div>
                    <h3 className="ipdr-modal-title">
                      Patient (IPD) Admission Record
                      
                    </h3>
                    <p className="ipdr-modal-meta">
                      IPD ADM: <strong style={{ color: "#ffd766" }}>{admNo}</strong>
                      <span style={{ margin: "0 8px", opacity: 0.6 }}>•</span>
                      UHID: <strong style={{ color: "#ffffff" }}>{uhid}</strong>
                      <span style={{ margin: "0 8px", opacity: 0.6 }}>•</span>
                      Admitted: <strong>{admitDateStr}</strong>
                    </p>
                  </div>
                </div>

                <div className="ipdr-head-actions">
                 
                  <button
                    type="button"
                    className="ipdr-close-btn"
                    onClick={() => setViewAdmission(null)}
                    title="Close"
                  >
                    <Icon name="LuX" size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body with All 6 Sections */}
              <div className="ipdr-modal-body">
                {/* Hospital Top Branding Header */}
                <div className="ipdr-hosp-header">
                  <div className="ipdr-hosp-brand">
                    <div className="ipdr-hosp-logo">
                      <Icon name="LuPlus" size={26} />
                    </div>
                    <div>
                      <h2 className="ipdr-hosp-name">NARAYAN HOSPITAL &amp; MEDICAL RESEARCH CENTRE</h2>
                      <p className="ipdr-hosp-sub">
                        NABH Accredited Multi-Specialty Hospital • 24x7 Emergency, ICU &amp; Inpatient Care
                      </p>
                      <p className="ipdr-hosp-addr">
                        Station Road, Civil Lines, Kota, Rajasthan - 324001 • Tel: +91 744 2450000
                      </p>
                    </div>
                  </div>
                  <div className="ipdr-hosp-tag-box">
                    <span className="ipdr-hosp-tag-lbl">INPATIENT ADMISSION CARD</span>
                    <span className="ipdr-hosp-tag-adm">{admNo}</span>
                    <span className="ipdr-hosp-tag-date">Date: {admitDateStr.split(",")[0]}</span>
                  </div>
                </div>

                {/* Patient Summary Header Card */}
                <div className="ipdr-banner">
                  <div className="ipdr-banner-left">
                    <div className="ipdr-avatar">{pName[0]?.toUpperCase()}</div>
                    <div>
                      <h2>{pName}</h2>
                      <div className="ipdr-banner-meta">
                        <span>
                          UHID: <strong className="ipdr-blue-tag">{uhid}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Stay: <strong>{stayDays} Day{stayDays > 1 ? "s" : ""}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Ward: <strong>{viewAdmission.ward_name || "General Ward"} ({viewAdmission.bed_name || "Bed"})</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Doctor: <strong>{doctorName}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ipdr-banner-right">
                    <small>Admission Status</small>
                    <span
                      className="ipdr-status-badge"
                      style={{
                        backgroundColor: statusConf.bg,
                        color: statusConf.color,
                        border: `1px solid ${statusConf.border}`,
                      }}
                    >
                      <span className="ipdr-status-dot" style={{ backgroundColor: statusConf.color }} />
                      {statusConf.label}
                    </span>
                  </div>
                </div>

                {/* Section 1: Patient Demographic Details */}
                <div className="ipdr-section">
                  <div className="ipdr-section-head">
                    <h4 className="ipdr-section-title">
                      <span className="ipdr-dot ipdr-dot--blue"></span> 1. Patient &amp; Demographics Details
                    </h4>
                    <span className="ipdr-section-note">Personal &amp; Contact Records</span>
                  </div>
                  <table className="ipdr-dtable">
                    <tbody>
                      <tr>
                        <td className="ipdr-lbl">Patient Full Name</td>
                        <td className="ipdr-val ipdr-val--strong">{pName}</td>
                        <td className="ipdr-lbl">UHID Number</td>
                        <td className="ipdr-val ipdr-val--uhid">{uhid}</td>
                      </tr>
                      <tr>
                        <td className="ipdr-lbl">Gender / Age</td>
                        <td className="ipdr-val ipdr-val--strong">
                          {gender} / {age} Yrs
                        </td>
                        <td className="ipdr-lbl">Blood Group</td>
                        <td className="ipdr-val ipdr-val--blood">
                          🩸 {viewAdmission.blood_group || "O+"}
                        </td>
                      </tr>
                      <tr>
                        <td className="ipdr-lbl">Contact Phone</td>
                        <td className="ipdr-val">{viewAdmission.phone || viewAdmission.mobile || "—"}</td>
                        <td className="ipdr-lbl">Nationality</td>
                        <td className="ipdr-val">Indian</td>
                      </tr>
                      <tr>
                        <td className="ipdr-lbl">Residential Address</td>
                        <td colSpan={3} className="ipdr-val">
                          {viewAdmission.address || "Station Road, Kota, Rajasthan"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 2: Inpatient Admission & Bed Allocation */}
                <div className="ipdr-section">
                  <div className="ipdr-section-head">
                    <h4 className="ipdr-section-title">
                      <span className="ipdr-dot ipdr-dot--violet"></span> 2. Inpatient Admission &amp; Bed Allocation
                    </h4>
                    <span className="ipdr-section-note">Ward &amp; Room Allotment</span>
                  </div>
                  <table className="ipdr-dtable">
                    <tbody>
                      <tr>
                        <td className="ipdr-lbl">IPD Admission No</td>
                        <td className="ipdr-val ipdr-val--strong">{admNo}</td>
                        <td className="ipdr-lbl">Admission Date &amp; Time</td>
                        <td className="ipdr-val">{admitDateStr}</td>
                      </tr>
                      <tr>
                        <td className="ipdr-lbl">Admission Type</td>
                        <td className="ipdr-val ipdr-val--strong">
                          {viewAdmission.admission_type || "Emergency"} (भर्ती प्रकार)
                        </td>
                        <td className="ipdr-lbl">Total Stay Duration</td>
                        <td className="ipdr-val ipdr-val--strong" style={{ color: "#059669" }}>
                          {stayDays} Day{stayDays > 1 ? "s" : ""}
                        </td>
                      </tr>
                      <tr>
                        <td className="ipdr-lbl">Assigned Ward</td>
                        <td className="ipdr-val ipdr-val--strong">{viewAdmission.ward_name || "General Ward"}</td>
                        <td className="ipdr-lbl">Assigned Bed Number</td>
                        <td className="ipdr-val ipdr-val--uhid">{viewAdmission.bed_name || "Bed"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Clinical & Medical Details */}
                <div className="ipdr-section">
                  <div className="ipdr-section-head">
                    <h4 className="ipdr-section-title">
                      <span className="ipdr-dot ipdr-dot--green"></span> 3. Clinical &amp; Attending Consultant
                    </h4>
                    <span className="ipdr-section-note">Medical Management &amp; Diagnosis</span>
                  </div>
                  <table className="ipdr-dtable">
                    <tbody>
                      <tr>
                        <td className="ipdr-lbl">Attending Physician</td>
                        <td className="ipdr-val ipdr-val--strong">{doctorName}</td>
                        <td className="ipdr-lbl">Department / Specialty</td>
                        <td className="ipdr-val">{viewAdmission.department || "General Medicine"}</td>
                      </tr>
                      <tr>
                        <td className="ipdr-lbl">Admission Diagnosis</td>
                        <td colSpan={3} className="ipdr-val ipdr-val--strong" style={{ color: "#0f172a" }}>
                          {viewAdmission.admission_diagnosis || viewAdmission.reason_for_admission || "Inpatient Clinical Care"}
                        </td>
                      </tr>
                      <tr>
                        <td className="ipdr-lbl">Payer / Insurance</td>
                        <td className="ipdr-val">{viewAdmission.payer_type || "Self Pay"}</td>
                        <td className="ipdr-lbl">Discharge Date</td>
                        <td className="ipdr-val">
                          {viewAdmission.discharged_at
                            ? new Date(viewAdmission.discharged_at).toLocaleDateString("en-IN")
                            : "Still Admitted (Active)"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 4: Attendant & Next of Kin */}
                <div className="ipdr-section">
                  <div className="ipdr-section-head">
                    <h4 className="ipdr-section-title">
                      <span className="ipdr-dot ipdr-dot--amber"></span> 4. Attendant &amp; Next of Kin
                    </h4>
                    <span className="ipdr-section-note">Guardian &amp; Emergency Contact</span>
                  </div>
                  <table className="ipdr-dtable">
                    <tbody>
                      <tr>
                        <td className="ipdr-lbl">Primary Attendant</td>
                        <td className="ipdr-val ipdr-val--strong">
                          {viewAdmission.attendant_name || "Family Attendant"}
                        </td>
                        <td className="ipdr-lbl">Relationship</td>
                        <td className="ipdr-val">{viewAdmission.attendant_relation || "Relative"}</td>
                      </tr>
                      <tr>
                        <td className="ipdr-lbl">Attendant Mobile</td>
                        <td colSpan={3} className="ipdr-val ipdr-val--strong">
                          {viewAdmission.attendant_phone || viewAdmission.phone || "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 5: Inpatient Financials & Billing Status */}
                <div className="ipdr-section">
                  <div className="ipdr-section-head">
                    <h4 className="ipdr-section-title">
                      <span className="ipdr-dot ipdr-dot--red"></span> 5. IPD Charges &amp; Advance Billing
                    </h4>
                    <span className="ipdr-section-note">Financial &amp; Ledger Summary</span>
                  </div>
                  <table className="ipdr-dtable">
                    <tbody>
                      <tr>
                        <td className="ipdr-lbl">Total Incurred Charges</td>
                        <td className="ipdr-val ipdr-val--strong">₹ {charges.toFixed(2)}</td>
                        <td className="ipdr-lbl">Payments / Advance Received</td>
                        <td className="ipdr-val ipdr-val--strong" style={{ color: "#059669" }}>
                          ₹ {payments.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="ipdr-lbl">Net Balance Due</td>
                        <td className="ipdr-val ipdr-val--strong" style={{ color: balance > 0 ? "#dc2626" : "#059669" }}>
                          ₹ {balance.toFixed(2)} {balance === 0 ? "(Cleared ✓)" : ""}
                        </td>
                        <td className="ipdr-lbl">Billing Status</td>
                        <td className="ipdr-val">
                          <span
                            style={{
                              background: balance === 0 ? "#dcfce7" : "#fee2e2",
                              color: balance === 0 ? "#15803d" : "#b91c1c",
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontWeight: 800,
                              fontSize: 11.5,
                            }}
                          >
                            {balance === 0 ? "Fully Cleared" : "Payment Pending"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 6: Hospital Instructions & Inpatient Guidelines */}
                <div className="ipdr-rules-section">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span className="ipdr-dot" style={{ backgroundColor: "#f59e0b" }}></span>
                    <strong style={{ fontSize: 12, color: "#081a3d", textTransform: "uppercase" }}>
                      6. Hospital Inpatient Instructions &amp; Patient Guidelines (दिशानिर्देश)
                    </strong>
                  </div>
                  <div className="ipdr-rules-list">
                    <p>
                      • <strong>Attendant Pass:</strong> Only 1 attendant is allowed to stay overnight with patient. Please wear attendant badge at all times.
                    </p>
                    <p>
                      • <strong>Visiting Hours:</strong> Morning: 10:00 AM – 11:30 AM | Evening: 05:00 PM – 07:00 PM. Children below 10 years not permitted in ICU.
                    </p>
                    <p>
                      • <strong>Medications &amp; Nursing:</strong> Please administer only medications verified by on-duty nursing staff and consultant doctor.
                    </p>
                    <p>
                      • <strong>Discharge Formalities:</strong> Standard discharge processing commences at 10:00 AM upon clearance from Pharmacy, Laboratory &amp; Billing.
                    </p>
                  </div>
                </div>

                {/* Verification Barcode & Signatures Footer */}
                <div className="ipdr-print-footer">
                  <div className="ipdr-print-barcode-box">
                    <div className="ipdr-barcode-lines"></div>
                    <span className="ipdr-barcode-text">*{admNo}-{uhid}*</span>
                    <span className="ipdr-gen-stamp">Generated: {new Date().toLocaleString("en-IN")}</span>
                  </div>
                  <div className="ipdr-print-sig-box">
                    <div className="ipdr-sig-line"></div>
                    <span className="ipdr-sig-label">Authorized Inpatient Officer / Ward In-Charge</span>
                    <span className="ipdr-hosp-seal">Narayan Hospital &amp; Medical Research Centre</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="ipdr-modal-foot">
                <div className="ipdr-foot-group">
                  <button
                    type="button"
                    className="ipdr-btn ipdr-btn--green"
                    onClick={() => window.print()}
                  >
                    <Icon name="LuPrinter" size={15} /> Print Inpatient Record
                  </button>
                  {viewAdmission.status === "admitted" && (
                    <button
                      type="button"
                      className="ipdr-btn ipdr-btn--navy"
                      onClick={() => {
                        const adm = viewAdmission;
                        setViewAdmission(null);
                        navigate(`/ipd/discharge?id=${adm.id}`);
                      }}
                    >
                      <Icon name="LuFileCheck" size={15} /> Open Discharge Workflow
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="ipdr-btn ipdr-btn--ghost"
                  onClick={() => setViewAdmission(null)}
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 6. BED TRANSFER MODAL ── */}
      {transferModalAdm && (
        <div className="ipdr-overlay" onClick={() => setTransferModalAdm(null)}>
          <div className="ipdr-modal ipdr-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="ipdr-modal-head">
              <div className="ipdr-modal-head-left">
                <div className="ipdr-modal-icon">
                  <Icon name="LuBed" size={18} />
                </div>
                <h3 className="ipdr-modal-title">Inpatient Bed Transfer / Shift</h3>
              </div>
              <button
                type="button"
                className="ipdr-close-btn"
                onClick={() => setTransferModalAdm(null)}
              >
                <Icon name="LuX" size={16} />
              </button>
            </div>

            <div className="ipdr-modal-body" style={{ gap: 12 }}>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                  {transferModalAdm.first_name} {transferModalAdm.last_name}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Current Bed: <strong>{transferModalAdm.ward_name} ({transferModalAdm.bed_name})</strong>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 750, color: "#334155", marginBottom: 4 }}>
                  Select Target Available Bed *
                </label>
                <select
                  className="ipdr-select"
                  style={{ width: "100%" }}
                  value={newBedId}
                  onChange={(e) => setNewBedId(e.target.value)}
                >
                  <option value="">-- Choose Vacant Bed --</option>
                  {beds
                    .filter((b) => (b.current_status || b.status || "available").toLowerCase() === "available")
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.ward_name} • {b.bed_no} ({b.room_name || "Ward"})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 750, color: "#334155", marginBottom: 4 }}>
                  Transfer Reason / Clinical Indication
                </label>
                <input
                  type="text"
                  placeholder="e.g. ICU step-down to General Ward, patient request..."
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 6,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                  }}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                />
              </div>
            </div>

            <div className="ipdr-modal-foot">
              <button
                type="button"
                className="ipdr-btn ipdr-btn--ghost"
                onClick={() => setTransferModalAdm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ipdr-btn ipdr-btn--green"
                onClick={handleConfirmTransfer}
              >
                Confirm Bed Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. STATUS UPDATE MODAL ── */}
      {statusModalAdm && (
        <div className="ipdr-overlay" onClick={() => setStatusModalAdm(null)}>
          <div className="ipdr-modal ipdr-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="ipdr-modal-head">
              <div className="ipdr-modal-head-left">
                <div className="ipdr-modal-icon">
                  <Icon name="LuRefreshCw" size={18} />
                </div>
                <h3 className="ipdr-modal-title">Update Inpatient Status</h3>
              </div>
              <button
                type="button"
                className="ipdr-close-btn"
                onClick={() => setStatusModalAdm(null)}
              >
                <Icon name="LuX" size={16} />
              </button>
            </div>

            <div className="ipdr-modal-body" style={{ gap: 10 }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Patient: <strong>{statusModalAdm.first_name} {statusModalAdm.last_name}</strong>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {IPD_STATUSES.filter((s) => s.value !== "all").map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setUpdatedStatus(st.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: updatedStatus === st.value ? `2px solid ${st.color}` : "1.5px solid #cbd5e1",
                      background: updatedStatus === st.value ? st.bg : "#ffffff",
                      color: updatedStatus === st.value ? st.color : "#0f172a",
                      fontWeight: 750,
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: st.color }} />
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ipdr-modal-foot">
              <button
                type="button"
                className="ipdr-btn ipdr-btn--ghost"
                onClick={() => setStatusModalAdm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ipdr-btn ipdr-btn--green"
                onClick={handleConfirmStatusChange}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
