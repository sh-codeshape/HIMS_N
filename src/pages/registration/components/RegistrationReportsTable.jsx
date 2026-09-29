import React, { useState, useEffect } from "react";
import { mockStore } from "../../../mock/mockStore";
import { useAuth } from "../../../auth";
import { ROLES } from "../../../auth/roles";
import {
  LuSearch, LuX, LuDownload, LuFilter,
  LuEye, LuSquarePen, LuRefreshCw, LuBan, LuTrash2,
  LuPrinter, LuSave, LuCircleX, LuCircleCheck, LuChevronDown,
  LuFolderSearch, LuBedDouble
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
  const thCls = "px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60 border-b border-slate-100";

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
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Patient Registration Reports</h1>
            <p className="text-xs text-slate-500 mt-0.5">View and manage all registered patients in the system</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-lg px-3.5 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all w-60 shadow-2xs">
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
            className="text-sm border border-slate-200/90 rounded-lg px-3 py-2 bg-white text-slate-600 focus:outline-none focus:border-blue-400 cursor-pointer shadow-2xs"
            value={catFilter} onChange={e => { setCat(e.target.value); setPage(1); }}>
            <option value="All">All Categories</option>
            <option value="OPD">OPD</option>
            <option value="IPD">IPD</option>
            <option value="Emergency">Emergency</option>
          </select>

          {/* Status Filter */}
          <select
            className="text-sm border border-slate-200/90 rounded-lg px-3 py-2 bg-white text-slate-600 focus:outline-none focus:border-blue-400 cursor-pointer shadow-2xs"
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={thCls}>UHID Number</th>
                <th className={thCls}>Date</th>
                <th className={thCls}>Name</th>
                <th className={thCls}>Mobile Number</th>
                <th className={thCls}>Category</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Actions</th>
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
                const isCancelled = p.status === "Cancelled";
                const fullName = p.name || `${p.firstName || ""} ${p.middleName ? p.middleName + " " : ""}${p.lastName || ""}`.trim();
                const regDate  = p.registeredAt?.split(" ")[0] || p.regDate || "—";

                return (
                  <tr key={p.uhid || i}
                    className={`hover:bg-slate-50/50 transition-colors ${isCancelled ? "opacity-50" : ""}`}>

                    {/* UHID Number */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <button onClick={() => setViewP(p)}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm text-left">
                        {p.uhid || p.id || "—"}
                      </button>
                      {p.patientId && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.patientId}</div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4.5 text-slate-600 whitespace-nowrap text-sm">{regDate}</td>

                    {/* Name */}
                    <td className="px-6 py-4.5 text-slate-800 font-medium text-sm">
                      <button onClick={() => setViewP(p)}
                        className="hover:text-blue-600 transition-colors text-left font-medium">
                        {fullName || "—"}
                      </button>
                    </td>

                    {/* Mobile Number */}
                    <td className="px-6 py-4.5 text-slate-600 whitespace-nowrap text-sm">
                      {p.phone || p.mobile1 || "—"}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-sm">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {p.category || "OPD"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-sm">
                      <button
                        onClick={() => { setStatusP(p); setNewStatus(p.status || "Waiting"); }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        {p.status || "Waiting"}
                        <LuChevronDown size={10} className="text-slate-400" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {/* View Details */}
                        <button onClick={() => setViewP(p)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-1.5 rounded-full transition-all">
                          View Details <span className="text-sm font-normal">→</span>
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEdit(p)} title="Edit"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                          <LuSquarePen size={15} />
                        </button>
                        {/* Status */}
                        <button onClick={() => { setStatusP(p); setNewStatus(p.status || "Waiting"); }} title="Change Status"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                          <LuRefreshCw size={14} />
                        </button>
                        {/* Cancel */}
                        <button onClick={() => setCancelP(p)} title="Cancel" disabled={isCancelled}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30">
                          {canDelete ? <LuTrash2 size={14} /> : <LuBan size={14} />}
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
              className="text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg transition-all">
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg transition-all">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─── VIEW MODAL ─── */}
      {viewP && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewP(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
              <div>
                <h3 className="text-base font-extrabold text-white">Patient Full Record</h3>
                <p className="text-xs text-blue-200 mt-0.5">{viewP.uhid}</p>
              </div>
              <button onClick={() => setViewP(null)} className="text-white/70 hover:text-white">
                <LuCircleX size={22} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                ["Full Name",        viewP.name || `${viewP.firstName || ""} ${viewP.lastName || ""}`.trim()],
                ["UHID",             viewP.uhid || "—"],
                ["Patient ID",       viewP.patientId || viewP.id || "—"],
                ["Gender / Age",     `${viewP.gender || "—"} / ${viewP.age || viewP.ageYrs || "—"} Yrs`],
                ["Date of Birth",    viewP.dob || "—"],
                ["Blood Group",      viewP.bloodGroup || "—"],
                ["Marital Status",   viewP.maritalStatus || "—"],
                ["Nationality",      viewP.nationality || "Indian"],
                ["Occupation",       viewP.occupation || "—"],
                ["Aadhaar / ID",     viewP.idNo || viewP.aadhaar || "—"],
                ["Mobile",           viewP.phone || viewP.mobile1 || "—"],
                ["Alternate Mobile", viewP.mobile2 || viewP.altMobile || "—"],
                ["Email",            viewP.email || "—"],
                ["Address",          viewP.address || "—"],
                ["City",             viewP.city || "—"],
                ["State",            viewP.state || "—"],
                ["Category",         viewP.category || "OPD"],
                ["Department",       viewP.department || "—"],
                ["Doctor / Referred",viewP.doctor || viewP.referredBy || "—"],
                ["Payment Type",     viewP.paymentMode || viewP.paymentType || "—"],
                ["Fee Paid",         `₹ ${viewP.fee || viewP.totalFee || "350"}`],
                ["Health Insurance", viewP.healthInsurance || "No"],
                ["Insurance No.",    viewP.insuranceNumber || "—"],
                ["Emergency Contact",`${viewP.emergencyName || "—"} (${viewP.emergencyRelation || "—"})`],
                ["Emergency Phone",  viewP.emergencyPhone || "—"],
                ["Reg. Date",        viewP.registeredAt || viewP.regDate || "—"],
                ["Current Status",   viewP.status || "Waiting"],
              ].map(([label, val]) => (
                <div key={label} className="border-b border-slate-100 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">{val || "—"}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setViewP(null)}
                className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
