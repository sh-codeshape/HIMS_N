import React, { useState } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import "./IPDBilling.css";

// Comprehensive Sample IPD Patient Data
const SAMPLE_IPD_PATIENTS = [
  {
    admissionNo: "IPD20260929001",
    uhid: "UHID12345",
    name: "Rohit Kumar",
    age: 28,
    gender: "Male",
    mobile: "9876543210",
    city: "Varanasi, Uttar Pradesh",
    bloodGroup: "B+",
    allergies: "NKA",
    history: "Hypertension, Diabetes",
    admissionDate: "29-09-2026 10:30 AM",
    department: "General Medicine",
    consultant: "Dr. Amit Sharma",
    ward: "General Ward",
    roomNo: "GW-102",
    bedNo: "B-12",
    expectedDischarge: "02-10-2026",
    status: "Admitted (3 Days)",
    admissionType: "Routine",
    ratePlan: "General Ward (₹ 1,500 / day)",
    initialDeposit: 2000,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    historyPayments: [
      { id: 1, date: "29-09-2026", amount: 2000, mode: "Cash", type: "Advance", remarks: "Initial deposit" },
      { id: 2, date: "30-09-2026", amount: 1000, mode: "UPI", type: "Payment", remarks: "Day 2 payment" },
    ],
    items: [
      { id: 1, date: "29-09-2026", name: "General Ward (Per Day)", category: "Room", rate: 1500, qty: 1, amount: 1500, selected: true },
      { id: 2, date: "29-09-2026", name: "Doctor Visit (Dr. Amit Sharma)", category: "Consultation", rate: 800, qty: 1, amount: 800, selected: false },
      { id: 3, date: "30-09-2026", name: "Room Charges (Day 2)", category: "Room", rate: 1500, qty: 1, amount: 1500, selected: false },
      { id: 4, date: "30-09-2026", name: "CBC (Complete Blood Count)", category: "Lab Test", rate: 300, qty: 1, amount: 300, selected: false },
      { id: 5, date: "30-09-2026", name: "X-Ray Chest PA View", category: "Radiology", rate: 400, qty: 1, amount: 400, selected: false },
      { id: 6, date: "30-09-2026", name: "Antibiotics Injection", category: "Pharmacy", rate: 250, qty: 3, amount: 750, selected: false },
      { id: 7, date: "01-10-2026", name: "Room Charges (Day 3)", category: "Room", rate: 1500, qty: 1, amount: 1500, selected: false },
    ],
  },
  {
    admissionNo: "IPD20260928004",
    uhid: "UHID67890",
    name: "Priya Sharma",
    age: 32,
    gender: "Female",
    mobile: "9876512345",
    city: "Lucknow, Uttar Pradesh",
    bloodGroup: "O+",
    allergies: "Penicillin",
    history: "Asthma",
    admissionDate: "28-09-2026 08:15 AM",
    department: "Cardiology",
    consultant: "Dr. R. Singh",
    ward: "ICU",
    roomNo: "ICU-02",
    bedNo: "ICU-B2",
    expectedDischarge: "03-10-2026",
    status: "Admitted (4 Days)",
    admissionType: "Emergency",
    ratePlan: "ICU Bed (₹ 4,500 / day)",
    initialDeposit: 5000,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    historyPayments: [
      { id: 1, date: "28-09-2026", amount: 5000, mode: "Card", type: "Advance", remarks: "Emergency ICU Deposit" },
    ],
    items: [
      { id: 1, date: "28-09-2026", name: "ICU Bed Charge (Day 1)", category: "Room", rate: 4500, qty: 1, amount: 4500, selected: false },
      { id: 2, date: "28-09-2026", name: "Specialist Doctor Visit", category: "Consultation", rate: 1200, qty: 1, amount: 1200, selected: false },
    ],
  },
];

const CATEGORY_SERVICE_LIST = {
  "Room Charges": [
    { name: "General Ward (Per Day)", rate: 1500 },
    { name: "Semi-Private Room (Per Day)", rate: 2500 },
    { name: "Private AC Room (Per Day)", rate: 4000 },
    { name: "ICU Bed Charge (Per Day)", rate: 5500 },
  ],
  Consultation: [
    { name: "Doctor Visit (Dr. Amit Sharma)", rate: 800 },
    { name: "Senior Consultant Round", rate: 1200 },
    { name: "Emergency Casualty Visit", rate: 1500 },
  ],
  "Lab Test": [
    { name: "CBC (Complete Blood Count)", rate: 300 },
    { name: "Liver Function Test (LFT)", rate: 650 },
    { name: "Kidney Function Test (KFT)", rate: 700 },
    { name: "Blood Sugar (RBS)", rate: 120 },
  ],
  Radiology: [
    { name: "X-Ray Chest PA View", rate: 400 },
    { name: "Ultrasound Abdomen & Pelvis", rate: 1400 },
    { name: "CT Scan Brain", rate: 3200 },
  ],
  Procedures: [
    { name: "Wound Dressing / Suturing", rate: 500 },
    { name: "ECG 12 Lead", rate: 400 },
    { name: "Oxygen Mask / Hourly Charge", rate: 200 },
  ],
  Medicines: [
    { name: "Antibiotics Injection", rate: 250 },
    { name: "IV Infusion Set & Fluids", rate: 350 },
    { name: "Painkiller Injection", rate: 180 },
  ],
  Others: [
    { name: "Admission Charge", rate: 500 },
    { name: "Nursing Charges (Daily)", rate: 400 },
  ],
};

