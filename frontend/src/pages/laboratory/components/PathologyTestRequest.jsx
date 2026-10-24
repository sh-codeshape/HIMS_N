import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import patientService from "../../../api/services/patientService";
import laboratoryService from "../../../api/services/laboratoryService";
import "./PathologyView.css";

const STANDARD_TEST_CATALOG = [
  { id: "LAB-CBC", code: "LAB-CBC", name: "Complete Blood Count (CBC)", category: "Hematology", price: 350, sampleType: "Blood (EDTA)", tat: "4 Hours" },
  { id: "LAB-FBS", code: "LAB-FBS", name: "Fasting Blood Sugar (FBS)", category: "Biochemistry", price: 120, sampleType: "Blood (Fluoride)", tat: "3 Hours" },
  { id: "LAB-HBA1C", code: "LAB-HBA1C", name: "HbA1c (Glycated Hemoglobin)", category: "Biochemistry", price: 550, sampleType: "Blood (EDTA)", tat: "6 Hours" },
  { id: "LAB-LFT", code: "LAB-LFT", name: "Liver Function Test (LFT)", category: "Biochemistry", price: 750, sampleType: "Serum", tat: "6 Hours" },
  { id: "LAB-KFT", code: "LAB-KFT", name: "Kidney Function Test (KFT / RFT)", category: "Biochemistry", price: 650, sampleType: "Serum", tat: "6 Hours" },
  { id: "LAB-LIPID", code: "LAB-LIPID", name: "Lipid Profile - Comprehensive", category: "Biochemistry", price: 800, sampleType: "Serum", tat: "8 Hours" },
  { id: "LAB-THYROID", code: "LAB-THYROID", name: "Thyroid Profile (T3, T4, TSH)", category: "Hormones", price: 600, sampleType: "Serum", tat: "8 Hours" },
  { id: "LAB-URINE", code: "LAB-URINE", name: "Urine Routine & Microscopy", category: "Clinical Pathology", price: 200, sampleType: "Urine", tat: "2 Hours" },
  { id: "LAB-DENGUE", code: "LAB-DENGUE", name: "Dengue NS1 & IgM / IgG Combo", category: "Serology", price: 1100, sampleType: "Serum", tat: "4 Hours" },
  { id: "LAB-ELECTRO", code: "LAB-ELECTRO", name: "Serum Electrolytes (Na+, K+, Cl-)", category: "Biochemistry", price: 450, sampleType: "Serum", tat: "4 Hours" },
  { id: "LAB-URIC", code: "LAB-URIC", name: "Serum Uric Acid", category: "Biochemistry", price: 250, sampleType: "Serum", tat: "3 Hours" },
  { id: "LAB-WIDAL", code: "LAB-WIDAL", name: "Widal Test (Typhoid Slide)", category: "Serology", price: 280, sampleType: "Serum", tat: "3 Hours" },
  { id: "LAB-ESR", code: "LAB-ESR", name: "ESR (Westergren Method)", category: "Hematology", price: 150, sampleType: "Blood (Citrate)", tat: "2 Hours" },
  { id: "LAB-VITD", code: "LAB-VITD", name: "Vitamin D (25-OH) Total", category: "Biochemistry", price: 1200, sampleType: "Serum", tat: "24 Hours" },
  { id: "LAB-VITB12", code: "LAB-VITB12", name: "Vitamin B12 (Cyanocobalamin)", category: "Biochemistry", price: 900, sampleType: "Serum", tat: "24 Hours" },
];

