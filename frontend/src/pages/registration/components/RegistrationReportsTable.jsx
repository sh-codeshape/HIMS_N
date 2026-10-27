import React, { useState, useEffect } from "react";
import { mockStore } from "../../../mock/mockStore";
import { useAuth } from "../../../auth";
import patientService from "../../../api/services/patientService";
import { ROLES } from "../../../auth/roles";
import {
  LuSearch, LuX, LuDownload, LuFilter,
  LuEye, LuSquarePen, LuRefreshCw, LuBan, LuTrash2,
  LuPrinter, LuSave, LuCircleX, LuCircleCheck, LuChevronDown,
  LuFolderSearch, LuBedDouble, LuFileText, LuPlus
} from "react-icons/lu";
import "./RegistrationReportsTable.css";

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
  // Health insurance i am removing as of now 
  if (!rows.length) { showToast("⚠️ No records to export!", "warn"); return; }
  const headers = [
    "Reg. Date","UHID / Patient ID","Full Name","Gender","Age","Blood Group",
    "Mobile","Alternate Mobile","Email","City","State","Address",
    "Category","Department","Doctor / Referred By",
    "Payment Type","Fee (₹)",,,
    "Emergency Contact","Emergency Phone","Aadhaar / ID","Status"
  ];
  const data = rows.map(p => [
    p.registeredAt?.split(" ")[0] || p.regDate || "",
    p.uhid || "",
    p.name || `${p.firstName || p.first_name || ""} ${p.lastName || p.last_name || ""}`.trim(),
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
  const PER_PAGE = 50;

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
      (`${p.firstName || p.first_name || ""} ${p.lastName || p.last_name || ""}`).toLowerCase().includes(q);
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
    const customFields = typeof p.custom_fields === 'object' && p.custom_fields ? p.custom_fields : {};
    const primaryAddress = Array.isArray(p.addresses) && p.addresses.length
      ? p.addresses.find(a => a.is_primary) || p.addresses[0]
      : {};
    const name = p.name || p.full_name || `${p.firstName || p.first_name || ""} ${p.middleName || p.middle_name ? (p.middleName || p.middle_name) + " " : ""}${p.lastName || p.last_name || ""}`.trim();
    const dobValue = p.date_of_birth || p.dob || p.dateOfBirth || "";
    const age = p.age ?? p.ageYrs ?? (dobValue ? Math.floor((Date.now() - new Date(dobValue).getTime()) / 3.15576e10) : "");
    const address = p.address || primaryAddress.line1 || primaryAddress.address_line1 || p.address_line1 || "";
    const city = p.city || primaryAddress.city || "";
    const state = p.state || primaryAddress.state || "";
    const pincode = p.pincode || p.pin || primaryAddress.postal_code || p.postal_code || "";
    const country = p.country || primaryAddress.country || "India";

    setEditForm({
      name,
      gender: p.gender ? (p.gender.charAt(0).toUpperCase() + p.gender.slice(1).toLowerCase()) : "Male",
      age,
      bloodGroup: p.bloodGroup || p.blood_group || customFields.blood_group || "",
      aadhaar: p.aadhaar || p.idNo || p.aadhaar_number || customFields.aadhaar || customFields.idNo || "",
      phone: p.phone || p.mobile1 || p.mobile || "",
      altPhone: p.alternate_phone || p.alternatePhone || p.mobile2 || p.altMobile || customFields.alt_phone || "",
      email: p.email || customFields.email || "",
      address,
      country,
      state,
      city,
      pincode,
      emergencyName: p.emergencyName || p.emgName || customFields.emergency_name || customFields.guardian_name || "",
      emergencyPhone: p.emergencyPhone || p.emgNumber || customFields.emergency_phone || customFields.emergency_contact || "",
      emergencyRelation: p.emergencyRelation || p.emgRelation || customFields.emergency_relation || "",
      doctor: p.doctor || p.referredBy || customFields.referred_by || "",
      department: p.department || customFields.department || "",
      category: p.category || customFields.visit_type || "OPD",
      maritalStatus: p.marital_status || p.maritalStatus || customFields.marital_status || "",
      occupation: p.occupation || customFields.occupation || "",
    });
  };

  const handlePrintPatient = (patient) => {
    setViewP(patient);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const saveEdit = async () => {
    try {
      const custom_fields = typeof editP.custom_fields === 'object' && editP.custom_fields ? editP.custom_fields : {};
      const parsedAge = Number(editForm.age);
      const sanitizedAge = Number.isFinite(parsedAge) && parsedAge >= 0 && parsedAge <= 120 ? parsedAge : null;
      const updatedData = {
        first_name: editForm.name?.split(" ")[0] || "",
        last_name: editForm.name?.split(" ").slice(1).join(" ") || "",
        gender: editForm.gender?.toLowerCase(),
        date_of_birth: sanitizedAge !== null
          ? new Date(Date.now() - sanitizedAge * 365.25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          : editP.date_of_birth || editP.dob || undefined,
        blood_group: editForm.bloodGroup?.trim() ? editForm.bloodGroup.trim().toUpperCase() : undefined,
        phone: editForm.phone,
        alternate_phone: editForm.altPhone || undefined,
        email: editForm.email || undefined,
        address_line1: editForm.address,
        city: editForm.city,
        state: editForm.state,
        postal_code: editForm.pincode,
        country: editForm.country,
        marital_status: editForm.maritalStatus || undefined,
        occupation: editForm.occupation || undefined,
        custom_fields: {
          ...custom_fields,
          visit_type: editForm.category,
          department: editForm.department,
          referred_by: editForm.doctor,
          emergency_name: editForm.emergencyName,
          guardian_name: editForm.emergencyName,
          emergency_contact: editForm.emergencyPhone,
          emergency_phone: editForm.emergencyPhone,
          emergency_relation: editForm.emergencyRelation,
          aadhaar: editForm.aadhaar,
        }
      };
      
      const updatedRecord = await patientService.update(editP.id, updatedData);
      setPatients(prev => prev.map(p => p.id === editP.id ? { ...p, ...updatedRecord, ...updatedData, name: editForm.name } : p));
      setEditP(null);
      showToast(`✅ ${editForm.name || editP.uhid} record updated.`);
    } catch (error) {
      console.error(error);
      showToast("❌ Failed to update record", "error");
    }
  };

  const saveStatus = async () => {
    try {
      const custom_fields = typeof statusP.custom_fields === 'object' ? statusP.custom_fields : {};
      const updatedRecord = await patientService.update(statusP.id, {
        custom_fields: { ...custom_fields, status: newStatus }
      });
      setPatients(prev => prev.map(p => p.id === statusP.id ? updatedRecord : p));
      setStatusP(null);
      showToast(`🔄 Status updated to "${newStatus}"`);
    } catch (error) {
      console.error(error);
      showToast("❌ Failed to update status", "error");
    }
  };

  const confirmCancel = async () => {
    try {
      if (canDelete) {
        await patientService.remove(cancelP.id);
        setPatients(prev => prev.filter(p => p.id !== cancelP.id));
        setCancelP(null);
        showToast(`🗑️ Record deleted for ${cancelP.name || cancelP.uhid}`);
      } else {
        const custom_fields = typeof cancelP.custom_fields === 'object' ? cancelP.custom_fields : {};
        const updatedRecord = await patientService.update(cancelP.id, {
          custom_fields: { ...custom_fields, status: "Cancelled", statusRemarks: "Cancelled at registration counter" }
        });
        setPatients(prev => prev.map(p => p.id === cancelP.id ? updatedRecord : p));
        setCancelP(null);
        showToast(`⚠️ Registration cancelled for ${cancelP.name || cancelP.uhid}`);
      }
    } catch (error) {
      console.error(error);
      showToast("❌ Failed to cancel registration", "error");
    }
  };

  const getPatientDisplayData = (patient) => {
    if (!patient) return {};

    const customFields = typeof patient.custom_fields === "object" && patient.custom_fields ? patient.custom_fields : {};
    const primaryAddress = Array.isArray(patient.addresses) && patient.addresses.length
      ? patient.addresses.find(a => a.is_primary) || patient.addresses[0]
      : {};

    const fullName = patient.name || patient.full_name || `${patient.firstName || patient.first_name || ""} ${patient.middleName || patient.middle_name ? (patient.middleName || patient.middle_name) + " " : ""}${patient.lastName || patient.last_name || ""}`.trim() || "Patient";
    const addressLine = patient.address || primaryAddress.line1 || primaryAddress.address_line1 || patient.address_line1 || "";
    const city = patient.city || primaryAddress.city || "";
    const state = patient.state || primaryAddress.state || "";
    const postalCode = patient.pincode || patient.pin || primaryAddress.postal_code || patient.postal_code || "";
    const country = patient.country || primaryAddress.country || "India";
    const phone = patient.phone || patient.mobile1 || patient.mobile || "";
    const altPhone = patient.alternate_phone || patient.alternatePhone || patient.mobile2 || patient.altMobile || customFields.alt_phone || "";
    const email = patient.email || customFields.email || "";
    const bloodGroup = patient.bloodGroup || patient.blood_group || customFields.blood_group || "—";
    const dobValue = patient.date_of_birth || patient.dob || patient.dateOfBirth || "";
    const dobFormatted = dobValue ? new Date(dobValue).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    const ageValue = patient.age ?? (dobValue ? Math.floor((Date.now() - new Date(dobValue).getTime()) / 3.15576e10) : null);
    const ageDisplay = ageValue !== null && ageValue !== undefined && ageValue !== "" ? `${ageValue} Yrs` : "—";
    const regDate = patient.registeredAt || patient.regDate || patient.created_at
      ? new Date(patient.registeredAt || patient.regDate || patient.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "—";
    const maritalStatus = patient.marital_status || patient.maritalStatus || customFields.marital_status || "";
    const occupation = patient.occupation || customFields.occupation || "";
    const notes = patient.notes || patient.remarks || customFields.notes || customFields.remarks || "";

    const regFee = Number(patient.registration_fee || patient.fee || customFields.registration_fee || customFields.fee || 100);
    const cardFee = Number(patient.card_fee || customFields.card_fee || 100);
    const totalFee = Number(patient.total_fee || patient.totalFee || customFields.total_fee || (regFee + cardFee));
    const paymentMode = patient.paymentMode || patient.paymentType || customFields.payment_type || customFields.payment_mode || "Cash / Counter";
    const paymentStatus = customFields.payment_status || "PAID";
    const receiptNo = `REG-REC-${String(patient.uhid || "1001").replace(/[^0-9]/g, "").slice(-8) || "1001"}`;

    return {
      fullName,
      addressLine,
      city,
      state,
      postalCode,
      country,
      phone,
      altPhone,
      email,
      bloodGroup,
      dobValue,
      dobFormatted,
      ageDisplay,
      regDate,
      category: patient.category || customFields.visit_type || "OPD",
      department: patient.department || customFields.department || "",
      doctor: patient.doctor || patient.referredBy || customFields.referred_by || "",
      status: patient.status || customFields.status || "Waiting",
      emergencyName: patient.emergencyName || patient.emgName || customFields.emergency_name || customFields.guardian_name || "",
      emergencyRelation: patient.emergencyRelation || patient.emgRelation || customFields.emergency_relation || "",
      emergencyPhone: patient.emergencyPhone || patient.emgNumber || customFields.emergency_phone || customFields.emergency_contact || "",
      idNumber: patient.idNo || patient.aadhaar || patient.aadhaar_number || customFields.aadhaar || customFields.idNo || "",
      nationality: patient.nationality || customFields.nationality || "Indian",
      maritalStatus,
      occupation,
      notes,
      gender: patient.gender || "—",
      uhid: patient.uhid || "—",
      customFields,
      regFee,
      cardFee,
      totalFee,
      paymentMode,
      paymentStatus,
      receiptNo,
    };
  };

  return (
    <div className="rr-page">

      {/* Toast */}
      {toast && (
        <div className={`rr-toast rr-toast--${toast.type === "warn" ? "warn" : toast.type === "error" ? "error" : "success"}`}>
          <LuCircleCheck size={16} /> {toast.msg}
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="rr-header">
        <div className="rr-header-left">
          <div className="rr-header-icon">
            <LuBedDouble size={22} />
          </div>
          <div>
            <h1 className="rr-title">Patient Registration Reports</h1>
            <p className="rr-subtitle">View and manage all registered patients </p>
          </div>
        </div>

        <div className="rr-controls">
          {/* Search */}
          <div className="rr-search">
            <LuSearch size={15} />
            <input type="text" placeholder="Search name, mobile..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && (
              <button className="rr-search-clear" onClick={() => setSearch("")}><LuX size={13} color="#55698a" /></button>
            )}
          </div>

          {/* Category Filter */}
          <select
            className="rr-select"
            value={catFilter} onChange={e => { setCat(e.target.value); setPage(1); }}>
            <option value="All">All Categories</option>
            <option value="OPD">OPD</option>
            <option value="IPD">IPD</option>
            <option value="Emergency">Emergency</option>
          </select>

          {/* Status Filter */}
          <select
            className="rr-select"
            value={statusFilter} onChange={e => { setStat(e.target.value); setPage(1); }}>
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Export Excel */}
          <button onClick={() => exportToExcel(filtered, showToast)} className="rr-btn rr-btn--green">
            <LuDownload size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* ── TABLE CARD ── */}
      <div className="rr-card">
        <div className="rr-table-wrap">
          <table className="rr-table">
            <thead>
              <tr>
                <th>UHID NUMBER</th>
                <th>DATE</th>
                <th>NAME</th>
                <th>MOBILE NUMBER</th>
                <th>CATEGORY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="rr-empty">
                    <LuFolderSearch size={36} />
                    <p>No patient records found</p>
                    <small>Try adjusting your search or filters.</small>
                  </td>
                </tr>
              ) : paginated.map((p, i) => {
                const isCancelled = p.status === "Cancelled";
                const fullName = p.name || p.full_name || `${p.firstName || p.first_name || ""} ${p.middleName || p.middle_name ? (p.middleName || p.middle_name) + " " : ""}${p.lastName || p.last_name || ""}`.trim();
                const regDate  = p.registeredAt?.split(" ")[0] || p.regDate || "—";

                return (
                  <tr key={p.uhid || i} className={isCancelled ? "rr-row--cancelled" : ""}>

                    {/* UHID NUMBER */}
                    <td>
                      <button onClick={() => setViewP(p)} className="rr-link rr-uhid">
                        {p.uhid || p.id || "—"}
                      </button>
                      {p.patientId && (
                        <div className="rr-sub">{p.patientId}</div>
                      )}
                    </td>

                    {/* DATE */}
                    <td>{regDate}</td>

                    {/* NAME */}
                    <td>
                      <button onClick={() => setViewP(p)} className="rr-link rr-name">
                        {fullName || "—"}
                      </button>
                    </td>

                    {/* MOBILE NUMBER */}
                    <td>{p.phone || p.mobile1 || "—"}</td>

                    {/* CATEGORY */}
                    <td>
                      <span className={`rr-cat ${
                        p.category === "IPD"
                          ? "rr-cat--ipd"
                          : p.category === "Emergency"
                          ? "rr-cat--emergency"
                          : p.category === "Registered"
                          ? "rr-cat--registered"
                          : "rr-cat--opd"
                      }`}>
                        {p.category || "OPD"}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="rr-actions">
                        {/* View */}
                        <button onClick={() => setViewP(p)} title="View Patient Details" className="rr-act rr-act--view">
                          <LuEye size={15} />
                        </button>
                        {/* Print */}
                        <button onClick={() => handlePrintPatient(p)} title="Print Registration Form" className="rr-act rr-act--print">
                          <LuPrinter size={15} />
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEdit(p)} title="Edit Patient"
                          className={`rr-act ${canEdit ? "rr-act--edit" : "rr-act--locked"}`}>
                          <LuSquarePen size={15} />
                        </button>
                        {/* Status */}
                        <button onClick={() => { setStatusP(p); setNewStatus(p.status || "Waiting"); }} title="Change Status"
                          className="rr-act rr-act--status">
                          <LuRefreshCw size={14} />
                        </button>
                        {/* Cancel / Delete */}
                        <button onClick={() => setCancelP(p)} title={canDelete ? "Delete Record" : "Cancel Patient"} disabled={isCancelled}
                          className="rr-act rr-act--cancel">
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
        <div className="rr-footer">
          <p className="rr-count">
            Showing {filtered.length} records
          </p>
          <div className="rr-pager">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="rr-pg-btn">
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rr-pg-btn">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─── VIEW MODAL (Hospital Registration Form in Table Format) ─── */}
      {viewP && (() => {
        const displayData = getPatientDisplayData(viewP);
        const vFullName = displayData.fullName;
        const dobFormatted = displayData.dobFormatted;
        const ageDisplay = displayData.ageDisplay;
        const regDate = displayData.regDate;

        return (
          <div className="rr-overlay" onClick={() => setViewP(null)}>
            <div className="rr-modal" id="rr-printable-modal" onClick={e => e.stopPropagation()}>

              {/* Header Bar */}
              <div className="rr-modal-head">
                <div className="rr-modal-head-left">
                  <div className="rr-modal-icon">
                    <LuFileText size={20} />
                  </div>
                  <div>
                    <h3 className="rr-modal-title">
                      Patient Registration Form
                      <span className="rr-chip">Hospital Record</span>
                    </h3>
                    <p className="rr-modal-meta">
                      UHID: <strong className="rr-mono">{displayData.uhid || "—"}</strong>
                      <span style={{ margin: "0 8px", opacity: 0.6 }}>•</span>
                      Reg Date: <strong>{regDate || "—"}</strong>
                    </p>
                  </div>
                </div>
                <div className="rr-head-actions">
                  <button
                    onClick={() => window.print()}
                    className="rr-btn rr-btn--green rr-btn--sm"
                    title="Print Registration Form"
                  >
                    <LuPrinter size={14} /> Print
                  </button>
                  <button
                    onClick={() => setViewP(null)}
                    className="rr-close"
                    title="Close"
                  >
                    <LuCircleX size={20} />
                  </button>
                </div>
              </div>

              {/* Form Content (Scrollable & Form Tables) */}
              <div className="rr-modal-body">

                {/* Hospital Top Branding Header */}
                <div className="rr-hosp-header">
                  <div className="rr-hosp-brand">
                    <div className="rr-hosp-logo">
                      <LuPlus size={26} />
                    </div>
                    <div>
                      <h2 className="rr-hosp-name">NARAYAN HOSPITAL &amp; MEDICAL RESEARCH CENTRE</h2>
                      <p className="rr-hosp-sub">NABH Accredited Multi-Specialty Hospital • 24x7 Emergency &amp; Trauma Care</p>
                      <p className="rr-hosp-addr">Station Road, Civil Lines, Kota, Rajasthan - 324001 • Tel: +91 744 2450000</p>
                    </div>
                  </div>
                  <div className="rr-hosp-tag-box">
                    <span className="rr-hosp-tag-lbl">REGISTRATION CARD &amp; RECORD</span>
                    <span className="rr-hosp-tag-uhid">{displayData.uhid}</span>
                    <span className="rr-hosp-tag-date">Date: {regDate}</span>
                  </div>
                </div>

                {/* Patient Summary Header Card */}
                <div className="rr-banner">
                  <div className="rr-banner-left">
                    <div className="rr-avatar">
                      {vFullName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2>{vFullName}</h2>
                      <div className="rr-banner-meta">
                        <span>UHID: <strong className="rr-mono rr-blue">{displayData.uhid}</strong></span>
                        <span>•</span>
                        <span>Reg. Date: <strong>{regDate}</strong></span>
                        <span>•</span>
                        <span>Category: <strong style={{ color: displayData.category === "IPD" ? "#7e22ce" : "#1d4ed8", background: displayData.category === "IPD" ? "#faf5ff" : "#eff6ff", border: `1px solid ${displayData.category === "IPD" ? "#e9d5ff" : "#bfdbfe"}`, padding: "1px 8px", borderRadius: 4 }}>{displayData.category}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="rr-banner-right">
                    <small>Current Status</small>
                    <span style={{ background: `${getStatus(displayData.status).color}15`, color: getStatus(displayData.status).color, border: `1px solid ${getStatus(displayData.status).color}40`, padding: "3px 10px", borderRadius: "14px", fontWeight: 800, fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: getStatus(displayData.status).color, display: "inline-block" }} />
                      {displayData.status || "Waiting"}
                    </span>
                  </div>
                </div>

                {/* Section 1: Patient Details */}
                <div className="rr-section">
                  <div className="rr-section-head">
                    <h4 className="rr-section-title">
                      <span className="rr-dot rr-dot--blue"></span> 1. Patient Details
                    </h4>
                    <span className="rr-section-note">Personal &amp; Demographics</span>
                  </div>
                  <table className="rr-dtable">
                    <tbody>
                      <tr>
                        <td className="rr-lbl">Patient Full Name</td>
                        <td className="rr-val rr-val--strong">{vFullName}</td>
                        <td className="rr-lbl">UHID Number</td>
                        <td className="rr-val rr-val--uhid rr-mono">{displayData.uhid}</td>
                      </tr>
                      <tr>
                        <td className="rr-lbl">Registration Date</td>
                        <td className="rr-val">{regDate}</td>
                        <td className="rr-lbl">Gender / Age</td>
                        <td className="rr-val rr-val--strong">{displayData.gender} / {ageDisplay}</td>
                      </tr>
                      <tr>
                        <td className="rr-lbl">Date of Birth</td>
                        <td className="rr-val">{dobFormatted}</td>
                        <td className="rr-lbl">Blood Group</td>
                        <td className="rr-val rr-val--blood">{displayData.bloodGroup ? `🩸 ${displayData.bloodGroup}` : "—"}</td>
                      </tr>
                      <tr>
                        <td className="rr-lbl">Nationality</td>
                        <td className="rr-val">{displayData.nationality || "Indian"}</td>
                        <td className="rr-lbl">Aadhaar / ID</td>
                        <td className="rr-val">{displayData.idNumber || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 2: Contact Details */}
                <div className="rr-section">
                  <div className="rr-section-head">
                    <h4 className="rr-section-title">
                      <span className="rr-dot rr-dot--green"></span> 2. Contact Details
                    </h4>
                    <span className="rr-section-note">Communication &amp; Address</span>
                  </div>
                  <table className="rr-dtable">
                    <tbody>
                      <tr>
                        <td className="rr-lbl">Mobile No.</td>
                        <td className="rr-val rr-val--strong">{displayData.phone || "—"}</td>
                        <td className="rr-lbl">Alternate Mobile</td>
                        <td className="rr-val">{displayData.altPhone || "—"}</td>
                      </tr>
                      <tr>
                        <td className="rr-lbl">Email Address</td>
                        <td className="rr-val">{displayData.email || "—"}</td>
                        <td className="rr-lbl">City / District</td>
                        <td className="rr-val">{displayData.city || "—"}</td>
                      </tr>
                      <tr>
                        <td className="rr-lbl">State</td>
                        <td className="rr-val">{displayData.state || "—"}</td>
                        <td className="rr-lbl">Pincode &amp; Country</td>
                        <td className="rr-val">{displayData.country || "India"} {displayData.postalCode ? `(${displayData.postalCode})` : ""}</td>
                      </tr>
                      <tr>
                        <td className="rr-lbl">Full Residential Address</td>
                        <td colSpan={3} className="rr-val" style={{ width: "auto" }}>{displayData.addressLine || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Emergency Contact Details */}
                <div className="rr-section">
                  <div className="rr-section-head">
                    <h4 className="rr-section-title">
                      <span className="rr-dot rr-dot--red"></span> 3. Emergency Contact Details
                    </h4>
                    <span className="rr-section-note">Guardian &amp; Next of Kin</span>
                  </div>
                  <table className="rr-dtable">
                    <tbody>
                      <tr>
                        <td className="rr-lbl">Contact Person</td>
                        <td className="rr-val rr-val--strong">{displayData.emergencyName || "—"}</td>
                        <td className="rr-lbl">Relationship</td>
                        <td className="rr-val">{displayData.emergencyRelation || "—"}</td>
                      </tr>
                      <tr>
                        <td className="rr-lbl">Emergency Phone</td>
                        <td colSpan={3} className="rr-val rr-val--strong" style={{ width: "auto" }}>{displayData.emergencyPhone || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 4: Clinical & Visit Information */}
                <div className="rr-section">
                  <div className="rr-section-head">
                    <h4 className="rr-section-title">
                      <span className="rr-dot rr-dot--violet"></span> 4. Clinical &amp; Visit Information
                    </h4>
                    <span className="rr-section-note">Consultation &amp; Department</span>
                  </div>
                  <table className="rr-dtable">
                    <tbody>
                      <tr>
                        <td className="rr-lbl">Visit Category</td>
                        <td className="rr-val rr-val--strong">{displayData.category || "OPD"}</td>
                        <td className="rr-lbl">Department</td>
                        <td className="rr-val">{displayData.department || "—"}</td>
                      </tr>
                      <tr>
                        <td className="rr-lbl">Referred By / Doctor</td>
                        <td className="rr-val">{displayData.doctor || "—"}</td>
                        <td className="rr-lbl">Status</td>
                        <td className="rr-val rr-val--strong" style={{ color: getStatus(displayData.status).color }}>
                          {displayData.status || "Waiting"}
                        </td>
                      </tr>
                      {displayData.notes && (
                        <tr>
                          <td className="rr-lbl">Notes / Remarks</td>
                          <td colSpan={3} className="rr-val" style={{ width: "auto" }}>{displayData.notes}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Section 5: Registration Fee & Payment Receipt */}
                <div className="rr-section">
                  <div className="rr-section-head">
                    <h4 className="rr-section-title">
                      <span className="rr-dot rr-dot--green"></span> 5. Registration Fee &amp; Payment Receipt
                    </h4>
                    <span className="rr-section-note">Billing &amp; Financial Record (पंजीकरण शुल्क विवरण)</span>
                  </div>
                  <table className="rr-dtable">
                    <tbody>
                      <tr>
                        <td className="rr-lbl">Registration Fee</td>
                        <td className="rr-val rr-val--strong">₹ {Number(displayData.regFee).toFixed(2)}</td>
                        <td className="rr-lbl">Hospital Smart Card Fee</td>
                        <td className="rr-val rr-val--strong">₹ {Number(displayData.cardFee).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="rr-lbl">Payment Mode</td>
                        <td className="rr-val">{displayData.paymentMode}</td>
                        <td className="rr-lbl">Receipt Number</td>
                        <td className="rr-val rr-mono rr-val--uhid">{displayData.receiptNo}</td>
                      </tr>
                      <tr>
                        <td className="rr-lbl">Total Amount Paid</td>
                        <td className="rr-val rr-val--strong" style={{ color: "#047857", fontSize: "13px" }}>
                          ₹ {Number(displayData.totalFee).toFixed(2)}
                        </td>
                        <td className="rr-lbl">Payment Status</td>
                        <td className="rr-val">
                          <span style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: 4, fontWeight: 800, fontSize: "11px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            ✓ {displayData.paymentStatus} (प्राप्त)
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 6: Hospital Instructions & Important Guidelines */}
                <div className="rr-section rr-rules-section">
                  <div className="rr-section-head">
                    <h4 className="rr-section-title">
                      <span className="rr-dot" style={{ backgroundColor: "#f59e0b" }}></span> 6. Hospital Instructions &amp; Patient Guidelines
                    </h4>
                    <span className="rr-section-note">Important Patient Information (दिशानिर्देश)</span>
                  </div>
                  <div className="rr-rules-list">
                    <p>• <strong>Permanent UHID:</strong> This Unique Hospital Identification (UHID) is lifelong and valid for all future OPD, IPD, Diagnostics, Emergency &amp; Pharmacy services.</p>
                    <p>• <strong>Hospital Card:</strong> Please preserve this registration slip and present it at the Registration Desk and Doctor Consultation Chambers on every visit.</p>
                    <p>• <strong>24x7 Facilities:</strong> Emergency, ICU, Pathology Lab, Blood Bank, and Ambulance services operate 24x7 without interruption.</p>
                  </div>
                </div>

                {/* Print Verification & Signatures Bar */}
                <div className="rr-print-footer">
                  <div className="rr-print-barcode-box">
                    <div className="rr-barcode-lines"></div>
                    <span className="rr-barcode-text">*{displayData.uhid}*</span>
                    <span className="rr-gen-stamp">Generated: {new Date().toLocaleString("en-IN")}</span>
                  </div>
                  <div className="rr-print-sig-box">
                    <div className="rr-sig-line"></div>
                    <span className="rr-sig-label">Authorized Registration Officer / Hospital In-Charge</span>
                    <span className="rr-hosp-seal">Narayan Hospital &amp; Medical Research Centre</span>
                  </div>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="rr-modal-foot">
                <div className="rr-foot-group">
                  <button
                    onClick={() => window.print()}
                    className="rr-btn rr-btn--green rr-btn--sm"
                  >
                    <LuPrinter size={14} /> Print Form
                  </button>
                  <button
                    onClick={() => { const p = viewP; setViewP(null); openEdit(p); }}
                    className="rr-btn rr-btn--gold rr-btn--sm"
                  >
                    <LuSquarePen size={14} /> Edit Record
                  </button>
                  <button
                    onClick={() => { const p = viewP; setViewP(null); setStatusP(p); setNewStatus(p.status || "Waiting"); }}
                    className="rr-btn rr-btn--violet rr-btn--sm"
                  >
                    <LuRefreshCw size={13} /> Update Status
                  </button>
                  <button
                    onClick={() => { const p = viewP; setViewP(null); setCancelP(p); }}
                    className="rr-btn rr-btn--red rr-btn--sm"
                  >
                    <LuBan size={14} /> Cancel
                  </button>
                </div>
                <button
                  onClick={() => setViewP(null)}
                  className="rr-btn rr-btn--navy rr-btn--sm"
                >
                  Close Form
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ─── EDIT MODAL (Premium Healthcare Record Editor - Wide & Structured) ─── */}
      {editP && (
        <div className="rr-overlay" onClick={() => setEditP(null)}>
          <div className="rr-modal" onClick={e => e.stopPropagation()}>

            {/* Header Bar */}
            <div className="rr-modal-head">
              <div className="rr-modal-head-left">
                <div className="rr-modal-icon">
                  <LuSquarePen size={18} />
                </div>
                <div>
                  <h3 className="rr-modal-title">
                    Edit Patient Record
                    <span className="rr-chip">Editor Mode</span>
                  </h3>
                  <p className="rr-modal-meta">
                    UHID: <strong className="rr-mono">{editP.uhid || "—"}</strong>
                    <span style={{ margin: "0 8px", opacity: 0.6 }}>•</span>
                    Patient: <strong>{editP.name || editForm.name || "—"}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditP(null)}
                className="rr-close"
                title="Cancel & Close"
              >
                <LuCircleX size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="rr-modal-body">

              {/* Patient Identity Banner */}
              <div className="rr-banner">
                <div className="rr-banner-left">
                  <div className="rr-avatar">
                    {(editForm.name || "P")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2>{editForm.name || "Patient Record"}</h2>
                    <div className="rr-banner-meta">
                      <span>UHID: <strong className="rr-mono rr-blue">{editP.uhid || "—"}</strong></span>
                      <span>•</span>
                      <span>Patient ID: <strong>{editP.patientId || editP.id || "—"}</strong></span>
                      <span>•</span>
                      <span>Category: <strong>{editForm.category || "OPD"}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="rr-banner-right">
                  <small>Registration Date</small>
                  <span>{editP.registeredAt || editP.regDate || "—"}</span>
                </div>
              </div>

              {/* Section 1: Personal Details */}
              <div className="rr-section">
                <div className="rr-section-head">
                  <h4 className="rr-section-title">
                    <span className="rr-dot rr-dot--blue"></span> 1. Personal Details
                  </h4>
                  <span className="rr-section-note">Identity Info</span>
                </div>

                <div className="rr-grid rr-grid--4">
                  <div className="rr-span-2">
                    <label className="rr-flabel">
                      Full Name <span className="rr-req">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={e => setEditForm(f => ({...f, name: e.target.value}))}
                      placeholder="e.g. Juli Singh Patel"
                      className="rr-input"
                    />
                  </div>

                  <div>
                    <label className="rr-flabel">
                      Gender <span className="rr-req">*</span>
                    </label>
                    <select
                      value={editForm.gender || "Male"}
                      onChange={e => setEditForm(f => ({...f, gender: e.target.value}))}
                      className="rr-select"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="rr-flabel">
                      Age (Years) <span className="rr-req">*</span>
                    </label>
                    <input
                      type="number"
                      value={editForm.age || ""}
                      onChange={e => setEditForm(f => ({...f, age: e.target.value}))}
                      placeholder="Age in years"
                      className="rr-input"
                    />
                  </div>

                  <div className="rr-span-2">
                    <label className="rr-flabel">
                      Blood Group
                    </label>
                    <select
                      value={editForm.bloodGroup || ""}
                      onChange={e => setEditForm(f => ({...f, bloodGroup: e.target.value}))}
                      className="rr-select"
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div className="rr-span-2">
                    <label className="rr-flabel">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      value={editForm.aadhaar || ""}
                      onChange={e => setEditForm(f => ({...f, aadhaar: e.target.value}))}
                      placeholder="Enter 12-digit Aadhaar number"
                      className="rr-input"
                    />
                  </div>

                 
                  <div className="rr-span-2">
                    <label className="rr-flabel">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={editForm.occupation || ""}
                      onChange={e => setEditForm(f => ({...f, occupation: e.target.value}))}
                      placeholder="e.g. Business, Service, Homemaker"
                      className="rr-input"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Details */}
              <div className="rr-section">
                <div className="rr-section-head">
                  <h4 className="rr-section-title">
                    <span className="rr-dot rr-dot--green"></span> 2. Contact Details
                  </h4>
                  <span className="rr-section-note">Communication Info</span>
                </div>

                <div className="rr-grid rr-grid--4">
                  <div className="rr-span-2">
                    <label className="rr-flabel">
                      Mobile No. <span className="rr-req">*</span>
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone || ""}
                      onChange={e => setEditForm(f => ({...f, phone: e.target.value}))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="rr-input"
                    />
                  </div>

                  <div className="rr-span-2">
                    <label className="rr-flabel">
                      Alternate Mobile
                    </label>
                    <input
                      type="tel"
                      value={editForm.altPhone || ""}
                      onChange={e => setEditForm(f => ({...f, altPhone: e.target.value}))}
                      placeholder="Alternate phone number"
                      maxLength={10}
                      className="rr-input"
                    />
                  </div>

                  <div className="rr-span-2">
                    <label className="rr-flabel">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email || ""}
                      onChange={e => setEditForm(f => ({...f, email: e.target.value}))}
                      placeholder="patient@example.com"
                      className="rr-input"
                    />
                  </div>

                  <div>
                    <label className="rr-flabel">
                      City
                    </label>
                    <input
                      type="text"
                      value={editForm.city || ""}
                      onChange={e => setEditForm(f => ({...f, city: e.target.value}))}
                      placeholder="Enter city"
                      className="rr-input"
                    />
                  </div>

                  <div>
                    <label className="rr-flabel">
                      State
                    </label>
                    <select
                      value={editForm.state || ""}
                      onChange={e => setEditForm(f => ({...f, state: e.target.value}))}
                      className="rr-select"
                    >
                      <option value="">Select state</option>
                      {["Uttar Pradesh","Delhi","Maharashtra","Karnataka","Rajasthan","Madhya Pradesh",
                        "Gujarat","Tamil Nadu","West Bengal","Bihar"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="rr-flabel">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={editForm.pincode || ""}
                      onChange={e => setEditForm(f => ({...f, pincode: e.target.value}))}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className="rr-input"
                    />
                  </div>

                  <div>
                    <label className="rr-flabel">
                      Country
                    </label>
                    <select
                      value={editForm.country || "India"}
                      onChange={e => setEditForm(f => ({...f, country: e.target.value}))}
                      className="rr-select"
                    >
                      <option value="India">India</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="rr-span-2">
                    <label className="rr-flabel">
                      Address <span className="rr-req">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.address || ""}
                      onChange={e => setEditForm(f => ({...f, address: e.target.value}))}
                      placeholder="Street / House / Locality"
                      className="rr-input"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Additional Information */}
              <div className="rr-section">
                <div className="rr-section-head">
                  <h4 className="rr-section-title">
                    <span className="rr-dot rr-dot--violet"></span> 3. Additional Information
                  </h4>
                  <span className="rr-section-note">Emergency & Consultation</span>
                </div>

                <div className="rr-grid rr-grid--3">
                  <div>
                    <label className="rr-flabel">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      value={editForm.emergencyName || ""}
                      onChange={e => setEditForm(f => ({...f, emergencyName: e.target.value}))}
                      placeholder="Emergency contact name"
                      className="rr-input"
                    />
                  </div>

                  <div>
                    <label className="rr-flabel">
                      Emergency Contact Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.emergencyPhone || ""}
                      onChange={e => setEditForm(f => ({...f, emergencyPhone: e.target.value}))}
                      placeholder="Contact number"
                      maxLength={10}
                      className="rr-input"
                    />
                  </div>

                  <div>
                    <label className="rr-flabel">
                      Relationship with Patient
                    </label>
                    <select
                      value={editForm.emergencyRelation || ""}
                      onChange={e => setEditForm(f => ({...f, emergencyRelation: e.target.value}))}
                      className="rr-select"
                    >
                      <option value="">Select relationship</option>
                      {["Spouse","Parent","Child","Sibling","Friend","Other"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="rr-flabel">
                      Referred By
                    </label>
                    <select
                      value={editForm.doctor || ""}
                      onChange={e => setEditForm(f => ({...f, doctor: e.target.value}))}
                      className="rr-select"
                    >
                      <option value="">Select doctor / source</option>
                      <option value="Dr. Ranju Chaurasia">Dr. Ranju Chaurasia</option>
                      <option value="Dr. Manoj Chaurasia">Dr. Manoj Chaurasia</option>
                      <option value="Dr. Aman Sharma">Dr. Aman Sharma</option>
                      <option value="Dr. Priya Deshmukh">Dr. Priya Deshmukh</option>
                      <option value="Self">Self</option>
                      <option value="Other Hospital">Other Hospital</option>
                    </select>
                  </div>

                  <div>
                    <label className="rr-flabel">
                      Department
                    </label>
                    <select
                      value={editForm.department || ""}
                      onChange={e => setEditForm(f => ({...f, department: e.target.value}))}
                      className="rr-select"
                    >
                      <option value="">Select department</option>
                      {["General Medicine","Cardiology","Neurology","Orthopedics",
                        "Gynecology","Pediatrics","Dermatology","ENT","Ophthalmology",
                        "Urology","Surgery"].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="rr-flabel">
                      Visit Type
                    </label>
                    <select
                      value={editForm.category || "OPD"}
                      onChange={e => setEditForm(f => ({...f, category: e.target.value}))}
                      className="rr-select"
                    >
                      <option value="OPD">OPD (Outpatient)</option>
                      <option value="IPD">IPD (Inpatient)</option>
                      <option value="Registered">Registered</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="rr-modal-foot">
              <button
                type="button"
                onClick={() => setEditP(null)}
                className="rr-btn rr-btn--ghost"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="rr-btn rr-btn--green"
              >
                <LuSave size={15} /> Update Record
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── STATUS MODAL ─── */}
      {statusP && (
        <div className="rr-overlay" onClick={() => setStatusP(null)}>
          <div className="rr-modal rr-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="rr-modal-head">
              <h3 className="rr-modal-title rr-modal-title--plain">Update Status</h3>
              <button onClick={() => setStatusP(null)} className="rr-close"><LuCircleX size={18} /></button>
            </div>
            <div className="rr-modal-body rr-modal-body--pad">
              <p className="rr-status-lead">Patient: <strong>{statusP.name || statusP.uhid}</strong></p>
              <div className="rr-options">
                {STATUSES.map(s => (
                  <button key={s.value} onClick={() => setNewStatus(s.value)}
                    className={`rr-option ${newStatus === s.value ? "rr-option--on" : ""}`}
                    style={newStatus === s.value ? { borderColor: s.color, color: s.color, backgroundColor: s.bg } : {}}>
                    <span className="rr-option-dot" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rr-modal-foot rr-foot-end">
              <button onClick={() => setStatusP(null)} className="rr-btn rr-btn--ghost">
                Cancel
              </button>
              <button onClick={saveStatus} className="rr-btn rr-btn--navy">
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCEL CONFIRM MODAL ─── */}
      {cancelP && (
        <div className="rr-overlay" onClick={() => setCancelP(null)}>
          <div className="rr-modal rr-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="rr-confirm">
              <div className="rr-confirm-icon">
                <LuCircleX size={28} />
              </div>
              <h3>
                {canDelete ? "Delete Record?" : "Cancel Registration?"}
              </h3>
              <p>
                {canDelete
                  ? `This will permanently delete the record for ${cancelP.name || cancelP.uhid}.`
                  : `${cancelP.name || cancelP.uhid} will be marked as Cancelled.`}
              </p>
              <div className="rr-confirm-actions">
                <button onClick={() => setCancelP(null)} className="rr-btn rr-btn--ghost">
                  Keep
                </button>
                <button onClick={confirmCancel} className="rr-btn rr-btn--red">
                  {canDelete ? "Delete" : "Cancel Reg."}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}