export default function IPDBilling() {
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState("Patient Details");

  // Search & Selected Patient State
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [patient, setPatient] = useState(null);

  // Service Selection Form State
  const [activeCategory, setActiveCategory] = useState("Room Charges");
  const [selectedServiceName, setSelectedServiceName] = useState("General Ward (Per Day)");
  const [rateInput, setRateInput] = useState(1500);
  const [qtyInput, setQtyInput] = useState(1);

  // Remarks State
  const [remarks, setRemarks] = useState("");

  // Modal Dialog States
  const [showReceivePayModal, setShowReceivePayModal] = useState(false);
  const [showChangeBedModal, setShowChangeBedModal] = useState(false);
  const [showPrintBillModal, setShowPrintBillModal] = useState(false);
  const [showAdmissionSlipModal, setShowAdmissionSlipModal] = useState(false);

  // Payment Form State in Modal
  const [paymentForm, setPaymentForm] = useState({
    amount: "1000",
    mode: "Cash",
    type: "Payment",
    remarks: "Advance payment",
  });

  // Bed Form State
  const [bedForm, setBedForm] = useState({
    ward: SAMPLE_IPD_PATIENTS[0].ward,
    roomNo: SAMPLE_IPD_PATIENTS[0].roomNo,
    bedNo: SAMPLE_IPD_PATIENTS[0].bedNo,
  });

  // Handle Search Change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (query.trim().length > 0) {
      const filtered = SAMPLE_IPD_PATIENTS.filter(
        (p) =>
          p.admissionNo.toLowerCase().includes(query.toLowerCase()) ||
          p.uhid.toLowerCase().includes(query.toLowerCase()) ||
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.mobile.includes(query)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectPatient = (p) => {
    setPatient(p);
    setSearchTerm(p.admissionNo);
    setSuggestions([]);
    setBedForm({ ward: p.ward, roomNo: p.roomNo, bedNo: p.bedNo });
    toast.success(`Loaded IPD record for ${p.name}`);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      setPatient(null);
      return;
    }
    const found = SAMPLE_IPD_PATIENTS.find(
      (p) =>
        p.admissionNo.toLowerCase() === query ||
        p.uhid.toLowerCase() === query ||
        p.name.toLowerCase().includes(query) ||
        p.mobile.includes(query)
    );
    if (found) {
      handleSelectPatient(found);
    } else {
      toast.error("No IPD patient found with provided details.");
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSuggestions([]);
    setPatient(null);
  };

  // Category Pill Selection
  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    const services = CATEGORY_SERVICE_LIST[cat] || [];
    if (services.length > 0) {
      setSelectedServiceName(services[0].name);
      setRateInput(services[0].rate);
    }
  };

  // Service Select Change
  const handleServiceChange = (e) => {
    const sName = e.target.value;
    setSelectedServiceName(sName);
    const services = CATEGORY_SERVICE_LIST[activeCategory] || [];
    const found = services.find((s) => s.name === sName);
    if (found) {
      setRateInput(found.rate);
    }
  };

  // Add Item to Bill Items Table
  const handleAddServiceItem = () => {
    if (!patient) {
      toast.error("Please search and select a patient first.");
      return;
    }
    const rate = Number(rateInput) || 0;
    const qty = Number(qtyInput) || 1;
    const newItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
      name: selectedServiceName,
      category: activeCategory === "Room Charges" ? "Room" : activeCategory,
      rate,
      qty,
      amount: rate * qty,
      selected: false,
    };

    setPatient((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    toast.success(`Added ${selectedServiceName} to IPD Bill.`);
  };

  // Remove Individual Bill Item
  const handleRemoveItem = (id) => {
    if (!patient) return;
    setPatient((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  // Toggle Item Checkbox
  const handleToggleSelectItem = (id) => {
    if (!patient) return;
    setPatient((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      ),
    }));
  };

  // Remove Selected Checked Items
  const handleRemoveSelected = () => {
    if (!patient) return;
    const selectedCount = patient.items.filter((i) => i.selected).length;
    if (selectedCount === 0) {
      toast.error("Please select items to remove.");
      return;
    }
    setPatient((prev) => ({
      ...prev,
      items: prev.items.filter((item) => !item.selected),
    }));
    toast.success(`Removed ${selectedCount} selected items.`);
  };

  // Submit Receive Payment Modal
  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!patient) return;
    const amt = Number(paymentForm.amount) || 0;
    if (amt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const newPay = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
      amount: amt,
      mode: paymentForm.mode,
      type: paymentForm.type,
      remarks: paymentForm.remarks || "Payment deposit",
    };

    setPatient((prev) => ({
      ...prev,
      historyPayments: [...prev.historyPayments, newPay],
    }));

    setShowReceivePayModal(false);
    toast.success(`Payment of ₹ ${amt} recorded successfully!`, { icon: "💳" });
  };

  // Submit Change Bed Modal
  const handleSaveBedChange = (e) => {
    e.preventDefault();
    if (!patient) return;
    setPatient((prev) => ({
      ...prev,
      ward: bedForm.ward,
      roomNo: bedForm.roomNo,
      bedNo: bedForm.bedNo,
    }));
    setShowChangeBedModal(false);
    toast.success(`Bed changed to ${bedForm.ward} - ${bedForm.roomNo} (${bedForm.bedNo})`);
  };

  // Bill Calculations
  const totalBills = patient ? patient.items.reduce((acc, curr) => acc + curr.amount, 0) : 0;

  const totalAdvance = patient
    ? patient.historyPayments
        .filter((p) => p.type === "Advance")
        .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  const totalReceived = patient
    ? patient.historyPayments
        .filter((p) => p.type === "Payment")
        .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  const totalPaymentsReceivedAll = totalAdvance + totalReceived;
  const pendingAmount = Math.max(0, totalBills - totalPaymentsReceivedAll);

  // Category Summaries
  const roomChargesTotal = patient
    ? patient.items
        .filter((i) => i.category === "Room")
        .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  const consultationTotal = patient
    ? patient.items
        .filter((i) => i.category === "Consultation")
        .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  const labTotal = patient
    ? patient.items
        .filter((i) => i.category === "Lab Test")
        .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  const radiologyTotal = patient
    ? patient.items
        .filter((i) => i.category === "Radiology")
        .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  return (
    <div className="ipd-billing-page">
      {/* Page Header & Breadcrumbs */}
      <div className="ipd-page-header">
        <div className="ipd-header-left">
          <div className="ipd-header-icon-box">
            <Icon name="LuReceipt" size={24} />
          </div>
          <div>
            <h1 className="ipd-header-title">IPD Billing</h1>
            <p className="ipd-header-subtitle">
              Manage inpatient services, charges, payments and generate final bill
            </p>
          </div>
        </div>

        <div className="ipd-header-right-actions">
          <div className="ipd-breadcrumb">
            <span className="ipd-breadcrumb-item">Home</span>
            <span>&gt;</span>
            <span className="ipd-breadcrumb-item">Billing</span>
            <span>&gt;</span>
            <span className="ipd-breadcrumb-active">IPD Billing</span>
          </div>

          <span className="ipd-badge-status-admitted">
            <Icon name="LuCheckCircle" size={14} /> Admitted
          </span>

          <button type="button" className="ipd-more-btn" title="More Options">
            <Icon name="LuMoreHorizontal" size={18} />
          </button>
        </div>
      </div>

      

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="ipd-search-bar-row">
        <div className="ipd-search-input-wrap">
          <Icon name="LuSearch" size={16} className="ipd-search-icon" />
          <input
            type="text"
            className="ipd-search-input"
            placeholder="Search Admitted Patient by UHID, Admission No, Name, or Mobile..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {suggestions.length > 0 && (
            <div className="ipd-search-suggestions">
              {suggestions.map((p) => (
                <div
                  key={p.admissionNo}
                  className="ipd-suggestion-item"
                  onClick={() => handleSelectPatient(p)}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {p.name} ({p.admissionNo})
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Ward: {p.ward} • Bed: {p.bedNo} • {p.mobile}
                    </div>
                  </div>
                  <span className="ipd-tag-uhid">{p.uhid}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="ipd-btn-search">
          <Icon name="LuSearch" size={16} /> Search
        </button>
        {patient && (
          <button
            type="button"
            className="ipd-btn-outline"
            style={{ color: "#ef4444", borderColor: "#fca5a5" }}
            onClick={handleClearSearch}
          >
            <Icon name="LuTrash2" size={14} /> Clear
          </button>
        )}
      </form>

      {/* Upper Section Grid (Patient Information & Bed Details) */}
      {patient && (
        <div className="ipd-upper-grid">
          {/* Patient Information Card */}
          <div className="ipd-card">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuUserCheck" className="ipd-card-icon" />
                <h2 className="ipd-card-title">Patient Information</h2>
              </div>
              <button
                type="button"
                className="ipd-btn-outline"
                onClick={() => setShowAdmissionSlipModal(true)}
              >
                <Icon name="LuEye" size={14} /> View Full Profile
              </button>
            </div>

            <div className="ipd-patient-info-layout">
              {/* Left Photo & Badges */}
              <div className="ipd-patient-photo-box">
                <img
                  src={patient.avatar}
                  alt={patient.name}
                  className="ipd-patient-img"
                />
                <span className="ipd-tag-uhid">{patient.uhid}</span>
              </div>

              {/* Middle Bio */}
              <div className="ipd-patient-bio">
                <div className="ipd-patient-name-title">
                  <h3 className="ipd-patient-name">{patient.name}</h3>
                </div>

                <div className="ipd-bio-line">
                  <Icon name="LuUser" size={14} /> {patient.age} Years / {patient.gender}
                </div>
                <div className="ipd-bio-line">
                  <Icon name="LuPhone" size={14} /> {patient.mobile}
                </div>
                <div className="ipd-bio-line">
                  <Icon name="LuMapPin" size={14} /> {patient.city}
                </div>
              </div>

            {/* Right Vitals & Admission Details Grid */}
            <div className="ipd-admission-meta-grid">
              <div>
                <span className="ipd-meta-label">🩸 Blood Group:</span>{" "}
                <span className="ipd-meta-val" style={{ color: "#ef4444" }}>
                  {patient.bloodGroup}
                </span>
              </div>
              <div>
                <span className="ipd-meta-label">Admission No.:</span>{" "}
                <span className="ipd-meta-val">{patient.admissionNo}</span>
              </div>

             
              <div>
                <span className="ipd-meta-label">Admission Date:</span>{" "}
                <span className="ipd-meta-val">{patient.admissionDate}</span>
              </div>

             
              <div>
                <span className="ipd-meta-label">Department:</span>{" "}
                <span className="ipd-meta-val">{patient.department}</span>
              </div>

              <div>
                <span className="ipd-meta-label">Consultant:</span>{" "}
                <span className="ipd-meta-val">{patient.consultant}</span>
              </div>
              <div>
                <span className="ipd-meta-label">Ward / Room:</span>{" "}
                <span className="ipd-meta-val">
                  {patient.ward} - {patient.roomNo} ({patient.bedNo})
                </span>
              </div>

              <div>
                <span className="ipd-meta-label">Expected Discharge:</span>{" "}
                <span className="ipd-meta-val">{patient.expectedDischarge}</span>
              </div>
              <div>
                <span className="ipd-meta-label">Status:</span>{" "}
                <span
                  className="ipd-badge-existing"
                  style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                >
                  {patient.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bed & Admission Details Card */}
        <div className="ipd-card">
          <div className="ipd-card-header">
            <div className="ipd-card-title-group">
              <Icon name="LuBed" className="ipd-card-icon" />
              <h2 className="ipd-card-title">Bed & Admission Details</h2>
            </div>
            <button
              type="button"
              className="ipd-btn-outline"
              onClick={() => setShowChangeBedModal(true)}
            >
              <Icon name="LuEdit3" size={14} /> Change Bed
            </button>
          </div>

          <div className="ipd-bed-details-list">
            <div className="ipd-bed-detail-row">
              <span className="ipd-meta-label">Ward</span>
              <span className="ipd-meta-val">{patient.ward}</span>
            </div>
            <div className="ipd-bed-detail-row">
              <span className="ipd-meta-label">Room No.</span>
              <span className="ipd-meta-val">{patient.roomNo}</span>
            </div>
            <div className="ipd-bed-detail-row">
              <span className="ipd-meta-label">Bed No.</span>
              <span className="ipd-meta-val">{patient.bedNo}</span>
            </div>
            <div className="ipd-bed-detail-row">
              <span className="ipd-meta-label">Admission Type</span>
              <span className="ipd-meta-val">{patient.admissionType}</span>
            </div>
            <div className="ipd-bed-detail-row">
              <span className="ipd-meta-label">Rate Plan</span>
              <span className="ipd-meta-val">{patient.ratePlan}</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Main Body Section Grid */}
      <div className="ipd-main-grid">
        {/* Left Column: Add Services & Bill Items */}
        <div className="ipd-col-left">
          {/* Add Services / Charges Card */}
          <div className="ipd-card">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuPlusCircle" className="ipd-card-icon" />
                <h2 className="ipd-card-title">Add Services / Charges</h2>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="ipd-category-pills">
              {Object.keys(CATEGORY_SERVICE_LIST).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`ipd-category-pill ${
                    activeCategory === cat ? "active" : ""
                  }`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Form Controls Row */}
            <div className="ipd-add-service-row">
              <div className="ipd-form-field">
                <label className="ipd-field-label">Service</label>
                <select
                  className="ipd-select-control"
                  value={selectedServiceName}
                  onChange={handleServiceChange}
                >
                  {(CATEGORY_SERVICE_LIST[activeCategory] || []).map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ipd-form-field">
                <label className="ipd-field-label">Rate (₹)</label>
                <input
                  type="number"
                  className="ipd-input-control"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                />
              </div>

              <div className="ipd-form-field">
                <label className="ipd-field-label">Days / Qty</label>
                <input
                  type="number"
                  min="1"
                  className="ipd-input-control"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                />
              </div>

              <div className="ipd-form-field">
                <label className="ipd-field-label">Amount (₹)</label>
                <input
                  type="text"
                  className="ipd-input-control ipd-input-readonly"
                  readOnly
                  value={(Number(rateInput) * Number(qtyInput)).toLocaleString(
                    "en-IN"
                  )}
                />
              </div>

              <button
                type="button"
                className="ipd-btn-add-item"
                onClick={handleAddServiceItem}
              >
                <Icon name="LuPlus" size={16} /> Add
              </button>
            </div>
          </div>

          {/* Bill Items (Current Admission) Card */}
          <div className="ipd-card">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuSlidersHorizontal" className="ipd-card-icon" />
                <h2 className="ipd-card-title">
                  Bill Items (Current Admission)
                </h2>
              </div>
              <button
                type="button"
                className="ipd-btn-remove-selected"
                onClick={handleRemoveSelected}
              >
                <Icon name="LuTrash2" size={14} /> Remove Selected
              </button>
            </div>

            {/* Bill Items Table */}
            <div className="ipd-bill-table-wrapper">
              <table className="ipd-bill-table">
                <thead>
                  <tr>
                    <th style={{ width: 30, textAlign: "center" }}>
                      <input type="checkbox" disabled />
                    </th>
                    <th style={{ width: 30 }}>#</th>
                    <th>Date</th>
                    <th>Service / Item</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Rate (₹)</th>
                    <th style={{ textAlign: "center" }}>Days/Qty</th>
                    <th style={{ textAlign: "right" }}>Amount (₹)</th>
                    <th style={{ textAlign: "center", width: 60 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(!patient || !patient.items || patient.items.length === 0) ? (
                    <tr>
                      <td
                        colSpan="9"
                        style={{
                          textAlign: "center",
                          padding: 20,
                          color: "#64748b",
                        }}
                      >
                        No items added to current IPD bill yet.
                      </td>
                    </tr>
                  ) : (
                    patient.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={!!item.selected}
                            onChange={() => handleToggleSelectItem(item.id)}
                          />
                        </td>
                        <td>{idx + 1}</td>
                        <td>{item.date}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.category}</td>
                        <td style={{ textAlign: "right" }}>
                          {item.rate.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td style={{ textAlign: "center" }}>{item.qty}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {item.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="ipd-btn-icon-action"
                            title="Edit"
                          >
                            <Icon name="LuEdit3" size={14} />
                          </button>
                          <button
                            type="button"
                            className="ipd-btn-icon-action ipd-btn-icon-delete"
                            title="Remove"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Icon name="LuTrash2" size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="ipd-form-field">
              <label className="ipd-field-label">Remarks (Optional)</label>
              <textarea
                className="ipd-remarks-area"
                placeholder="Enter remarks about this billing..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="ipd-left-bottom-actions">
              <button
                type="button"
                className="ipd-btn-outline"
                onClick={() => setShowPrintBillModal(true)}
              >
                <Icon name="LuPrinter" size={15} /> Print Provisional Bill
              </button>
              <button
                type="button"
                className="ipd-btn-outline"
                onClick={() => toast.success("Changes saved successfully!")}
              >
                <Icon name="LuSave" size={15} /> Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Payments, History, Summary, Actions */}
        <div className="ipd-col-right">
          {/* Advance & Payment Details Card */}
          <div className="ipd-card">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuShieldAlert" className="ipd-card-icon" />
                <h2 className="ipd-card-title">Advance & Payment Details</h2>
              </div>
              <button
                type="button"
                className="ipd-btn-receive-pay"
                onClick={() => setShowReceivePayModal(true)}
              >
                <Icon name="LuCreditCard" size={14} /> Receive Payment
              </button>
            </div>

            <div className="ipd-advance-card-body">
              {/* Advance Deposit Box */}
              <div className="ipd-advance-deposit-box">
                <span className="ipd-adv-label">
                  Advance Deposit (At Admission)
                </span>
                <span className="ipd-adv-val">
                  ₹{" "}
                  {totalAdvance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Calculations List */}
              <div className="ipd-adv-calculations">
                <div className="ipd-adv-calc-row">
                  <span>Total Bills (Current)</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>
                    ₹{" "}
                    {totalBills.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="ipd-adv-calc-row">
                  <span>Total Advance</span>
                  <span className="ipd-text-green">
                    (-) ₹{" "}
                    {totalAdvance.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="ipd-adv-calc-row">
                  <span>Total Received Payments</span>
                  <span className="ipd-text-green">
                    (-) ₹{" "}
                    {totalReceived.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="ipd-pending-banner">
                  <span className="ipd-pending-label">Pending Amount</span>
                  <span className="ipd-pending-val">
                    ₹{" "}
                    {pendingAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History Card */}
          <div className="ipd-card">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuHistory" className="ipd-card-icon" />
                <h2 className="ipd-card-title">Payment History</h2>
              </div>
            </div>

            <table className="ipd-history-mini-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Amount (₹)</th>
                  <th>Mode</th>
                  <th>Type</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(!patient || !patient.historyPayments || patient.historyPayments.length === 0) ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 12, color: "#64748b" }}>
                      No payment history available.
                    </td>
                  </tr>
                ) : (
                  patient.historyPayments.map((p, idx) => (
                  <tr key={p.id}>
                    <td>{idx + 1}</td>
                    <td>{p.date}</td>
                    <td style={{ fontWeight: 700 }}>
                      {p.amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>{p.mode}</td>
                    <td>
                      <span
                        className={
                          p.type === "Advance"
                            ? "ipd-pill-advance"
                            : "ipd-pill-payment"
                        }
                      >
                        {p.type}
                      </span>
                    </td>
                    <td style={{ color: "#64748b" }}>{p.remarks}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Current Charges Summary Card */}
          <div className="ipd-card">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuBarChart2" className="ipd-card-icon" />
                <h2 className="ipd-card-title">Current Charges Summary</h2>
              </div>
              <button
                type="button"
                className="ipd-btn-outline"
                style={{ color: "#16a34a", borderColor: "#bbf7d0" }}
                onClick={() => toast.success("Refreshed IPD Charges")}
              >
                <Icon name="LuRefreshCw" size={14} /> Refresh
              </button>
            </div>

            <div className="ipd-summary-cards-grid">
              <div className="ipd-charge-card ipd-charge-card-blue">
                <Icon
                  name="LuBed"
                  size={24}
                  style={{ color: "#2563eb" }}
                />
                <div>
                  <div className="ipd-charge-info-label">Room Charges</div>
                  <div className="ipd-charge-info-val">
                    ₹{" "}
                    {roomChargesTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              <div className="ipd-charge-card ipd-charge-card-green">
                <Icon
                  name="LuUserCheck"
                  size={24}
                  style={{ color: "#16a34a" }}
                />
                <div>
                  <div className="ipd-charge-info-label">Consultation</div>
                  <div className="ipd-charge-info-val">
                    ₹{" "}
                    {consultationTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              <div className="ipd-charge-card ipd-charge-card-orange">
                <Icon
                  name="LuTestTube"
                  size={24}
                  style={{ color: "#ea580c" }}
                />
                <div>
                  <div className="ipd-charge-info-label">Lab Tests</div>
                  <div className="ipd-charge-info-val">
                    ₹{" "}
                    {labTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              <div className="ipd-charge-card ipd-charge-card-purple">
                <Icon
                  name="LuTv"
                  size={24}
                  style={{ color: "#9333ea" }}
                />
                <div>
                  <div className="ipd-charge-info-label">Radiology</div>
                  <div className="ipd-charge-info-val">
                    ₹{" "}
                    {radiologyTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grand Summary Card */}
          <div className="ipd-card">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuFileText" className="ipd-card-icon" />
                <h2 className="ipd-card-title">Grand Summary</h2>
              </div>
              <button type="button" className="ipd-breadcrumb-item" style={{ background: "none", border: "none", fontSize: 12 }}>
                View Detailed Breakup &gt;
              </button>
            </div>

            <div className="ipd-grand-summary-grid">
              <div>
                <div className="ipd-grand-row">
                  <span>Total Charges</span>
                  <span style={{ fontWeight: 700 }}>
                    ₹{" "}
                    {totalBills.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="ipd-grand-row">
                  <span>Total Discount</span>
                  <span style={{ fontWeight: 700 }}>₹ 0.00</span>
                </div>
                <div className="ipd-grand-row" style={{ marginTop: 8 }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>
                    Net Bill Amount
                  </span>
                  <span className="ipd-grand-net-val">
                    ₹{" "}
                    {totalBills.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div>
                <div className="ipd-grand-row">
                  <span>Total Advance</span>
                  <span className="ipd-text-green">
                    ₹{" "}
                    {totalAdvance.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="ipd-grand-row">
                  <span>Total Received</span>
                  <span className="ipd-text-green">
                    ₹{" "}
                    {totalReceived.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="ipd-pending-banner">
                  <span className="ipd-pending-label">Pending Amount</span>
                  <span className="ipd-pending-val">
                    ₹{" "}
                    {pendingAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons Row */}
          <div className="ipd-bottom-actions-row">
            <button
              type="button"
              className="ipd-btn-green-final"
              onClick={() => setShowPrintBillModal(true)}
            >
              <Icon name="LuPrinter" size={18} /> Generate Final Bill
            </button>
            <button
              type="button"
              className="ipd-btn-purple-discharge"
              onClick={() => {
                if (pendingAmount > 0) {
                  toast.error(`Clear pending amount of ₹ ${pendingAmount} before discharge.`);
                } else {
                  toast.success(`Patient ${patient.name} cleared for discharge!`);
                }
              }}
            >
              <Icon name="LuArrowRight" size={18} /> Proceed to Discharge
            </button>
          </div>
        </div>
      </div>

      {/* Receive Payment / Advance Modal */}
      {showReceivePayModal && (
        <div
          className="ipd-modal-backdrop"
          onClick={() => setShowReceivePayModal(false)}
        >
          <div className="ipd-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <h3 className="ipd-modal-title">Record IPD Payment / Initial Charge</h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setShowReceivePayModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="ipd-modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Payment Type</label>
                  <select
                    className="ipd-select-control"
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                  >
                    <option value="Advance">Initial Advance Deposit (At Admission)</option>
                    <option value="Payment">Running Bill Payment</option>
                  </select>
                </div>

                <div className="ipd-form-field">
                  <label className="ipd-field-label">Amount (₹) *</label>
                  <input
                    type="number"
                    className="ipd-input-control"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>

                <div className="ipd-form-field">
                  <label className="ipd-field-label">Payment Mode</label>
                  <select
                    className="ipd-select-control"
                    value={paymentForm.mode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Insurance / TPA">TPA Claim</option>
                  </select>
                </div>

                <div className="ipd-form-field">
                  <label className="ipd-field-label">Remarks / Note</label>
                  <input
                    type="text"
                    className="ipd-input-control"
                    placeholder="e.g. Initial deposit at admission"
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="ipd-modal-footer">
                <button
                  type="button"
                  className="ipd-btn-outline"
                  onClick={() => setShowReceivePayModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="ipd-btn-search">
                  <Icon name="LuSave" size={16} /> Collect & Save Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Bed Modal */}
      {showChangeBedModal && (
        <div
          className="ipd-modal-backdrop"
          onClick={() => setShowChangeBedModal(false)}
        >
          <div className="ipd-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <h3 className="ipd-modal-title">Change Bed / Transfer Ward</h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setShowChangeBedModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBedChange}>
              <div className="ipd-modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Select Target Ward</label>
                  <select
                    className="ipd-select-control"
                    value={bedForm.ward}
                    onChange={(e) => setBedForm({ ...bedForm, ward: e.target.value })}
                  >
                    <option value="General Ward">General Ward (₹1,500/day)</option>
                    <option value="Semi-Private Room">Semi-Private Room (₹2,500/day)</option>
                    <option value="Private AC Room">Private AC Room (₹4,000/day)</option>
                    <option value="ICU">ICU Bed (₹5,500/day)</option>
                  </select>
                </div>

                <div className="ipd-form-field">
                  <label className="ipd-field-label">Room Number</label>
                  <input
                    type="text"
                    className="ipd-input-control"
                    value={bedForm.roomNo}
                    onChange={(e) => setBedForm({ ...bedForm, roomNo: e.target.value })}
                  />
                </div>

                <div className="ipd-form-field">
                  <label className="ipd-field-label">Bed Number</label>
                  <input
                    type="text"
                    className="ipd-input-control"
                    value={bedForm.bedNo}
                    onChange={(e) => setBedForm({ ...bedForm, bedNo: e.target.value })}
                  />
                </div>
              </div>

              <div className="ipd-modal-footer">
                <button
                  type="button"
                  className="ipd-btn-outline"
                  onClick={() => setShowChangeBedModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="ipd-btn-search">
                  Update Bed Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Profile & Admission Print Slip Modal */}
      {showAdmissionSlipModal && patient && (
        <div
          className="ipd-modal-backdrop"
          onClick={() => setShowAdmissionSlipModal(false)}
        >
          <div className="ipd-modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <h3 className="ipd-modal-title">IPD Admission Print Slip</h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setShowAdmissionSlipModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="ipd-modal-body">
              <div className="ipd-printable-voucher">
                <div className="ipd-voucher-header">
                  <div className="ipd-voucher-logo">
                    <Icon name="LuPlus" size={20} /> K. G. Nanda Hospital
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Chandauli, Uttar Pradesh</div>
                  <div className="ipd-voucher-tag">IPD ADMISSION INITIAL SLIP</div>
                </div>

                <div className="ipd-voucher-meta">
                  <div><strong>Admission No.</strong>: {patient.admissionNo}</div>
                  <div><strong>Admission Date</strong>: {patient.admissionDate}</div>
                  <div><strong>UHID</strong>: {patient.uhid}</div>
                  <div><strong>Patient Name</strong>: {patient.name}</div>
                  <div><strong>Age / Gender</strong>: {patient.age} Y / {patient.gender}</div>
                  <div><strong>Mobile No.</strong>: {patient.mobile}</div>
                  <div><strong>Doctor</strong>: {patient.consultant}</div>
                  <div><strong>Ward / Bed</strong>: {patient.ward} ({patient.bedNo})</div>
                </div>

                <div className="ipd-voucher-grand">
                  <div className="ipd-voucher-row">
                    <span>Initial Deposit Paid:</span>
                    <span style={{ fontWeight: 800, color: "#16a34a" }}>₹ {totalAdvance.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="ipd-voucher-footer">
                  <div>--- Admission Slip Recorded ---</div>
                  <div>Get Well Soon</div>
                </div>
              </div>
            </div>

            <div className="ipd-modal-footer">
              <button
                type="button"
                className="ipd-btn-outline"
                onClick={() => setShowAdmissionSlipModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="ipd-btn-search"
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={16} /> Print Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provisional / Final Bill Printable Receipt Modal */}
      {showPrintBillModal && patient && (
        <div
          className="ipd-modal-backdrop"
          onClick={() => setShowPrintBillModal(false)}
        >
          <div className="ipd-modal-box" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <h3 className="ipd-modal-title">IPD Provisional / Final Bill Voucher</h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setShowPrintBillModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="ipd-modal-body">
              <div className="ipd-printable-voucher">
                <div className="ipd-voucher-header">
                  <div className="ipd-voucher-logo">
                    <Icon name="LuPlus" size={20} /> K. G. Nanda Hospital
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Chandauli, Uttar Pradesh • +91 9876543210</div>
                  <div className="ipd-voucher-tag">INPATIENT (IPD) FINAL BILL</div>
                </div>

                <div className="ipd-voucher-meta">
                  <div><strong>Admission No.</strong>: {patient.admissionNo}</div>
                  <div><strong>UHID</strong>: {patient.uhid}</div>
                  <div><strong>Patient Name</strong>: {patient.name}</div>
                  <div><strong>Age / Gender</strong>: {patient.age} Y / {patient.gender}</div>
                  <div><strong>Ward / Bed</strong>: {patient.ward} - {patient.bedNo}</div>
                  <div><strong>Doctor</strong>: {patient.consultant}</div>
                </div>

                <table className="ipd-voucher-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Service Description</th>
                      <th style={{ textAlign: "center" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.name}</td>
                        <td style={{ textAlign: "center" }}>{item.qty}</td>
                        <td style={{ textAlign: "right" }}>{item.amount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="ipd-voucher-grand">
                  <div className="ipd-voucher-row">
                    <span>Total Charges:</span>
                    <span>₹ {totalBills.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="ipd-voucher-row">
                    <span>Total Paid (Advance + Payments):</span>
                    <span style={{ color: "#16a34a" }}>(-) ₹ {totalPaymentsReceivedAll.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="ipd-voucher-row" style={{ fontWeight: 800, fontSize: 13, color: pendingAmount > 0 ? "#dc2626" : "#16a34a" }}>
                    <span>Pending Due Amount:</span>
                    <span>₹ {pendingAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="ipd-voucher-footer">
                  <div>--- Thank You ---</div>
                  <div>Wish You A Speedy Recovery</div>
                </div>
              </div>
            </div>

            <div className="ipd-modal-footer">
              <button
                type="button"
                className="ipd-btn-outline"
                onClick={() => setShowPrintBillModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="ipd-btn-green-final"
                style={{ padding: "8px 16px" }}
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={16} /> Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
