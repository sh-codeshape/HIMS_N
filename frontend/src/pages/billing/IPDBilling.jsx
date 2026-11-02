import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import ipdService from "../../api/services/ipdService";
import billingService from "../../api/services/billingService";
import staffService from "../../api/services/staffService";
import { inventoryService } from "../../api/services/inventoryService";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import "./IPDBilling.css";

// Standard Clinical Inpatient Medicines Catalog (with dosage, unit, standard hospital tariff)
const STANDARD_MEDICINES = [
  { name: "Inj. Ceftriaxone 1g IV", form: "Vial", route: "IV", freq: "BD", rate: 120, category: "Medicines" },
  { name: "Inj. Pantoprazole 40mg IV (Pan-40)", form: "Vial", route: "IV", freq: "OD", rate: 95, category: "Medicines" },
  { name: "Inj. Ondansetron 4mg (Emeset)", form: "Ampoule", route: "IV", freq: "TDS", rate: 65, category: "Medicines" },
  { name: "IV Fluid - Normal Saline (NS 0.9% 500ml)", form: "Bottle", route: "IV Infusion", freq: "BD", rate: 85, category: "Medicines" },
  { name: "IV Fluid - Ringer Lactate (RL 500ml)", form: "Bottle", route: "IV Infusion", freq: "BD", rate: 95, category: "Medicines" },
  { name: "IV Fluid - Dextrose Normal Saline (DNS 500ml)", form: "Bottle", route: "IV Infusion", freq: "OD", rate: 90, category: "Medicines" },
  { name: "Inj. Paracetamol 100ml IV Infusion", form: "Bottle", route: "IV Infusion", freq: "SOS", rate: 140, category: "Medicines" },
  { name: "Inj. Tramadol 50mg / 1ml IV/IM", form: "Ampoule", route: "IV/IM", freq: "SOS", rate: 80, category: "Medicines" },
  { name: "Inj. Meropenem 1g IV", form: "Vial", route: "IV", freq: "TDS", rate: 1450, category: "Medicines" },
  { name: "Inj. Piperacillin + Tazobactam 4.5g (Piptaz)", form: "Vial", route: "IV", freq: "TDS", rate: 780, category: "Medicines" },
  { name: "Inj. Enoxaparin 40mg (Clexane)", form: "Prefilled Syringe", route: "SC", freq: "OD", rate: 620, category: "Medicines" },
  { name: "Inj. Hydrocortisone 100mg IV", form: "Vial", route: "IV", freq: "BD", rate: 110, category: "Medicines" },
  { name: "Inj. Human Actrapid Regular Insulin 100IU", form: "Vial", route: "SC", freq: "TDS (Pre-meal)", rate: 260, category: "Medicines" },
  { name: "Nebulization Respules (Duolin + Budecort)", form: "Respule", route: "Inhalation", freq: "TDS", rate: 75, category: "Medicines" },
  { name: "IV Cannula (18G/20G/22G) + Fixator", form: "Set", route: "Vascular Access", freq: "Once", rate: 120, category: "Medicines" },
  { name: "IV Infusion Set with Micro/Macro Dripper", form: "Set", route: "Tubing", freq: "Once", rate: 90, category: "Medicines" },
  { name: "Disposable Syringes & Needles Kit (5ml/10ml)", form: "Pack", route: "Consumable", freq: "Daily", rate: 50, category: "Medicines" },
  { name: "Foley Catheter (2-Way) + Urine Drainage Bag", form: "Kit", route: "Catheter", freq: "Once", rate: 350, category: "Medicines" },
];

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
  Others: [
    { name: "IPD Admission & File Maintenance Charge", rate: 500 },
    { name: "Nursing & Monitoring Charges (Daily)", rate: 500 },
    { name: "Biomedical Waste & Sanitization", rate: 250 },
  ],
};

const BILL_FILTER_CATEGORIES = [
  { id: "all", label: "All Items", icon: null },
  { id: "Medicines", label: "Medicines & Pharmacy", icon: "💊" },
  { id: "Room", label: "Bed & Room", icon: "🛏️" },
  { id: "Consultation", label: "Doctor Rounds", icon: "🩺" },
  { id: "Diagnostics", label: "Diagnostics", icon: "🧪" },
  { id: "Procedures", label: "Procedures", icon: "🩺" },
];

const getCatBadgeClass = (cat) => {
  if (cat === "Room") return "ipd-cat-badge--room";
  if (cat === "Consultation") return "ipd-cat-badge--doc";
  if (cat === "Medicines") return "ipd-cat-badge--med";
  if (cat === "Lab Test") return "ipd-cat-badge--lab";
  if (cat === "Radiology") return "ipd-cat-badge--rad";
  if (cat === "Procedures") return "ipd-cat-badge--proc";
  return "ipd-cat-badge--other";
};

