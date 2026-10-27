import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import Icon from "../../components/common/Icon.jsx";
import patientService from "../../api/services/patientService";
import billingInvoicesService from "../../api/services/billingInvoicesService";
import "./OPDBilling.css";

// Comprehensive Catalog of OPD Services
const CATEGORY_SERVICES = {
  Consultation: [
    { name: "OPD Consultation Fee (General Physician)", rate: 500 },
    { name: "Specialist Senior Consultant Visit", rate: 800 },
    { name: "Emergency Casualty / Trauma Consultation", rate: 1000 },
    { name: "Follow-Up Consultation Review", rate: 300 },
    { name: "Pediatric Consultation", rate: 600 },
  ],
  "Lab Test": [
    { name: "CBC (Complete Blood Count)", rate: 300 },
    { name: "Blood Sugar (RBS / Fasting)", rate: 120 },
    { name: "Liver Function Test (LFT)", rate: 650 },
    { name: "Kidney Function Test (KFT)", rate: 700 },
    { name: "Lipid Profile Test", rate: 600 },
    { name: "Thyroid Profile (T3, T4, TSH)", rate: 550 },
    { name: "Urine Routine & Microscopic", rate: 200 },
  ],
  Radiology: [
    { name: "X-Ray Chest PA View", rate: 400 },
    { name: "Ultrasound Whole Abdomen & Pelvis", rate: 1200 },
    { name: "CT Scan Brain (Plain)", rate: 2500 },
    { name: "MRI Knee Joint / Spine", rate: 4500 },
    { name: "ECG (12 Lead Computerized)", rate: 350 },
  ],
  Procedure: [
    { name: "Wound Dressing & Antiseptic Cleaning", rate: 250 },
    { name: "Minor Stitching / Suture Removal", rate: 450 },
    { name: "Nebulization Session (Per Dose)", rate: 150 },
    { name: "IV Fluid Infusion / Cannulation", rate: 250 },
    { name: "Plaster / POP Slab Application", rate: 850 },
    { name: "Ryle's Tube / Catheterization", rate: 400 },
  ],
  Medicine: [
    { name: "Tab Paracetamol 650mg (Strip of 15)", rate: 35 },
    { name: "Cap Pantoprazole 40mg (Strip of 10)", rate: 140 },
    { name: "Tab Augmentin 625 Duo (Strip of 10)", rate: 210 },
    { name: "Tab Azithromycin 500mg (Strip of 5)", rate: 125 },
    { name: "ORS Sachet / Electral Powder", rate: 25 },
  ],
  Others: [
    { name: "Hospital OPD Registration Fee", rate: 100 },
    { name: "Emergency Ambulance Service (City)", rate: 1200 },
    { name: "Medical Certificate / Report Attestation", rate: 200 },
    { name: "Day Care Bed Charge (Up to 4 Hours)", rate: 800 },
  ],
};

// Common Quick Add Chips for 1-Click Addition
const QUICK_ADD_PRESETS = [
  { name: "OPD Consultation Fee (General Physician)", category: "Consultation", rate: 500 },
  { name: "Specialist Senior Consultant Visit", category: "Consultation", rate: 800 },
  { name: "CBC (Complete Blood Count)", category: "Lab Test", rate: 300 },
  { name: "Blood Sugar (RBS / Fasting)", category: "Lab Test", rate: 120 },
  { name: "ECG (12 Lead Computerized)", category: "Radiology", rate: 350 },
  { name: "X-Ray Chest PA View", category: "Radiology", rate: 400 },
  { name: "Wound Dressing & Antiseptic Cleaning", category: "Procedure", rate: 250 },
];

// Helper: Convert number to words in Indian Currency
function numberToIndianWords(num) {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  num = Math.floor(Number(num) || 0);
  if (num === 0) return "Zero Rupees Only";

  function convertGroup(n) {
    if (n < 20) return a[n];
    const tens = b[Math.floor(n / 10)];
    const units = a[n % 10];
    return tens + (units ? " " + units : "");
  }

  let str = "";
  if (Math.floor(num / 10000000) > 0) {
    str += convertGroup(Math.floor(num / 10000000)) + "Crore ";
    num %= 10000000;
  }
  if (Math.floor(num / 100000) > 0) {
    str += convertGroup(Math.floor(num / 100000)) + "Lakh ";
    num %= 100000;
  }
  if (Math.floor(num / 1000) > 0) {
    str += convertGroup(Math.floor(num / 1000)) + "Thousand ";
    num %= 1000;
  }
  if (Math.floor(num / 100) > 0) {
    str += convertGroup(Math.floor(num / 100)) + "Hundred ";
    num %= 100;
  }
  if (num > 0) {
    str += convertGroup(num);
  }
  return str.trim() + " Rupees Only";
}

