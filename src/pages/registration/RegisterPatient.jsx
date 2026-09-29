import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuUserPlus, LuUser, LuPhone, LuFileText,
  LuRefreshCw, LuCircleCheck,
  LuStethoscope, LuBed, LuSearch, LuX
} from "react-icons/lu";
import { mockStore } from "../../mock/mockStore";
import "./RegisterPatient.css";

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
  paymentType: "", healthInsurance: "No",
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
      department: p.department || "",
      visitType:  "OPD",
      confirmed:  false,
    });
    setSearchQuery(`${p.firstName || p.name} — ${p.mobile1 || p.phone || p.mobile} (${p.uhid})`);
    setShowDropdown(false);
    showToast(`✅ Patient loaded: ${p.firstName || p.name} (${p.uhid})`);
  };

  const clearSearch = () => { setSearchQuery(""); setSearchResults([]); setShowDropdown(false); };

  // ── Auto-calculate age from DOB ──────────────────────────────────────────
  const handleDobChange = (e) => {
    const dob = e.target.value;
    let age = "";
    if (dob) {
      const diff = Date.now() - new Date(dob).getTime();
      age = String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
    }
    setFormData((p) => ({ ...p, dob, age }));
  };

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
    return {
      uhid,
      name: `${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`.trim(),
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      gender: formData.gender,
      dob: formData.dob,
      age: formData.age,
      bloodGroup: formData.bloodGroup,
      maritalStatus: formData.maritalStatus,
      aadhaar: formData.aadhaar,
      pan: formData.pan,
      occupation: formData.occupation,
      nationality: formData.nationality,
      phone: formData.mobile,
      mobile1: formData.mobile,
      mobile2: formData.altMobile,
      email: formData.email,
      landline: formData.landline,
      address: `${formData.address1}${formData.address2 ? ", " + formData.address2 : ""}`,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      country: formData.country,
      emergencyName: formData.emgName,
      emergencyPhone: formData.emgNumber,
      emergencyRelation: formData.emgRelation,
      referredBy: formData.referredBy,
      department: formData.department,
      visitType: formData.visitType,
      paymentType: formData.paymentType,
      healthInsurance: formData.healthInsurance,
      insuranceProvider: formData.insuranceProvider,
      insuranceNumber: formData.insuranceNumber,
      regDate: new Date().toISOString().split("T")[0],
      category: "Registered",
      status: "Active",
    };
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    if (!formData.firstName.trim()) { showToast("⚠️ First Name is required.", "error"); return false; }
    if (!formData.lastName.trim()) { showToast("⚠️ Last Name is required.", "error"); return false; }
    if (!formData.gender) { showToast("⚠️ Please select Gender.", "error"); return false; }
    if (!formData.mobile || formData.mobile.length < 10) { showToast("⚠️ Valid 10-digit Mobile is required.", "error"); return false; }
    if (!formData.address1.trim()) { showToast("⚠️ Address Line 1 is required.", "error"); return false; }
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
      paymentType: formData.paymentType || "Cash",
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
      paymentType: formData.paymentType || "Cash",
      healthInsurance: formData.healthInsurance,
      insuranceProvider: formData.insuranceProvider,
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
    "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400";
  const selectCls =
    "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";
  const secHdrCls =
    "flex items-center gap-2 text-blue-700 font-bold text-sm mb-4 pb-2 border-b border-blue-100";

  return (
    <div className="bg-slate-50 min-h-screen font-sans p-6">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all
            ${toast.type === "error" ? "bg-red-500" : toast.type === "info" ? "bg-slate-600" : "bg-emerald-500"}`}
        >
          <LuCircleCheck size={16} />
          {toast.msg}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <LuUserPlus size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Patient Registration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Register a new patient into the system</p>
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500">
          <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate("/")}>Dashboard</span>
          {" / "}
          <span className="text-blue-600">Registration</span>
          {" / Patient Registration"}
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div ref={searchRef} className="relative mb-5 max-w-xl">
        <div className="flex items-center gap-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <LuSearch size={17} className="text-slate-400 shrink-0 ml-4" />
          <input
            type="text"
            className="flex-1 text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-400 px-3 py-3"
            placeholder="Search registered patient by Name or Mobile Number..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
          />
          {searchQuery && (
            <button type="button" onClick={clearSearch}
              className="text-slate-400 hover:text-slate-600 transition-colors px-2">
              <LuX size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (searchQuery.trim().length >= 1) setShowDropdown(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-3 transition-all shrink-0"
          >
            <LuSearch size={15} />
            Search
          </button>
        </div>

        {/* Dropdown results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {searchResults.length} Patient(s) Found — Click to auto-fill form
            </div>
            {searchResults.map((p) => (
              <div key={p.uhid || p.id}
                onClick={() => handleSelectPatient(p)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {(p.firstName || p.name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-800">
                      {p.firstName ? `${p.firstName} ${p.lastName || ""}`.trim() : p.name}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
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
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg shrink-0">
                  Load →
                </span>
              </div>
            ))}
          </div>
        )}

        {showDropdown && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-4 text-center text-sm text-slate-500">
            No registered patient found for "<strong>{searchQuery}</strong>"
          </div>
        )}
      </div>

      {/* FORM CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-6 space-y-8">

          {/* ── SECTION 1: PERSONAL INFORMATION ── */}
          <div>
            <h3 className={secHdrCls}>
              <LuUser size={16} /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

              <div>
                <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                <input type="text" name="firstName" placeholder="Enter first name"
                  className={inputCls} value={formData.firstName} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>Middle Name</label>
                <input type="text" name="middleName" placeholder="Enter middle name"
                  className={inputCls} value={formData.middleName} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                <input type="text" name="lastName" placeholder="Enter last name"
                  className={inputCls} value={formData.lastName} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-4 mt-2">
                  {["Male", "Female", "Other"].map((g) => (
                    <label key={g} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                      <input type="radio" name="gender" value={g}
                        checked={formData.gender === g} onChange={handleChange}
                        className="accent-blue-600" />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" name="dob" className={inputCls}
                  value={formData.dob} onChange={handleDobChange} />
              </div>
              <div>
                <label className={labelCls}>Age <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="number" name="age" placeholder="Age"
                    className={inputCls} value={formData.age} onChange={handleChange} />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">Years</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Blood Group</label>
                <select name="bloodGroup" className={selectCls}
                  value={formData.bloodGroup} onChange={handleChange}>
                  <option value="">Select blood group</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((bg) => (
                    <option key={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Marital Status</label>
                <select name="maritalStatus" className={selectCls}
                  value={formData.maritalStatus} onChange={handleChange}>
                  <option value="">Select status</option>
                  {["Single","Married","Divorced","Widowed"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Aadhaar Number</label>
                <input type="text" name="aadhaar" placeholder="Enter aadhaar number"
                  className={inputCls} value={formData.aadhaar} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>PAN Number</label>
                <input type="text" name="pan" placeholder="Enter PAN number"
                  className={inputCls} value={formData.pan} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>Occupation</label>
                <input type="text" name="occupation" placeholder="Enter occupation"
                  className={inputCls} value={formData.occupation} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>Nationality</label>
                <select name="nationality" className={selectCls}
                  value={formData.nationality} onChange={handleChange}>
                  {["Indian","NRI","Other"].map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: CONTACT INFORMATION ── */}
          <div>
            <h3 className={secHdrCls}>
              <LuPhone size={16} /> Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className={labelCls}>Mobile Number <span className="text-red-500">*</span></label>
                <input type="tel" name="mobile" placeholder="10-digit mobile"
                  className={inputCls} value={formData.mobile} onChange={handleChange}
                  maxLength={10} />
              </div>
              <div>
                <label className={labelCls}>Alternate Mobile</label>
                <input type="tel" name="altMobile" placeholder="Alternate mobile"
                  className={inputCls} value={formData.altMobile} onChange={handleChange}
                  maxLength={10} />
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" name="email" placeholder="Enter email"
                  className={inputCls} value={formData.email} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>Landline</label>
                <input type="text" name="landline" placeholder="Landline number"
                  className={inputCls} value={formData.landline} onChange={handleChange} />
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Address Line 1 <span className="text-red-500">*</span></label>
                <input type="text" name="address1" placeholder="Street / House / Locality"
                  className={inputCls} value={formData.address1} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Address Line 2</label>
                <input type="text" name="address2" placeholder="Landmark / Area"
                  className={inputCls} value={formData.address2} onChange={handleChange} />
              </div>

              <div>
                <label className={labelCls}>Country <span className="text-red-500">*</span></label>
                <select name="country" className={selectCls}
                  value={formData.country} onChange={handleChange}>
                  <option>India</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>State <span className="text-red-500">*</span></label>
                <select name="state" className={selectCls}
                  value={formData.state} onChange={handleChange}>
                  <option value="">Select state</option>
                  {["Uttar Pradesh","Delhi","Maharashtra","Karnataka","Rajasthan","Madhya Pradesh",
                    "Gujarat","Tamil Nadu","West Bengal","Bihar"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>City <span className="text-red-500">*</span></label>
                <input type="text" name="city" placeholder="Enter city"
                  className={inputCls} value={formData.city} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>Pincode <span className="text-red-500">*</span></label>
                <input type="text" name="pincode" placeholder="6-digit pincode"
                  className={inputCls} value={formData.pincode} onChange={handleChange}
                  maxLength={6} />
              </div>
            </div>
          </div>

          {/* ── SECTION 3: ADDITIONAL INFORMATION ── */}
          <div>
            <h3 className={secHdrCls}>
              <LuFileText size={16} /> Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="md:col-span-2">
                <label className={labelCls}>Emergency Contact Name <span className="text-red-500">*</span></label>
                <input type="text" name="emgName" placeholder="Emergency contact name"
                  className={inputCls} value={formData.emgName} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>Emergency Contact Number <span className="text-red-500">*</span></label>
                <input type="tel" name="emgNumber" placeholder="Contact number"
                  className={inputCls} value={formData.emgNumber} onChange={handleChange}
                  maxLength={10} />
              </div>
              <div>
                <label className={labelCls}>Relationship with Patient <span className="text-red-500">*</span></label>
                <select name="emgRelation" className={selectCls}
                  value={formData.emgRelation} onChange={handleChange}>
                  <option value="">Select relationship</option>
                  {["Spouse","Parent","Child","Sibling","Friend","Other"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Referred By</label>
                <select name="referredBy" className={selectCls}
                  value={formData.referredBy} onChange={handleChange}>
                  <option value="">Select doctor / source</option>
                  <option>Dr. Ranju Chaurasia</option>
                  <option>Dr. Manoj Chaurasia</option>
                  <option>Dr. Aman Sharma</option>
                  <option>Dr. Priya Deshmukh</option>
                  <option>Self</option>
                  <option>Other Hospital</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <select name="department" className={selectCls}
                  value={formData.department} onChange={handleChange}>
                  <option value="">Select department</option>
                  {["General Medicine","Cardiology","Neurology","Orthopedics",
                    "Gynecology","Pediatrics","Dermatology","ENT","Ophthalmology",
                    "Urology","Surgery"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Visit Type</label>
                <div className="flex items-center gap-6 mt-2">
                  {["OPD","IPD"].map((vt) => (
                    <label key={vt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
                      <input type="radio" name="visitType" value={vt}
                        checked={formData.visitType === vt} onChange={handleChange}
                        className="accent-blue-600 w-4 h-4" />
                      <span className={formData.visitType === vt
                        ? (vt === "OPD" ? "text-emerald-600 font-bold" : "text-rose-600 font-bold")
                        : ""}>
                        {vt === "OPD" ? "🏥 OPD (Outpatient)" : "🛏️ IPD (Inpatient)"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Payment Type</label>
                <select name="paymentType" className={selectCls}
                  value={formData.paymentType} onChange={handleChange}>
                  <option value="">Select payment type</option>
                  {["Cash","Card","UPI","Insurance","TPA","Free / BPL"].map((pt) => (
                    <option key={pt}>{pt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Health Insurance</label>
                <div className="flex items-center gap-6 mt-2">
                  {["Yes","No"].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                      <input type="radio" name="healthInsurance" value={v}
                        checked={formData.healthInsurance === v} onChange={handleChange}
                        className="accent-blue-600" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Insurance Provider</label>
                <input type="text" name="insuranceProvider"
                  disabled={formData.healthInsurance === "No"}
                  placeholder="Insurance provider"
                  className={`${inputCls} ${formData.healthInsurance === "No" ? "bg-slate-50 opacity-50 cursor-not-allowed" : ""}`}
                  value={formData.insuranceProvider} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>Insurance Number</label>
                <input type="text" name="insuranceNumber"
                  disabled={formData.healthInsurance === "No"}
                  placeholder="Insurance / TPA number"
                  className={`${inputCls} ${formData.healthInsurance === "No" ? "bg-slate-50 opacity-50 cursor-not-allowed" : ""}`}
                  value={formData.insuranceNumber} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="bg-slate-50 rounded-b-2xl border-t border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
          {/* Confirmation Checkbox */}
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer font-medium">
            <input type="checkbox" name="confirmed"
              checked={formData.confirmed} onChange={handleChange}
              className="w-4 h-4 accent-blue-600 rounded border-slate-300" />
            I confirm that the above information is correct.
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button type="button" onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-all bg-white shadow-sm">
              <LuRefreshCw size={15} /> Reset
            </button>

            <button type="button" onClick={handleProcessOPD}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 active:scale-95">
              <LuStethoscope size={15} /> Process to OPD
            </button>

            <button type="button" onClick={handleProcessIPD}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-all shadow-md shadow-rose-100 active:scale-95">
              <LuBed size={15} /> Process to IPD
            </button>

            <button type="button" onClick={handleRegisterOnly}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95">
              <LuUserPlus size={15} /> Register Patient
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
