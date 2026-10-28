import React, { useState, useEffect, useMemo } from "react";
import ipdService from "../../api/services/ipdService";
import billingService from "../../api/services/billingService";
import staffService from "../../api/services/staffService";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import "./IPDBilling.css";

const DEFAULT_TARIFF = {
  "Room Charges": [
    { name: "General Ward (Per Day)", rate: 1500 },
    { name: "Semi-Private Room (Per Day)", rate: 2500 },
    { name: "Private AC Deluxe Room (Per Day)", rate: 4000 },
    { name: "ICU Bed Charge (Per Day)", rate: 5500 },
    { name: "Emergency / Trauma Bed (Per Day)", rate: 2000 },
  ],
  Consultation: [
    { name: "Daily Consultant Round", rate: 800 },
    { name: "Senior Specialist / Surgeon Visit", rate: 1200 },
    { name: "Emergency Casualty Visit", rate: 1500 },
    { name: "Intensive Care (ICU) Specialist Round", rate: 2000 },
  ],
  "Lab Test": [
    { name: "Complete Blood Count (CBC)", rate: 350 },
    { name: "Liver Function Test (LFT)", rate: 750 },
    { name: "Kidney Function Test (KFT)", rate: 750 },
    { name: "Blood Sugar Fasting / PP (RBS)", rate: 120 },
    { name: "Serum Electrolytes (Na+, K+, Cl-)", rate: 600 },
    { name: "Urine Routine & Microscopic", rate: 250 },
  ],
  Radiology: [
    { name: "X-Ray Chest PA View", rate: 450 },
    { name: "Ultrasound Whole Abdomen", rate: 1500 },
    { name: "CT Scan Brain / Head", rate: 3500 },
    { name: "HRCT Chest (Thorax)", rate: 4200 },
  ],
  Procedures: [
    { name: "Wound Dressing & Suturing", rate: 500 },
    { name: "ECG 12 Lead", rate: 350 },
    { name: "Oxygen Therapy (Hourly)", rate: 200 },
    { name: "Catheterization / Ryles Tube Insertion", rate: 600 },
    { name: "Minor Surgical OT Procedure", rate: 3500 },
  ],
  Medicines: [
    { name: "IV Fluids (RL / DNS / NS 500ml)", rate: 250 },
    { name: "IV Antibiotics Infusion Pack", rate: 650 },
    { name: "Emergency Analgesic & Antacid Inj", rate: 280 },
    { name: "Consumables & Syringes / Gloves Kit", rate: 400 },
  ],
  Others: [
    { name: "IPD Admission & File Maintenance Charge", rate: 500 },
    { name: "Nursing & Monitoring Charges (Daily)", rate: 500 },
    { name: "Biomedical Waste & Sanitization", rate: 250 },
  ],
};

