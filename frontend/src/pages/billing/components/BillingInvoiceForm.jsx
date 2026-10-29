import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import patientService from "../../../api/services/patientService";
import billingInvoicesService from "../../../api/services/billingInvoicesService";
import { isMockMode } from "../../../config/appConfig";
import {
  LuSearch,
  LuX,
  LuDownload,
  LuEye,
  LuSquarePen,
  LuRefreshCw,
  LuTrash2,
  LuPrinter,
  LuCircleCheck,
  LuPill,
  LuPlus,
  LuMinus,
  LuCreditCard,
  LuUser,
  LuPhone,
  LuCalendar,
} from "react-icons/lu";
import "./BillingInvoiceForm.css";

// ── Status Configurations ───────────────────────────────────────────────────
const STATUSES = [
  { value: "All", label: "All Statuses" },
  { value: "Due", label: "Pending Due", color: "#dc2626", bg: "#fee2e2" },
  { value: "Paid", label: "Cleared (Paid)", color: "#059669", bg: "#ecfdf5" },
];

const CATEGORIES = [
  { value: "All", label: "All Categories" },
  { value: "OPD", label: "OPD" },
  { value: "IPD", label: "IPD" },
  { value: "Emergency", label: "Emergency" },
];

// Presets for dispensing medicines
const MEDICINES_CATALOG = [
  { id: "m1", name: "Tab Paracetamol 650mg (Dolo)", generic: "Paracetamol", batch: "PC2408", expiry: "2027-08-31", mrp: 35.0, gst: 12, stock: 240, hsn: "300490" },
  { id: "m2", name: "Cap Pantoprazole 40mg (Pan-40)", generic: "Pantoprazole", batch: "PN4410", expiry: "2026-12-31", mrp: 96.0, gst: 12, stock: 110, hsn: "300490" },
  { id: "m3", name: "Tab Augmentin 625 Duo", generic: "Amoxicillin + Clavulanic Acid", batch: "AM7781", expiry: "2027-06-30", mrp: 205.0, gst: 12, stock: 85, hsn: "300410" },
  { id: "m4", name: "Tab Azithromycin 500mg (Azee)", generic: "Azithromycin", batch: "AZ9912", expiry: "2027-03-31", mrp: 118.0, gst: 12, stock: 60, hsn: "300420" },
  { id: "m5", name: "Tab Cetirizine 10mg (Cetzine)", generic: "Cetirizine HCl", batch: "CT1180", expiry: "2028-01-31", mrp: 32.0, gst: 12, stock: 300, hsn: "300490" },
  { id: "m6", name: "Tab Metformin 500mg SR (Glycomet)", generic: "Metformin Hydrochloride", batch: "MF5503", expiry: "2027-10-31", mrp: 44.0, gst: 12, stock: 150, hsn: "300490" },
  { id: "m7", name: "Tab Ondansetron 4mg (Emeset)", generic: "Ondansetron", batch: "ON2344", expiry: "2027-05-31", mrp: 52.0, gst: 12, stock: 95, hsn: "300490" },
  { id: "m8", name: "ORS Powder Sachet (Electral 21.8g)", generic: "Oral Rehydration Salts", batch: "OR0021", expiry: "2027-11-30", mrp: 22.0, gst: 5, stock: 200, hsn: "300490" },
  { id: "m9", name: "Inj Ceftriaxone 1g (Monocef)", generic: "Ceftriaxone Sodium", batch: "MN6610", expiry: "2027-02-28", mrp: 68.0, gst: 12, stock: 50, hsn: "300420" },
  { id: "m10", name: "Betadine Ointment 15g (10% w/w)", generic: "Povidone Iodine", batch: "BT3320", expiry: "2027-09-30", mrp: 85.0, gst: 18, stock: 45, hsn: "300490" },
];

const inr = (n) =>
  "₹" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function amountToWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return "Zero Rupees Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertGroup(n) {
    if (n === 0) return "";
    if (n < 20) return ones[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + " " + (n % 10 !== 0 ? ones[n % 10] + " " : "");
    return ones[Math.floor(n / 100)] + " Hundred " + (n % 100 !== 0 ? convertGroup(n % 100) : "");
  }

  let n = num;
  let str = "";
  if (Math.floor(n / 10000000) > 0) {
    str += convertGroup(Math.floor(n / 10000000)) + "Crore ";
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    str += convertGroup(Math.floor(n / 100000)) + "Lakh ";
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    str += convertGroup(Math.floor(n / 1000)) + "Thousand ";
    n %= 1000;
  }
  if (Math.floor(n / 100) > 0) {
    str += convertGroup(Math.floor(n / 100)) + "Hundred ";
    n %= 100;
  }
  if (n > 0) str += convertGroup(n);
  return str.trim() + " Rupees Only";
}

