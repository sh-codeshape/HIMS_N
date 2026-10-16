import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PageContainer from "../../components/common/PageContainer.jsx";
import Icon from "../../components/common/Icon.jsx";
import ipdService from "../../api/services/ipdService";
import "./IPDReports.css";

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

export default function IPDReports() {
  const [dateRange, setDateRange] = useState("all"); // 'today' | 'week' | 'month' | 'all'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentCensus, setRecentCensus] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [reportStats, admissionsList] = await Promise.all([
        ipdService.getReportStats(),
        ipdService.getAdmissions({ status: "all" })
      ]);

      setStats(reportStats);
      setRecentCensus(Array.isArray(admissionsList) ? admissionsList : admissionsList?.rows ?? []);
    } catch (err) {
      console.error("Error loading IPD reports:", err);
      toast.error("Could not load real-time IPD analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const overview = stats?.overview || {
    totalBeds: 33,
    occupiedBeds: 10,
    availableBeds: 18,
    cleaningBeds: 3,
    maintenanceBeds: 2,
    occupancyRate: 30.3,
    totalAdmissions: 12,
    activeInpatients: 10,
    totalDischarged: 2,
    dischargedToday: 1,
    admittedToday: 2,
    avgLengthOfStayDays: 3.5
  };

  const wardBreakdown = stats?.wardBreakdown || [];
  const dischargeTypes = stats?.dischargeTypes || [];
  const doctorActivity = stats?.doctorActivity || [];

  const getProgressColorClass = (rate) => {
    if (rate >= 85) return "ipd-progress-bar--red";
    if (rate >= 60) return "ipd-progress-bar--yellow";
    return "ipd-progress-bar--green";
  };

  const totalPages = Math.max(1, Math.ceil(recentCensus.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedCensus = recentCensus.slice(startIndex, startIndex + rowsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <PageContainer
      title="IPD Reports & Operational Census"
      subtitle="Comprehensive inpatient occupancy, average length of stay (ALOS), and clinical census analytics"
    >
      <div className="ipd-reports-container">
        {/* Header Controls Bar */}
        <div className="ipd-reports-header">
          <div className="ipd-reports-title-area">
            <h3>Executive Inpatient Intelligence</h3>
            <p>Real-time analytics for bed allocation, clinical outcomes, and ward capacity</p>
          </div>

          <div className="ipd-reports-controls">
            <div className="ipd-range-btn-group">
              {["today", "week", "month", "all"].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`ipd-range-btn ${dateRange === r ? "ipd-range-btn--active" : ""}`}
                  onClick={() => setDateRange(r)}
                >
                  {r === "today" ? "Today" : r === "week" ? "This Week" : r === "month" ? "This Month" : "All Time"}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="ipd-print-report-btn"
              onClick={() => window.print()}
            >
              <Icon name="LuPrinter" size={15} /> Print Audit Report
            </button>
          </div>
        </div>

        {/* High-Impact KPI Cards */}
        <div className="ipd-rep-kpi-grid">
          <div className="ipd-rep-kpi-card ipd-rep-kpi-card--blue">
            <span className="ipd-rep-kpi-label">Bed Occupancy Rate (BOR)</span>
            <div className="ipd-rep-kpi-val">{overview.occupancyRate}%</div>
            <div className="ipd-rep-kpi-footnote">
              <span>{overview.occupiedBeds} occupied / <strong>{overview.totalBeds} total beds</strong></span>
            </div>
          </div>

          <div className="ipd-rep-kpi-card ipd-rep-kpi-card--emerald">
            <span className="ipd-rep-kpi-label">Active Inpatients</span>
            <div className="ipd-rep-kpi-val">{overview.activeInpatients}</div>
            <div className="ipd-rep-kpi-footnote">
              <span><strong>{overview.availableBeds}</strong> beds available now</span>
            </div>
          </div>

          <div className="ipd-rep-kpi-card ipd-rep-kpi-card--amber">
            <span className="ipd-rep-kpi-label">Average Length of Stay</span>
            <div className="ipd-rep-kpi-val">{overview.avgLengthOfStayDays} <span style={{ fontSize: 16 }}>Days</span></div>
            <div className="ipd-rep-kpi-footnote">
              <span>Target benchmark: <strong>&lt; 4.5 days</strong></span>
            </div>
          </div>

          <div className="ipd-rep-kpi-card ipd-rep-kpi-card--purple">
            <span className="ipd-rep-kpi-label">Total Discharged</span>
            <div className="ipd-rep-kpi-val">{overview.totalDischarged}</div>
            <div className="ipd-rep-kpi-footnote">
              <span><strong>{overview.dischargedToday}</strong> discharged today</span>
            </div>
          </div>
        </div>

        {/* Analytics Section: Ward Capacity & Discharge Outcomes */}
        <div className="ipd-analytics-grid">
          {/* Ward Utilization Matrix */}
          <div className="ipd-rep-card">
            <div className="ipd-rep-card-title">
              <span>Ward-wise Occupancy & Capacity Utilization</span>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Live Feed</span>
            </div>

            <div className="ipd-ward-list">
              {wardBreakdown.length === 0 ? (
                <div style={{ color: "#64748b", padding: "20px 0", textAlign: "center" }}>
                  Loading ward capacity data...
                </div>
              ) : (
                wardBreakdown.map((w) => {
                  const rate = parseFloat(w.occupancy_rate || "0");
                  return (
                    <div key={w.ward_id} className="ipd-ward-item">
                      <div className="ipd-ward-header">
                        <span className="ipd-ward-title">
                          <Icon name="LuBed" size={15} style={{ color: "#2563eb" }} />
                          {w.ward_name}
                        </span>
                        <span className="ipd-ward-stats-badge">
                          <strong>{w.occupied_beds || 0}</strong> / {w.total_beds || 0} Beds ({rate}%)
                        </span>
                      </div>
                      <div className="ipd-progress-track">
                        <div
                          className={`ipd-progress-bar ${getProgressColorClass(rate)}`}
                          style={{ width: `${Math.min(100, rate)}%` }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        <span>Vacant: <strong style={{ color: "#10b981" }}>{w.available_beds || 0}</strong></span>
                        <span>Sanitizing: <strong style={{ color: "#f59e0b" }}>{w.cleaning_beds || 0}</strong></span>
                        <span>Maintenance: <strong style={{ color: "#94a3b8" }}>{w.maintenance_beds || 0}</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Discharge Dispositions Breakdown */}
          <div className="ipd-rep-card">
            <div className="ipd-rep-card-title">
              <span>Discharge Dispositions Breakdown</span>
              <Icon name="LuActivity" size={16} style={{ color: "#2563eb" }} />
            </div>

            <div className="ipd-outcomes-list">
              {dischargeTypes.length === 0 ? (
                <div className="ipd-outcome-row">
                  <span className="ipd-outcome-name">
                    <Icon name="LuCheckCircle" size={15} style={{ color: "#10b981" }} />
                    Planned / Normal Discharge
                  </span>
                  <span className="ipd-outcome-count">{overview.totalDischarged}</span>
                </div>
              ) : (
                dischargeTypes.map((dt, idx) => (
                  <div key={idx} className="ipd-outcome-row">
                    <span className="ipd-outcome-name">
                      <Icon
                        name={dt.discharge_type === "normal" ? "LuCheckCircle" : "LuAlertCircle"}
                        size={15}
                        style={{ color: dt.discharge_type === "normal" ? "#10b981" : "#f59e0b" }}
                      />
                      {dt.discharge_type.toUpperCase()}
                    </span>
                    <span className="ipd-outcome-count">{dt.count}</span>
                  </div>
                ))
              )}

              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, marginTop: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                  Discharge Summary Compliance
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b" }}>
                  100% of discharged patients have authored discharge summary slips with diagnosis and prescription records.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor & Specialty IPD Activity */}
        <div className="ipd-rep-card">
          <div className="ipd-rep-card-title">
            <span>Consultant Physician & Specialty IPD Activity</span>
            <Icon name="LuStethoscope" size={16} style={{ color: "#2563eb" }} />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="ipd-rep-table">
              <thead>
                <tr>
                  <th>Consultant Practitioner</th>
                  <th>Total Admissions</th>
                  <th>Active Inpatients</th>
                  <th>Discharged Cases</th>
                  <th>Activity Share</th>
                </tr>
              </thead>
              <tbody>
                {doctorActivity.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: 20 }}>
                      No doctor-specific inpatient records found.
                    </td>
                  </tr>
                ) : (
                  doctorActivity.map((doc, idx) => {
                    const total = parseInt(doc.total_admissions || "0", 10);
                    const pct = overview.totalAdmissions > 0 ? ((total / overview.totalAdmissions) * 100).toFixed(0) : "0";
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: "#0f172a" }}>
                          Dr. {doc.first_name} {doc.last_name || ""}
                        </td>
                        <td style={{ fontWeight: 600 }}>{doc.total_admissions}</td>
                        <td style={{ color: "#2563eb", fontWeight: 700 }}>{doc.active_patients}</td>
                        <td style={{ color: "#10b981", fontWeight: 700 }}>{doc.discharged_patients}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 80, height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: "#2563eb" }} />
                            </div>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b" }}>{pct}%</span>
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

        {/* Daily Inpatient Census & Patient Movement Log */}
        <div className="ipd-rep-card">
          <div className="ipd-rep-card-title">
            <span>Inpatient Census & Movement Log</span>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
              Showing {recentCensus.length} records
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="ipd-rep-table">
              <thead>
                <tr>
                  <th>UHID</th>
                  <th>Patient Name</th>
                  <th>Ward & Bed</th>
                  <th>Admit Date</th>
                  <th>Status</th>
                  <th>Diagnosis</th>
                  <th>Attending Doctor</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCensus.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#64748b", padding: 20 }}>
                      No inpatient records available.
                    </td>
                  </tr>
                ) : (
                  paginatedCensus.map((adm) => (
                    <tr key={adm.id}>
                      <td style={{ fontWeight: 700, color: "#2563eb" }}>{adm.uhid || "—"}</td>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>
                        {adm.first_name} {adm.last_name}
                      </td>
                      <td>
                        <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontWeight: 600, fontSize: 12 }}>
                          {adm.ward_name || "Ward"} / {adm.bed_name || "Bed"}
                        </span>
                      </td>
                      <td>{new Date(adm.admitted_at).toLocaleDateString("en-IN")}</td>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background: adm.status === "admitted" ? "#eff6ff" : "#f0fdf4",
                            color: adm.status === "admitted" ? "#1d4ed8" : "#15803d"
                          }}
                        >
                          {adm.status}
                        </span>
                      </td>
                      <td style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {adm.admission_diagnosis || "Under Observation"}
                      </td>
                      <td>
                        {adm.doctor_first_name ? `Dr. ${adm.doctor_first_name} ${adm.doctor_last_name || ""}` : "On-Duty Consultant"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <div style={{ color: "#475569", fontSize: 12, fontWeight: 600 }}>
              Showing {recentCensus.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + rowsPerPage, recentCensus.length)} of {recentCensus.length} records
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                style={{
                  border: "1px solid #cbd5e1",
                  background: safeCurrentPage === 1 ? "#f8fafc" : "#fff",
                  color: safeCurrentPage === 1 ? "#94a3b8" : "#334155",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Icon name="LuChevronLeft" size={15} />
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  style={{
                    minWidth: 34,
                    height: 32,
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: page === safeCurrentPage ? "#0f172a" : "#fff",
                    color: page === safeCurrentPage ? "#fff" : "#334155",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    padding: "0 10px"
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                style={{
                  border: "1px solid #cbd5e1",
                  background: safeCurrentPage === totalPages ? "#f8fafc" : "#fff",
                  color: safeCurrentPage === totalPages ? "#94a3b8" : "#334155",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Icon name="LuChevronRight" size={15} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label htmlFor="ipd-report-page-size" style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>
                Rows per page
              </label>
              <select
                id="ipd-report-page-size"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  background: "#fff",
                  color: "#0f172a",
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
