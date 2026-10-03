import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import "./OPDBilling.css";

// Comprehensive Mock Data matching hospital specs
const SAMPLE_PATIENTS = [
  {
    uhid: "UHID12345",
    name: "Rohit Kumar",
    age: 28,
    gender: "Male",
    mobile: "9876543210",
    city: "Varanasi, Uttar Pradesh",
    bloodGroup: "B+",
    allergies: "NKA",
    history: "Hypertension",
    totalVisits: 6,
    lastDoctor: "Dr. Amit Sharma",
    department: "General Medicine",
    lastVisit: "29-09-2026",
    status: "Active",
    type: "OPD",
    visits: [
      { date: "29-09-2026", dept: "General Medicine", doctor: "Dr. Amit Sharma", amount: 1200 },
      { date: "12-08-2026", dept: "General Medicine", doctor: "Dr. Amit Sharma", amount: 800 },
      { date: "15-06-2026", dept: "Cardiology", doctor: "Dr. R. Singh", amount: 950 },
      { date: "20-04-2026", dept: "General Medicine", doctor: "Dr. Amit Sharma", amount: 700 },
      { date: "10-02-2026", dept: "Radiology", doctor: "Dr. P. Verma", amount: 1050 },
    ],
  },
  {
    uhid: "UHID67890",
    name: "Priya Sharma",
    age: 32,
    gender: "Female",
    mobile: "9876512345",
    city: "Lucknow, Uttar Pradesh",
    bloodGroup: "O+",
    allergies: "Penicillin",
    history: "Asthma",
    totalVisits: 3,
    lastDoctor: "Dr. R. Singh",
    department: "Cardiology",
    lastVisit: "15-09-2026",
    status: "Active",
    type: "OPD",
    visits: [
      { date: "15-09-2026", dept: "Cardiology", doctor: "Dr. R. Singh", amount: 1500 },
      { date: "02-05-2026", dept: "General Medicine", doctor: "Dr. Amit Sharma", amount: 600 },
    ],
  },
  {
    uhid: "UHID11223",
    name: "Sunil Verma",
    age: 45,
    gender: "Male",
    mobile: "9123456789",
    city: "Kanpur, Uttar Pradesh",
    bloodGroup: "A+",
    allergies: "None",
    history: "Diabetes Type 2",
    totalVisits: 8,
    lastDoctor: "Dr. P. Verma",
    department: "Radiology",
    lastVisit: "20-09-2026",
    status: "Active",
    type: "OPD",
    visits: [
      { date: "20-09-2026", dept: "Radiology", doctor: "Dr. P. Verma", amount: 1100 },
      { date: "11-07-2026", dept: "Orthopedics", doctor: "Dr. Anand Kulkarni", amount: 900 },
    ],
  },
  {
    uhid: "UHID44321",
    name: "Ananya Gupta",
    age: 24,
    gender: "Female",
    mobile: "9988776655",
    city: "Chandauli, Uttar Pradesh",
    bloodGroup: "AB+",
    allergies: "Dust",
    history: "Thyroid",
    totalVisits: 2,
    lastDoctor: "Dr. Meenakshi Iyer",
    department: "Obstetrics & Gynecology",
    lastVisit: "25-09-2026",
    status: "Active",
    type: "OPD",
    visits: [
      { date: "25-09-2026", dept: "Gynecology", doctor: "Dr. Meenakshi Iyer", amount: 800 },
    ],
  },
];

const CATEGORY_SERVICES = {
  Consultation: [
    { name: "Consultation Fee (General Physician)", rate: 500 },
    { name: "Specialist Doctor Consultation", rate: 800 },
    { name: "Emergency Casualty Consultation", rate: 1000 },
    { name: "Follow-up Consultation", rate: 300 },
  ],
  "Lab Test": [
    { name: "CBC (Complete Blood Count)", rate: 300 },
    { name: "Liver Function Test (LFT)", rate: 650 },
    { name: "Kidney Function Test (KFT)", rate: 700 },
    { name: "Blood Sugar (RBS)", rate: 120 },
    { name: "Thyroid Profile (T3, T4, TSH)", rate: 550 },
  ],
  Radiology: [
    { name: "X-Ray Chest PA View", rate: 400 },
    { name: "Ultrasound Abdomen & Pelvis", rate: 1200 },
    { name: "CT Scan Brain (Plain)", rate: 2500 },
    { name: "MRI Knee Joint", rate: 4500 },
  ],
  Procedure: [
    { name: "Dressing / Wound Cleaning", rate: 250 },
    { name: "ECG (12 Lead)", rate: 350 },
    { name: "Nebulization (Per Session)", rate: 150 },
    { name: "IV Infusion / Injection Charges", rate: 200 },
  ],
  Medicine: [
    { name: "Paracetamol 650mg (1 Strip)", rate: 35 },
    { name: "Pan-D Capsule (1 Strip)", rate: 140 },
    { name: "Augmentin 625 Duo (1 Strip)", rate: 210 },
    { name: "Azithral 500mg (1 Strip)", rate: 125 },
  ],
  Others: [
    { name: "Registration Fee", rate: 100 },
    { name: "Ambulance Charges", rate: 800 },
    { name: "Medical Report Processing", rate: 150 },
  ],
};

