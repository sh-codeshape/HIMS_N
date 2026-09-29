import React, { useState, useEffect } from "react";
import { mockStore } from "../../../mock/mockStore";
import { useAuth } from "../../../auth";
import { ROLES } from "../../../auth/roles";
import {
  LuSearch, LuX, LuDownload, LuFilter,
  LuEye, LuSquarePen, LuRefreshCw, LuBan, LuTrash2,
  LuPrinter, LuSave, LuCircleX, LuCircleCheck, LuChevronDown,
  LuFolderSearch, LuBedDouble, LuFileText
} from "react-icons/lu";

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUSES = [
  { value: "Waiting",         label: "Waiting",          color: "#0284c7", bg: "#e0f2fe" },
  { value: "In Consultation", label: "In Consultation",  color: "#2563eb", bg: "#eff6ff" },
  { value: "Admitted",        label: "Admitted (IPD)",   color: "#7c3aed", bg: "#f3e8ff" },
  { value: "Completed",       label: "Completed",        color: "#059669", bg: "#ecfdf5" },
  { value: "Discharged",      label: "Discharged",       color: "#475569", bg: "#f1f5f9" },
  { value: "Cancelled",       label: "Cancelled",        color: "#dc2626", bg: "#fef2f2" },
];
const getStatus = (val) => STATUSES.find(s => s.value === val) || STATUSES[0];

