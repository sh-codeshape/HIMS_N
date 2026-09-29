import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuUserPlus, LuUser, LuPhone, LuFileText,
  LuRefreshCw, LuCircleCheck,
  LuStethoscope, LuBed, LuSearch, LuX, LuLayoutDashboard
} from "react-icons/lu";
import { mockStore } from "../../mock/mockStore";

// ─── helpers ────────────────────────────────────────────────────────────────
const genUHID = () =>
  `HIMS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

const INITIAL_FORM = {
  firstName: "", middleName: "", lastName: "", gender: "",
  dob: "", age: "", bloodGroup: "", maritalStatus: "",
  aadhaar: "", pan: "", occupation: "", nationality: "Indian",
  mobile: "", altMobile: "", email: "", landline: "",
  address1: "", address2: "", country: "India", state: "", city: "", pincode: "",
  emgName: "", emgNumber: "", emgRelation: "",
  referredBy: "", department: "", visitType: "OPD",
  paymentType: "Cash", healthInsurance: "No",
  insuranceProvider: "", insuranceNumber: "",
  confirmed: false,
};

// ─── component ───────────────────────────────────────────────────────────────
export default function RegisterPatient() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [toast, setToast] = useState(null); // { msg, type }

  // ── Search state ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Live search handler ──────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length < 1) { setSearchResults([]); setShowDropdown(false); return; }
    const term = q.trim().toLowerCase();
    const all = mockStore.getPatients();
    const matches = all.filter((p) => {
      const name = `${p.firstName || ""} ${p.lastName || ""} ${p.name || ""}`.toLowerCase();
      const phone = (p.mobile1 || p.phone || p.mobile || "").toLowerCase();
      const uhid = (p.uhid || "").toLowerCase();
      return name.includes(term) || phone.includes(term) || uhid.includes(term);
    });
    setSearchResults(matches.slice(0, 8));
    setShowDropdown(true);
  };

  // ── Auto-fill form on patient select ────────────────────────────────────
  const handleSelectPatient = (p) => {
    const addrParts = (p.address || "").split(",");
    setFormData({
      ...INITIAL_FORM,
      firstName:  p.firstName || (p.name || "").split(" ")[0] || "",
      middleName: p.middleName || "",
      lastName:   p.lastName  || (p.name || "").split(" ").slice(1).join(" ") || "",
      gender:     p.gender    || "",
      dob:        p.dob       || "",
      age:        p.age       || p.ageYrs || "",
      bloodGroup: p.bloodGroup || "",
      maritalStatus: p.maritalStatus || "",
      aadhaar:    p.aadhaar   || p.idNo || "",
      occupation: p.occupation || "",
      nationality: p.nationality || "Indian",
      mobile:     p.mobile1   || p.phone || p.mobile || "",
      altMobile:  p.mobile2   || p.altMobile || "",
      email:      p.email     || "",
      address1:   addrParts[0]?.trim() || p.address || "",
      address2:   addrParts[1]?.trim() || "",
      city:       p.city      || "",
      state:      p.state     || "",
      pincode:    p.pin       || p.pincode || "",
      country:    p.country   || "India",
      emgName:    p.emergencyName || "",
      emgNumber:  p.emergencyPhone || "",
      emgRelation: p.emergencyRelation || "",
      referredBy: p.referredBy || "",
      department: p.department || "",
      visitType:  p.visitType || "OPD",
      confirmed:  false,
    });
    setSearchQuery(`${p.firstName || p.name} — ${p.mobile1 || p.phone || p.mobile} (${p.uhid})`);
    setShowDropdown(false);
    showToast(`✅ Patient loaded: ${p.firstName || p.name} (${p.uhid})`);
  };

  const clearSearch = () => { setSearchQuery(""); setSearchResults([]); setShowDropdown(false); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    showToast("Form cleared.", "info");
  };

  // ── Build patient record from form ───────────────────────────────────────
  const buildPatientRecord = () => {
    const uhid = genUHID();
    const fullName = (formData.firstName || "").trim();
    return {
      uhid,
      name: fullName,
      firstName: fullName.split(" ")[0] || fullName,
      middleName: "",
      lastName: fullName.split(" ").slice(1).join(" ") || "",
      gender: formData.gender,
      dob: formData.dob || "",
      age: formData.age,
      bloodGroup: formData.bloodGroup,
      maritalStatus: "",
      aadhaar: formData.aadhaar,
      pan: "",
      occupation: "",
      nationality: formData.nationality || "Indian",
      phone: formData.mobile,
      mobile1: formData.mobile,
      mobile2: "",
      email: "",
      landline: "",
      address: formData.address1,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      country: formData.country || "India",
      emergencyName: formData.emgName,
      emergencyPhone: formData.emgNumber,
      emergencyRelation: formData.emgRelation,
      referredBy: formData.referredBy,
      department: formData.department,
      visitType: formData.visitType || "OPD",
      paymentType: "Cash",
      healthInsurance: formData.healthInsurance || "No",
      insuranceProvider: "",
      insuranceNumber: "",
      regDate: new Date().toISOString().split("T")[0],
      category: "Registered",
      status: "Active",
    };
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    if (!formData.firstName.trim()) { showToast("⚠️ Full Name is required.", "error"); return false; }
    if (!formData.gender) { showToast("⚠️ Please select Gender.", "error"); return false; }
    if (!formData.age) { showToast("⚠️ Age is required.", "error"); return false; }
    if (!formData.mobile || formData.mobile.length < 10) { showToast("⚠️ Valid 10-digit Mobile is required.", "error"); return false; }
    if (!formData.address1.trim()) { showToast("⚠️ Address is required.", "error"); return false; }
    if (!formData.confirmed) { showToast("⚠️ Please confirm the information.", "error"); return false; }
    return true;
  };

  // ── Process to OPD ───────────────────────────────────────────────────────
  const handleProcessOPD = () => {
    if (!validate()) return;
    const patient = mockStore.addPatient(buildPatientRecord());
    const tokenCount = mockStore.getOPDQueue().length + 1;
    mockStore.addOPDToken({
      tokenNo: `T-${String(tokenCount).padStart(2, "0")}`,
      patientName: patient.name,
      uhid: patient.uhid,
      doctor: formData.referredBy || "Dr. Ranju Chaurasia",
      department: formData.department || "General Medicine",
      status: "Waiting",
      shift: "Day Shift",
      type: "Normal",
      fee: 350,
      paymentType: "Cash",
    });
    showToast(`✅ ${patient.name} registered & added to OPD Queue! UHID: ${patient.uhid}`);
    handleReset();
    setTimeout(() => navigate("/opd/reports"), 1500);
  };

  // ── Process to IPD ───────────────────────────────────────────────────────
  const handleProcessIPD = () => {
    if (!validate()) return;
    const patient = mockStore.addPatient(buildPatientRecord());
    mockStore.addIPDAdmission({
      patientName: patient.name,
      uhid: patient.uhid,
      gender: patient.gender,
      age: patient.age,
      phone: patient.phone,
      department: formData.department || "General Medicine",
      referredBy: formData.referredBy || "—",
      paymentType: "Cash",
      healthInsurance: formData.healthInsurance,
      insuranceProvider: "",
    });
    showToast(`✅ ${patient.name} admitted to IPD! UHID: ${patient.uhid}`);
    handleReset();
    setTimeout(() => navigate("/ipd/bed-allotment"), 1500);
  };

  // ── Register Only (no OPD/IPD) ───────────────────────────────────────────
  const handleRegisterOnly = () => {
    if (!validate()) return;
    const patient = mockStore.addPatient(buildPatientRecord());
    showToast(`🎉 Patient Registered! UHID: ${patient.uhid}`);
    handleReset();
  };

  // ─── Styles ──────────────────────────────────────────────────────────────
  const inputCls =
    "w-full h-11 px-3.5 border border-slate-200/90 rounded-xl text-sm text-slate-800 bg-white hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 transition-all placeholder:text-slate-400 font-medium shadow-2xs";
  const selectCls =
    "w-full h-11 px-3.5 border border-slate-200/90 rounded-xl text-sm text-slate-800 bg-white hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 transition-all cursor-pointer font-medium shadow-2xs";
  const labelCls = "block text-xs font-bold text-slate-700 mb-1.5 tracking-tight";

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans p-4 sm:p-6 lg:p-8">

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white transition-all
            ${toast.type === "error" ? "bg-red-500" : toast.type === "info" ? "bg-slate-700" : "bg-emerald-600"}`}
        >
          <LuCircleCheck size={18} />
          {toast.msg}
        </div>
      )}

      {/* ── PAGE HEADER & BREADCRUMB ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <LuUserPlus size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Patient Registration
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                New Admission
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Register a new patient into the system
            </p>
          </div>
        </div>

        {/* Working Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="self-start sm:self-auto flex items-center gap-2 text-xs font-medium bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors cursor-pointer"
          >
            <LuLayoutDashboard size={13} className="text-blue-500" />
            Dashboard
          </button>
          <span className="text-slate-300 font-light">/</span>
          <button
            type="button"
            onClick={() => navigate("/registration/reports")}
            className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors cursor-pointer"
          >
            Registration
          </button>
          <span className="text-slate-300 font-light">/</span>
          <span className="text-slate-800 font-bold bg-slate-100/90 px-2 py-0.5 rounded-md">
            Patient Registration
          </span>
        </nav>
      </div>

      {/* ── SEARCH BAR (Instant Patient Lookup) ── */}
      <div ref={searchRef} className="relative mb-6 max-w-2xl">
        <div className="flex items-center bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100/60 transition-all">
          <div className="pl-4 pr-1 text-slate-400">
            <LuSearch size={18} />
          </div>
          <input
            type="text"
            className="w-full text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400 py-3.5 px-3 font-medium"
            placeholder="Search registered patient by Name or Mobile Number..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <LuX size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (searchQuery.trim().length >= 1) setShowDropdown(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold px-6 py-3.5 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            <LuSearch size={15} />
            <span>Search</span>
          </button>
        </div>

        {/* Dropdown Results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fadeIn backdrop-blur-md">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>{searchResults.length} Patient(s) Found</span>
              <span className="text-blue-600 lowercase font-normal">Click to auto-fill form</span>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((p) => (
                <div
                  key={p.uhid || p.id}
                  onClick={() => handleSelectPatient(p)}
                  className="flex items-center gap-3.5 px-4 py-3 hover:bg-blue-50/70 cursor-pointer transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {(p.firstName || p.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors">
                        {p.firstName ? `${p.firstName} ${p.lastName || ""}`.trim() : p.name}
                      </span>
                      <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md font-mono font-semibold">
                        {p.uhid}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex gap-3 flex-wrap">
                      <span>📞 {p.mobile1 || p.phone || p.mobile || "—"}</span>
                      <span>• {p.age || p.ageYrs || "?"} Yrs / {p.gender || "—"}</span>
                      {p.bloodGroup && <span>• 🩸 {p.bloodGroup}</span>}
                      {p.city && <span>• 📍 {p.city}</span>}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-3 py-1.5 rounded-lg shrink-0 transition-colors">
                    Load →
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showDropdown && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl px-5 py-4 text-center text-sm text-slate-500">
            No registered patient found matching "<strong>{searchQuery}</strong>"
          </div>
        )}
      </div>

      {/* ── MAIN REGISTRATION CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">

          {/* ── SECTION 1: PERSONAL INFORMATION ── */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                <LuUser size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Personal Information</h3>
                <p className="text-[11px] text-slate-500 font-medium">Basic demographics and identification</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Full Name (2 cols) */}
              <div className="md:col-span-2">
                <label className={labelCls}>Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter full name"
                  className={inputCls}
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              {/* Gender (1 col) */}
              <div>
                <label className={labelCls}>Gender <span className="text-rose-500">*</span></label>
                <div className="flex items-center gap-1.5 h-11">
                  {["Male", "Female", "Other"].map((g) => (
                    <label
                      key={g}
                      className={`flex-1 h-full flex items-center justify-center gap-1.5 text-xs rounded-xl border cursor-pointer font-semibold transition-all select-none ${
                        formData.gender === g
                          ? "bg-blue-50/90 border-blue-400 text-blue-700 shadow-2xs ring-1 ring-blue-400/30"
                          : "bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={formData.gender === g}
                        onChange={handleChange}
                        className="accent-blue-600 w-3.5 h-3.5"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Age (1 col) */}
              <div>
                <label className={labelCls}>Age <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    min="0"
                    max="130"
                    className={`${inputCls} pr-14`}
                    value={formData.age}
                    onChange={handleChange}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-slate-100 border border-slate-200/80 px-2 py-1 rounded-md text-[11px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none">
                    Years
                  </div>
                </div>
              </div>

              {/* Blood Group (2 cols) */}
              <div className="md:col-span-2">
                <label className={labelCls}>Blood Group</label>
                <select
                  name="bloodGroup"
                  className={selectCls}
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select blood group</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Aadhaar Number (2 cols) */}
              <div className="md:col-span-2">
                <label className={labelCls}>Aadhaar Number</label>
                <input
                  type="text"
                  name="aadhaar"
                  placeholder="Enter 12-digit aadhaar number"
                  maxLength={12}
                  className={inputCls}
                  value={formData.aadhaar}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 2: CONTACT INFORMATION ── */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
                <LuPhone size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Contact Information</h3>
                <p className="text-[11px] text-slate-500 font-medium">Phone number and residential address</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Mobile Number (1 col) */}
              <div className="md:col-span-1">
                <label className={labelCls}>Mobile Number <span className="text-rose-500">*</span></label>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  className={inputCls}
                  value={formData.mobile}
                  onChange={handleChange}
                />
              </div>

              {/* Address (3 cols) */}
              <div className="md:col-span-3">
                <label className={labelCls}>Address <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="address1"
                  placeholder="Street / House / Locality"
                  className={inputCls}
                  value={formData.address1}
                  onChange={handleChange}
                />
              </div>

              {/* Country (1 col) */}
              <div>
                <label className={labelCls}>Country</label>
                <select
                  name="country"
                  className={selectCls}
                  value={formData.country}
                  onChange={handleChange}
                >
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* State (1 col) */}
              <div>
                <label className={labelCls}>State</label>
                <select
                  name="state"
                  className={selectCls}
                  value={formData.state}
                  onChange={handleChange}
                >
                  <option value="">Select state</option>
                  {["Uttar Pradesh", "Delhi", "Maharashtra", "Karnataka", "Rajasthan", "Madhya Pradesh", "Gujarat", "Tamil Nadu", "West Bengal", "Bihar"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* City (1 col) */}
              <div>
                <label className={labelCls}>City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Enter city"
                  className={inputCls}
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              {/* Pincode (1 col) */}
              <div>
                <label className={labelCls}>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="6-digit pincode"
                  maxLength={6}
                  className={inputCls}
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 3: ADDITIONAL INFORMATION ── */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-100">
                <LuFileText size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Additional Information</h3>
                <p className="text-[11px] text-slate-500 font-medium">Emergency contact, referral doctor & department</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Emergency Contact Name (2 cols) */}
              <div className="md:col-span-2">
                <label className={labelCls}>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emgName"
                  placeholder="Emergency contact name"
                  className={inputCls}
                  value={formData.emgName}
                  onChange={handleChange}
                />
              </div>

              {/* Emergency Contact Number (1 col) */}
              <div>
                <label className={labelCls}>Emergency Contact Number</label>
                <input
                  type="tel"
                  name="emgNumber"
                  placeholder="Contact number"
                  maxLength={10}
                  className={inputCls}
                  value={formData.emgNumber}
                  onChange={handleChange}
                />
              </div>

              {/* Relationship (1 col) */}
              <div>
                <label className={labelCls}>Relationship with Patient</label>
                <select
                  name="emgRelation"
                  className={selectCls}
                  value={formData.emgRelation}
                  onChange={handleChange}
                >
                  <option value="">Select relationship</option>
                  {["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Referred By (2 cols) */}
              <div className="md:col-span-2">
                <label className={labelCls}>Referred By</label>
                <select
                  name="referredBy"
                  className={selectCls}
                  value={formData.referredBy}
                  onChange={handleChange}
                >
                  <option value="">Select doctor / source</option>
                  <option>Dr. Ranju Chaurasia</option>
                  <option>Dr. Manoj Chaurasia</option>
                  <option>Dr. Aman Sharma</option>
                  <option>Dr. Priya Deshmukh</option>
                  <option>Self</option>
                  <option>Other Hospital</option>
                </select>
              </div>

              {/* Department (2 cols) */}
              <div className="md:col-span-2">
                <label className={labelCls}>Department</label>
                <select
                  name="department"
                  className={selectCls}
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="">Select department</option>
                  {["General Medicine", "Cardiology", "Neurology", "Orthopedics", "Gynecology", "Pediatrics", "Dermatology", "ENT", "Ophthalmology", "Urology", "Surgery"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Visit Type (2 cols) */}
              <div className="md:col-span-2">
                <label className={labelCls}>Visit Type</label>
                <div className="flex items-center gap-3 h-11">
                  {[
                    { value: "OPD", label: "🏥 OPD (Outpatient)", activeClass: "bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-400/30" },
                    { value: "IPD", label: "🛏️ IPD (Inpatient)", activeClass: "bg-rose-50 border-rose-400 text-rose-800 ring-1 ring-rose-400/30" }
                  ].map((vt) => (
                    <label
                      key={vt.value}
                      className={`flex-1 h-full flex items-center justify-center gap-2 text-xs font-bold rounded-xl border cursor-pointer transition-all select-none ${
                        formData.visitType === vt.value
                          ? `${vt.activeClass} shadow-2xs`
                          : "bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="visitType"
                        value={vt.value}
                        checked={formData.visitType === vt.value}
                        onChange={handleChange}
                        className="accent-blue-600 w-3.5 h-3.5"
                      />
                      <span>{vt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Health Insurance (2 cols) */}
              <div className="md:col-span-2">
                <label className={labelCls}>Health Insurance</label>
                <div className="flex items-center gap-3 h-11">
                  {[
                    { value: "Yes", label: "🛡️ Covered (Yes)" },
                    { value: "No", label: "❌ Not Covered (No)" }
                  ].map((item) => (
                    <label
                      key={item.value}
                      className={`flex-1 h-full flex items-center justify-center gap-2 text-xs font-bold rounded-xl border cursor-pointer transition-all select-none ${
                        formData.healthInsurance === item.value
                          ? "bg-blue-50/90 border-blue-400 text-blue-700 shadow-2xs ring-1 ring-blue-400/30"
                          : "bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="healthInsurance"
                        value={item.value}
                        checked={formData.healthInsurance === item.value}
                        onChange={handleChange}
                        className="accent-blue-600 w-3.5 h-3.5"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="bg-slate-50/90 rounded-b-2xl border-t border-slate-200/80 p-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Confirmation Checkbox */}
          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              name="confirmed"
              checked={formData.confirmed}
              onChange={handleChange}
              className="w-4 h-4 accent-blue-600 rounded border-slate-300 transition-all cursor-pointer"
            />
            <span>I confirm that the above information is correct and verified.</span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/90 text-slate-600 hover:text-slate-800 font-semibold text-xs sm:text-sm hover:bg-slate-100/80 bg-white transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <LuRefreshCw size={14} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleProcessOPD}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <LuStethoscope size={15} />
              <span>Process to OPD</span>
            </button>

            <button
              type="button"
              onClick={handleProcessIPD}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <LuBed size={15} />
              <span>Process to IPD</span>
            </button>

            <button
              type="button"
              onClick={handleRegisterOnly}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <LuUserPlus size={15} />
              <span>Register Patient</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
