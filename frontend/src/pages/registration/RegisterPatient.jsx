import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuUserPlus, LuUser, LuPhone, LuFileText,
  LuCircleCheck, LuSearch, LuX, LuStethoscope,
  LuBed, LuRotateCcw, LuGlobe, LuCircleX
} from "react-icons/lu";
import patientService from "../../api/services/patientService";
import doctorService from "../../services/doctorService";
import {
  required, phone, email, pincode, aadhaar, age as ageValidator,
  validateField,
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
  doctor: "",
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

// ─── Component ───────────────────────────────────────────────────────────────
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
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    doctorService
      .getDoctors()
      .then((docs) => setAvailableDoctors(docs || []))
      .catch((err) => console.error("Failed to load doctors:", err));
  }, []);

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
    if (!p) return;
    const fullName = p.full_name || p.name || `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim();
    const addrParts = (p.address || p.address_line1 || "").split(",");
    setFormData((prev) => ({
      ...prev,
      firstName: fullName,
      middleName: p.middle_name || p.middleName || "",
      lastName: p.last_name || p.lastName || "",
      gender: p.gender || prev.gender || "",
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
      doctor: p.doctor || prev.doctor || "",
      department: p.department || prev.department || "",
      visitType: p.visitType || prev.visitType || "OPD",
    }));
    setSearchQuery(`${fullName || "Patient"} — ${p.mobile1 || p.phone || p.mobile || "—"} (${p.uhid || ""})`);
    setShowDropdown(false);
    showToast(`✅ Patient loaded: ${fullName || "Patient"} (${p.uhid || ""})`);
  };

  const handleAddFamilyMember = (relation) => {
    const p = selectedPatientForFamily;
    if (!p) return;
    const fullName = p.full_name || p.name || `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim();
    const addrParts = (p.address || p.address_line1 || "").split(",");

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
      emgName: fullName,
      emgNumber: p.phone || p.mobile1 || p.mobile || "",
      emgRelation: "Other",
      familyHeadId: p.family_head_id || p.id,
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

  // Only validate format if value is present; only firstName (Patient Full Name) is mandatory
  const validateFieldOnChange = (name, value) => {
    let result = { isValid: true, message: null };
    const val = String(value || "").trim();
    switch (name) {
      case "firstName":
        result = validateField(value, [required]);
        break;
      case "age":
        if (val) result = validateField(value, [ageValidator]);
        break;
      case "mobile":
        if (val) result = validateField(value, [phone]);
        break;
      case "altMobile":
        if (val) result = validateField(value, [phone]);
        break;
      case "emgNumber":
        if (val) result = validateField(value, [phone]);
        break;
      case "pincode":
        if (val) result = validateField(value, [pincode]);
        break;
      case "email":
        if (val) result = validateField(value, [email]);
        break;
      case "aadhaar":
        if (val) result = validateField(value, [aadhaar]);
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
    const rawName = (formData.firstName || "").trim();
    const nameParts = rawName.split(/\s+/);
    const fName = nameParts[0] || rawName;
    const lName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : (formData.lastName?.trim() || undefined);

    return {
      facility_id: "00000000-0000-0000-0000-000000000000",

      // Basic Info
      first_name: fName,
      middle_name: formData.middleName?.trim() || undefined,
      last_name: lName,
      gender: normalizeGender(formData.gender),
      date_of_birth: formData.dob || undefined,
      age: formData.age || undefined,
      blood_group: formData.bloodGroup || undefined,
      marital_status: formData.maritalStatus || undefined,
      occupation: formData.occupation || undefined,
      nationality: normalizeCountryCode(formData.nationality, "IN"),

      // Contact Info
      phone: formData.mobile?.trim() || "",
      alternate_phone: formData.altMobile?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      landline: formData.landline?.trim() || undefined,

      // Address
      address_line1: `${formData.address1 || ""}${formData.address2 ? ", " + formData.address2 : ""}`.trim() || undefined,
      city: formData.city?.trim() || undefined,
      state: formData.state?.trim() || undefined,
      postal_code: formData.pincode?.trim() || undefined,
      country: normalizeCountryCode(formData.country, "IN"),

      // Identifiers
      aadhaar_number: formData.aadhaar?.trim() || undefined,
      pan_number: formData.pan?.trim() || undefined,

      // Emergency Contact
      emergency_name: formData.emgName?.trim() || undefined,
      emergency_phone: formData.emgNumber?.trim() || undefined,
      emergency_relation: formData.emgRelation?.trim() || undefined,

      // Visit / OPD / Doctor Details
      doctor: formData.doctor || undefined,
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

  // ── Final submission guard (ONLY Patient Full Name is mandatory) ────────────
  const validate = () => {
    setFieldTouched("firstName");

    if (!formData.firstName || !formData.firstName.trim()) {
      setErrors((p) => ({ ...p, firstName: "Patient Full Name is required." }));
      showToast("⚠️ Patient Full Name is required.", "error");
      return false;
    }

    // Optional format checks if non-empty
    if (formData.mobile && formData.mobile.trim() && !/^\d{10}$/.test(formData.mobile.trim())) {
      setErrors((p) => ({ ...p, mobile: "Mobile must be 10 digits." }));
      setFieldTouched("mobile");
      showToast("⚠️ Mobile must be 10 digits.", "error");
      return false;
    }

    if (formData.altMobile && formData.altMobile.trim() && !/^\d{10}$/.test(formData.altMobile.trim())) {
      setErrors((p) => ({ ...p, altMobile: "Alternate mobile must be 10 digits." }));
      setFieldTouched("altMobile");
      showToast("⚠️ Alternate mobile must be 10 digits.", "error");
      return false;
    }

    if (formData.emgNumber && formData.emgNumber.trim() && !/^\d{10}$/.test(formData.emgNumber.trim())) {
      setErrors((p) => ({ ...p, emgNumber: "Emergency number must be 10 digits." }));
      setFieldTouched("emgNumber");
      showToast("⚠️ Emergency contact number must be 10 digits.", "error");
      return false;
    }

    if (formData.aadhaar && formData.aadhaar.trim() && !/^\d{12}$/.test(formData.aadhaar.trim())) {
      setErrors((p) => ({ ...p, aadhaar: "Aadhaar must be 12 digits." }));
      setFieldTouched("aadhaar");
      showToast("⚠️ Aadhaar must be 12 digits.", "error");
      return false;
    }

    if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setErrors((p) => ({ ...p, email: "Invalid email format." }));
      setFieldTouched("email");
      showToast("⚠️ Invalid email format.", "error");
      return false;
    }

    return true;
  };

  // ── Register & Navigate ───────────────────────────────────────────
  const handleRegisterAndNavigate = async (path) => {
    if (!validate()) return;
    try {
      const payload = buildPatientRecord();
      const patient = await patientService.create(payload);
      showToast(`🎉 Patient Registered! UHID: ${patient.uhid}`);
      if (path) {
        const doctorParam = formData.doctor ? `&doctor=${encodeURIComponent(formData.doctor)}` : "";
        navigate(`${path}?uhid=${patient.uhid}${doctorParam}`);
      }
      handleReset();
    } catch (err) {
      showToast("Error registering patient: " + err.message, "error");
    }
  };

  const fieldError = (name) => (touched[name] ? errors[name] : null);
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

      {/* ── PAGE HEADER ── */}
      <div className="dash-header-card">
        <div className="dash-header-icon-box">
          <LuUserPlus size={22} />
        </div>
        <div className="dash-header-title-box">
          <h1>Patient Registration</h1>
          <p>Register a new patient into the system (OPD & IPD)</p>
        </div>
        <div className="rp-crumbs">
          <span className="rp-crumb-link" onClick={() => navigate("/dashboard")}>Dashboard</span>
          <span>/</span>
          <span className="rp-crumb-link">Registration</span>
          <span>/</span>
          <span className="rp-crumb-active">Register Patient</span>
        </div>
      </div>

      {/* ── TOP SEARCH & QUICK LOAD BAR (Higher z-index to always float above cards) ── */}
      <div ref={searchRef} className="rp-search-panel">
        <div className="dash-section-bar">
          <LuSearch size={15} />
          <span>Search & Quick Load Registered Patient</span>
        </div>

        <div className="rp-search-row">
          <div className="rp-search-input-wrap">
            <LuSearch size={16} className="rp-search-icon" />
            <input
              type="text"
              className="rp-search-input"
              placeholder="Search by Name, UHID or Mobile..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            />
            {searchQuery && (
              <button type="button" onClick={clearSearch} className="rp-search-clear" title="Clear search">
                <LuX size={15} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (searchQuery.trim().length >= 1) setShowDropdown(true);
            }}
            className="rp-btn-search"
          >
            <LuSearch size={15} />
            <span>Search</span>
          </button>
        </div>

        {/* Dropdown results (Always floating in front) */}
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

      {/* ── MAIN FORM ── */}
      <div className="rp-form">

        {/* FAMILY LINKING (CONDITIONAL) */}
        {formData.familyHeadId && (
          <div className="rp-card rp-card--family">
            <div className="dash-section-bar">
              <LuUserPlus size={15} />
              <span>Family Linking</span>
            </div>
            <div className="rp-grid rp-grid--2">
              <div>
                <label className="rp-label">Family Head ID (Linked)</label>
                <input
                  type="text"
                  name="familyHeadId"
                  value={formData.familyHeadId}
                  disabled
                  className="rp-input"
                />
              </div>
              <div>
                <label className="rp-label">Relationship to Family Head</label>
                <select
                  name="relationToHead"
                  value={formData.relationToHead}
                  onChange={handleChange}
                  onBlur={handleBlur}
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

        {/* ── UNIFIED PATIENT REGISTRATION FORM (ONE CARD, HEADING-WISE DIFFERENTIATED) ── */}
        <div className="rp-card rp-unified-card">

          {/* 1. PERSONAL INFORMATION */}
          <div className="rp-form-section">
            <div className="dash-section-bar">
              <LuUser size={15} />
              <span>Personal Information</span>
            </div>

            <div className="rp-grid rp-grid--personal-unified">
              <div>
                <label className="rp-label">
                  Patient Full Name <span className="rp-req">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter patient full name"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`rp-input${errCls("firstName", "rp-input")}`}
                />
                <FieldError message={fieldError("firstName") ? errors.firstName : null} />
              </div>

              <div>
                <label className="rp-label">Gender</label>
                <div className="rp-radios">
                  {["Male", "Female", "Other"].map((g) => (
                    <label key={g} className={`rp-radio${formData.gender === g ? " rp-radio--on" : ""}`}>
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
              </div>

              <div>
                <label className="rp-label">Age</label>
                <div className="rp-input-unit">
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    inputMode="numeric"
                    className={`rp-input${errCls("age", "rp-input")}`}
                  />
                  <span className="rp-unit">Yrs</span>
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
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
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
                <FieldError message={fieldError("aadhaar") ? errors.aadhaar : null} />
              </div>
            </div>
          </div>

          {/* 2. CONTACT INFORMATION */}
          <div className="rp-form-section">
            <div className="dash-section-bar">
              <LuPhone size={15} />
              <span>Contact Information</span>
            </div>

            <div className="rp-grid rp-grid--contact-unified">
              <div>
                <label className="rp-label">Mobile Number</label>
                <div className={`rp-phone${errCls("mobile", "rp-phone")}`}>
                  <span className="rp-phone-prefix">+91</span>
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="10-digit mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    inputMode="tel"
                    maxLength={10}
                    className="rp-phone-input"
                  />
                </div>
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
                <FieldError message={fieldError("altMobile") ? errors.altMobile : null} />
              </div>

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

          {/* 3. ADDRESS INFORMATION */}
          <div className="rp-form-section">
            <div className="dash-section-bar">
              <LuGlobe size={15} />
              <span>Address Information</span>
            </div>

            <div className="rp-grid rp-grid--address-unified">
              <div>
                <label className="rp-label">Address</label>
                <input
                  type="text"
                  name="address1"
                  placeholder="Street / House / Locality"
                  value={formData.address1}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`rp-input${errCls("address1", "rp-input")}`}
                />
                <FieldError message={fieldError("address1") ? errors.address1 : null} />
              </div>

              <div>
                <label className="rp-label">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`rp-input${errCls("city", "rp-input")}`}
                />
                <FieldError message={fieldError("city") ? errors.city : null} />
              </div>

              <div>
                <label className="rp-label">State</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`rp-select${errCls("state", "rp-select")}`}
                >
                  <option value="">Select state</option>
                  {["Uttar Pradesh", "Delhi", "Maharashtra", "Karnataka", "Rajasthan", "Madhya Pradesh",
                    "Gujarat", "Tamil Nadu", "West Bengal", "Bihar"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <FieldError message={fieldError("state") ? errors.state : null} />
              </div>

              <div>
                <label className="rp-label">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  inputMode="numeric"
                  maxLength={6}
                  className={`rp-input${errCls("pincode", "rp-input")}`}
                />
                <FieldError message={fieldError("pincode") ? errors.pincode : null} />
              </div>
            </div>
          </div>

          {/* 4. ADDITIONAL INFORMATION & VISIT DETAILS */}
          <div className="rp-form-section">
            <div className="dash-section-bar">
              <LuFileText size={15} />
              <span>Additional Information & Visit Details</span>
            </div>

            {/* Row 1: Emergency Contact Details */}
            <div className="rp-grid rp-grid--emg-unified">
              <div>
                <label className="rp-label">Emergency Contact Name</label>
                <input
                  type="text"
                  name="emgName"
                  placeholder="Contact person name"
                  value={formData.emgName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`rp-input${errCls("emgName", "rp-input")}`}
                />
                <FieldError message={fieldError("emgName") ? errors.emgName : null} />
              </div>

              <div>
                <label className="rp-label">Emergency Contact Number</label>
                <div className={`rp-phone${errCls("emgNumber", "rp-phone")}`}>
                  <span className="rp-phone-prefix">+91</span>
                  <input
                    type="tel"
                    name="emgNumber"
                    placeholder="Contact number"
                    value={formData.emgNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    inputMode="tel"
                    maxLength={10}
                    className="rp-phone-input"
                  />
                </div>
                <FieldError message={fieldError("emgNumber") ? errors.emgNumber : null} />
              </div>

              <div>
                <label className="rp-label">Relationship with Patient</label>
                <select
                  name="emgRelation"
                  value={formData.emgRelation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`rp-select${errCls("emgRelation", "rp-select")}`}
                >
                  <option value="">Select relationship</option>
                  {["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <FieldError message={fieldError("emgRelation") ? errors.emgRelation : null} />
              </div>
            </div>

            {/* Row 2: Consultation & Visit Details */}
            <div className="rp-grid rp-grid--consult-unified">
              <div>
                <label className="rp-label">Doctor to Consult</label>
                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="rp-select"
                >
                  <option value="">Select Doctor</option>
                  {availableDoctors.map((doc) => (
                    <option key={doc.id || doc.name} value={doc.name}>
                      {doc.name} {doc.qualification ? `(${doc.qualification})` : ""} · {doc.specialization}
                    </option>
                  ))}
                </select>
              </div>

             

             

              <div>
                <label className="rp-label">Visit Type</label>
                <div className="rp-radios">
                  {[
                    { val: "OPD", label: "OPD", icon: "🏥" },
                    { val: "IPD", label: "IPD", icon: "🛏️" }
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
        {/* Left Actions: Cancel & Reset */}
        <div className="rp-footer-left">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rp-btn rp-btn--cancel"
          >
            <LuCircleX size={16} />
            <span>Cancel</span>
          </button>

         
        </div>

        {/* Right Action Buttons */}
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
            className="rp-btn rp-btn--ipd"
          >
            <LuBed size={16} />
            <span>Save & Process to IPD</span>
          </button>

          <button
            type="button"
            onClick={() => handleRegisterAndNavigate(null)}
            className="rp-btn rp-btn--gold"
          >
            <LuUserPlus size={16} />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

    </div>
  );
}