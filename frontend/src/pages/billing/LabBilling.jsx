import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import patientService from "../../api/services/patientService";
import "./LabBilling.css";

// Test Catalog List
const ALL_LAB_TESTS = [
  { id: "t1", name: "CBC (Complete Blood Count)", category: "Common Tests", price: 300 },
  { id: "t2", name: "ESR", category: "Hematology", price: 100 },
  { id: "t3", name: "Blood Sugar (FBS)", category: "Biochemistry", price: 120 },
  { id: "t4", name: "Blood Sugar (PPBS)", category: "Biochemistry", price: 120 },
  { id: "t5", name: "HbA1c", category: "Biochemistry", price: 350 },
  { id: "t6", name: "Lipid Profile", category: "Biochemistry", price: 700 },
  { id: "t7", name: "Liver Function Test (LFT)", category: "Biochemistry", price: 800 },
  { id: "t8", name: "Kidney Function Test (KFT)", category: "Biochemistry", price: 700 },
  { id: "t9", name: "Thyroid Profile (T3, T4, TSH)", category: "Hormones", price: 600 },
  { id: "t10", name: "Vitamin D 25-OH", category: "Hormones", price: 1200 },
];

const PREVIOUS_BILLS = [
  { date: "26 Oct 2026", billNo: "LAB-26-0041", testName: "Complete Blood Count (CBC)", amount: 350, status: "Reported" },
  { date: "24 Oct 2026", billNo: "LAB-26-0028", testName: "Lipid Profile & Serum Creatinine", amount: 950, status: "Reported" },
  { date: "20 Oct 2026", billNo: "LAB-26-0012", testName: "Liver Function Test (LFT)", amount: 800, status: "Reported" },
];

