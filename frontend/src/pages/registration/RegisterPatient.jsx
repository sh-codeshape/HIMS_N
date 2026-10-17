import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuUserPlus, LuUser, LuPhone, LuFileText,
  LuRefreshCw, LuCircleCheck,
  LuSearch, LuX, LuStethoscope, LuBed,
  LuCamera, LuUpload, LuZap, LuScan, LuRotateCcw, LuGlobe
} from "react-icons/lu";
import patientService from "../../api/services/patientService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import {
  required, phone, email, pincode, aadhaar, age as ageValidator,
  validateField, validateForm,
} from "../../utils/validation.js";
import "./RegisterPatient.css";

const normalizeCountryCode = (value, fallback = "IN") => {
  if (!value) return fallback;

  const raw = String(value).trim();
  if (!raw) return fallback;

  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;

  const map = {
    india: "IN",
    "united states": "US",
    "united states of america": "US",
    usa: "US",
    "united kingdom": "GB",
    uk: "GB",
    canada: "CA",
    australia: "AU",
    germany: "DE",
    france: "FR",
    italy: "IT",
    spain: "ES",
    nepal: "NP",
    bangladesh: "BD",
    pakistan: "PK",
    china: "CN",
    japan: "JP",
    singapore: "SG",
    "united arab emirates": "AE",
    uae: "AE",
  };

  return map[raw.toLowerCase()] || fallback;
};

const normalizeGender = (value) => {
  if (!value) return "unknown";
  const v = String(value).trim().toLowerCase();
  if (v === "m" || v === "male") return "male";
  if (v === "f" || v === "female") return "female";
  if (v === "other") return "other";
  return "unknown";
};

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
  familyHeadId: "",
  relationToHead: "",
};

