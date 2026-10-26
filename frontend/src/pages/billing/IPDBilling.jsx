import React, { useState, useCallback, useEffect } from "react";
import ipdService from "../../api/services/ipdService";
import billingService from "../../api/services/billingService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/common/Icon.jsx";
import "./IPDBilling.css";

const PAGE_SIZE = 10;

const CATEGORY_SERVICE_LIST = {
  "Room Charges": [
    { name: "General Ward (Per Day)", rate: 1500 },
    { name: "Semi-Private Room (Per Day)", rate: 2500 },
    { name: "Private AC Room (Per Day)", rate: 4000 },
    { name: "ICU Bed Charge (Per Day)", rate: 5500 },
  ],
  Consultation: [
    { name: "Doctor Visit", rate: 800 },
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

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB").replace(/\//g, "-");
};

const daysBetween = (start) => {
  if (!start) return 0;
  return Math.max(0, Math.ceil((Date.now() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)));
};

export default function IPDBilling() {
  const navigate = useNavigate();

  // ── View mode: 'list' (patient list) or 'detail' (single patient billing) ──
  const [viewMode, setViewMode] = useState("list");

  // ── Patient list state ──
  const [patients, setPatients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("admitted"); // admitted | discharged | all
  const [listLoading, setListLoading] = useState(false);

  // ── Selected patient detail state ──
  const [patient, setPatient] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Service / Charge Form (detail view) ──
  const [activeCategory, setActiveCategory] = useState("Room Charges");
  const [selectedServiceName, setSelectedServiceName] = useState("General Ward (Per Day)");
  const [rateInput, setRateInput] = useState(1500);
  const [qtyInput, setQtyInput] = useState(1);
  const [remarks, setRemarks] = useState("");
  const [customRoomCharges, setCustomRoomCharges] = useState(null);
  const [postingBedCharges, setPostingBedCharges] = useState(false);

  // ── Payment Modal ──
  const [showReceivePayModal, setShowReceivePayModal] = useState(false);
  const [showChangeBedModal, setShowChangeBedModal] = useState(false);
  const [showPrintBillModal, setShowPrintBillModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    mode: "Cash",
    type: "invoice_payment",
    remarks: "Running bill payment",
  });

  const [bedForm, setBedForm] = useState({
    ward: "General Ward",
    roomNo: "",
    bedNo: "",
  });

  // ── Fetch patient list (paginated) ──
  const fetchPatientList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await ipdService.getAdmissions({
        search: searchTerm.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        limit: PAGE_SIZE,
      });
      const data = res?.data ?? res ?? {};
      const rows = Array.isArray(data) ? data : data.rows ?? [];
      const count = Array.isArray(data) ? rows.length : (data.totalCount ?? data.count ?? rows.length);
      setPatients(rows.map(mapListItem));
      setTotalCount(count);
    } catch (err) {
      console.error("Failed to load patient list", err);
      toast.error("Failed to load patient list");
    } finally {
      setListLoading(false);
    }
  }, [searchTerm, statusFilter, page]);

  useEffect(() => {
    fetchPatientList();
  }, [fetchPatientList]);

  // ── Map backend admission → list item ──
  const mapListItem = (bp) => {
    const first = bp.first_name || bp.firstName || "";
    const last = bp.last_name || bp.lastName || "";
    const name = bp.patient_name || bp.name || `${first} ${last}`.trim() || "Unknown Patient";
    const admittedAt = bp.admitted_at || bp.admission_date;
    return {
      id: bp.id,
      admissionId: bp.id,
      encounterId: bp.encounter_id || bp.id,
      admissionNo: bp.admission_no || bp.encounter_no || `IPD-${bp.id?.slice(-6).toUpperCase()}`,
      uhid: bp.uhid || bp.id || "N/A",
      name,
      age: bp.age ?? (bp.date_of_birth ? Math.floor((Date.now() - new Date(bp.date_of_birth).getTime()) / 3.15576e+10) : 0),
      gender: bp.gender || "Unknown",
      mobile: bp.phone || bp.patient_mobile || bp.mobile || "N/A",
      ward: bp.ward_name || bp.ward || "—",
      bedNo: bp.bed_name || bp.bed_no || bp.bedNo || "—",
      doctor:
        bp.doctor_name ||
        `${bp.doctor_first_name || ""} ${bp.doctor_last_name || ""}`.trim() ||
        "Dr. Assigned",
      admissionDate: formatDate(admittedAt),
      daysStayed: daysBetween(admittedAt),
      status: bp.status || "Admitted",
    };
  };

  // ── Select patient → load detail view ──
  const handleSelectPatient = async (p) => {
    setPatient({ ...p, items: [], historyPayments: [] });
    setViewMode("detail");
    setBedForm({ ward: p.ward, roomNo: "", bedNo: p.bedNo });
    await fetchPatientBilling(p);
  };

  // ── Fetch billing detail for selected patient ──
  const fetchPatientBilling = useCallback(async (p) => {
    if (!p) return;
    setDetailLoading(true);
    try {
      const encounterId = p.encounterId || p.id;
      const [itemsData, paymentsData] = await Promise.all([
        billingService.getRunningBill(encounterId),
        billingService.getEncounterPayments(encounterId),
      ]);

      const mappedItems = (itemsData || []).map((i) => ({
        id: i.id,
        date: new Date(i.created_at || new Date()).toLocaleDateString("en-GB").replace(/\//g, "-"),
        category: i.item_category || i.custom_fields?.item_category || "Others",
        name: i.item_name || i.description || "Charge",
        qty: Number(i.quantity) || 1,
        rate: Number(i.rate || i.unit_price || 0),
        amount: Number(i.total_amount || i.net_amount || 0),
        selected: false,
      }));

      const mappedPayments = (paymentsData || []).map((pay) => ({
        id: pay.id,
        date: new Date(pay.payment_date || pay.paid_at || new Date()).toLocaleDateString("en-GB").replace(/\//g, "-"),
        amount: Number(pay.amount) || 0,
        mode: pay.payment_method || pay.payment_method_name || "Cash",
        type: pay.payment_type || "Payment",
        remarks: pay.notes || "",
      }));

      setPatient((prev) => ({
        ...prev,
        items: mappedItems,
        historyPayments: mappedPayments,
      }));
    } catch (err) {
      console.error("Failed to load billing data", err);
      toast.error("Failed to load billing details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Search ──
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatientList();
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setPage(1);
    fetchPatientList();
  };

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ── Category / Service ──
  useEffect(() => {
    const loadBedTariffs = async () => {
      try {
        const cats = await ipdService.getBedCategories();
        const catList = Array.isArray(cats) ? cats : cats?.data || [];
        if (catList.length > 0) {
          const list = catList.map((c) => ({
            name: `${c.name} (Per Day)`,
            rate: Number(c.daily_rate) || 1500,
          }));
          setCustomRoomCharges(list);
        }
      } catch (err) {
        console.error("Failed to load bed category tariffs", err);
      }
    };
    loadBedTariffs();
  }, []);

  const getServicesForCategory = useCallback(
    (cat) => {
      if (cat === "Room Charges" && customRoomCharges && customRoomCharges.length > 0) {
        return customRoomCharges;
      }
      return CATEGORY_SERVICE_LIST[cat] || [];
    },
    [customRoomCharges]
  );

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    const services = getServicesForCategory(cat);
    if (services.length > 0) {
      setSelectedServiceName(services[0].name);
      setRateInput(services[0].rate);
    }
  };

  const handleServiceChange = (e) => {
    const sName = e.target.value;
    setSelectedServiceName(sName);
    const services = getServicesForCategory(activeCategory);
    const found = services.find((s) => s.name === sName);
    if (found) setRateInput(found.rate);
  };

  // ── Post Bed Charges ──
  const handlePostBedCharges = async () => {
    if (!patient) return;
    try {
      setPostingBedCharges(true);
      const encId = patient.encounterId || patient.id;
      const res = await billingService.postBedCharges({ encounter_id: encId });
      toast.success(
        res?.length > 0
          ? `Calculated and posted bed charges for ${patient.name}!`
          : "Bed charges are up to date.",
        { icon: "🛏️" }
      );
      await fetchPatientBilling(patient);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to post bed charges");
    } finally {
      setPostingBedCharges(false);
    }
  };

  // ── Add charge ──
  const handleAddServiceItem = async () => {
    if (!patient) return;
    const rate = Number(rateInput) || 0;
    const qty = Number(qtyInput) || 1;
    const amount = rate * qty;
    try {
      await billingService.addCharge({
        encounter_id: patient.encounterId || patient.id,
        item_name: selectedServiceName,
        item_category: activeCategory === "Room Charges" ? "Room" : activeCategory,
        quantity: qty,
        rate,
        total_amount: amount,
      });
      await fetchPatientBilling(patient);
      setQtyInput(1);
      toast.success(`Added ${selectedServiceName}.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add charge.");
    }
  };

  const handleRemoveItem = async (id) => {
    if (!patient) return;
    try {
      await billingService.removeCharge(id, { modified_by: "system" });
      await fetchPatientBilling(patient);
      toast.success("Charge removed.");
    } catch (err) {
      toast.error("Failed to remove charge.");
    }
  };

  const handleToggleSelectItem = (id) => {
    if (!patient) return;
    setPatient((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)),
    }));
  };

  const handleRemoveSelected = async () => {
    if (!patient) return;
    const sel = patient.items.filter((i) => i.selected);
    if (sel.length === 0) return toast.error("Select items to remove.");
    try {
      for (const item of sel) await billingService.removeCharge(item.id, { modified_by: "system" });
      await fetchPatientBilling(patient);
      toast.success(`Removed ${sel.length} item(s).`);
    } catch (err) {
      toast.error("Failed to remove items.");
    }
  };

  // ── Record payment ──
  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!patient) return;
    const amt = Number(paymentForm.amount) || 0;
    if (amt <= 0) return toast.error("Enter a valid amount.");
    if (amt > pendingAmount) return toast.error(`Amount exceeds pending ₹${pendingAmount.toLocaleString("en-IN")}.`);

    try {
      await billingService.recordAdvancePayment({
        encounter_id: patient.encounterId || patient.id,
        patient_id: patient.id,
        amount: amt,
        payment_mode: paymentForm.mode,
        payment_type: paymentForm.type,
        notes: paymentForm.remarks || "Running bill payment",
      });
      await fetchPatientBilling(patient);
      setShowReceivePayModal(false);
      setPaymentForm({ amount: "", mode: "Cash", type: "invoice_payment", remarks: "Running bill payment" });
      toast.success(`₹${amt.toLocaleString("en-IN")} collected.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to collect payment.");
    }
  };

  const handleSaveBedChange = (e) => {
    e.preventDefault();
    if (!patient) return;
    setPatient((prev) => ({ ...prev, ward: bedForm.ward, roomNo: bedForm.roomNo, bedNo: bedForm.bedNo }));
    setShowChangeBedModal(false);
    toast.success("Bed updated.");
  };

  // ── Financial calculations ──
  const totalBills = patient?.items?.reduce((a, c) => a + c.amount, 0) || 0;
  const totalPayments = patient?.historyPayments?.reduce((a, c) => a + c.amount, 0) || 0;
  const pendingAmount = Math.max(0, totalBills - totalPayments);

  const roomChargesTotal = patient ? patient.items.filter((i) => i.category === "Room").reduce((a, c) => a + c.amount, 0) : 0;
  const consultationTotal = patient ? patient.items.filter((i) => i.category === "Consultation").reduce((a, c) => a + c.amount, 0) : 0;
  const labTotal = patient ? patient.items.filter((i) => i.category === "Lab Test").reduce((a, c) => a + c.amount, 0) : 0;
  const radiologyTotal = patient ? patient.items.filter((i) => i.category === "Radiology").reduce((a, c) => a + c.amount, 0) : 0;

  // ── List View ──
  const renderList = () => (
    <div className="ipd-billing-page">
      <div className="ipd-page-header">
        <div className="ipd-header-left">
          <div className="ipd-header-icon-box">
            <Icon name="LuReceipt" size={24} />
          </div>
          <div>
            <h1 className="ipd-header-title">IPD Billing</h1>
            <p className="ipd-header-subtitle">
              Admitted patients ready for billing. Select a patient to create or view their bill.
            </p>
          </div>
        </div>
        <div className="ipd-header-right-actions">
          <button
            type="button"
            className="ipd-btn-add-patient"
            onClick={() => navigate("/ipd/admission")}
          >
            <Icon name="LuUserPlus" size={16} /> Add New Patient
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="ipd-search-filters-row">
        <form onSubmit={handleSearchSubmit} className="ipd-search-bar-row">
          <div className="ipd-search-input-wrap">
            <Icon name="LuSearch" size={16} className="ipd-search-icon" />
            <input
              type="text"
              className="ipd-search-input"
              placeholder="Search by UHID, Admission No, Name, or Mobile..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button type="submit" className="ipd-btn-search">
            <Icon name="LuSearch" size={16} /> Search
          </button>
          {searchTerm && (
            <button type="button" className="ipd-btn-outline" onClick={handleClearSearch}>
              <Icon name="LuX" size={14} /> Clear
            </button>
          )}
        </form>

        <div className="ipd-status-filters">
          {["admitted", "discharged", "all"].map((s) => (
            <button
              key={s}
              type="button"
              className={`ipd-status-pill ${statusFilter === s ? "active" : ""}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Patient List */}
      <div className="ipd-list-card">
        {listLoading ? (
          <div className="ipd-empty">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="ipd-empty">
            <Icon name="LuUser" size={32} />
            <p>No patients found.</p>
          </div>
        ) : (
          <table className="ipd-patient-table">
            <thead>
              <tr>
                <th>UHID</th>
                <th>Patient</th>
                <th>Age / Gender</th>
                <th>Ward / Bed</th>
                <th>Doctor</th>
                <th>Admitted</th>
                <th>Days</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                return (
                  <tr key={p.id} className="ipd-patient-row">
                    <td>
                      <span className="ipd-tag-uhid">{p.uhid}</span>
                    </td>
                    <td>
                      <div className="ipd-patient-name-cell">{p.name}</div>
                      <div className="ipd-patient-admission-no">{p.admissionNo}</div>
                    </td>
                    <td>{p.age} Yrs / {p.gender}</td>
                    <td>{p.ward} / {p.bedNo}</td>
                    <td>{p.doctor}</td>
                    <td>{p.admissionDate}</td>
                    <td>{p.daysStayed}</td>
                    <td>
                      <span
                        className={`ipd-status-badge ${p.status === "Admitted" ? "ipd-badge-active" : "ipd-badge-discharged"}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="ipd-btn-view-billing"
                        onClick={() => handleSelectPatient(p)}
                      >
                        <Icon name="LuCreditCard" size={14} /> Create Bill
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="ipd-pagination">
            <span>Page {page} of {totalPages} ({totalCount} patients)</span>
            <div className="ipd-pagination-controls">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Detail View ──
  const renderDetail = () => {
    if (!patient) return null;
    return (
      <div className="ipd-billing-page ipd-detail-page">
        {/* Header with back */}
        <div className="ipd-page-header">
          <div className="ipd-header-left">
            <button type="button" className="ipd-btn-back" onClick={() => setViewMode("list")}>
              <Icon name="LuArrowLeft" size={16} /> Back to Patient List
            </button>
            <div className="ipd-header-icon-box">
              <Icon name="LuReceipt" size={24} />
            </div>
            <div>
              <h1 className="ipd-header-title">Patient Billing</h1>
              <p className="ipd-header-subtitle">
                {patient.name} • UHID: {patient.uhid} • Admission: {patient.admissionNo}
              </p>
            </div>
          </div>
          <div className="ipd-header-right-actions">
            <button
              type="button"
              className="ipd-btn-discharge"
              onClick={() => toast.navigate ? null : null}
            >
              <Icon name="LuLogOut" size={14} /> Discharge Patient
            </button>
          </div>
        </div>

        {/* Patient Info Grid */}
        <div className="ipd-upper-grid">
          <div className="ipd-card">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuUserCheck" className="ipd-card-icon" />
                <h2 className="ipd-card-title">Patient Information</h2>
              </div>
            </div>
            <div className="ipd-patient-info-layout">
              <div className="ipd-patient-photo-box">
                <span className="ipd-tag-uhid">{patient.uhid}</span>
              </div>
              <div className="ipd-patient-bio">
                <h3 className="ipd-patient-name">{patient.name}</h3>
                <div className="ipd-bio-line">
                  <Icon name="LuUser" size={14} /> {patient.age} Years / {patient.gender}
                </div>
                <div className="ipd-bio-line">
                  <Icon name="LuPhone" size={14} /> {patient.mobile}
                </div>
                <div className="ipd-bio-line">
                  <Icon name="LuMapPin" size={14} /> {patient.ward} / {patient.bedNo}
                </div>
                <div className="ipd-bio-line">
                  <Icon name="LuUser" size={14} /> Dr. {patient.doctor}
                </div>
                <div className="ipd-bio-line">
                  <Icon name="LuCalendar" size={14} /> Admitted: {patient.admissionDate} ({patient.daysStayed} days)
                </div>
              </div>
            </div>
          </div>

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
                <span className="ipd-meta-label">Bed No.</span>
                <span className="ipd-meta-val">{patient.bedNo}</span>
              </div>
              <div className="ipd-bed-detail-row">
                <span className="ipd-meta-label">Admission No.</span>
                <span className="ipd-meta-val">{patient.admissionNo}</span>
              </div>
              <div className="ipd-bed-detail-row">
                <span className="ipd-meta-label">Doctor</span>
                <span className="ipd-meta-val">{patient.doctor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Body */}
        <div className="ipd-main-grid">
          {/* Left: Charges */}
          <div className="ipd-col-left">
            <div className="ipd-card">
              <div className="ipd-card-header">
                <div className="ipd-card-title-group">
                  <Icon name="LuPlusCircle" className="ipd-card-icon" />
                  <h2 className="ipd-card-title">Add Charges</h2>
                </div>
              </div>
              <div className="ipd-category-pills">
                {Object.keys(CATEGORY_SERVICE_LIST).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`ipd-category-pill ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="ipd-add-service-row">
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Service</label>
                  <select
                    className="ipd-select-control"
                    value={selectedServiceName}
                    onChange={handleServiceChange}
                  >
                    {getServicesForCategory(activeCategory).map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
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
                  <label className="ipd-field-label">Qty / Days</label>
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
                    value={(Number(rateInput) * Number(qtyInput)).toLocaleString("en-IN")}
                  />
                </div>
                <button type="button" className="ipd-btn-add-item" onClick={handleAddServiceItem}>
                  <Icon name="LuPlus" size={16} /> Add
                </button>
                <button
                  type="button"
                  className="ipd-btn-add-item"
                  style={{ background: "#7c3aed", borderColor: "#6d28d9", color: "#fff", whiteSpace: "nowrap" }}
                  onClick={handlePostBedCharges}
                  disabled={postingBedCharges}
                  title="Calculate and post daily bed charges based on actual stay"
                >
                  <Icon name="LuBed" size={16} /> {postingBedCharges ? "Posting..." : "Post Bed Stay Charges"}
                </button>
              </div>
            </div>

            <div className="ipd-card">
              <div className="ipd-card-header">
                <div className="ipd-card-title-group">
                  <Icon name="LuSlidersHorizontal" className="ipd-card-icon" />
                  <h2 className="ipd-card-title">Bill Items</h2>
                </div>
                <button
                  type="button"
                  className="ipd-btn-remove-selected"
                  onClick={handleRemoveSelected}
                >
                  <Icon name="LuTrash2" size={14} /> Remove Selected
                </button>
              </div>
              <div className="ipd-bill-table-wrapper">
                <table className="ipd-bill-table">
                  <thead>
                    <tr>
                      <th style={{ width: 30, textAlign: "center" }}><input type="checkbox" disabled /></th>
                      <th style={{ width: 40 }}>#</th>
                      <th>Date</th>
                      <th>Service / Item</th>
                      <th>Category</th>
                      <th style={{ textAlign: "right" }}>Rate (₹)</th>
                      <th style={{ textAlign: "center" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Amount (₹)</th>
                      <th style={{ textAlign: "center", width: 60 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!patient.items || patient.items.length === 0) ? (
                      <tr><td colSpan="9" style={{ textAlign: "center", padding: 20, color: "#64748b" }}>No charges yet.</td></tr>
                    ) : (
                      patient.items.map((item, idx) => (
                        <tr key={item.id}>
                          <td style={{ textAlign: "center" }}>
                            <input type="checkbox" checked={!!item.selected} onChange={() => handleToggleSelectItem(item.id)} />
                          </td>
                          <td>{idx + 1}</td>
                          <td>{item.date}</td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.category}</td>
                          <td style={{ textAlign: "right" }}>{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: "center" }}>{item.qty}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: "center" }}>
                            <button type="button" className="ipd-btn-icon-delete" onClick={() => handleRemoveItem(item.id)}>
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
                <label className="ipd-field-label">Remarks</label>
                <textarea className="ipd-remarks-area" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
              <div className="ipd-left-bottom-actions">
                <button type="button" className="ipd-btn-outline" onClick={() => setShowPrintBillModal(true)}>
                  <Icon name="LuPrinter" size={15} /> Print Bill
                </button>
              </div>
            </div>
          </div>

          {/* Right: Payments + Summary */}
          <div className="ipd-col-right">
            <div className="ipd-card">
              <div className="ipd-card-header">
                <div className="ipd-card-title-group">
                  <Icon name="LuShieldAlert" className="ipd-card-icon" />
                  <h2 className="ipd-card-title">Payments</h2>
                </div>
                <button
                  type="button"
                  className="ipd-btn-receive-pay"
                  onClick={() => {
                    setPaymentForm({
                      amount: pendingAmount.toString(),
                      mode: "Cash",
                      type: "invoice_payment",
                      remarks: "Running bill payment",
                    });
                    setShowReceivePayModal(true);
                  }}
                >
                  <Icon name="LuCreditCard" size={14} /> Collect Payment
                </button>
              </div>
              <div className="ipd-advance-card-body">
                <div className="ipd-advance-deposit-box">
                  <span className="ipd-adv-label">Total Payments Received</span>
                  <span className="ipd-adv-val">₹{totalPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="ipd-adv-calculations">
                  <div className="ipd-adv-calc-row">
                    <span>Total Charges</span>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>₹{totalBills.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="ipd-adv-calc-row">
                    <span>Total Payments</span>
                    <span className="ipd-text-green">(-) ₹{totalPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="ipd-pending-banner">
                    <span className="ipd-pending-label">{pendingAmount > 0 ? "Pending" : "Cleared"}</span>
                    <span className="ipd-pending-val">₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ipd-card">
              <div className="ipd-card-header">
                <div className="ipd-card-title-group">
                  <Icon name="LuHistory" className="ipd-card-icon" />
                  <h2 className="ipd-card-title">Payment History</h2>
                </div>
              </div>
              <table className="ipd-history-mini-table">
                <thead>
                  <tr><th>#</th><th>Date</th><th>Amount</th><th>Mode</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {(!patient.historyPayments || patient.historyPayments.length === 0) ? (
                    <tr><td colSpan="5" style={{ textAlign: "center", padding: 12, color: "#64748b" }}>No payments yet.</td></tr>
                  ) : (
                    patient.historyPayments.map((p, idx) => (
                      <tr key={p.id}>
                        <td>{idx + 1}</td>
                        <td>{p.date}</td>
                        <td style={{ fontWeight: 700 }}>{p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td>{p.mode}</td>
                        <td style={{ color: "#64748b" }}>{p.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="ipd-card">
              <div className="ipd-card-header">
                <div className="ipd-card-title-group">
                  <Icon name="LuFileText" className="ipd-card-icon" />
                  <h2 className="ipd-card-title">Summary</h2>
                </div>
              </div>
              <div className="ipd-grand-summary-grid">
                <div>
                  <div className="ipd-grand-row"><span>Total Charges</span><span style={{ fontWeight: 700 }}>₹{totalBills.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
                  <div className="ipd-grand-row"><span>Total Payments</span><span className="ipd-text-green">₹{totalPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
                </div>
                <div>
                  <div className="ipd-pending-banner" style={{ marginTop: 12 }}>
                    <span className="ipd-pending-label">{pendingAmount > 0 ? "Pending Amount" : "Balance Cleared"}</span>
                    <span className="ipd-pending-val">₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
              <div className="ipd-bottom-actions-row">
                {pendingAmount > 0 ? (
                  <button
                    type="button"
                    className="ipd-btn-green-final"
                    onClick={() => {
                      setPaymentForm({ amount: pendingAmount.toString(), mode: "Cash", type: "invoice_payment", remarks: "Running bill payment" });
                      setShowReceivePayModal(true);
                    }}
                  >
                    <Icon name="LuCreditCard" size={18} /> Collect Pending Payment
                  </button>
                ) : (
                  <button type="button" className="ipd-btn-purple-discharge" onClick={() => toast.success("Balance cleared. Ready for discharge.")}>
                    <Icon name="LuArrowRight" size={18} /> Ready for Discharge
                  </button>
                )}
                <button type="button" className="ipd-btn-outline" onClick={() => setShowPrintBillModal(true)}>
                  <Icon name="LuPrinter" size={18} /> Generate Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Modals ──
  const renderModals = () => (
    <>
      {showReceivePayModal && (
        <div className="ipd-modal-backdrop" onClick={() => setShowReceivePayModal(false)}>
          <div className="ipd-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <h3 className="ipd-modal-title">Collect Payment</h3>
              <button type="button" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setShowReceivePayModal(false)}>
                <Icon name="LuX" size={18} />
              </button>
            </div>
            <form onSubmit={handleSavePayment}>
              <div className="ipd-modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Amount (₹)</label>
                  <input type="number" className="ipd-input-control" required value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                </div>
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Mode</label>
                  <select className="ipd-select-control" value={paymentForm.mode} onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Remarks</label>
                  <input type="text" className="ipd-input-control" placeholder="e.g. Partial payment" value={paymentForm.remarks} onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })} />
                </div>
              </div>
              <div className="ipd-modal-footer">
                <button type="button" className="ipd-btn-outline" onClick={() => setShowReceivePayModal(false)}>Cancel</button>
                <button type="submit" className="ipd-btn-search"><Icon name="LuSave" size={16} /> Collect</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showChangeBedModal && (
        <div className="ipd-modal-backdrop" onClick={() => setShowChangeBedModal(false)}>
          <div className="ipd-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <h3 className="ipd-modal-title">Change Bed</h3>
              <button type="button" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setShowChangeBedModal(false)}>
                <Icon name="LuX" size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveBedChange}>
              <div className="ipd-modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Ward</label>
                  <input type="text" className="ipd-input-control" value={bedForm.ward} onChange={(e) => setBedForm({ ...bedForm, ward: e.target.value })} />
                </div>
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Room No.</label>
                  <input type="text" className="ipd-input-control" value={bedForm.roomNo} onChange={(e) => setBedForm({ ...bedForm, roomNo: e.target.value })} />
                </div>
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Bed No.</label>
                  <input type="text" className="ipd-input-control" value={bedForm.bedNo} onChange={(e) => setBedForm({ ...bedForm, bedNo: e.target.value })} />
                </div>
              </div>
              <div className="ipd-modal-footer">
                <button type="button" className="ipd-btn-outline" onClick={() => setShowChangeBedModal(false)}>Cancel</button>
                <button type="submit" className="ipd-btn-search">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div>
      {viewMode === "list" ? renderList() : renderDetail()}
      {renderModals()}
    </div>
  );
}