// ─── Excel Export ─────────────────────────────────────────────────────────────
const exportToExcel = (rows, showToast) => {
  if (!rows.length) { showToast("⚠️ No records to export!", "warn"); return; }
  const headers = [
    "Reg. Date","UHID / Patient ID","Full Name","Gender","Age","Blood Group",
    "Mobile","Alternate Mobile","Email","City","State","Address",
    "Category","Department","Doctor / Referred By",
    "Payment Type","Fee (₹)","Health Insurance","Insurance No.",
    "Emergency Contact","Emergency Phone","Aadhaar / ID","Status"
  ];
  const data = rows.map(p => [
    p.registeredAt?.split(" ")[0] || p.regDate || "",
    p.uhid || "",
    p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
    p.gender || "",
    p.age || p.ageYrs || "",
    p.bloodGroup || "",
    p.phone || p.mobile1 || "",
    p.mobile2 || p.altMobile || "",
    p.email || "",
    p.city || "",
    p.state || "",
    p.address || "",
    p.category || "OPD",
    p.department || "",
    p.doctor || p.referredBy || "",
    p.paymentMode || p.paymentType || "Cash",
    p.fee || p.totalFee || "350",
    p.healthInsurance || "No",
    p.insuranceNumber || "",
    `${p.emergencyName || ""} (${p.emergencyRelation || ""})`,
    p.emergencyPhone || "",
    p.idNo || p.aadhaar || "",
    p.status || "Waiting",
  ]);

  const csv = "data:text/csv;charset=utf-8,\uFEFF"
    + [headers, ...data]
        .map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
        .join("\r\n");

  const a = document.createElement("a");
  a.href = encodeURI(csv);
  a.download = `Registration_Report_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast(`✅ ${rows.length} records exported to Excel successfully!`);
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RegistrationReportsTable({ patients: initialPatients = [] }) {
  const { user } = useAuth();
  const [patients, setPatients]       = useState([]);
  const [search, setSearch]           = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [catFilter, setCat]           = useState("All");
  const [statusFilter, setStat]       = useState("All");
  const [toast, setToast]             = useState(null);
  const [page, setPage]               = useState(1);
  const PER_PAGE = 10;

  // Modals
  const [viewP, setViewP]           = useState(null);
  const [editP, setEditP]           = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [statusP, setStatusP]       = useState(null);
  const [newStatus, setNewStatus]   = useState("");
  const [cancelP, setCancelP]       = useState(null);

  const canEdit   = [ROLES.RECEPTION, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
  const canDelete = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);

  useEffect(() => {
    setPatients(initialPatients.length ? initialPatients : mockStore.getPatients());
  }, [initialPatients]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q ||
      (p.name || "").toLowerCase().includes(q) ||
      (p.uhid || "").toLowerCase().includes(q) ||
      (p.phone || p.mobile1 || "").includes(q) ||
      (`${p.firstName || ""} ${p.lastName || ""}`).toLowerCase().includes(q);
    const matchCat  = catFilter === "All" || p.category === catFilter;
    const matchStat = statusFilter === "All" || p.status === statusFilter;
    return matchQ && matchCat && matchStat;
  });

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openEdit = (p) => {
    if (!canEdit) { showToast("🔒 Edit requires Reception or Admin role.", "warn"); return; }
    setEditP(p);
    setEditForm({
      name: p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
      phone: p.phone || p.mobile1 || "",
      address: p.address || "",
      department: p.department || "",
      doctor: p.doctor || p.referredBy || "",
      category: p.category || "OPD",
      age: p.age || p.ageYrs || "",
      gender: p.gender || "Male",
      bloodGroup: p.bloodGroup || "",
      fee: p.fee || "350",
      paymentMode: p.paymentMode || p.paymentType || "CASH",
    });
  };

  const saveEdit = () => {
    const updated = mockStore.updatePatient(editP.uhid, editForm);
    setPatients(updated);
    setEditP(null);
    showToast(`✅ ${editP.name || editP.uhid} record updated.`);
  };

  const saveStatus = () => {
    const updated = mockStore.updatePatient(statusP.uhid, { status: newStatus });
    setPatients(updated);
    setStatusP(null);
    showToast(`🔄 Status updated to "${newStatus}"`);
  };

  const confirmCancel = () => {
    const updated = mockStore.updatePatient(cancelP.uhid, {
      status: "Cancelled",
      statusRemarks: "Cancelled at registration counter",
    });
    setPatients(updated);
    setCancelP(null);
    showToast(`⚠️ Registration cancelled for ${cancelP.name || cancelP.uhid}`);
  };

  // ─── Styles ───────────────────────────────────────────────────────────────
  const thCls = "px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60 border-b border-slate-100";

  return (
    <div className="font-sans text-slate-800">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[99999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white
          ${toast.type === "warn" ? "bg-amber-500" : toast.type === "error" ? "bg-red-500" : "bg-emerald-600"}`}>
          <LuCircleCheck size={16} /> {toast.msg}
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <LuBedDouble size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Patient Registration Reports</h1>
            <p className="text-xs text-slate-500 mt-0.5">View and manage all registered patients </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-56 text-sm shadow-2xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <LuSearch size={15} className="text-slate-400 shrink-0" />
            <input type="text" placeholder="Search name, mobile..."
              className="text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-400 w-full"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && (
              <button onClick={() => setSearch("")}><LuX size={13} className="text-slate-400 hover:text-slate-600" /></button>
            )}
          </div>

          {/* Category Filter */}
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer shadow-2xs"
            value={catFilter} onChange={e => { setCat(e.target.value); setPage(1); }}>
            <option value="All">All Categories</option>
            <option value="OPD">OPD</option>
            <option value="IPD">IPD</option>
            <option value="Emergency">Emergency</option>
          </select>

          {/* Status Filter */}
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer shadow-2xs"
            value={statusFilter} onChange={e => { setStat(e.target.value); setPage(1); }}>
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Export Excel */}
          <button onClick={() => exportToExcel(filtered, showToast)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm">
            <LuDownload size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* ── TABLE CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={thCls}>UHID NUMBER</th>
                <th className={thCls}>DATE</th>
                <th className={thCls}>NAME</th>
                <th className={thCls}>MOBILE NUMBER</th>
                <th className={thCls}>CATEGORY</th>
                <th className={thCls}>STATUS</th>
                <th className={thCls}>ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <LuFolderSearch size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-500">No patient records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : paginated.map((p, i) => {
                const st = getStatus(p.status);
                const isCancelled = p.status === "Cancelled";
                const fullName = p.name || `${p.firstName || ""} ${p.middleName ? p.middleName + " " : ""}${p.lastName || ""}`.trim();
                const regDate  = p.registeredAt?.split(" ")[0] || p.regDate || "—";

                return (
                  <tr key={p.uhid || i}
                    className={`hover:bg-slate-50/60 transition-colors ${isCancelled ? "opacity-50" : ""}`}>

                    {/* UHID NUMBER */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button onClick={() => setViewP(p)}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors text-sm text-left">
                        {p.uhid || p.id || "—"}
                      </button>
                      {p.patientId && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.patientId}</div>
                      )}
                    </td>

                    {/* DATE */}
                    <td className="px-5 py-4 text-slate-700 whitespace-nowrap text-sm">
                      {regDate}
                    </td>

                    {/* NAME */}
                    <td className="px-5 py-4 text-slate-900 font-semibold text-sm whitespace-nowrap">
                      <button onClick={() => setViewP(p)} className="hover:text-blue-600 transition-colors text-left font-semibold">
                        {fullName || "—"}
                      </button>
                    </td>

                    {/* MOBILE NUMBER */}
                    <td className="px-5 py-4 text-slate-700 whitespace-nowrap text-sm">
                      {p.phone || p.mobile1 || "—"}
                    </td>

                    {/* CATEGORY */}
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold border shadow-2xs ${
                        p.category === "IPD"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : p.category === "Emergency"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : p.category === "Registered"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {p.category || "OPD"}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => { setStatusP(p); setNewStatus(p.status || "Waiting"); }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-md border transition-all shadow-2xs hover:opacity-85"
                        style={{
                          color: st.color,
                          backgroundColor: st.bg,
                          borderColor: st.color + "44",
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                        {p.status || "Waiting"}
                        <LuChevronDown size={11} style={{ color: st.color }} />
                      </button>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1.5">
                        {/* View */}
                        <button onClick={() => setViewP(p)} title="View Details"
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-2xs">
                          <LuEye size={13} /> View
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEdit(p)} title="Edit Patient"
                          className={`p-1.5 rounded-md border transition-colors shadow-2xs ${
                            canEdit
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                          }`}>
                          <LuSquarePen size={14} />
                        </button>
                        {/* Status */}
                        <button onClick={() => { setStatusP(p); setNewStatus(p.status || "Waiting"); }} title="Change Status"
                          className="p-1.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors shadow-2xs">
                          <LuRefreshCw size={13} />
                        </button>
                        {/* Cancel */}
                        <button onClick={() => setCancelP(p)} title="Cancel" disabled={isCancelled}
                          className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors shadow-2xs disabled:opacity-40">
                          {canDelete ? <LuTrash2 size={13} /> : <LuBan size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Footer / Pagination ── */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Showing {filtered.length} records
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg transition-all shadow-2xs">
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg transition-all shadow-2xs">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─── VIEW MODAL (Hospital Registration Form in Table Format) ─── */}
      {viewP && (() => {
        const vFullName = viewP.name || `${viewP.firstName || ""} ${viewP.lastName || ""}`.trim() || "Patient";

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 print:p-0 print:bg-white"
            onClick={() => setViewP(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-h-none print:w-full"
              onClick={e => e.stopPropagation()}>
              
              {/* Header Bar */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1b3a5b] bg-[#0b1e36] text-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-400/20 flex items-center justify-center shadow-sm">
                    <LuFileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide uppercase">Patient Registration Form</h3>
                    <p className="text-xs text-blue-200/80">
                      UHID: <span className="font-mono font-bold text-white">{viewP.uhid || "—"}</span>
                      <span className="mx-2 text-slate-400">•</span>
                      Reg Date: <span className="text-slate-200">{viewP.registeredAt || viewP.regDate || "—"}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg border border-emerald-500 transition-all cursor-pointer shadow-sm"
                    title="Print Registration Form"
                  >
                    <LuPrinter size={14} /> Print
                  </button>
                  <button 
                    onClick={() => setViewP(null)} 
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 rounded-lg transition-colors cursor-pointer"
                    title="Close"
                  >
                    <LuCircleX size={24} />
                  </button>
                </div>
              </div>

              {/* Form Content (Scrollable & Form Tables) */}
              <div className="p-6 overflow-y-auto space-y-5 text-slate-800 bg-slate-50/50">
                
                {/* Patient Summary Header Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0b1e36] text-white flex items-center justify-center font-bold text-xl shadow-xs">
                      {vFullName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">
                        {vFullName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span>UHID: <strong className="text-blue-700 font-mono font-bold">{viewP.uhid || "—"}</strong></span>
                        <span>•</span>
                        <span>Patient ID: <strong className="text-slate-800 font-semibold">{viewP.patientId || viewP.id || "—"}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 1: Patient Details */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span> 1. Patient Details
                    </h4>
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-1/4 bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Patient Full Name</td>
                        <td className="w-1/4 p-2.5 font-bold text-slate-900 border-r border-slate-200">{vFullName}</td>
                        <td className="w-1/4 bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">UHID Number</td>
                        <td className="w-1/4 p-2.5 font-mono font-bold text-blue-700">{viewP.uhid || "—"}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Patient ID</td>
                        <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{viewP.patientId || viewP.id || "—"}</td>
                        <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Gender / Age</td>
                        <td className="p-2.5 font-semibold text-slate-900">{viewP.gender || "—"} / {viewP.age || viewP.ageYrs || "—"} Yrs</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Date of Birth</td>
                        <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200">{viewP.dob || "—"}</td>
                        <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Blood Group</td>
                        <td className="p-2.5 font-bold text-rose-600">{viewP.bloodGroup || "—"}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Nationality</td>
                        <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200">{viewP.nationality || "Indian"}</td>
                        <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Aadhaar / ID</td>
                        <td className="p-2.5 font-medium text-slate-900">{viewP.idNo || viewP.aadhaar || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 2: Contact Details */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 2. Contact Details
                    </h4>
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-1/4 bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Mobile No.</td>
                        <td className="w-1/4 p-2.5 font-bold text-slate-900 border-r border-slate-200">{viewP.phone || viewP.mobile1 || "—"}</td>
                        <td className="w-1/4 bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">City / District</td>
                        <td className="w-1/4 p-2.5 font-medium text-slate-900">{viewP.city || "—"}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">State</td>
                        <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200">{viewP.state || "—"}</td>
                        <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Pincode</td>
                        <td className="p-2.5 font-medium text-slate-900">{viewP.country || "India"} {viewP.pincode ? `(${viewP.pincode})` : ""}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Full Residential Address</td>
                        <td colSpan={3} className="p-2.5 font-medium text-slate-900">{viewP.address || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Emergency Contact Details */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span> 3. Emergency Contact Details
                    </h4>
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-1/4 bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Contact Person</td>
                        <td className="w-1/4 p-2.5 font-bold text-slate-900 border-r border-slate-200">{viewP.emergencyName || "—"}</td>
                        <td className="w-1/4 bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Relationship</td>
                        <td className="w-1/4 p-2.5 font-medium text-slate-900">{viewP.emergencyRelation || "—"}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 p-2.5 font-semibold text-slate-600 border-r border-slate-200">Emergency Phone</td>
                        <td colSpan={3} className="p-2.5 font-bold text-slate-900">{viewP.emergencyPhone || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex flex-wrap justify-between items-center gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <LuPrinter size={14} /> Print Form
                  </button>
                  <button 
                    onClick={() => { const p = viewP; setViewP(null); openEdit(p); }}
                    className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <LuSquarePen size={14} /> Edit Record
                  </button>
                  <button 
                    onClick={() => { const p = viewP; setViewP(null); setStatusP(p); setNewStatus(p.status || "Waiting"); }}
                    className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <LuRefreshCw size={13} /> Update Status
                  </button>
                  <button 
                    onClick={() => { const p = viewP; setViewP(null); setCancelP(p); }}
                    className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <LuBan size={14} /> Cancel
                  </button>
                </div>
                <button 
                  onClick={() => setViewP(null)}
                  className="text-xs font-bold text-white bg-[#0b1e36] hover:bg-[#122b4d] px-5 py-2 rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  Close Form
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ─── EDIT MODAL ─── */}
      {editP && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditP(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-800">Edit Patient Record</h3>
              <button onClick={() => setEditP(null)}><LuCircleX size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ["name","Full Name","text"],["phone","Mobile No.","tel"],
                ["age","Age","number"],["gender","Gender","text"],
                ["bloodGroup","Blood Group","text"],["department","Department","text"],
                ["doctor","Doctor / Referred By","text"],["category","Category","text"],
                ["fee","Fee (₹)","number"],["paymentMode","Payment Mode","text"],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                  <input type={type} value={editForm[key] || ""}
                    onChange={e => setEditForm(f => ({...f, [key]: e.target.value}))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                <input type="text" value={editForm.address || ""}
                  onChange={e => setEditForm(f => ({...f, address: e.target.value}))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setEditP(null)}
                className="text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-all">
                Cancel
              </button>
              <button onClick={saveEdit}
                className="flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg transition-all">
                <LuSave size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STATUS MODAL ─── */}
      {statusP && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setStatusP(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-800">Update Status</h3>
              <button onClick={() => setStatusP(null)}><LuCircleX size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-2">
              <p className="text-sm text-slate-500 mb-3">Patient: <strong className="text-slate-800">{statusP.name || statusP.uhid}</strong></p>
              {STATUSES.map(s => (
                <button key={s.value} onClick={() => setNewStatus(s.value)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold text-left transition-all
                    ${newStatus === s.value ? "border-2 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                  style={newStatus === s.value ? { borderColor: s.color, color: s.color, backgroundColor: s.bg } : {}}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setStatusP(null)}
                className="text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-all">
                Cancel
              </button>
              <button onClick={saveStatus}
                className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg transition-all">
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCEL CONFIRM MODAL ─── */}
      {cancelP && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCancelP(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LuCircleX size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 mb-2">
              {canDelete ? "Delete Record?" : "Cancel Registration?"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {canDelete
                ? `This will permanently delete the record for ${cancelP.name || cancelP.uhid}.`
                : `${cancelP.name || cancelP.uhid} will be marked as Cancelled.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelP(null)}
                className="flex-1 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition-all">
                Keep
              </button>
              <button onClick={confirmCancel}
                className="flex-1 text-sm font-bold text-white bg-red-500 hover:bg-red-600 py-2.5 rounded-xl transition-all">
                {canDelete ? "Delete" : "Cancel Reg."}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
