import React, { useState } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import PathologyDashboard from "./PathologyDashboard.jsx";
import PathologyTestRequest from "./PathologyTestRequest.jsx";
import PathologyReports from "./PathologyReports.jsx";
import {
  SAMPLE_PARAM_DEFAULTS,
} from "../pathologyData.js";
import "./PathologyView.css";

export default function PathologyView({ initialTab = "dashboard" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [requests, setRequests] = useState([]);

  // Modals state
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [activeSlipModal, setActiveSlipModal] = useState(null);
  const [activeResultEntryModal, setActiveResultEntryModal] = useState(null);

  // Add new request
  const handleAddRequest = (newReq) => {
    setRequests((prev) => [newReq, ...prev]);
  };

  // Open Lab Report Modal
  const handleOpenReport = (req) => {
    setActiveReportModal(req);
  };

  // Open Barcode / Sample Slip Modal
  const handleOpenSlip = (req) => {
    setActiveSlipModal(req);
  };

  // Open Result Entry Modal
  const handleOpenResultEntry = (req) => {
    setActiveResultEntryModal(req);
  };

  // Save entered results
  const handleSaveResult = (reqId, updatedData) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: "Reported",
              approvedBy: "Dr. S. Mehta",
              reportDate: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              ...updatedData,
            }
          : r
      )
    );
    setActiveResultEntryModal(null);
    toast.success("Lab test parameters verified & report published!", { icon: "✅" });
  };

  // Get parameters for report display
  const getParametersForTest = (testName) => {
    for (const key of Object.keys(SAMPLE_PARAM_DEFAULTS)) {
      if (testName.toLowerCase().includes(key.toLowerCase().split(" ")[0])) {
        return SAMPLE_PARAM_DEFAULTS[key];
      }
    }
    return SAMPLE_PARAM_DEFAULTS["Complete Blood Count (CBC)"];
  };

  return (
    <div className="pathology-module-container">
      {/* ── TOP HEADER (NARAYAN HOSPITAL HIMS) ── */}
      <header className="pathology-top-header">
        <div className="header-brand-group">
          <div className="header-icon-tile">
            <Icon name="LuFlaskConical" size={24} />
          </div>
          <div>
            <div className="header-title-row">
              <h1 className="header-main-title">Pathology &amp; Laboratory</h1>
             
            </div>
            <p className="header-sub-title">
              Diagnostic Pathology, Automated Analyzers &amp; Clinical Investigation Center
            </p>
          </div>
        </div>

        <div className="header-meta-group">
          <div className="live-status-badge">
            <span className="live-dot-pulse"></span>
            <span>Lab Online</span>
          </div>

          <div className="header-date-badge">
            <Icon name="LuCalendar" size={14} />
            <span>23 Oct 2026, Thu</span>
          </div>

          <button
            type="button"
            className="btn-new-order-quick"
            onClick={() => setActiveTab("test-request")}
          >
            <Icon name="LuPlus" size={15} /> + New Test Request
          </button>
        </div>
      </header>

      {/* ── NAVIGATION TABS (MATCHING THE 3 SCREENS IN IMAGE) ── */}
      <nav className="pathology-nav-tabs">
        <button
          type="button"
          className={`path-tab-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <Icon name="LuLayoutDashboard" size={16} />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className={`path-tab-item ${activeTab === "test-request" ? "active" : ""}`}
          onClick={() => setActiveTab("test-request")}
        >
          <Icon name="LuClipboardList" size={16} />
          <span>Test Request</span>
        </button>

        <button
          type="button"
          className={`path-tab-item ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          <Icon name="LuFileSpreadsheet" size={16} />
          <span>Reports</span>
          <span className="tab-pill-count">{requests.length}</span>
        </button>

        <button
          type="button"
          className={`path-tab-item ${activeTab === "templates" ? "active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          <Icon name="LuSettings" size={16} />
          <span>Template Settings</span>
        </button>
      </nav>

      {/* ── TAB CONTENT VIEWS ── */}
      <main className="pathology-tab-content">
        {activeTab === "dashboard" && (
          <PathologyDashboard
            requests={requests}
            onNavigateTab={setActiveTab}
            onViewReport={handleOpenReport}
            onPrintSlip={handleOpenSlip}
          />
        )}

        {activeTab === "test-request" && (
          <PathologyTestRequest
            onAddRequest={handleAddRequest}
            onNavigateTab={setActiveTab}
            onPrintSlip={handleOpenSlip}
          />
        )}

        {activeTab === "reports" && (
          <PathologyReports
            requests={requests}
            onViewReport={handleOpenReport}
            onEnterResult={handleOpenResultEntry}
          />
        )}

        {activeTab === "templates" && (
          <div className="template-settings-view">
            <div className="path-table-card">
              <div className="path-table-header">
                <h3>Lab Investigation Template Settings</h3>
                <button
                  type="button"
                  className="btn-quick-primary"
                  onClick={() => toast.success("New template builder opened")}
                >
                  <Icon name="LuPlus" size={14} /> Add New Template
                </button>
              </div>
              <p className="text-muted" style={{ padding: "16px 20px" }}>
                Configure department parameters, biological reference ranges, units, and automated analyzer protocols for Narayan Hospital Pathology.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── 1. MODAL: CLINICAL LAB REPORT PRINT / VIEW ── */}
      {activeReportModal && (
        <div className="path-modal-overlay">
          <div className="path-modal-container report-modal-width">
            <div className="path-modal-header no-print">
              <h3>Diagnostic Pathology Investigation Report</h3>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setActiveReportModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="path-modal-body" id="printable-lab-report">
              {/* Report Letterhead Header */}
              <div className="report-letterhead">
                <div className="lh-hospital-info">
                  <h2 className="hospital-name">NARAYAN HOSPITAL &amp; RESEARCH CENTRE</h2>
                  <p className="hospital-sub">
                    Multi-Speciality Hospital &amp; NABL Accredited Diagnostic Laboratory
                  </p>
                  <p className="hospital-address">
                    Bhelupur, Varanasi, Uttar Pradesh - 221010 • Phone: +91 542 227788 • Email: lab@narayanhospital.com
                  </p>
                </div>
                <div className="lh-badge-wrap">
                  <span className="lh-report-title">FINAL PATHOLOGY REPORT</span>
                  <span className="barcode-sample-text">{activeReportModal.barcode || "LAB20261023001"}</span>
                </div>
              </div>

              {/* Patient Demographics Strip */}
              <div className="report-patient-grid">
                <div className="rp-item">
                  <span className="rp-lbl">UHID:</span>
                  <span className="rp-val bold font-mono">{activeReportModal.uhid}</span>
                </div>
                <div className="rp-item">
                  <span className="rp-lbl">Patient Name:</span>
                  <span className="rp-val bold">{activeReportModal.patientName}</span>
                </div>
                <div className="rp-item">
                  <span className="rp-lbl">Age / Gender:</span>
                  <span className="rp-val">{activeReportModal.ageGender}</span>
                </div>
                <div className="rp-item">
                  <span className="rp-lbl">Referred By:</span>
                  <span className="rp-val">{activeReportModal.requestedBy}</span>
                </div>
                <div className="rp-item">
                  <span className="rp-lbl">Sample Collected:</span>
                  <span className="rp-val">{activeReportModal.requestDate} {activeReportModal.requestTime}</span>
                </div>
                <div className="rp-item">
                  <span className="rp-lbl">Report Date:</span>
                  <span className="rp-val">{activeReportModal.reportDate || "23 Oct 2026"}</span>
                </div>
                <div className="rp-item">
                  <span className="rp-lbl">Sample Type:</span>
                  <span className="rp-val">{activeReportModal.sampleType}</span>
                </div>
                <div className="rp-item">
                  <span className="rp-lbl">Source:</span>
                  <span className="rp-val">{activeReportModal.source}</span>
                </div>
              </div>

              {/* Test Heading */}
              <div className="report-test-banner">
                <span>Investigation: <strong>{activeReportModal.testName}</strong></span>
                <span className="method-tag">Method: Fully Automated Analyzer</span>
              </div>

              {/* Parameters Table */}
              <table className="report-params-table">
                <thead>
                  <tr>
                    <th>Test Parameter</th>
                    <th>Observed Value</th>
                    <th>Unit</th>
                    <th>Biological Reference Range</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getParametersForTest(activeReportModal.testName).map((param, i) => (
                    <tr key={i}>
                      <td className="font-semibold">{param.parameter}</td>
                      <td className="observed-value-cell font-mono">
                        <strong>{param.observed}</strong>
                      </td>
                      <td className="text-muted">{param.unit}</td>
                      <td className="text-slate">{param.normalRange}</td>
                      <td>
                        <span className="param-status-ok">{param.status || "Normal"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Interpretation Note */}
              <div className="report-notes-box">
                <p className="note-title">Clinical Interpretation &amp; Remarks:</p>
                <p className="note-body">
                  Specimen processed in automated dual-wavelength analyzer. Internal quality controls (IQC) run and verified within ±2 SD limits. Correlation with clinical findings and history is recommended.
                </p>
              </div>

              {/* Signatures Footer */}
              <div className="report-signatures-footer">
                <div className="sig-block">
                  <div className="sig-line-dash"></div>
                  <span className="sig-title">Riya Patel, DMLT</span>
                  <span className="sig-sub">Medical Lab Technologist</span>
                </div>

                <div className="sig-block right">
                  <div className="sig-line-dash"></div>
                  <span className="sig-title">Dr. S. Mehta, MD (Pathology)</span>
                  <span className="sig-sub">Consultant Pathologist &amp; Lab Incharge</span>
                  <span className="sig-reg">Reg. No: UP-48192</span>
                </div>
              </div>
            </div>

            <div className="path-modal-footer no-print">
              <button
                type="button"
                className="btn-print-action"
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={15} /> Print Report
              </button>
              <button
                type="button"
                className="btn-close-action"
                onClick={() => setActiveReportModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. MODAL: SAMPLE BARCODE / TOKEN SLIP ── */}
      {activeSlipModal && (
        <div className="path-modal-overlay">
          <div className="path-modal-container slip-modal-width">
            <div className="path-modal-header no-print">
              <h3>Sample Barcode &amp; Accession Slip</h3>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setActiveSlipModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="path-modal-body" id="printable-sample-slip">
              <div className="barcode-slip-card">
                <div className="slip-top-hospital">
                  <h4>Narayan Hospital — Pathology</h4>
                  <span>Phlebotomy Token</span>
                </div>

                <div className="barcode-mock-render">
                  <div className="barcode-bars-graphic">
                    ||| | |||| | ||| |||| | || ||| |||| |
                  </div>
                  <div className="barcode-string">{activeSlipModal.barcode || "LAB20261023001"}</div>
                </div>

                <div className="slip-kv-list">
                  <div className="kv-row">
                    <span className="lbl">Patient:</span>
                    <span className="val bold">{activeSlipModal.patientName}</span>
                  </div>
                  <div className="kv-row">
                    <span className="lbl">UHID:</span>
                    <span className="val">{activeSlipModal.uhid}</span>
                  </div>
                  <div className="kv-row">
                    <span className="lbl">Tests:</span>
                    <span className="val bold">{activeSlipModal.testName}</span>
                  </div>
                  <div className="kv-row">
                    <span className="lbl">Sample:</span>
                    <span className="val">{activeSlipModal.sampleType}</span>
                  </div>
                  <div className="kv-row">
                    <span className="lbl">Date/Time:</span>
                    <span className="val">{activeSlipModal.requestDate} {activeSlipModal.requestTime}</span>
                  </div>
                  <div className="kv-row">
                    <span className="lbl">Total Fee:</span>
                    <span className="val bold">₹ {activeSlipModal.totalAmount || 300} (Paid)</span>
                  </div>
                </div>

                <p className="slip-tube-instruction">
                  * Affix barcode vertically on sample vacutainer tube before centrifugation.
                </p>
              </div>
            </div>

            <div className="path-modal-footer no-print">
              <button
                type="button"
                className="btn-print-action"
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={15} /> Print Tube Barcode
              </button>
              <button
                type="button"
                className="btn-close-action"
                onClick={() => setActiveSlipModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. MODAL: ENTER LAB RESULT FINDINGS ── */}
      {activeResultEntryModal && (
        <div className="path-modal-overlay">
          <div className="path-modal-container result-modal-width">
            <div className="path-modal-header">
              <h3>Enter Findings for {activeResultEntryModal.patientName}</h3>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setActiveResultEntryModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="path-modal-body">
              <div className="result-patient-summary">
                <span>UHID: <strong>{activeResultEntryModal.uhid}</strong></span>
                <span>Test: <strong>{activeResultEntryModal.testName}</strong></span>
                <span>Sample: <strong>{activeResultEntryModal.sampleType}</strong></span>
              </div>

              <div className="result-inputs-list">
                {getParametersForTest(activeResultEntryModal.testName).map((p, idx) => (
                  <div key={idx} className="result-param-input-row">
                    <div className="param-label-col">
                      <span className="param-name">{p.parameter}</span>
                      <span className="param-norm">Ref: {p.normalRange} {p.unit}</span>
                    </div>
                    <div className="param-field-col">
                      <input
                        type="text"
                        defaultValue={p.observed}
                        className="param-val-input"
                      />
                      <span className="param-unit-badge">{p.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="path-modal-footer">
              <button
                type="button"
                className="btn-quick-primary"
                onClick={() => handleSaveResult(activeResultEntryModal.id, {})}
              >
                <Icon name="LuCheckCheck" size={15} /> Publish &amp; Verify Report
              </button>
              <button
                type="button"
                className="btn-close-action"
                onClick={() => setActiveResultEntryModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