// ─── component ───────────────────────────────────────────────────────────────
export default function RegisterPatient() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [toast, setToast] = useState(null); // { msg, type }

  // ── Search state ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatientForFamily, setSelectedPatientForFamily] = useState(null);
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
  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length < 1) { setSearchResults([]); setShowDropdown(false); return; }

    try {
      const matches = await patientService.search({ query: q.trim() });
      setSearchResults(matches.slice(0, 8));
      setShowDropdown(true);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Auto-fill form on patient select ────────────────────────────────────
  const handleSelectPatient = (p) => {
    setSelectedPatientForFamily(p);
    setShowDropdown(false);
  };

  const handleLoadSelectedPatient = () => {
    const p = selectedPatientForFamily;
    if (!p) return;
    const fullName = p.full_name || p.name || `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim();
    const firstName = p.first_name || p.firstName || (fullName || "").split(" ")[0] || "";
    const lastName = p.last_name || p.lastName || (fullName || "").split(" ").slice(1).join(" ") || "";
    const addrParts = (p.address || p.address_line1 || "").split(",");
    setFormData({
      ...INITIAL_FORM,
      firstName,
      middleName: p.middle_name || p.middleName || "",
      lastName,
      gender: p.gender || "",
      dob: p.date_of_birth || p.dob || "",
      age: p.age || p.ageYrs || "",
      bloodGroup: p.blood_group || p.bloodGroup || "",
      maritalStatus: p.marital_status || p.maritalStatus || "",
      aadhaar: p.aadhaar_number || p.aadhaar || p.idNo || "",
      occupation: p.occupation || "",
      nationality: p.nationality || "Indian",
      mobile: p.phone || p.mobile1 || p.mobile || "",
      altMobile: p.alternate_phone || p.mobile2 || p.altMobile || "",
      email: p.email || "",
      address1: addrParts[0]?.trim() || p.address_line1 || p.address || "",
      address2: addrParts[1]?.trim() || "",
      city: p.city || "",
      state: p.state || "",
      pincode: p.postal_code || p.pin || p.pincode || "",
      country: p.country || "India",
      emgName: p.emergency_name || p.emergencyName || "",
      emgNumber: p.emergency_phone || p.emergencyPhone || "",
      emgRelation: p.emergency_relation || p.emergencyRelation || "",
      department: p.department || "",
      visitType: "OPD",
      confirmed: false,
      familyHeadId: "",
      relationToHead: "",
    });
    setSearchQuery(`${fullName || "Patient"} — ${p.mobile1 || p.phone || p.mobile || "—"} (${p.uhid})`);
    setSelectedPatientForFamily(null);
    showToast(`✅ Patient loaded: ${fullName || "Patient"} (${p.uhid})`);
  };

  const handleAddFamilyMember = (relation) => {
    const p = selectedPatientForFamily;
    if (!p) return;
    const fullName = p.full_name || p.name || `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim();
    const addrParts = (p.address || p.address_line1 || "").split(",");
    
    // Auto-fill address and phone number, but leave personal details blank
    setFormData({
      ...INITIAL_FORM,
      mobile: p.phone || p.mobile1 || p.mobile || "",
      altMobile: p.alternate_phone || p.mobile2 || p.altMobile || "",
      address1: addrParts[0]?.trim() || p.address_line1 || p.address || "",
      address2: addrParts[1]?.trim() || "",
      city: p.city || "",
      state: p.state || "",
      pincode: p.postal_code || p.pin || p.pincode || "",
      country: p.country || "India",
      emgName: fullName, // Emergency contact can be the family head
      emgNumber: p.phone || p.mobile1 || p.mobile || "",
      emgRelation: "Other", 
      familyHeadId: p.family_head_id || p.id, // Link to the same head if they are a dependent, else to them
      relationToHead: relation || "Dependent",
    });
    setSearchQuery(`Adding family member for ${fullName || "Patient"} (${p.uhid})`);
    setSelectedPatientForFamily(null);
    showToast(`👨‍👩‍👧‍👦 Adding family member for: ${fullName || "Patient"}`);
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

  const setFieldTouched = (name) => {
    setTouched((p) => ({ ...p, [name]: true }));
  };

  const clearFieldError = (name) => {
    setErrors((p) => { const next = { ...p }; delete next[name]; return next; });
  };

  const validateFieldOnChange = (name, value) => {
    let result = { isValid: true, message: null };
    switch (name) {
      case "firstName":
        result = validateField(value, [required]);
        break;
      case "gender":
        result = validateField(value, [required]);
        break;
      case "age":
        result = validateField(value, [ageValidator]);
        break;
      case "mobile":
        result = validateField(value, [phone]);
        break;
      case "altMobile":
        if (value.trim()) result = validateField(value, [phone]);
        break;
      case "emgNumber":
        result = validateField(value, [phone]);
        break;
      case "emgName":
        result = validateField(value, [required]);
        break;
      case "emgRelation":
        result = validateField(value, [required]);
        break;
      case "address1":
        result = validateField(value, [required]);
        break;
      case "state":
        if (value.trim()) result = validateField(value, [required]);
        break;
      case "city":
        if (value.trim()) result = validateField(value, [required]);
        break;
      case "pincode":
        if (value.trim()) result = validateField(value, [pincode]);
        break;
      case "email":
        if (value.trim()) result = validateField(value, [email]);
        break;
      case "aadhaar":
        if (value.trim()) result = validateField(value, [aadhaar]);
        break;
      default:
        break;
    }
    if (result.isValid) clearFieldError(name);
    else setErrors((p) => ({ ...p, [name]: result.message }));
    return result.isValid;
  };

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;

    // Restrict digits and lengths for phone and aadhaar
    if (["mobile", "altMobile", "emgNumber"].includes(name)) {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    if (name === "aadhaar") {
      value = value.replace(/\D/g, "").slice(0, 12);
    }

    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));

    // Clear stale error as user types; run inline validation
    if (name) {
      clearFieldError(name);
      if (touched[name]) validateFieldOnChange(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldTouched(name);
    if (name) validateFieldOnChange(name, value);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setTouched({});
    showToast("Form cleared.", "info");
  };

  const buildPatientRecord = () => {
    return {
      facility_id: "00000000-0000-0000-0000-000000000000",

      // Basic Info
      first_name: formData.firstName,
      middle_name: formData.middleName || undefined,
      last_name: formData.lastName || undefined,
      gender: normalizeGender(formData.gender),
      date_of_birth: formData.dob || undefined,
      age: formData.age || undefined,
      blood_group: formData.bloodGroup || undefined,
      marital_status: formData.maritalStatus || undefined,
      occupation: formData.occupation || undefined,
      nationality: normalizeCountryCode(formData.nationality, "IN"),

      // Contact Info
      phone: formData.mobile,
      alternate_phone: formData.altMobile || undefined,
      email: formData.email || undefined,
      landline: formData.landline || undefined,

      // Address
      address_line1: `${formData.address1}${formData.address2 ? ", " + formData.address2 : ""}`,
      city: formData.city || undefined,
      state: formData.state || undefined,
      postal_code: formData.pincode || undefined,
      country: normalizeCountryCode(formData.country, "IN"),

      // Identifiers
      aadhaar_number: formData.aadhaar || undefined,
      pan_number: formData.pan || undefined,

      // Emergency Contact
      emergency_name: formData.emgName || undefined,
      emergency_phone: formData.emgNumber || undefined,
      emergency_relation: formData.emgRelation || undefined,

      // Visit / OPD Details (To be handled by OPD service if needed)
      referred_by: formData.referredBy || undefined,
      department: formData.department || undefined,
      visit_type: formData.visitType || undefined,
      payment_type: formData.paymentType || undefined,

      // Insurance
      health_insurance: formData.healthInsurance || undefined,
      insurance_provider: formData.insuranceProvider || undefined,
      insurance_number: formData.insuranceNumber || undefined,

      // Family
      family_head_id: formData.familyHeadId || undefined,
      relation_to_head: formData.relationToHead || undefined
    };
  };

  // ── Final submission guard ──────────────────────────────────────────────
  const validate = () => {
    // Mark every field as touched so inline errors show on submit attempt
    const allFields = Object.keys(INITIAL_FORM);
    allFields.forEach((f) => setFieldTouched(f));

    // Run inline validation on all fields
    const fieldMap = {
      firstName: { value: formData.firstName, validators: [required] },
      gender: { value: formData.gender, validators: [required] },
      age: { value: formData.age, validators: [ageValidator] },
      mobile: { value: formData.mobile, validators: [phone] },
      emgNumber: { value: formData.emgNumber, validators: [phone] },
      emgName: { value: formData.emgName, validators: [required] },
      emgRelation: { value: formData.emgRelation, validators: [required] },
      address1: { value: formData.address1, validators: [required] },
      state: { value: formData.state, validators: [required] },
      city: { value: formData.city, validators: [required] },
      pincode: { value: formData.pincode, validators: formData.pincode.trim() ? [pincode] : [] },
      email: { value: formData.email, validators: formData.email.trim() ? [email] : [] },
      aadhaar: { value: formData.aadhaar, validators: formData.aadhaar.trim() ? [aadhaar] : [] },
    };
    if (formData.relationToHead && !formData.familyHeadId) {
      // handled below
    }

    const { isValid, errors: nextErrors } = validateForm(fieldMap);
    setErrors(nextErrors);

    // Legacy message-based guards (kept as a user-friendly fallback)
    if (!formData.firstName.trim()) { showToast("⚠️ First Name is required.", "error"); return false; }
    if (!formData.gender) { showToast("⚠️ Please select Gender.", "error"); return false; }
    if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) { showToast("⚠️ Valid 10-digit Mobile is required.", "error"); return false; }
    if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar)) { showToast("⚠️ Aadhaar must be exactly 12 digits.", "error"); return false; }
    if (!formData.address1.trim()) { showToast("⚠️ Address Line 1 is required.", "error"); return false; }
    if (!formData.emgName.trim()) { showToast("⚠️ Emergency Contact Name is required.", "error"); return false; }
    if (!formData.emgNumber || !/^\d{10}$/.test(formData.emgNumber)) { showToast("⚠️ Valid 10-digit Emergency Number is required.", "error"); return false; }
    if (!formData.emgRelation) { showToast("⚠️ Please select relationship with patient.", "error"); return false; }
    if (formData.familyHeadId && !formData.relationToHead) { showToast("⚠️ Please select relationship to family head.", "error"); return false; }

    return isValid;
  };

  // ── Register & Navigate ───────────────────────────────────────────
  const handleRegisterAndNavigate = async (path) => {
    if (!validate()) return;
    try {
      const payload = buildPatientRecord();
      const patient = await patientService.create(payload);
      showToast(`🎉 Patient Registered! UHID: ${patient.uhid}`);
      if (path) {
        navigate(`${path}?uhid=${patient.uhid}`);
      }
      handleReset();
    } catch (err) {
      showToast("Error registering patient: " + err.message, "error");
    }
  };

  const fieldError = (name) => (touched[name] ? errors[name] : null);

  return (
    <div className="bg-slate-50 min-h-screen font-sans p-6 lg:p-8">

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all
            ${toast.type === "error" ? "bg-rose-500" : toast.type === "info" ? "bg-slate-700" : "bg-emerald-600"}`}
        >
          <LuCircleCheck size={16} />
          {toast.msg}
        </div>
      )}

      {/* FAMILY MODAL */}
      {selectedPatientForFamily && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Patient Selected</h3>
              <button onClick={() => setSelectedPatientForFamily(null)} className="text-slate-400 hover:text-slate-600">
                <LuX size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6">
                You selected <strong>{selectedPatientForFamily.full_name || selectedPatientForFamily.first_name}</strong>. What would you like to do?
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={handleLoadSelectedPatient}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <LuUser size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Load Patient Profile</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Auto-fill form to update details or proceed to OPD/IPD.</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleAddFamilyMember("Spouse")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <LuUserPlus size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Add New Family Member</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Register a dependent under this patient's profile.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP SEARCH BAR (Lifeline Hospital Style) ── */}
      <div ref={searchRef} className="relative mb-6">
        <div className="flex items-center bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <LuSearch size={18} className="text-slate-400 ml-4 shrink-0" />
          <input
            type="text"
            className="flex-1 text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-400 px-3.5 py-3"
            placeholder="Search registered patient by Name or Mobile Number..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
          />
          {searchQuery && (
            <button type="button" onClick={clearSearch}
              className="text-slate-400 hover:text-slate-600 transition-colors px-2">
              <LuX size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (searchQuery.trim().length >= 1) setShowDropdown(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 transition-all shrink-0"
          >
            <LuSearch size={15} />
            Search
          </button>
        </div>

        {/* Dropdown results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {searchResults.length} Patient(s) Found — Click to auto-fill form
            </div>
            {searchResults.map((p) => (
              <div key={p.uhid || p.id}
                onClick={() => handleSelectPatient(p)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {((p.full_name || p.name || `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim()) || "?")[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-800">
                      {p.full_name || p.name || `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim() || "Patient"}
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
          <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-4 text-center text-sm text-slate-500">
            No registered patient found for "<strong>{searchQuery}</strong>"
          </div>
        )}
      </div>

      {/* ── PAGE HEADER & BREADCRUMBS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <LuUserPlus size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Patient Registration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Register a new patient into the system</p>
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate("/")}>Dashboard</span>
          <span>/</span>
          <span className="text-blue-600">Registration</span>
          <span>/</span>
          <span className="text-slate-400">Patient Registration</span>
        </div>
      </div>

      {/* ── MAIN FORM CARDS ── */}
      <div className="space-y-4 w-full">

        {/* 1. PERSONAL INFORMATION */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm sm:text-base mb-3.5">
            <LuUser size={18} />
            <span>Personal Information</span>
          </div>

          <div className="space-y-3.5">
            {/* Row 1: First Name, Middle Name, Last Name, Gender */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder:text-slate-400 focus:outline-none transition-all ${
                    fieldError("firstName")
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                {fieldError("firstName") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  placeholder="Middle name"
                  value={formData.middleName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-4 pt-2">
                  {["Male", "Female", "Other"].map((g) => (
                    <label key={g} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={formData.gender === g}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="accent-blue-600 w-4 h-4 cursor-pointer"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
                {fieldError("gender") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Age, Blood Group, Aadhaar Number */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Age <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    inputMode="numeric"
                    className={`w-full pl-3.5 pr-14 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder:text-slate-400 focus:outline-none transition-all ${
                      fieldError("age")
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 select-none pointer-events-none">
                    Years
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-500">Enter age in years.</span>
                  <span className="text-xs text-slate-500">Years</span>
                </div>
                {fieldError("age") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.age}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  <option value="">Select blood group</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Aadhaar Number</label>
                <input
                  type="text"
                  name="aadhaar"
                  placeholder="12-digit aadhaar"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={12}
                  className={`w-full px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder:text-slate-400 focus:outline-none transition-all ${
                    fieldError("aadhaar")
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                <p className="text-xs text-slate-500 mt-1">Optional. 12 digits if provided.</p>
                {fieldError("aadhaar") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.aadhaar}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAMILY LINKING (CONDITIONAL) */}
        {formData.familyHeadId && (
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm sm:text-base mb-3">
              <LuUserPlus size={16} />
              <span>Family Linking</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Family Head ID (Hidden)</label>
                <input
                  type="text"
                  name="familyHeadId"
                  value={formData.familyHeadId}
                  disabled
                  className="w-full px-3.5 py-2 text-sm text-slate-500 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Relationship to Family Head <span className="text-rose-500">*</span>
                </label>
                <select
                  name="relationToHead"
                  value={formData.relationToHead}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg focus:outline-none transition-all cursor-pointer ${
                    fieldError("relationToHead")
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                >
                  <option value="">Select relationship</option>
                  {["Spouse", "Parent", "Child", "Sibling", "Dependent", "Other"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {fieldError("relationToHead") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.relationToHead}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTACT INFORMATION */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm sm:text-base mb-3.5">
            <LuPhone size={18} />
            <span>Contact Information</span>
          </div>

          <div className="space-y-3.5">
            {/* Row 1: Mobile Number, Alternate Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className={`flex items-center border rounded-lg overflow-hidden bg-white transition-all ${
                  fieldError("mobile")
                    ? "border-rose-500 ring-2 ring-rose-100"
                    : "border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
                }`}>
                  <span className="px-3.5 py-2 bg-slate-50 border-r border-slate-200 text-sm font-semibold text-slate-600 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="10-digit mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    inputMode="tel"
                    maxLength={10}
                    className="flex-1 px-3.5 py-2 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Valid 10-digit Indian mobile number.</p>
                {fieldError("mobile") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.mobile}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Alternate Mobile</label>
                <div className={`flex items-center border rounded-lg overflow-hidden bg-white transition-all ${
                  fieldError("altMobile")
                    ? "border-rose-500 ring-2 ring-rose-100"
                    : "border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
                }`}>
                  <span className="px-3.5 py-2 bg-slate-50 border-r border-slate-200 text-sm font-semibold text-slate-600 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="altMobile"
                    placeholder="Optional second number"
                    value={formData.altMobile}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    inputMode="tel"
                    maxLength={10}
                    className="flex-1 px-3.5 py-2 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Optional alternate contact number.</p>
                {fieldError("altMobile") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.altMobile}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Email Address, Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder:text-slate-400 focus:outline-none transition-all ${
                    fieldError("email")
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                <p className="text-xs text-slate-500 mt-1">Optional email for appointment reminders.</p>
                {fieldError("email") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ADDRESS INFORMATION */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm sm:text-base mb-3.5">
            <LuGlobe size={18} />
            <span>Address Information</span>
          </div>

          <div className="space-y-3.5">
            {/* Row 1: Address (col-span-2), State, City */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="address1"
                  placeholder="Street / House / Locality"
                  value={formData.address1}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder:text-slate-400 focus:outline-none transition-all ${
                    fieldError("address1")
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                <p className="text-xs text-slate-500 mt-1">Street, house number, locality.</p>
                {fieldError("address1") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.address1}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  State <span className="text-rose-500">*</span>
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg focus:outline-none transition-all cursor-pointer ${
                    fieldError("state")
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                >
                  <option value="">Select an option</option>
                  {["Uttar Pradesh", "Delhi", "Maharashtra", "Karnataka", "Rajasthan", "Madhya Pradesh",
                    "Gujarat", "Tamil Nadu", "West Bengal", "Bihar"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {fieldError("state") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.state}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder:text-slate-400 focus:outline-none transition-all ${
                    fieldError("city")
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                {fieldError("city") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.city}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Pincode */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="6-digit pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  inputMode="numeric"
                  maxLength={6}
                  className={`w-full px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder:text-slate-400 focus:outline-none transition-all ${
                    fieldError("pincode")
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                <p className="text-xs text-slate-500 mt-1">Optional 6-digit pincode.</p>
                {fieldError("pincode") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.pincode}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. ADDITIONAL INFORMATION */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm sm:text-base mb-3.5">
            <LuFileText size={18} />
            <span>Additional Information</span>
          </div>

          <div className="space-y-3.5">
            {/* Row 1: Emergency Contact Name, Emergency Contact Number, Relationship with Patient */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Emergency Contact Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="emgName"
                  placeholder="Emergency contact name"
                  value={formData.emgName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder:text-slate-400 focus:outline-none transition-all ${
                    fieldError("emgName")
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                {fieldError("emgName") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.emgName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Emergency Contact Number <span className="text-rose-500">*</span>
                </label>
                <div className={`flex items-center border rounded-lg overflow-hidden bg-white transition-all ${
                  fieldError("emgNumber")
                    ? "border-rose-500 ring-2 ring-rose-100"
                    : "border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
                }`}>
                  <span className="px-3.5 py-2 bg-slate-50 border-r border-slate-200 text-sm font-semibold text-slate-600 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="emgNumber"
                    placeholder="Contact number"
                    value={formData.emgNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    inputMode="tel"
                    maxLength={10}
                    className="flex-1 px-3.5 py-2 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
                {fieldError("emgNumber") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.emgNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Relationship with Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  name="emgRelation"
                  value={formData.emgRelation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg focus:outline-none transition-all cursor-pointer ${
                    fieldError("emgRelation")
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                >
                  <option value="">Select an option</option>
                  {["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {fieldError("emgRelation") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    {errors.emgRelation}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Referred By, Department, Visit Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 items-center">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Referred By</label>
                <select
                  name="referredBy"
                  value={formData.referredBy}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  <option value="">Select an option</option>
                  <option value="Dr. Ranju Chaurasia">Dr. Ranju Chaurasia</option>
                  <option value="Dr. Manoj Chaurasia">Dr. Manoj Chaurasia</option>
                  <option value="Dr. Aman Sharma">Dr. Aman Sharma</option>
                  <option value="Dr. Priya Deshmukh">Dr. Priya Deshmukh</option>
                  <option value="Self">Self</option>
                  <option value="Other Hospital">Other Hospital</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  <option value="">Select an option</option>
                  {["General Medicine", "Cardiology", "Neurology", "Orthopedics",
                    "Gynecology", "Pediatrics", "Dermatology", "ENT", "Ophthalmology",
                    "Urology", "Surgery"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Visit Type</label>
                <div className="flex items-center gap-4 pt-1">
                  {[
                    { val: "OPD", label: "OPD (Outpatient)", icon: "🏥" },
                    { val: "IPD", label: "IPD (Inpatient)", icon: "🛏️" }
                  ].map((vt) => (
                    <label key={vt.val} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="visitType"
                        value={vt.val}
                        checked={formData.visitType === vt.val}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="accent-blue-600 w-4 h-4 cursor-pointer"
                      />
                      <span className={formData.visitType === vt.val ? "text-slate-900 font-semibold" : "text-slate-600"}>
                        <span className="mr-1">{vt.icon}</span> {vt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── BOTTOM FOOTER ACTIONS ── */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-2">
        {/* Reset on Left */}
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-all bg-white shadow-sm active:scale-95"
        >
          <LuRotateCcw size={15} />
          <span>Reset</span>
        </button>

        {/* Action Buttons on Right */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => handleRegisterAndNavigate("/opd/registration")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 active:scale-95"
          >
            <LuStethoscope size={16} />
            <span>Save & Process to OPD</span>
          </button>

          <button
            type="button"
            onClick={() => handleRegisterAndNavigate("/ipd/admission")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-all shadow-md shadow-rose-100 active:scale-95"
          >
            <LuBed size={16} />
            <span>Save & Process to IPD</span>
          </button>

          <button
            type="button"
            onClick={() => handleRegisterAndNavigate(null)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <LuUserPlus size={16} />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

    </div>
  );
}
