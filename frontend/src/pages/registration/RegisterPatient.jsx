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

// ─── UI-only helper (presentation, no logic) ────────────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="rp-error">
      <span className="rp-error-dot"></span>
      {message}
    </p>
  );
}

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

  // UI-only: returns " rp-input--err" style modifiers
  const errCls = (name, base) => (fieldError(name) ? ` ${base}--err` : "");

  return (
    <div className="rp-page">

      {/* Toast Notification */}
      {toast && (
        <div className={`rp-toast rp-toast--${toast.type === "error" ? "error" : toast.type === "info" ? "info" : "success"}`}>
          <LuCircleCheck size={16} />
          {toast.msg}
        </div>
      )}

      {/* FAMILY MODAL */}
      {selectedPatientForFamily && (
        <div className="rp-overlay">
          <div className="rp-modal">
            <div className="rp-modal-head">
              <h3>Patient Selected</h3>
              <button type="button" className="rp-modal-close" onClick={() => setSelectedPatientForFamily(null)}>
                <LuX size={18} />
              </button>
            </div>
            <div className="rp-modal-body">
              <p className="rp-modal-text">
                You selected <strong>{selectedPatientForFamily.full_name || selectedPatientForFamily.first_name}</strong>. What would you like to do?
              </p>

              <div className="rp-choices">
                <button type="button" onClick={handleLoadSelectedPatient} className="rp-choice">
                  <div className="rp-choice-icon rp-choice-icon--blue">
                    <LuUser size={20} />
                  </div>
                  <div>
                    <h4>Load Patient Profile</h4>
                    <p>Auto-fill form to update details or proceed to OPD/IPD.</p>
                  </div>
                </button>

                <button type="button" onClick={() => handleAddFamilyMember("Spouse")} className="rp-choice">
                  <div className="rp-choice-icon rp-choice-icon--green">
                    <LuUserPlus size={20} />
                  </div>
                  <div>
                    <h4>Add New Family Member</h4>
                    <p>Register a dependent under this patient's profile.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP SEARCH BAR ── */}
      <div ref={searchRef} className="rp-search-wrap">
        <div className="rp-search">
          <LuSearch size={18} className="rp-search-icon" />
          <input
            type="text"
            className="rp-search-input"
            placeholder="Search registered patient by Name or Mobile Number..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
          />
          {searchQuery && (
            <button type="button" onClick={clearSearch} className="rp-search-clear">
              <LuX size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (searchQuery.trim().length >= 1) setShowDropdown(true);
            }}
            className="rp-search-btn"
          >
            <LuSearch size={15} />
            Search
          </button>
        </div>

        {/* Dropdown results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="rp-dropdown">
            <div className="rp-dropdown-head">
              {searchResults.length} Patient(s) Found — Click to auto-fill form
            </div>
            {searchResults.map((p) => (
              <div key={p.uhid || p.id} onClick={() => handleSelectPatient(p)} className="rp-result">
                <div className="rp-avatar">
                  {((p.full_name || p.name || `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim()) || "?")[0]?.toUpperCase() || "?"}
                </div>
                <div className="rp-result-main">
                  <div className="rp-result-top">
                    <span className="rp-result-name">
                      {p.full_name || p.name || `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim() || "Patient"}
                    </span>
                    <span className="rp-uhid">{p.uhid}</span>
                  </div>
                  <div className="rp-result-sub">
                    <span>📞 {p.mobile1 || p.phone || p.mobile || "—"}</span>
                    <span>• {p.age || p.ageYrs || "?"} Yrs / {p.gender || "—"}</span>
                    {p.bloodGroup && <span>• 🩸 {p.bloodGroup}</span>}
                    {p.city && <span>• 📍 {p.city}</span>}
                  </div>
                </div>
                <span className="rp-load-chip">Load →</span>
              </div>
            ))}
          </div>
        )}

        {showDropdown && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
          <div className="rp-dropdown">
            <div className="rp-empty">
              No registered patient found for "<strong>{searchQuery}</strong>"
            </div>
          </div>
        )}
      </div>

      {/* ── PAGE HEADER & BREADCRUMBS ── */}
      <div className="rp-header">
        <div className="rp-header-left">
          <div className="rp-header-icon">
            <LuUserPlus size={22} />
          </div>
          <div>
            <h1 className="rp-title">Patient Registration</h1>
            <p className="rp-subtitle">Register a new patient into the system</p>
          </div>
        </div>
        <div className="rp-crumbs">
          <span className="rp-crumb-link" onClick={() => navigate("/")}>Dashboard</span>
          <span>/</span>
          <span className="rp-crumb-link">Registration</span>
          <span>/</span>
          <span className="rp-crumb-active">Patient Registration</span>
        </div>
      </div>

      {/* ── MAIN FORM CARDS ── */}
      <div className="rp-form">

        {/* 1. PERSONAL INFORMATION */}
        <div className="rp-card">
          <div className="rp-card-head">
            <LuUser size={18} />
            <span>Personal Information</span>
          </div>

          <div className="rp-rows">
            {/* Row 1: First Name, Middle Name, Last Name, Gender */}
            <div className="rp-grid rp-grid--4">
              <div>
                <label className="rp-label">
                  First Name <span className="rp-req">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`rp-input${errCls("firstName", "rp-input")}`}
                />
                <FieldError message={fieldError("firstName") ? errors.firstName : null} />
              </div>

              <div>
                <label className="rp-label">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  placeholder="Middle name"
                  value={formData.middleName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="rp-input"
                />
              </div>

              <div>
                <label className="rp-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="rp-input"
                />
              </div>

              <div>
                <label className="rp-label">
                  Gender <span className="rp-req">*</span>
                </label>
                <div className="rp-radios">
                  {["Male", "Female", "Other"].map((g) => (
                    <label key={g} className="rp-radio">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={formData.gender === g}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
                <FieldError message={fieldError("gender") ? errors.gender : null} />
              </div>
            </div>

            {/* Row 2: Age, Blood Group, Aadhaar Number */}
            <div className="rp-grid rp-grid--4">
              <div>
                <label className="rp-label">
                  Age <span className="rp-req">*</span>
                </label>
                <div className="rp-input-unit">
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    inputMode="numeric"
                    className={`rp-input${errCls("age", "rp-input")}`}
                  />
                  <span className="rp-unit">Years</span>
                </div>
                <div className="rp-hint-row">
                  <span>Enter age in years.</span>
                  <span>Years</span>
                </div>
                <FieldError message={fieldError("age") ? errors.age : null} />
              </div>

              <div>
                <label className="rp-label">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="rp-select"
                >
                  <option value="">Select blood group</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="rp-span-2">
                <label className="rp-label">Aadhaar Number</label>
                <input
                  type="text"
                  name="aadhaar"
                  placeholder="12-digit aadhaar"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={12}
                  className={`rp-input${errCls("aadhaar", "rp-input")}`}
                />
                <p className="rp-hint">Optional. 12 digits if provided.</p>
                <FieldError message={fieldError("aadhaar") ? errors.aadhaar : null} />
              </div>
            </div>
          </div>
        </div>

        {/* FAMILY LINKING (CONDITIONAL) */}
        {formData.familyHeadId && (
          <div className="rp-card rp-card--family">
            <div className="rp-card-head">
              <LuUserPlus size={16} />
              <span>Family Linking</span>
            </div>
            <div className="rp-grid rp-grid--2">
              <div>
                <label className="rp-label">Family Head ID (Hidden)</label>
                <input
                  type="text"
                  name="familyHeadId"
                  value={formData.familyHeadId}
                  disabled
                  className="rp-input"
                />
              </div>
              <div>
                <label className="rp-label">
                  Relationship to Family Head <span className="rp-req">*</span>
                </label>
                <select
                  name="relationToHead"
                  value={formData.relationToHead}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`rp-select${errCls("relationToHead", "rp-select")}`}
                >
                  <option value="">Select relationship</option>
                  {["Spouse", "Parent", "Child", "Sibling", "Dependent", "Other"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <FieldError message={fieldError("relationToHead") ? errors.relationToHead : null} />
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTACT INFORMATION */}
        <div className="rp-card">
          <div className="rp-card-head">
            <LuPhone size={18} />
            <span>Contact Information</span>
          </div>

          <div className="rp-rows">
            {/* Row 1: Mobile Number, Alternate Mobile */}
            <div className="rp-grid rp-grid--2">
              <div>
                <label className="rp-label">
                  Mobile Number <span className="rp-req">*</span>
                </label>
                <div className={`rp-phone${errCls("mobile", "rp-phone")}`}>
                  <span className="rp-phone-prefix">+91</span>
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
                    className="rp-phone-input"
                  />
                </div>
                <p className="rp-hint">Valid 10-digit Indian mobile number.</p>
                <FieldError message={fieldError("mobile") ? errors.mobile : null} />
              </div>

              <div>
                <label className="rp-label">Alternate Mobile</label>
                <div className={`rp-phone${errCls("altMobile", "rp-phone")}`}>
                  <span className="rp-phone-prefix">+91</span>
                  <input
                    type="tel"
                    name="altMobile"
                    placeholder="Optional second number"
                    value={formData.altMobile}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    inputMode="tel"
                    maxLength={10}
                    className="rp-phone-input"
                  />
                </div>
                <p className="rp-hint">Optional alternate contact number.</p>
                <FieldError message={fieldError("altMobile") ? errors.altMobile : null} />
              </div>
            </div>

            {/* Row 2: Email Address, Country */}
            <div className="rp-grid rp-grid--2">
              <div>
                <label className="rp-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`rp-input${errCls("email", "rp-input")}`}
                />
                <p className="rp-hint">Optional email for appointment reminders.</p>
                <FieldError message={fieldError("email") ? errors.email : null} />
              </div>

              <div>
                <label className="rp-label">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="rp-select"
                >
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ADDRESS INFORMATION */}
        <div className="rp-card">
          <div className="rp-card-head">
            <LuGlobe size={18} />
            <span>Address Information</span>
          </div>

          <div className="rp-rows">
            {/* Row 1: Address (span 2), State, City */}
            <div className="rp-grid rp-grid--4">
              <div className="rp-span-2">
                <label className="rp-label">
                  Address <span className="rp-req">*</span>
                </label>
                <input
                  type="text"
                  name="address1"
                  placeholder="Street / House / Locality"
                  value={formData.address1}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`rp-input${errCls("address1", "rp-input")}`}
                />
                <p className="rp-hint">Street, house number, locality.</p>
                <FieldError message={fieldError("address1") ? errors.address1 : null} />
              </div>

              <div>
                <label className="rp-label">
                  State <span className="rp-req">*</span>
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`rp-select${errCls("state", "rp-select")}`}
                >
                  <option value="">Select an option</option>
                  {["Uttar Pradesh", "Delhi", "Maharashtra", "Karnataka", "Rajasthan", "Madhya Pradesh",
                    "Gujarat", "Tamil Nadu", "West Bengal", "Bihar"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <FieldError message={fieldError("state") ? errors.state : null} />
              </div>

              <div>
                <label className="rp-label">
                  City <span className="rp-req">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`rp-input${errCls("city", "rp-input")}`}
                />
                <FieldError message={fieldError("city") ? errors.city : null} />
              </div>
            </div>

            {/* Row 2: Pincode */}
            <div className="rp-grid rp-grid--4">
              <div>
                <label className="rp-label">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="6-digit pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  inputMode="numeric"
                  maxLength={6}
                  className={`rp-input${errCls("pincode", "rp-input")}`}
                />
                <p className="rp-hint">Optional 6-digit pincode.</p>
                <FieldError message={fieldError("pincode") ? errors.pincode : null} />
              </div>
            </div>
          </div>
        </div>

        {/* 4. ADDITIONAL INFORMATION */}
        <div className="rp-card">
          <div className="rp-card-head">
            <LuFileText size={18} />
            <span>Additional Information</span>
          </div>

          <div className="rp-rows">
            {/* Row 1: Emergency Contact Name, Emergency Contact Number, Relationship with Patient */}
            <div className="rp-grid rp-grid--3">
              <div>
                <label className="rp-label">
                  Emergency Contact Name <span className="rp-req">*</span>
                </label>
                <input
                  type="text"
                  name="emgName"
                  placeholder="Emergency contact name"
                  value={formData.emgName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`rp-input${errCls("emgName", "rp-input")}`}
                />
                <FieldError message={fieldError("emgName") ? errors.emgName : null} />
              </div>

              <div>
                <label className="rp-label">
                  Emergency Contact Number <span className="rp-req">*</span>
                </label>
                <div className={`rp-phone${errCls("emgNumber", "rp-phone")}`}>
                  <span className="rp-phone-prefix">+91</span>
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
                    className="rp-phone-input"
                  />
                </div>
                <FieldError message={fieldError("emgNumber") ? errors.emgNumber : null} />
              </div>

              <div>
                <label className="rp-label">
                  Relationship with Patient <span className="rp-req">*</span>
                </label>
                <select
                  name="emgRelation"
                  value={formData.emgRelation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`rp-select${errCls("emgRelation", "rp-select")}`}
                >
                  <option value="">Select an option</option>
                  {["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <FieldError message={fieldError("emgRelation") ? errors.emgRelation : null} />
              </div>
            </div>

            {/* Row 2: Referred By, Department, Visit Type */}
            <div className="rp-grid rp-grid--3">
              <div>
                <label className="rp-label">Referred By</label>
                <select
                  name="referredBy"
                  value={formData.referredBy}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="rp-select"
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
                <label className="rp-label">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="rp-select"
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
                <label className="rp-label">Visit Type</label>
                <div className="rp-radios">
                  {[
                    { val: "OPD", label: "OPD (Outpatient)", icon: "🏥" },
                    { val: "IPD", label: "IPD (Inpatient)", icon: "🛏️" }
                  ].map((vt) => (
                    <label key={vt.val} className={`rp-radio${formData.visitType === vt.val ? " rp-radio--on" : ""}`}>
                      <input
                        type="radio"
                        name="visitType"
                        value={vt.val}
                        checked={formData.visitType === vt.val}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      <span>
                        <span style={{ marginRight: 4 }}>{vt.icon}</span> {vt.label}
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
      <div className="rp-footer">
        {/* Reset on Left */}
        <button type="button" onClick={handleReset} className="rp-btn rp-btn--ghost">
          <LuRotateCcw size={15} />
          <span>Reset</span>
        </button>

        {/* Action Buttons on Right */}
        <div className="rp-actions">
          <button
            type="button"
            onClick={() => handleRegisterAndNavigate("/opd/registration")}
            className="rp-btn rp-btn--green"
          >
            <LuStethoscope size={16} />
            <span>Save & Process to OPD</span>
          </button>

          <button
            type="button"
            onClick={() => handleRegisterAndNavigate("/ipd/admission")}
            className="rp-btn rp-btn--red"
          >
            <LuBed size={16} />
            <span>Save & Process to IPD</span>
          </button>

          <button
            type="button"
            onClick={() => handleRegisterAndNavigate(null)}
            className="rp-btn rp-btn--navy"
          >
            <LuUserPlus size={16} />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

    </div>
  );
}