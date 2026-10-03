import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { ROLE_LABELS } from "../../auth/roles";
import PageContainer from "../../components/common/PageContainer.jsx";
import Icon from "../../components/common/Icon.jsx";
import { mockStore } from "../../mock/mockStore";
import patientService from "../../api/services/patientService";
import opdService from "../../api/services/opdService";
import ipdService from "../../api/services/ipdService";
import { isMockMode } from "../../config/appConfig";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [opdQueue, setOpdQueue] = useState([]);
  const [beds, setBeds] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (isMockMode()) {
        setPatients(mockStore.getPatients());
        setOpdQueue(mockStore.getOPDQueue());
        setBeds(mockStore.getBeds());
        setInvoices(mockStore.getInvoices());
        setDoctors(mockStore.getDoctors());
        return;
      }

      try {
        const [patientList, queueList, bedList] = await Promise.all([
          patientService.getAll(),
          opdService.getQueue(),
          ipdService.getBedMatrix(),
        ]);

        setPatients(patientList || []);
        setOpdQueue((queueList || []).map((item) => ({
          tokenNo: item.tokenNo || item.token_no || item.id || "—",
          patientName: item.patientName || item.patient_name || item.full_name || `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Patient",
          uhid: item.uhid || "—",
          doctor: item.doctor || item.referred_by || "—",
          department: item.department || "General Medicine",
          time: item.time || new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: item.status || "Waiting",
        })));
        setBeds((bedList || []).map((bed) => ({
          id: bed.id,
          bedNo: bed.bed_no || bed.bedNo || "—",
          ward: bed.ward_name || bed.ward || "General",
          room: bed.room_name || bed.room || "General",
          status: bed.current_status || bed.status || "Available",
        })));
        setInvoices([]);
        setDoctors([]);
      } catch (err) {
        console.error("Dashboard live data load failed:", err);
        setPatients([]);
        setOpdQueue([]);
        setBeds([]);
        setInvoices([]);
        setDoctors([]);
      }
    };

    loadDashboardData();
  }, []);

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;
  const occupancyRate = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const todayRevenue = invoices.reduce((acc, curr) => acc + (Number(curr.netAmount) || 0), 0);

  const handleUpdateOPD = (tokenNo, newStatus) => {
    const updated = mockStore.updateOPDStatus(tokenNo, newStatus);
    setOpdQueue(updated);
  };

  return (
    <PageContainer
      title={`Hello, ${user?.name ?? "Dr. Rajesh Sharma"}`}
      subtitle={`${ROLE_LABELS[user?.role] ?? "Administrator"} Console • K.G. Nanda Memorial Hospital HIMS`}
    >
      {/* KPI Stats Grid */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card dash-kpi-card--blue">
          <div className="dash-kpi-icon">
            <Icon name="LuCalendarDays" size={24} />
          </div>
          <div className="dash-kpi-content">
            <span className="dash-kpi-label">Today's OPD</span>
            <span className="dash-kpi-value">{opdQueue.length + 138}</span>
            <span className="dash-kpi-sub">+14% vs yesterday</span>
          </div>
        </div>

        <div className="dash-kpi-card dash-kpi-card--purple">
          <div className="dash-kpi-icon">
            <Icon name="LuBedDouble" size={24} />
          </div>
          <div className="dash-kpi-content">
            <span className="dash-kpi-label">IPD In-Patients</span>
            <span className="dash-kpi-value">{occupiedBeds} Beds</span>
            <span className="dash-kpi-sub">{occupancyRate}% Bed Occupancy</span>
          </div>
        </div>

        <div className="dash-kpi-card dash-kpi-card--green">
          <div className="dash-kpi-icon">
            <Icon name="LuIndianRupee" size={24} />
          </div>
          <div className="dash-kpi-content">
            <span className="dash-kpi-label">Today's Collection</span>
            <span className="dash-kpi-value">₹{(todayRevenue + 125000).toLocaleString("en-IN")}</span>
            <span className="dash-kpi-sub">Cash, UPI & TPA Insurance</span>
          </div>
        </div>

        <div className="dash-kpi-card dash-kpi-card--amber">
          <div className="dash-kpi-icon">
            <Icon name="LuFlaskConical" size={24} />
          </div>
          <div className="dash-kpi-content">
            <span className="dash-kpi-label">Pending Lab Tests</span>
            <span className="dash-kpi-value">18 Orders</span>
            <span className="dash-kpi-sub">Avg TAT: 45 Mins</span>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="dash-actions-bar">
        <h3 className="dash-section-title">
          <Icon name="LuZap" size={16} /> Quick Hospital Actions
        </h3>
        <div className="dash-action-buttons">
          <button
            type="button"
            className="dash-action-btn"
            onClick={() => navigate("/registration/register-patient")}
          >
            <Icon name="LuUserPlus" size={16} /> Register Patient
          </button>
          <button
            type="button"
            className="dash-action-btn"
            onClick={() => navigate("/opd/registration")}
          >
            <Icon name="LuTicket" size={16} /> Issue OPD Token
          </button>
          <button
            type="button"
            className="dash-action-btn"
            onClick={() => navigate("/ipd/bed-allotment")}
          >
            <Icon name="LuBed" size={16} /> Allot IPD Bed
          </button>
          <button
            type="button"
            className="dash-action-btn"
            onClick={() => navigate("/billing/opd")}
          >
            <Icon name="LuReceipt" size={16} /> Generate Invoice
          </button>
          <button
            type="button"
            className="dash-action-btn"
            onClick={() => navigate("/pharmacy/pos")}
          >
            <Icon name="LuPill" size={16} /> Pharmacy POS
          </button>
          <button
            type="button"
            className="dash-action-btn"
            onClick={() => navigate("/laboratory/new-order")}
          >
            <Icon name="LuTestTube" size={16} /> Order Lab Test
          </button>
        </div>
      </div>

      {/* Main Grid: OPD Live Queue & Bed Occupancy / Doctors */}
      <div className="dash-content-grid">
        {/* Left Column: Live OPD Consultation Queue */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <div>
              <h3 className="dash-panel-title">Live OPD Consultation Queue</h3>
              <p className="dash-panel-sub">Real-time doctor room token status</p>
            </div>
            <button
              type="button"
              className="dash-link-btn"
              onClick={() => navigate("/opd/registration")}
            >
              View Full Queue <Icon name="LuArrowRight" size={14} />
            </button>
          </div>

          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient Name</th>
                  <th>Doctor & Dept</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {opdQueue.slice(0, 5).map((item) => (
                  <tr key={item.tokenNo}>
                    <td>
                      <span className="dash-token-badge">{item.tokenNo}</span>
                    </td>
                    <td>
                      <div className="dash-cell-bold">{item.patientName}</div>
                      <div className="dash-cell-muted">{item.uhid}</div>
                    </td>
                    <td>
                      <div className="dash-cell-bold">{item.doctor}</div>
                      <div className="dash-cell-muted">{item.department}</div>
                    </td>
                    <td>{item.time}</td>
                    <td>
                      <span
                        className={`dash-status-pill ${
                          item.status === "Completed"
                            ? "dash-status--green"
                            : item.status === "In Consultation"
                            ? "dash-status--blue"
                            : "dash-status--amber"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status === "Waiting" && (
                        <button
                          type="button"
                          className="dash-mini-btn dash-mini-btn--blue"
                          onClick={() => handleUpdateOPD(item.tokenNo, "In Consultation")}
                        >
                          Call
                        </button>
                      )}
                      {item.status === "In Consultation" && (
                        <button
                          type="button"
                          className="dash-mini-btn dash-mini-btn--green"
                          onClick={() => handleUpdateOPD(item.tokenNo, "Completed")}
                        >
                          Complete
                        </button>
                      )}
                      {item.status === "Completed" && (
                        <span className="dash-cell-muted">Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Bed Matrix & Doctor Schedule */}
        <div className="dash-side-col">
          {/* Bed Occupancy Card */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3 className="dash-panel-title">Bed Status Overview</h3>
              <span className="dash-badge-green">{availableBeds} Available</span>
            </div>

            <div className="dash-bed-progress-container">
              <div className="dash-bed-bar">
                <div
                  className="dash-bed-bar-fill"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              <div className="dash-bed-stats-row">
                <span>Occupied: <strong>{occupiedBeds}</strong></span>
                <span>Available: <strong>{availableBeds}</strong></span>
                <span>Total: <strong>{totalBeds}</strong></span>
              </div>
            </div>

            <div className="dash-bed-quick-grid">
              {beds.slice(0, 6).map((bed) => (
                <div
                  key={bed.id}
                  className={`dash-bed-pill ${
                    bed.status === "Occupied"
                      ? "dash-bed--occupied"
                      : bed.status === "Available"
                      ? "dash-bed--available"
                      : "dash-bed--maint"
                  }`}
                >
                  <span className="dash-bed-name">{bed.bedNo}</span>
                  <span className="dash-bed-ward">{bed.ward}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Doctors On Duty */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3 className="dash-panel-title">Doctors On Duty</h3>
              <span className="dash-cell-muted">Today</span>
            </div>

            <div className="dash-doctor-list">
              {doctors.slice(0, 4).map((doc) => (
                <div key={doc.id} className="dash-doctor-item">
                  <div className="dash-doctor-avatar">
                    <Icon name="LuStethoscope" size={16} />
                  </div>
                  <div className="dash-doctor-info">
                    <span className="dash-doctor-name">{doc.name}</span>
                    <span className="dash-doctor-dept">{doc.department}</span>
                  </div>
                  <span
                    className={`dash-doc-badge ${
                      doc.status === "Available"
                        ? "dash-doc-badge--avail"
                        : doc.status === "In OT"
                        ? "dash-doc-badge--ot"
                        : "dash-doc-badge--busy"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