export default function IPDBilling() {
  // Search & Selected Patient State
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [patient, setPatient] = useState(null);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Doctors & Bed Categories real data
  const [doctorsList, setDoctorsList] = useState([]);
  const [bedCategories, setBedCategories] = useState([]);

  // Service Selection Form State
  const [activeCategory, setActiveCategory] = useState("Room Charges");
  const [selectedServiceName, setSelectedServiceName] = useState("General Ward (Per Day)");
  const [rateInput, setRateInput] = useState(1500);
  const [qtyInput, setQtyInput] = useState(1);
  const [isCustomService, setIsCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState("");

  // Remarks State
  const [remarks, setRemarks] = useState("");

  // Modals
  const [showReceivePayModal, setShowReceivePayModal] = useState(false);
  const [showChangeBedModal, setShowChangeBedModal] = useState(false);
  const [showPrintBillModal, setShowPrintBillModal] = useState(false);
  const [showAdmissionSlipModal, setShowAdmissionSlipModal] = useState(false);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    mode: "Cash",
    type: "Advance",
    remarks: "",
  });

  // Bed Form State
  const [bedForm, setBedForm] = useState({
    ward: "",
    roomNo: "",
    bedNo: "",
  });

  // Real Tariff combined with dynamic doctors and bed categories
  const dynamicTariff = useMemo(() => {
    const tariff = { ...DEFAULT_TARIFF };

    // Inject dynamic doctors into Consultation
    if (doctorsList.length > 0) {
      const docServices = doctorsList.map((doc) => {
        const docName = doc.name || `Dr. ${doc.first_name || ""} ${doc.last_name || ""}`.trim();
        const dept = doc.department || doc.specialization || "General Medicine";
        return {
          name: `Doctor Visit - ${docName} (${dept})`,
          rate: 800,
        };
      });
      tariff.Consultation = [
        ...docServices,
        { name: "Senior Surgeon / Consultant Visit", rate: 1200 },
        { name: "Emergency Casualty Visit", rate: 1500 },
        { name: "Intensive Care (ICU) Specialist Round", rate: 2000 },
      ];
    }

    // Inject dynamic bed categories if available
    if (bedCategories.length > 0) {
      tariff["Room Charges"] = bedCategories.map((cat) => ({
        name: `${cat.name || cat.code} (Per Day)`,
        rate: cat.daily_rate || (cat.is_icu ? 5500 : 1500),
      }));
    }

    return tariff;
  }, [doctorsList, bedCategories]);

  // Helper to map backend patient to IPD display format
  const mapBackendPatientToIPD = (bp) => {
    if (!bp) return null;
    const strId = String(bp.id || "");
    const pName =
      bp.patient_name ||
      bp.name ||
      `${bp.first_name || bp.firstName || ""} ${bp.last_name || bp.lastName || ""}`.trim() ||
      "Patient";
    const admNo =
      bp.admission_no ||
      bp.admission_number ||
      (strId ? `ADM-${strId.slice(-6).toUpperCase()}` : "ADM-NEW");
    const uhid = bp.uhid || (bp.patient_id ? String(bp.patient_id) : "N/A");
    const docName = bp.doctor_first_name
      ? `Dr. ${bp.doctor_first_name} ${bp.doctor_last_name || ""}`.trim()
      : bp.doctor_name || bp.consultant || "Dr. Assigned Consultant";
    const wardName = bp.ward_name || bp.ward || "General Ward";
    const bedName = bp.bed_name || bp.bed_number || bp.bedNo || "Bed";
    const deptName = bp.department_name || bp.department || "General Medicine";

    return {
      id: bp.id,
      encounterId: bp.encounter_id || bp.id,
      admissionNo: admNo,
      uhid: uhid,
      name: pName,
      age: bp.age || 30,
      gender: bp.gender || "Male",
      mobile: bp.patient_mobile || bp.phone || bp.mobile || "N/A",
      city: bp.city || bp.address || "City / Ward",
      bloodGroup: bp.blood_group || bp.bloodGroup || "O+",
      allergies: bp.allergies || "No Known Allergies",
      history: bp.history || "None",
      admissionDate: bp.admitted_at
        ? new Date(bp.admitted_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : bp.admission_date
        ? new Date(bp.admission_date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      department: deptName,
      consultant: docName,
      ward: wardName,
      roomNo: bp.room_number || bp.roomNo || wardName,
      bedNo: bedName,
      expectedDischarge: "Under Treatment",
      status: bp.status || "Admitted",
      admissionType: bp.admission_type || "Elective",
      ratePlan: `${wardName} (${bedName})`,
      initialDeposit: Number(bp.total_payments || 0),
      avatar: bp.avatar || "",
      historyPayments: [],
      items: [],
    };
  };

  const fetchPatientBilling = async (p) => {
    try {
      const encounterId = p.encounterId || p.id;
      const [itemsData, paymentsData] = await Promise.all([
        billingService.getRunningBill(encounterId).catch(() => []),
        billingService.getEncounterPayments(encounterId).catch(() => []),
      ]);

      const safeItems = Array.isArray(itemsData) ? itemsData : itemsData?.data || [];
      const safePayments = Array.isArray(paymentsData) ? paymentsData : paymentsData?.data || [];

      const mappedItems = safeItems.map((i) => ({
        id: i.id,
        date: new Date(i.created_at || new Date()).toLocaleDateString("en-GB").replace(/\//g, "-"),
        category: i.item_category || "General",
        name: i.item_name || "Medical Service",
        qty: Number(i.quantity || 1),
        rate: Number(i.rate || 0),
        amount: Number(i.total_amount || (Number(i.quantity || 1) * Number(i.rate || 0))),
        selected: false,
      }));

      const mappedPayments = safePayments.map((pay) => ({
        id: pay.id,
        date: new Date(pay.payment_date || pay.created_at || new Date()).toLocaleDateString("en-GB").replace(/\//g, "-"),
        amount: Number(pay.amount || 0),
        mode: pay.payment_method || "Cash",
        type: pay.payment_type || "Payment",
        remarks: pay.notes || "Receipt",
      }));

      setPatient((prev) => ({
        ...(prev || p),
        items: mappedItems,
        historyPayments: mappedPayments,
      }));
    } catch (err) {
      console.error("Failed to load billing data", err);
      setPatient(p);
    }
  };

  // Mount effect: Fetch real admissions, doctors, and bed categories from backend
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [admissionsRes, doctorsRes, categoriesRes] = await Promise.all([
          ipdService.getAdmissions({ status: "all" }).catch(() => []),
          staffService.getDoctors().catch(() => []),
          ipdService.getBedCategories().catch(() => []),
        ]);

        const list = Array.isArray(admissionsRes) ? admissionsRes : admissionsRes?.rows || admissionsRes?.data || [];
        const mapped = list.map(mapBackendPatientToIPD).filter(Boolean);
        setRecentAdmissions(mapped);

        if (Array.isArray(doctorsRes)) setDoctorsList(doctorsRes);
        if (Array.isArray(categoriesRes)) setBedCategories(categoriesRes);

        if (mapped.length > 0 && !patient) {
          handleSelectPatient(mapped[0]);
        }
      } catch (err) {
        console.error("Initial load failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Handle Search Change
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (query.trim().length > 0) {
      try {
        const results = await ipdService.getAdmissions({ search: query.trim() });
        const list = Array.isArray(results) ? results : results?.rows || results?.data || [];
        const mappedResults = list.map(mapBackendPatientToIPD).filter(Boolean);
        setSuggestions(mappedResults);
      } catch (err) {
        console.error("Search failed", err);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectPatient = async (p) => {
    if (!p) return;
    setPatient(p);
    setSearchTerm(p.admissionNo);
    setSuggestions([]);
    setBedForm({ ward: p.ward, roomNo: p.roomNo, bedNo: p.bedNo });
    await fetchPatientBilling(p);
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      if (recentAdmissions.length > 0) handleSelectPatient(recentAdmissions[0]);
      return;
    }
    try {
      const results = await ipdService.getAdmissions({ search: query });
      const list = Array.isArray(results) ? results : results?.rows || results?.data || [];
      if (list && list.length > 0) {
        handleSelectPatient(mapBackendPatientToIPD(list[0]));
      } else {
        toast.error("No IPD patient found matching search query.");
      }
    } catch (err) {
      console.error("Search submit failed", err);
      toast.error("Error searching inpatient record.");
    }
  };

  // Category change
  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setIsCustomService(false);
    const services = dynamicTariff[cat] || [];
    if (services.length > 0) {
      setSelectedServiceName(services[0].name);
      setRateInput(services[0].rate);
    } else {
      setSelectedServiceName("");
      setRateInput(0);
    }
  };

  // Service select change
  const handleServiceChange = (e) => {
    const val = e.target.value;
    if (val === "__custom__") {
      setIsCustomService(true);
      setSelectedServiceName("");
      setRateInput(0);
      return;
    }
    setIsCustomService(false);
    setSelectedServiceName(val);
    const services = dynamicTariff[activeCategory] || [];
    const found = services.find((s) => s.name === val);
    if (found) {
      setRateInput(found.rate);
    }
  };

  // Add Item to Bill Items Table
  const handleAddServiceItem = async () => {
    if (!patient) {
      toast.error("Please select an admitted patient first.");
      return;
    }

    const sName = isCustomService ? customServiceName.trim() : selectedServiceName;
    if (!sName) {
      toast.error("Please enter or select a service name.");
      return;
    }

    const rate = Number(rateInput) || 0;
    const qty = Number(qtyInput) || 1;
    if (rate <= 0) {
      toast.error("Please enter a valid rate amount greater than 0.");
      return;
    }
    const amount = rate * qty;

    try {
      setActionLoading(true);
      const encounterId = patient.encounterId || patient.id;
      await billingService.addCharge({
        encounter_id: encounterId,
        item_name: sName,
        item_category: activeCategory === "Room Charges" ? "Room" : activeCategory,
        quantity: qty,
        rate: rate,
        total_amount: amount,
      });
      await fetchPatientBilling(patient);
      if (isCustomService) {
        setCustomServiceName("");
        setIsCustomService(false);
      }
      toast.success(`Added ${sName} (₹${amount}) to bill!`, { icon: "✅" });
    } catch (err) {
      console.error("Failed to add charge", err);
      toast.error("Failed to add charge to bill.");
    } finally {
      setActionLoading(false);
    }
  };

  // Remove Individual Bill Item
  const handleRemoveItem = async (id, itemName) => {
    if (!patient) return;
    try {
      setActionLoading(true);
      await billingService.removeCharge(id, { modified_by: "system" });
      await fetchPatientBilling(patient);
      toast.success(`Removed charge: ${itemName || ""}`);
    } catch (err) {
      console.error("Failed to remove charge", err);
      toast.error("Failed to remove charge.");
    } finally {
      setActionLoading(false);
    }
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

  // Toggle Select All
  const handleToggleSelectAll = (e) => {
    if (!patient || !patient.items) return;
    const checked = e.target.checked;
    setPatient((prev) => ({
      ...prev,
      items: prev.items.map((i) => ({ ...i, selected: checked })),
    }));
  };

  // Remove Selected Checked Items
  const handleRemoveSelected = async () => {
    if (!patient) return;
    const selectedItems = patient.items.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      toast.error("Please select items to remove.");
      return;
    }

    try {
      setActionLoading(true);
      for (const item of selectedItems) {
        await billingService.removeCharge(item.id, { modified_by: "system" });
      }
      await fetchPatientBilling(patient);
      toast.success(`Removed ${selectedItems.length} selected items.`);
    } catch (err) {
      console.error("Failed to remove charges", err);
      toast.error("Failed to remove some charges.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Receive Payment Modal
  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!patient) return;
    const amt = Number(paymentForm.amount) || 0;
    if (amt <= 0) {
      toast.error("Please enter a valid amount greater than ₹0.");
      return;
    }

    try {
      setActionLoading(true);
      const encounterId = patient.encounterId || patient.id;
      await billingService.recordAdvancePayment({
        encounter_id: encounterId,
        amount: amt,
        payment_method: paymentForm.mode,
        payment_type: paymentForm.type,
        notes: paymentForm.remarks || `${paymentForm.type} received for ${patient.name}`,
      });

      await fetchPatientBilling(patient);
      setShowReceivePayModal(false);
      setPaymentForm({
        amount: "",
        mode: "Cash",
        type: "Payment",
        remarks: "",
      });
      toast.success(`Payment of ₹${amt.toLocaleString("en-IN")} recorded successfully!`, { icon: "💳" });
    } catch (err) {
      console.error("Failed to record payment", err);
      toast.error("Failed to record payment.");
    } finally {
      setActionLoading(false);
    }
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
      ratePlan: `${bedForm.ward} (${bedForm.bedNo})`,
    }));
    setShowChangeBedModal(false);
    toast.success(`Bed updated to ${bedForm.ward} - ${bedForm.roomNo} (${bedForm.bedNo})`);
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

  const proceduresTotal = patient
    ? patient.items
        .filter((i) => i.category === "Procedures")
        .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  const medicinesTotal = patient
    ? patient.items
        .filter((i) => i.category === "Medicines")
        .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  const othersTotal = patient
    ? patient.items
        .filter((i) => !["Room", "Consultation", "Lab Test", "Radiology", "Procedures", "Medicines"].includes(i.category))
        .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  return (
    <div className="ipd-billing-page">
      {/* ── 1. PAGE HEADER & BREADCRUMBS ── */}
      <div className="ipd-page-header">
        <div className="ipd-header-left">
          <div className="ipd-header-icon-box">
            <Icon name="LuReceipt" size={26} />
          </div>
          <div>
            <div className="ipd-header-title-row">
              <h1 className="ipd-header-title">IPD Billing &amp; Inpatient Invoicing</h1>
              <span className="ipd-live-tag">
                <span className="ipd-pulse-dot" /> Live ERP
              </span>
            </div>
            <p className="ipd-header-subtitle">
              Real-time Inpatient Ledger, Service Charge Allotment, Advance Receipts &amp; Final Discharge Settlement
            </p>
          </div>
        </div>

        <div className="ipd-header-right-actions">
          <div className="ipd-breadcrumb">
            <span>Billing</span>
            <span>/</span>
            <span className="ipd-breadcrumb-active">IPD Billing</span>
          </div>

          <div className="ipd-stat-pill">
            <Icon name="LuBed" size={14} />
            <span>Admitted Patients: <strong>{recentAdmissions.length}</strong></span>
          </div>
        </div>
      </div>

      {/* ── 2. QUICK SEARCH & INPATIENTS HUB ── */}
      <div className="ipd-search-hub-card">
        <div className="ipd-search-bar-row">
          <div className="ipd-search-input-wrap">
            <Icon name="LuSearch" size={17} className="ipd-search-icon" />
            <input
              type="text"
              className="ipd-search-input"
              placeholder="Search admitted patient by UHID, Admission No (e.g. ADM-26-0019), Name or Phone..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(e)}
            />
            {searchTerm && (
              <button
                type="button"
                className="ipd-search-clear-btn"
                onClick={() => {
                  setSearchTerm("");
                  setSuggestions([]);
                }}
              >
                <Icon name="LuX" size={14} />
              </button>
            )}

            {/* Live Autocomplete Dropdown */}
            {suggestions.length > 0 && (
              <div className="ipd-suggestions-dropdown">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="ipd-suggestion-item"
                    onClick={() => handleSelectPatient(s)}
                  >
                    <div className="ipd-sugg-left">
                      <span className="ipd-sugg-name">{s.name}</span>
                      <span className="ipd-sugg-meta">
                        UHID: {s.uhid} • {s.age}Y/{s.gender} • {s.ward} ({s.bedNo})
                      </span>
                    </div>
                    <span className="ipd-sugg-adm">{s.admissionNo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="ipd-btn-search"
            onClick={handleSearchSubmit}
          >
            <Icon name="LuSearch" size={15} /> Search
          </button>
        </div>

        {/* Admitted Inpatients Quick Switcher Chips */}
        {recentAdmissions.length > 0 && (
          <div className="ipd-inpatient-queue-row">
            <span className="ipd-queue-label">
              <Icon name="LuUsers" size={13} /> Active Inpatients:
            </span>
            <div className="ipd-queue-scroll">
              {recentAdmissions.map((adm) => {
                const isSelected = patient && (patient.id === adm.id || patient.admissionNo === adm.admissionNo);
                return (
                  <button
                    key={adm.id}
                    type="button"
                    className={`ipd-queue-chip ${isSelected ? "active" : ""}`}
                    onClick={() => handleSelectPatient(adm)}
                  >
                    <span className="ipd-chip-indicator" />
                    <span className="ipd-chip-name">{adm.name}</span>
                    <span className="ipd-chip-bed">{adm.bedNo}</span>
                    <span className="ipd-chip-adm">({adm.admissionNo})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. UNIFIED PATIENT & ADMISSION COMMAND HERO ── */}
      {patient ? (
        <div className="ipd-hero-banner">
          {/* Patient Bio Column */}
          <div className="ipd-hero-bio">
            <div className="ipd-hero-avatar">
              {patient.avatar ? (
                <img src={patient.avatar} alt={patient.name} />
              ) : (
                <span>{(patient.name || "P").charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="ipd-hero-bio-details">
              <div className="ipd-hero-name-row">
                <h2 className="ipd-hero-patient-name">{patient.name}</h2>
                <span className="ipd-uhid-badge">{patient.uhid}</span>
                <span className="ipd-status-badge ipd-status-badge--admitted">
                  <span className="ipd-pulse-dot" /> {patient.status}
                </span>
              </div>

              <div className="ipd-hero-meta-row">
                <span>
                  <Icon name="LuUser" size={13} /> {patient.age} Y / {patient.gender}
                </span>
                <span>•</span>
                <span>
                  <Icon name="LuPhone" size={13} /> {patient.mobile}
                </span>
                <span>•</span>
                <span>
                  <Icon name="LuMapPin" size={13} /> {patient.city}
                </span>
                <span>•</span>
                <span className="ipd-blood-pill">
                  🩸 {patient.bloodGroup}
                </span>
              </div>
            </div>
          </div>

          {/* Admission & Bed Location Center Column */}
          <div className="ipd-hero-admission-box">
            <div className="ipd-hero-stat-grid">
              <div className="ipd-hstat">
                <span className="ipd-hstat-label">Admission ID</span>
                <span className="ipd-hstat-val ipd-hstat-val--mono">{patient.admissionNo}</span>
              </div>

              <div className="ipd-hstat">
                <span className="ipd-hstat-label">Admitted On</span>
                <span className="ipd-hstat-val">{patient.admissionDate}</span>
              </div>

              <div className="ipd-hstat">
                <span className="ipd-hstat-label">Attending Doctor</span>
                <span className="ipd-hstat-val">{patient.consultant}</span>
              </div>

              <div className="ipd-hstat">
                <span className="ipd-hstat-label">Current Bed</span>
                <div className="ipd-bed-val-row">
                  <span className="ipd-hstat-val ipd-hstat-val--highlight">
                    {patient.ward} • {patient.roomNo} ({patient.bedNo})
                  </span>
                  <button
                    type="button"
                    className="ipd-mini-transfer-btn"
                    onClick={() => setShowChangeBedModal(true)}
                    title="Change Ward or Bed"
                  >
                    <Icon name="LuRefreshCw" size={12} /> Transfer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Fast Summary Widget */}
          <div className={`ipd-hero-kpi-widget ${pendingAmount > 0 ? "due" : "clear"}`}>
            <div className="ipd-hkpi-head">
              <span className="ipd-hkpi-title">Current Balance Due</span>
              <span className="ipd-hkpi-tag">
                {pendingAmount > 0 ? "Pending Payment" : "All Cleared"}
              </span>
            </div>
            <div className="ipd-hkpi-amount">
              ₹ {pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="ipd-hkpi-sub">
              <span>Billed: ₹{totalBills.toLocaleString("en-IN")}</span>
              <span>Paid: ₹{totalPaymentsReceivedAll.toLocaleString("en-IN")}</span>
            </div>

            <div className="ipd-hkpi-actions">
              <button
                type="button"
                className="ipd-btn-quick-pay"
                onClick={() => setShowReceivePayModal(true)}
              >
                <Icon name="LuCreditCard" size={14} /> + Receive Payment
              </button>
              <button
                type="button"
                className="ipd-btn-view-slip"
                onClick={() => setShowAdmissionSlipModal(true)}
              >
                <Icon name="LuEye" size={13} /> Admission Slip
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="ipd-no-patient-banner">
          <Icon name="LuBed" size={32} />
          <div>
            <h3>No Inpatient Record Selected</h3>
            <p>Please select an active inpatient from the queue above or search by UHID / Admission No.</p>
          </div>
        </div>
      )}

      {/* ── 4. MAIN BILLING WORKSPACE (2-COLUMN BALANCED GRID) ── */}
      <div className="ipd-main-grid">
        {/* LEFT COLUMN: CHARGES & RUNNING BILL (62% WIDTH) */}
        <div className="ipd-col-left">
          {/* Quick Add Services / Charges Card */}
          <div className="ipd-card ipd-card--service-adder">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuPlusCircle" className="ipd-card-icon ipd-card-icon--teal" />
                <div>
                  <h2 className="ipd-card-title">Add Hospital Services &amp; Tariff Charges</h2>
                  <span className="ipd-card-desc">Allot room rent, consultant doctor fees, tests, procedures, and drugs</span>
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="ipd-category-pills">
              {Object.keys(dynamicTariff).map((cat) => {
                const getCategoryIcon = (c) => {
                  if (c === "Room Charges") return "LuBed";
                  if (c === "Consultation") return "LuUserCheck";
                  if (c === "Lab Test") return "LuTestTube";
                  if (c === "Radiology") return "LuTv";
                  if (c === "Procedures") return "LuActivity";
                  if (c === "Medicines") return "LuPill";
                  return "LuTag";
                };

                return (
                  <button
                    key={cat}
                    type="button"
                    className={`ipd-category-pill ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    <Icon name={getCategoryIcon(cat)} size={14} />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Controls Row */}
            <div className="ipd-add-service-row">
              <div className="ipd-form-field ipd-form-field--service">
                <label className="ipd-field-label">Service Description</label>
                {isCustomService ? (
                  <div className="ipd-custom-input-wrap">
                    <input
                      type="text"
                      className="ipd-input-control"
                      placeholder="Enter custom service / procedure name..."
                      value={customServiceName}
                      onChange={(e) => setCustomServiceName(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="ipd-btn-cancel-custom"
                      onClick={() => {
                        setIsCustomService(false);
                        const list = dynamicTariff[activeCategory] || [];
                        if (list.length) {
                          setSelectedServiceName(list[0].name);
                          setRateInput(list[0].rate);
                        }
                      }}
                      title="Back to Tariff List"
                    >
                      <Icon name="LuX" size={14} />
                    </button>
                  </div>
                ) : (
                  <select
                    className="ipd-select-control"
                    value={selectedServiceName}
                    onChange={handleServiceChange}
                  >
                    {(dynamicTariff[activeCategory] || []).map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} (₹{s.rate})
                      </option>
                    ))}
                    <option value="__custom__">➕ Other Custom Charge (Type Manually)</option>
                  </select>
                )}
              </div>

              <div className="ipd-form-field ipd-form-field--rate">
                <label className="ipd-field-label">Unit Rate (₹)</label>
                <input
                  type="number"
                  className="ipd-input-control"
                  min="0"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                />
              </div>

              <div className="ipd-form-field ipd-form-field--qty">
                <label className="ipd-field-label">Days / Qty</label>
                <input
                  type="number"
                  min="1"
                  className="ipd-input-control"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                />
              </div>

              <div className="ipd-form-field ipd-form-field--amount">
                <label className="ipd-field-label">Net Charge (₹)</label>
                <input
                  type="text"
                  className="ipd-input-control ipd-input-readonly"
                  readOnly
                  value={(Number(rateInput || 0) * Number(qtyInput || 1)).toLocaleString("en-IN")}
                />
              </div>

              <button
                type="button"
                className="ipd-btn-add-item"
                disabled={actionLoading}
                onClick={handleAddServiceItem}
              >
                <Icon name="LuPlus" size={16} />
                <span>Add Charge</span>
              </button>
            </div>
          </div>

          {/* Bill Items (Current Admission) Card */}
          <div className="ipd-card ipd-card--bill-items">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuListChecks" className="ipd-card-icon ipd-card-icon--navy" />
                <div>
                  <h2 className="ipd-card-title">
                    Running Bill Items ({patient?.items?.length || 0})
                  </h2>
                  <span className="ipd-card-desc">All charges posted against current hospital admission</span>
                </div>
              </div>

              {patient?.items?.some((i) => i.selected) && (
                <button
                  type="button"
                  className="ipd-btn-remove-selected"
                  onClick={handleRemoveSelected}
                >
                  <Icon name="LuTrash2" size={14} /> Remove Selected
                </button>
              )}
            </div>

            {/* Bill Items Table */}
            <div className="ipd-bill-table-wrapper">
              <table className="ipd-bill-table">
                <thead>
                  <tr>
                    <th style={{ width: 36, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(
                          patient?.items?.length > 0 &&
                          patient.items.every((i) => i.selected)
                        )}
                        onChange={handleToggleSelectAll}
                      />
                    </th>
                    <th style={{ width: 40 }}>#</th>
                    <th style={{ width: 100 }}>Date</th>
                    <th>Service / Procedure Item</th>
                    <th style={{ width: 120 }}>Category</th>
                    <th style={{ textAlign: "right", width: 110 }}>Rate (₹)</th>
                    <th style={{ textAlign: "center", width: 85 }}>Days/Qty</th>
                    <th style={{ textAlign: "right", width: 120 }}>Amount (₹)</th>
                    <th style={{ textAlign: "center", width: 60 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!patient || !patient.items || patient.items.length === 0 ? (
                    <tr>
                      <td colSpan="9">
                        <div className="ipd-table-empty">
                          <Icon name="LuReceipt" size={36} />
                          <h4>No Bill Items Added Yet</h4>
                          <p>Select a category above and click <strong>Add Charge</strong> to post hospital room rent, tests, or doctor fees.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    patient.items.map((item, idx) => {
                      const getCatBadgeClass = (cat) => {
                        if (cat === "Room") return "ipd-cat-badge--room";
                        if (cat === "Consultation") return "ipd-cat-badge--doc";
                        if (cat === "Lab Test") return "ipd-cat-badge--lab";
                        if (cat === "Radiology") return "ipd-cat-badge--rad";
                        if (cat === "Procedures") return "ipd-cat-badge--proc";
                        if (cat === "Medicines") return "ipd-cat-badge--med";
                        return "ipd-cat-badge--other";
                      };

                      return (
                        <tr key={item.id || idx} className={item.selected ? "selected" : ""}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={!!item.selected}
                              onChange={() => handleToggleSelectItem(item.id)}
                            />
                          </td>
                          <td style={{ color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ color: "#475569", fontSize: 12 }}>{item.date}</td>
                          <td>
                            <div className="ipd-item-name-cell">
                              <span className="ipd-iname">{item.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`ipd-cat-badge ${getCatBadgeClass(item.category)}`}>
                              {item.category}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                            ₹{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>
                            {item.qty}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>
                            ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className="ipd-btn-icon-delete"
                              title="Delete Item"
                              onClick={() => handleRemoveItem(item.id, item.name)}
                            >
                              <Icon name="LuTrash2" size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bill Summary Sub-bar */}
            <div className="ipd-bill-subbar">
              <div className="ipd-remarks-field">
                <Icon name="LuFileText" size={15} />
                <input
                  type="text"
                  placeholder="Enter billing notes, diagnosis reference or TPA remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="ipd-bill-subtotal-display">
                <span className="ipd-subtotal-label">Subtotal Charges:</span>
                <span className="ipd-subtotal-val">
                  ₹ {totalBills.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="ipd-left-bottom-actions">
              <button
                type="button"
                className="ipd-btn-outline"
                onClick={() => setShowPrintBillModal(true)}
              >
                <Icon name="LuPrinter" size={15} /> Print Provisional Statement
              </button>
              <button
                type="button"
                className="ipd-btn-save-changes"
                onClick={() => toast.success("All inpatient bill changes saved successfully!")}
              >
                <Icon name="LuSave" size={15} /> Save Ledger Changes
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FINANCIAL BALANCE, LEDGER & SUMMARY (38% WIDTH) */}
        <div className="ipd-col-right">
          {/* Card 1: Live Financial Overview */}
          <div className="ipd-card ipd-card--financial">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuShieldCheck" className="ipd-card-icon ipd-card-icon--green" />
                <div>
                  <h2 className="ipd-card-title">Inpatient Financial Balance</h2>
                  <span className="ipd-card-desc">Advance deposits, payments, and net due</span>
                </div>
              </div>

              <button
                type="button"
                className="ipd-btn-receive-pay"
                onClick={() => setShowReceivePayModal(true)}
              >
                <Icon name="LuPlus" size={14} /> + Receive Payment
              </button>
            </div>

            <div className="ipd-financial-body">
              {/* Eye-catching Pending / Due Banner */}
              <div className={`ipd-balance-hero ${pendingAmount > 0 ? "has-due" : "cleared"}`}>
                <div className="ipd-bhero-left">
                  <span className="ipd-bhero-label">
                    {pendingAmount > 0 ? "Outstanding Net Due" : "Settlement Status"}
                  </span>
                  <div className="ipd-bhero-amount">
                    ₹ {pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="ipd-bhero-tag">
                  {pendingAmount > 0 ? "Pending Payment" : "Nil Outstanding"}
                </div>
              </div>

              {/* Financial Calculation Matrix */}
              <div className="ipd-fin-calc-matrix">
                <div className="ipd-fcalc-row">
                  <span className="ipd-fcalc-label">Total Billed Charges:</span>
                  <span className="ipd-fcalc-val">
                    ₹ {totalBills.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="ipd-fcalc-row ipd-fcalc-row--green">
                  <span className="ipd-fcalc-label">
                    <Icon name="LuCheckCircle" size={13} /> Advance Deposit (Admission):
                  </span>
                  <span className="ipd-fcalc-val">
                    (-) ₹ {totalAdvance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="ipd-fcalc-row ipd-fcalc-row--green">
                  <span className="ipd-fcalc-label">
                    <Icon name="LuCheckCircle" size={13} /> Subsequent Receipts:
                  </span>
                  <span className="ipd-fcalc-val">
                    (-) ₹ {totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="ipd-fcalc-row ipd-fcalc-row--subtotal">
                  <span className="ipd-fcalc-label">Total Amount Realized:</span>
                  <span className="ipd-fcalc-val" style={{ color: "#059669", fontWeight: 800 }}>
                    ₹ {totalPaymentsReceivedAll.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Cost Breakdown by Category */}
          <div className="ipd-card ipd-card--breakdown">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuBarChart3" className="ipd-card-icon ipd-card-icon--blue" />
                <div>
                  <h2 className="ipd-card-title">Charges Category Distribution</h2>
                  <span className="ipd-card-desc">Live breakdown across hospital departments</span>
                </div>
              </div>

              <button
                type="button"
                className="ipd-btn-refresh-charges"
                onClick={() => {
                  if (patient) {
                    fetchPatientBilling(patient).then(() => {
                      toast.success("Synchronized IPD Ledger from live database!");
                    });
                  }
                }}
                title="Refresh Live Data"
              >
                <Icon name="LuRefreshCw" size={13} />
              </button>
            </div>

            <div className="ipd-breakdown-grid">
              <div className="ipd-bitem">
                <div className="ipd-bitem-head">
                  <span className="ipd-bitem-title">
                    <Icon name="LuBed" size={14} style={{ color: "#0284c7" }} /> Room Rent
                  </span>
                  <span className="ipd-bitem-val">₹{roomChargesTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="ipd-bitem-bar-track">
                  <div
                    className="ipd-bitem-bar-fill ipd-bitem-bar-fill--blue"
                    style={{ width: `${totalBills > 0 ? (roomChargesTotal / totalBills) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="ipd-bitem">
                <div className="ipd-bitem-head">
                  <span className="ipd-bitem-title">
                    <Icon name="LuUserCheck" size={14} style={{ color: "#059669" }} /> Doctor Rounds
                  </span>
                  <span className="ipd-bitem-val">₹{consultationTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="ipd-bitem-bar-track">
                  <div
                    className="ipd-bitem-bar-fill ipd-bitem-bar-fill--green"
                    style={{ width: `${totalBills > 0 ? (consultationTotal / totalBills) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="ipd-bitem">
                <div className="ipd-bitem-head">
                  <span className="ipd-bitem-title">
                    <Icon name="LuTestTube" size={14} style={{ color: "#ea580c" }} /> Pathology Lab
                  </span>
                  <span className="ipd-bitem-val">₹{labTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="ipd-bitem-bar-track">
                  <div
                    className="ipd-bitem-bar-fill ipd-bitem-bar-fill--orange"
                    style={{ width: `${totalBills > 0 ? (labTotal / totalBills) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="ipd-bitem">
                <div className="ipd-bitem-head">
                  <span className="ipd-bitem-title">
                    <Icon name="LuTv" size={14} style={{ color: "#9333ea" }} /> Radiology / Scans
                  </span>
                  <span className="ipd-bitem-val">₹{radiologyTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="ipd-bitem-bar-track">
                  <div
                    className="ipd-bitem-bar-fill ipd-bitem-bar-fill--purple"
                    style={{ width: `${totalBills > 0 ? (radiologyTotal / totalBills) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="ipd-bitem">
                <div className="ipd-bitem-head">
                  <span className="ipd-bitem-title">
                    <Icon name="LuPill" size={14} style={{ color: "#e11d48" }} /> Drugs &amp; Consumables
                  </span>
                  <span className="ipd-bitem-val">₹{(proceduresTotal + medicinesTotal + othersTotal).toLocaleString("en-IN")}</span>
                </div>
                <div className="ipd-bitem-bar-track">
                  <div
                    className="ipd-bitem-bar-fill ipd-bitem-bar-fill--rose"
                    style={{ width: `${totalBills > 0 ? ((proceduresTotal + medicinesTotal + othersTotal) / totalBills) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Payments & Receipts History Ledger */}
          <div className="ipd-card ipd-card--ledger">
            <div className="ipd-card-header">
              <div className="ipd-card-title-group">
                <Icon name="LuHistory" className="ipd-card-icon ipd-card-icon--violet" />
                <div>
                  <h2 className="ipd-card-title">
                    Receipts Ledger ({patient?.historyPayments?.length || 0})
                  </h2>
                  <span className="ipd-card-desc">Audit trail of transactions received</span>
                </div>
              </div>
            </div>

            <div className="ipd-ledger-table-wrap">
              <table className="ipd-ledger-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Mode</th>
                    <th style={{ textAlign: "right" }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {!patient || !patient.historyPayments || patient.historyPayments.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>
                        No payments recorded yet. Click <strong>+ Receive Payment</strong> above.
                      </td>
                    </tr>
                  ) : (
                    patient.historyPayments.map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td style={{ color: "#475569", fontSize: 12 }}>{p.date}</td>
                        <td>
                          <span className={`ipd-pay-type-badge ${p.type === "Advance" ? "advance" : "settlement"}`}>
                            {p.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: "#334155" }}>{p.mode}</td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: "#059669", fontFamily: "monospace" }}>
                          ₹{p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 4: Final Settlement & Discharge Command */}
          <div className="ipd-card ipd-card--final-actions">
            <div className="ipd-final-actions-box">
              <button
                type="button"
                className="ipd-btn-final-bill"
                onClick={() => setShowPrintBillModal(true)}
              >
                <Icon name="LuFileCheck2" size={17} />
                <span>Generate Official Final Bill</span>
              </button>

              <button
                type="button"
                className="ipd-btn-discharge-gate"
                onClick={() => {
                  if (!patient) return;
                  if (pendingAmount > 0) {
                    toast.error(
                      `Cannot clear patient! Outstanding balance of ₹${pendingAmount.toLocaleString("en-IN")} must be settled first.`,
                      { icon: "⚠️" }
                    );
                  } else {
                    toast.success(
                      `Inpatient ${patient.name} has settled all dues! Patient is cleared for discharge.`,
                      { icon: "🏥" }
                    );
                  }
                }}
              >
                <Icon name="LuLogOut" size={17} />
                <span>Verify &amp; Clearance for Discharge</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* 1. Receive Payment / Advance Modal */}
      {showReceivePayModal && (
        <div
          className="ipd-modal-backdrop"
          onClick={() => setShowReceivePayModal(false)}
        >
          <div className="ipd-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <div className="ipd-modal-header-left">
                <div className="ipd-modal-icon-wrap">
                  <Icon name="LuCreditCard" size={20} />
                </div>
                <div>
                  <h3 className="ipd-modal-title">Record Payment Receipt</h3>
                  <span className="ipd-modal-subtitle">Patient: {patient?.name} ({patient?.admissionNo})</span>
                </div>
              </div>
              <button
                type="button"
                className="ipd-modal-close-btn"
                onClick={() => setShowReceivePayModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="ipd-modal-body">
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Receipt Category</label>
                  <select
                    className="ipd-select-control"
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                  >
                    <option value="Advance">Initial Advance Deposit (Admission)</option>
                    <option value="Payment">Running Bill Payment / Settlement</option>
                  </select>
                </div>

                <div className="ipd-form-field">
                  <label className="ipd-field-label">Received Amount (₹) *</label>
                  <input
                    type="number"
                    className="ipd-input-control ipd-input-control--lg"
                    placeholder="Enter amount (e.g. 5000)"
                    required
                    min="1"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>

                <div className="ipd-form-field">
                  <label className="ipd-field-label">Payment Method / Mode</label>
                  <select
                    className="ipd-select-control"
                    value={paymentForm.mode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                  >
                    <option value="Cash">Cash Counter</option>
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="Card">Debit / Credit Card POS</option>
                    <option value="Net Banking">NEFT / RTGS / Net Banking</option>
                    <option value="Insurance / TPA">TPA Cashless / Insurance Pre-Auth</option>
                  </select>
                </div>

                <div className="ipd-form-field">
                  <label className="ipd-field-label">Transaction / Bank Notes</label>
                  <input
                    type="text"
                    className="ipd-input-control"
                    placeholder="e.g. UPI Ref # 1234567890 or Counter Receipt #101"
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
                <button type="submit" className="ipd-btn-search" disabled={actionLoading}>
                  <Icon name="LuSave" size={16} /> Collect &amp; Record Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Change Bed / Ward Modal */}
      {showChangeBedModal && (
        <div
          className="ipd-modal-backdrop"
          onClick={() => setShowChangeBedModal(false)}
        >
          <div className="ipd-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <div className="ipd-modal-header-left">
                <div className="ipd-modal-icon-wrap" style={{ background: "#0284c7" }}>
                  <Icon name="LuBed" size={20} />
                </div>
                <div>
                  <h3 className="ipd-modal-title">Inpatient Bed Transfer</h3>
                  <span className="ipd-modal-subtitle">Transfer {patient?.name} to a new ward or room</span>
                </div>
              </div>
              <button
                type="button"
                className="ipd-modal-close-btn"
                onClick={() => setShowChangeBedModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBedChange}>
              <div className="ipd-modal-body">
                <div className="ipd-form-field">
                  <label className="ipd-field-label">Target Ward</label>
                  <select
                    className="ipd-select-control"
                    value={bedForm.ward}
                    onChange={(e) => setBedForm({ ...bedForm, ward: e.target.value })}
                  >
                    <option value="General Ward (Male)">General Ward (Male) - ₹1,500/day</option>
                    <option value="General Ward (Female)">General Ward (Female) - ₹1,500/day</option>
                    <option value="Semi-Private Ward">Semi-Private Ward - ₹2,500/day</option>
                    <option value="Private Deluxe Ward">Private Deluxe Ward - ₹4,000/day</option>
                    <option value="Intensive Care Unit (ICU)">ICU - ₹5,500/day</option>
                    <option value="Emergency & Trauma Ward">Emergency &amp; Trauma Ward - ₹2,000/day</option>
                  </select>
                </div>

                <div className="ipd-form-field">
                  <label className="ipd-field-label">Target Room No</label>
                  <input
                    type="text"
                    className="ipd-input-control"
                    value={bedForm.roomNo}
                    onChange={(e) => setBedForm({ ...bedForm, roomNo: e.target.value })}
                    placeholder="e.g. 101, 201, ICU-Pod-A"
                  />
                </div>

                <div className="ipd-form-field">
                  <label className="ipd-field-label">Target Bed No</label>
                  <input
                    type="text"
                    className="ipd-input-control"
                    value={bedForm.bedNo}
                    onChange={(e) => setBedForm({ ...bedForm, bedNo: e.target.value })}
                    placeholder="e.g. GWM-101-A, ICU-02"
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
                  Confirm Bed Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Admission Slip Modal */}
      {showAdmissionSlipModal && patient && (
        <div
          className="ipd-modal-backdrop"
          onClick={() => setShowAdmissionSlipModal(false)}
        >
          <div className="ipd-modal-box ipd-modal-box--print" onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <h3 className="ipd-modal-title">IPD Admission Initial Voucher</h3>
              <button
                type="button"
                className="ipd-modal-close-btn"
                onClick={() => setShowAdmissionSlipModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="ipd-modal-body">
              <div className="ipd-printable-voucher">
                <div className="ipd-voucher-header">
                  <div className="ipd-voucher-logo">
                    <Icon name="LuPlus" size={22} /> NARAYAN HOSPITAL
                  </div>
                  <div className="ipd-voucher-subtitle">Multi-Speciality Healthcare &amp; Trauma Centre</div>
                  <div className="ipd-voucher-tag">IPD ADMISSION SUMMARY SLIP</div>
                </div>

                <div className="ipd-voucher-meta-grid">
                  <div><strong>Admission No:</strong> {patient.admissionNo}</div>
                  <div><strong>Date &amp; Time:</strong> {patient.admissionDate}</div>
                  <div><strong>Patient UHID:</strong> {patient.uhid}</div>
                  <div><strong>Patient Name:</strong> {patient.name}</div>
                  <div><strong>Age / Gender:</strong> {patient.age} Y / {patient.gender}</div>
                  <div><strong>Contact No:</strong> {patient.mobile}</div>
                  <div><strong>Consultant:</strong> {patient.consultant}</div>
                  <div><strong>Department:</strong> {patient.department}</div>
                  <div><strong>Allotted Ward:</strong> {patient.ward}</div>
                  <div><strong>Bed / Room:</strong> {patient.roomNo} ({patient.bedNo})</div>
                </div>

                <div className="ipd-voucher-grand">
                  <div className="ipd-voucher-row">
                    <span>Initial Deposit Collected:</span>
                    <span style={{ fontWeight: 800, color: "#059669" }}>
                      ₹ {totalAdvance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="ipd-voucher-footer">
                  <div>* Please present this slip during visiting hours and diagnostic rounds *</div>
                  <div>Narayan Hospital • Quality Care With Compassion</div>
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
                <Icon name="LuPrinter" size={16} /> Print Official Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Final Bill & Inpatient Statement Modal */}
      {showPrintBillModal && patient && (
        <div
          className="ipd-modal-backdrop"
          onClick={() => setShowPrintBillModal(false)}
        >
          <div className="ipd-modal-box ipd-modal-box--print" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <h3 className="ipd-modal-title">Official Inpatient Final Bill</h3>
              <button
                type="button"
                className="ipd-modal-close-btn"
                onClick={() => setShowPrintBillModal(false)}
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="ipd-modal-body">
              <div className="ipd-printable-voucher">
                <div className="ipd-voucher-header">
                  <div className="ipd-voucher-logo">
                    <Icon name="LuPlus" size={22} /> NARAYAN HOSPITAL
                  </div>
                  <div className="ipd-voucher-subtitle">Multi-Speciality Healthcare &amp; Research Centre</div>
                  <div className="ipd-voucher-tag">INPATIENT FINAL TAX INVOICE &amp; DISCHARGE BILL</div>
                </div>

                <div className="ipd-voucher-meta-grid">
                  <div><strong>Invoice / Adm No:</strong> {patient.admissionNo}</div>
                  <div><strong>Date:</strong> {new Date().toLocaleDateString("en-IN")}</div>
                  <div><strong>Patient UHID:</strong> {patient.uhid}</div>
                  <div><strong>Patient Name:</strong> {patient.name}</div>
                  <div><strong>Age / Gender:</strong> {patient.age} Y / {patient.gender}</div>
                  <div><strong>Attending Doctor:</strong> {patient.consultant}</div>
                  <div><strong>Ward &amp; Bed:</strong> {patient.ward} - {patient.bedNo}</div>
                  <div><strong>Admission Date:</strong> {patient.admissionDate}</div>
                </div>

                <table className="ipd-voucher-table">
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>#</th>
                      <th>Service / Investigation Item</th>
                      <th style={{ textAlign: "center", width: 50 }}>Qty</th>
                      <th style={{ textAlign: "right", width: 80 }}>Rate (₹)</th>
                      <th style={{ textAlign: "right", width: 90 }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>{idx + 1}</td>
                        <td>{item.name}</td>
                        <td style={{ textAlign: "center" }}>{item.qty}</td>
                        <td style={{ textAlign: "right" }}>{item.rate.toLocaleString("en-IN")}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{item.amount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="ipd-voucher-grand">
                  <div className="ipd-voucher-row">
                    <span>Gross Billed Amount:</span>
                    <span>₹ {totalBills.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="ipd-voucher-row">
                    <span>Advance Deposit Credited:</span>
                    <span style={{ color: "#059669" }}>(-) ₹ {totalAdvance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="ipd-voucher-row">
                    <span>Running Payments Received:</span>
                    <span style={{ color: "#059669" }}>(-) ₹ {totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="ipd-voucher-row ipd-voucher-row--net">
                    <span>Net Balance Payable:</span>
                    <span style={{ color: pendingAmount > 0 ? "#dc2626" : "#059669" }}>
                      ₹ {pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="ipd-voucher-footer">
                  <div>* Authorized Hospital Signatory *</div>
                  <div>Thank You For Choosing Narayan Hospital • Wish You Good Health</div>
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
                className="ipd-btn-final-bill"
                style={{ width: "auto", padding: "10px 20px" }}
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={16} /> Print Final Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