// Initial Real-time Hospital Pharmacy Bills
const INITIAL_BILLS = [
  {
    id: "BILL-PH-101",
    billNo: "INV-PH-2026-00101",
    uhid: "UHID-2026-00101",
    date: new Date().toLocaleDateString("en-IN"),
    time: "10:30 AM",
    patientName: "Aarav Sharma",
    phone: "9811223344",
    gender: "Male",
    age: 34,
    category: "OPD",
    doctor: "Dr. Rudresh Singh",
    items: [
      { id: "m1", name: "Tab Paracetamol 650mg (Dolo)", generic: "Paracetamol", batch: "PC2408", expiry: "2027-08-31", mrp: 35.0, gst: 12, qty: 2, disc: 0 },
      { id: "m2", name: "Cap Pantoprazole 40mg (Pan-40)", generic: "Pantoprazole", batch: "PN4410", expiry: "2026-12-31", mrp: 96.0, gst: 12, qty: 1, disc: 0 },
    ],
    totalAmount: 166.0,
    paidAmount: 166.0,
    dueAmount: 0.0,
    paymentMode: "Cash",
    status: "Paid",
  },
  {
    id: "BILL-PH-102",
    billNo: "INV-PH-2026-00102",
    uhid: "UHID-2026-00113",
    date: new Date().toLocaleDateString("en-IN"),
    time: "11:15 AM",
    patientName: "Deepak Joshi",
    phone: "9911002233",
    gender: "Male",
    age: 30,
    category: "IPD",
    doctor: "Dr. Rudresh Singh",
    items: [
      { id: "m3", name: "Tab Augmentin 625 Duo", generic: "Amoxicillin + Clavulanic Acid", batch: "AM7781", expiry: "2027-06-30", mrp: 205.0, gst: 12, qty: 2, disc: 0 },
      { id: "m4", name: "Tab Azithromycin 500mg (Azee)", generic: "Azithromycin", batch: "AZ9912", expiry: "2027-03-31", mrp: 118.0, gst: 12, qty: 1, disc: 0 },
    ],
    totalAmount: 528.0,
    paidAmount: 228.0,
    dueAmount: 300.0,
    paymentMode: "Credit (Pay Later)",
    status: "Due",
  },
  {
    id: "BILL-PH-103",
    billNo: "INV-PH-2026-00103",
    uhid: "UHID-2026-00135",
    date: new Date().toLocaleDateString("en-IN"),
    time: "12:00 PM",
    patientName: "Rajesh Verma",
    phone: "9833445566",
    gender: "Male",
    age: 45,
    category: "OPD",
    doctor: "Dr. Amit Roy",
    items: [
      { id: "m6", name: "Tab Metformin 500mg SR (Glycomet)", generic: "Metformin Hydrochloride", batch: "MF5503", expiry: "2027-10-31", mrp: 44.0, gst: 12, qty: 3, disc: 0 },
    ],
    totalAmount: 132.0,
    paidAmount: 0.0,
    dueAmount: 132.0,
    paymentMode: "Credit (Pay Later)",
    status: "Due",
  },
  {
    id: "BILL-PH-104",
    billNo: "INV-PH-2026-00104",
    uhid: "UHID-2026-00124",
    date: new Date().toLocaleDateString("en-IN"),
    time: "01:20 PM",
    patientName: "Priya Patel",
    phone: "9822334455",
    gender: "Female",
    age: 28,
    category: "OPD",
    doctor: "Dr. Meenakshi Sundaram",
    items: [
      { id: "m5", name: "Tab Cetirizine 10mg (Cetzine)", generic: "Cetirizine HCl", batch: "CT1180", expiry: "2028-01-31", mrp: 32.0, gst: 12, qty: 2, disc: 0 },
      { id: "m8", name: "ORS Powder Sachet (Electral)", generic: "Oral Rehydration Salts", batch: "OR0021", expiry: "2027-11-30", mrp: 22.0, gst: 5, qty: 4, disc: 0 },
    ],
    totalAmount: 152.0,
    paidAmount: 152.0,
    dueAmount: 0.0,
    paymentMode: "UPI",
    status: "Paid",
  },
  {
    id: "BILL-PH-105",
    billNo: "INV-PH-2026-00105",
    uhid: "UHID-2026-00146",
    date: new Date().toLocaleDateString("en-IN"),
    time: "02:40 PM",
    patientName: "Sunita Devi",
    phone: "9844556677",
    gender: "Female",
    age: 52,
    category: "IPD",
    doctor: "Dr. Ananya Sen",
    items: [
      { id: "m9", name: "Inj Ceftriaxone 1g (Monocef)", generic: "Ceftriaxone Sodium", batch: "MN6610", expiry: "2027-02-28", mrp: 68.0, gst: 12, qty: 2, disc: 0 },
      { id: "m2", name: "Cap Pantoprazole 40mg (Pan-40)", generic: "Pantoprazole", batch: "PN4410", expiry: "2026-12-31", mrp: 96.0, gst: 12, qty: 2, disc: 0 },
    ],
    totalAmount: 328.0,
    paidAmount: 128.0,
    dueAmount: 200.0,
    paymentMode: "Credit (Pay Later)",
    status: "Due",
  },
];

