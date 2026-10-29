import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import patientService from "../../../api/services/patientService";
import laboratoryService from "../../../api/services/laboratoryService";
import doctorService from "../../../api/services/doctorService";
import staffService from "../../../api/services/staffService";
import "./PathologyView.css";

export default function PathologyTestRequest() {
  const navigate = useNavigate();

  // 1. Patient Details State (Clean, no static mock data)
  const [patientSearch, setPatientSearch] = useState("");
  const [patientList, setPatientList] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [techniciansList, setTechniciansList] = useState([]);
  const [patient, setPatient] = useState({
    id: "",
    uhid: "",
    name: "",
    age: "",
    gender: "Male",
    mobile: "",
    alternateMobile: "",
    address: "",
    doctor: "",
    visitType: "OPD",
    referredBy: "",
    clinicalNotes: "",
  });

  // 2. Test Selection State (Catalog from backend API)
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [testSearch, setTestSearch] = useState("");
  const [selectedTests, setSelectedTests] = useState([]);

  // 3. Sample & Source Details State
  const [testSource, setTestSource] = useState("In-house");
  const [outsourceLabs, setOutsourceLabs] = useState([]);
  const [selectedOutsourceLabId, setSelectedOutsourceLabId] = useState("");
  const [sampleType, setSampleType] = useState("Blood");
  const [collectionTime, setCollectionTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [collectedBy, setCollectedBy] = useState("");
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
            // Deduplicate tests by code or lowercased name so each test is loaded only once
            const seen = new Set();
            const uniqueDefs = [];
            for (const d of defsRes) {
              const codeKey = (d.code || "").trim().toLowerCase();
              const nameKey = (d.name || "").trim().toLowerCase();
              const uniqueKey = codeKey || nameKey;
              if (uniqueKey && !seen.has(uniqueKey)) {
                seen.add(uniqueKey);
                if (nameKey) seen.add(nameKey);
                uniqueDefs.push(d);
              }
            }

            const normalized = uniqueDefs.map((d) => ({
              id: d.service_id || d.id,
              service_id: d.service_id || d.id,
              code: d.code || `L-${(d.id || "").slice(0, 4)}`,
              name: d.name || "Investigation Test",
              category: d.lab_section || "General",
              price: d.price ? Number(d.price) : 350,
              sampleType: d.specimen_type || "Blood",
              tat: d.tat_hours ? `${d.tat_hours} Hours` : "4 Hours",
            }));
            setCatalog(normalized);
          } else {
            setCatalog([]);
          }
        }
      } catch (err) {
        console.warn("Test catalog API load warning:", err?.message);
        if (isMounted) setCatalog([]);
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }

      // 3. Fetch active third-party outsource labs
      try {
        const labsRes = await laboratoryService.getOutsourceLabs();
        if (isMounted && Array.isArray(labsRes)) {
          const activeOnly = labsRes.filter((l) => l.is_active);
          setOutsourceLabs(activeOnly);
          if (activeOnly.length > 0) {
            setSelectedOutsourceLabId(activeOnly[0].id);
          }
        }
      } catch (err) {
        console.warn("Outsource labs API warning:", err?.message);
      }

      // 4. Fetch real doctors from database
      try {
        const docs = await doctorService.getDoctors();
        if (isMounted && Array.isArray(docs) && docs.length > 0) {
          const docItems = docs.map((d) => ({
            id: d.id || d.practitioner_id,
            name: d.name ? (d.name.startsWith("Dr.") ? d.name : `Dr. ${d.name}`) : "Doctor",
            specialty: d.specialization || d.specialty || "Consultant",
            label: `${d.name ? (d.name.startsWith("Dr.") ? d.name : `Dr. ${d.name}`) : "Doctor"} (${d.specialization || d.specialty || "Consultant"})`
          }));
          setDoctorsList(docItems);
          setPatient((prev) => ({
            ...prev,
            doctor: prev.doctor || docItems[0]?.label || ""
          }));
        }
      } catch (err) {
        console.warn("Doctors API warning:", err?.message);
      }

      // 5. Fetch real staff / technicians from database
      try {
        const staffRes = await staffService.getAll({ limit: 100 });
        const staffData = staffRes?.data || staffRes || [];
        if (isMounted && Array.isArray(staffData) && staffData.length > 0) {
          const techItems = staffData
            .filter((s) => s.staff_type === 'technician' || s.staff_type === 'nurse' || s.staff_type === 'doctor' || s.staff_type === 'paramedic' || s.staff_type === 'support')
            .map((s) => ({
              id: s.id,
              name: `${s.first_name} ${s.last_name || ''}`.trim(),
              type: s.designation || s.staff_type || 'Staff',
              label: `${s.first_name} ${s.last_name || ''}`.trim() + ` (${s.designation || s.staff_type || 'Staff'})`
            }));
          const list = techItems.length > 0 ? techItems : staffData.map((s) => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name || ''}`.trim(),
            type: s.staff_type || 'Staff',
            label: `${s.first_name} ${s.last_name || ''}`.trim() + ` (${s.staff_type || 'Staff'})`
          }));
          setTechniciansList(list);
          if (list.length > 0) {
            setCollectedBy(list[0].label);
          }
        }
      } catch (err) {
        console.warn("Staff API warning:", err?.message);
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

  // Helper to generate clinical specimen barcode
  const generateBarcode = (prefix = "LAB") =>
    `${prefix}${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

  // Toggle test selection with per-test sample & source configuration
  const handleToggleTest = (test) => {
    setSelectedTests((prev) => {
      const exists = prev.some((t) => t.id === test.id || t.code === test.code);
      if (exists) {
        return prev.filter((t) => (t.id ? t.id !== test.id : t.code !== test.code));
      } else {
        const defaultSpecimen = test.sampleType || test.specimen_type || "Blood";
        const existingSameSpecimen = prev.find((t) => (t.sampleType || t.specimen_type) === defaultSpecimen);

        const newTestItem = {
          ...test,
          sampleType: defaultSpecimen,
          processingSource: "in_house",
          outsourceLabId: outsourceLabs[0]?.id || "",
          collectAtHospital: true,
          outsourceCost: null,
          outsourceRefNo: "",
          barcode: existingSameSpecimen ? existingSameSpecimen.barcode : generateBarcode("LAB"),
          collectedBy: collectedBy || (techniciansList[0]?.label || "Hospital Phlebotomist"),
          collectionTime: collectionTime || new Date().toISOString().slice(0, 16),
          fasting: test.fasting_required ? "Fasting 8-10 Hours" : "Standard",
          notes: "",
        };
        return [...prev, newTestItem];
      }
    });
  };

  const handleUpdateTestDetail = (identifier, field, value) => {
    setSelectedTests((prev) =>
      prev.map((item) => {
        if (item.id === identifier || item.code === identifier) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Batch actions across all selected tests
  const handleApplySourceToAll = (source) => {
    setSelectedTests((prev) =>
      prev.map((t) => ({
        ...t,
        processingSource: source,
        outsourceLabId: source.startsWith("outsource") ? (t.outsourceLabId || outsourceLabs[0]?.id || "") : t.outsourceLabId,
      }))
    );
    toast.success(`Set processing source to "${source === "in_house" ? "In-house" : "Outsourced"}" for all tests`);
  };

  const handleApplyCollectorToAll = (collectorName) => {
    if (!collectorName) return;
    setCollectedBy(collectorName);
    setSelectedTests((prev) =>
      prev.map((t) => ({
        ...t,
        collectedBy: collectorName,
      }))
    );
    toast.success(`Assigned phlebotomist "${collectorName}" to all tests`);
  };

  const handleGroupBySpecimenType = () => {
    setSelectedTests((prev) => {
      const typeBarcodeMap = {};
      return prev.map((t) => {
        const spec = t.sampleType || "Blood";
        if (!typeBarcodeMap[spec]) {
          typeBarcodeMap[spec] = generateBarcode("LAB");
        }
        return { ...t, barcode: typeBarcodeMap[spec] };
      });
    });
    toast.success("Barcodes grouped by physical specimen tube/container!", { icon: "🏷️" });
  };

  const handleRegenerateAllBarcodes = () => {
    setSelectedTests((prev) =>
      prev.map((t) => ({
        ...t,
        barcode: generateBarcode("LAB"),
      }))
    );
    toast.success("Generated unique barcodes for all tests", { icon: "🔄" });
  };

  const handleRemoveSelectedTest = (codeOrId) => {
    setSelectedTests((prev) => prev.filter((t) => t.id !== codeOrId && t.code !== codeOrId));
  };

  // Categories list
  const availableCategories = ["All", ...Array.from(new Set(catalog.map((c) => c.category).filter(Boolean)))];

  // Specimen types list dynamically derived from catalog + standard types
  const availableSpecimenTypes = Array.from(
    new Set([
      "Blood",
      "Blood (EDTA)",
      "Serum",
      "Plasma",
      "Blood (Fluoride)",
      "Blood (Citrate)",
      "Urine",
      "Stool",
      "Sputum",
      "CSF",
      "Swab",
      "Tissue / Biopsy",
      ...catalog.map((c) => c.sampleType).filter(Boolean),
    ])
  );

  // Filtered test catalog
  const filteredCatalog = catalog.filter((t) => {
    if (activeCategory !== "All" && t.category !== activeCategory) return false;
    if (testSearch.trim()) {
      const q = testSearch.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate billing amounts & outsource margins
  // Only billable tests (collectAtHospital !== false) are charged to patient at hospital counter.
  // Direct pay tests (collectAtHospital === false) show up on lab orders and specimen dispatch, but with ₹0 hospital charge.
  const billableTests = selectedTests.filter((t) => t.collectAtHospital !== false);
  const directPayOutsourceTests = selectedTests.filter(
    (t) => t.processingSource?.startsWith("outsource") && t.collectAtHospital === false
  );

  const grossTotal = billableTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const discountAmount = Math.min(Number(discount) || 0, grossTotal);
  const netPayable = Math.max(0, grossTotal - discountAmount);

  const inHouseTests = selectedTests.filter((t) => !t.processingSource?.startsWith("outsource"));
  const outsourceTests = selectedTests.filter((t) => t.processingSource?.startsWith("outsource"));

  const inHouseTotal = inHouseTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const outsourceBilledTotal = outsourceTests
    .filter((t) => t.collectAtHospital !== false)
    .reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const outsourceTotal = outsourceTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  // Group outsource tests by partner lab to calculate contractor cost & hospital margin
  const outsourceByLab = outsourceTests.reduce((acc, t) => {
    const lab = outsourceLabs.find((l) => l.id === t.outsourceLabId);
    const labId = t.outsourceLabId || "unknown";
    if (!acc[labId]) {
      acc[labId] = {
        name: lab?.name || "Third-Party Outsource Lab",
        rate: Number(lab?.contract_rate) || 0,
        tat: lab?.turnaround_days || 2,
        tests: [],
        totalRevenue: 0,
        estimatedCost: 0,
        directPayCount: 0,
      };
    }
    const isDirectPay = t.collectAtHospital === false;
    const testPrice = isDirectPay ? 0 : (Number(t.price) || 0);
    const contractRate = acc[labId].rate;
    const testCost = t.outsourceCost != null && t.outsourceCost !== ""
      ? Number(t.outsourceCost)
      : (Number(t.price) || 0) * (1 - contractRate / 100);

    acc[labId].tests.push(t);
    acc[labId].totalRevenue += testPrice;
    acc[labId].estimatedCost += testCost;
    if (isDirectPay) acc[labId].directPayCount += 1;
    return acc;
  }, {});

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

    const missingLab = selectedTests.find(
      (t) => t.processingSource?.startsWith("outsource") && !t.outsourceLabId
    );
    if (missingLab) {
      toast.error(`Please select a third-party laboratory partner for outsourced test: ${missingLab.name}`);
      return;
    }

    setSubmitting(true);
    try {
      // Build normalized items array with multi-specimen and outsource collection fields
      const items = selectedTests.map((t, idx) => {
        const testDefId =
          (t.service_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.service_id) && t.service_id) ||
          (t.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id) && t.id) ||
          t.code ||
          t.name;

        return {
          testDefinitionId: testDefId,
          specimenType: t.sampleType || "Blood",
          container: t.container || null,
          processingSource: t.processingSource || "in_house",
          outsourceLabId: t.processingSource?.startsWith("outsource") ? t.outsourceLabId : null,
          barcode: t.barcode || `LAB${Date.now().toString().slice(-6)}${idx + 1}`,
          collectedBy: t.collectedBy || collectedBy || "Hospital Phlebotomist",
          collectionTime: t.collectionTime || collectionTime || new Date().toISOString(),
          fasting: t.fasting || "Standard",
          price: Number(t.price) || 0,
          collectAtHospital: t.collectAtHospital !== false,
          outsourceCost: t.outsourceCost != null && t.outsourceCost !== "" ? Number(t.outsourceCost) : null,
          outsourceRefNo: t.outsourceRefNo || null,
        };
      });

      const orderPayload = {
        patientId: patient.id || patientList[0]?.id || "00000000-0000-0000-0000-000000000000",
        orderedBy: patient.doctor || null,
        priority: "routine",
        clinicalInfo: patient.clinicalNotes || remarks || null,
        items,
        testDefinitionIds: items.map((it) => it.testDefinitionId),
        processingSource: items.some((it) => it.processingSource.startsWith("outsource")) ? "outsource_send" : "in_house",
        specimenType: items[0]?.specimenType || "Blood",
        barcode: items[0]?.barcode || barcodeNo,
        collectedBy: items[0]?.collectedBy || collectedBy,
      };

      const serverRes = await laboratoryService.createLabOrder(orderPayload);

      // Group items by unique barcode for printing barcode labels
      const barcodeMap = {};
      selectedTests.forEach((t) => {
        const b = t.barcode || "LAB-DEF";
        if (!barcodeMap[b]) {
          const lab = outsourceLabs.find((l) => l.id === t.outsourceLabId);
          barcodeMap[b] = {
            barcode: b,
            sampleType: t.sampleType || "Blood",
            source: t.processingSource?.startsWith("outsource") ? `Outsourced (${lab?.name || "Partner Lab"})` : "In-house (Central Lab)",
            collectedBy: t.collectedBy || collectedBy || "Hospital Phlebotomist",
            collectionTime: t.collectionTime ? new Date(t.collectionTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now",
            tests: [],
          };
        }
        barcodeMap[b].tests.push(t.name);
      });

      const specimenGroups = Object.values(barcodeMap);

      const newOrder = {
        id: serverRes?.orderNo || `REQ-${Date.now().toString().slice(-6)}`,
        orderId: serverRes?.orderId,
        uhid: patient.uhid || `P2026${Date.now().toString().slice(-4)}`,
        patientName: patient.name,
        ageGender: `${patient.age || "30"} Y / ${patient.gender?.[0] || "M"}`,
        specimenGroups,
        testCount: selectedTests.length,
        totalAmount: netPayable,
        paymentStatus,
        paymentMode,
        doctor: patient.doctor || "Self / Walk-in",
        requestDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        requestTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      toast.success("Lab test request registered and saved to database!", { icon: "🧪" });

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
        doctor: "",
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
      doctor: "",
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
                  <option value="Self / Walk-in">Self / Walk-in</option>
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.label}>
                      {doc.label}
                    </option>
                  ))}
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

        {/* ── CARD 3: SAMPLE & SOURCE FULFILLMENT ── */}
        <section className="path-card">
          <div className="path-card-head">
            <div className="card-head-title">
              <span className="card-step-badge">3</span>
              <h3>Sample &amp; Source Fulfillment</h3>
            </div>
            {selectedTests.length > 0 && (
              <span className="card-head-sub">
                {selectedTests.length} Tests | {new Set(selectedTests.map((t) => t.barcode)).size} Physical Samples
              </span>
            )}
          </div>

          <div className="path-card-body">
            {selectedTests.length === 0 ? (
              <div className="path-empty-selection">
                <Icon name="LuFlaskConical" size={32} />
                <p>
                  No tests selected yet. Please select one or more diagnostic investigations from Step 2 above to configure individual specimen tubes, barcodes, and in-house vs. outsourced lab routing.
                </p>
              </div>
            ) : (
              <div className="specimen-fulfillment-container">
                {/* Batch Actions Bar */}
                <div className="specimen-batch-bar">
                  <div className="batch-title">
                    <Icon name="LuLayers" size={15} />
                    <span>Quick Batch Controls:</span>
                  </div>
                  <div className="batch-actions-group">
                    <button
                      type="button"
                      className="batch-btn"
                      onClick={handleGroupBySpecimenType}
                      title="Tests with identical specimen types will share the same tube & barcode"
                    >
                      <Icon name="LuPipette" size={13} /> Group Barcodes by Specimen Tube
                    </button>
                    <button
                      type="button"
                      className="batch-btn"
                      onClick={() => handleApplySourceToAll("in_house")}
                    >
                      🏥 All In-house
                    </button>
                    <button
                      type="button"
                      className="batch-btn"
                      onClick={() => handleApplySourceToAll("outsource_send")}
                    >
                      🔬 All Outsource
                    </button>
                    <button
                      type="button"
                      className="batch-btn"
                      onClick={handleRegenerateAllBarcodes}
                      title="Generate distinct barcodes for every test"
                    >
                      <Icon name="LuRefreshCw" size={12} /> Unique Barcodes
                    </button>
                  </div>
                </div>

                {/* List of itemized test fulfillment cards */}
                {selectedTests.map((test, idx) => {
                  const isOutsource = test.processingSource?.startsWith("outsource");
                  const partnerLab = outsourceLabs.find((l) => l.id === test.outsourceLabId);
                  const marginPct = Number(partnerLab?.contract_rate) || 0;
                  const estimatedOutsourceCost = (test.price || 350) * (1 - marginPct / 100);
                  const hospitalMargin = (test.price || 350) - estimatedOutsourceCost;

                  return (
                    <div
                      key={test.id || test.code || idx}
                      className={`itemized-test-card ${isOutsource ? "is-outsourced" : ""}`}
                    >
                      <div className="itemized-test-header">
                        <div className="test-title-col">
                          <span className="test-seq-index">{idx + 1}</span>
                          <span className="test-header-name">{test.name}</span>
                          <span className="test-tag-section">{test.category || "General"}</span>
                        </div>
                        <div className="test-header-right">
                          <span className={`test-price-tag ${test.collectAtHospital === false ? "line-through text-slate-400 bg-slate-100" : ""}`}>
                            ₹{test.price || 350}
                          </span>
                          {test.collectAtHospital === false && (
                            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                              Direct Pay / ₹0 Billed
                            </span>
                          )}
                          <span className={`source-status-badge ${isOutsource ? "source-status-outsource" : "source-status-inhouse"}`}>
                            {isOutsource ? `🔬 Outsourced: ${partnerLab?.name || "Select Lab"}` : "🏥 In-house Central Lab"}
                          </span>
                        </div>
                      </div>

                      <div className="itemized-test-grid">
                        {/* 1. Processing Source */}
                        <div className="form-group-compact">
                          <label>Processing Routing</label>
                          <select
                            value={test.processingSource || "in_house"}
                            onChange={(e) => handleUpdateTestDetail(test.id || test.code, "processingSource", e.target.value)}
                          >
                            <option value="in_house">In-house (Main Central Lab)</option>
                            <option value="outsource_send">Third Party Outsource (Send to Partner)</option>
                            <option value="outsource_return">Third Party Outsource (Return / Received)</option>
                            <option value="external_upload">External Report Upload</option>
                          </select>
                        </div>

                        {/* 2. Outsource Partner Lab & Fee Collection Control (if Outsource) */}
                        {isOutsource && (
                          <div className="col-span-full outsource-billing-box p-3 rounded-lg border border-purple-200 bg-purple-50/70 mt-1 mb-2">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-xs font-bold text-purple-900 tracking-wide flex items-center gap-1.5">
                                <Icon name="LuBuilding" size={14} className="text-purple-600" />
                                Outsource Lab &amp; Payment Charge Control
                              </span>
                              <a
                                href="/settings/outsource-labs"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-purple-600 hover:text-purple-800 underline font-medium"
                              >
                                + Partner Labs Directory
                              </a>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {/* Partner Lab Selector */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Outsource Partner Lab <span className="text-rose-500">*</span>
                                </label>
                                <select
                                  value={test.outsourceLabId || ""}
                                  onChange={(e) => handleUpdateTestDetail(test.id || test.code, "outsourceLabId", e.target.value)}
                                  className="w-full text-xs py-1.5 px-2 rounded border border-slate-300 bg-white"
                                  required
                                >
                                  <option value="">-- Choose Partner Lab --</option>
                                  {outsourceLabs.map((l) => (
                                    <option key={l.id} value={l.id}>
                                      {l.name} ({Number(l.contract_rate) || 0}% margin, {l.turnaround_days || 2}d TAT)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Fee Collection Mode */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Fee Collection Mode
                                </label>
                                <select
                                  value={test.collectAtHospital === false ? "direct_pay" : "hospital_collect"}
                                  onChange={(e) =>
                                    handleUpdateTestDetail(
                                      test.id || test.code,
                                      "collectAtHospital",
                                      e.target.value === "hospital_collect"
                                    )
                                  }
                                  className="w-full text-xs py-1.5 px-2 rounded border border-purple-300 bg-white font-medium text-purple-900"
                                >
                                  <option value="hospital_collect">
                                    💰 Collect at Hospital Counter (₹{test.price || 0})
                                  </option>
                                  <option value="direct_pay">
                                    🚫 Direct Pay to External Lab / Not Taken (₹0)
                                  </option>
                                </select>
                              </div>

                              {/* Contractor Cost to Hospital */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Contractor Cost Payable (₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={test.outsourceCost != null ? test.outsourceCost : estimatedOutsourceCost.toFixed(0)}
                                  onChange={(e) =>
                                    handleUpdateTestDetail(
                                      test.id || test.code,
                                      "outsourceCost",
                                      e.target.value === "" ? null : Number(e.target.value)
                                    )
                                  }
                                  placeholder={`Est: ₹${estimatedOutsourceCost.toFixed(0)}`}
                                  className="w-full text-xs py-1.5 px-2 rounded border border-slate-300 bg-white"
                                />
                              </div>
                            </div>

                            {/* Status Helper Banner */}
                            <div className="mt-2 pt-2 border-t border-purple-200/60 flex flex-wrap items-center justify-between text-xs gap-1">
                              {test.collectAtHospital === false ? (
                                <span className="text-amber-800 font-medium flex items-center gap-1">
                                  <span>⚠️</span>
                                  Patient will pay partner lab directly. Specimen routing tracked in EMR, but <strong>₹0.00</strong> charged on hospital bill.
                                </span>
                              ) : (
                                <span className="text-purple-900 flex items-center gap-2">
                                  <span>Hospital Charges: <strong>₹{Number(test.price || 0).toFixed(0)}</strong></span>
                                  <span>|</span>
                                  <span>Partner Payable: <strong>₹{(test.outsourceCost != null ? Number(test.outsourceCost) : estimatedOutsourceCost).toFixed(0)}</strong></span>
                                  <span>|</span>
                                  <span className="text-emerald-700 font-semibold">
                                    Hospital Net Gain: ₹{(Number(test.price || 0) - (test.outsourceCost != null ? Number(test.outsourceCost) : estimatedOutsourceCost)).toFixed(0)}
                                  </span>
                                </span>
                              )}
                              <span className="text-slate-500 font-medium">
                                TAT: {partnerLab?.turnaround_days || 2} Days
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 3. Specimen Type */}
                        <div className="form-group-compact">
                          <label>Specimen / Sample Type</label>
                          <select
                            value={test.sampleType || "Blood"}
                            onChange={(e) => handleUpdateTestDetail(test.id || test.code, "sampleType", e.target.value)}
                          >
                            {availableSpecimenTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 4. Barcode / Container ID */}
                        <div className="form-group-compact">
                          <label>Sample Barcode / Tube ID</label>
                          <div className="barcode-input-group">
                            <input
                              type="text"
                              value={test.barcode || ""}
                              onChange={(e) => handleUpdateTestDetail(test.id || test.code, "barcode", e.target.value)}
                              placeholder="Tube Barcode"
                            />
                            <button
                              type="button"
                              className="btn-refresh-barcode"
                              title="Generate Unique Barcode"
                              onClick={() => handleUpdateTestDetail(test.id || test.code, "barcode", generateBarcode("LAB"))}
                            >
                              <Icon name="LuRefreshCw" size={13} />
                            </button>
                          </div>
                          {selectedTests.length > 1 && (
                            <div className="barcode-link-wrap">
                              <span className="text-xs text-slate-500">Same tube as:</span>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleUpdateTestDetail(test.id || test.code, "barcode", e.target.value);
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="">-- Link Tube --</option>
                                {selectedTests
                                  .filter((ot) => (ot.id || ot.code) !== (test.id || test.code))
                                  .map((ot) => (
                                    <option key={ot.id || ot.code} value={ot.barcode}>
                                      {ot.name} ({ot.barcode})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* 5. Phlebotomist / Collector */}
                        <div className="form-group-compact">
                          <label>Collected By</label>
                          <select
                            value={test.collectedBy || collectedBy}
                            onChange={(e) => handleUpdateTestDetail(test.id || test.code, "collectedBy", e.target.value)}
                          >
                            {techniciansList.length > 0 ? (
                              techniciansList.map((tech) => (
                                <option key={tech.id} value={tech.label}>
                                  {tech.label}
                                </option>
                              ))
                            ) : (
                              <option value="Hospital Phlebotomist">Hospital Phlebotomist</option>
                            )}
                          </select>
                        </div>

                        {/* 6. Collection Time */}
                        <div className="form-group-compact">
                          <label>Collection Timestamp</label>
                          <input
                            type="datetime-local"
                            value={test.collectionTime || collectionTime}
                            onChange={(e) => handleUpdateTestDetail(test.id || test.code, "collectionTime", e.target.value)}
                          />
                        </div>

                        {/* 7. Fasting / Condition */}
                        <div className="form-group-compact">
                          <label>Patient Condition</label>
                          <select
                            value={test.fasting || "Standard"}
                            onChange={(e) => handleUpdateTestDetail(test.id || test.code, "fasting", e.target.value)}
                          >
                            <option value="Standard">Standard / Random</option>
                            <option value="Fasting 8-10 Hours">Fasting 8-10 Hours</option>
                            <option value="Post-Prandial 2 Hours">Post-Prandial 2 Hours</option>
                            <option value="Stat / Emergency">Stat / Emergency Urgent</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                  <div className="calc-title">Invoice &amp; Fulfillment Breakdown</div>

                  {/* Split Summary Pills */}
                  <div className="billing-split-pills">
                    <div className="split-pill split-pill-inhouse">
                      <span className="split-lbl">🏥 In-house</span>
                      <span className="split-val">₹{inHouseTotal.toFixed(2)}</span>
                      <span className="text-xs text-slate-500 font-medium">{inHouseTests.length} tests (100% Hospital)</span>
                    </div>
                    {outsourceTests.length > 0 && (
                      <div className="split-pill split-pill-outsource">
                        <span className="split-lbl">🔬 Outsourced</span>
                        <span className="split-val">₹{outsourceBilledTotal.toFixed(2)}</span>
                        <span className="text-xs text-purple-600 font-medium">
                          {outsourceTests.length} tests ({outsourceTests.length - directPayOutsourceTests.length} billed
                          {directPayOutsourceTests.length > 0 ? `, ${directPayOutsourceTests.length} direct pay` : ""})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Direct Pay Notice if any outsourced tests are marked Direct Pay */}
                  {directPayOutsourceTests.length > 0 && (
                    <div className="p-2.5 my-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                      <Icon name="LuAlertCircle" size={15} className="shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <strong>{directPayOutsourceTests.length} Outsourced Test(s) Excluded from Hospital Counter Bill:</strong>
                        <div className="text-amber-800 mt-0.5">
                          {directPayOutsourceTests.map((t) => t.name).join(", ")}
                          <span className="text-slate-500"> — (Patient pays external lab directly; ₹0.00 charged on hospital invoice).</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Outsource Partner Lab Breakdown */}
                  {Object.keys(outsourceByLab).length > 0 && (
                    <div className="outsource-partners-breakdown">
                      <div className="font-bold text-purple-900 mb-1 flex items-center gap-1">
                        <Icon name="LuBuilding" size={13} /> External Partner Laboratories:
                      </div>
                      {Object.values(outsourceByLab).map((partner, pIdx) => (
                        <div key={pIdx} className="partner-breakdown-row">
                          <span>{partner.name} ({partner.tests.length} tests{partner.directPayCount > 0 ? `, ${partner.directPayCount} direct pay` : ""}):</span>
                          <strong>Billed: ₹{partner.totalRevenue.toFixed(2)} | Payable: ₹{partner.estimatedCost.toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="calc-row">
                    <span>Gross Investigation Charges</span>
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

      {/* ── PRINT MULTI-SPECIMEN BARCODE LABELS MODAL ── */}
      {printSlipModal && (
        <div className="path-modal-overlay">
          <div className="path-modal-container slip-modal-width" style={{ maxWidth: "780px" }}>
            <div className="path-modal-header no-print">
              <div className="flex items-center gap-2">
                <Icon name="LuBarcode" size={18} className="text-sky-600" />
                <h3 className="m-0 font-bold">Sample Accessioning &amp; Barcode Labels ({printSlipModal.specimenGroups?.length || 1} Physical Samples)</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setPrintSlipModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="path-modal-body print-area">
              <div className="multi-barcode-grid">
                {(printSlipModal.specimenGroups || []).map((grp, gIdx) => (
                  <div key={gIdx} className="barcode-single-tube-label">
                    <div className="tube-label-header">
                      <span className="tube-hosp-name">NARAYAN HOSPITAL LAB</span>
                      <span className="tube-specimen-badge">{grp.sampleType}</span>
                    </div>
                    <div className="tube-barcode-center">
                      <div className="tube-barcode-bars">||| | |||| | ||||| | |||</div>
                      <div className="tube-barcode-code font-mono font-bold">{grp.barcode}</div>
                    </div>
                    <div className="tube-label-body">
                      <div><strong>UHID:</strong> {printSlipModal.uhid} | <strong>Pt:</strong> {printSlipModal.patientName}</div>
                      <div><strong>Age/Sex:</strong> {printSlipModal.ageGender} | <strong>Dr:</strong> {printSlipModal.doctor}</div>
                      <div><strong>Tests:</strong> {grp.tests.join(", ")}</div>
                      <div><strong>Routing:</strong> {grp.source}</div>
                      <div><strong>Time:</strong> {printSlipModal.requestDate} {grp.collectionTime}</div>
                    </div>
                  </div>
                ))}
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
                <Icon name="LuPrinter" size={15} /> Print All Barcode Labels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