export default function OPDBilling() {
  // Live Patient Search & Selection
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allRecentPatients, setAllRecentPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Service Selection Form
  const [activeCategory, setActiveCategory] = useState("Consultation");
  const [selectedServiceName, setSelectedServiceName] = useState("OPD Consultation Fee (General Physician)");
  const [rateInput, setRateInput] = useState(500);
  const [qtyInput, setQtyInput] = useState(1);
  const [discountInput, setDiscountInput] = useState(0);

  // Bill Items
  const [billItems, setBillItems] = useState([
    {
      id: 1,
      name: "OPD Consultation Fee (General Physician)",
      category: "Consultation",
      rate: 500,
      qty: 1,
      discount: 0,
      amount: 500,
    },
  ]);

  // Remarks & Payment
  const [remarks, setRemarks] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [receivedAmount, setReceivedAmount] = useState("500");
  const [showUpiQR, setShowUpiQR] = useState(false);

  // Options
  const [printBill, setPrintBill] = useState(true);

  // Invoice & Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [showRecentInvoicesModal, setShowRecentInvoicesModal] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // 1. Initial Load: Fetch real registered patients from backend
  useEffect(() => {
    patientService
      .getAll({ limit: 12 })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setAllRecentPatients(list);
        // Pre-select the latest patient if available and none selected
        if (list.length > 0 && !selectedPatient) {
          setSelectedPatient(list[0]);
          setSearchTerm(list[0].uhid || "");
        }
      })
      .catch((err) => {
        console.error("Failed to load initial patients for OPD billing:", err);
      });
  }, []);

  // 2. Search Autocomplete
  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchTerm(q);
    if (q.trim().length > 0) {
      setSearchLoading(true);
      try {
        const results = await patientService.search({ query: q.trim() });
        setSuggestions((Array.isArray(results) ? results : []).slice(0, 8));
      } catch (err) {
        console.error("Patient search error:", err);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm(patient.uhid || patient.full_name || "");
    setSuggestions([]);
    toast.success(`Selected patient: ${patient.full_name || patient.name || "Patient"} (${patient.uhid || "No UHID"})`);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setSearchTerm("");
    setSuggestions([]);
  };

  // 3. Category & Service Form Handlers
  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    const services = CATEGORY_SERVICES[cat] || [];
    if (services.length > 0) {
      setSelectedServiceName(services[0].name);
      setRateInput(services[0].rate);
    }
  };

  const handleServiceChange = (e) => {
    const sName = e.target.value;
    setSelectedServiceName(sName);
    const services = CATEGORY_SERVICES[activeCategory] || [];
    const found = services.find((s) => s.name === sName);
    if (found) {
      setRateInput(found.rate);
    }
  };

  // Add Item to Bill
  const handleAddBillItem = (preset = null) => {
    const targetName = preset ? preset.name : selectedServiceName;
    const targetCat = preset ? preset.category : activeCategory;
    const targetRate = preset ? Number(preset.rate) : Number(rateInput) || 0;
    const targetQty = preset ? 1 : Number(qtyInput) || 1;
    const targetDisc = preset ? 0 : Number(discountInput) || 0;
    const totalAmt = Math.max(0, targetRate * targetQty - targetDisc);

    // If item already exists, increment qty
    const existingIndex = billItems.findIndex((i) => i.name === targetName);
    if (existingIndex > -1) {
      const updated = [...billItems];
      updated[existingIndex].qty += targetQty;
      updated[existingIndex].amount =
        updated[existingIndex].rate * updated[existingIndex].qty - updated[existingIndex].discount;
      setBillItems(updated);
      toast.success(`Updated quantity for ${targetName}`);
      return;
    }

    const newItem = {
      id: Date.now() + Math.random(),
      name: targetName,
      category: targetCat,
      rate: targetRate,
      qty: targetQty,
      discount: targetDisc,
      amount: totalAmt,
    };

    setBillItems([...billItems, newItem]);
    toast.success(`Added ${targetName} to bill`);
  };

  const handleRemoveItem = (id) => {
    setBillItems(billItems.filter((i) => i.id !== id));
  };

  const handleClearAllItems = () => {
    setBillItems([]);
    toast("Bill items cleared", { icon: "🗑️" });
  };

  // Financial Computations
  const grossTotal = useMemo(
    () => billItems.reduce((acc, curr) => acc + curr.rate * curr.qty, 0),
    [billItems]
  );
  const totalDiscount = useMemo(
    () => billItems.reduce((acc, curr) => acc + Number(curr.discount || 0), 0),
    [billItems]
  );
  const netAmount = Math.max(0, grossTotal - totalDiscount);
  const numericReceived = Number(receivedAmount) || 0;
  const balance = Math.max(0, netAmount - numericReceived);

  // Sync received amount to net amount by default
  useEffect(() => {
    setReceivedAmount(netAmount.toString());
  }, [netAmount]);

  // Load Past Invoices
  const loadRecentInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const res = await billingInvoicesService.getAll({ limit: 20 });
      const list = Array.isArray(res) ? res : res?.data || res?.rows || [];
      setRecentInvoices(list);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleOpenRecentInvoicesModal = () => {
    loadRecentInvoices();
    setShowRecentInvoicesModal(true);
  };

  // 4. Generate & Save Bill
  const handleGenerateBill = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPatient) {
      toast.error("Please search and select a patient first.");
      return;
    }
    if (billItems.length === 0) {
      toast.error("Please add at least one item to the OPD bill.");
      return;
    }

    const invoiceNo = `INV-OPD-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const currentInvoiceData = {
      invoice_no: invoiceNo,
      date: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      patient: selectedPatient,
      items: billItems,
      grossTotal,
      totalDiscount,
      netAmount,
      receivedAmount: numericReceived,
      balance,
      paymentMode,
      remarks,
      amountInWords: numberToIndianWords(netAmount),
      counter: "OPD Billing Counter-01",
    };

    let facilityId = "00000000-0000-0000-0000-000000000000";
    try {
      const token = localStorage.getItem("hims_token");
      const decoded = token ? jwtDecode(token) : null;
      facilityId = decoded?.facilityId || decoded?.facility_id || facilityId;
    } catch (e) {
      // fallback
    }

    // Persist to backend if patient exists
    if (selectedPatient.id) {
      try {
        await billingInvoicesService.create({
          patient_id: selectedPatient.id,
          facility_id: facilityId,
          invoice_type: "opd",
          items: billItems.map((item) => ({
            name: item.name,
            qty: Number(item.qty) || 1,
            price: Number(item.rate) || 0,
          })),
          discount_total: Number(totalDiscount) || 0,
          payment_mode: paymentMode.toLowerCase().replace(/[^a-z]/g, ""),
        });
        toast.success(`OPD Bill ${invoiceNo} generated & saved successfully!`, { icon: "🧾" });
      } catch (err) {
        console.warn("Backend save notice:", err);
        toast.success(`OPD Bill generated (Ready for Print)!`, { icon: "🧾" });
      }
    } else {
      toast.success(`OPD Bill generated (Preview Mode)!`, { icon: "🧾" });
    }

    setGeneratedInvoice(currentInvoiceData);
    setShowPrintModal(true);
  };

  // Keyboard shortcut F5 to trigger bill generation without browser refresh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F5") {
        e.preventDefault();
        handleGenerateBill();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPatient, billItems, grossTotal, totalDiscount, netAmount, numericReceived, balance, paymentMode, remarks]);

  return (
    <div className="opdb-page">
      {/* ── 1. TOP EXECUTIVE HEADER (MATCHING REGISTRATION / IPD THEME) ── */}
      <div className="opdb-header">
        <div className="opdb-header-left">
          <div className="opdb-header-icon">
            <Icon name="LuReceipt" size={24} />
          </div>
          <div>
            <h1 className="opdb-title">OPD Billing &amp; Invoicing Desk</h1>
            <p className="opdb-subtitle">
              Search patient, add consultation &amp; clinical services, generate official OPD receipt
            </p>
          </div>
        </div>

        <div className="opdb-header-actions">
          <button
            type="button"
            className="opdb-hdr-btn opdb-hdr-btn--white"
            onClick={handleOpenRecentInvoicesModal}
            title="View Recent Invoices Register"
          >
            <Icon name="LuHistory" size={15} /> Recent OPD Invoices
          </button>
        </div>
      </div>

      {/* ── 2. PATIENT SEARCH & SELECTION CARD ── */}
      <div className="opdb-card">
        <div className="opdb-card-head">
          <h2 className="opdb-card-title">
            <Icon name="LuUserCheck" size={16} style={{ color: "#2563eb" }} />
            1. Search &amp; Select Patient (रोगी खोजें)
          </h2>
          {selectedPatient && (
            <button
              type="button"
              className="opdb-pb-btn-change"
              onClick={handleClearPatient}
              title="Change Patient"
            >
              <Icon name="LuRotateCcw" size={13} /> Change / Search Another
            </button>
          )}
        </div>

        {/* Search Bar Input */}
        <div className="opdb-search-row">
          <div className="opdb-search-input-wrap">
            <Icon name="LuSearch" size={18} className="opdb-search-icon" />
            <input
              type="text"
              className="opdb-search-input"
              placeholder="Search by UHID (e.g. 1026-0097), Patient Full Name, or 10-Digit Mobile Number..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && suggestions.length > 0) {
                  e.preventDefault();
                  handleSelectPatient(suggestions[0]);
                }
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="opdb-search-clear"
                onClick={handleClearPatient}
                title="Clear Search"
              >
                <Icon name="LuX" size={16} />
              </button>
            )}

            {/* Autocomplete Suggestions */}
            {suggestions.length > 0 && (
              <div className="opdb-suggestions-dropdown">
                {suggestions.map((p) => (
                  <div
                    key={p.uhid || p.id}
                    className="opdb-sugg-item"
                    onClick={() => handleSelectPatient(p)}
                  >
                    <div>
                      <div className="opdb-sugg-name">{p.full_name || p.name || p.first_name}</div>
                      <div className="opdb-sugg-meta">
                        {p.gender || "—"} / {p.age ? `${p.age} Yrs` : "—"} • 📞{" "}
                        {p.phone || p.mobile || "N/A"} • 📍 {p.city || "Kota, Rajasthan"}
                      </div>
                    </div>
                    <span className="opdb-uhid-badge">{p.uhid || "NO UHID"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="opdb-btn-search"
            onClick={() => {
              if (suggestions.length > 0) handleSelectPatient(suggestions[0]);
              else toast("Type patient UHID, Name or Mobile above", { icon: "🔍" });
            }}
          >
            <Icon name="LuSearch" size={16} /> Search
          </button>
        </div>

        {/* Quick-Pick Today's Registered OPD Patients */}
        {allRecentPatients.length > 0 && (
          <div className="opdb-quick-pick">
            <span className="opdb-quick-label">⚡ Recent OPD Queue:</span>
            {allRecentPatients.slice(0, 7).map((rp) => {
              const isSelected = selectedPatient && (selectedPatient.uhid === rp.uhid || selectedPatient.id === rp.id);
              return (
                <button
                  key={rp.uhid || rp.id}
                  type="button"
                  className={`opdb-quick-chip ${isSelected ? "opdb-quick-chip--active" : ""}`}
                  onClick={() => handleSelectPatient(rp)}
                  title={`Pick ${rp.full_name || rp.first_name} (${rp.uhid})`}
                >
                  <Icon name="LuUser" size={12} />
                  <span>{rp.full_name || rp.first_name || "Patient"}</span>
                  <span style={{ opacity: 0.75, fontSize: 10.5 }}>({rp.uhid})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Active Patient Profile Banner */}
        {selectedPatient ? (
          <div className="opdb-patient-banner">
            <div className="opdb-pb-left">
              <div className="opdb-pb-avatar">
                {(selectedPatient.full_name || selectedPatient.name || selectedPatient.first_name || "P")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="opdb-pb-info">
                <div className="opdb-pb-name-row">
                  <h3 className="opdb-pb-name">
                    {selectedPatient.full_name || selectedPatient.name || selectedPatient.first_name}
                  </h3>
                  <span className="opdb-uhid-badge">{selectedPatient.uhid}</span>
                  <span className="opdb-pb-pill opdb-pb-pill--opd">OPD Patient</span>
                </div>
                <div className="opdb-pb-meta">
                  <span>
                    <Icon name="LuUser" size={13} />
                    {selectedPatient.gender || "Male"} / {selectedPatient.age ? `${selectedPatient.age} Yrs` : "30 Yrs"}
                  </span>
                  <span>
                    <Icon name="LuPhone" size={13} />
                    {selectedPatient.phone || selectedPatient.mobile || "9876543210"}
                  </span>
                  <span>
                    <Icon name="LuMapPin" size={13} />
                    {selectedPatient.city || selectedPatient.address || "Kota, Rajasthan"}
                  </span>
                  {selectedPatient.blood_group && (
                    <span style={{ color: "#dc2626", fontWeight: 700 }}>
                      🩸 {selectedPatient.blood_group}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="opdb-pb-right">
              <div className="opdb-pb-doc-box">
                <div className="opdb-pb-doc-lbl">Consultant Doctor</div>
                <div className="opdb-pb-doc-name">
                  {selectedPatient.doctor || "Dr. Amit Sharma (General Medicine)"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="opdb-patient-empty">
            <Icon name="LuInfo" size={18} style={{ color: "#2563eb", flexShrink: 0 }} />
            <span>
              Please search patient above by UHID or Mobile, or click any patient from the recent OPD queue to generate bill.
            </span>
          </div>
        )}
      </div>

      {/* ── 3. MAIN TWO-COLUMN WORKFLOW (SERVICES & CHECKOUT) ── */}
      <div className="opdb-grid">
        {/* Left Column: Services Catalog & Current Bill Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Add Services & Charges Card */}
          <div className="opdb-card">
            <div className="opdb-card-head">
              <h2 className="opdb-card-title">
                <Icon name="LuPlusCircle" size={16} style={{ color: "#10b981" }} />
                2. Add Consultation &amp; Services (सेवाएं जोड़ें)
              </h2>
            </div>

            {/* Quick 1-Click Add Chips */}
            <div className="opdb-quick-services">
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                1-Click Add:
              </span>
              {QUICK_ADD_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className="opdb-svc-chip"
                  onClick={() => handleAddBillItem(preset)}
                >
                  <Icon name="LuPlus" size={12} />
                  <span>{preset.name}</span>
                  <strong>₹{preset.rate}</strong>
                </button>
              ))}
            </div>

            {/* Category Selector Tabs */}
            <div className="opdb-cat-tabs">
              {Object.keys(CATEGORY_SERVICES).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`opdb-cat-btn ${activeCategory === cat ? "opdb-cat-btn--active" : ""}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat === "Consultation" && <Icon name="LuStethoscope" size={13} />}
                  {cat === "Lab Test" && <Icon name="LuFlaskConical" size={13} />}
                  {cat === "Radiology" && <Icon name="LuActivity" size={13} />}
                  {cat === "Procedure" && <Icon name="LuHeartHandshake" size={13} />}
                  {cat === "Medicine" && <Icon name="LuPill" size={13} />}
                  {cat === "Others" && <Icon name="LuFolderPlus" size={13} />}
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            {/* Custom Service Input Row Form */}
            <div className="opdb-service-row">
              <div className="opdb-form-group">
                <label className="opdb-label">Service Item Name</label>
                <select
                  className="opdb-select"
                  value={selectedServiceName}
                  onChange={handleServiceChange}
                >
                  {(CATEGORY_SERVICES[activeCategory] || []).map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} (₹{s.rate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="opdb-form-group">
                <label className="opdb-label">Rate (₹)</label>
                <input
                  type="number"
                  className="opdb-input"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                />
              </div>

              <div className="opdb-form-group">
                <label className="opdb-label">Qty</label>
                <input
                  type="number"
                  min="1"
                  className="opdb-input"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                />
              </div>

              <div className="opdb-form-group">
                <label className="opdb-label">Disc (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="opdb-input"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="opdb-btn-add"
                onClick={() => handleAddBillItem()}
              >
                <Icon name="LuPlus" size={15} /> Add Item
              </button>
            </div>
          </div>

          {/* Current Bill Items Table Card */}
          <div className="opdb-card">
            <div className="opdb-card-head">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 className="opdb-card-title">
                  <Icon name="LuListOrdered" size={16} style={{ color: "#2563eb" }} />
                  3. Particulars &amp; Bill Items ({billItems.length})
                </h2>
              </div>
              {billItems.length > 0 && (
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#dc2626",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  onClick={handleClearAllItems}
                >
                  <Icon name="LuTrash2" size={14} /> Clear All
                </button>
              )}
            </div>

            {/* Bill Table */}
            <div className="opdb-table-wrap">
              <table className="opdb-table">
                <thead>
                  <tr>
                    <th style={{ width: 35 }}>#</th>
                    <th>SERVICE / ITEM NAME</th>
                    <th>CATEGORY</th>
                    <th style={{ textAlign: "right", width: 90 }}>RATE (₹)</th>
                    <th style={{ textAlign: "center", width: 60 }}>QTY</th>
                    <th style={{ textAlign: "right", width: 80 }}>DISC (₹)</th>
                    <th style={{ textAlign: "right", width: 100 }}>AMOUNT (₹)</th>
                    <th style={{ textAlign: "center", width: 45 }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "center", padding: "30px 14px", color: "#64748b" }}
                      >
                        <Icon
                          name="LuReceipt"
                          size={28}
                          style={{ display: "block", margin: "0 auto 6px auto", opacity: 0.4 }}
                        />
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                          No bill items added yet
                        </div>
                        <div style={{ fontSize: 11.5, marginTop: 2 }}>
                          Select consultation fee or test above to populate bill items
                        </div>
                      </td>
                    </tr>
                  ) : (
                    billItems.map((item, idx) => {
                      const lineTotal = item.rate * item.qty - (item.discount || 0);
                      return (
                        <tr key={item.id}>
                          <td style={{ color: "#64748b", fontWeight: 700 }}>{idx + 1}</td>
                          <td style={{ fontWeight: 800, color: "#0f172a" }}>{item.name}</td>
                          <td>
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 4,
                                background: "#f1f5f9",
                                color: "#475569",
                                fontWeight: 700,
                              }}
                            >
                              {item.category}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>
                            {Number(item.rate).toFixed(2)}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>{item.qty}</td>
                          <td style={{ textAlign: "right", color: "#dc2626", fontWeight: 600 }}>
                            {Number(item.discount || 0).toFixed(2)}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 800, color: "#081a3d" }}>
                            ₹{lineTotal.toFixed(2)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className="opdb-btn-del"
                              onClick={() => handleRemoveItem(item.id)}
                              title="Remove Item"
                            >
                              <Icon name="LuTrash2" size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Remarks / Advice */}
            <div className="opdb-remarks-wrap">
              <label className="opdb-label">Remarks / Special Advice (Optional)</label>
              <textarea
                className="opdb-textarea"
                placeholder="e.g. OPD Consultation review after 5 days with test reports..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Payment Details & Checkout */}
        <div className="opdb-card" style={{ height: "fit-content" }}>
          <div className="opdb-card-head">
            <h2 className="opdb-card-title">
              <Icon name="LuCreditCard" size={16} style={{ color: "#059669" }} />
              4. Payment &amp; Checkout (बिल सारांश)
            </h2>
          </div>

          <form onSubmit={handleGenerateBill} className="opdb-checkout-box">
            {/* Totals Summary Card */}
            <div className="opdb-summary-card">
              <div className="opdb-sum-row">
                <span>Subtotal Gross Amount:</span>
                <strong>₹ {grossTotal.toFixed(2)}</strong>
              </div>
              <div className="opdb-sum-row">
                <span>Discount / Concession:</span>
                <strong style={{ color: "#dc2626" }}>- ₹ {totalDiscount.toFixed(2)}</strong>
              </div>

              {/* Big Bold Net Payable Banner */}
              <div className="opdb-net-payable-banner">
                <div>
                  <div className="opdb-net-label">NET PAYABLE AMOUNT</div>
                  <span style={{ fontSize: 11, color: "#93c5fd" }}>Total OPD Charge</span>
                </div>
                <div className="opdb-net-amount">₹ {netAmount.toFixed(2)}</div>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="opdb-form-group">
              <label className="opdb-label">Payment Mode</label>
              <div className="opdb-mode-grid">
                {["Cash", "UPI", "Card", "Net Banking"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`opdb-mode-btn ${paymentMode === mode ? "opdb-mode-btn--active" : ""}`}
                    onClick={() => {
                      setPaymentMode(mode);
                      if (mode === "UPI") setShowUpiQR(true);
                      else setShowUpiQR(false);
                    }}
                  >
                    {mode === "Cash" && <Icon name="LuBanknote" size={14} />}
                    {mode === "UPI" && <Icon name="LuQrCode" size={14} />}
                    {mode === "Card" && <Icon name="LuCreditCard" size={14} />}
                    {mode === "Net Banking" && <Icon name="LuBuilding" size={14} />}
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic UPI QR Code Preview */}
            {paymentMode === "UPI" && (
              <div className="opdb-upi-qr-card">
                <div className="opdb-upi-qr-icon">
                  <Icon name="LuQrCode" size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#166534" }}>
                    Scan &amp; Pay via UPI
                  </div>
                  <div style={{ fontSize: 11, color: "#15803d" }}>
                    VPA: <strong>narayan.hospital@icici</strong>
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                    Amount: <strong>₹{netAmount.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Received Amount Input */}
            <div className="opdb-form-group">
              <label className="opdb-label">Received Amount (₹)</label>
              <input
                type="number"
                className="opdb-input"
                style={{ fontSize: 14, fontWeight: 700 }}
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
              />
            </div>

            {/* Balance Due / Cleared Status */}
            <div
              className={`opdb-balance-badge ${
                balance === 0 ? "opdb-balance-badge--cleared" : "opdb-balance-badge--due"
              }`}
            >
              <span>Balance Status:</span>
              <span>
                {balance === 0 ? (
                  <>
                    <Icon name="LuCheckCircle" size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Full Payment Received (₹0.00 Due)
                  </>
                ) : (
                  <>Due / Pending: ₹ {balance.toFixed(2)}</>
                )}
              </span>
            </div>

            {/* Checkbox Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "4px 0" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={printBill}
                  onChange={(e) => setPrintBill(e.target.checked)}
                />
                Print Official OPD Bill &amp; Cash Receipt
              </label>
            </div>

            {/* PRIMARY ACTION: GENERATE & PRINT BILL */}
            <button
              id="btn-generate-opd-bill"
              type="submit"
              className="opdb-btn-generate"
            >
              <Icon name="LuPrinter" size={20} />
              <span>GENERATE &amp; PRINT BILL (F5)</span>
            </button>

            {/* Secondary Preview Button */}
            <button
              id="btn-preview-opd-bill"
              type="button"
              className="opdb-btn-secondary"
              onClick={() => {
                if (!selectedPatient) {
                  toast.error("Please select a patient first.");
                  return;
                }
                setGeneratedInvoice({
                  invoice_no: `INV-OPD-PREVIEW`,
                  date: new Date().toLocaleString("en-IN"),
                  patient: selectedPatient,
                  items: billItems,
                  grossTotal,
                  totalDiscount,
                  netAmount,
                  receivedAmount: numericReceived,
                  balance,
                  paymentMode,
                  remarks,
                  amountInWords: numberToIndianWords(netAmount),
                  counter: "Counter-01",
                });
                setShowPrintModal(true);
              }}
            >
              <Icon name="LuEye" size={15} /> Open Bill Receipt Preview
            </button>
          </form>
        </div>
      </div>

      {/* ── 4. OFFICIAL NABH-STANDARD OPD BILL PRINT MODAL ── */}
      {showPrintModal && generatedInvoice && (
        <div className="opdb-modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="opdb-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="opdb-modal-head">
              <h3 className="opdb-modal-title">
                <Icon name="LuFileCheck" size={18} />
                Official OPD Bill Receipt — {generatedInvoice.invoice_no}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  className="opdb-hdr-btn opdb-hdr-btn--amber"
                  style={{ height: 32, fontSize: 12, padding: "0 12px" }}
                  onClick={() => window.print()}
                >
                  <Icon name="LuPrinter" size={14} /> Print Receipt
                </button>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", display: "flex" }}
                  onClick={() => setShowPrintModal(false)}
                >
                  <Icon name="LuX" size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Complete Printable Hospital Standard Tax Invoice Sheet */}
            <div className="opdb-modal-body">
              <div className="opdb-invoice-sheet" id="opd-invoice-printable-area">
                {/* Hospital Top Header */}
                <div className="opdb-inv-header">
                  <h2 className="opdb-inv-hosp-name">
                    NARAYAN HOSPITAL &amp; MEDICAL RESEARCH CENTRE
                  </h2>
                  <p className="opdb-inv-hosp-sub">
                    NABH Accredited Multi-Specialty Hospital • 24×7 Emergency &amp; OPD Care
                    <br />
                    Station Road, Civil Lines, Kota, Rajasthan - 324001 • Tel: +91 744 2450000
                  </p>
                  <span className="opdb-inv-tag">OPD CASH / TAX INVOICE RECEIPT</span>
                </div>

                {/* Metadata Grid */}
                <div className="opdb-inv-meta-grid">
                  <div className="opdb-inv-meta-item">
                    <label>Invoice No:</label>
                    <span style={{ color: "#1d4ed8", fontWeight: 800 }}>
                      {generatedInvoice.invoice_no}
                    </span>
                  </div>
                  <div className="opdb-inv-meta-item">
                    <label>Date &amp; Time:</label>
                    <span>{generatedInvoice.date}</span>
                  </div>

                  <div className="opdb-inv-meta-item">
                    <label>Patient Name:</label>
                    <span style={{ fontWeight: 800 }}>
                      {generatedInvoice.patient.full_name || generatedInvoice.patient.name || generatedInvoice.patient.first_name}
                    </span>
                  </div>
                  <div className="opdb-inv-meta-item">
                    <label>UHID Number:</label>
                    <span style={{ fontWeight: 800 }}>
                      {generatedInvoice.patient.uhid || "—"}
                    </span>
                  </div>

                  <div className="opdb-inv-meta-item">
                    <label>Age / Gender:</label>
                    <span>
                      {generatedInvoice.patient.age ? `${generatedInvoice.patient.age} Yrs` : "—"} /{" "}
                      {generatedInvoice.patient.gender || "—"}{" "}
                      {generatedInvoice.patient.blood_group && `(🩸 ${generatedInvoice.patient.blood_group})`}
                    </span>
                  </div>
                  <div className="opdb-inv-meta-item">
                    <label>Mobile No:</label>
                    <span>{generatedInvoice.patient.phone || generatedInvoice.patient.mobile || "—"}</span>
                  </div>

                  <div className="opdb-inv-meta-item">
                    <label>Consultant:</label>
                    <span>
                      {generatedInvoice.patient.doctor || "Dr. Amit Sharma (General Medicine)"}
                    </span>
                  </div>
                  <div className="opdb-inv-meta-item">
                    <label>Payment Mode:</label>
                    <span style={{ fontWeight: 800, color: "#059669" }}>
                      {generatedInvoice.paymentMode.toUpperCase()} (PAID)
                    </span>
                  </div>
                </div>

                {/* Particulars Table */}
                <table className="opdb-inv-table">
                  <thead>
                    <tr>
                      <th style={{ width: 35 }}>#</th>
                      <th>PARTICULARS / SERVICE ITEM</th>
                      <th>CATEGORY</th>
                      <th style={{ textAlign: "right", width: 90 }}>RATE (₹)</th>
                      <th style={{ textAlign: "center", width: 50 }}>QTY</th>
                      <th style={{ textAlign: "right", width: 80 }}>DISC (₹)</th>
                      <th style={{ textAlign: "right", width: 100 }}>AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 700 }}>{item.name}</td>
                        <td>{item.category}</td>
                        <td style={{ textAlign: "right" }}>{Number(item.rate).toFixed(2)}</td>
                        <td style={{ textAlign: "center" }}>{item.qty}</td>
                        <td style={{ textAlign: "right" }}>{Number(item.discount || 0).toFixed(2)}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {(item.rate * item.qty - (item.discount || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Calculation */}
                <div className="opdb-inv-totals-box">
                  <table className="opdb-inv-totals-tbl">
                    <tbody>
                      <tr>
                        <td>Gross Subtotal:</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          ₹ {generatedInvoice.grossTotal.toFixed(2)}
                        </td>
                      </tr>
                      {generatedInvoice.totalDiscount > 0 && (
                        <tr>
                          <td>Discount:</td>
                          <td style={{ textAlign: "right", color: "#dc2626", fontWeight: 700 }}>
                            - ₹ {generatedInvoice.totalDiscount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr className="opdb-inv-grand-total">
                        <td>TOTAL PAID:</td>
                        <td style={{ textAlign: "right" }}>
                          ₹ {generatedInvoice.netAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td>Balance Due:</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "#16a34a" }}>
                          ₹ {generatedInvoice.balance.toFixed(2)} (Cleared)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Amount in Words */}
                <div className="opdb-inv-inwords">
                  <strong>Amount in Words:</strong> {generatedInvoice.amountInWords}
                </div>

                {/* Remarks if any */}
                {generatedInvoice.remarks && (
                  <div style={{ fontSize: 11.5, color: "#475569", marginBottom: 12 }}>
                    <strong>Doctor / Billing Note:</strong> {generatedInvoice.remarks}
                  </div>
                )}

                {/* Barcode & Signature */}
                <div className="opdb-inv-barcode-row">
                  <div>
                    <div className="opdb-inv-barcode">
                      *{generatedInvoice.invoice_no}*
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                      System Generated Tax Invoice • Valid for 7 Days OPD Review
                    </div>
                  </div>

                  <div className="opdb-inv-sig">
                    Authorized Cashier
                    <br />
                    <span style={{ fontSize: 9.5, color: "#64748b" }}>Billing Desk • Counter-01</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="opdb-modal-foot">
              <button
                type="button"
                className="opdb-btn-secondary"
                style={{ width: "auto", padding: "0 18px" }}
                onClick={() => setShowPrintModal(false)}
              >
                Close Window
              </button>

              <button
                type="button"
                className="opdb-btn-generate"
                style={{ width: "auto", padding: "0 24px", height: 40 }}
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={16} /> Print Official Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. RECENT OPD INVOICES REGISTER MODAL ── */}
      {showRecentInvoicesModal && (
        <div className="opdb-modal-overlay" onClick={() => setShowRecentInvoicesModal(false)}>
          <div className="opdb-modal-box" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
            <div className="opdb-modal-head">
              <h3 className="opdb-modal-title">
                <Icon name="LuHistory" size={18} />
                Recent OPD Invoices Register
              </h3>
              <button
                type="button"
                style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", display: "flex" }}
                onClick={() => setShowRecentInvoicesModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="opdb-modal-body">
              {invoicesLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  <Icon name="LuLoader" size={24} className="spinning" />
                  <p style={{ marginTop: 8, fontWeight: 700 }}>Loading recent OPD invoices…</p>
                </div>
              ) : recentInvoices.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  <Icon name="LuReceipt" size={32} style={{ display: "block", margin: "0 auto 8px auto", opacity: 0.4 }} />
                  <div style={{ fontWeight: 800, color: "#1e293b" }}>No OPD Invoices Found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Generate a new bill above to populate the register.</div>
                </div>
              ) : (
                <div className="opdb-table-wrap">
                  <table className="opdb-table">
                    <thead>
                      <tr>
                        <th>INVOICE NO</th>
                        <th>PATIENT NAME</th>
                        <th>UHID</th>
                        <th>DATE</th>
                        <th style={{ textAlign: "right" }}>AMOUNT (₹)</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: "center" }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 800, color: "#1d4ed8" }}>
                            {inv.invoice_number || inv.invoice_no || `INV-${inv.id}`}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            {inv.patient_name || inv.first_name || "Patient"}
                          </td>
                          <td>{inv.uhid || "—"}</td>
                          <td>
                            {inv.created_at ? new Date(inv.created_at).toLocaleDateString("en-IN") : "—"}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 800 }}>
                            ₹{Number(inv.total_amount || inv.net_amount || 0).toFixed(2)}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 800,
                                background: "#ecfdf5",
                                color: "#047857",
                              }}
                            >
                              PAID
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className="opdb-hdr-btn opdb-hdr-btn--white"
                              style={{ height: 28, padding: "0 10px", fontSize: 11 }}
                              onClick={() => {
                                setGeneratedInvoice({
                                  invoice_no: inv.invoice_number || `INV-${inv.id}`,
                                  date: inv.created_at ? new Date(inv.created_at).toLocaleString("en-IN") : new Date().toLocaleString("en-IN"),
                                  patient: {
                                    full_name: inv.patient_name || "Patient",
                                    uhid: inv.uhid || "—",
                                    phone: inv.phone || "—",
                                    gender: inv.gender || "—",
                                    age: inv.age || "—",
                                    doctor: inv.doctor_name || "Dr. Amit Sharma",
                                  },
                                  items: Array.isArray(inv.items) && inv.items.length > 0 ? inv.items : [
                                    { name: "OPD Consultation & Clinical Services", category: "Consultation", rate: Number(inv.total_amount || 500), qty: 1, discount: 0 }
                                  ],
                                  grossTotal: Number(inv.total_amount || 500),
                                  totalDiscount: 0,
                                  netAmount: Number(inv.total_amount || 500),
                                  receivedAmount: Number(inv.total_amount || 500),
                                  balance: 0,
                                  paymentMode: inv.payment_mode || "Cash",
                                  remarks: "Official OPD Hospital Record",
                                  amountInWords: numberToIndianWords(Number(inv.total_amount || 500)),
                                  counter: "Counter-01",
                                });
                                setShowRecentInvoicesModal(false);
                                setShowPrintModal(true);
                              }}
                            >
                              <Icon name="LuPrinter" size={12} /> Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="opdb-modal-foot">
              <button
                type="button"
                className="opdb-btn-secondary"
                style={{ width: "auto", padding: "0 18px" }}
                onClick={() => setShowRecentInvoicesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