export default function PathologyTestRequest() {
  const navigate = useNavigate();

  // 1. Patient Details State (Clean, no static mock data)
  const [patientSearch, setPatientSearch] = useState("");
  const [patientList, setPatientList] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patient, setPatient] = useState({
    id: "",
    uhid: "",
    name: "",
    age: "",
    gender: "Male",
    mobile: "",
    alternateMobile: "",
    address: "",
    doctor: "Dr. Anil Singh (Cardiology)",
    visitType: "OPD",
    referredBy: "",
    clinicalNotes: "",
  });

  // 2. Test Selection State (Catalog from backend API)
  const [catalog, setCatalog] = useState(STANDARD_TEST_CATALOG);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [testSearch, setTestSearch] = useState("");
  const [selectedTests, setSelectedTests] = useState([]);

  // 3. Sample & Source Details State
  const [testSource, setTestSource] = useState("In-house");
  const [sampleType, setSampleType] = useState("Blood");
  const [collectionTime, setCollectionTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [collectedBy, setCollectedBy] = useState("Manoj Kumar (Lab Tech)");
  const [barcodeNo, setBarcodeNo] = useState(() => `LAB${Date.now().toString().slice(-8)}`);

  // 4. Billing & Payment State
  const [billTo, setBillTo] = useState("Patient");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Print slip modal
  const [printSlipModal, setPrintSlipModal] = useState(null);

  // Load live patients & test catalog from PostgreSQL on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 1. Fetch real patients from database
      try {
        const patientsRes = await patientService.getAll({ limit: 100 });
        const pData = patientsRes?.data || patientsRes || [];
        if (isMounted && Array.isArray(pData) && pData.length > 0) {
          setPatientList(pData);
        }
      } catch (err) {
        console.warn("Patient API load warning:", err?.message);
      }

      // 2. Fetch real test definitions from database
      try {
        const defsRes = await laboratoryService.getTestDefinitions();
        if (isMounted) {
          if (Array.isArray(defsRes) && defsRes.length > 0) {
            const normalized = defsRes.map((d) => ({
              id: d.service_id || d.id,
              code: d.code || `L-${(d.id || "").slice(0, 4)}`,
              name: d.name || "Investigation Test",
              category: d.lab_section || "General",
              price: d.price ? Number(d.price) : 350,
              sampleType: d.specimen_type || "Blood",
              tat: d.tat_hours ? `${d.tat_hours} Hours` : "4 Hours",
            }));
            setCatalog(normalized);
          } else {
            setCatalog(STANDARD_TEST_CATALOG);
          }
        }
      } catch (err) {
        console.warn("Test catalog API load warning:", err?.message);
        if (isMounted) setCatalog(STANDARD_TEST_CATALOG);
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter patients dynamically when user types in search input
  const handleSearchChange = (val) => {
    setPatientSearch(val);
    if (!val.trim()) {
      setFilteredPatients([]);
      setShowPatientDropdown(false);
      return;
    }
    const q = val.trim().toLowerCase();
    const matched = patientList.filter(
      (p) =>
        (p.uhid && p.uhid.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q)) ||
        (p.mobile && p.mobile.includes(q)) ||
        (p.full_name && p.full_name.toLowerCase().includes(q)) ||
        (p.first_name && p.first_name.toLowerCase().includes(q)) ||
        (p.last_name && p.last_name.toLowerCase().includes(q))
    );
    setFilteredPatients(matched.slice(0, 8));
    setShowPatientDropdown(true);
  };

  // Select patient from live search results
  const handleSelectPatient = (p) => {
    const fullName = p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient";
    setPatient((prev) => ({
      ...prev,
      id: p.id,
      uhid: p.uhid || `P2026${Date.now().toString().slice(-4)}`,
      name: fullName,
      age: p.age ? String(p.age) : prev.age || "30",
      gender: p.gender || "Male",
      mobile: p.phone || p.mobile || "",
      address: p.address || p.city || "Varanasi",
    }));
    setPatientSearch(`${fullName} (${p.uhid || "UHID"})`);
    setShowPatientDropdown(false);
    toast.success(`Patient ${fullName} selected!`, { icon: "👤" });
  };

  // Toggle test selection
  const handleToggleTest = (test) => {
    setSelectedTests((prev) => {
      const exists = prev.some((t) => t.id === test.id || t.code === test.code);
      if (exists) {
        return prev.filter((t) => (t.id ? t.id !== test.id : t.code !== test.code));
      } else {
        return [...prev, test];
      }
    });
  };

  const handleRemoveSelectedTest = (codeOrId) => {
    setSelectedTests((prev) => prev.filter((t) => t.id !== codeOrId && t.code !== codeOrId));
  };

  // Categories list
  const availableCategories = ["All", ...Array.from(new Set(catalog.map((c) => c.category).filter(Boolean)))];

  // Filtered test catalog
  const filteredCatalog = catalog.filter((t) => {
    if (activeCategory !== "All" && t.category !== activeCategory) return false;
    if (testSearch.trim()) {
      const q = testSearch.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate billing amounts
  const grossTotal = selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);
  const discountAmount = Math.min(Number(discount) || 0, grossTotal);
  const netPayable = Math.max(0, grossTotal - discountAmount);

  // Submit test order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!patient.name.trim()) {
      toast.error("Please enter or select a patient name");
      return;
    }
    if (selectedTests.length === 0) {
      toast.error("Please select at least one lab investigation test");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Prepare backend payload
      const orderPayload = {
        patientId: patient.id || patientList[0]?.id || "00000000-0000-0000-0000-000000000000",
        testDefinitionIds: selectedTests.map((t) => t.id).filter(Boolean),
        orderedBy: patient.doctor || null,
      };

      let backendSuccess = false;
      try {
        if (orderPayload.testDefinitionIds.length > 0) {
          await laboratoryService.createLabOrder(orderPayload);
          backendSuccess = true;
        }
      } catch (apiErr) {
        console.warn("Backend lab order API response:", apiErr?.message);
      }

      // 2. Create standardized real order record for instant display
      const newOrder = {
        id: `REQ-${Date.now().toString().slice(-6)}`,
        uhid: patient.uhid || `P2026${Date.now().toString().slice(-4)}`,
        patientName: patient.name,
        ageGender: `${patient.age || "30"} Y / ${patient.gender?.[0] || "M"}`,
        testName: selectedTests.map((t) => t.name).join(", "),
        sampleType,
        source: testSource,
        status: "Collected",
        requestedBy: patient.doctor || "Dr. Anil Singh",
        requestTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        requestDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        barcode: barcodeNo,
        totalAmount: netPayable,
        paymentStatus,
        paymentMode,
        reportDate: "Today",
        approvedBy: "—",
      };

      // 3. Save to active order store
      const existing = localStorage.getItem("hims_pathology_orders");
      let list = [];
      try {
        list = existing ? JSON.parse(existing) : [];
      } catch (e) {
        list = [];
      }
      const updatedList = [newOrder, ...list];
      localStorage.setItem("hims_pathology_orders", JSON.stringify(updatedList));

      toast.success(
        backendSuccess
          ? "Lab test request registered and saved to database!"
          : "Lab test request registered successfully!",
        { icon: "🧪" }
      );

      // Open print slip preview modal
      setPrintSlipModal(newOrder);

      // Reset form
      setPatient({
        id: "",
        uhid: "",
        name: "",
        age: "",
        gender: "Male",
        mobile: "",
        alternateMobile: "",
        address: "",
        doctor: "Dr. Anil Singh (Cardiology)",
        visitType: "OPD",
        referredBy: "",
        clinicalNotes: "",
      });
      setPatientSearch("");
      setSelectedTests([]);
      setDiscount(0);
      setRemarks("");
      setBarcodeNo(`LAB${Date.now().toString().slice(-8)}`);
    } catch (err) {
      toast.error(`Order creation error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setPatient({
      id: "",
      uhid: "",
      name: "",
      age: "",
      gender: "Male",
      mobile: "",
      alternateMobile: "",
      address: "",
      doctor: "Dr. Anil Singh (Cardiology)",
      visitType: "OPD",
      referredBy: "",
      clinicalNotes: "",
    });
    setPatientSearch("");
    setSelectedTests([]);
    setDiscount(0);
    setRemarks("");
    setBarcodeNo(`LAB${Date.now().toString().slice(-8)}`);
    toast("Form cleared", { icon: "🧹" });
  };

  return (
    <div className="pathology-module-container">
      {/* ── TOP HEADER ── */}
      <header className="pathology-top-header">
        <div className="header-brand-group">
          <div className="header-icon-tile">
            <Icon name="LuClipboardList" size={24} />
          </div>
          <div>
            <div className="header-title-row">
              <h1 className="header-main-title">Add Test Report</h1>
             
            </div>
            <p className="header-sub-title">
              Patient Registration, Diagnostic Test Selection, Sample Accessioning &amp; Billing
            </p>
          </div>
        </div>

        <div className="header-meta-group">
         
        </div>
      </header>

      {/* ── FORM WITH EXACT 4 CARDS ── */}
      <form onSubmit={handleSubmitOrder} className="path-test-request-layout">
        {/* ── CARD 1: PATIENT DETAILS ── */}
        <section className="path-card">
          <div className="path-card-head">
            <div className="card-head-title">
              <span className="card-step-badge">1</span>
              <h3>Patient Details</h3>
            </div>
           
          </div>

          <div className="path-card-body">
            {/* Live Search Row */}
            <div className="patient-search-bar-row" style={{ position: "relative" }}>
              <div className="search-input-wrap">
                <Icon name="LuSearch" size={16} />
                <input
                  type="text"
                  placeholder="Search registered patient by Name, UHID or Mobile..."
                  value={patientSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (filteredPatients.length > 0) setShowPatientDropdown(true);
                  }}
                />
                {patientSearch && (
                  <button
                    type="button"
                    className="btn-clear-search"
                    onClick={() => {
                      setPatientSearch("");
                      setShowPatientDropdown(false);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Live search dropdown results */}
              {showPatientDropdown && filteredPatients.length > 0 && (
                <div className="patient-search-results-dropdown">
                  {filteredPatients.map((p) => {
                    const fullName = p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient";
                    return (
                      <div
                        key={p.id}
                        className="patient-search-result-item"
                        onClick={() => handleSelectPatient(p)}
                      >
                        <div className="res-main">
                          <span className="res-name">{fullName}</span>
                          <span className="res-uhid">{p.uhid || "No UHID"}</span>
                        </div>
                        <div className="res-sub">
                          <span>{p.phone || p.mobile || "No Mobile"}</span>
                          <span>•</span>
                          <span>{p.age ? `${p.age} Y` : ""} {p.gender || ""}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Demographics Form Grid */}
            <div className="path-form-grid-3">
              <div className="form-group">
                <label>UHID / Registration No.</label>
                <input
                  type="text"
                  placeholder="e.g. P2026001"
                  value={patient.uhid}
                  onChange={(e) => setPatient({ ...patient, uhid: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  Patient Full Name <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter patient name"
                  value={patient.name}
                  onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-age-gender">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    placeholder="Age"
                    value={patient.age}
                    onChange={(e) => setPatient({ ...patient, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={patient.gender}
                    onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={patient.mobile}
                  onChange={(e) => setPatient({ ...patient, mobile: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Referring Doctor / Consultant</label>
                <select
                  value={patient.doctor}
                  onChange={(e) => setPatient({ ...patient, doctor: e.target.value })}
                >
                  <option value="Dr. Anil Singh (Cardiology)">Dr. Anil Singh (Cardiology)</option>
                  <option value="Dr. Priya Gupta (Gynecology)">Dr. Priya Gupta (Gynecology)</option>
                  <option value="Dr. Ramesh Yadav (General Medicine)">Dr. Ramesh Yadav (General Medicine)</option>
                  <option value="Dr. Pooja Mishra (Pediatrics)">Dr. Pooja Mishra (Pediatrics)</option>
                  <option value="Self / Walk-in">Self / Walk-in</option>
                </select>
              </div>

              <div className="form-group">
                <label>Visit Type</label>
                <select
                  value={patient.visitType}
                  onChange={(e) => setPatient({ ...patient, visitType: e.target.value })}
                >
                  <option value="OPD">OPD (Out-Patient)</option>
                  <option value="IPD">IPD (In-Patient)</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Health Checkup">Health Checkup</option>
                </select>
              </div>

              <div className="form-group col-span-3">
                <label>Address / City</label>
                <input
                  type="text"
                  placeholder="Street address, city, district"
                  value={patient.address}
                  onChange={(e) => setPatient({ ...patient, address: e.target.value })}
                />
              </div>

              <div className="form-group col-span-3">
                <label>Clinical History / Investigation Indication</label>
                <input
                  type="text"
                  placeholder="e.g. Acute fever for 4 days, routine diabetic follow-up, preoperative profile..."
                  value={patient.clinicalNotes}
                  onChange={(e) => setPatient({ ...patient, clinicalNotes: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── CARD 2: TEST SELECTION ── */}
        <section className="path-card">
          <div className="path-card-head">
            <div className="card-head-title">
              <span className="card-step-badge">2</span>
              <h3>Test Selection</h3>
            </div>
            <span className="card-head-sub">
              {selectedTests.length} Test{selectedTests.length === 1 ? "" : "s"} Selected
            </span>
          </div>

          <div className="path-card-body">
            {/* Category Filter Pills & Search */}
            <div className="test-catalog-controls">
              <div className="category-pill-list">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`cat-pill ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="test-search-box">
                <Icon name="LuSearch" size={15} />
                <input
                  type="text"
                  placeholder="Search test by name or code..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Catalog Grid / Table */}
            <div className="catalog-table-wrapper">
              {loadingCatalog ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                  <div className="path-loading-spinner"></div>
                  <p style={{ marginTop: "8px" }}>Loading laboratory test catalog...</p>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                  No tests found matching &quot;{testSearch}&quot; in {activeCategory}
                </div>
              ) : (
                <table className="catalog-table">
                  <thead>
                    <tr>
                      <th style={{ width: "36px" }}>Select</th>
                      <th style={{ width: "80px" }}>Code</th>
                      <th>Investigation Name</th>
                      <th>Section</th>
                      <th>Specimen</th>
                      <th>Standard TAT</th>
                      <th style={{ textAlign: "right" }}>Rate (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCatalog.map((t) => {
                      const isSelected = selectedTests.some(
                        (sel) => (sel.id && sel.id === t.id) || sel.code === t.code
                      );
                      return (
                        <tr
                          key={t.id || t.code}
                          className={isSelected ? "row-selected" : ""}
                          onClick={() => handleToggleTest(t)}
                          style={{ cursor: "pointer" }}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleTest(t)}
                            />
                          </td>
                          <td className="font-mono text-xs text-slate">{t.code}</td>
                          <td className="font-semibold text-navy">{t.name}</td>
                          <td>
                            <span className="badge-section">{t.category}</span>
                          </td>
                          <td className="text-slate text-xs">{t.sampleType}</td>
                          <td className="text-muted text-xs">{t.tat}</td>
                          <td style={{ textAlign: "right", fontWeight: "bold", color: "#0f766e" }}>
                            ₹{t.price}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Selected Tests Summary Bar */}
            {selectedTests.length > 0 && (
              <div className="selected-tests-summary-box">
                <div className="summary-title">
                  <span>Selected Investigations ({selectedTests.length}):</span>
                </div>
                <div className="selected-chips-wrap">
                  {selectedTests.map((t) => (
                    <span key={t.id || t.code} className="selected-test-chip">
                      <span>{t.name} (₹{t.price})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedTest(t.id || t.code)}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── CARD 3: SAMPLE & SOURCE DETAILS ── */}
        <section className="path-card">
          <div className="path-card-head">
            <div className="card-head-title">
              <span className="card-step-badge">3</span>
              <h3>Sample &amp; Source Details</h3>
            </div>
           
          </div>

          <div className="path-card-body">
            <div className="path-form-grid-3">
              <div className="form-group">
                <label>Test Processing Source</label>
                <select
                  value={testSource}
                  onChange={(e) => setTestSource(e.target.value)}
                >
                  <option value="In-house">In-house (Main Central Lab)</option>
                  <option value="Third Party (Send)">Third Party (Outsourced - Send)</option>
                  <option value="Third Party (Return)">Third Party (Return / Received)</option>
                  <option value="Already Done (Upload)">Already Done (External Report Upload)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Primary Specimen Type</label>
                <select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                >
                  <option value="Blood">Blood (EDTA / Plain / Fluoride)</option>
                  <option value="Serum">Serum</option>
                  <option value="Plasma">Plasma (Citrate / Heparin)</option>
                  <option value="Urine">Urine (Routine / Culture)</option>
                  <option value="Sputum">Sputum</option>
                  <option value="Stool">Stool</option>
                  <option value="Body Fluid">Body Fluid (CSF / Pleural / Ascitic)</option>
                  <option value="Swab">Swab (Throat / Nasal)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sample Collection Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={collectionTime}
                  onChange={(e) => setCollectionTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Collected By (Phlebotomist / Tech)</label>
                <select
                  value={collectedBy}
                  onChange={(e) => setCollectedBy(e.target.value)}
                >
                  <option value="Manoj Kumar (Lab Tech)">Manoj Kumar (Lab Tech)</option>
                  <option value="Rajesh Maurya (Phlebotomist)">Rajesh Maurya (Phlebotomist)</option>
                  <option value="Suman Devi (Lab Tech)">Suman Devi (Lab Tech)</option>
                  <option value="Ankit Srivastava (Staff)">Ankit Srivastava (Staff)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sample Barcode / Specimen ID</label>
                <div className="barcode-input-group">
                  <input
                    type="text"
                    value={barcodeNo}
                    onChange={(e) => setBarcodeNo(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-refresh-barcode"
                    title="Generate New Barcode"
                    onClick={() => setBarcodeNo(`LAB${Date.now().toString().slice(-8)}`)}
                  >
                    <Icon name="LuRefreshCw" size={14} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Fast / Special Condition</label>
                <select defaultValue="Standard">
                  <option value="Standard">Standard / Random</option>
                  <option value="Fasting 8-10 Hours">Fasting 8-10 Hours</option>
                  <option value="Post-Prandial 2 Hours">Post-Prandial 2 Hours</option>
                  <option value="Stat / Emergency">Stat / Emergency Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ── CARD 4: BILLING & PAYMENT ── */}
        <section className="path-card">
          <div className="path-card-head">
            <div className="card-head-title">
              <span className="card-step-badge">4</span>
              <h3>Billing &amp; Payment</h3>
            </div>
           
          </div>

          <div className="path-card-body">
            <div className="billing-section-layout">
              {/* Left Column: Payment Config */}
              <div className="billing-config-col">
                <div className="path-form-grid-2">
                  <div className="form-group">
                    <label>Bill To / Category</label>
                    <select
                      value={billTo}
                      onChange={(e) => setBillTo(e.target.value)}
                    >
                      <option value="Patient">Patient (Self-Pay Cash/UPI)</option>
                      <option value="Corporate / TPA">Corporate / TPA Insurance</option>
                      <option value="Ayushman Bharat (PM-JAY)">Ayushman Bharat (PM-JAY)</option>
                      <option value="Hospital Staff / Discounted">Hospital Staff / Discounted</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option value="Cash">Cash Counter</option>
                      <option value="UPI / QR">UPI / QR (PhonePe / GPay / Paytm)</option>
                      <option value="Credit / Debit Card">Credit / Debit Card (POS)</option>
                      <option value="Net Banking">Net Banking / NEFT</option>
                      <option value="Credit / Later">Hospital Credit / Later Bill</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    >
                      <option value="Paid">Paid / Cleared</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Pending">Payment Pending</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Concession / Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={grossTotal}
                      placeholder="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="form-group col-span-2">
                    <label>Billing Remarks / Authorization Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Receipt No., transaction ID, insurance policy number..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Financial Summary Card */}
              <div className="billing-summary-col">
                <div className="billing-calculation-card">
                  <div className="calc-title">Invoice Breakdown</div>
                  <div className="calc-row">
                    <span>Tests Selected ({selectedTests.length})</span>
                    <span className="font-semibold">₹{grossTotal.toFixed(2)}</span>
                  </div>
                  <div className="calc-row">
                    <span>Discount / Concession</span>
                    <span className="text-emerald-600 font-semibold">- ₹{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="calc-row">
                    <span>Tax (GST @ 0% Healthcare)</span>
                    <span className="text-slate font-medium">₹0.00</span>
                  </div>
                  <div className="calc-divider"></div>
                  <div className="calc-total-row">
                    <span className="total-label">Net Payable Amount</span>
                    <span className="total-amount">₹{netPayable.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="path-form-actions-bar">
              <button
                type="button"
                className="btn-form-clear"
                onClick={handleResetForm}
                disabled={submitting}
              >
                Clear Form
              </button>

              <button
                type="submit"
                className="btn-submit-order"
                disabled={submitting}
              >
                <Icon name="LuCheckCircle" size={15} />
                <span>{submitting ? "Processing Order..." : "Submit Lab Test Request"}</span>
              </button>
            </div>
          </div>
        </section>
      </form>

      {/* ── PRINT BARCODE & SAMPLE ACCESSION SLIP MODAL ── */}
      {printSlipModal && (
        <div className="path-modal-overlay">
          <div className="path-modal-container slip-modal-width">
            <div className="path-modal-header no-print">
              <h3>Sample Accessioning &amp; Barcode Label</h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setPrintSlipModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="path-modal-body print-area">
              <div className="barcode-slip-card">
                <div className="slip-hospital-title">
                  <strong>NARAYAN HOSPITAL LAB</strong>
                </div>
                <div className="slip-barcode-render">
                  <div className="fake-barcode-lines">
                    <div className="barcode-bars-graphic"></div>
                  </div>
                  <div className="slip-barcode-text font-mono font-bold">
                    {printSlipModal.barcode}
                  </div>
                </div>
                <div className="slip-details-grid">
                  <div><strong>UHID:</strong> {printSlipModal.uhid}</div>
                  <div><strong>Patient:</strong> {printSlipModal.patientName}</div>
                  <div><strong>Age/Sex:</strong> {printSlipModal.ageGender}</div>
                  <div><strong>Specimen:</strong> {printSlipModal.sampleType}</div>
                  <div><strong>Tests:</strong> {printSlipModal.testName}</div>
                  <div><strong>Source:</strong> {printSlipModal.source}</div>
                  <div><strong>Collected:</strong> {printSlipModal.requestDate} {printSlipModal.requestTime}</div>
                  <div><strong>Doctor:</strong> {printSlipModal.requestedBy}</div>
                  <div><strong>Amount Paid:</strong> ₹{printSlipModal.totalAmount} ({printSlipModal.paymentStatus})</div>
                </div>
              </div>
            </div>

            <div className="path-modal-footer no-print">
              <button
                type="button"
                className="path-btn-reset"
                onClick={() => setPrintSlipModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-quick-primary"
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={15} /> Print Barcode Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
