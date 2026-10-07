import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Button from "../../../components/common/Button.jsx";
import patientService from "../../../api/services/patientService";
import billingInvoicesService from "../../../api/services/billingInvoicesService";
import opdService from "../../../api/services/opdService";
import { mockStore } from "../../../mock/mockStore";
import { isMockMode } from "../../../config/appConfig";
import "./BillingInvoiceForm.css";

const STANDARD_SERVICES = [
  { name: "OPD Specialist Consultation", price: 800 },
  { name: "Emergency Casualty Consultation", price: 1200 },
  { name: "ECG (12 Lead)", price: 450 },
  { name: "Complete Blood Count (CBC)", price: 350 },
  { name: "X-Ray Chest PA View", price: 600 },
  { name: "Ultrasound Abdomen & Pelvis", price: 1400 },
  { name: "Dressing / Wound Care (Minor)", price: 250 },
  { name: "IV Infusion / Injection Charges", price: 200 },
  { name: "Blood Sugar (RBS)", price: 100 },
];

export default function BillingInvoiceForm({ billingType = "OPD" }) {
  const [patients, setPatients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedUhid, setSelectedUhid] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [billItems, setBillItems] = useState([
    { id: 1, name: `${billingType} Consultation & Services`, qty: 1, price: 800 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("UPI / PhonePe");
  const [activeInvoiceModal, setActiveInvoiceModal] = useState(null);

  // Helper to fetch and map today's OPD tokens
  const fetchTokenMap = async () => {
    try {
      const opdQueueData = await opdService.getQueue();
      const map = {};
      (opdQueueData || []).forEach((item) => {
        let custom = item.custom_fields;
        if (typeof custom === "string") {
          try { custom = JSON.parse(custom); } catch (e) {}
        }
        const tokenNo = custom?.opd_token || custom?.token_number || item.encounter_no || item.tokenNo || "";
        if (tokenNo) {
          if (item.uhid) map[item.uhid] = tokenNo;
          if (item.patient_id) map[item.patient_id] = tokenNo;
          if (item.id) map[item.id] = tokenNo;
        }
      });
      return map;
    } catch (e) {
      return {};
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (isMockMode) {
        setPatients(mockStore.getPatients());
        setSearchResults(mockStore.getPatients());
        setInvoices(mockStore.getInvoices());
        return;
      }
      try {
        const [patientsData, invoicesData, tMap] = await Promise.all([
          patientService.search(),
          billingInvoicesService.getAll(),
          fetchTokenMap()
        ]);

        const mappedPatients = (patientsData || []).map((p) => {
          const token = tMap[p.uhid] || tMap[p.id] || p.today_token || p.opd_token || "";
          return {
            id: p.id,
            uhid: p.uhid,
            name: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
            phone: p.phone || "—",
            age: p.age ?? (p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth).getTime()) / 3.15576e+10) : 0),
            gender: p.gender || "—",
            token: token
          };
        });

        const patientNameMap = {};
        mappedPatients.forEach((p) => {
          patientNameMap[p.id] = p.name;
          patientNameMap[p.uhid] = p.name;
        });

        const mappedInvoices = (invoicesData || []).map((inv) => ({
          id: inv.id,
          invoiceNo: inv.invoice_no,
          patientName: patientNameMap[inv.patient_id] || inv.patient_name || inv.patient_id || "Patient",
          uhid: inv.uhid || "—",
          service: inv.billing_type || "Hospital Charges",
          grossAmount: inv.total_amount,
          discount: inv.discount_amount,
          netAmount: inv.net_amount,
          paymentMode: inv.payment_mode || "N/A",
          status: inv.status,
          date: new Date(inv.created_at).toLocaleDateString()
        }));

        setPatients(mappedPatients);
        setSearchResults(mappedPatients);
        setInvoices(mappedInvoices);
      } catch (err) {
        setPatients(mockStore.getPatients());
        setSearchResults(mockStore.getPatients());
        setInvoices(mockStore.getInvoices());
      }
    };
    fetchData();
  }, []);

  // Debounced API Search on query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(patients);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [apiResults, currentTokenMap] = await Promise.all([
          patientService.search({ query: searchQuery.trim() }),
          fetchTokenMap()
        ]);

        const mappedApi = (apiResults || []).map((p) => {
          const token = currentTokenMap[p.uhid] || currentTokenMap[p.id] || p.today_token || p.opd_token || "";
          return {
            id: p.id,
            uhid: p.uhid,
            name: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
            phone: p.phone || "—",
            age: p.age ?? (p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth).getTime()) / 3.15576e+10) : 0),
            gender: p.gender || "—",
            token: token
          };
        });

        // Filter local patients matching token, name, uhid, or phone as well
        const q = searchQuery.toLowerCase().trim();
        const paddedQ = q.padStart(2, "0");
        const localMatches = patients.filter((p) => {
          const nameMatch = p.name.toLowerCase().includes(q);
          const uhidMatch = p.uhid.toLowerCase().includes(q);
          const phoneMatch = p.phone.includes(q);
          const tokenLower = (p.token || "").toLowerCase();
          const tokenMatch = Boolean(
            tokenLower && (
              tokenLower.includes(q) ||
              tokenLower.includes(paddedQ) ||
              tokenLower.endsWith(`-${q}`) ||
              tokenLower.endsWith(`-${paddedQ}`)
            )
          );
          return nameMatch || uhidMatch || phoneMatch || tokenMatch;
        });

        // Merge API results and local matches, deduplicated by UHID/ID
        const combined = [...mappedApi];
        localMatches.forEach((lp) => {
          if (!combined.some((ap) => ap.uhid === lp.uhid || ap.id === lp.id)) {
            combined.push(lp);
          }
        });

        setSearchResults(combined);
      } catch (err) {
        console.error("API Patient Search Error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, patients]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddItem = (service) => {
    setBillItems([
      ...billItems,
      { id: Date.now(), name: service.name, qty: 1, price: service.price },
    ]);
  };

  const handleRemoveItem = (id) => {
    setBillItems(billItems.filter((i) => i.id !== id));
  };

  const grossTotal = billItems.reduce((acc, curr) => acc + curr.qty * curr.price, 0);
  const netTotal = Math.max(0, grossTotal - discount);

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (!selectedUhid || !selectedPatient) {
      toast.error("Please search and select a patient to bill.");
      return;
    }
    if (billItems.length === 0) {
      toast.error("Please add at least one bill item.");
      return;
    }

    if (isMockMode) {
      const patient = selectedPatient || patients.find((p) => p.uhid === selectedUhid);
      const newInv = mockStore.addInvoice({
        uhid: patient?.uhid || selectedUhid,
        patientName: patient?.name || "Patient",
        service: billItems.map((i) => i.name).join(", "),
        grossAmount: grossTotal,
        discount: Number(discount),
        netAmount: netTotal,
        paymentMode,
        category: billingType,
        items: billItems,
      });

      setInvoices(mockStore.getInvoices());
      setActiveInvoiceModal(newInv);
      toast.success(`Bill ${newInv.invoiceNo} generated successfully!`, { icon: "🧾" });
      setBillItems([{ id: Date.now(), name: `${billingType} Service Charge`, qty: 1, price: 800 }]);
      setDiscount(0);
      setSelectedPatient(null);
      setSelectedUhid("");
      setSearchQuery("");
      return;
    }

    const patient = selectedPatient;
    
    try {
      const payload = {
        patient_id: patient.id,
        facility_id: "00000000-0000-0000-0000-000000000000",
        invoice_type: billingType.toLowerCase(),
        items: billItems.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.price
        })),
        discount_total: Number(discount),
        payment_mode: paymentMode.toLowerCase().includes("upi") ? "upi" : 
                      paymentMode.toLowerCase().includes("cash") ? "cash" : "card",
        amount_paid: netTotal
      };
      
      const newInvData = await billingInvoicesService.create(payload);
      
      const newInv = {
        id: newInvData.id,
        invoiceNo: newInvData.invoice_no,
        patientName: patient.name,
        uhid: patient.uhid,
        service: billItems.map((i) => i.name).join(", "),
        grossAmount: grossTotal,
        discount: Number(discount),
        netAmount: netTotal,
        paymentMode,
        status: newInvData.status,
        date: new Date().toLocaleDateString()
      };
  
      setInvoices((prev) => [newInv, ...prev]);
      setActiveInvoiceModal(newInv);
      toast.success(`Bill ${newInv.invoiceNo} generated successfully!`, {
        icon: "🧾",
      });
  
      setBillItems([{ id: Date.now(), name: `${billingType} Service Charge`, qty: 1, price: 800 }]);
      setDiscount(0);
      setSelectedPatient(null);
      setSelectedUhid("");
      setSearchQuery("");
    } catch (err) {
      toast.error("Failed to generate bill");
    }
  };

  return (
    <div className="bill-mod-grid">
      {/* Invoice Generator */}
      <div className="bill-mod-card">
        <div className="bill-mod-header">
          <Icon name="LuReceipt" size={20} className="bill-mod-icon" />
          <div>
            <h3 className="bill-mod-title">New {billingType} Billing Slip</h3>
            <p className="bill-mod-sub">Search patient by Name, UHID, or Today's Token Number</p>
          </div>
        </div>

        <form onSubmit={handleGenerateBill}>
          <div className="bill-mod-group">
            <label className="bill-mod-label">Select Patient *</label>

            {selectedPatient ? (
              <div className="bill-mod-selected-card">
                <div className="bill-mod-selected-info">
                  <div className="bill-mod-selected-icon">
                    <Icon name="LuUserCheck" size={24} />
                  </div>
                  <div>
                    <div className="bill-mod-selected-name">
                      {selectedPatient.name}
                      {selectedPatient.token && (
                        <span className="bill-mod-token-tag">
                          <Icon name="LuTicket" size={13} /> Token #{selectedPatient.token}
                        </span>
                      )}
                    </div>
                    <div className="bill-mod-selected-meta">
                      <span><strong>UHID:</strong> {selectedPatient.uhid}</span>
                      <span>•</span>
                      <span><strong>Phone:</strong> {selectedPatient.phone}</span>
                      {selectedPatient.age > 0 && (
                        <>
                          <span>•</span>
                          <span><strong>Age/Gender:</strong> {selectedPatient.age}Y / {selectedPatient.gender}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="bill-mod-change-btn"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSelectedUhid("");
                    setSearchQuery("");
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                >
                  <Icon name="LuX" size={16} /> Change Patient
                </button>
              </div>
            ) : (
              <div className="bill-mod-search-container" ref={searchContainerRef}>
                <div className="bill-mod-search-input-wrap">
                  <Icon name="LuSearch" size={18} className="bill-mod-search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="bill-mod-search-input"
                    placeholder="Search patient by Name, UHID, or Today's Token No (e.g. T-01, 01)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="bill-mod-search-clear"
                      onClick={() => {
                        setSearchQuery("");
                        setShowDropdown(false);
                      }}
                    >
                      <Icon name="LuX" size={16} />
                    </button>
                  )}
                </div>

                {showDropdown && (
                  <div className="bill-mod-search-results">
                    <div className="bill-mod-search-header">
                      <span>
                        {isSearching ? "Searching API..." : `Matching Patients & Today's OPD Tokens (${searchResults.length})`}
                      </span>
                    </div>

                    {isSearching ? (
                      <div className="bill-mod-no-results">
                        <span>Searching hospital database...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="bill-mod-patient-list">
                        {searchResults.slice(0, 15).map((p) => (
                          <div
                            key={p.uhid || p.id}
                            className="bill-mod-patient-card"
                            onClick={() => {
                              setSelectedPatient(p);
                              setSelectedUhid(p.uhid);
                              setShowDropdown(false);
                              setSearchQuery("");
                            }}
                          >
                            <div className="bill-patient-card-left">
                              <div className="bill-patient-card-avatar">
                                {p.name ? p.name.charAt(0).toUpperCase() : "P"}
                              </div>
                              <div>
                                <div className="bill-patient-card-name">{p.name}</div>
                                <div className="bill-patient-card-sub">
                                  <span className="bill-uhid-pill">{p.uhid}</span>
                                  <span>• {p.phone}</span>
                                  {p.age > 0 && <span>• {p.age}Y/{p.gender}</span>}
                                </div>
                              </div>
                            </div>
                            {p.token && (
                              <div className="bill-patient-card-right">
                                <span className="bill-mod-token-badge">
                                  <Icon name="LuTicket" size={13} /> Token: {p.token}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bill-mod-no-results">
                        <Icon name="LuUserX" size={20} />
                        <span>No patient found matching "{searchQuery}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Add Services Chips */}
          <div className="bill-mod-quick">
            <span className="bill-mod-qlabel">⚡ Quick Add Standard Hospital Services:</span>
            <div className="bill-mod-chips">
              {STANDARD_SERVICES.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  className="bill-mod-chip"
                  onClick={() => handleAddItem(s)}
                >
                  + {s.name} (₹{s.price})
                </button>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div className="bill-mod-table-wrap">
            <table className="bill-mod-table">
              <thead>
                <tr>
                  <th>Item / Service Description</th>
                  <th>Qty</th>
                  <th>Rate (₹)</th>
                  <th>Total (₹)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {billItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        className="bill-mod-input"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBillItems(
                            billItems.map((x) => (x.id === item.id ? { ...x, name: val } : x))
                          );
                        }}
                      />
                    </td>
                    <td style={{ width: 70 }}>
                      <input
                        type="number"
                        min="1"
                        className="bill-mod-input"
                        value={item.qty}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 1;
                          setBillItems(
                            billItems.map((x) => (x.id === item.id ? { ...x, qty: val } : x))
                          );
                        }}
                      />
                    </td>
                    <td style={{ width: 100 }}>
                      <input
                        type="number"
                        className="bill-mod-input"
                        value={item.price}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setBillItems(
                            billItems.map((x) => (x.id === item.id ? { ...x, price: val } : x))
                          );
                        }}
                      />
                    </td>
                    <td style={{ width: 90, fontWeight: 700 }}>₹{item.qty * item.price}</td>
                    <td style={{ width: 40 }}>
                      <button
                        type="button"
                        className="bill-mod-del"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Icon name="LuTrash2" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Summary and Payment */}
          <div className="bill-mod-summary">
            <div className="bill-mod-sum-row">
              <span>Gross Subtotal:</span>
              <span className="bill-mod-bold">₹{grossTotal}</span>
            </div>
            <div className="bill-mod-sum-row">
              <span>Discount / Concession (₹):</span>
              <input
                type="number"
                className="bill-mod-disc-input"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="bill-mod-sum-row bill-mod-sum-total">
              <span>Net Payable:</span>
              <span className="bill-mod-net">₹{netTotal}</span>
            </div>

            <div className="bill-mod-payrow">
              <label className="bill-mod-label">Payment Mode:</label>
              <select
                className="bill-mod-select"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="UPI / PhonePe">UPI (GPay / PhonePe / QR)</option>
                <option value="Cash">Cash Counter</option>
                <option value="Debit Card">Debit / Credit Card (POS)</option>
                <option value="TPA Insurance">TPA / Health Insurance Claim</option>
              </select>
            </div>
          </div>

          <Button type="submit" fullWidth>
            <Icon name="LuPrinter" size={16} /> Generate & Collect Payment (₹{netTotal})
          </Button>
        </form>
      </div>

      {/* Recent Invoices Column */}
      <div className="bill-mod-card">
        <div className="bill-mod-header">
          <div>
            <h3 className="bill-mod-title">Recent Invoices</h3>
            <p className="bill-mod-sub">Completed transactions and receipts</p>
          </div>
          <span className="bill-mod-badge">{invoices.length} Bills</span>
        </div>

        <div className="bill-mod-list">
          {invoices.map((inv) => (
            <div key={inv.id} className="bill-mod-item">
              <div>
                <div className="bill-item-no">{inv.invoiceNo}</div>
                <div className="bill-item-name">{inv.patientName}</div>
                <div className="bill-item-svc">{inv.service}</div>
                <div className="bill-item-meta">{inv.date} • {inv.paymentMode}</div>
              </div>
              <div className="bill-item-right">
                <div className="bill-item-amt">₹{inv.netAmount}</div>
                <span className="bill-item-status">Paid</span>
                <button
                  type="button"
                  className="bill-item-view"
                  onClick={() => setActiveInvoiceModal(inv)}
                >
                  View Bill
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Modal for Printing */}
      {activeInvoiceModal && (
        <div className="bill-modal-overlay" onClick={() => setActiveInvoiceModal(null)}>
          <div className="bill-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bill-rec-head">
              <h2>K.G. NANDA MEMORIAL HOSPITAL</h2>
              <p>Plot 42, Health City, Sector 5, Jaipur • Ph: 0141-2890000</p>
              <div className="bill-rec-type">{billingType.toUpperCase()} BILLING RECEIPT</div>
            </div>

            <div className="bill-rec-meta">
              <div><strong>Invoice:</strong> {activeInvoiceModal.invoiceNo}</div>
              <div><strong>Date:</strong> {activeInvoiceModal.date}</div>
              <div><strong>Patient:</strong> {activeInvoiceModal.patientName}</div>
              <div><strong>UHID:</strong> {activeInvoiceModal.uhid}</div>
              <div><strong>Mode:</strong> {activeInvoiceModal.paymentMode}</div>
              <div><strong>Status:</strong> {activeInvoiceModal.status}</div>
            </div>

            <div className="bill-rec-body">
              <div className="bill-rec-line bill-rec-hdr">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="bill-rec-line">
                <span>{activeInvoiceModal.service}</span>
                <span>₹{activeInvoiceModal.grossAmount}</span>
              </div>
              {activeInvoiceModal.discount > 0 && (
                <div className="bill-rec-line">
                  <span>Discount</span>
                  <span>- ₹{activeInvoiceModal.discount}</span>
                </div>
              )}
              <div className="bill-rec-line bill-rec-grand">
                <span>TOTAL PAID</span>
                <span>₹{activeInvoiceModal.netAmount}</span>
              </div>
            </div>

            <div className="bill-modal-btns">
              <button
                type="button"
                className="bill-btn-print"
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={16} /> Print Receipt
              </button>
              <button
                type="button"
                className="bill-btn-close"
                onClick={() => setActiveInvoiceModal(null)}
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