export default function LabBilling() {
  // Search state
  const [searchBy, setSearchBy] = useState("UHID");
  const [searchInput, setSearchInput] = useState("");
  const [patient, setPatient] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);

  // Category filter state
  const [activeCategory, setActiveCategory] = useState("Common Tests");
  const [testSearch, setTestSearch] = useState("");

  // Selected tests state (Starts clean and empty)
  const [selectedTests, setSelectedTests] = useState([]);

  const [clinicalNotes, setClinicalNotes] = useState("");

  // Payment form state
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [discount, setDiscount] = useState(0);

  // Print / Options checkboxes
  const [printBill, setPrintBill] = useState(true);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  // Printable modal state
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hims_pathology_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentVisits(
            parsed.slice(0, 5).map((o) => ({
              date: o.requestDate || "Today",
              testName: o.testName || "Lab Test",
              amount: o.totalAmount || 0,
              status: o.status || "Completed",
            }))
          );
        }
      }
    } catch (e) {}
  }, []);

  // Handlers
  const handleSearchPatient = async (e) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) {
      toast.error("Please enter UHID, Mobile, or Name to search");
      return;
    }
    try {
      const res = await patientService.getAll({ search: searchInput.trim() });
      const list = res?.data || res || [];
      const q = searchInput.trim().toLowerCase();
      const match = Array.isArray(list)
        ? list.find(
            (p) =>
              (p.uhid && p.uhid.toLowerCase().includes(q)) ||
              (p.phone && p.phone.includes(q)) ||
              (p.mobile && p.mobile.includes(q)) ||
              (p.full_name && p.full_name.toLowerCase().includes(q)) ||
              (p.first_name && p.first_name.toLowerCase().includes(q))
          ) || list[0]
        : null;

      if (match) {
        const fullName = match.full_name || `${match.first_name || ""} ${match.last_name || ""}`.trim() || "Patient";
        setPatient({
          id: match.id,
          name: fullName,
          uhid: match.uhid || "—",
          age: match.age || "—",
          gender: match.gender || "—",
          phone: match.phone || match.mobile || "—",
          address: match.address || match.city || "Varanasi",
          bloodGroup: match.blood_group || "—",
          lastVisit: match.created_at ? new Date(match.created_at).toLocaleDateString("en-GB") : "—",
          allergies: "NKA",
          referredBy: "Self / Walk-in",
          knownHistory: match.medical_history || "None reported",
          patientType: match.category || "OPD",
          department: match.department || "General Medicine",
          doctor: match.doctor_name || "Consultant",
        });
        toast.success(`Patient ${fullName} loaded!`);
      } else {
        setPatient(null);
        toast.error("No patient found with this search");
      }
    } catch (err) {
      toast.error("Search failed");
    }
  };

  const handleClear = () => {
    setSearchInput("");
    setPatient(null);
    setSelectedTests([]);
    setDiscount(0);
    setClinicalNotes("");
  };

  const handleToggleTest = (test) => {
    const exists = selectedTests.find((item) => item.id === test.id);
    if (exists) {
      setSelectedTests(selectedTests.filter((item) => item.id !== test.id));
    } else {
      setSelectedTests([
        ...selectedTests,
        { id: test.id, name: test.name, rate: test.price, qty: 1, amount: test.price },
      ]);
    }
  };

  const handleRemoveTest = (id) => {
    setSelectedTests(selectedTests.filter((item) => item.id !== id));
  };

  const handleClearAllTests = () => {
    setSelectedTests([]);
  };

  // Calculations
  const totalAmount = selectedTests.reduce((acc, curr) => acc + curr.amount, 0);
  const netAmount = Math.max(0, totalAmount - Number(discount || 0));

  const handleGenerateBill = () => {
    if (!patient) {
      toast.error("Please select a patient first.");
      return;
    }
    if (selectedTests.length === 0) {
      toast.error("Please select at least one lab test.");
      return;
    }
    setShowPrintModal(true);
    toast.success("Lab Bill Generated Successfully!", { icon: "🧪" });
  };

  const categories = [
    "Common Tests",
    "Hematology",
    "Biochemistry",
    "Serology",
    "Microbiology",
    "Hormones",
    "Others",
  ];

  const filteredCatalog = ALL_LAB_TESTS.filter((t) => {
    const matchesCat = activeCategory === "Common Tests" || t.category === activeCategory;
    const matchesQuery = !testSearch.trim() || t.name.toLowerCase().includes(testSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="lab-billing-page">
      {/* ── 1. PAGE HEADER ── */}
      <div className="lab-page-header">
        <div className="lab-header-left">
          <div className="lab-header-icon-box">
            <Icon name="LuFlaskConical" size={24} />
          </div>
          <div>
            <h1 className="lab-header-title">Lab Billing</h1>
            <p className="lab-header-subtitle">
              Create lab test orders, manage payments and generate bills
            </p>
          </div>
        </div>

        <div className="lab-header-right-actions">
          <div className="lab-breadcrumb">
            <span className="lab-breadcrumb-item">Home</span>
            <span>&gt;</span>
            <span className="lab-breadcrumb-item">Billing</span>
            <span>&gt;</span>
            <span className="lab-breadcrumb-active">Lab Billing</span>
          </div>

          <button
            type="button"
            className="lab-btn-outline"
            onClick={() => toast.success("New Patient Registration")}
          >
            <Icon name="LuUserPlus" size={14} /> New Patient
          </button>
          <button type="button" className="lab-btn-danger-outline" onClick={handleClear}>
            <Icon name="LuTrash2" size={14} /> Clear
          </button>
          <button
            type="button"
            className="lab-btn-outline"
            onClick={() => window.print()}
          >
            <Icon name="LuPrinter" size={14} /> Print
          </button>
          <button type="button" className="lab-more-btn">
            <Icon name="LuMoreHorizontal" size={16} />
          </button>
        </div>
      </div>

      {/* ── 2. TOP SECTION GRID: SEARCH PATIENT & RECENT LAB VISITS ── */}
      <div className="lab-top-grid">
        {/* Search Patient & Patient Banner */}
        <div className="lab-card">
          <div className="lab-card-header">
            <div className="lab-card-title-group">
              <Icon name="LuUserCheck" className="lab-card-icon" />
              <h2 className="lab-card-title">Search Patient</h2>
            </div>
            <span className="lab-card-link">
              <Icon name="LuEye" size={13} /> View Full Profile
            </span>
          </div>

          <form onSubmit={handleSearchPatient}>
            <div className="lab-search-bar">
              <div className="lab-search-input-wrap">
                <Icon name="LuSearch" size={16} className="lab-search-icon" />
                <input
                  type="text"
                  className="lab-search-input"
                  placeholder="Search by UHID, Name, Mobile No..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <button type="submit" className="lab-btn-search">
                <Icon name="LuSearch" size={14} /> Search
              </button>
            </div>

            <div className="lab-search-options">
              {["UHID", "Mobile", "Name"].map((opt) => (
                <label key={opt} className="lab-radio-label">
                  <input
                    type="radio"
                    name="searchBy"
                    value={opt}
                    checked={searchBy === opt}
                    onChange={(e) => setSearchBy(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </form>

          {/* Patient Details Banner Card */}
          {patient ? (
            <div className="lab-patient-profile-layout" style={{ marginTop: 14 }}>
              <div className="lab-patient-photo-box">
                <img src={patient.avatar} alt={patient.name} className="lab-patient-img" />
              </div>

              <div className="lab-patient-main-bio">
                <div className="lab-patient-name-row">
                  <h3 className="lab-patient-name">{patient.name}</h3>
                  <span className="lab-badge-existing">Existing Patient</span>
                </div>
                <span className="lab-badge-uhid">{patient.uhid}</span>

                <div className="lab-bio-meta-list">
                  <div className="lab-bio-meta-item">
                    <Icon name="LuUser" size={13} /> {patient.age} Years / {patient.gender}
                  </div>
                  <div className="lab-bio-meta-item">
                    <Icon name="LuPhone" size={13} /> {patient.phone}
                  </div>
                  <div className="lab-bio-meta-item">
                    <Icon name="LuMapPin" size={13} /> {patient.address}
                  </div>
                </div>
              </div>

              <div className="lab-patient-medical-grid">
                <div>
                  <span className="lab-med-label">🩸 Blood Group :</span>{" "}
                  <span className="lab-med-val" style={{ color: "#ef4444" }}>
                    {patient.bloodGroup}
                  </span>
                </div>
                <div>
                  <span className="lab-med-label">Last Visit :</span>{" "}
                  <span className="lab-med-val">{patient.lastVisit}</span>
                </div>

                <div>
                  <span className="lab-med-label">🌿 Allergies :</span>{" "}
                  <span className="lab-med-val">{patient.allergies}</span>
                </div>
                <div>
                  <span className="lab-med-label">Referred By :</span>{" "}
                  <span className="lab-med-val">{patient.referredBy}</span>
                </div>

                <div>
                  <span className="lab-med-label">🫀 Known History :</span>{" "}
                  <span className="lab-med-val">{patient.knownHistory}</span>
                </div>
                <div>
                  <span className="lab-med-label">Patient Type :</span>{" "}
                  <span className="lab-med-val">{patient.patientType}</span>
                </div>

                <div>
                  <span className="lab-med-label">Department :</span>{" "}
                  <span className="lab-med-val">{patient.department}</span>
                </div>
                <div>
                  <span className="lab-med-label">Doctor :</span>{" "}
                  <span className="lab-med-val">{patient.doctor}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 13 }}>
              No patient selected. Use search bar above.
            </div>
          )}
        </div>

        {/* Recent Lab Visits Card */}
        <div className="lab-card">
          <div className="lab-card-header">
            <div className="lab-card-title-group">
              <Icon name="LuFlaskConical" className="lab-card-icon" />
              <h2 className="lab-card-title">Recent Lab Visits</h2>
            </div>
            <span className="lab-card-link">View All</span>
          </div>

          <div className="lab-mini-table-wrap">
            <table className="lab-mini-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Test Name</th>
                  <th style={{ textAlign: "right" }}>Amount (₹)</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.length > 0 ? (
                  recentVisits.map((visit, idx) => (
                    <tr key={idx}>
                      <td>{visit.date}</td>
                      <td style={{ fontWeight: 600 }}>{visit.testName}</td>
                      <td style={{ textAlign: "right" }}>{visit.amount}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className="lab-status-reported">{visit.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "#64748b", padding: 16 }}>
                      No recent lab orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN SECTION GRID: ADD LAB TESTS & BILLING RIGHT COLUMN ── */}
      <div className="lab-main-grid">
        {/* Main Left Column: Add Lab Tests Panel */}
        <div className="lab-card">
          <div className="lab-card-header">
            <div className="lab-card-title-group">
              <Icon name="LuTestTube" className="lab-card-icon" />
              <h2 className="lab-card-title">Add Lab Tests</h2>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="lab-category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`lab-cat-pill ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 2-Column Inner Layout: Available Tests + Selected Tests */}
          <div className="lab-tests-inner-grid">
            {/* Available Tests List */}
            <div className="lab-avail-tests-box">
              <div style={{ position: "relative" }}>
                <Icon name="LuSearch" size={14} className="lab-search-icon" />
                <input
                  type="text"
                  className="lab-search-input"
                  style={{ paddingLeft: 34, fontSize: 12.5 }}
                  placeholder="Search test (e.g. CBC, LFT, Thyroid...)"
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                />
              </div>

              <table className="lab-avail-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}></th>
                    <th>Test Name</th>
                    <th style={{ textAlign: "right" }}>Price (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.map((test) => {
                    const isSelected = selectedTests.some((item) => item.id === test.id);
                    return (
                      <tr
                        key={test.id}
                        className={`lab-avail-tr ${isSelected ? "selected" : ""}`}
                        onClick={() => handleToggleTest(test)}
                      >
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                          />
                        </td>
                        <td style={{ fontWeight: isSelected ? 700 : 500 }}>{test.name}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{test.price}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Tests Table */}
            <div className="lab-selected-tests-box">
              <div className="lab-selected-header">
                <span className="lab-selected-title">
                  📋 Selected Tests ({selectedTests.length})
                </span>
                <button
                  type="button"
                  className="lab-btn-danger-outline"
                  style={{ padding: "4px 10px", fontSize: 12 }}
                  onClick={handleClearAllTests}
                >
                  <Icon name="LuTrash2" size={13} /> Clear All
                </button>
              </div>

              <table className="lab-selected-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th>Test Name</th>
                    <th style={{ textAlign: "right" }}>Rate (₹)</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Amount (₹)</th>
                    <th style={{ textAlign: "center", width: 40 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTests.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                        No tests selected. Click on left checklist to add.
                      </td>
                    </tr>
                  ) : (
                    selectedTests.map((t, idx) => (
                      <tr key={t.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td style={{ textAlign: "right" }}>{t.rate.toFixed(2)}</td>
                        <td style={{ textAlign: "center" }}>{t.qty}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{t.amount.toFixed(2)}</td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="lab-btn-delete"
                            onClick={() => handleRemoveTest(t.id)}
                          >
                            <Icon name="LuTrash2" size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="lab-clinical-notes-box">
                <label className="lab-notes-label">Clinical Notes (Optional)</label>
                <input
                  type="text"
                  className="lab-notes-input"
                  placeholder="Enter clinical notes or special instructions..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </div>

              <div className="lab-totals-summary-bar">
                <span>Total Tests: {selectedTests.length}</span>
                <span>
                  Total Amount:{" "}
                  <span className="lab-total-amount-val">
                    ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Billing & Payment + Print Options */}
        <div className="lab-right-col">
          {/* Billing & Payment Card */}
          <div className="lab-card">
            <div className="lab-card-header">
              <div className="lab-card-title-group">
                <Icon name="LuCreditCard" className="lab-card-icon" />
                <h2 className="lab-card-title">Billing & Payment</h2>
              </div>
            </div>

            <div className="lab-payment-form-grid">
              <div className="lab-form-field">
                <label className="lab-form-label">Payment Mode</label>
                <select
                  className="lab-select-control"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="Card">Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div className="lab-form-field">
                <label className="lab-form-label">Discount (₹)</label>
                <input
                  type="number"
                  className="lab-input-control"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>

              <div className="lab-form-field">
                <label className="lab-form-label">Received Amount (₹)</label>
                <input
                  type="text"
                  className="lab-input-control"
                  readOnly
                  value={netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                />
              </div>
            </div>

            <div className="lab-amounts-summary-box">
              <div className="lab-summary-row">
                <span>Total Amount</span>
                <span style={{ fontWeight: 700, color: "#2563eb" }}>
                  ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="lab-summary-row">
                <span>Discount</span>
                <span>
                  ₹ {Number(discount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="lab-net-amount-banner">
                <span className="lab-net-label">Net Amount</span>
                <span className="lab-net-val">
                  ₹ {netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Print & Communication Card */}
          <div className="lab-card">
            <div className="lab-card-header">
              <div className="lab-card-title-group">
                <Icon name="LuPrinter" className="lab-card-icon" />
                <h2 className="lab-card-title">Print & Communication</h2>
              </div>
            </div>

            <div className="lab-checkbox-group">
              <label className="lab-checkbox-label">
                <input
                  type="checkbox"
                  checked={printBill}
                  onChange={(e) => setPrintBill(e.target.checked)}
                />
                Print Bill
              </label>
              <label className="lab-checkbox-label">
                <input
                  type="checkbox"
                  checked={printReceipt}
                  onChange={(e) => setPrintReceipt(e.target.checked)}
                />
                Print Receipt
              </label>
              <label className="lab-checkbox-label">
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                />
                Send SMS to Patient
              </label>
              <label className="lab-checkbox-label">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                Send Email
              </label>
            </div>

            <button
              type="button"
              className="lab-btn-generate-bill"
              onClick={handleGenerateBill}
            >
              <Icon name="LuPrinter" size={18} /> Generate Bill (F5)
            </button>

            <div className="lab-secondary-actions-row">
              <button
                type="button"
                className="lab-btn-outline"
                style={{ justifyContent: "center" }}
                onClick={() => setShowPrintModal(true)}
              >
                <Icon name="LuEye" size={14} /> Preview
              </button>
              <button
                type="button"
                className="lab-btn-danger-outline"
                style={{ justifyContent: "center" }}
                onClick={handleClear}
              >
                <Icon name="LuX" size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. BOTTOM PANEL: PREVIOUS LAB BILLS ── */}
      <div className="lab-card">
        <div className="lab-card-header">
          <div className="lab-card-title-group">
            <Icon name="LuFileText" className="lab-card-icon" />
            <h2 className="lab-card-title">Previous Lab Bills</h2>
          </div>
          <span className="lab-card-link">View All</span>
        </div>

        <table className="lab-previous-bills-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Bill No.</th>
              <th>Test Name</th>
              <th style={{ textAlign: "right" }}>Amount (₹)</th>
              <th style={{ textAlign: "center" }}>Status</th>
              <th style={{ textAlign: "center" }}>Report</th>
            </tr>
          </thead>
          <tbody>
            {PREVIOUS_BILLS.map((bill) => (
              <tr key={bill.billNo}>
                <td>{bill.date}</td>
                <td style={{ fontWeight: 700 }}>{bill.billNo}</td>
                <td>{bill.testName}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{bill.amount}</td>
                <td style={{ textAlign: "center" }}>
                  <span className="lab-status-reported">{bill.status}</span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className="lab-report-link" onClick={() => toast.success(`Viewing report for ${bill.billNo}`)}>
                    <Icon name="LuFileText" size={14} /> View Report
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 5. PRINTABLE BILL MODAL ── */}
      {showPrintModal && patient && (
        <div className="lab-modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="lab-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="lab-modal-header">
              <h3 className="lab-modal-title">🧪 Pathology Lab Invoice & Receipt</h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setShowPrintModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="lab-modal-body">
              <div className="lab-printable-voucher" id="lab-printable-receipt">
                <div className="lab-voucher-header">
                  <div className="lab-voucher-logo">K. G. Nanda Hospital</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Chandauli, Uttar Pradesh • Pathology & Diagnostics
                  </div>
                  <span className="lab-voucher-tag">PATHOLOGY LAB INVOICE</span>
                </div>

                <div className="lab-voucher-meta">
                  <div><strong>Bill Date</strong>: {new Date().toLocaleDateString("en-GB")}</div>
                  <div><strong>UHID</strong>: {patient.uhid}</div>
                  <div><strong>Patient Name</strong>: {patient.name}</div>
                  <div><strong>Age / Gender</strong>: {patient.age} Y / {patient.gender}</div>
                  <div><strong>Doctor</strong>: {patient.doctor}</div>
                  <div><strong>Payment Mode</strong>: {paymentMode}</div>
                </div>

                <table className="lab-voucher-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Test Description</th>
                      <th style={{ textAlign: "right" }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTests.map((t, idx) => (
                      <tr key={t.id}>
                        <td>{idx + 1}</td>
                        <td>{t.name}</td>
                        <td style={{ textAlign: "right" }}>{t.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "right", marginTop: 10 }}>
                  <div>Total Amount: <strong>₹ {totalAmount.toFixed(2)}</strong></div>
                  <div>Discount: <strong>₹ {Number(discount || 0).toFixed(2)}</strong></div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#15803d", marginTop: 4 }}>
                    Net Paid Amount: ₹ {netAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="lab-modal-footer">
              <button type="button" className="lab-btn-outline" onClick={() => setShowPrintModal(false)}>
                Close
              </button>
              <button
                type="button"
                className="lab-btn-search"
                style={{ background: "#10b981" }}
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
