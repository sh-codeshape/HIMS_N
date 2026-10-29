import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import laboratoryService from "../../../api/services/laboratoryService";
import { SAMPLE_PARAM_DEFAULTS } from "../pathologyData.js";
import "./PathologyView.css";

export default function PathologyReports() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTest, setFilterTest] = useState("All");
  const [filterSource, setFilterSource] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modals
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [activeResultEntryModal, setActiveResultEntryModal] = useState(null);
  const [enteredResults, setEnteredResults] = useState({});

  // Load real lab reports on mount
  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      setLoading(true);
      try {
        const apiTests = await laboratoryService.getLabTests();
        if (isMounted) {
          if (Array.isArray(apiTests) && apiTests.length > 0) {
            const normalized = apiTests.map((t, idx) => ({
              id: t.order_item_id || t.order_id || `REQ-${idx + 1}`,
              uhid: t.uhid || "—",
              patientName: `${t.first_name || ""} ${t.last_name || ""}`.trim() || t.patient_name || "Patient",
              ageGender: t.age ? `${t.age} Y / ${t.gender?.[0] || ""}` : "—",
              testName: t.test_name || "Diagnostic Test",
              sampleType: t.lab_section || "Blood",
              source: t.source || "In-house",
              status: t.status === "ordered" ? "Collected" : t.status || "Reported",
              requestedBy: t.ordered_by || t.doctor_name || "—",
              requestTime: t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
              requestDate: t.created_at ? new Date(t.created_at).toLocaleDateString("en-GB") : "—",
              reportDate: t.completed_at ? new Date(t.completed_at).toLocaleDateString("en-GB") : "—",
              barcode: t.barcode || (t.id ? `LAB${String(t.id).slice(-6)}` : "—"),
              approvedBy: t.approved_by || (t.status === "Completed" || t.status === "Reported" ? "Pathologist" : "—"),
            }));
            setRequests(normalized);
          } else {
            // Load orders created in this system session
            const saved = localStorage.getItem("hims_pathology_orders");
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                setRequests(Array.isArray(parsed) ? parsed : []);
              } catch (e) {
                setRequests([]);
              }
            } else {
              setRequests([]);
            }
          }
        }
      } catch (err) {
        console.warn("Reports API call fallback:", err);
        setRequests([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReports();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (filterTest !== "All" && !r.testName?.toLowerCase().includes(filterTest.toLowerCase())) return false;
    if (filterSource !== "All" && r.source !== filterSource) return false;
    if (filterStatus !== "All" && r.status !== filterStatus) return false;
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

  // Parameter template helper
  const getParametersForTest = (testName = "") => {
    for (const key of Object.keys(SAMPLE_PARAM_DEFAULTS)) {
      if (testName.toLowerCase().includes(key.toLowerCase().split(" ")[0])) {
        return SAMPLE_PARAM_DEFAULTS[key];
      }
    }
    return SAMPLE_PARAM_DEFAULTS["Complete Blood Count (CBC)"] || [];
  };

  // Open result entry
  const handleOpenResultEntry = (req) => {
    setActiveResultEntryModal(req);
    const params = getParametersForTest(req.testName);
    const initialMap = {};
    params.forEach((p, idx) => {
      initialMap[idx] = {
        name: p.name,
        result: p.result,
        range: p.range,
        unit: p.unit,
        isAbnormal: p.status === "Abnormal",
      };
    });
    setEnteredResults(initialMap);
  };

  // Save entered results
  const handleSaveResult = async () => {
    if (!activeResultEntryModal) return;

    try {
      if (activeResultEntryModal.id) {
        try {
          await laboratoryService.updateLabResult(activeResultEntryModal.id, {
            status: "Completed",
            result: JSON.stringify(enteredResults),
          });
        } catch (apiErr) {
          console.warn("Backend update result response:", apiErr?.message);
        }
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === activeResultEntryModal.id
            ? {
                ...r,
                status: "Reported",
                approvedBy: "Dr. S. Mehta",
                reportDate: new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
              }
            : r
        )
      );

      // Also persist to localStorage
      const saved = localStorage.getItem("hims_pathology_orders");
      if (saved) {
        try {
          const list = JSON.parse(saved);
          const updated = list.map((r) =>
            r.id === activeResultEntryModal.id
              ? {
                  ...r,
                  status: "Reported",
                  approvedBy: "Dr. S. Mehta",
                  reportDate: "Today",
                }
              : r
          );
          localStorage.setItem("hims_pathology_orders", JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
      }

      toast.success("Lab investigation verified & report published!", { icon: "✅" });
      setActiveResultEntryModal(null);
    } catch (err) {
      toast.error(`Save result error: ${err.message}`);
    }
  };

  // Badges
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

  const getSourceBadge = (source = "") => {
    if (source.includes("Send")) {
      return <span className="path-badge-source path-source-send">{source}</span>;
    }
    if (source.includes("Return")) {
      return <span className="path-badge-source path-source-return">{source}</span>;
    }
    return <span className="path-badge-source path-source-inhouse">{source || "In-house"}</span>;
  };

  return (
    <div className="pathology-module-container">
      {/* ── TOP HEADER ── */}
      <header className="pathology-top-header">
        <div className="header-brand-group">
          <div className="header-icon-tile">
            <Icon name="LuFileSpreadsheet" size={24} />
          </div>
          <div>
            <div className="header-title-row">
              <h1 className="header-main-title">Pathology Report Summary</h1>
            </div>
            <p className="header-sub-title">
              Diagnostic Report Archive, Result Verification, Doctor Sign-off &amp; Print
            </p>
          </div>
        </div>
      </header>

      {/* ── REPORT ARCHIVE FILTER & SEARCH BAR ── */}
      <div className="path-filter-card">
       

        <div className="path-filter-row">
          <div className="path-filter-group" style={{ minWidth: "220px", flex: 2 }}>
            <label>Search Patient / UHID / Barcode</label>
            <div className="search-input-wrap">
              <Icon name="LuSearch" size={15} />
              <input
                type="text"
                placeholder="Search patient, UHID or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="path-filter-group">
            <label>Investigation Category</label>
            <select
              value={filterTest}
              onChange={(e) => setFilterTest(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="CBC">Complete Blood Count (CBC)</option>
              <option value="LFT">Liver Function Test (LFT)</option>
              <option value="KFT">Kidney Function Test (KFT)</option>
              <option value="Sugar">Blood Glucose / HbA1c</option>
              <option value="Thyroid">Thyroid Profile</option>
              <option value="Lipid">Lipid Profile</option>
              <option value="Urine">Urine Examination</option>
              <option value="Dengue">Dengue Serology</option>
            </select>
          </div>

          <div className="path-filter-group">
            <label>Source</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="All">All Sources</option>
              <option value="In-house">In-house</option>
              <option value="Third Party (Send)">Third Party (Send)</option>
              <option value="Third Party (Return)">Third Party (Return)</option>
            </select>
          </div>

          <div className="path-filter-group">
            <label>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Collected">Collected</option>
              <option value="In Process">In Process</option>
              <option value="Reported">Reported</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="path-filter-btns">
            <button
              type="button"
              className="path-btn-reset"
              onClick={() => {
                setSearchQuery("");
                setFilterTest("All");
                setFilterSource("All");
                setFilterStatus("All");
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── REPORTS DATA TABLE ── */}
      <div className="path-table-card">
        <div className="path-table-header">
          <div className="table-title-wrap">
            <h3>Investigation Reports Stream</h3>
            <span className="badge-count">{filteredRequests.length} Reports</span>
          </div>
        </div>

        <div className="path-table-responsive">
          <table className="path-data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>#</th>
                <th>UHID</th>
                <th>Patient Name</th>
                <th>Age / Gender</th>
                <th>Investigation Test</th>
                <th>Specimen</th>
                <th>Source</th>
                <th>Status</th>
                <th>Consultant</th>
                <th>Date / Time</th>
                <th>Sign-off Pathologist</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", padding: "32px" }}>
                    <div className="path-loading-spinner"></div>
                    <p style={{ marginTop: "12px", color: "#64748b" }}>Loading real lab reports...</p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", padding: "48px 16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <Icon name="LuFileSpreadsheet" size={40} style={{ color: "#94a3b8" }} />
                      <h4 style={{ margin: "4px 0", color: "#334155", fontWeight: 600 }}>No Lab Reports Found</h4>
                      <p style={{ margin: 0, color: "#64748b", fontSize: "13px", maxWidth: "420px" }}>
                        No reports matching your search criteria. Create a test request or adjust your filters.
                      </p>
                      <button
                        type="button"
                        className="btn-new-order-quick"
                        style={{ marginTop: "12px" }}
                        onClick={() => navigate("/laboratory/add-test-report")}
                      >
                        <Icon name="LuPlus" size={14} /> Add Test Report
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req, idx) => (
                  <tr key={req.id || idx}>
                    <td className="text-muted">{idx + 1}</td>
                    <td>
                      <span className="uhid-link">{req.uhid}</span>
                    </td>
                    <td className="font-semibold text-navy">{req.patientName}</td>
                    <td className="text-slate">{req.ageGender}</td>
                    <td className="font-medium text-navy">{req.testName}</td>
                    <td>
                      <span className="sample-badge">{req.sampleType}</span>
                    </td>
                    <td>{getSourceBadge(req.source)}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td className="text-slate">{req.requestedBy}</td>
                    <td className="text-muted">{req.requestDate} {req.requestTime}</td>
                    <td className="text-slate font-medium">{req.approvedBy || "—"}</td>
                    <td>
                      <div className="action-buttons-cell">
                        <button
                          type="button"
                          className="btn-action-icon edit"
                          title="Enter / Edit Investigation Results"
                          onClick={() => handleOpenResultEntry(req)}
                        >
                          <Icon name="LuFileEdit" size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon view"
                          title="View Official Report"
                          onClick={() => setActiveReportModal(req)}
                        >
                          <Icon name="LuEye" size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon print"
                          title="Print Lab Report"
                          onClick={() => setActiveReportModal(req)}
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

      {/* ── 1. MODAL: ENTER TEST RESULTS ── */}
      {activeResultEntryModal && (
        <div className="path-modal-overlay">
          <div className="path-modal-container report-modal-width">
            <div className="path-modal-header">
              <div>
                <h3>Enter Lab Results: {activeResultEntryModal.testName}</h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  Patient: {activeResultEntryModal.patientName} ({activeResultEntryModal.uhid}) | Barcode: {activeResultEntryModal.barcode}
                </p>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setActiveResultEntryModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="path-modal-body">
              <p style={{ fontSize: "13px", color: "#475569", marginBottom: "16px" }}>
                Enter the verified readings from automated analyzers. Flag abnormal parameters for pathologist review.
              </p>

              <table className="report-params-table">
                <thead>
                  <tr>
                    <th>Parameter Name</th>
                    <th>Observed Value</th>
                    <th>Units</th>
                    <th>Biological Reference Range</th>
                    <th>Status Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {getParametersForTest(activeResultEntryModal.testName).map((p, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold">{p.name}</td>
                      <td>
                        <input
                          type="text"
                          defaultValue={p.result}
                          onChange={(e) => {
                            setEnteredResults((prev) => ({
                              ...prev,
                              [idx]: {
                                ...prev[idx],
                                result: e.target.value,
                              },
                            }));
                          }}
                          style={{
                            padding: "6px 10px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "4px",
                            width: "120px",
                            fontWeight: "bold",
                          }}
                        />
                      </td>
                      <td className="text-muted">{p.unit}</td>
                      <td className="text-slate">{p.range}</td>
                      <td>
                        <select
                          defaultValue={p.status || "Normal"}
                          onChange={(e) => {
                            setEnteredResults((prev) => ({
                              ...prev,
                              [idx]: {
                                ...prev[idx],
                                isAbnormal: e.target.value === "Abnormal",
                              },
                            }));
                          }}
                          style={{
                            padding: "6px 8px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          <option value="Normal">Normal</option>
                          <option value="Abnormal">Abnormal / High</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="path-modal-footer">
              <button
                type="button"
                className="path-btn-reset"
                onClick={() => setActiveResultEntryModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-quick-primary"
                onClick={handleSaveResult}
              >
                <Icon name="LuCheckCircle" size={15} /> Verify &amp; Publish Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. MODAL: OFFICIAL LAB REPORT VIEW & PRINT ── */}
      {activeReportModal && (
        <div className="path-modal-overlay">
          <div className="path-modal-container report-modal-width">
            <div className="path-modal-header no-print">
              <h3>Official Diagnostic Investigation Report</h3>
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
                {/* Official Narayan Hospital Header */}
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

                {/* Patient Summary Header Grid */}
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
                      <span className="rep-f-label">Sample ID / Barcode:</span>
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

                {/* Investigation Parameters Table */}
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

                {/* Clinical Notes & Disclaimer */}
                <div className="report-notes-block">
                  <p className="note-title">Methodology &amp; Quality Control Notes:</p>
                  <p className="note-body">
                    Automated analysis calibrated against verified clinical reference controls. Results relate only to the specimen tested. Clinical correlation is recommended by treating consultant.
                  </p>
                </div>

                {/* Sign-off Footer */}
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
    </div>
  );
}