export default function PharmacyBilling() {
  const [bills, setBills] = useState(INITIAL_BILLS);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals State
  const [viewBill, setViewBill] = useState(null);
  const [printBill, setPrintBill] = useState(null);
  const [clearBillModal, setClearBillModal] = useState(null);
  const [clearAmountInput, setClearAmountInput] = useState("");
  const [clearPayMode, setClearPayMode] = useState("Cash");

  // New Pharmacy Bill Modal
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatientForBill, setSelectedPatientForBill] = useState(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [newCart, setNewCart] = useState([]);
  const [newBillPayMode, setNewBillPayMode] = useState("Cash");
  const [newBillReceived, setNewBillReceived] = useState("");

  // Load Real Patients
  useEffect(() => {
    patientService
      .getAll({ limit: 100 })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        if (list.length > 0) {
          setPatientsList(
            list.map((p) => ({
              id: p.id,
              uhid: p.uhid,
              name: p.full_name || p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
              phone: p.phone || p.mobile || "—",
              age: p.age || 30,
              gender: p.gender || "Male",
              category: p.category || (p.ward ? "IPD" : "OPD"),
              doctor: p.doctor || p.consultant || "Dr. Rudresh Singh",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Filtered Bills
  const filteredBills = useMemo(() => {
    let list = bills;
    if (catFilter !== "All") {
      list = list.filter((b) => b.category === catFilter);
    }
    if (statusFilter !== "All") {
      list = list.filter((b) => b.status === statusFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((b) =>
        [b.billNo, b.uhid, b.patientName, b.phone, b.doctor].some((v) =>
          String(v || "").toLowerCase().includes(q)
        )
      );
    }
    return list;
  }, [bills, search, catFilter, statusFilter]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!filteredBills.length) return toast("No pharmacy records to export!", { icon: "⚠️" });
    const headers = [
      "Bill Number",
      "Date",
      "Time",
      "Patient Name",
      "UHID Number",
      "Mobile",
      "Category",
      "Prescribing Doctor",
      "Total Amount (₹)",
      "Paid Amount (₹)",
      "Balance Due (₹)",
      "Payment Mode",
      "Status",
    ];
    const data = filteredBills.map((b) => [
      b.billNo,
      b.date,
      b.time || "",
      b.patientName,
      b.uhid,
      b.phone,
      b.category,
      b.doctor,
      b.totalAmount,
      b.paidAmount,
      b.dueAmount,
      b.paymentMode,
      b.status,
    ]);
    const csv =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers, ...data]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `Pharmacy_Billing_Clearance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`${filteredBills.length} pharmacy billing records exported successfully!`);
  };

  // Open Real-time Clearance Modal
  const openClearModal = (bill) => {
    setClearBillModal(bill);
    setClearAmountInput(String(bill.dueAmount));
    setClearPayMode("Cash");
  };

  // Confirm Real-time Hospital Pharmacy Bill Clearance
  const handleConfirmClearance = (e) => {
    e.preventDefault();
    if (!clearBillModal) return;
    const amountToClear = Number(clearAmountInput) || 0;
    if (amountToClear <= 0) return toast.error("Enter a valid clearance amount.");

    const newPaid = clearBillModal.paidAmount + amountToClear;
    const newDue = Math.max(0, clearBillModal.totalAmount - newPaid);
    const updatedStatus = newDue === 0 ? "Paid" : "Due";

    const updatedBill = {
      ...clearBillModal,
      paidAmount: Math.min(clearBillModal.totalAmount, newPaid),
      dueAmount: newDue,
      paymentMode: clearPayMode,
      status: updatedStatus,
    };

    setBills((prev) =>
      prev.map((b) => (b.id === clearBillModal.id ? updatedBill : b))
    );

    toast.success(
      `✅ Pharmacy Bill ${clearBillModal.billNo} for ${clearBillModal.patientName} cleared successfully! (${inr(amountToClear)})`,
      { duration: 4000 }
    );
    setClearBillModal(null);

    // Open Official Cleared Print Receipt immediately
    setPrintBill(updatedBill);
  };

  // Void / Cancel a bill
  const handleVoidBill = (billId) => {
    if (window.confirm("Are you sure you want to void / delete this pharmacy bill record?")) {
      setBills((prev) => prev.filter((b) => b.id !== billId));
      toast.success("Pharmacy bill record removed.");
    }
  };

  // Add Item to New Bill Cart
  const handleAddMedToNewCart = (med) => {
    setNewCart((prev) => {
      const hit = prev.find((x) => x.id === med.id);
      if (hit) {
        return prev.map((x) => (x.id === med.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, { ...med, qty: 1, disc: 0 }];
    });
  };

  const handleUpdateNewCartQty = (id, newQty) => {
    if (newQty <= 0) {
      setNewCart((prev) => prev.filter((x) => x.id !== id));
    } else {
      setNewCart((prev) => prev.map((x) => (x.id === id ? { ...x, qty: newQty } : x)));
    }
  };

  // Calculate New Bill Totals
  const newBillTotal = useMemo(() => {
    return newCart.reduce((sum, item) => sum + item.qty * item.mrp * (1 - (item.disc || 0) / 100), 0);
  }, [newCart]);

  // Submit New Pharmacy Bill
  const handleCreateNewPharmacyBill = (e) => {
    e.preventDefault();
    if (!selectedPatientForBill) return toast.error("Please select a patient first.");
    if (!newCart.length) return toast.error("Please add at least one medicine to the bill.");

    const isCredit = newBillPayMode.startsWith("Credit");
    const net = Math.round(newBillTotal);
    const paid = isCredit ? Number(newBillReceived) || 0 : newBillReceived === "" ? net : Number(newBillReceived) || 0;
    const due = Math.max(0, net - paid);

    const newBillNo = `INV-PH-2026-${Date.now().toString().slice(-5)}`;
    const newRecord = {
      id: `BILL-PH-${Date.now()}`,
      billNo: newBillNo,
      uhid: selectedPatientForBill.uhid,
      date: new Date().toLocaleDateString("en-IN"),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      patientName: selectedPatientForBill.name,
      phone: selectedPatientForBill.phone,
      gender: selectedPatientForBill.gender,
      age: selectedPatientForBill.age,
      category: selectedPatientForBill.category || "OPD",
      doctor: selectedPatientForBill.doctor || "Dr. Rudresh Singh",
      items: [...newCart],
      totalAmount: net,
      paidAmount: Math.min(net, paid),
      dueAmount: due,
      paymentMode: newBillPayMode,
      status: due === 0 ? "Paid" : "Due",
    };

    setBills((prev) => [newRecord, ...prev]);
    toast.success(`✅ Bill ${newBillNo} created successfully!`);
    setShowNewBillModal(false);
    setSelectedPatientForBill(null);
    setNewCart([]);
    setNewBillReceived("");
    setPrintBill(newRecord);
  };

  return (
    <div className="rr-page">
      {/* ── PAGE HEADER BAR (EXACT THEME MATCHING SCREENSHOT) ── */}
      <div className="rr-header">
        <div className="rr-header-left">
          <div className="rr-header-icon">
            <LuPill size={22} />
          </div>
          <div>
            <h1 className="rr-title">Pharmacy Billing &amp; Clearance Reports</h1>
            <p className="rr-subtitle">View, clear, and dispense real-time hospital pharmacy bills</p>
          </div>
        </div>

        <div className="rr-controls">
          {/* Search Input */}
          <div className="rr-search" style={{ width: 280 }}>
            <LuSearch size={15} />
            <input
              type="text"
              placeholder="Search bill, patient, mobile, UHID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="rr-search-clear" onClick={() => setSearch("")}>
                <LuX size={13} color="#55698a" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            className="rr-select"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="rr-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* + New Pharmacy Bill Button */}
          <button
            type="button"
            className="rr-btn rr-btn--green"
            onClick={() => setShowNewBillModal(true)}
            title="Create a new pharmacy bill and dispense medicines"
          >
            <LuPlus size={16} /> + New Pharmacy Bill
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="rr-btn rr-btn--green"
            title="Export filtered pharmacy records to Excel / CSV"
          >
            <LuDownload size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* ── TABLE CARD (EXACT NAVY THEME WITH GOLD BORDER) ── */}
      <div className="rr-card">
        <div className="rr-table-wrap">
          <table className="rr-table">
            <thead>
              <tr>
                <th>UHID NUMBER</th>
                <th>BILL / INVOICE NO</th>
                <th>DATE &amp; TIME</th>
                <th>PATIENT NAME</th>
                <th>MOBILE NUMBER</th>
                <th>CATEGORY</th>
                <th style={{ textAlign: "right" }}>TOTAL (₹)</th>
                <th style={{ textAlign: "right" }}>PAID (₹)</th>
                <th style={{ textAlign: "right" }}>DUE (₹)</th>
                <th style={{ textAlign: "center" }}>STATUS</th>
                <th style={{ textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={11} className="rr-empty" style={{ textAlign: "center", padding: "40px" }}>
                    <LuPill size={36} style={{ margin: "0 auto 8px auto", opacity: 0.4 }} />
                    <p style={{ fontWeight: 800, fontSize: 15 }}>No pharmacy bills found</p>
                    <small style={{ color: "#64748b" }}>Try adjusting your search query or filters.</small>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  const hasDue = bill.dueAmount > 0;
                  return (
                    <tr key={bill.id}>
                      {/* UHID NUMBER */}
                      <td>
                        <button
                          type="button"
                          onClick={() => setViewBill(bill)}
                          className="rr-link rr-uhid"
                        >
                          {bill.uhid}
                        </button>
                      </td>

                      {/* BILL NO */}
                      <td>
                        <strong style={{ fontFamily: "monospace", color: "#0f766e" }}>
                          {bill.billNo}
                        </strong>
                      </td>

                      {/* DATE */}
                      <td>
                        <span>{bill.date}</span>
                        {bill.time && <div style={{ fontSize: 11, color: "#64748b" }}>{bill.time}</div>}
                      </td>

                      {/* PATIENT NAME */}
                      <td>
                        <button
                          type="button"
                          onClick={() => setViewBill(bill)}
                          className="rr-link rr-name"
                        >
                          {bill.patientName}
                        </button>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {bill.age}Y / {bill.gender} • {bill.doctor}
                        </div>
                      </td>

                      {/* MOBILE NUMBER */}
                      <td>{bill.phone || "—"}</td>

                      {/* CATEGORY */}
                      <td>
                        <span
                          className={`rr-cat ${
                            bill.category === "IPD"
                              ? "rr-cat--ipd"
                              : bill.category === "Emergency"
                              ? "rr-cat--emergency"
                              : "rr-cat--opd"
                          }`}
                        >
                          {bill.category}
                        </span>
                      </td>

                      {/* TOTAL */}
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {inr(bill.totalAmount)}
                      </td>

                      {/* PAID */}
                      <td style={{ textAlign: "right", color: "#059669", fontWeight: 700 }}>
                        {inr(bill.paidAmount)}
                      </td>

                      {/* DUE */}
                      <td style={{ textAlign: "right", fontWeight: 800, color: hasDue ? "#dc2626" : "#475569" }}>
                        {inr(bill.dueAmount)}
                      </td>

                      {/* STATUS */}
                      <td style={{ textAlign: "center" }}>
                        <span
                          className="rr-status"
                          style={{
                            color: hasDue ? "#dc2626" : "#059669",
                            background: hasDue ? "#fef2f2" : "#ecfdf5",
                            borderColor: hasDue ? "#fecaca" : "#a7f3d0",
                          }}
                        >
                          <span
                            className="rr-status-dot"
                            style={{ background: hasDue ? "#dc2626" : "#059669" }}
                          />
                          {hasDue ? `Due: ${inr(bill.dueAmount)}` : "Cleared (Paid)"}
                        </span>
                      </td>

                      {/* 5 COLORED ACTION BUTTONS (EXACT DESIGN MATCH) */}
                      <td style={{ textAlign: "center" }}>
                        <div className="rr-actions">
                          {/* 1. View Button (Sapphire Blue) */}
                          <button
                            type="button"
                            onClick={() => setViewBill(bill)}
                            title="View Pharmacy Bill Details & Dispensed Medicines"
                            className="rr-act rr-act--view"
                          >
                            <LuEye size={15} />
                          </button>

                          {/* 2. Print Button (Emerald Green) */}
                          <button
                            type="button"
                            onClick={() => setPrintBill(bill)}
                            title="Print Official Pharmacy Cash Memo & Tax Invoice"
                            className="rr-act rr-act--print"
                          >
                            <LuPrinter size={15} />
                          </button>

                          {/* 3. Clear Due Button (Golden Amber) */}
                          <button
                            type="button"
                            onClick={() => openClearModal(bill)}
                            title={hasDue ? "⚡ Clear Hospital Pharmacy Bill" : "Bill is already fully cleared"}
                            className={`rr-act ${hasDue ? "rr-act--edit" : "rr-act--locked"}`}
                          >
                            <LuCreditCard size={15} />
                          </button>

                          {/* 4. Settle / Status Button (Amethyst Purple) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (hasDue) openClearModal(bill);
                              else toast.success(`Bill ${bill.billNo} is fully settled and cleared.`);
                            }}
                            title="Settle / Sync Bill Status"
                            className="rr-act rr-act--status"
                          >
                            <LuRefreshCw size={14} />
                          </button>

                          {/* 5. Cancel / Void Button (Ruby Red) */}
                          <button
                            type="button"
                            onClick={() => handleVoidBill(bill.id)}
                            title="Void / Delete Bill Record"
                            className="rr-act rr-act--cancel"
                          >
                            <LuTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: REAL-TIME HOSPITAL PHARMACY BILL CLEARANCE ── */}
      {clearBillModal && (
        <div className="ph-modal-overlay" onClick={() => setClearBillModal(null)}>
          <div className="ph-modal-box" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="ph-modal-header" style={{ background: "linear-gradient(100deg, #0b2556 0%, #1e5a8e 100%)" }}>
              <h3 style={{ color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <LuCreditCard size={18} color="#f5c542" /> ⚡ Clear Hospital Pharmacy Bill
              </h3>
              <button
                type="button"
                className="ph-modal-close-btn"
                onClick={() => setClearBillModal(null)}
              >
                <LuX size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmClearance} style={{ padding: "20px" }}>
              {/* Patient Banner */}
              <div
                style={{
                  background: "#f0f7ff",
                  border: "1.5px solid #bfdbfe",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                    {clearBillModal.patientName}
                  </h4>
                  <div style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 700, marginTop: 2 }}>
                    {clearBillModal.uhid} • 📞 {clearBillModal.phone} • {clearBillModal.category}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>BILL NUMBER</span>
                  <div style={{ fontFamily: "monospace", fontWeight: 800, color: "#0f766e", fontSize: 13 }}>
                    {clearBillModal.billNo}
                  </div>
                </div>
              </div>

              {/* Outstanding Due Highlight Box */}
              <div
                style={{
                  background: "#fffafa",
                  border: "1.5px solid #fca5a5",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", textTransform: "uppercase" }}>
                    Current Outstanding Due
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Total: {inr(clearBillModal.totalAmount)} | Already Paid: {inr(clearBillModal.paidAmount)}
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#dc2626", fontFamily: "monospace" }}>
                  {inr(clearBillModal.dueAmount)}
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Select Clearance Payment Mode
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {["Cash", "UPI", "Card"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setClearPayMode(m)}
                      style={{
                        padding: "8px",
                        borderRadius: 8,
                        border: "1.5px solid",
                        borderColor: clearPayMode === m ? "#0f766e" : "#cbd5e1",
                        background: clearPayMode === m ? "#e6f5f3" : "#fff",
                        color: clearPayMode === m ? "#0f766e" : "#334155",
                        fontWeight: 800,
                        fontSize: 12.5,
                        cursor: "pointer",
                      }}
                    >
                      {m === "Cash" ? "💵 Cash" : m === "UPI" ? "📱 UPI / QR" : "💳 Card"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount to Collect Input */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Amount Received to Clear (₹)
                </label>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #cbd5e1", borderRadius: 8, padding: "0 12px" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#64748b" }}>₹</span>
                  <input
                    type="number"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      padding: "10px 8px",
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                    value={clearAmountInput}
                    onChange={(e) => setClearAmountInput(e.target.value)}
                    max={clearBillModal.dueAmount}
                    min="1"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setClearAmountInput(String(clearBillModal.dueAmount))}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Clear Full Due
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                <button
                  type="button"
                  className="btn-cancel"
                  style={{ padding: "9px 16px" }}
                  onClick={() => setClearBillModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rr-btn rr-btn--green"
                  style={{ height: 40, padding: "0 22px" }}
                >
                  <LuCircleCheck size={16} /> Confirm &amp; Clear Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: + NEW PHARMACY BILL CREATION ── */}
      {showNewBillModal && (
        <div className="ph-modal-overlay" onClick={() => setShowNewBillModal(false)}>
          <div className="ph-modal-box" style={{ maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
            <div className="ph-modal-header" style={{ background: "linear-gradient(100deg, #0b2556 0%, #1e5a8e 100%)" }}>
              <h3 style={{ color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <LuPlus size={18} color="#f5c542" /> Create &amp; Dispense New Pharmacy Bill
              </h3>
              <button
                type="button"
                className="ph-modal-close-btn"
                onClick={() => setShowNewBillModal(false)}
              >
                <LuX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewPharmacyBill} style={{ padding: "20px" }}>
              {/* Patient Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  1. Select Hospital Patient
                </label>
                {selectedPatientForBill ? (
                  <div
                    style={{
                      background: "#f0f7ff",
                      border: "1.5px solid #bfdbfe",
                      borderRadius: 8,
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14, color: "#0f172a" }}>{selectedPatientForBill.name}</strong>
                      <div style={{ fontSize: 12, color: "#1d4ed8" }}>
                        {selectedPatientForBill.uhid} • 📞 {selectedPatientForBill.phone} • {selectedPatientForBill.category}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatientForBill(null)}
                      style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {patientsList.slice(0, 6).map((p) => (
                      <button
                        key={p.uhid || p.id}
                        type="button"
                        onClick={() => setSelectedPatientForBill(p)}
                        style={{
                          background: "#fff",
                          border: "1.5px solid #cbd5e1",
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 12,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: 10.5, color: "#64748b" }}>{p.uhid} • {p.category}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Medicines Catalog Picker */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  2. Dispense Medicines (Click to add)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8, maxHeight: 180, overflowY: "auto", padding: 4 }}>
                  {MEDICINES_CATALOG.map((med) => (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => handleAddMedToNewCart(med)}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: "8px 10px",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{med.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>Batch: {med.batch}</div>
                      </div>
                      <strong style={{ fontSize: 12, color: "#0f766e" }}>{inr(med.mrp)}</strong>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Items Cart Table */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  3. Bill Items &amp; Quantities
                </label>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                      <th style={{ padding: "6px 8px" }}>Medicine</th>
                      <th style={{ padding: "6px 8px" }}>Batch</th>
                      <th style={{ padding: "6px 8px", textAlign: "center" }}>Qty</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>MRP</th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>Net Amount</th>
                      <th style={{ padding: "6px 8px" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {newCart.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>
                          No medicines added yet. Click above to add medicines.
                        </td>
                      </tr>
                    ) : (
                      newCart.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "6px 8px", fontWeight: 700 }}>{item.name}</td>
                          <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>{item.batch}</td>
                          <td style={{ padding: "6px 8px", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 4 }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateNewCartQty(item.id, item.qty - 1)}
                                style={{ border: "none", background: "none", padding: "2px 6px", cursor: "pointer" }}
                              >
                                -
                              </button>
                              <span style={{ padding: "0 6px", fontWeight: 700 }}>{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateNewCartQty(item.id, item.qty + 1)}
                                style={{ border: "none", background: "none", padding: "2px 6px", cursor: "pointer" }}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{inr(item.mrp)}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 800 }}>
                            {inr(item.qty * item.mrp)}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateNewCartQty(item.id, 0)}
                              style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer" }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total & Payment Mode */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>NET BILL AMOUNT:</span>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#0f766e" }}>{inr(newBillTotal)}</div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <select
                    value={newBillPayMode}
                    onChange={(e) => setNewBillPayMode(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12.5, fontWeight: 700 }}
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="UPI">📱 UPI / QR</option>
                    <option value="Card">💳 Card</option>
                    <option value="Credit (Pay Later)">⏳ Credit (Pay Later / Due)</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Received (₹)"
                    value={newBillReceived}
                    onChange={(e) => setNewBillReceived(e.target.value)}
                    style={{ width: 120, padding: "8px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12.5 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowNewBillModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rr-btn rr-btn--green"
                  style={{ height: 40, padding: "0 22px" }}
                  disabled={!selectedPatientForBill || newCart.length === 0}
                >
                  <LuCircleCheck size={16} /> Save &amp; Generate Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: VIEW BILL PARTICULARS ── */}
      {viewBill && (
        <div className="ph-modal-overlay" onClick={() => setViewBill(null)}>
          <div className="ph-modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="ph-modal-header" style={{ background: "linear-gradient(100deg, #0b2556 0%, #1e5a8e 100%)" }}>
              <h3 style={{ color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <LuEye size={18} color="#f5c542" /> Pharmacy Bill Particulars — {viewBill.billNo}
              </h3>
              <button type="button" className="ph-modal-close-btn" onClick={() => setViewBill(null)}>
                <LuX size={18} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, fontSize: 13 }}>
                <div><strong>Patient:</strong> {viewBill.patientName}</div>
                <div><strong>UHID:</strong> {viewBill.uhid}</div>
                <div><strong>Mobile:</strong> {viewBill.phone}</div>
                <div><strong>Doctor:</strong> {viewBill.doctor}</div>
                <div><strong>Date:</strong> {viewBill.date} {viewBill.time}</div>
                <div><strong>Payment Mode:</strong> {viewBill.paymentMode}</div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Medicine</th>
                    <th style={{ padding: "8px" }}>Batch</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Rate</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewBill.items?.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px", fontWeight: 700 }}>{it.name}</td>
                      <td style={{ padding: "8px", fontFamily: "monospace" }}>{it.batch}</td>
                      <td style={{ padding: "8px", textAlign: "center" }}>{it.qty}</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{inr(it.mrp)}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontWeight: 800 }}>{inr(it.qty * it.mrp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Status: </span>
                  <strong style={{ color: viewBill.dueAmount > 0 ? "#dc2626" : "#059669" }}>
                    {viewBill.dueAmount > 0 ? `Due: ${inr(viewBill.dueAmount)}` : "Fully Paid (Cleared)"}
                  </strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Total: {inr(viewBill.totalAmount)} | Paid: {inr(viewBill.paidAmount)}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setViewBill(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="rr-btn rr-btn--green"
                  style={{ height: 36, padding: "0 16px" }}
                  onClick={() => {
                    setViewBill(null);
                    setPrintBill(viewBill);
                  }}
                >
                  <LuPrinter size={15} /> Print Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: AUTHENTIC NARAYAN HOSPITAL PHARMACY TAX INVOICE PRINT SLIP ── */}
      {printBill && (
        <div className="ph-modal-overlay" onClick={() => setPrintBill(null)}>
          <div className="ph-receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ph-modal-header no-print" style={{ background: "linear-gradient(100deg, #0b2556 0%, #1e5a8e 100%)" }}>
              <div className="ph-mh-title" style={{ color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <LuPrinter size={17} color="#f5c542" /> Official Pharmacy Tax Invoice Preview
              </div>
              <button
                type="button"
                className="ph-modal-close-btn"
                onClick={() => setPrintBill(null)}
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="ph-receipt-sheet">
              {/* Hospital Header */}
              <div className="ph-print-hospital-header">
                <div className="ph-hosp-brand-row">
                  <div className="ph-hosp-logo">🏥</div>
                  <div className="ph-hosp-text">
                    <h1 className="ph-hosp-name">Narayan Hospital</h1>
                    <div className="ph-hosp-tag">HOSPITAL MANAGEMENT SYSTEM • CENTRAL PHARMACY DISPENSARY</div>
                    <div className="ph-hosp-address">
                      Plot 120, Near Narayan Circle, By-Pass Road, Jaipur - 302020 (Rajasthan)
                    </div>
                    <div className="ph-hosp-lic">
                      Phone: +91 141-2890000 • Email: pharmacy@narayanhospital.com
                      <br />
                      <strong>Drug Lic No:</strong> RJ-JP2-2024-009182 / 009183 • <strong>GSTIN:</strong> 08AABCN9812K1Z9
                    </div>
                  </div>
                </div>
                <div className="ph-invoice-title-band">
                  RETAIL PHARMACY CASH MEMO &amp; TAX INVOICE
                  <span className="copy-type">(ORIGINAL FOR RECIPIENT)</span>
                </div>
              </div>

              {/* Patient & Bill Metadata Grid */}
              <div className="ph-print-meta-grid">
                <div className="ph-pm-box">
                  <div className="ph-pm-row">
                    <span className="lbl">Invoice Number:</span>
                    <strong className="val invoice-num">{printBill.billNo}</strong>
                  </div>
                  <div className="ph-pm-row">
                    <span className="lbl">Date &amp; Time:</span>
                    <span className="val">{printBill.date} • {printBill.time || "11:00 AM"}</span>
                  </div>
                  <div className="ph-pm-row">
                    <span className="lbl">Dispensing Counter:</span>
                    <span className="val">Central Pharmacy • Counter-01</span>
                  </div>
                  <div className="ph-pm-row">
                    <span className="lbl">Payment Method:</span>
                    <strong className="val mode" style={{ color: printBill.dueAmount > 0 ? "#dc2626" : "#059669" }}>
                      {printBill.paymentMode?.toUpperCase()} ({printBill.dueAmount === 0 ? "PAID / CLEARED" : "PENDING DUE"})
                    </strong>
                  </div>
                </div>

                <div className="ph-pm-box">
                  <div className="ph-pm-row">
                    <span className="lbl">Patient Name:</span>
                    <strong className="val">{printBill.patientName}</strong>
                  </div>
                  <div className="ph-pm-row">
                    <span className="lbl">UHID Number:</span>
                    <strong className="val uhid">{printBill.uhid}</strong>
                  </div>
                  <div className="ph-pm-row">
                    <span className="lbl">Age / Gender:</span>
                    <span className="val">{printBill.age ? `${printBill.age} Yrs` : "30 Yrs"} / {printBill.gender || "Male"}</span>
                  </div>
                  <div className="ph-pm-row">
                    <span className="lbl">Prescribing Doctor:</span>
                    <span className="val">{printBill.doctor || "Dr. Rudresh Singh (MD Medicine)"}</span>
                  </div>
                </div>
              </div>

              {/* Particulars Table */}
              <table className="ph-print-items-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th>MEDICINE / DRUG PARTICULARS</th>
                    <th style={{ width: 85 }}>BATCH</th>
                    <th style={{ width: 75 }}>EXPIRY</th>
                    <th style={{ width: 65 }}>HSN</th>
                    <th style={{ width: 50, textAlign: "center" }}>QTY</th>
                    <th style={{ width: 80, textAlign: "right" }}>MRP (₹)</th>
                    <th style={{ width: 60, textAlign: "center" }}>GST %</th>
                    <th style={{ width: 90, textAlign: "right" }}>AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {printBill.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{item.name}</strong>
                        <div className="generic-sub">{item.generic}</div>
                      </td>
                      <td><code>{item.batch}</code></td>
                      <td>{item.expiry?.slice(0, 7) || "2027"}</td>
                      <td>{item.hsn || "300490"}</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{item.qty}</td>
                      <td style={{ textAlign: "right" }}>{Number(item.mrp).toFixed(2)}</td>
                      <td style={{ textAlign: "center" }}>{item.gst || 12}%</td>
                      <td style={{ textAlign: "right", fontWeight: 800 }}>{(item.qty * item.mrp).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Tax Calculation Breakdown */}
              <div className="ph-print-totals-section">
                <div className="ph-pts-left">
                  <div className="ph-in-words">
                    <strong>Amount in Words:</strong>
                    <span>{amountToWords(printBill.totalAmount)}</span>
                  </div>
                  <div className="ph-disclaimer-box">
                    <strong>Terms &amp; Conditions / Important Instructions:</strong>
                    <ol>
                      <li>Medicines once sold cannot be returned without original cash memo.</li>
                      <li>Cold storage / refrigerated items (2°C - 8°C) are strictly non-returnable.</li>
                      <li>Schedule H and H1 drugs dispensed strictly on the prescription of a registered medical practitioner.</li>
                    </ol>
                  </div>
                </div>

                <div className="ph-pts-right">
                  <table className="ph-totals-table">
                    <tbody>
                      <tr>
                        <td>MRP Gross Total:</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          ₹ {Number(printBill.totalAmount).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td>Taxable Value (Base):</td>
                        <td style={{ textAlign: "right" }}>
                          ₹ {(Number(printBill.totalAmount) / 1.12).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td>CGST + SGST (Included):</td>
                        <td style={{ textAlign: "right" }}>
                          ₹ {(Number(printBill.totalAmount) - Number(printBill.totalAmount) / 1.12).toFixed(2)}
                        </td>
                      </tr>
                      <tr className="grand-total-row">
                        <td>TOTAL PAID:</td>
                        <td style={{ textAlign: "right", color: "#059669" }}>
                          ₹ {Number(printBill.paidAmount).toFixed(2)}
                        </td>
                      </tr>
                      {printBill.dueAmount > 0 && (
                        <tr className="balance-due-row">
                          <td>Balance Due:</td>
                          <td style={{ textAlign: "right", color: "#dc2626", fontWeight: 800 }}>
                            ₹ {Number(printBill.dueAmount).toFixed(2)} (Pay Later)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Barcode & Pharmacist Stamp */}
              <div className="ph-print-signatures">
                <div className="ph-barcode-area">
                  <div className="ph-barcode">*{printBill.billNo}*</div>
                  <div className="barcode-caption">Computerized Tax Invoice • Validated by Narayan Hospital Pharmacy</div>
                </div>
                <div className="ph-signature-box">
                  <div className="sig-line" />
                  <strong>Authorized Pharmacist &amp; Cashier</strong>
                  <div className="sig-sub">Central Pharmacy Desk • Counter-01</div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Hidden when printing) */}
            <div className="ph-modal-footer no-print">
              <button
                type="button"
                className="btn-close-window"
                onClick={() => setPrintBill(null)}
              >
                Close Window
              </button>
              <button
                type="button"
                className="btn-print-slip"
                onClick={() => window.print()}
              >
                <LuPrinter size={16} /> Print Official Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}