export default function OPDBilling() {
  // Search and Patient States
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Service Selection States
  const [activeCategory, setActiveCategory] = useState("Consultation");
  const [selectedServiceName, setSelectedServiceName] = useState("Consultation Fee (General Physician)");
  const [rateInput, setRateInput] = useState(500);
  const [qtyInput, setQtyInput] = useState(1);
  const [discountInput, setDiscountInput] = useState(0);

  // Bill Items State (Default matching screenshot)
  const [billItems, setBillItems] = useState([
    {
      id: 1,
      name: "Consultation Fee (General Physician)",
      category: "Consultation",
      rate: 500,
      qty: 1,
      discount: 0,
      amount: 500,
    },
    {
      id: 2,
      name: "CBC (Complete Blood Count)",
      category: "Lab Test",
      rate: 300,
      qty: 1,
      discount: 0,
      amount: 300,
    },
    {
      id: 3,
      name: "X-Ray Chest PA View",
      category: "Radiology",
      rate: 400,
      qty: 1,
      discount: 0,
      amount: 400,
    },
  ]);

  // Remarks & Payment States
  const [remarks, setRemarks] = useState("Patient advised for routine tests and follow-up after 1 week.");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [receivedAmount, setReceivedAmount] = useState("1200");

  // Print Options Checkboxes
  const [printBill, setPrintBill] = useState(true);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  // Modal Controls
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    mobile: "",
    city: "Varanasi, Uttar Pradesh",
    bloodGroup: "B+",
    allergies: "NKA",
    history: "None",
    department: "General Medicine",
    doctor: "Dr. Amit Sharma",
  });

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (query.trim().length > 0) {
      const filtered = SAMPLE_PATIENTS.filter(
        (p) =>
          p.uhid.toLowerCase().includes(query.toLowerCase()) ||
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.mobile.includes(query)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
      setSelectedPatient(null);
    }
  };

  // Select Patient from Search/Suggestions
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm(patient.uhid);
    setSuggestions([]);
    toast.success(`Fetched data for ${patient.name} (${patient.uhid})`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchTerm.trim().toLowerCase();
    const found = SAMPLE_PATIENTS.find(
      (p) =>
        p.uhid.toLowerCase() === query ||
        p.name.toLowerCase().includes(query) ||
        p.mobile.includes(query)
    );
    if (found) {
      handleSelectPatient(found);
    } else {
      toast.error("No patient found with provided details.");
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSuggestions([]);
    setSelectedPatient(null);
  };

  // Handle Category Switch
  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    const services = CATEGORY_SERVICES[cat] || [];
    if (services.length > 0) {
      setSelectedServiceName(services[0].name);
      setRateInput(services[0].rate);
    }
  };

  // Handle Service Dropdown Change
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
  const handleAddBillItem = () => {
    if (!selectedServiceName) {
      toast.error("Please select a service.");
      return;
    }
    const rate = Number(rateInput) || 0;
    const qty = Number(qtyInput) || 1;
    const disc = Number(discountInput) || 0;
    const amt = rate * qty - disc;

    const newItem = {
      id: Date.now(),
      name: selectedServiceName,
      category: activeCategory,
      rate,
      qty,
      discount: disc,
      amount: amt > 0 ? amt : 0,
    };

    setBillItems([...billItems, newItem]);
    toast.success(`Added ${selectedServiceName} to bill.`);
  };

  // Remove Individual Bill Item
  const handleRemoveItem = (id) => {
    setBillItems(billItems.filter((i) => i.id !== id));
  };

  // Remove All Items
  const handleRemoveAll = () => {
    setBillItems([]);
    toast("All bill items removed.", { icon: "🗑️" });
  };

  // Calculate Totals
  const grossTotal = billItems.reduce((acc, curr) => acc + curr.rate * curr.qty, 0);
  const totalDiscount = billItems.reduce((acc, curr) => acc + Number(curr.discount || 0), 0);
  const netAmount = Math.max(0, grossTotal - totalDiscount);
  const numericReceived = Number(receivedAmount) || 0;
  const balance = Math.max(0, netAmount - numericReceived);

  // Sync Received Amount when netAmount changes if needed
  useEffect(() => {
    setReceivedAmount(netAmount.toString());
  }, [netAmount]);

  // Handle Generate Bill
  const handleGenerateBill = (e) => {
    if (e) e.preventDefault();
    if (!selectedPatient) {
      toast.error("Please search and select a patient first.");
      return;
    }
    if (billItems.length === 0) {
      toast.error("Please add at least one item to the bill.");
      return;
    }
    setShowPrintModal(true);
    toast.success(`Bill generated for ${selectedPatient.name}!`, { icon: "🧾" });
  };

  // Handle Create New Patient
  const handleSaveNewPatient = (e) => {
    e.preventDefault();
    if (!newPatientForm.name || !newPatientForm.mobile) {
      toast.error("Please enter Patient Name and Mobile Number.");
      return;
    }
    const newUhid = `UHID${Math.floor(10000 + Math.random() * 90000)}`;
    const created = {
      ...newPatientForm,
      uhid: newUhid,
      age: Number(newPatientForm.age) || 30,
      totalVisits: 1,
      lastDoctor: newPatientForm.doctor,
      lastVisit: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
      status: "Active",
      type: "OPD",
      visits: [
        {
          date: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
          dept: newPatientForm.department,
          doctor: newPatientForm.doctor,
          amount: netAmount,
        },
      ],
    };

    SAMPLE_PATIENTS.unshift(created);
    handleSelectPatient(created);
    setShowNewPatientModal(false);
    toast.success(`New Patient Registered! Assigned UHID: ${newUhid}`);
  };

  return (
    <div className="opd-billing-page">
      {/* Top Header & Breadcrumbs */}
      <div className="opd-page-header">
        <div className="opd-header-left">
          <div className="opd-header-icon-box">
            <Icon name="LuReceipt" size={24} />
          </div>
          <div>
            <h1 className="opd-header-title">OPD Billing</h1>
            <p className="opd-header-subtitle">Generate OPD consultation and service bills</p>
          </div>
        </div>

        <div className="opd-breadcrumb">
          <span className="opd-breadcrumb-item">Home</span>
          <span>&gt;</span>
          <span className="opd-breadcrumb-item">Billing</span>
          <span>&gt;</span>
          <span className="opd-breadcrumb-active">OPD Billing</span>
        </div>
      </div>

      {/* Top Section Grid (Patient Search & Recent Visit History) */}
      <div className="opd-top-grid">
        {/* Search Patient Card */}
        <div className="opd-card">
          <div className="opd-card-header">
            <div className="opd-card-title-group">
              <Icon name="LuUserCheck" className="opd-card-icon" />
              <h2 className="opd-card-title">Search Patient</h2>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              
              <button type="button" className="opd-btn-clear" onClick={handleClearSearch}>
                <Icon name="LuTrash2" size={14} /> Clear
              </button>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="opd-search-bar-row">
            <div className="opd-search-input-wrap">
              <Icon name="LuSearch" size={16} className="opd-search-icon" />
              <input
                type="text"
                className="opd-search-input"
                placeholder="Search by UHID, Name or Mobile..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {suggestions.length > 0 && (
                <div className="opd-search-suggestions">
                  {suggestions.map((p) => (
                    <div
                      key={p.uhid}
                      className="opd-suggestion-item"
                      onClick={() => handleSelectPatient(p)}
                    >
                      <div>
                        <div className="opd-suggestion-name">{p.name}</div>
                        <div className="opd-suggestion-meta">
                          {p.age} Y / {p.gender} • {p.mobile}
                        </div>
                      </div>
                      <span className="opd-uhid-badge">{p.uhid}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="opd-btn-search">
              <Icon name="LuSearch" size={16} /> Search
            </button>
          </form>

          {/* Active Patient Summary */}
          {selectedPatient && (
            <div className="opd-patient-banner">
              {/* Left Avatar & UHID */}
              <div className="opd-patient-avatar-box">
                <div className="opd-avatar-circle">
                  <Icon name="LuUser" size={36} />
                </div>
                <span className="opd-uhid-badge">{selectedPatient.uhid}</span>
              </div>

              {/* Middle Info */}
              <div className="opd-patient-main-info">
                <div className="opd-patient-name-row">
                  <h3 className="opd-patient-name">{selectedPatient.name}</h3>
                  <span className="opd-badge-opd">OPD</span>
                  <span className="opd-badge-active">Active</span>
                </div>
                <div className="opd-patient-detail-line">
                  <Icon name="LuUser" size={14} /> {selectedPatient.age} Years / {selectedPatient.gender} | {selectedPatient.mobile}
                </div>
                <div className="opd-patient-detail-line">
                  <Icon name="LuMapPin" size={14} /> {selectedPatient.city}
                </div>
                <div className="opd-patient-detail-line">
                  <Icon name="LuCalendar" size={14} /> Last Visit: {selectedPatient.lastVisit}
                </div>
              </div>

              {/* Right Vitals & History Grid */}
              <div className="opd-patient-vitals-grid">
                <div className="opd-vital-item">
                  <Icon name="LuDroplet" size={16} className="opd-vital-icon" style={{ color: "#ef4444" }} />
                  <div>
                    <div className="opd-vital-label">Blood Group</div>
                    <div className="opd-vital-val" style={{ color: "#ef4444" }}>{selectedPatient.bloodGroup}</div>
                  </div>
                </div>

                <div className="opd-vital-item">
                  <Icon name="LuCalendar" size={16} className="opd-vital-icon" style={{ color: "#2563eb" }} />
                  <div>
                    <div className="opd-vital-label">Total Visits</div>
                    <div className="opd-vital-val">{selectedPatient.totalVisits}</div>
                  </div>
                </div>

                <div className="opd-vital-item">
                  <Icon name="LuShieldAlert" size={16} className="opd-vital-icon" style={{ color: "#16a34a" }} />
                  <div>
                    <div className="opd-vital-label">Allergies</div>
                    <div className="opd-vital-val">{selectedPatient.allergies}</div>
                  </div>
                </div>

                <div className="opd-vital-item">
                  <Icon name="LuStethoscope" size={16} className="opd-vital-icon" style={{ color: "#2563eb" }} />
                  <div>
                    <div className="opd-vital-label">Last Doctor</div>
                    <div className="opd-vital-val">{selectedPatient.lastDoctor}</div>
                  </div>
                </div>

                <div className="opd-vital-item">
                  <Icon name="LuActivity" size={16} className="opd-vital-icon" style={{ color: "#ef4444" }} />
                  <div>
                    <div className="opd-vital-label">Known History</div>
                    <div className="opd-vital-val">{selectedPatient.history}</div>
                  </div>
                </div>

                <div className="opd-vital-item">
                  <Icon name="LuBuilding2" size={16} className="opd-vital-icon" style={{ color: "#2563eb" }} />
                  <div>
                    <div className="opd-vital-label">Department</div>
                    <div className="opd-vital-val">{selectedPatient.department}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

     
      </div>

      {/* Main Body Section Grid */}
      <div className="opd-main-grid">
        {/* Left Column: Add Service & Bill Items */}
        <div className="opd-col-left">
          {/* Add Service / Item Card */}
          <div className="opd-card">
            <div className="opd-card-header">
              <div className="opd-card-title-group">
                <Icon name="LuUserPlus" className="opd-card-icon" />
                <h2 className="opd-card-title">Add Service / Item</h2>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="opd-category-pills">
              {Object.keys(CATEGORY_SERVICES).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`opd-category-pill ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Service Form Row */}
            <div className="opd-add-service-row">
              <div className="opd-form-field">
                <label className="opd-field-label">Service</label>
                <select
                  className="opd-select-control"
                  value={selectedServiceName}
                  onChange={handleServiceChange}
                >
                  {(CATEGORY_SERVICES[activeCategory] || []).map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="opd-form-field">
                <label className="opd-field-label">Rate (₹)</label>
                <input
                  type="number"
                  className="opd-input-control"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                />
              </div>

              <div className="opd-form-field">
                <label className="opd-field-label">Qty</label>
                <input
                  type="number"
                  min="1"
                  className="opd-input-control"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                />
              </div>

              <div className="opd-form-field">
                <label className="opd-field-label">Discount (₹)</label>
                <input
                  type="number"
                  className="opd-input-control"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                />
              </div>

              <button type="button" className="opd-btn-add-item" onClick={handleAddBillItem}>
                <Icon name="LuPlus" size={16} /> Add
              </button>
            </div>
          </div>

          {/* Bill Items Card */}
          <div className="opd-card">
            <div className="opd-card-header">
              <div className="opd-card-title-group">
                <Icon name="LuSlidersHorizontal" className="opd-card-icon" />
                <h2 className="opd-card-title">Bill Items ({billItems.length})</h2>
              </div>
              {billItems.length > 0 && (
                <button type="button" className="opd-btn-remove-all" onClick={handleRemoveAll}>
                  <Icon name="LuTrash2" size={14} /> Remove All
                </button>
              )}
            </div>

            {/* Bill Items Table */}
            <div className="opd-bill-table-wrapper">
              <table className="opd-bill-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th>Service / Item</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Rate (₹)</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Discount (₹)</th>
                    <th style={{ textAlign: "right" }}>Amount (₹)</th>
                    <th style={{ textAlign: "center", width: 40 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                        No bill items added. Use the section above to add services.
                      </td>
                    </tr>
                  ) : (
                    billItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.category}</td>
                        <td style={{ textAlign: "right" }}>{Number(item.rate).toFixed(2)}</td>
                        <td style={{ textAlign: "center" }}>{item.qty}</td>
                        <td style={{ textAlign: "right" }}>{Number(item.discount || 0).toFixed(2)}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {(item.rate * item.qty - (item.discount || 0)).toFixed(2)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="opd-btn-remove"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remove Item"
                          >
                            <Icon name="LuTrash2" size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Remarks & Total Calculations */}
            <div className="opd-bill-footer-row">
              <div className="opd-form-field">
                <label className="opd-field-label">Remarks (Optional)</label>
                <textarea
                  className="opd-remarks-area"
                  placeholder="Add any additional instructions or remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="opd-summary-box">
                <div className="opd-summary-row">
                  <span>Total Amount</span>
                  <span className="opd-summary-val">
                    ₹ {grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="opd-summary-row">
                  <span>Discount</span>
                  <span className="opd-summary-val">
                    ₹ {totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="opd-net-amount-banner">
                  <span className="opd-net-label">Net Amount</span>
                  <span className="opd-net-val">
                    ₹ {netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Details & Bill Preview */}
        <div className="opd-col-right">
          {/* Payment Details Card */}
          <div className="opd-card">
            <div className="opd-card-header">
              <div className="opd-card-title-group">
                <Icon name="LuCreditCard" className="opd-card-icon" />
                <h2 className="opd-card-title">Payment Details</h2>
              </div>
            </div>

            <form onSubmit={handleGenerateBill} className="opd-payment-form">
              <div className="opd-form-field">
                <label className="opd-field-label">Payment Mode</label>
                <select
                  className="opd-select-control"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="TPA / Insurance">TPA / Health Insurance</option>
                </select>
              </div>

              <div className="opd-form-field">
                <label className="opd-field-label">Received Amount (₹)</label>
                <input
                  type="number"
                  className="opd-input-control"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                />
              </div>

              <div className="opd-form-field">
                <label className="opd-field-label">Balance (₹)</label>
                <div className="opd-balance-box">
                  {balance.toFixed(2)}
                </div>
              </div>

              {/* Print Options */}
              <div className="opd-print-options-group">
                <div className="opd-section-subtitle">
                  <Icon name="LuPrinter" size={15} /> Print Options
                </div>

                <div className="opd-checkbox-grid">
                  <label className="opd-checkbox-label">
                    <input
                      type="checkbox"
                      className="opd-checkbox-input"
                      checked={printBill}
                      onChange={(e) => setPrintBill(e.target.checked)}
                    />
                    Print Bill
                  </label>

                  <label className="opd-checkbox-label">
                    <input
                      type="checkbox"
                      className="opd-checkbox-input"
                      checked={printReceipt}
                      onChange={(e) => setPrintReceipt(e.target.checked)}
                    />
                    Print Receipt
                  </label>

                 

                
                </div>
              </div>

              <button type="submit" className="opd-btn-generate">
                <Icon name="LuPrinter" size={18} /> Generate Bill (F5)
              </button>

              <div className="opd-actions-row">
                <button
                  type="button"
                  className="opd-btn-outline-blue"
                  onClick={() => setShowPrintModal(true)}
                >
                  <Icon name="LuEye" size={15} /> Preview
                </button>

                <button
                  type="button"
                  className="opd-btn-outline-red"
                  onClick={handleClearSearch}
                >
                  <Icon name="LuX" size={15} /> Cancel
                </button>
              </div>
            </form>
          </div>

          
        </div>
      </div>

      {/* New Patient Registration Modal */}
      {showNewPatientModal && (
        <div className="opd-modal-backdrop" onClick={() => setShowNewPatientModal(false)}>
          <div className="opd-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="opd-modal-header">
              <h3 className="opd-modal-title">Register New OPD Patient</h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setShowNewPatientModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewPatient}>
              <div className="opd-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="opd-form-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="opd-field-label">Patient Full Name *</label>
                  <input
                    type="text"
                    className="opd-input-control"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newPatientForm.name}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                  />
                </div>

                <div className="opd-form-field">
                  <label className="opd-field-label">Age (Years)</label>
                  <input
                    type="number"
                    className="opd-input-control"
                    placeholder="25"
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                  />
                </div>

                <div className="opd-form-field">
                  <label className="opd-field-label">Gender</label>
                  <select
                    className="opd-select-control"
                    value={newPatientForm.gender}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="opd-form-field">
                  <label className="opd-field-label">Mobile Number *</label>
                  <input
                    type="tel"
                    className="opd-input-control"
                    required
                    placeholder="9876543210"
                    value={newPatientForm.mobile}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, mobile: e.target.value })}
                  />
                </div>

                <div className="opd-form-field">
                  <label className="opd-field-label">Blood Group</label>
                  <select
                    className="opd-select-control"
                    value={newPatientForm.bloodGroup}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, bloodGroup: e.target.value })}
                  >
                    <option value="B+">B+</option>
                    <option value="A+">A+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="B-">B-</option>
                    <option value="A-">A-</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="opd-form-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="opd-field-label">City / Address</label>
                  <input
                    type="text"
                    className="opd-input-control"
                    value={newPatientForm.city}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="opd-modal-footer">
                <button
                  type="button"
                  className="opd-btn-outline-red"
                  onClick={() => setShowNewPatientModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="opd-btn-search">
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showPrintModal && (
        <div className="opd-modal-backdrop" onClick={() => setShowPrintModal(false)}>
          <div className="opd-modal-box" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="opd-modal-header">
              <h3 className="opd-modal-title">Receipt Ready to Print</h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setShowPrintModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="opd-modal-body opd-print-container">
              <div className="opd-preview-ticket" style={{ boxShadow: "none", border: "1px dashed #cbd5e1" }}>
                <div className="opd-ticket-header">
                  <div className="opd-ticket-logo-row">
                    <Icon name="LuPlus" size={20} style={{ color: "#0284c7" }} /> K. G. Nanda Hospital
                  </div>
                  <div className="opd-ticket-address">Chandauli, Uttar Pradesh</div>
                  <div className="opd-ticket-address">+91 9876543210</div>
                  <div className="opd-ticket-title-tag">OPD BILL RECEIPT</div>
                </div>

                <div className="opd-ticket-meta-grid">
                  <div><strong>Bill No.</strong> : OPD202609291001</div>
                  <div><strong>Date</strong> : 29-09-2026 11:30 AM</div>
                  <div><strong>UHID</strong> : {selectedPatient?.uhid}</div>
                  <div><strong>Patient</strong> : {selectedPatient?.name}</div>
                  <div><strong>Mode</strong> : {paymentMode}</div>
                  <div><strong>Status</strong> : PAID</div>
                </div>

                <table className="opd-ticket-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th style={{ textAlign: "center" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.name}</td>
                        <td style={{ textAlign: "center" }}>{item.qty}</td>
                        <td style={{ textAlign: "right" }}>{(item.rate * item.qty - (item.discount || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="opd-ticket-totals">
                  <div className="opd-ticket-grand-row">
                    <span>TOTAL PAID</span>
                    <span>₹ {netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="opd-modal-footer">
              <button
                type="button"
                className="opd-btn-outline-red"
                onClick={() => setShowPrintModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="opd-btn-generate"
                style={{ width: "auto", margin: 0, padding: "8px 16px" }}
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={16} /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
