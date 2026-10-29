import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/common/Icon.jsx";
import laboratoryService from "../../../api/services/laboratoryService";
import { SAMPLE_PARAM_DEFAULTS } from "../pathologyData.js";
import "./PathologyView.css";

export default function PathologyDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [activeSlipModal, setActiveSlipModal] = useState(null);

  const [filters, setFilters] = useState({
    date: "Today",
    category: "All",
    sampleType: "All",
    status: "All",
    source: "All",
    doctor: "All",
  });

  // Fetch real data on mount
  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      try {
        const [apiTests, stats] = await Promise.all([
          laboratoryService.getLabTests(),
          laboratoryService.getDashboardStats()
        ]);
        if (isMounted) {
          if (Array.isArray(apiTests) && apiTests.length > 0) {
            const normalized = apiTests.map((t, idx) => ({
              id: t.order_item_id || t.order_id || `REQ-${idx + 1}`,
              orderId: t.order_id,
              orderItemId: t.order_item_id,
              uhid: t.uhid || `P202600${idx + 1}`,
              patientName: `${t.first_name || ""} ${t.last_name || ""}`.trim() || t.patient_name || "Patient",
              ageGender: t.age ? `${t.age} Y / ${t.gender?.[0] || "M"}` : "—",
              testName: t.test_name || "Diagnostic Test",
              sampleType: t.lab_section || t.specimen_type || "Blood",
              source: t.outsource_lab_name ? `Outsourced (${t.outsource_lab_name})` : (t.processing_source?.startsWith("outsource") ? "Outsourced" : "In-house"),
              outsourceLabName: t.outsource_lab_name || null,
              status: t.status === "ordered" ? "Collected" : (t.status === "completed" ? "Reported" : (t.status === "in_progress" ? "In Process" : t.status)),
              requestedBy: t.ordered_by || "Dr. Anil Singh",
              requestTime: t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "10:30 AM",
              requestDate: t.created_at ? new Date(t.created_at).toLocaleDateString("en-GB") : "Today",
              barcode: t.specimen_no || `LAB${Date.now().toString().slice(-6)}${idx + 1}`,
              price: t.price || 350,
              chargeStatus: t.charge_status || "billable",
              billingStatus: t.charge_status === "billed" ? "Billed" : (t.charge_status === "billable" ? "Pending" : "Paid"),
              approvedBy: t.verified_at ? "Dr. S. Mehta" : "—",
            }));
            setRequests(normalized);
          } else {
            setRequests([]);
          }
        }
      } catch (err) {
        console.warn("Dashboard real data fetch warning:", err?.message);
        setRequests([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      date: "Today",
      category: "All",
      sampleType: "All",
      status: "All",
      source: "All",
      doctor: "All",
    });
    setSearchQuery("");
  };

  // Filter requests dynamically from live data
  const filteredRequests = requests.filter((r) => {
    if (filters.status !== "All" && r.status !== filters.status) return false;
    if (filters.category !== "All" && !r.testName?.toLowerCase().includes(filters.category.toLowerCase())) return false;
    if (filters.sampleType !== "All" && !r.sampleType?.toLowerCase().includes(filters.sampleType.toLowerCase())) return false;
    if (filters.source !== "All" && r.source !== filters.source) return false;
    if (filters.doctor !== "All" && r.requestedBy !== filters.doctor) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.patientName?.toLowerCase().includes(q) ||
        r.uhid?.toLowerCase().includes(q) ||
        r.barcode?.toLowerCase().includes(q) ||
        r.testName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Dynamic KPI metrics derived purely from requests
  const totalCount = requests.length;
  const collectedCount = requests.filter((r) => r.status === "Collected").length;
  const inProcessCount = requests.filter((r) => r.status === "In Process").length;
  const reportedCount = requests.filter((r) => r.status === "Reported" || r.status === "Completed").length;
  const pendingCount = requests.filter((r) => r.status === "Pending" || r.status === "Sample Pending").length;

  // Status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "Collected":
        return <span className="path-badge path-badge-collected">{status}</span>;
      case "In Process":
        return <span className="path-badge path-badge-in-process">{status}</span>;
      case "Reported":
      case "Completed":
        return <span className="path-badge path-badge-reported">{status}</span>;
      case "Pending":
      case "Sample Pending":
        return <span className="path-badge path-badge-pending">{status}</span>;
      case "Rejected":
        return <span className="path-badge path-badge-rejected">{status}</span>;
      default:
        return <span className="path-badge path-badge-default">{status}</span>;
    }
  };

  const getSourceBadge = (source = "", item = {}) => {
    if (item.outsourceLabName || source.toLowerCase().includes("outsource") || source.includes("Send")) {
      return (
        <span className="path-badge-source path-source-send" title={item.outsourceLabName || source}>
          🔬 {item.outsourceLabName || source}
        </span>
      );
    }
    if (source.includes("Return")) {
      return <span className="path-badge-source path-source-return">{source}</span>;
    }
    return <span className="path-badge-source path-source-inhouse">{source || "In-house"}</span>;
  };

  const getParametersForTest = (testName = "") => {
    for (const key of Object.keys(SAMPLE_PARAM_DEFAULTS)) {
      if (testName.toLowerCase().includes(key.toLowerCase().split(" ")[0])) {
        return SAMPLE_PARAM_DEFAULTS[key];
      }
    }
    return SAMPLE_PARAM_DEFAULTS["Complete Blood Count (CBC)"] || [];
  };

  return (
    <div className="pathology-module-container lifeline-style">
      {/* ── 1. ULTRA-CLEAN EXECUTIVE TOP HEADER (WITH QUICK ACTIONS) ── */}
      <header className="path-exec-header">
        <div className="exec-brand-group">
          <div className="exec-brand-icon">
            <Icon name="LuFlaskConical" size={20} />
          </div>
          <div>
            <div className="exec-title-row">
              <h1 className="exec-title">Pathology Dashboard</h1>
            </div>
            <p className="exec-subtitle">
              Diagnostic Pathology, Automated Analyzers &amp; Laboratory Operations
            </p>
          </div>
        </div>

        <div className="exec-actions-group">
          <button
            type="button"
            className="btn-exec-primary"
            onClick={() => navigate("/laboratory/add-test-report")}
          >
            <Icon name="LuPlus" size={15} /> + New Test Request
          </button>
        </div>
      </header>

      {/* ── 2. 6 KPI METRIC CARDS IN A ROW ── */}
      <div className="path-kpi-row">
        {/* Card 1: Today's Requests */}
        <div className="kpi-card-item kpi-blue">
          <div className="kpi-icon-square bg-sky-100 text-sky-600">
            <Icon name="LuFlaskConical" size={19} />
          </div>
          <div className="kpi-info-block">
            <div className="kpi-main-number">{totalCount}</div>
            <div className="kpi-sub-title">Today&apos;s Requests</div>
          </div>
        </div>

        {/* Card 2: Samples Collected */}
        <div className="kpi-card-item kpi-emerald">
          <div className="kpi-icon-square bg-emerald-100 text-emerald-600">
            <Icon name="LuTestTube" size={19} />
          </div>
          <div className="kpi-info-block">
            <div className="kpi-main-number">{collectedCount}</div>
            <div className="kpi-sub-title">Samples Collected</div>
          </div>
        </div>

        {/* Card 3: In Process */}
        <div className="kpi-card-item kpi-amber">
          <div className="kpi-icon-square bg-amber-100 text-amber-600">
            <Icon name="LuClock" size={19} />
          </div>
          <div className="kpi-info-block">
            <div className="kpi-main-number">{inProcessCount}</div>
            <div className="kpi-sub-title">In Process</div>
          </div>
        </div>

        {/* Card 4: Reports Completed */}
        <div className="kpi-card-item kpi-indigo">
          <div className="kpi-icon-square bg-indigo-100 text-indigo-600">
            <Icon name="LuFileCheck" size={19} />
          </div>
          <div className="kpi-info-block">
            <div className="kpi-main-number">{reportedCount}</div>
            <div className="kpi-sub-title">Reports Completed</div>
          </div>
        </div>

        {/* Card 5: Pending Approval */}
        <div className="kpi-card-item kpi-rose">
          <div className="kpi-icon-square bg-rose-100 text-rose-600">
            <Icon name="LuUserCheck" size={19} />
          </div>
          <div className="kpi-info-block">
            <div className="kpi-main-number">{pendingCount}</div>
            <div className="kpi-sub-title">Pending Approval</div>
          </div>
        </div>
      </div>

      {/* ── 3. FILTERS SECTION (POSITIONED DIRECTLY BEFORE RECENT TEST REQUESTS) ── */}
      <div className="path-filter-card">
        <div className="filter-card-header">
          <div className="filter-card-title">
            <Icon name="LuSlidersHorizontal" size={15} className="text-sky-600" />
            <span>Pathology Dashboard Filters</span>
          </div>
          
        </div>

        <div className="filter-card-row">
          <div className="filter-item">
            <label>Date</label>
            <select
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
              className="filter-select"
            >
              <option value="Today">Today ({new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })})</option>
              <option value="Yesterday">Yesterday</option>
              <option value="This Week">This Week</option>
              <option value="Month">This Month</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Test Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="filter-select"
            >
              <option value="All">All Categories</option>
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Serology">Serology</option>
              <option value="Hormones">Hormones</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Urine & Stool">Urine &amp; Stool</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Sample Type</label>
            <select
              value={filters.sampleType}
              onChange={(e) => handleFilterChange("sampleType", e.target.value)}
              className="filter-select"
            >
              <option value="All">All Types</option>
              <option value="Blood">Blood</option>
              <option value="Urine">Urine</option>
              <option value="Serum">Serum</option>
              <option value="Plasma">Plasma</option>
              <option value="Swab">Swab</option>
              <option value="Tissue">Tissue</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="Collected">Collected</option>
              <option value="In Process">In Process</option>
              <option value="Reported">Reported</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Source</label>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange("source", e.target.value)}
              className="filter-select"
            >
              <option value="All">All Sources</option>
              <option value="In-house">In-house</option>
              <option value="Third Party (Send)">Third Party (Send)</option>
              <option value="Third Party (Return)">Third Party (Return)</option>
              <option value="Already Done">Already Done</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Doctor</label>
            <select
              value={filters.doctor}
              onChange={(e) => handleFilterChange("doctor", e.target.value)}
              className="filter-select"
            >
              <option value="All">All Doctors</option>
              <option value="Dr. Anil Singh">Dr. Anil Singh</option>
              <option value="Dr. Priya Gupta">Dr. Priya Gupta</option>
              <option value="Dr. Ramesh Yadav">Dr. Ramesh Yadav</option>
              <option value="Dr. Pooja Mishra">Dr. Pooja Mishra</option>
            </select>
          </div>

          <div className="filter-actions">
            <button type="button" className="btn-filter-apply" onClick={() => {}}>
              <Icon name="LuFilter" size={13} /> Apply
            </button>
            <button type="button" className="btn-filter-reset" onClick={handleResetFilters}>
              <Icon name="LuRotateCcw" size={13} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. RECENT TEST REQUESTS SECTION ── */}
      <div className="path-recent-requests-card">
        {/* Top Header of Table Card */}
        <div className="table-card-head">
          <div className="head-left-group">
            <Icon name="LuClipboardList" size={17} className="text-sky-600" />
            <h3>Recent Test Requests</h3>
           
          </div>
          <div className="head-right-group">
            <div className="table-search-inline">
              <Icon name="LuSearch" size={14} />
              <input
                type="text"
                placeholder="Search by patient, UHID or test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")}>
                  ✕
                </button>
              )}
            </div>
            <span
              className="link-view-all-reports"
              onClick={() => navigate("/laboratory/report-summary")}
            >
              View All Reports →
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-scroll-container">
          <table className="compact-data-table full-grid-table">
            <thead>
              <tr>
                <th style={{ width: "30px" }}>#</th>
                <th style={{ width: "95px" }}>UHID</th>
                <th>PATIENT NAME</th>
                <th>AGE / GENDER</th>
                <th>TEST NAME</th>
                <th>SAMPLE TYPE</th>
                <th>SOURCE</th>
                <th>STATUS</th>
                <th>REQUESTED BY</th>
                <th>REQUEST TIME</th>
                <th style={{ textAlign: "center", width: "70px" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", padding: "28px" }}>
                    <div className="path-loading-spinner"></div>
                    <p style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
                      Connecting to laboratory database...
                    </p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", padding: "28px 14px" }}>
                    <div className="compact-empty-state">
                      <Icon name="LuFlaskConical" size={26} style={{ color: "#94a3b8" }} />
                      <h4>No Lab Test Requests Found</h4>
                      <p>
                        There are no lab test requests matching the selected filters. Use the &quot;+ New Test Request&quot; button above to create a lab order.
                      </p>
                      <button
                        type="button"
                        className="btn-exec-primary"
                        style={{ margin: "10px auto 0", maxWidth: "180px" }}
                        onClick={() => navigate("/laboratory/add-test-report")}
                      >
                        <Icon name="LuPlus" size={14} /> + New Test Request
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req, idx) => (
                  <tr key={req.id || idx}>
                    <td className="text-muted text-xs">{idx + 1}</td>
                    <td>
                      <span className="compact-uhid-badge">{req.uhid}</span>
                    </td>
                    <td className="font-bold text-slate-900">{req.patientName}</td>
                    <td className="text-muted text-xs">{req.ageGender}</td>
                    <td className="font-semibold text-slate-800">{req.testName}</td>
                    <td className="text-xs text-sky-700 font-medium">{req.sampleType}</td>
                    <td>{getSourceBadge(req.source, req)}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td className="text-xs text-slate-700">{req.requestedBy}</td>
                    <td className="text-xs text-muted">{req.requestTime}</td>
                    <td>
                      <div className="compact-action-btns">
                        <button
                          type="button"
                          className="btn-compact-icon"
                          title="View Investigation Report"
                          onClick={() => setActiveReportModal(req)}
                        >
                          <Icon name="LuEye" size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-compact-icon"
                          title="Print Barcode Slip"
                          onClick={() => setActiveSlipModal(req)}
                        >
                          <Icon name="LuPrinter" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: REPORT VIEW / PRINT ── */}
      {activeReportModal && (
        <div className="path-modal-overlay">
          <div className="path-modal-container report-modal-width">
            <div className="path-modal-header no-print">
              <h3>Diagnostic Pathology Investigation Report</h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setActiveReportModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="path-modal-body print-area">
              <div className="report-print-sheet">
                <div className="report-hospital-head">
                  <div className="rep-brand-left">
                    <h2>NARAYAN HOSPITAL</h2>
                    <p className="rep-brand-tag">Super Speciality Healthcare &amp; Research Center</p>
                    <p className="rep-brand-addr">Bhelupur, Varanasi, Uttar Pradesh - 221010 | Helpline: +91 542 2277000</p>
                    <p className="rep-brand-accred">NABH Accredited | NABL Certified Diagnostic Laboratory</p>
                  </div>
                  <div className="rep-dept-box">
                    <span className="rep-dept-title">DEPARTMENT OF PATHOLOGY</span>
                    <span className="rep-dept-code">LAB REF: {activeReportModal.barcode}</span>
                  </div>
                </div>

                <div className="report-divider-heavy"></div>

                <div className="report-patient-grid">
                  <div className="rep-field-col">
                    <div className="rep-field">
                      <span className="rep-f-label">UHID:</span>
                      <span className="rep-f-val font-bold">{activeReportModal.uhid}</span>
                    </div>
                    <div className="rep-field">
                      <span className="rep-f-label">Patient Name:</span>
                      <span className="rep-f-val font-bold">{activeReportModal.patientName}</span>
                    </div>
                    <div className="rep-field">
                      <span className="rep-f-label">Age / Gender:</span>
                      <span className="rep-f-val">{activeReportModal.ageGender}</span>
                    </div>
                  </div>

                  <div className="rep-field-col">
                    <div className="rep-field">
                      <span className="rep-f-label">Barcode / Specimen:</span>
                      <span className="rep-f-val">{activeReportModal.barcode}</span>
                    </div>
                    <div className="rep-field">
                      <span className="rep-f-label">Referred By:</span>
                      <span className="rep-f-val">{activeReportModal.requestedBy}</span>
                    </div>
                    <div className="rep-field">
                      <span className="rep-f-label">Sample Type:</span>
                      <span className="rep-f-val">{activeReportModal.sampleType}</span>
                    </div>
                  </div>

                  <div className="rep-field-col">
                    <div className="rep-field">
                      <span className="rep-f-label">Registered:</span>
                      <span className="rep-f-val">{activeReportModal.requestDate} {activeReportModal.requestTime}</span>
                    </div>
                    <div className="rep-field">
                      <span className="rep-f-label">Report Date:</span>
                      <span className="rep-f-val">{activeReportModal.reportDate || "Today"}</span>
                    </div>
                    <div className="rep-field">
                      <span className="rep-f-label">Status:</span>
                      <span className="rep-f-val font-semibold text-emerald-700">{activeReportModal.status}</span>
                    </div>
                  </div>
                </div>

                <div className="report-divider-light"></div>

                <div className="report-tests-section">
                  <h4 className="report-section-heading">INVESTIGATION REPORT: {activeReportModal.testName}</h4>
                  <table className="report-params-table">
                    <thead>
                      <tr>
                        <th>Investigation Parameter</th>
                        <th>Observed Result</th>
                        <th>Reference Biological Range</th>
                        <th>Units</th>
                        <th>Interpretation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getParametersForTest(activeReportModal.testName).map((p, idx) => (
                        <tr key={idx} className={p.status === "Abnormal" ? "row-flag-abnormal" : ""}>
                          <td className="font-semibold">{p.name}</td>
                          <td className={`font-bold ${p.status === "Abnormal" ? "text-red-600" : "text-navy"}`}>
                            {p.result}
                          </td>
                          <td className="text-slate">{p.range}</td>
                          <td className="text-muted">{p.unit}</td>
                          <td>
                            {p.status === "Abnormal" ? (
                              <span className="param-flag-abnormal">HIGH / ATTN</span>
                            ) : (
                              <span className="param-flag-normal">NORMAL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="report-notes-block">
                  <p className="note-title">Methodology &amp; Quality Control Notes:</p>
                  <p className="note-body">
                    Automated analysis calibrated against verified clinical reference controls. Results relate only to the specimen tested. Clinical correlation is recommended by treating consultant.
                  </p>
                </div>

                <div className="report-signatures-row">
                  <div className="sig-box">
                    <div className="sig-line"></div>
                    <p className="sig-name">Manoj Kumar, DMLT</p>
                    <p className="sig-role">Senior Medical Lab Technologist</p>
                  </div>
                  <div className="sig-box">
                    <div className="sig-line"></div>
                    <p className="sig-name">{activeReportModal.approvedBy || "Dr. S. Mehta"}</p>
                    <p className="sig-role">MD (Pathology), Consultant Pathologist</p>
                  </div>
                </div>

                <div className="report-sheet-footer">
                  <span>Narayan Hospital HIMS Electronic Laboratory System</span>
                  <span>Page 1 of 1</span>
                  <span>End of Diagnostic Report</span>
                </div>
              </div>
            </div>

            <div className="path-modal-footer no-print">
              <button
                type="button"
                className="path-btn-reset"
                onClick={() => setActiveReportModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-quick-primary"
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={15} /> Print Official Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: SAMPLE BARCODE SLIP ── */}
      {activeSlipModal && (
        <div className="path-modal-overlay">
          <div className="path-modal-container slip-modal-width">
            <div className="path-modal-header no-print">
              <h3>Sample Barcode Requisition Slip</h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setActiveSlipModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="path-modal-body print-area">
              <div className="barcode-slip-card">
                <div className="slip-hospital-title">
                  <strong>NARAYAN HOSPITAL LAB</strong>
                </div>
                <div className="slip-barcode-render">
                  <div className="fake-barcode-lines">
                    <div className="barcode-bars-graphic"></div>
                  </div>
                  <div className="slip-barcode-text font-mono font-bold">
                    {activeSlipModal.barcode}
                  </div>
                </div>
                <div className="slip-details-grid">
                  <div><strong>UHID:</strong> {activeSlipModal.uhid}</div>
                  <div><strong>Patient:</strong> {activeSlipModal.patientName}</div>
                  <div><strong>Age/Sex:</strong> {activeSlipModal.ageGender}</div>
                  <div><strong>Specimen:</strong> {activeSlipModal.sampleType}</div>
                  <div><strong>Tests:</strong> {activeSlipModal.testName}</div>
                  <div><strong>Source:</strong> {activeSlipModal.source}</div>
                  <div><strong>Collected:</strong> {activeSlipModal.requestDate} {activeSlipModal.requestTime}</div>
                  <div><strong>Doctor:</strong> {activeSlipModal.requestedBy}</div>
                </div>
              </div>
            </div>

            <div className="path-modal-footer no-print">
              <button
                type="button"
                className="path-btn-reset"
                onClick={() => setActiveSlipModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-quick-primary"
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={15} /> Print Barcode Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