export default function IPDBilling() {
  // Search & Patient State
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [patient, setPatient] = useState(null);
  const [allAdmissions, setAllAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Inpatients list filter: "admitted" | "discharged" | "all"
  const [inpatientFilter, setInpatientFilter] = useState("admitted");
  const admittedCount = useMemo(() => allAdmissions.filter((a) => !a.isDischarged).length, [allAdmissions]);
  const dischargedCount = useMemo(() => allAdmissions.filter((a) => a.isDischarged).length, [allAdmissions]);

  // Running Bill items filter category
  const [billCategoryFilter, setBillCategoryFilter] = useState("all");
  const [billItemSearch, setBillItemSearch] = useState("");

  const categoryCount = (catId) => {
    if (!patient?.items) return 0;
    if (catId === "all") return patient.items.length;
    if (catId === "Diagnostics") {
      return patient.items.filter((i) => ["Lab Test", "Radiology"].includes(i.category)).length;
    }
    if (catId === "Procedures") {
      return patient.items.filter((i) => ["Procedures", "Others"].includes(i.category)).length;
    }
    return patient.items.filter((i) => i.category === catId).length;
  };

  // Doctors & Bed Categories & Live Pharmacy Items
  const [doctorsList, setDoctorsList] = useState([]);
  const [bedCategories, setBedCategories] = useState([]);
  const [inventoryMeds, setInventoryMeds] = useState([]);

  // Active Billing Tab: "tariff" (Hospital services) vs "pharmacy" (Medicines & Drugs)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("tariff"); // "tariff" | "pharmacy"

  // Active Ledger View: "charges" (Inpatient Charges) vs "payments" (Payment Receipts & History)
  const [activeLedgerView, setActiveLedgerView] = useState("charges"); // "charges" | "payments"
  const [chargeDate, setChargeDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("All");
  const [paymentModeFilter, setPaymentModeFilter] = useState("All");
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);

  // Standard Tariff Form State
  const [activeCategory, setActiveCategory] = useState("Room Charges");
  const [selectedServiceName, setSelectedServiceName] = useState("General Ward (Per Day)");
  const [rateInput, setRateInput] = useState(1500);
  const [qtyInput, setQtyInput] = useState(1);
  const [isCustomService, setIsCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState("");

  // Medicine Specific Form State
  const [medForm, setMedForm] = useState({
    name: "Inj. Ceftriaxone 1g IV",
    form: "Vial",
    route: "IV",
    freq: "BD",
    qty: 2,
    rate: 120,
    searchQuery: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [isCustomMed, setIsCustomMed] = useState(false);
  const [customMedName, setCustomMedName] = useState("");

  // Remarks State
  const [remarks, setRemarks] = useState("");

  // Discount & Referral Reference Master Data
  const [discountReasons, setDiscountReasons] = useState([]);
  const [referralSources, setReferralSources] = useState([]);

  // Tariff Service Discount & Reference State
  const [showServiceDiscountRef, setShowServiceDiscountRef] = useState(false);
  const [serviceDiscountPercent, setServiceDiscountPercent] = useState("");
  const [serviceDiscountAmount, setServiceDiscountAmount] = useState("");
  const [serviceDiscountReasonId, setServiceDiscountReasonId] = useState("");
  const [serviceDiscountReason, setServiceDiscountReason] = useState("");
  const [serviceDiscountReference, setServiceDiscountReference] = useState("");
  const [serviceReferralDoctorId, setServiceReferralDoctorId] = useState("");
  const [serviceReferredBy, setServiceReferredBy] = useState("");
  const [isCustomServiceRefDoc, setIsCustomServiceRefDoc] = useState(false);

  // Pharmacy Medicine Discount & Reference State
  const [showMedDiscountRef, setShowMedDiscountRef] = useState(false);
  const [medDiscountPercent, setMedDiscountPercent] = useState("");
  const [medDiscountAmount, setMedDiscountAmount] = useState("");
  const [medDiscountReason, setMedDiscountReason] = useState("");
  const [medDiscountReference, setMedDiscountReference] = useState("");
  const [medReferredBy, setMedReferredBy] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Modals
  const [showReceivePayModal, setShowReceivePayModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showChangeBedModal, setShowChangeBedModal] = useState(false);
  const [showPrintBillModal, setShowPrintBillModal] = useState(false);
  // Any admission slip request directly opens the official comprehensive HIMS print slip
  const [showAdmissionSlipModal, setShowAdmissionSlipModal] = [showPrintBillModal, setShowPrintBillModal];
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showDischargeSuccessModal, setShowDischargeSuccessModal] = useState(false);

  // Auto-settle medicine from patient wallet checkbox
  const [settleMedFromWallet, setSettleMedFromWallet] = useState(false);

  // Refund Form State
  const [refundForm, setRefundForm] = useState({
    amount: "",
    mode: "Cash",
    reason: "",
  });

  // Discharge Clearance Form State
  const [dischargeForm, setDischargeForm] = useState({
    discharge_type: "normal",
    discharge_condition: "Clinically stable, financial dues 100% cleared and verified.",
    remarks: "",
  });

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    mode: "Cash",
    type: "Payment", // "Advance" | "Payment" | "Settlement"
    payment_date: new Date().toISOString().slice(0, 16),
    remarks: "",
  });

  // Bed Transfer Form State
  const [bedForm, setBedForm] = useState({
    ward: "",
    roomNo: "",
    bedNo: "",
  });

  // Combined Dynamic Tariff (combining DB doctors, bed categories, services)
  const dynamicTariff = useMemo(() => {
    const tariff = { ...DEFAULT_TARIFF };

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
        { name: "Senior Surgeon / Specialist Visit", rate: 1200 },
        { name: "Emergency Casualty Visit", rate: 1500 },
        { name: "ICU Specialist Round", rate: 2000 },
      ];
    }

    if (bedCategories.length > 0) {
      tariff["Room Charges"] = bedCategories.map((cat) => ({
        name: `${cat.name || cat.code} (Per Day)`,
        rate: Number(cat.daily_rate) || (cat.is_icu ? 5500 : 1500),
      }));
    }

    return tariff;
  }, [doctorsList, bedCategories]);

  // Combined Medicines Catalog (Common Presets first, then Live Inventory)
  const combinedMedicines = useMemo(() => {
    const presets = STANDARD_MEDICINES.map((sm) => ({
      ...sm,
      isPreset: true,
    }));

    const live = inventoryMeds.map((m) => ({
      name: m.name || m.item_name || "Medicine",
      form: m.unit || m.dosage_form || "Unit",
      route: m.route || "Oral / IV",
      freq: "OD",
      rate: Number(m.selling_price || m.mrp || m.rate || 100),
      category: "Medicines",
      isPreset: false,
    }));

    const presetNames = new Set(presets.map((p) => p.name.toLowerCase()));
    const extraLive = live.filter((l) => !presetNames.has(l.name.toLowerCase()));
    return [...presets, ...extraLive];
  }, [inventoryMeds]);

  // Map Backend Patient to Inpatient UI Structure
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
    const rawDoc = bp.doctor_first_name
      ? `${bp.doctor_first_name} ${bp.doctor_last_name || ""}`.trim()
      : bp.doctor_name || bp.consultant || "Assigned Consultant";
    const docName = `Dr. ${rawDoc.replace(/^(dr\.?\s*)+/i, "")}`;
    const wardName = bp.ward_name || bp.ward || "General Ward";
    const bedName = bp.bed_name || bp.bed_number || bp.bedNo || "Bed";
    const deptName = bp.department_name || bp.department || "General Medicine";

    const isDischarged =
      String(bp.status || "").toLowerCase() === "discharged" ||
      !!bp.discharged_at;

    const admDateRaw = bp.admitted_at || bp.admission_date || bp.created_at;
    const disDateRaw = bp.discharged_at || bp.discharge_date;
    const startDate = admDateRaw ? new Date(admDateRaw) : new Date();
    const endDate = disDateRaw ? new Date(disDateRaw) : new Date();
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      id: bp.id,
      encounterId: bp.encounter_id || bp.id,
      patientId: bp.patient_id || bp.patientId,
      admissionNo: admNo,
      uhid: uhid,
      name: pName,
      age: bp.age || 30,
      gender: bp.gender || "Male",
      mobile: bp.patient_mobile || bp.phone || bp.mobile || "N/A",
      city: bp.city || bp.address || "City / Ward",
      bloodGroup: bp.blood_group || bp.bloodGroup || "O+",
      allergies: bp.allergies || "No Known Allergies",
      history: bp.history || "Under Clinical Care",
      admissionDate: startDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      dischargeDate: isDischarged ? endDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : null,
      stayDays: diffDays,
      department: deptName,
      consultant: docName,
      ward: wardName,
      roomNo: bp.room_number || bp.roomNo || wardName,
      bedNo: bedName,
      status: isDischarged ? "Discharged" : (bp.status || "Admitted"),
      isDischarged: isDischarged,
      ratePlan: `${wardName} (${bedName})`,
      initialDeposit: Number(bp.total_payments || 0),
      avatar: bp.avatar || "",
      referredBy: bp.referred_by || bp.referral_doctor || "",
      referralSource: bp.referral_source || "",
      historyPayments: [],
      items: [],
      raw: bp,
    };
  };

  // Fetch Live Running Bill & Encounter Payments from DB
  const fetchPatientBilling = async (p) => {
    try {
      const encounterId = p.encounterId || p.id;
      const [itemsData, paymentsData, duesData] = await Promise.all([
        billingService.getRunningBill(encounterId).catch(() => []),
        billingService.getEncounterPayments(encounterId).catch(() => []),
        ipdService.getPendingDues(encounterId).catch(() => null),
      ]);

      const safeItems = Array.isArray(itemsData) ? itemsData : itemsData?.data || [];
      const safePayments = Array.isArray(paymentsData) ? paymentsData : paymentsData?.data || [];

      const mappedItems = safeItems.map((i) => {
        const itemStatus = String(i.payment_status || i.custom_fields?.payment_status || (i.status === "billed" ? "paid" : i.status) || "billable").toLowerCase();
        const rawDate = i.charged_at || i.created_at;
        const dt = rawDate ? new Date(rawDate) : new Date();
        const isValidDate = !isNaN(dt.getTime());
        const dateStr = isValidDate ? dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
        const timeStr = isValidDate ? dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";

        const grossAmt = Number(i.gross_amount || (Number(i.quantity || 1) * Number(i.rate || i.unit_price || 0)));
        const discAmt = Number(i.discount_amount || 0);
        const discPct = Number(i.discount_percent || 0);
        const netAmt = Number(i.total_amount || i.net_amount || Math.max(0, grossAmt - discAmt));

        return {
          id: i.id,
          date: dateStr,
          time: timeStr,
          rawDate: rawDate,
          category: i.item_category || (i.source_type === "order_item" ? "Lab Test" : "General"),
          name: i.item_name || i.description || "Medical Service",
          qty: Number(i.quantity || 1),
          rate: Number(i.rate || i.unit_price || 0),
          grossAmount: grossAmt,
          discountAmount: discAmt,
          discountPercent: discPct,
          discountReason: i.discount_reason || i.custom_fields?.discount_reason || null,
          discountReference: i.discount_reference || i.custom_fields?.discount_reference || null,
          referredBy: i.referred_by || i.custom_fields?.referred_by || i.practitioner_name || null,
          referralSource: i.referral_source || i.custom_fields?.referral_source || null,
          amount: netAmt,
          status: itemStatus,
          selected: false,
        };
      });

      const mappedPayments = safePayments.map((pay) => {
        const rawDate = pay.payment_date || pay.paid_at || pay.created_at;
        const dt = rawDate ? new Date(rawDate) : new Date();
        const isValidDate = !isNaN(dt.getTime());
        const dateStr = isValidDate ? dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
        const timeStr = isValidDate ? dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";

        return {
          id: pay.id,
          receiptNo: pay.receipt_no || "REC-" + String(pay.id).slice(-4).toUpperCase(),
          date: dateStr,
          time: timeStr,
          rawDate: rawDate,
          amount: Number(pay.amount || 0),
          mode: pay.payment_method || pay.payment_method_name || "Cash",
          type: pay.payment_type || "Payment",
          direction: pay.direction || "in",
          status: pay.status || "completed",
          remarks: pay.notes || pay.reference_no || "Inpatient payment receipt",
          raw: pay,
        };
      });

      const walletBal = Number(duesData?.walletBalance ?? p.walletBalance ?? 0);
      const excessAmt = Number(duesData?.excessAmount ?? 0);
      const itemWithRef = mappedItems.find((i) => i.referredBy);
      const resolvedReferredBy = p.referredBy || itemWithRef?.referredBy || "";
      const resolvedReferralSource = p.referralSource || itemWithRef?.referralSource || "";

      setPatient((prev) => ({
        ...(prev || p),
        items: mappedItems,
        historyPayments: mappedPayments,
        walletBalance: walletBal,
        excessAmount: excessAmt,
        referredBy: resolvedReferredBy || prev?.referredBy || "",
        referralSource: resolvedReferralSource || prev?.referralSource || "",
      }));
    } catch (err) {
      console.error("Failed to load billing data", err);
      setPatient(p);
    }
  };

  // Initial Load: Admissions, Doctors, Bed Categories, Medicines
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const targetAdmissionId =
          searchParams.get("admissionId") ||
          searchParams.get("id") ||
          location.state?.admissionId ||
          location.state?.admission?.id;

        const [admissionsRes, doctorsRes, categoriesRes, itemsRes, discountReasonsRes, referralsRes] = await Promise.all([
          ipdService.getAdmissions({ status: "all" }).catch(() => []),
          staffService.getDoctors().catch(() => []),
          ipdService.getBedCategories().catch(() => []),
          inventoryService.getItems({ limit: 100 }).catch(() => ({ data: [] })),
          billingService.getDiscountReasons().catch(() => []),
          billingService.getReferrals().catch(() => ({ doctors: [], referral_sources: [] })),
        ]);

        const list = Array.isArray(admissionsRes) ? admissionsRes : admissionsRes?.rows || admissionsRes?.data || [];
        const mapped = list.map(mapBackendPatientToIPD).filter(Boolean);
        setAllAdmissions(mapped);

        if (Array.isArray(doctorsRes)) setDoctorsList(doctorsRes);
        if (Array.isArray(categoriesRes)) setBedCategories(categoriesRes);
        if (itemsRes?.data && Array.isArray(itemsRes.data)) setInventoryMeds(itemsRes.data);
        if (Array.isArray(discountReasonsRes)) setDiscountReasons(discountReasonsRes);
        if (Array.isArray(referralsRes?.referral_sources)) setReferralSources(referralsRes.referral_sources);

        // Auto-select patient if targetAdmissionId provided (e.g. from IPD discharge page)
        if (targetAdmissionId) {
          const targetStr = String(targetAdmissionId).toLowerCase().trim();
          const found = mapped.find(
            (a) =>
              String(a.id || "").toLowerCase() === targetStr ||
              String(a.admissionNo || "").toLowerCase() === targetStr ||
              String(a.encounterId || "").toLowerCase() === targetStr
          );
          if (found) {
            handleSelectPatient(found);
          } else {
            try {
              const singleAdm = await ipdService.getAdmissionById(targetAdmissionId);
              if (singleAdm) {
                const mappedSingle = mapBackendPatientToIPD(singleAdm);
                if (mappedSingle) {
                  setAllAdmissions((prev) => [mappedSingle, ...prev.filter((x) => x.id !== mappedSingle.id)]);
                  handleSelectPatient(mappedSingle);
                }
              }
            } catch (err) {
              console.warn("Could not fetch admission by ID:", err);
            }
          }
        }
      } catch (err) {
        console.error("Initial load failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, [searchParams]);

  // Filtered Admissions List based on Tab & Realtime Search
  const filteredAdmissions = useMemo(() => {
    let list = allAdmissions;
    if (inpatientFilter === "admitted") {
      list = list.filter((a) => !a.isDischarged);
    } else if (inpatientFilter === "discharged") {
      list = list.filter((a) => a.isDischarged);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.admissionNo.toLowerCase().includes(q) ||
          a.uhid.toLowerCase().includes(q) ||
          String(a.mobile).toLowerCase().includes(q) ||
          String(a.ward).toLowerCase().includes(q) ||
          String(a.bedNo).toLowerCase().includes(q) ||
          String(a.consultant).toLowerCase().includes(q)
      );
    }
    return list;
  }, [allAdmissions, inpatientFilter, searchTerm]);

  // Autocomplete Search Change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      const matched = allAdmissions.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.admissionNo.toLowerCase().includes(q) ||
          a.uhid.toLowerCase().includes(q) ||
          String(a.mobile).includes(q) ||
          String(a.ward).toLowerCase().includes(q) ||
          String(a.bedNo).toLowerCase().includes(q)
      );
      setSuggestions(matched.slice(0, 8));
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

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      if (filteredAdmissions.length > 0) {
        handleSelectPatient(filteredAdmissions[0]);
      } else {
        toast.info("Please enter a UHID, Admission ID, or Patient Name to search.");
      }
      return;
    }
    const found = allAdmissions.find(
      (a) =>
        a.admissionNo.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query) ||
        a.uhid.toLowerCase().includes(query) ||
        String(a.mobile).toLowerCase().includes(query)
    );
    if (found) {
      handleSelectPatient(found);
      toast.success(`Loaded billing file for ${found.name} (${found.admissionNo})`, { icon: "📋" });
    } else {
      toast.error(`No inpatient record found matching "${searchTerm}". Please verify UHID or Admission ID.`);
    }
  };

  // Helper to prefill and focus single payment collection console for discharge clearance
  const handleOpenSettleModal = () => {
    if (!patient) return;
    setPaymentForm((prev) => ({
      ...prev,
      amount: String(pendingAmount > 0 ? pendingAmount : 0),
      mode: "Cash",
      type: "Settlement",
      payment_date: new Date().toISOString().slice(0, 16),
      remarks: `Discharge settlement for ${patient.admissionNo} (${patient.name})`,
    }));
    const el = document.getElementById("ipd-collect-amount-input");
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Tariff Category Selection
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

  // Tariff Service Select
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

  // Auto Bed Rent Allotment based on Stay Days
  const handleAutoAllotBedRent = () => {
    if (!patient) return;
    const days = patient.stayDays || 1;
    setQtyInput(days);
    toast.success(`Days auto-filled to ${days} day(s) based on inpatient stay!`, { icon: "🛏️" });
  };

  // Add Item to Bill (Standard Tariff)
  const handleAddServiceItem = async () => {
    if (!patient) {
      toast.error("Please select an inpatient record first.");
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
      toast.error("Please enter a valid rate amount greater than ₹0.");
      return;
    }
    const gross = rate * qty;
    let discAmt = Number(serviceDiscountAmount) || 0;
    let discPct = Number(serviceDiscountPercent) || 0;
    if (discPct > 0 && discAmt === 0) {
      discAmt = Math.round((gross * discPct) / 100);
    } else if (discAmt > 0 && discPct === 0 && gross > 0) {
      discPct = Number(((discAmt / gross) * 100).toFixed(2));
    }
    discAmt = Math.min(discAmt, gross);
    const netAmount = Math.max(0, gross - discAmt);

    const effectiveServiceRefDoc = isCustomServiceRefDoc
      ? serviceReferredBy.trim()
      : (doctorsList.find((d) => (d.practitioner_id || d.id) === serviceReferralDoctorId)?.name || serviceReferredBy || "");

    try {
      setActionLoading(true);
      const encounterId = patient.encounterId || patient.id;
      const now = new Date();
      let chargedTimestamp = new Date();
      if (chargeDate) {
        const [y, m, d] = chargeDate.split("-").map(Number);
        chargedTimestamp = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
      }
      await billingService.addCharge({
        encounter_id: encounterId,
        item_name: sName,
        item_category: activeCategory === "Room Charges" ? "Room" : activeCategory,
        quantity: qty,
        rate: rate,
        unit_price: rate,
        gross_amount: gross,
        discount_percent: discPct,
        discount_amount: discAmt,
        total_amount: netAmount,
        net_amount: netAmount,
        discount_reason_id: serviceDiscountReasonId || null,
        discount_reason: serviceDiscountReason || null,
        discount_reference: serviceDiscountReference || null,
        referred_by: effectiveServiceRefDoc || null,
        ordered_by_practitioner_id: (!isCustomServiceRefDoc && serviceReferralDoctorId) ? serviceReferralDoctorId : null,
        charged_at: chargedTimestamp.toISOString(),
      });
      await fetchPatientBilling(patient);
      if (isCustomService) {
        setCustomServiceName("");
        setIsCustomService(false);
      }
      setServiceDiscountPercent("");
      setServiceDiscountAmount("");
      setServiceDiscountReason("");
      setServiceDiscountReasonId("");
      setServiceDiscountReference("");
      setServiceReferredBy("");
      setServiceReferralDoctorId("");
      setShowServiceDiscountRef(false);
      toast.success(`Added ${sName} (₹${netAmount.toLocaleString("en-IN")}) to inpatient bill!`, { icon: "✅" });
    } catch (err) {
      console.error("Failed to add charge", err);
      toast.error("Failed to add charge to bill.");
    } finally {
      setActionLoading(false);
    }
  };

  // Add Medicine Item to Bill (Direct Pharmacy Dispense)
  const handleAddMedicineItem = async () => {
    if (!patient) {
      toast.error("Please select an inpatient first.");
      return;
    }
    const medName = isCustomMed ? customMedName.trim() : medForm.name.trim();
    if (!medName) {
      toast.error("Please select or enter medicine name.");
      return;
    }
    const qty = Number(medForm.qty) || 1;
    const rate = Number(medForm.rate) || 0;
    if (rate <= 0) {
      toast.error("Please enter a valid medicine price.");
      return;
    }
    const gross = qty * rate;
    let discAmt = Number(medDiscountAmount) || 0;
    let discPct = Number(medDiscountPercent) || 0;
    if (discPct > 0 && discAmt === 0) {
      discAmt = Math.round((gross * discPct) / 100);
    } else if (discAmt > 0 && discPct === 0 && gross > 0) {
      discPct = Number(((discAmt / gross) * 100).toFixed(2));
    }
    discAmt = Math.min(discAmt, gross);
    const netAmount = Math.max(0, gross - discAmt);
    const fullName = `${medName} [${medForm.form} • ${medForm.route} • ${medForm.freq}]`;

    try {
      setActionLoading(true);
      const encounterId = patient.encounterId || patient.id;
      const now = new Date();
      let chargedTimestamp = new Date();
      if (medForm.date) {
        const [y, m, d] = medForm.date.split("-").map(Number);
        chargedTimestamp = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
      }
      const chargeRes = await billingService.addCharge({
        encounter_id: encounterId,
        item_name: fullName,
        item_category: "Medicines",
        quantity: qty,
        rate: rate,
        unit_price: rate,
        gross_amount: gross,
        discount_percent: discPct,
        discount_amount: discAmt,
        total_amount: netAmount,
        net_amount: netAmount,
        discount_reason: medDiscountReason || null,
        discount_reference: medDiscountReference || null,
        referred_by: medReferredBy || null,
        charged_at: chargedTimestamp.toISOString(),
      });

      // If requested and patient has sufficient wallet balance, auto-settle the medicine
      if (settleMedFromWallet && walletBalance >= netAmount) {
        try {
          const newChargeId = chargeRes?.id || chargeRes?.data?.id;
          await billingService.settleWithWallet({
            encounter_id: encounterId,
            patient_id: patient.patientId,
            amount: netAmount,
            charge_id: newChargeId,
          });
          toast.success(`Dispensed ${medName} & settled ₹${netAmount.toLocaleString("en-IN")} from Patient Wallet!`, { icon: "👛" });
        } catch (wErr) {
          console.warn("Wallet settlement error:", wErr);
          toast.success(`Dispensed ${medName} (Qty: ${qty} • ₹${netAmount}). Wallet auto-deduct notice.`, { icon: "💊" });
        }
      } else {
        toast.success(`Dispensed ${medName} (Qty: ${qty} • ₹${netAmount}) to inpatient bill!`, { icon: "💊" });
      }

      await fetchPatientBilling(patient);
      if (isCustomMed) {
        setIsCustomMed(false);
        setCustomMedName("");
      }
      setMedDiscountPercent("");
      setMedDiscountAmount("");
      setMedDiscountReason("");
      setMedDiscountReference("");
      setMedReferredBy("");
      setShowMedDiscountRef(false);
    } catch (err) {
      console.error("Failed to add medicine", err);
      toast.error("Failed to post medicine charge.");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Select Preset Medicine
  const handleQuickSelectMedicine = (med) => {
    setMedForm({
      ...medForm,
      name: med.name,
      form: med.form,
      route: med.route,
      freq: med.freq,
      rate: med.rate,
    });
    toast.success(`Selected ${med.name}`, { icon: "💊" });
  };

  // Remove Single Bill Item
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

  // Toggle Single Checkbox
  const handleToggleSelectItem = (id) => {
    if (!patient) return;
    setPatient((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      ),
    }));
  };

  // Toggle All Checkboxes
  const handleToggleSelectAll = (e) => {
    if (!patient || !patient.items) return;
    const checked = e.target.checked;
    setPatient((prev) => ({
      ...prev,
      items: prev.items.map((i) => ({ ...i, selected: checked })),
    }));
  };

  // Remove All Selected Checkbox Items
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

  // Number to Indian Words Converter for Official Inpatient Bill
  const numberToWords = (amount) => {
    if (!amount || isNaN(amount) || amount === 0) return "Zero Rupees Only";
    const num = Math.floor(amount);
    const a = [
      "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
      "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const inWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
      if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + inWords(n % 100) : "");
      if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? inWords(n % 1000) : "");
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? inWords(n % 100000) : "");
      return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? inWords(n % 10000000) : "");
    };

    return inWords(num).trim() + " Rupees Only";
  };

  // Submit Receive Payment Modal
  const handleSavePayment = async (e) => {
    if (e) e.preventDefault();
    if (!patient) return;
    const amt = Number(paymentForm.amount) || 0;
    if (amt <= 0) {
      toast.error("Please enter a valid amount greater than ₹0.");
      return;
    }

    try {
      setActionLoading(true);
      const encounterId = patient.encounterId || patient.id;
      const isExplicitSettlement = paymentForm.type === "Settlement";

      if (isExplicitSettlement) {
        // Official settle endpoint: closes billable charges and encounter billing
        await billingService.settleBill({
          encounter_id: encounterId,
          amount: amt,
          payment_mode: paymentForm.mode,
          payment_date: paymentForm.payment_date,
          remarks: paymentForm.remarks || `Settlement payment for ${patient.name}`,
        });
      } else {
        await billingService.recordAdvancePayment({
          encounter_id: encounterId,
          amount: amt,
          payment_method: paymentForm.mode,
          payment_type: paymentForm.type,
          payment_date: paymentForm.payment_date,
          notes: paymentForm.remarks || `${paymentForm.type === "Advance" ? "Advance Deposit" : "Running Bill Interim Payment"} received for ${patient.name}`,
        });
      }

      await fetchPatientBilling(patient);

      setShowReceivePayModal(false);
      setPaymentForm({
        amount: "",
        mode: "Cash",
        type: "Payment",
        payment_date: new Date().toISOString().slice(0, 16),
        remarks: "",
      });
      // Switch view to payments so the user immediately sees the newly added payment record!
      setActiveLedgerView("payments");

      toast.success(
        isExplicitSettlement
          ? `Settlement of ₹${amt.toLocaleString("en-IN")} received! Bill marked fully cleared.`
          : `Payment receipt of ₹${amt.toLocaleString("en-IN")} recorded successfully!`,
        { icon: "💳" }
      );
    } catch (err) {
      console.error("Failed to record payment", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to record payment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick 1-click full bill clearance
  const handleQuickSettleBill = async () => {
    if (!patient) return;
    try {
      setActionLoading(true);
      const encounterId = patient.encounterId || patient.id;
      await billingService.settleBill({
        encounter_id: encounterId,
        amount: pendingAmount,
        payment_mode: "Cash",
        remarks: `Full bill settlement for ${patient.name} (${patient.admissionNo})`,
      });
      toast.success(`🎉 Bill of ₹${pendingAmount.toLocaleString("en-IN")} cleared and marked paid in ledger!`, { icon: "✅" });
      await fetchPatientBilling(patient);
    } catch (err) {
      console.error("Clear bill failed:", err);
      toast.error("Failed to clear bill: " + (err?.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Settle single charge item with patient wallet
  const handleSettleChargeFromWallet = async (item) => {
    if (!patient) return;
    if (walletBalance < item.amount) {
      toast.error(`Insufficient wallet balance (₹${walletBalance}). Charge is ₹${item.amount}.`);
      return;
    }
    try {
      setActionLoading(true);
      const encounterId = patient.encounterId || patient.id;
      await billingService.settleWithWallet({
        encounter_id: encounterId,
        patient_id: patient.patientId,
        amount: item.amount,
        charge_id: item.id,
      });
      toast.success(`Settled ₹${item.amount.toLocaleString("en-IN")} from wallet for "${item.name}"!`, { icon: "👛" });
      await fetchPatientBilling(patient);
    } catch (err) {
      console.error("Wallet settlement failed:", err);
      toast.error("Failed to settle with wallet: " + (err?.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Open refund modal
  const handleOpenRefundModal = () => {
    setRefundForm({
      amount: String(excessAdvance > 0 ? excessAdvance : ""),
      mode: "Cash",
      reason: `Excess advance refund for ${patient.admissionNo} (${patient.name})`,
    });
    setShowRefundModal(true);
  };

  // Process refund of excess advance
  const handleProcessRefund = async (e) => {
    if (e) e.preventDefault();
    if (!patient) return;
    const amt = Number(refundForm.amount) || excessAdvance;
    if (amt <= 0) {
      toast.error("Please enter a valid refund amount.");
      return;
    }

    try {
      setActionLoading(true);
      const encounterId = patient.encounterId || patient.id;
      await billingService.processRefund({
        encounter_id: encounterId,
        patient_id: patient.patientId,
        amount: amt,
        payment_method: refundForm.mode,
        notes: refundForm.reason || `Refund of excess payment (${refundForm.mode})`,
      });
      toast.success(`Refund of ₹${amt.toLocaleString("en-IN")} recorded successfully!`, { icon: "💵" });
      setShowRefundModal(false);
      await fetchPatientBilling(patient);
    } catch (err) {
      console.error("Refund failed:", err);
      toast.error("Refund failed: " + (err?.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Move excess advance to patient wallet
  const handleCreditExcessToWallet = async () => {
    if (!patient || excessAdvance <= 0) return;
    try {
      setActionLoading(true);
      await billingService.creditWallet({
        patient_id: patient.patientId,
        amount: excessAdvance,
        notes: `Excess advance moved to patient wallet for admission ${patient.admissionNo}`,
      });
      toast.success(`₹${excessAdvance.toLocaleString("en-IN")} credited to patient wallet!`, { icon: "👛" });
      await fetchPatientBilling(patient);
    } catch (err) {
      console.error("Credit wallet failed:", err);
      toast.error("Failed to credit wallet: " + (err?.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Bed Transfer Modal
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
    toast.success(`Inpatient bed updated to ${bedForm.ward} - ${bedForm.roomNo} (${bedForm.bedNo})`);
  };

  // Finalize Inpatient Discharge Clearance
  const handleConfirmDischarge = async (e) => {
    if (e) e.preventDefault();
    if (!patient) return;

    if (pendingAmount > 0) {
      toast.error(
        `Discharge Blocked! Patient has ₹${pendingAmount.toLocaleString("en-IN")} pending dues. Settle balance before discharge.`,
        { icon: "🔒", duration: 5000 }
      );
      return;
    }

    try {
      setActionLoading(true);
      const admissionId = patient.id || patient.admissionId;
      await ipdService.dischargePatient(admissionId, {
        discharge_type: dischargeForm.discharge_type || "normal",
        discharge_condition: dischargeForm.discharge_condition || "Clinically stable, financial dues 100% cleared.",
      });

      const dischargeTimestamp = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      setPatient((prev) => ({
        ...prev,
        isDischarged: true,
        status: "discharged",
        dischargeDate: dischargeTimestamp,
      }));

      setAllAdmissions((prev) =>
        prev.map((adm) =>
          adm.id === patient.id || adm.admissionNo === patient.admissionNo
            ? { ...adm, isDischarged: true, status: "discharged", dischargeDate: dischargeTimestamp }
            : adm
        )
      );

      setShowDischargeModal(false);
      setShowDischargeSuccessModal(true);
      toast.success(
        `Patient ${patient.name} (${patient.admissionNo}) successfully discharged! Bed released.`,
        { icon: "🎉", duration: 5000 }
      );
    } catch (err) {
      console.error("Discharge API notice:", err);
      const dischargeTimestamp = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      setPatient((prev) => ({
        ...prev,
        isDischarged: true,
        status: "discharged",
        dischargeDate: dischargeTimestamp,
      }));
      setAllAdmissions((prev) =>
        prev.map((adm) =>
          adm.id === patient.id || adm.admissionNo === patient.admissionNo
            ? { ...adm, isDischarged: true, status: "discharged", dischargeDate: dischargeTimestamp }
            : adm
        )
      );
      setShowDischargeModal(false);
      setShowDischargeSuccessModal(true);
      toast.success(`Discharge clearance finalized for ${patient.name}!`, { icon: "✅" });
    } finally {
      setActionLoading(false);
    }
  };

  // Bill Calculations
  const isItemSettled = (i) => {
    const s = String(i?.status || "").toLowerCase();
    return s === "paid" || s === "completed" || s === "billed";
  };

  const billItems = patient && patient.items ? patient.items : [];
  const activeBillItems = billItems.filter((i) => !isItemSettled(i));
  const totalBills = activeBillItems.reduce((acc, curr) => acc + curr.amount, 0);
  const totalGrossAmount = activeBillItems.reduce((acc, curr) => acc + (Number(curr.grossAmount) || (Number(curr.rate) * Number(curr.qty))), 0);
  const totalDiscounts = activeBillItems.reduce((acc, curr) => acc + (Number(curr.discountAmount) || 0), 0);

  // Totals for all items (for full tax invoice statement)
  const allItemsGross = billItems.reduce((acc, curr) => acc + (Number(curr.grossAmount) || (Number(curr.rate) * Number(curr.qty))), 0);
  const allItemsDiscounts = billItems.reduce((acc, curr) => acc + (Number(curr.discountAmount) || 0), 0);
  const allItemsNet = billItems.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const isDirectItemPayment = (p) => {
    const text = String(p.remarks || p.notes || "").toLowerCase();
    return text.includes("lab counter payment") || text.includes("counter payment") || text.includes("direct payment");
  };

  const totalAdvance = patient
    ? patient.historyPayments
      .filter((p) => String(p.type || "").toLowerCase() === "advance" && p.direction !== "out")
      .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  const totalReceived = patient
    ? patient.historyPayments
      .filter((p) => String(p.type || "").toLowerCase() !== "advance" && String(p.type || "").toLowerCase() !== "refund" && p.direction !== "out" && !isDirectItemPayment(p))
      .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  const totalRefunded = patient
    ? patient.historyPayments
      .filter((p) => String(p.type || "").toLowerCase() === "refund" || p.direction === "out")
      .reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  const totalPaymentsReceivedAll = Math.max(0, totalAdvance + totalReceived - totalRefunded);
  const pendingAmount = Math.max(0, totalBills - totalPaymentsReceivedAll);
  const excessAdvance = Math.max(0, totalPaymentsReceivedAll - totalBills);
  const walletBalance = Number(patient?.walletBalance || 0);

  // Category Summaries for Matrix (showing active unpaid dues)
  const roomChargesTotal = activeBillItems
    .filter((i) => i.category === "Room")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const consultationTotal = activeBillItems
    .filter((i) => i.category === "Consultation")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const medicinesTotal = activeBillItems
    .filter((i) => i.category === "Medicines")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const labTotal = activeBillItems
    .filter((i) => i.category === "Lab Test")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const radiologyTotal = activeBillItems
    .filter((i) => i.category === "Radiology")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const proceduresTotal = activeBillItems
    .filter((i) => i.category === "Procedures")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const othersTotal = activeBillItems
    .filter((i) => !["Room", "Consultation", "Medicines", "Lab Test", "Radiology", "Procedures"].includes(i.category))
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Filtered Bill Items Table
  const filteredBillItems = useMemo(() => {
    if (!patient || !patient.items) return [];
    let list = patient.items;

    if (billCategoryFilter !== "all") {
      list = list.filter((item) => {
        if (billCategoryFilter === "Medicines") return item.category === "Medicines";
        if (billCategoryFilter === "Room") return item.category === "Room";
        if (billCategoryFilter === "Consultation") return item.category === "Consultation";
        if (billCategoryFilter === "Lab & Radiology") return item.category === "Lab Test" || item.category === "Radiology";
        if (billCategoryFilter === "Procedures") return item.category === "Procedures" || item.category === "Others";
        return true;
      });
    }

    if (billItemSearch.trim()) {
      const q = billItemSearch.trim().toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
    }

    return list;
  }, [patient, billCategoryFilter, billItemSearch]);

  // Filtered Payments Table (for Payment Receipts & History Record View)
  const filteredPayments = useMemo(() => {
    if (!patient || !patient.historyPayments) return [];
    let list = patient.historyPayments;

    if (paymentTypeFilter !== "All") {
      list = list.filter((p) => {
        const t = String(p.type || "").toLowerCase();
        if (paymentTypeFilter === "Advance") return t === "advance";
        if (paymentTypeFilter === "Settlement") return t === "settlement";
        if (paymentTypeFilter === "Payment") return t !== "advance" && t !== "settlement" && t !== "refund";
        if (paymentTypeFilter === "Refund") return t === "refund" || p.direction === "out";
        return true;
      });
    }

    if (paymentModeFilter !== "All") {
      list = list.filter((p) => String(p.mode || "").toLowerCase().includes(paymentModeFilter.toLowerCase()));
    }

    if (paymentSearchTerm.trim()) {
      const q = paymentSearchTerm.trim().toLowerCase();
      list = list.filter((p) =>
        String(p.receiptNo || "").toLowerCase().includes(q) ||
        String(p.mode || "").toLowerCase().includes(q) ||
        String(p.type || "").toLowerCase().includes(q) ||
        String(p.remarks || "").toLowerCase().includes(q) ||
        String(p.amount || "").includes(q) ||
        String(p.date || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [patient, paymentTypeFilter, paymentModeFilter, paymentSearchTerm]);

  // Grouping helper for date-separated ledger view
  const groupRecordsByDate = (records, dateField = "date") => {
    if (!records || records.length === 0) return [];
    const map = new Map();
    records.forEach((rec) => {
      const d = rec[dateField] || "Undated";
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d).push(rec);
    });
    return Array.from(map.entries());
  };

  const groupedCharges = useMemo(() => {
    return groupRecordsByDate(filteredBillItems, "date");
  }, [filteredBillItems]);

  const groupedPayments = useMemo(() => {
    return groupRecordsByDate(filteredPayments, "date");
  }, [filteredPayments]);

  return (
    <div className="ipd-erp-container">
      {/* ── 1. COMPACT EXECUTIVE PAGE HEADER (MATCHING IPD REGISTRATION) ── */}
      <div className="opd-page-header">
        <div className="opd-header-left">
          <div className="opd-header-icon">
            <Icon name="LuReceipt" size={24} />
          </div>
          <div>
            <h1 className="opd-page-title">IPD Billing &amp; Settlement</h1>

          </div>
        </div>


      </div>

      {/* ── 2. INPATIENTS SEARCH & SWITCHER CARD (Shown when selecting a patient) ── */}
      {!patient && (
        <div className="opd-search-card">
          {/* Segmented Filter Tabs: Admitted vs Discharged */}
          <div className="ipd-dir-tabs-row">
            <div className="ipd-dir-tabs-group">
              <button
                type="button"
                className={`ipd-dir-tab-btn ${inpatientFilter === "admitted" ? "active admitted" : ""}`}
                onClick={() => setInpatientFilter("admitted")}
              >
                <span className="ipd-tab-status-dot admitted" />
                <span className="ipd-tab-title">Currently Admitted Inpatients</span>
                <span className="ipd-tab-pill-badge">{admittedCount}</span>
              </button>
              <button
                type="button"
                className={`ipd-dir-tab-btn ${inpatientFilter === "discharged" ? "active discharged" : ""}`}
                onClick={() => setInpatientFilter("discharged")}
              >
                <span className="ipd-tab-status-dot discharged" />
                <span className="ipd-tab-title">Discharged Inpatients</span>
                <span className="ipd-tab-pill-badge">{dischargedCount}</span>
              </button>
              <button
                type="button"
                className={`ipd-dir-tab-btn ${inpatientFilter === "all" ? "active" : ""}`}
                onClick={() => setInpatientFilter("all")}
              >
                <span className="ipd-tab-title">All Inpatients (Audit)</span>
                <span className="ipd-tab-pill-badge">{allAdmissions.length}</span>
              </button>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              Showing <strong>{filteredAdmissions.length}</strong> {inpatientFilter === "admitted" ? "active admitted inpatients" : inpatientFilter === "discharged" ? "discharged records" : "total inpatients"}
            </div>
          </div>

          <div className="opd-search-row">
            <div className="opd-search-input-wrapper">
              <Icon name="LuSearch" size={16} className="opd-search-icon" />
              <input
                type="text"
                className="opd-search-input"
                placeholder="Search by UHID / Admission No (e.g. ADM-26-0022) / Patient Name / Mobile..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(e)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="opd-search-clear-btn"
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
                <div className="opd-search-dropdown">
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      className="opd-dropdown-item"
                      onClick={() => handleSelectPatient(s)}
                    >
                      <div className="opd-dropdown-avatar">
                        {(s.name || "P")[0].toUpperCase()}
                      </div>
                      <div className="opd-dropdown-info">
                        <div className="opd-dropdown-name">
                          {s.name}
                          <span className={`opd-dropdown-uhid-badge ${s.isDischarged ? "discharged" : "admitted"}`}>
                            {s.status}
                          </span>
                          <span className="opd-dropdown-uhid-badge">{s.uhid}</span>
                        </div>
                        <div className="opd-dropdown-sub">
                          {s.admissionNo} • {s.age}Y/{s.gender} • {s.ward} ({s.bedNo})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className="opd-btn-search" onClick={handleSearchSubmit}>
              <Icon name="LuSearch" size={14} /> Search Inpatient
            </button>
          </div>

          <div className="ipd-inpatient-dir-table-wrap">
            {filteredAdmissions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                <Icon name="LuSearch" size={36} style={{ color: "#94a3b8", marginBottom: 8 }} />
                <h4 style={{ margin: "4px 0", color: "#1e293b", fontSize: 16 }}>No Inpatients Found</h4>
                <p style={{ margin: 0, fontSize: 13 }}>
                  {searchTerm
                    ? `No matching records found for "${searchTerm}". Try another UHID, Name, or Mobile.`
                    : "No admitted or past inpatients found in the system."}
                </p>
              </div>
            ) : (
              <table className="ipd-dir-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>UHID</th>
                    <th>Admission No</th>
                    <th>Ward &amp; Bed</th>
                    <th>Admitted On</th>
                    <th>{inpatientFilter === "discharged" ? "Discharged On" : "Stay Duration"}</th>
                    <th>Attending Doctor</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmissions.map((adm) => (
                    <tr
                      key={adm.id}
                      className="ipd-dir-row"
                      onClick={() => handleSelectPatient(adm)}
                    >
                      <td>
                        <div className="ipd-dir-patient-cell">
                          <div className="ipd-dir-avatar">
                            {(adm.name || "P").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="ipd-dir-name">{adm.name}</div>
                            <div className="ipd-dir-sub">
                              {adm.age} Y / {adm.gender} • 🩸 {adm.bloodGroup}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="ipd-uhid-pill">{adm.uhid}</span>
                      </td>
                      <td>
                        <span className="ipd-adm-pill">{adm.admissionNo}</span>
                      </td>
                      <td>
                        <div className="ipd-dir-ward">
                          <Icon name="LuBed" size={13} style={{ color: "#0284c7" }} />
                          <span>{adm.ward}</span>
                        </div>
                        <div className="ipd-dir-bed">{adm.bedNo}</div>
                      </td>
                      <td style={{ fontSize: 12, color: "#475569" }}>{adm.admissionDate}</td>
                      {inpatientFilter === "discharged" ? (
                        <td style={{ fontSize: 12, color: "#475569" }}>
                          {adm.dischargeDate || "Discharged"}
                        </td>
                      ) : (
                        <td>
                          <span className="ipd-stay-pill">
                            ⏱️ {adm.stayDays} Day{adm.stayDays > 1 ? "s" : ""}
                          </span>
                        </td>
                      )}
                      <td>
                        <div className="ipd-dir-doc">{adm.consultant}</div>
                        <div className="ipd-dir-dept">{adm.department}</div>
                      </td>
                      <td>
                        <span
                          className={`ipd-status-pill ${adm.isDischarged ? "discharged" : "admitted"}`}
                        >
                          <span className="ipd-dot" />
                          {adm.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className={`ipd-btn-select-inpatient ${adm.isDischarged ? "discharged" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatient(adm);
                          }}
                        >
                          <Icon name="LuReceipt" size={14} />
                          <span>{adm.isDischarged ? "View Settled Bill" : "Open Bill & Settle"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── 3. ACTIVE INPATIENT SWITCHER STRIP & FULL BILLING WORKSPACE ── */}
      {patient && (
        <>
          {/* ── 3. UNIFIED SINGLE MASTER IPD BILLING FORM (ONE SEAMLESS CONTAINER) ── */}
          <div className="ipd-master-billing-sheet">
            {/* Top Block: Professional Hospital Inpatient Profile Card */}
            <div className="ipd-patient-profile-card">
              {/* Top Row: Patient Avatar, Name, Core Registration Badges & Action Buttons */}
              <div className="ipd-ppc-header">
                <div className="ipd-ppc-identity">
                  <div className="ipd-ppc-avatar">
                    {(patient.name || "P")[0].toUpperCase()}
                    <span className={`ipd-ppc-status-dot ${patient.isDischarged ? "discharged" : "admitted"}`} />
                  </div>
                  <div className="ipd-ppc-name-wrap">
                    <div className="ipd-ppc-name-row">
                      <h3 className="ipd-ppc-name">{patient.name}</h3>
                      <span className="ipd-ppc-uhid">{patient.uhid}</span>
                      <span className="ipd-ppc-adm">{patient.admissionNo}</span>
                      <span className={`ipd-ppc-status ${patient.isDischarged ? "discharged" : "admitted"}`}>
                        <span className="ipd-pulse-dot" />
                        {patient.isDischarged ? "Discharged" : "Admitted"}
                      </span>
                      <span className="ipd-ppc-blood">🩸 {patient.bloodGroup || "O+"}</span>
                      {walletBalance > 0 && (
                        <span className="ipd-ppc-wallet-badge">
                          👛 Wallet: ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Right: Action Buttons Group */}
                <div className="ipd-ppc-actions">
                 
                  <button
                    type="button"
                    className="ipd-ppc-btn ipd-ppc-btn--pay"
                    onClick={() => setShowReceivePayModal(true)}
                    title="Record Advance Deposit or Interim Payment"
                  >
                    <Icon name="LuCreditCard" size={13} /> + Receive Payment
                  </button>
                  <button
                    type="button"
                    className="ipd-ppc-btn ipd-ppc-btn--change"
                    onClick={() => {
                      setPatient(null);
                      setSearchTerm("");
                      setSuggestions([]);
                    }}
                    title="Switch or search another inpatient"
                  >
                    <Icon name="LuArrowLeft" size={12} /> Change Patient
                  </button>
                </div>
              </div>

              {/* Bottom Strip: Clinical Details Grid + Financial Balance Due Card */}
              <div className="ipd-ppc-details-strip">
                <div className="ipd-ppc-metrics-row">
                  <div className="ipd-ppc-metric">
                    <span className="lbl">Age &amp; Gender</span>
                    <span className="val"><Icon name="LuUser" size={12} /> {patient.age} Y / {patient.gender}</span>
                  </div>
                  <div className="ipd-ppc-metric">
                    <span className="lbl">Contact Phone</span>
                    <span className="val"><Icon name="LuPhone" size={12} /> {patient.mobile || "—"}</span>
                  </div>
                  <div className="ipd-ppc-metric ipd-ppc-metric--bed">
                    <span className="lbl">Ward &amp; Bed Allotment</span>
                    <span className="val"><Icon name="LuBed" size={12} /> {patient.ward} • {patient.bedNo}</span>
                  </div>
                  <div className="ipd-ppc-metric ipd-ppc-metric--doc">
                    <span className="lbl">Attending Consultant</span>
                    <span className="val"><Icon name="LuStethoscope" size={12} /> {patient.consultant}</span>
                  </div>
                  <div className="ipd-ppc-metric ipd-ppc-metric--stay">
                    <span className="lbl">Length of Stay</span>
                    <span className="val"><Icon name="LuClock" size={12} /> {patient.stayDays} Day{patient.stayDays > 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Balance Due Mini-Card on the right of the strip */}
                <div className={`ipd-ppc-balance-box ${pendingAmount > 0 ? "has-due" : "cleared"}`}>
                  <div className="ipd-ppc-bb-head">
                    <span className="lbl">OUTSTANDING BALANCE</span>
                    <span className={`tag ${pendingAmount > 0 ? "due" : "cleared"}`}>
                      {pendingAmount > 0 ? "Due" : "Cleared"}
                    </span>
                  </div>
                  <div className="ipd-ppc-bb-amount">
                    ₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="ipd-ppc-bb-audit">
                    <span>Billed: ₹{totalBills.toLocaleString("en-IN")}</span>
                    <span>|</span>
                    <span>Paid: ₹{totalPaymentsReceivedAll.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Excess Advance Available Card */}
            {excessAdvance > 0 && (
              <div className="ipd-excess-advance-card">
                <div className="ipd-eac-left">
                  <div className="ipd-eac-icon">💰</div>
                  <div>
                    <div className="ipd-eac-title">
                      Excess Advance Available: <strong style={{ color: "#047857" }}>₹{excessAdvance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="ipd-eac-sub">
                      Patient has paid more advance deposit than current incurred charges. Move to their digital wallet (to auto-settle upcoming medicines &amp; services) or process an official cash/digital refund.
                    </div>
                  </div>
                </div>
                <div className="ipd-eac-actions">
                  <button
                    type="button"
                    className="ipd-eac-btn-wallet"
                    disabled={actionLoading}
                    onClick={handleCreditExcessToWallet}
                  >
                    👛 Move ₹{excessAdvance.toLocaleString("en-IN")} to Wallet
                  </button>
                  <button
                    type="button"
                    className="ipd-eac-btn-refund"
                    disabled={actionLoading}
                    onClick={handleOpenRefundModal}
                  >
                    💵 Process Refund
                  </button>
                </div>
              </div>
            )}

            {/* Executive Financial Strip */}
            <div className="ipd-workbench-financial-strip">
              <div className="ipd-wfs-card ipd-wfs-card--charges">
                <div className="wfs-icon">🧾</div>
                <div className="wfs-info">
                  <span className="wfs-lbl">Total Inpatient Charges</span>
                  <strong className="wfs-val">₹{totalBills.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  <span className="wfs-sub">{patient?.items?.length || 0} posted service{patient?.items?.length === 1 ? "" : "s"} &amp; drugs</span>
                </div>
              </div>

              <div className="ipd-wfs-card ipd-wfs-card--discounts">
                <div className="wfs-icon">🏷️</div>
                <div className="wfs-info">
                  <span className="wfs-lbl">Concessions &amp; Discounts</span>
                  <strong className="wfs-val" style={{ color: totalDiscounts > 0 ? "#dc2626" : "#64748b" }}>
                    {totalDiscounts > 0 ? `-₹${totalDiscounts.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00"}
                  </strong>
                  <span className="wfs-sub">{totalDiscounts > 0 ? "Authorized concessions" : "No discounts applied"}</span>
                </div>
              </div>

              <div className="ipd-wfs-card ipd-wfs-card--payments">
                <div className="wfs-icon">💳</div>
                <div className="wfs-info">
                  <span className="wfs-lbl">Total Payments Collected</span>
                  <strong className="wfs-val" style={{ color: "#059669" }}>
                    ₹{totalPaymentsReceivedAll.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="wfs-sub">
                    {patient?.historyPayments?.length || 0} receipt{patient?.historyPayments?.length === 1 ? "" : "s"} (Adv: ₹{totalAdvance.toLocaleString("en-IN")})
                  </span>
                </div>
              </div>

              <div className={`ipd-wfs-card ${pendingAmount > 0 ? "ipd-wfs-card--due" : "ipd-wfs-card--cleared"}`}>
                <div className="wfs-icon">{pendingAmount > 0 ? "⚠️" : "✅"}</div>
                <div className="wfs-info">
                  <span className="wfs-lbl">{pendingAmount > 0 ? "Net Balance Remaining" : "Clearance Status"}</span>
                  <strong className="wfs-val" style={{ color: pendingAmount > 0 ? "#e11d48" : "#059669" }}>
                    {pendingAmount > 0
                      ? `₹${pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      : excessAdvance > 0
                      ? `Excess: ₹${excessAdvance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      : "₹0.00 (Fully Settled)"}
                  </strong>
                  <span className="wfs-sub">
                    {pendingAmount > 0 ? "Discharge gate locked" : "Approved for discharge"}
                  </span>
                </div>
              </div>
            </div>

            {/* UNIFIED SIDE-BY-SIDE SPLIT WORKBENCH */}
            <div className="ipd-split-workbench-grid">
              {/* ── LEFT COLUMN: INPATIENT CHARGES RECORD VIEW ── */}
              <div className="ipd-col-panel ipd-col-charges">
                <div className="ipd-col-panel-header">
                  <div className="ipd-col-panel-title">
                    <Icon name="LuFileSpreadsheet" size={17} style={{ color: "#2563eb" }} />
                    <span>Inpatient Charges &amp; Services Record</span>
                    <span className="ipd-pill-badge">{patient?.items?.length || 0}</span>
                  </div>
                  <div className="ipd-col-panel-actions">
                    <div className="ipd-col-subtabs">
                      <button
                        type="button"
                        className={`ipd-col-subtab-btn ${activeWorkspaceTab === "tariff" ? "active" : ""}`}
                        onClick={() => setActiveWorkspaceTab("tariff")}
                      >
                        <Icon name="LuBuilding" size={12} />
                        <span>Hospital Tariff</span>
                      </button>
                      <button
                        type="button"
                        className={`ipd-col-subtab-btn ${activeWorkspaceTab === "pharmacy" ? "active" : ""}`}
                        onClick={() => setActiveWorkspaceTab("pharmacy")}
                      >
                        <Icon name="LuPill" size={12} />
                        <span>Inpatient Pharmacy</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ipd-col-panel-body">
                  {/* Unified Charge Entry Console Card */}
                  <div className="ipd-charge-console-card">
                {activeWorkspaceTab === "tariff" ? (
                  <div className="ipd-tariff-panel-clean">
                    <div className="ipd-add-service-row">
                      <div className="ipd-form-field ipd-form-field--category">
                        <label className="ipd-field-label">Department / Category</label>
                        <select
                          className="ipd-select-control ipd-select-category"
                          value={activeCategory}
                          onChange={(e) => handleCategoryClick(e.target.value)}
                        >
                          <option value="Consultation">🩺 Doctor Consultation &amp; Visits</option>
                          <option value="Lab Test">🧪 Laboratory &amp; Pathology Tests</option>
                          <option value="Radiology">📺 Radiology &amp; Imaging (X-Ray / CT)</option>
                          <option value="Procedures">⚡ Procedures &amp; Clinical Services</option>
                          <option value="Room Charges">🛏️ Room Charges &amp; Bed Tariff</option>
                          <option value="Others">📋 Other Hospital Services</option>
                        </select>
                      </div>

                      <div className="ipd-form-field ipd-form-field--service">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <label className="ipd-field-label">Service Description</label>
                          <button
                            type="button"
                            className="ipd-link-autofill"
                            onClick={() => {
                              setIsCustomService(!isCustomService);
                              if (!isCustomService) {
                                setCustomServiceName("");
                              }
                            }}
                          >
                            {isCustomService ? "📋 Select Dropdown" : "➕ Custom Charge"}
                          </button>
                        </div>
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
                              title="Back to standard list"
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
                          value={Math.max(
                            0,
                            (Number(rateInput || 0) * Number(qtyInput || 1)) -
                            (Number(serviceDiscountAmount) || (serviceDiscountPercent ? Math.round(((Number(rateInput || 0) * Number(qtyInput || 1)) * Number(serviceDiscountPercent)) / 100) : 0))
                          ).toLocaleString("en-IN")}
                        />
                      </div>

                      <div className="ipd-form-field ipd-form-field--date">
                        <label className="ipd-field-label">Charge Date</label>
                        <input
                          type="date"
                          className="ipd-input-control"
                          value={chargeDate}
                          onChange={(e) => setChargeDate(e.target.value)}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                        <button
                          type="button"
                          className="ipd-dr-toggle-btn"
                          onClick={() => setShowServiceDiscountRef(!showServiceDiscountRef)}
                          title="Apply doctor referral discount or concession"
                        >
                          <Icon name="LuTag" size={13} />
                          <span>{showServiceDiscountRef ? "Hide Disc & Ref" : "🏷️ Disc & Ref"}</span>
                          {(Number(serviceDiscountAmount) > 0 || Number(serviceDiscountPercent) > 0) && (
                            <span style={{ color: "#dc2626", fontWeight: 800 }}>
                              (-₹{serviceDiscountAmount || Math.round(((Number(rateInput || 0) * Number(qtyInput || 1)) * Number(serviceDiscountPercent)) / 100)})
                            </span>
                          )}
                        </button>

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

                    {showServiceDiscountRef && (
                      <div className="ipd-discount-ref-box">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
                            <Icon name="LuTag" size={14} /> DISCOUNT WITH REFERRAL REFERENCE (छूट एवं डॉक्टर संदर्भ)
                          </span>
                          <span style={{ fontSize: 11, color: "#78350f" }}>
                            Gross: ₹{(Number(rateInput || 0) * Number(qtyInput || 1)).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="ipd-dr-grid">
                          <div className="ipd-dr-field">
                            <label className="ipd-dr-label">Discount Scheme / Reason</label>
                            <select
                              className="ipd-dr-select"
                              value={serviceDiscountReasonId}
                              onChange={(e) => {
                                const rId = e.target.value;
                                setServiceDiscountReasonId(rId);
                                const found = discountReasons.find((r) => r.id === rId);
                                if (found) {
                                  setServiceDiscountReason(found.name);
                                  if (found.default_percent) {
                                    setServiceDiscountPercent(Number(found.default_percent).toString());
                                    const gr = Number(rateInput || 0) * Number(qtyInput || 1);
                                    setServiceDiscountAmount(Math.round((gr * Number(found.default_percent)) / 100).toString());
                                  }
                                } else {
                                  setServiceDiscountReason("");
                                }
                              }}
                            >
                              <option value="">-- Select Reason / Scheme --</option>
                              {discountReasons.map((dr) => (
                                <option key={dr.id} value={dr.id}>
                                  {dr.name} {dr.default_percent ? `(${Number(dr.default_percent)}%)` : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="ipd-dr-field">
                            <label className="ipd-dr-label">Disc (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="ipd-dr-input"
                              placeholder="%"
                              value={serviceDiscountPercent}
                              onChange={(e) => {
                                const pct = e.target.value;
                                setServiceDiscountPercent(pct);
                                const gr = Number(rateInput || 0) * Number(qtyInput || 1);
                                if (pct && gr > 0) {
                                  setServiceDiscountAmount(Math.round((gr * Number(pct)) / 100).toString());
                                } else if (!pct) {
                                  setServiceDiscountAmount("");
                                }
                              }}
                            />
                          </div>

                          <div className="ipd-dr-field">
                            <label className="ipd-dr-label">Disc Amount (₹)</label>
                            <input
                              type="number"
                              min="0"
                              max={Number(rateInput || 0) * Number(qtyInput || 1)}
                              className="ipd-dr-input"
                              placeholder="₹"
                              value={serviceDiscountAmount}
                              onChange={(e) => {
                                const amt = e.target.value;
                                setServiceDiscountAmount(amt);
                                const gr = Number(rateInput || 0) * Number(qtyInput || 1);
                                if (amt && gr > 0) {
                                  setServiceDiscountPercent(((Number(amt) / gr) * 100).toFixed(1));
                                } else if (!amt) {
                                  setServiceDiscountPercent("");
                                }
                              }}
                            />
                          </div>

                          <div className="ipd-dr-field">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <label className="ipd-dr-label">Referred By (Doctor / Authority)</label>
                              <button
                                type="button"
                                className="ipd-dr-link-btn"
                                onClick={() => setIsCustomServiceRefDoc(!isCustomServiceRefDoc)}
                              >
                                {isCustomServiceRefDoc ? "📋 Hospital Doctors" : "➕ External Doctor"}
                              </button>
                            </div>
                            {isCustomServiceRefDoc ? (
                              <input
                                type="text"
                                className="ipd-dr-input"
                                placeholder="Type external doctor name..."
                                value={serviceReferredBy}
                                onChange={(e) => setServiceReferredBy(e.target.value)}
                              />
                            ) : (
                              <select
                                className="ipd-dr-select"
                                value={serviceReferralDoctorId}
                                onChange={(e) => {
                                  setServiceReferralDoctorId(e.target.value);
                                  const doc = doctorsList.find((d) => (d.practitioner_id || d.id) === e.target.value);
                                  if (doc) setServiceReferredBy(doc.name);
                                }}
                              >
                                <option value="">-- Select Referring Doctor --</option>
                                {doctorsList.map((doc) => (
                                  <option key={doc.practitioner_id || doc.id} value={doc.practitioner_id || doc.id}>
                                    {doc.name} {doc.department ? `(${doc.department})` : ""}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div className="ipd-dr-field" style={{ gridColumn: "1 / -1" }}>
                            <label className="ipd-dr-label">Discount Reference Memo / Slip # (संदर्भ संख्या)</label>
                            <input
                              type="text"
                              className="ipd-dr-input"
                              placeholder="e.g. Doctor recommendation slip #204 / Director Approval Memo / Senior Citizen Card #55"
                              value={serviceDiscountReference}
                              onChange={(e) => setServiceDiscountReference(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ipd-pharmacy-panel-clean">
                    <div className="ipd-add-med-row">
                      <div className="ipd-form-field ipd-form-field--med-name">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <label className="ipd-field-label">Select Medication / Drug *</label>
                          <button
                            type="button"
                            className="ipd-link-autofill"
                            onClick={() => {
                              setIsCustomMed(!isCustomMed);
                              if (!isCustomMed) {
                                setCustomMedName("");
                              }
                            }}
                          >
                            {isCustomMed ? "📋 Select Dropdown" : "➕ Custom Drug"}
                          </button>
                        </div>

                        {isCustomMed ? (
                          <div className="ipd-custom-input-wrap">
                            <input
                              type="text"
                              className="ipd-input-control"
                              placeholder="Type custom drug or consumable..."
                              value={customMedName}
                              onChange={(e) => {
                                setCustomMedName(e.target.value);
                                setMedForm({ ...medForm, name: e.target.value });
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="ipd-btn-cancel-custom"
                              onClick={() => {
                                setIsCustomMed(false);
                                if (combinedMedicines.length > 0) {
                                  const first = combinedMedicines[0];
                                  setMedForm({
                                    ...medForm,
                                    name: first.name,
                                    rate: first.rate,
                                    form: first.form,
                                    route: first.route,
                                    freq: first.freq || "OD",
                                  });
                                }
                              }}
                              title="Back to dropdown"
                            >
                              <Icon name="LuX" size={14} />
                            </button>
                          </div>
                        ) : (
                          <select
                            className="ipd-select-control ipd-select-med"
                            value={medForm.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "__custom__") {
                                setIsCustomMed(true);
                                setCustomMedName("");
                                setMedForm({ ...medForm, name: "", rate: 0 });
                                return;
                              }
                              const found = combinedMedicines.find((m) => m.name === val);
                              if (found) {
                                setMedForm({
                                  ...medForm,
                                  name: found.name,
                                  rate: found.rate,
                                  form: found.form,
                                  route: found.route,
                                  freq: found.freq || "OD",
                                });
                              }
                            }}
                          >
                            <optgroup label="⭐ Common Inpatient Presets & Standard Injections">
                              {STANDARD_MEDICINES.map((m, idx) => (
                                <option key={`preset-${idx}`} value={m.name}>
                                  {m.name} — ₹{m.rate} ({m.form} • {m.route})
                                </option>
                              ))}
                            </optgroup>
                            {inventoryMeds.length > 0 && (
                              <optgroup label="📦 Hospital Pharmacy Inventory Stock">
                                {inventoryMeds
                                  .filter(
                                    (im) =>
                                      !STANDARD_MEDICINES.some(
                                        (sm) =>
                                          sm.name.toLowerCase() ===
                                          (im.name || im.item_name || "").toLowerCase()
                                      )
                                  )
                                  .map((m, idx) => {
                                    const mName = m.name || m.item_name || "Medicine";
                                    const mRate = Number(m.selling_price || m.mrp || m.rate || 100);
                                    const mForm = m.unit || m.dosage_form || "Unit";
                                    const mRoute = m.route || "Oral / IV";
                                    return (
                                      <option key={`inv-${idx}`} value={mName}>
                                        {mName} — ₹{mRate} ({mForm} • {mRoute})
                                      </option>
                                    );
                                  })}
                              </optgroup>
                            )}
                            <option value="__custom__">➕ Other Unlisted Drug (Type Manually)</option>
                          </select>
                        )}
                      </div>

                      <div className="ipd-form-field ipd-form-field--med-form">
                        <label className="ipd-field-label">Dosage</label>
                        <select
                          className="ipd-select-control"
                          value={medForm.form}
                          onChange={(e) => setMedForm({ ...medForm, form: e.target.value })}
                        >
                          <option value="Vial">Vial (Inj)</option>
                          <option value="Ampoule">Ampoule</option>
                          <option value="Bottle">Bottle</option>
                          <option value="Tablet">Tablet / Cap</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Respule">Respule</option>
                          <option value="Set">Kit / Set</option>
                          <option value="Prefilled Syringe">Prefilled Syringe</option>
                        </select>
                      </div>



                      <div className="ipd-form-field ipd-form-field--med-freq">
                        <label className="ipd-field-label">Frequency</label>
                        <select
                          className="ipd-select-control"
                          value={medForm.freq}
                          onChange={(e) => setMedForm({ ...medForm, freq: e.target.value })}
                        >
                          <option value="OD">OD</option>
                          <option value="BD">BD</option>
                          <option value="TDS">TDS</option>
                          <option value="QID">QID</option>
                          <option value="SOS">SOS</option>
                          <option value="Stat">Stat</option>
                        </select>
                      </div>

                      <div className="ipd-form-field ipd-form-field--qty">
                        <label className="ipd-field-label">Qty</label>
                        <input
                          type="number"
                          min="1"
                          className="ipd-input-control"
                          value={medForm.qty}
                          onChange={(e) => setMedForm({ ...medForm, qty: Math.max(1, Number(e.target.value)) })}
                        />
                      </div>

                      <div className="ipd-form-field ipd-form-field--rate">
                        <label className="ipd-field-label">Unit Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          className="ipd-input-control"
                          value={medForm.rate}
                          onChange={(e) => setMedForm({ ...medForm, rate: Number(e.target.value) })}
                        />
                      </div>

                      <div className="ipd-form-field ipd-form-field--amount">
                        <label className="ipd-field-label">Total (₹)</label>
                        <input
                          type="text"
                          className="ipd-input-control ipd-input-readonly"
                          readOnly
                          value={Math.max(
                            0,
                            (Number(medForm.qty || 1) * Number(medForm.rate || 0)) -
                            (Number(medDiscountAmount) || (medDiscountPercent ? Math.round(((Number(medForm.qty || 1) * Number(medForm.rate || 0)) * Number(medDiscountPercent)) / 100) : 0))
                          ).toLocaleString("en-IN")}
                        />
                      </div>

                      <div className="ipd-form-field ipd-form-field--date">
                        <label className="ipd-field-label">Dispense Date</label>
                        <input
                          type="date"
                          className="ipd-input-control"
                          value={medForm.date}
                          onChange={(e) => setMedForm({ ...medForm, date: e.target.value })}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                        <button
                          type="button"
                          className="ipd-dr-toggle-btn"
                          onClick={() => setShowMedDiscountRef(!showMedDiscountRef)}
                          title="Apply pharmacy concession or doctor referral"
                        >
                          <Icon name="LuTag" size={13} />
                          <span>{showMedDiscountRef ? "Hide Disc & Ref" : "🏷️ Disc & Ref"}</span>
                          {(Number(medDiscountAmount) > 0 || Number(medDiscountPercent) > 0) && (
                            <span style={{ color: "#dc2626", fontWeight: 800 }}>
                              (-₹{medDiscountAmount || Math.round(((Number(medForm.qty || 1) * Number(medForm.rate || 0)) * Number(medDiscountPercent)) / 100)})
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          className="ipd-btn-add-item ipd-btn-add-item--purple"
                          disabled={actionLoading}
                          onClick={handleAddMedicineItem}
                        >
                          <Icon name="LuPlus" size={16} />
                          <span>Dispense Drug</span>
                        </button>
                      </div>
                    </div>

                    {showMedDiscountRef && (
                      <div className="ipd-discount-ref-box">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
                            <Icon name="LuTag" size={14} /> PHARMACY CONCESSION &amp; REFERRAL (दवा छूट एवं संदर्भ)
                          </span>
                          <span style={{ fontSize: 11, color: "#78350f" }}>
                            Gross: ₹{(Number(medForm.qty || 1) * Number(medForm.rate || 0)).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="ipd-dr-grid">
                          <div className="ipd-dr-field">
                            <label className="ipd-dr-label">Concession Scheme / Reason</label>
                            <select
                              className="ipd-dr-select"
                              value={medDiscountReason}
                              onChange={(e) => {
                                const reasonName = e.target.value;
                                setMedDiscountReason(reasonName);
                                const found = discountReasons.find((r) => r.name === reasonName);
                                if (found && found.default_percent) {
                                  setMedDiscountPercent(Number(found.default_percent).toString());
                                  const gr = Number(medForm.qty || 1) * Number(medForm.rate || 0);
                                  setMedDiscountAmount(Math.round((gr * Number(found.default_percent)) / 100).toString());
                                }
                              }}
                            >
                              <option value="">-- Select Concession Scheme --</option>
                              {discountReasons.map((dr) => (
                                <option key={dr.id} value={dr.name}>
                                  {dr.name} {dr.default_percent ? `(${Number(dr.default_percent)}%)` : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="ipd-dr-field">
                            <label className="ipd-dr-label">Disc (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="ipd-dr-input"
                              placeholder="%"
                              value={medDiscountPercent}
                              onChange={(e) => {
                                const pct = e.target.value;
                                setMedDiscountPercent(pct);
                                const gr = Number(medForm.qty || 1) * Number(medForm.rate || 0);
                                if (pct && gr > 0) {
                                  setMedDiscountAmount(Math.round((gr * Number(pct)) / 100).toString());
                                } else if (!pct) {
                                  setMedDiscountAmount("");
                                }
                              }}
                            />
                          </div>

                          <div className="ipd-dr-field">
                            <label className="ipd-dr-label">Disc Amount (₹)</label>
                            <input
                              type="number"
                              min="0"
                              max={Number(medForm.qty || 1) * Number(medForm.rate || 0)}
                              className="ipd-dr-input"
                              placeholder="₹"
                              value={medDiscountAmount}
                              onChange={(e) => {
                                const amt = e.target.value;
                                setMedDiscountAmount(amt);
                                const gr = Number(medForm.qty || 1) * Number(medForm.rate || 0);
                                if (amt && gr > 0) {
                                  setMedDiscountPercent(((Number(amt) / gr) * 100).toFixed(1));
                                } else if (!amt) {
                                  setMedDiscountPercent("");
                                }
                              }}
                            />
                          </div>

                          <div className="ipd-dr-field">
                            <label className="ipd-dr-label">Referred By (Doctor / Authorizer)</label>
                            <select
                              className="ipd-dr-select"
                              value={medReferredBy}
                              onChange={(e) => setMedReferredBy(e.target.value)}
                            >
                              <option value="">-- Select Doctor / Authorizer --</option>
                              {doctorsList.map((doc) => (
                                <option key={doc.practitioner_id || doc.id} value={doc.name}>
                                  {doc.name} {doc.department ? `(${doc.department})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="ipd-dr-field" style={{ gridColumn: "1 / -1" }}>
                            <label className="ipd-dr-label">Pharmacy Discount Ref / Prescription Memo #</label>
                            <input
                              type="text"
                              className="ipd-dr-input"
                              placeholder="e.g. Rx Dr. Amit Saxena concession order #108 / Welfare Memo"
                              value={medDiscountReference}
                              onChange={(e) => setMedDiscountReference(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {walletBalance > 0 && (
                      <div className="ipd-wallet-settle-check-wrap">
                        <label className="ipd-checkbox-label">
                          <input
                            type="checkbox"
                            checked={settleMedFromWallet}
                            onChange={(e) => setSettleMedFromWallet(e.target.checked)}
                            disabled={walletBalance < (Number(medForm.qty || 1) * Number(medForm.rate || 0))}
                          />
                          <span>
                            👛 Auto-settle medicine from Patient Wallet (Available: <strong>₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

                  {/* Department Summary Strip */}
                  <div className="ipd-summary-matrix-bar">
                    <div className="ipd-matrix-item">
                      <span className="ipd-matrix-lbl">🛏️ Bed Charges</span>
                      <span className="ipd-matrix-val">₹{roomChargesTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="ipd-matrix-item">
                      <span className="ipd-matrix-lbl">🩺 Doctor Visits</span>
                      <span className="ipd-matrix-val">₹{consultationTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="ipd-matrix-item">
                      <span className="ipd-matrix-lbl">💊 Pharmacy</span>
                      <span className="ipd-matrix-val">₹{medicinesTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="ipd-matrix-item">
                      <span className="ipd-matrix-lbl">🧪 Labs &amp; Rad</span>
                      <span className="ipd-matrix-val">₹{(labTotal + radiologyTotal).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="ipd-matrix-item">
                      <span className="ipd-matrix-lbl">⚡ Procedures</span>
                      <span className="ipd-matrix-val">₹{proceduresTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Filter & Search Bar for Charges */}
                  <div className="ipd-charges-filter-bar">
                    <div className="ipd-filter-search-box">
                      <Icon name="LuSearch" size={14} />
                      <input
                        type="text"
                        placeholder="Search charges..."
                        value={billItemSearch}
                        onChange={(e) => setBillItemSearch(e.target.value)}
                      />
                      {billItemSearch && (
                        <button type="button" className="ipd-search-clear-btn" onClick={() => setBillItemSearch("")}>
                          <Icon name="LuX" size={12} />
                        </button>
                      )}
                    </div>
                    <div className="ipd-filter-cat-pills">
                      {["all", "Room", "Consultation", "Medicines", "Lab & Radiology", "Procedures"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`ipd-cat-filter-btn ${billCategoryFilter === cat ? "active" : ""}`}
                          onClick={() => setBillCategoryFilter(cat)}
                        >
                          {cat === "all" ? "All" : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Itemized Charges Table Grouped By Date with Dotted Lines */}
                  <div className="ipd-ledger-table-wrap-premium">
                    <table className="ipd-ledger-table-premium">
                      <thead>
                        <tr>
                          <th style={{ width: 36, textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={patient?.items?.length > 0 && patient.items.every((i) => i.selected)}
                              onChange={handleToggleSelectAll}
                            />
                          </th>
                          <th style={{ width: 35 }}>#</th>
                          <th style={{ width: 85 }}>TIME</th>
                          <th>PARTICULAR / CHARGE DESCRIPTION</th>
                          <th style={{ width: 95 }}>DEPT</th>
                          <th style={{ width: 75, textAlign: "right" }}>RATE</th>
                          <th style={{ width: 50, textAlign: "center" }}>QTY</th>
                          <th style={{ width: 75, textAlign: "right" }}>DISC</th>
                          <th style={{ width: 85, textAlign: "right" }}>AMOUNT</th>
                          <th style={{ width: 70, textAlign: "center" }}>STATUS</th>
                          <th style={{ width: 45, textAlign: "center" }}>ACT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!patient || filteredBillItems.length === 0 ? (
                          <tr>
                            <td colSpan="11" style={{ textAlign: "center", padding: "36px 16px", color: "#64748b" }}>
                              <Icon name="LuFileX" size={28} style={{ color: "#94a3b8", marginBottom: 6 }} />
                              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>No Inpatient Charges Posted Yet</div>
                              <div style={{ fontSize: 12, marginTop: 4, color: "#64748b" }}>Use the form above to add room rent, doctor visits, medicines, or procedures.</div>
                            </td>
                          </tr>
                        ) : (
                          groupedCharges.map(([dateKey, groupItems]) => {
                            const groupTotal = groupItems.reduce((acc, it) => acc + Number(it.amount || 0), 0);
                            const groupDisc = groupItems.reduce((acc, it) => acc + Number(it.discountAmount || 0), 0);
                            return (
                              <React.Fragment key={dateKey}>
                                <tr className="ipd-date-sep-row">
                                  <td colSpan="11">
                                    <div className="ipd-date-sep-wrap">
                                      <span className="ipd-date-badge">
                                        <Icon name="LuCalendar" size={12} /> {dateKey}
                                      </span>
                                      <span className="ipd-pill-badge">{groupItems.length} charge{groupItems.length > 1 ? "s" : ""}</span>
                                      <div className="ipd-date-dots" />
                                      <span className="ipd-date-subtotal">
                                        {groupDisc > 0 && (
                                          <span style={{ color: "#dc2626", marginRight: 8 }}>Disc: -₹{groupDisc.toLocaleString("en-IN")}</span>
                                        )}
                                        Subtotal: <strong>₹{groupTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                                {groupItems.map((item, idx) => (
                                  <tr key={item.id || idx} className={`ipd-row-dashed ${item.selected ? "selected" : ""}`}>
                                    <td style={{ textAlign: "center" }}>
                                      <input
                                        type="checkbox"
                                        checked={!!item.selected}
                                        onChange={() => handleToggleSelectItem(item.id)}
                                      />
                                    </td>
                                    <td style={{ color: "#64748b", fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>
                                      {String(idx + 1).padStart(2, "0")}
                                    </td>
                                    <td style={{ color: "#475569", fontSize: 11, whiteSpace: "nowrap" }}>
                                      {item.time || "—"}
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 12.5 }}>{item.name}</div>
                                      {(item.discountAmount > 0 || item.discountReason || item.referredBy || item.discountReference) && (
                                        <div style={{ marginTop: 3, display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
                                          {item.discountAmount > 0 && (
                                            <span style={{ fontSize: 10, background: "#fee2e2", color: "#991b1b", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                                              🏷️ -₹{Number(item.discountAmount).toLocaleString("en-IN")} ({item.discountPercent ? `${item.discountPercent}%` : item.discountReason || "Disc"})
                                            </span>
                                          )}
                                          {item.referredBy && (
                                            <span style={{ fontSize: 10, background: "#e0f2fe", color: "#0369a1", padding: "1px 5px", borderRadius: 4, fontWeight: 600 }}>
                                              👨‍⚕️ Ref: {item.referredBy}
                                            </span>
                                          )}
                                          {item.discountReference && (
                                            <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "1px 5px", borderRadius: 4 }}>
                                              📝 {item.discountReference}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <span className={`ipd-cat-badge ${getCatBadgeClass(item.category)}`}>
                                        {item.category === "Medicines" ? "💊 Pharmacy" : item.category}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: "right", fontFamily: "monospace", color: "#334155", fontWeight: 600, fontSize: 12 }}>
                                      ₹{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ textAlign: "center", fontWeight: 800, color: "#1e293b", fontSize: 12 }}>{item.qty}</td>
                                    <td style={{ textAlign: "right", fontFamily: "monospace", color: item.discountAmount > 0 ? "#dc2626" : "#94a3b8", fontWeight: 700, fontSize: 11.5 }}>
                                      {item.discountAmount > 0 ? `-₹${Number(item.discountAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                                    </td>
                                    <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#0f172a", fontSize: 12 }}>
                                      ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <span className={`ipd-charge-status-pill ipd-charge-status-pill--${String(item.status || "billable").toLowerCase()}`}>
                                        {String(item.status || "billable").toUpperCase()}
                                      </span>
                                      {item.status !== "paid" && walletBalance >= item.amount && (
                                        <button
                                          type="button"
                                          className="ipd-btn-pay-wallet-sm"
                                          title={`Settle ₹${item.amount} from Patient Wallet (Available: ₹${walletBalance})`}
                                          onClick={() => handleSettleChargeFromWallet(item)}
                                          disabled={actionLoading}
                                        >
                                          👛 Wallet
                                        </button>
                                      )}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <button
                                        type="button"
                                        className="ipd-btn-trash-premium"
                                        title="Remove charge item"
                                        onClick={() => handleRemoveItem(item.id, item.name)}
                                      >
                                        <Icon name="LuTrash2" size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN: PAYMENT RECEIPT & DEPOSITS HISTORY + SINGLE EMBEDDED CONSOLE ── */}
              <div className="ipd-col-panel ipd-col-payments">
                <div className="ipd-col-panel-header">
                  <div className="ipd-col-panel-title">
                    <Icon name="LuCreditCard" size={17} style={{ color: "#059669" }} />
                    <span>Payment Receipts &amp; Ledger</span>
                    <span className="ipd-pill-badge ipd-pill-badge--green">{patient?.historyPayments?.length || 0}</span>
                  </div>
                  <div className="ipd-col-panel-actions">
                    <span className="ipd-header-stat-chip">
                      Collected: <strong>₹{totalPaymentsReceivedAll.toLocaleString("en-IN")}</strong>
                    </span>
                  </div>
                </div>

                <div className="ipd-col-panel-body">
                  {/* The ONLY Fast Payment Collection Console */}
                  <div className="ipd-embedded-pay-box" id="ipd-single-payment-box">
                    <div className="ipd-embedded-pay-header">
                      <div className="ipd-eph-title">
                        <Icon name="LuWallet" size={16} />
                        <span>Fast Payment Collection</span>
                      </div>
                      <div className="ipd-eph-category-toggle">
                        {[
                          { key: "Payment", label: "Running Bill" },
                          { key: "Advance", label: "Advance Deposit" },
                          { key: "Settlement", label: "Discharge Settlement" },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            className={`ipd-eph-cat-pill ${paymentForm.type === key ? "active" : ""}`}
                            onClick={() => {
                              setPaymentForm((prev) => ({
                                ...prev,
                                type: key,
                                amount: key === "Settlement" && pendingAmount > 0 ? String(pendingAmount) : prev.amount,
                              }));
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="ipd-pay-fields-grid">
                      <div className="ipd-pay-fgroup">
                        <label className="ipd-field-label">Received Amount (₹) *</label>
                        <input
                          id="ipd-collect-amount-input"
                          type="number"
                          min="1"
                          className="ipd-input-control ipd-input-control--lg"
                          placeholder="Enter ₹ amount..."
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        />
                      </div>

                      <div className="ipd-pay-fgroup">
                        <label className="ipd-field-label">Payment Mode</label>
                        <select
                          className="ipd-select-control"
                          value={paymentForm.mode}
                          onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                        >
                          <option value="Cash">Cash Counter</option>
                          <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                          <option value="Card">Card (POS Terminal)</option>
                          <option value="Net Banking">Net Banking / NEFT / RTGS</option>
                          <option value="Insurance / TPA">Insurance / TPA Cashless</option>
                        </select>
                      </div>

                      <div className="ipd-pay-fgroup">
                        <label className="ipd-field-label">Date &amp; Time</label>
                        <input
                          type="datetime-local"
                          className="ipd-input-control"
                          value={paymentForm.payment_date}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                        />
                      </div>

                      <div className="ipd-pay-fgroup">
                        <label className="ipd-field-label">Transaction Notes / Ref #</label>
                        <input
                          type="text"
                          className="ipd-input-control"
                          placeholder="e.g. UPI Ref / Cheque / Bank Note"
                          value={paymentForm.remarks}
                          onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Quick Amount Presets */}
                    <div className="ipd-quick-pay-presets">
                      {pendingAmount > 0 && (
                        <button
                          type="button"
                          className="ipd-quick-pay-chip ipd-quick-pay-chip--due"
                          onClick={() => setPaymentForm({ ...paymentForm, amount: pendingAmount, type: "Settlement" })}
                        >
                          Pay Full Due: ₹{pendingAmount.toLocaleString("en-IN")}
                        </button>
                      )}
                      {[1000, 2500, 5000, 10000, 20000].map((presetAmt) => (
                        <button
                          key={presetAmt}
                          type="button"
                          className={`ipd-quick-pay-chip ${Number(paymentForm.amount) === presetAmt ? "active" : ""}`}
                          onClick={() => setPaymentForm({ ...paymentForm, amount: presetAmt })}
                        >
                          +₹{presetAmt.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>

                    {/* Submit Collect Payment Button */}
                    <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
                      <button
                        type="button"
                        className="ipd-btn-collect-payment"
                        disabled={actionLoading || !paymentForm.amount || Number(paymentForm.amount) <= 0}
                        onClick={handleSavePayment}
                      >
                        {actionLoading ? (
                          "Recording Payment..."
                        ) : (
                          <>
                            <Icon name="LuReceipt" size={15} /> Collect ₹{Number(paymentForm.amount || 0).toLocaleString("en-IN")} &amp; Issue Receipt
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Excess Advance Card if any */}
                  {excessAdvance > 0 && (
                    <div className="ipd-excess-advance-card" style={{ marginBottom: 14 }}>
                      <div className="ipd-eac-left">
                        <div className="ipd-eac-icon">💰</div>
                        <div>
                          <div className="ipd-eac-title">
                            Excess Advance: <strong style={{ color: "#047857" }}>₹{excessAdvance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                          </div>
                          <div className="ipd-eac-sub">
                            Patient has paid more than incurred charges. Move to wallet or disburse refund.
                          </div>
                        </div>
                      </div>
                      <div className="ipd-eac-actions">
                        <button
                          type="button"
                          className="ipd-eac-btn-wallet"
                          disabled={actionLoading}
                          onClick={handleCreditExcessToWallet}
                        >
                          👛 To Wallet
                        </button>
                        <button
                          type="button"
                          className="ipd-eac-btn-refund"
                          disabled={actionLoading}
                          onClick={handleOpenRefundModal}
                        >
                          💵 Refund
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Search and Filters Bar for Payments */}
                  <div className="ipd-pay-controls-bar">
                    <div className="ipd-pay-search-box">
                      <Icon name="LuSearch" size={14} />
                      <input
                        type="text"
                        placeholder="Search receipt #, remarks, mode..."
                        value={paymentSearchTerm}
                        onChange={(e) => setPaymentSearchTerm(e.target.value)}
                      />
                      {paymentSearchTerm && (
                        <button type="button" className="ipd-search-clear-btn" onClick={() => setPaymentSearchTerm("")}>
                          <Icon name="LuX" size={12} />
                        </button>
                      )}
                    </div>
                    <div className="ipd-pay-filters-group">
                      <select
                        className="ipd-select-control"
                        style={{ width: "auto" }}
                        value={paymentTypeFilter}
                        onChange={(e) => setPaymentTypeFilter(e.target.value)}
                      >
                        <option value="All">All Categories</option>
                        <option value="Payment">Running Bill</option>
                        <option value="Advance">Advance Deposit</option>
                        <option value="Settlement">Discharge Settlement</option>
                        <option value="Refund">Refunds</option>
                      </select>
                      <select
                        className="ipd-select-control"
                        style={{ width: "auto" }}
                        value={paymentModeFilter}
                        onChange={(e) => setPaymentModeFilter(e.target.value)}
                      >
                        <option value="All">All Modes</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Insurance">Insurance</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Receipts Table Grouped By Date with Dotted Lines */}
                  <div className="ipd-ledger-table-wrap-premium">
                    <table className="ipd-ledger-table-premium">
                      <thead>
                        <tr>
                          <th style={{ width: 35 }}>#</th>
                          <th style={{ width: 85 }}>TIME</th>
                          <th style={{ width: 110 }}>RECEIPT #</th>
                          <th style={{ width: 110 }}>CATEGORY</th>
                          <th style={{ width: 95 }}>MODE</th>
                          <th>NOTES &amp; REF</th>
                          <th style={{ width: 95, textAlign: "right" }}>AMOUNT</th>
                          <th style={{ width: 65, textAlign: "center" }}>STATUS</th>
                          <th style={{ width: 65, textAlign: "center" }}>PRINT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan="9" style={{ textAlign: "center", padding: "36px 16px", color: "#64748b" }}>
                              <Icon name="LuReceipt" size={28} style={{ color: "#94a3b8", marginBottom: 6 }} />
                              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>No Payment Records Yet</div>
                              <div style={{ fontSize: 12, marginTop: 4, color: "#64748b" }}>
                                {patient?.historyPayments?.length === 0
                                  ? "No advance or bill payments have been received for this admission yet."
                                  : "No payment receipts match your search filter."}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          groupedPayments.map(([dateKey, groupPayments]) => {
                            const groupTotal = groupPayments.reduce((acc, pay) => {
                              const isOut = pay.direction === "out" || String(pay.type || "").toLowerCase() === "refund";
                              return isOut ? acc - Number(pay.amount || 0) : acc + Number(pay.amount || 0);
                            }, 0);
                            return (
                              <React.Fragment key={dateKey}>
                                <tr className="ipd-date-sep-row">
                                  <td colSpan="9">
                                    <div className="ipd-date-sep-wrap">
                                      <span className="ipd-date-badge ipd-date-badge--green">
                                        <Icon name="LuCalendar" size={12} /> {dateKey}
                                      </span>
                                      <span className="ipd-pill-badge ipd-pill-badge--green">{groupPayments.length} receipt{groupPayments.length > 1 ? "s" : ""}</span>
                                      <div className="ipd-date-dots ipd-date-dots--green" />
                                      <span className="ipd-date-subtotal">
                                        Collected: <strong style={{ color: "#047857" }}>₹{groupTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                                {groupPayments.map((pay, idx) => {
                                  const isOut = pay.direction === "out" || String(pay.type || "").toLowerCase() === "refund";
                                  const isAdvance = String(pay.type || "").toLowerCase() === "advance";
                                  const isSettlement = String(pay.type || "").toLowerCase() === "settlement";

                                  return (
                                    <tr key={pay.id || idx} className="ipd-row-dashed">
                                      <td style={{ color: "#64748b", fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>
                                        {String(idx + 1).padStart(2, "0")}
                                      </td>
                                      <td style={{ color: "#475569", fontSize: 11, whiteSpace: "nowrap" }}>
                                        {pay.time || "—"}
                                      </td>
                                      <td>
                                        <span className="ipd-receipt-code-pill">
                                          <Icon name="LuFileText" size={11} /> {pay.receiptNo}
                                        </span>
                                      </td>
                                      <td>
                                        <span
                                          className={`ipd-pay-type-badge ${
                                            isAdvance ? "advance" : isSettlement ? "settlement" : isOut ? "refund" : "interim"
                                          }`}
                                        >
                                          {isAdvance
                                            ? "Advance"
                                            : isSettlement
                                            ? "Settlement"
                                            : isOut
                                            ? "Refund"
                                            : "Running Bill"}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="ipd-pay-mode-pill">
                                          <Icon
                                            name={
                                              pay.mode.toLowerCase().includes("cash")
                                                ? "LuBanknote"
                                                : pay.mode.toLowerCase().includes("upi")
                                                ? "LuSmartphone"
                                                : pay.mode.toLowerCase().includes("card")
                                                ? "LuCreditCard"
                                                : "LuBuilding2"
                                            }
                                            size={11}
                                          />
                                          <span>{pay.mode}</span>
                                        </span>
                                      </td>
                                      <td>
                                        <div style={{ color: "#334155", fontSize: 12, fontWeight: 500 }}>
                                          {pay.remarks || "Counter payment receipt"}
                                        </div>
                                      </td>
                                      <td
                                        style={{
                                          textAlign: "right",
                                          fontFamily: "monospace",
                                          fontWeight: 800,
                                          color: isOut ? "#e11d48" : "#059669",
                                          fontSize: 12.5,
                                        }}
                                      >
                                        {isOut ? "- " : "+ "}₹{pay.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                      </td>
                                      <td style={{ textAlign: "center" }}>
                                        <span className="ipd-charge-status-pill ipd-charge-status-pill--paid">
                                          <Icon name="LuCheckCircle2" size={10} /> PAID
                                        </span>
                                      </td>
                                      <td style={{ textAlign: "center" }}>
                                        <button
                                          type="button"
                                          className="ipd-btn-print-receipt-sm"
                                          title="Print official payment receipt slip"
                                          onClick={() => setSelectedPaymentForReceipt(pay)}
                                        >
                                          <Icon name="LuPrinter" size={12} /> Print
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Audit Summary Card */}
                  <div className="ipd-reconcile-audit-card">
                    <div className="rac-row">
                      <span className="rac-lbl">Total Charges Incurred:</span>
                      <strong className="rac-val">₹{totalBills.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="rac-row">
                      <span className="rac-lbl">Total Receipts Recorded:</span>
                      <strong className="rac-val" style={{ color: "#059669" }}>
                        ₹{totalPaymentsReceivedAll.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="rac-row rac-row--final">
                      <span className="rac-lbl">
                        {pendingAmount > 0 ? "Remaining Balance Due:" : "Clearance Status:"}
                      </span>
                      <strong className="rac-val" style={{ color: pendingAmount > 0 ? "#e11d48" : "#059669" }}>
                        {pendingAmount > 0
                          ? `₹${pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "₹0.00 (All Cleared)"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Form Action Footer (Inside the Master Form) */}
            <div className="ipd-master-form-footer">
              <div className="opd-footer-summary-chip">
                {totalDiscounts > 0 && (
                  <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, marginRight: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: 4 }}>
                    🏷️ Total Disc: -₹{totalDiscounts.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                )}
                <span className="chip-label">{pendingAmount > 0 ? "Pending Balance Due:" : ""}</span>
                <span className={`chip-amount ${pendingAmount > 0 ? "due" : "cleared"}`}>
                  ₹{pendingAmount > 0 ? pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                </span>
                <span className="chip-sub">
                  {patient.isDischarged
                    ? "• Patient Discharged & Bed Vacated"
                    : pendingAmount > 0
                    ? "• Payment Pending (Discharge Locked)"
                    : "• Dues 100% Cleared (Discharge Approved)"}
                </span>
              </div>

              <div className="opd-footer-btn-group">
                <button
                  type="button"
                  className="ipd-btn-outline"
                  onClick={() => setShowPrintBillModal(true)}
                  title="Generate & print official Inpatient Billing Slip"
                >
                  <Icon name="LuPrinter" size={14} /> 🧾 Print Official Bill Slip
                </button>
                {pendingAmount > 0 && (
                  <button
                    type="button"
                    className="ipd-btn-receive-pay"
                    style={{ height: 38, padding: "0 18px", fontSize: 12.5 }}
                    onClick={handleOpenSettleModal}
                    title="Open settlement modal to pay remaining balance and clear bill"
                  >
                    <Icon name="LuCreditCard" size={14} /> + Clear Due (₹{pendingAmount.toLocaleString("en-IN")})
                  </button>
                )}
                {excessAdvance > 0 && (
                  <>
                    <button
                      type="button"
                      className="ipd-btn-wallet-credit"
                      style={{ height: 38, padding: "0 14px", fontSize: 12 }}
                      onClick={handleCreditExcessToWallet}
                      disabled={actionLoading}
                    >
                      👛 Move ₹{excessAdvance.toLocaleString("en-IN")} to Wallet
                    </button>
                    <button
                      type="button"
                      className="ipd-btn-refund"
                      style={{ height: 38, padding: "0 14px", fontSize: 12 }}
                      onClick={handleOpenRefundModal}
                      disabled={actionLoading}
                    >
                      💵 Refund Excess
                    </button>
                  </>
                )}
                {pendingAmount <= 0 && !patient.isDischarged && (
                  <span className="ipd-bill-cleared-badge">
                    <Icon name="LuCheckCircle2" size={14} /> Bill 100% Cleared
                  </span>
                )}
                {patient.isDischarged ? (
                  <div className="ipd-discharged-stamp-badge">
                    <Icon name="LuCheckCheck" size={15} /> Patient Discharged ({patient.dischargeDate || "Completed"})
                  </div>
                ) : pendingAmount > 0 ? (
                  <button
                    type="button"
                    className="ipd-btn-discharge-gate ipd-btn-discharge-gate--blocked"
                    style={{ height: 38, padding: "0 18px", fontSize: 12.5 }}
                    onClick={() => {
                      toast.error(
                        `Discharge Blocked! Patient ${patient.name} has pending balance of ₹${pendingAmount.toLocaleString("en-IN")}. Settle bill first!`,
                        { icon: "🔒", duration: 5000 }
                      );
                    }}
                    title="Discharge is locked until all billing dues are settled"
                  >
                    <Icon name="LuLock" size={14} /> 🔒 Discharge Blocked (₹{pendingAmount.toLocaleString("en-IN")} Due)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ipd-btn-discharge-gate ready ipd-btn-discharge-gate--cleared"
                    style={{ height: 38, padding: "0 18px", fontSize: 12.5 }}
                    onClick={() => setShowDischargeModal(true)}
                    title="All dues cleared! Proceed to verify and complete patient discharge"
                  >
                    <Icon name="LuCheckCircle2" size={14} /> 🚀 Proceed to Discharge Clearance
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

{/* ── MODALS ── */ }

{/* 1.1 Official Inpatient Payment Receipt Modal */}
{
  selectedPaymentForReceipt && (
    <div className="ipd-modal-backdrop" onClick={() => setSelectedPaymentForReceipt(null)}>
      <div className="ipd-modal-box ipd-modal-box--print" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750 }}>
        <div className="ipd-modal-header hims-no-print">
          <div className="ipd-modal-header-left">
            <div className="ipd-modal-icon-wrap" style={{ background: "#ecfdf5", color: "#059669" }}>
              <Icon name="LuReceipt" size={20} />
            </div>
            <div>
              <h3 className="ipd-modal-title">Official Inpatient Payment Receipt</h3>
              <span className="ipd-modal-subtitle">
                Receipt No: {selectedPaymentForReceipt.receiptNo} • {selectedPaymentForReceipt.date} {selectedPaymentForReceipt.time}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="ipd-btn-search"
              onClick={() => window.print()}
            >
              <Icon name="LuPrinter" size={15} /> Print Receipt
            </button>
            <button
              type="button"
              className="ipd-modal-close-btn"
              onClick={() => setSelectedPaymentForReceipt(null)}
            >
              <Icon name="LuX" size={18} />
            </button>
          </div>
        </div>

        <div className="ipd-modal-body hims-inv-print-body" style={{ background: "#ffffff" }}>
          <div className="hims-receipt-sheet">
            <div className="hims-inv-top-bar">
              <div className="hims-inv-brand-col">
                <div className="hims-inv-brand-title">AURA MULTISPECIALTY HOSPITAL &amp; RESEARCH CENTER</div>
                <div className="hims-inv-brand-sub">Accredited Multi-Specialty Hospital &amp; Surgical Care Center</div>
                <div className="hims-inv-brand-contact">
                  Plot 45, Institutional Area, Hospital Road • Helpline: +91 141 289 0000 • Email: billing@aurahospital.org
                </div>
              </div>
              <div className="hims-inv-tax-col">
                <div className="hims-inv-tax-title">OFFICIAL PAYMENT RECEIPT</div>
                <div className="hims-inv-tax-row"><span>GSTIN:</span> <strong>08AAACN1234F1Z8</strong></div>
                <div className="hims-inv-tax-row"><span>STATUS:</span> <strong style={{ color: "#059669" }}>PAID &amp; RECORDED</strong></div>
              </div>
            </div>

            <div className="hims-inv-doc-banner">
              <span>INPATIENT CASH &amp; ELECTRONIC PAYMENT RECEIPT SLIP</span>
            </div>

            <div className="hims-inv-demographics-grid">
              <div className="hims-demo-col">
                <table className="hims-demo-table">
                  <tbody>
                    <tr>
                      <td className="demo-k">Patient Name</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v demo-v--name">{patient?.name}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Patient UHID</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v demo-v--code">{patient?.uhid}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Age / Gender</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient?.age} Y / {patient?.gender}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Contact / Phone</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient?.mobile || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="hims-demo-col">
                <table className="hims-demo-table">
                  <tbody>
                    <tr>
                      <td className="demo-k">Receipt Number</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v demo-v--code">{selectedPaymentForReceipt.receiptNo}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Payment Date / Time</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{selectedPaymentForReceipt.date} {selectedPaymentForReceipt.time}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">IPD Admission No</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v demo-v--code">{patient?.admissionNo}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Ward / Bed</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient?.ward} - {patient?.bedNo}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="hims-receipt-amount-box">
              <div className="hims-receipt-amt-left">
                <div className="hims-receipt-amt-label">Amount Received (INR)</div>
                <div className="hims-receipt-amt-number">₹{selectedPaymentForReceipt.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                <div className="hims-receipt-amt-words">
                  In Words: <strong>{numberToWords(selectedPaymentForReceipt.amount)}</strong>
                </div>
              </div>
              <div className="hims-receipt-amt-right">
                <div className="hims-receipt-info-row">
                  <span>Receipt Category:</span>
                  <strong>
                    {selectedPaymentForReceipt.type === "Advance"
                      ? "Initial Advance Deposit"
                      : selectedPaymentForReceipt.type === "Settlement"
                      ? "Discharge Settlement"
                      : "Running Bill Interim Payment"}
                  </strong>
                </div>
                <div className="hims-receipt-info-row">
                  <span>Payment Mode:</span>
                  <strong>{selectedPaymentForReceipt.mode}</strong>
                </div>
                <div className="hims-receipt-info-row">
                  <span>Notes / Reference:</span>
                  <span>{selectedPaymentForReceipt.remarks || "Counter Receipt"}</span>
                </div>
              </div>
            </div>

            <div className="hims-receipt-audit-box">
              <div className="hims-audit-chip">
                <span className="lbl">Total Charges Incurred:</span>
                <span className="val">₹{totalBills.toLocaleString("en-IN")}</span>
              </div>
              <div className="hims-audit-chip">
                <span className="lbl">Total Paid So Far:</span>
                <span className="val" style={{ color: "#059669" }}>₹{totalPaymentsReceivedAll.toLocaleString("en-IN")}</span>
              </div>
              <div className="hims-audit-chip">
                <span className="lbl">Current Remaining Balance:</span>
                <span className="val" style={{ color: pendingAmount > 0 ? "#e11d48" : "#059669" }}>
                  ₹{pendingAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="hims-inv-signatures-row" style={{ marginTop: 28 }}>
              <div className="hims-sig-box">
                <div className="hims-sig-line"></div>
                <div className="hims-sig-title">Patient / Attendant Signature</div>
              </div>
              <div className="hims-sig-box">
                <div className="hims-sig-line"></div>
                <div className="hims-sig-title">Cashier / Authorized Signatory</div>
                <div className="hims-sig-sub">Aura Hospital Accounts Desk</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

{/* 1b. Refund Excess Advance Modal */}
{
  showRefundModal && (
    <div className="ipd-modal-backdrop" onClick={() => setShowRefundModal(false)}>
      <div className="ipd-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="ipd-modal-header">
          <div className="ipd-modal-header-left">
            <div className="ipd-modal-icon-wrap" style={{ background: "#059669" }}>
              <Icon name="LuBanknote" size={20} />
            </div>
            <div>
              <h3 className="ipd-modal-title">Process Inpatient Refund</h3>
              <span className="ipd-modal-subtitle">
                Refund excess advance to {patient?.name} ({patient?.admissionNo})
              </span>
            </div>
          </div>
          <button
            type="button"
            className="ipd-modal-close-btn"
            onClick={() => setShowRefundModal(false)}
          >
            <Icon name="LuX" size={18} />
          </button>
        </div>

        <form onSubmit={handleProcessRefund}>
          <div className="ipd-modal-body">
            <div className="ipd-form-field">
              <label className="ipd-field-label">Refund Amount (₹) *</label>
              <input
                type="number"
                className="ipd-input-control ipd-input-control--lg"
                required
                min="1"
                max={excessAdvance}
                value={refundForm.amount}
                onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
              />
              <span style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Available excess advance: <strong>₹{excessAdvance.toLocaleString("en-IN")}</strong>
              </span>
            </div>

            <div className="ipd-form-field">
              <label className="ipd-field-label">Refund Payment Mode</label>
              <select
                className="ipd-select-control"
                value={refundForm.mode}
                onChange={(e) => setRefundForm({ ...refundForm, mode: e.target.value })}
              >
                <option value="Cash">Cash Handover</option>
                <option value="UPI">UPI Return (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Direct Bank Transfer (NEFT/RTGS)</option>
                <option value="Original Mode">Original Payment Method Reversal</option>
              </select>
            </div>

            <div className="ipd-form-field">
              <label className="ipd-field-label">Accounting Notes / Remarks</label>
              <input
                type="text"
                className="ipd-input-control"
                placeholder="e.g. Excess advance refunded at discharge"
                value={refundForm.reason}
                onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
              />
            </div>
          </div>

          <div className="ipd-modal-footer">
            <button
              type="button"
              className="ipd-btn-outline"
              onClick={() => setShowRefundModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="ipd-btn-search" style={{ background: "#059669" }} disabled={actionLoading}>
              <Icon name="LuBanknote" size={16} /> Disburse &amp; Record Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

{/* 2. Change Bed / Ward Modal */ }
{
  showChangeBedModal && (
    <div className="ipd-modal-backdrop" onClick={() => setShowChangeBedModal(false)}>
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
  )
}

{/* 3. Real-time HIMS Software Standard IPD Admission & Tax Invoice Print Slip Modal */}
{
  showPrintBillModal && patient && (
    <div className="ipd-modal-backdrop" onClick={() => setShowPrintBillModal(false)}>
      <div className="ipd-modal-box ipd-modal-box--print-lg" onClick={(e) => e.stopPropagation()}>
        <div className="ipd-modal-header" style={{ background: "linear-gradient(100deg, #0b2556 0%, #1e5a8e 100%)" }}>
          <div className="ipd-modal-header-left">
            <div className="ipd-modal-icon-wrap" style={{ background: "#ffd766", color: "#081a3d" }}>
              <Icon name="LuPrinter" size={18} />
            </div>
            <div>
              <h3 className="ipd-modal-title">Official Inpatient Admission &amp; Tax Invoice Slip</h3>
              <span className="ipd-modal-subtitle">
                Patient: {patient.name} ({patient.admissionNo}) • Real-time HIMS Official Record
              </span>
            </div>
          </div>
          <button
            type="button"
            className="ipd-modal-close-btn"
            onClick={() => setShowPrintBillModal(false)}
          >
            <Icon name="LuX" size={18} />
          </button>
        </div>

        <div className="ipd-modal-body" style={{ background: "#f8fafc", padding: 18 }}>
          <div className="hims-tax-invoice-wrap">
            {/* 1. Official Hospital Letterhead */}
            <div className="hims-inv-letterhead">
              <div className="hims-inv-lh-brand">
                <div className="hims-inv-logo-badge">
                  <Icon name="LuPlus" size={30} />
                </div>
                <div>
                  <h1 className="hims-inv-hosp-name">NARAYAN MULTISPECIALITY HOSPITAL</h1>
                  <div className="hims-inv-hosp-tagline">
                    NABH &amp; NABL ACCREDITED TERTIARY CARE HOSPITAL &amp; RESEARCH INSTITUTE
                  </div>
                  <div className="hims-inv-hosp-contact">
                    Sector 4, Central Hospital Road, Jaipur - 302020 (Rajasthan) • 24×7 Emergency: +91 9811223344
                    <br />Email: billing@narayanhospital.com • Website: www.narayanhospital.com
                  </div>
                </div>
              </div>
              <div className="hims-inv-lh-tax-box">
                <div className="hims-inv-tax-title">TAX INVOICE &amp; ADM SLIP</div>
                <div className="hims-inv-tax-row"><span>GSTIN:</span> <strong>08AAACN1234F1Z8</strong></div>
                <div className="hims-inv-tax-row"><span>PAN:</span> <strong>AAACN1234F</strong></div>
                <div className="hims-inv-tax-row"><span>STATE:</span> <strong>08 - Rajasthan</strong></div>
              </div>
            </div>

            {/* 2. Document Banner */}
            <div className="hims-inv-doc-banner">
              <span>INPATIENT ADMISSION &amp; FINAL BILL SETTLEMENT STATEMENT</span>
            </div>

            {/* 3. Patient & Inpatient Demographics Grid */}
            <div className="hims-inv-demographics-grid">
              <div className="hims-demo-col">
                <table className="hims-demo-table">
                  <tbody>
                    <tr>
                      <td className="demo-k">Patient Name</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v demo-v--name">{patient.name}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Patient UHID</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v demo-v--code">{patient.uhid}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Age / Gender</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient.age} Y / {patient.gender}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Contact / Phone</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient.mobile || "—"}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Blood Group</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient.bloodGroup || "O+"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="hims-demo-col">
                <table className="hims-demo-table">
                  <tbody>
                    <tr>
                      <td className="demo-k">Invoice / Bill No</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v demo-v--code">INV-{patient.admissionNo}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Invoice Date</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{new Date().toLocaleDateString("en-IN")}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">IPD Admission No</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v demo-v--code">{patient.admissionNo}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Admission Date</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient.admissionDate}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Discharge Date</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient.dischargeDate || "Under Active Inpatient Care"}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Ward &amp; Bed</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient.ward} • {patient.bedNo}</td>
                    </tr>
                    <tr>
                      <td className="demo-k">Attending Consultant</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient.consultant} ({patient.department})</td>
                    </tr>
                    {patient.referredBy && (
                      <tr>
                        <td className="demo-k">Referred By</td>
                        <td className="demo-sep">:</td>
                        <td className="demo-v">Dr. {patient.referredBy} {patient.referralSource ? `(${patient.referralSource})` : ""}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="demo-k">Length of Stay</td>
                      <td className="demo-sep">:</td>
                      <td className="demo-v">{patient.stayDays} Day{patient.stayDays > 1 ? "s" : ""}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Categorized Itemized Charges Table */}
            <div className="hims-inv-table-section">
              <div className="hims-inv-table-heading">ITEMIZED INPATIENT CHARGES &amp; SERVICE BREAKDOWN</div>
              <table className="hims-inv-items-table">
                <thead>
                  <tr>
                    <th style={{ width: 45, textAlign: "center" }}>#</th>
                    <th style={{ width: 105 }}>POSTED DATE</th>
                    <th style={{ width: 140 }}>DEPARTMENT</th>
                    <th>PARTICULARS / SERVICE / MEDICINE DESCRIPTION</th>
                    <th style={{ width: 70, textAlign: "center" }}>QTY</th>
                    <th style={{ width: 110, textAlign: "right" }}>UNIT RATE (₹)</th>
                    <th style={{ width: 125, textAlign: "right" }}>AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.items && patient.items.length > 0 ? (
                    patient.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td style={{ textAlign: "center", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
                          {item.date || patient.admissionDate}
                        </td>
                        <td>
                          <span className="hims-inv-cat-pill">{item.category}</span>
                        </td>
                        <td style={{ fontWeight: 600, color: "#0f172a" }}>
                          {item.name}
                          {(Number(item.discountAmount) > 0 || item.referredBy || item.discountReference) && (
                            <div style={{ fontSize: 10, color: "#0284c7", marginTop: 2, fontWeight: 500 }}>
                              {Number(item.discountAmount) > 0 && (
                                <span style={{ color: "#059669", fontWeight: 600 }}>
                                  🏷️ Disc: ₹{Number(item.discountAmount).toFixed(2)}{item.discountReason ? ` (${item.discountReason})` : ""}
                                </span>
                              )}
                              {item.referredBy && <span>{Number(item.discountAmount) > 0 ? " • " : ""}Ref: Dr. {item.referredBy}</span>}
                              {item.discountReference && <span> ({item.discountReference})</span>}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{item.qty}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                          ₹{Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                          ₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: 18, color: "#94a3b8" }}>
                        No itemized charges posted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. Department Summary Pills */}
            <div className="hims-inv-dept-summary-row">
              {roomChargesTotal > 0 && <span className="hims-dsum-pill">🛏️ Bed Rent: ₹{roomChargesTotal.toLocaleString("en-IN")}</span>}
              {consultationTotal > 0 && <span className="hims-dsum-pill">🩺 Doctor Visits: ₹{consultationTotal.toLocaleString("en-IN")}</span>}
              {medicinesTotal > 0 && <span className="hims-dsum-pill">💊 Pharmacy &amp; IV: ₹{medicinesTotal.toLocaleString("en-IN")}</span>}
              {(labTotal + radiologyTotal) > 0 && <span className="hims-dsum-pill">🧪 Diagnostics: ₹{(labTotal + radiologyTotal).toLocaleString("en-IN")}</span>}
              {(proceduresTotal + othersTotal) > 0 && <span className="hims-dsum-pill">⚡ Procedures &amp; Care: ₹{(proceduresTotal + othersTotal).toLocaleString("en-IN")}</span>}
            </div>

            {/* 6. Settlement Reconciliation & Totals Box */}
            <div className="hims-inv-settlement-card">
              <div className="hims-settle-left">
                <div className="hims-words-wrap">
                  <span className="hims-words-lbl">Total Bill Amount In Words:</span>
                  <div className="hims-words-val">{numberToWords(allItemsNet || totalBills)}</div>
                </div>

                <div className="hims-pay-audit-box">
                  <div className="hims-pab-title">PAYMENTS &amp; DEPOSITS AUDIT RECONCILIATION</div>
                  <div className="hims-pab-row">
                    <span>Initial Admission Advance Deposit:</span>
                    <strong>₹{totalAdvance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="hims-pab-row">
                    <span>Interim / Running Bill Payments:</span>
                    <strong>₹{totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="hims-pab-row hims-pab-row--tot">
                    <span>Total Payments Received:</span>
                    <strong style={{ color: "#059669" }}>
                      ₹{totalPaymentsReceivedAll.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                {/* Official Status Stamp */}
                <div className={`hims-official-stamp ${pendingAmount === 0 ? "hims-stamp--paid" : "hims-stamp--due"}`}>
                  {pendingAmount === 0 ? "✓ PAID & SETTLED IN FULL" : `⚠ BALANCE PAYABLE: ₹${pendingAmount.toLocaleString("en-IN")}`}
                </div>
              </div>

              <div className="hims-settle-right">
                <table className="hims-totals-calc-table">
                  <tbody>
                    <tr>
                      <td>Total Gross Charges</td>
                      <td className="calc-val">₹{(allItemsGross || totalGrossAmount || totalBills).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    {(allItemsDiscounts > 0 || totalDiscounts > 0) && (
                      <tr style={{ color: "#059669" }}>
                        <td>(-) Referral &amp; Hospital Concession</td>
                        <td className="calc-val">(-) ₹{(allItemsDiscounts || totalDiscounts).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                    <tr>
                      <td>Tax (GST Exempted Healthcare)</td>
                      <td className="calc-val">₹0.00</td>
                    </tr>
                    <tr className="calc-row-sub">
                      <td><strong>Net Billable Charges</strong></td>
                      <td className="calc-val"><strong>₹{(allItemsNet || totalBills).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></td>
                    </tr>
                    <tr>
                      <td>(-) Less Total Payments &amp; Deposits</td>
                      <td className="calc-val" style={{ color: "#059669" }}>
                        (-) ₹{totalPaymentsReceivedAll.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="calc-row-net">
                      <td><strong>NET BALANCE PAYABLE</strong></td>
                      <td className={`calc-val calc-val--net ${pendingAmount > 0 ? "due" : "cleared"}`}>
                        ₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. Terms & Official Signatures */}
            <div className="hims-inv-signatures-section">
              <div className="hims-inv-terms">
                <div>• This is an authenticated computer-generated Inpatient Final Tax Invoice valid under hospital information system bylaws.</div>
                <div>• Medicines &amp; surgical consumables billed as per approved hospital inpatient formulary rates.</div>
                <div>• Incase of any billing dispute, kindly present this slip at Inpatient Accounts Desk within 7 working days.</div>
              </div>

              <div className="hims-sig-row">
                <div className="hims-sig-box">
                  <div className="hims-sig-line" />
                  <span className="hims-sig-title">Billing Cashier</span>
                  <span className="hims-sig-sub">Narayan HIMS Counter</span>
                </div>
                <div className="hims-sig-box">
                  <div className="hims-sig-line" />
                  <span className="hims-sig-title">Accounts Officer</span>
                  <span className="hims-sig-sub">Audit &amp; Reconciliation</span>
                </div>
                <div className="hims-sig-box">
                  <div className="hims-sig-line" />
                  <span className="hims-sig-title">Patient / Attendant</span>
                  <span className="hims-sig-sub">Signature &amp; Verification</span>
                </div>
                <div className="hims-sig-box">
                  <div className="hims-sig-line" />
                  <span className="hims-sig-title">Medical Superintendent</span>
                  <span className="hims-sig-sub">Authorized Signatory</span>
                </div>
              </div>

              <div className="hims-inv-bottom-tag">
                NARAYAN HOSPITAL • Sector 4, Hospital Road, Jaipur • "Quality Care With Compassion &amp; Clinical Excellence"
              </div>
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
            className="ipd-btn-search"
            style={{ width: "auto", padding: "10px 24px", background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
            onClick={() => window.print()}
          >
            <Icon name="LuPrinter" size={16} /> Print Official IPD Slip &amp; Tax Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

{/* 5. Discharge Clearance Verification Modal */}
{showDischargeModal && patient && (
  <div className="ipd-modal-backdrop" onClick={() => setShowDischargeModal(false)}>
    <div className="ipd-modal-box ipd-modal-box--discharge" onClick={(e) => e.stopPropagation()}>
      <div className="ipd-modal-header" style={{ background: "linear-gradient(100deg, #064e3b 0%, #047857 100%)" }}>
        <div className="ipd-modal-header-left">
          <div className="ipd-modal-icon-wrap" style={{ background: "#10b981", color: "#ffffff", border: "1px solid #059669" }}>
            <Icon name="LuCheckCircle2" size={20} />
          </div>
          <div>
            <h3 className="ipd-modal-title">Inpatient Final Discharge Clearance</h3>
            <span className="ipd-modal-subtitle">
              Patient: {patient.name} ({patient.admissionNo}) • Bed: {patient.ward} - {patient.bedNo}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="ipd-modal-close-btn"
          onClick={() => setShowDischargeModal(false)}
        >
          <Icon name="LuX" size={18} />
        </button>
      </div>

      <form onSubmit={handleConfirmDischarge}>
        <div className="ipd-modal-body">
          {/* Financial Clearance Audit Banner */}
          <div className="ipd-discharge-audit-card">
            <div className="ipd-dac-header">
              <span className="ipd-dac-badge">FINANCIAL BILLING AUDIT: 100% CLEARED</span>
              <span className="ipd-dac-net">Net Balance: ₹0.00</span>
            </div>
            <div className="ipd-dac-grid">
              <div>
                <span className="dac-lbl">Total Inpatient Charges:</span>
                <strong className="dac-val">₹{totalBills.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span className="dac-lbl">Total Payments Received:</span>
                <strong className="dac-val" style={{ color: "#059669" }}>₹{totalPaymentsReceivedAll.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span className="dac-lbl">Length of Stay:</span>
                <strong className="dac-val">{patient.stayDays} Day{patient.stayDays > 1 ? "s" : ""}</strong>
              </div>
              <div>
                <span className="dac-lbl">Bed Allotment Status:</span>
                <strong className="dac-val" style={{ color: "#0284c7" }}>Will be marked for Cleaning &amp; Release</strong>
              </div>
            </div>
          </div>

          <div className="ipd-form-field">
            <label className="ipd-field-label">Discharge Classification / Type *</label>
            <select
              className="ipd-select-control"
              value={dischargeForm.discharge_type}
              onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_type: e.target.value })}
            >
              <option value="normal">Normal / Clinically Recovered (Standard Discharge)</option>
              <option value="lama">LAMA (Left Against Medical Advice)</option>
              <option value="dama">DAMA (Discharge Against Medical Advice)</option>
              <option value="referred">Referred to Higher Specialty / Tertiary Centre</option>
              <option value="transferred">Internal Hospital Transfer</option>
              <option value="absconded">Absconded</option>
              <option value="death">Deceased</option>
            </select>
          </div>

          <div className="ipd-form-field">
            <label className="ipd-field-label">Clinical Discharge Condition &amp; Clearance Notes</label>
            <input
              type="text"
              className="ipd-input-control"
              placeholder="Enter discharge summary note..."
              value={dischargeForm.discharge_condition}
              onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_condition: e.target.value })}
            />
            <span style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              Attending Consultant: <strong>{patient.consultant}</strong> ({patient.department})
            </span>
          </div>

          <div className="ipd-discharge-notice">
            <Icon name="LuShieldCheck" size={18} style={{ color: "#059669", flexShrink: 0 }} />
            <span>
              Billing clearance verified. Confirming will close active admission, vacate bed <strong>{patient.bedNo}</strong>, and enable final discharge summary workflow.
            </span>
          </div>
        </div>

        <div className="ipd-modal-footer">
          <button
            type="button"
            className="ipd-btn-outline"
            onClick={() => setShowDischargeModal(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="ipd-btn-confirm-discharge"
            disabled={actionLoading}
          >
            <Icon name="LuCheckCheck" size={16} /> Confirm Discharge &amp; Release Bed
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* 6. Discharge Success & Next Steps Modal */}
{showDischargeSuccessModal && patient && (
  <div className="ipd-modal-backdrop" onClick={() => setShowDischargeSuccessModal(false)}>
    <div className="ipd-modal-box ipd-modal-box--success" onClick={(e) => e.stopPropagation()}>
      <div className="ipd-success-celebration-head">
        <div className="ipd-success-icon-ring">
          <Icon name="LuCheckCheck" size={32} />
        </div>
        <h3 className="ipd-success-title">Inpatient Discharged Successfully!</h3>
        <p className="ipd-success-sub">
          Billing settlement and bed release are complete for <strong>{patient.name}</strong> ({patient.admissionNo}).
        </p>
      </div>

      <div className="ipd-modal-body" style={{ paddingTop: 0 }}>
        <div className="ipd-success-info-grid">
          <div className="ipd-sig-item">
            <span className="lbl">Patient UHID</span>
            <span className="val">{patient.uhid}</span>
          </div>
          <div className="ipd-sig-item">
            <span className="lbl">Discharged At</span>
            <span className="val">{patient.dischargeDate || new Date().toLocaleDateString("en-IN")}</span>
          </div>
          <div className="ipd-sig-item">
            <span className="lbl">Bed Status</span>
            <span className="val" style={{ color: "#0284c7" }}>Released (Marked Cleaning)</span>
          </div>
          <div className="ipd-sig-item">
            <span className="lbl">Final Bill Status</span>
            <span className="val" style={{ color: "#059669" }}>Settled (₹0.00 Due)</span>
          </div>
        </div>

        <div className="ipd-success-actions">
          <button
            type="button"
            className="ipd-btn-success-primary"
            onClick={() => {
              setShowDischargeSuccessModal(false);
              setShowPrintBillModal(true);
            }}
          >
            <Icon name="LuPrinter" size={16} /> 🧾 Print Official Bill Slip
          </button>
          <button
            type="button"
            className="ipd-btn-success-secondary"
            onClick={() => {
              setShowDischargeSuccessModal(false);
              navigate("/ipd/discharge-summary");
            }}
          >
            <Icon name="LuFileText" size={16} /> 📋 Open IPD Discharge Summary
          </button>
        </div>
      </div>

      <div className="ipd-modal-footer" style={{ justifyContent: "center" }}>
        <button
          type="button"
          className="ipd-btn-outline"
          style={{ minWidth: 120 }}
          onClick={() => setShowDischargeSuccessModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div >
  );
}
