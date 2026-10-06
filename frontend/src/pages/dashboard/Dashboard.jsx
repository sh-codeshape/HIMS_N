import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import PageContainer from "../../components/common/PageContainer.jsx";
import { mockStore } from "../../mock/mockStore";
import patientService from "../../api/services/patientService";
import opdService from "../../api/services/opdService";
import ipdService from "../../api/services/ipdService";
import { isMockMode } from "../../config/appConfig";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
<<<<<<< HEAD
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
=======
    setAppointments(mockStore.getAppointments() || []);
>>>>>>> upstream/main
  }, []);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("2026-10-01");
  const [toDate, setToDate] = useState("2026-10-01");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedPatientType, setSelectedPatientType] = useState("All Patient Types");
  const [selectedDoctor, setSelectedDoctor] = useState("All Doctors");
  const [rowsPerPage, setRowsPerPage] = useState(30);

  // Modal states
  const [viewPatient, setViewPatient] = useState(null);
  const [editPatient, setEditPatient] = useState(null);
  const [printSlip, setPrintSlip] = useState(null);

  // Filter logic
  const filteredAppointments = useMemo(() => {
    return (appointments || []).filter((item) => {
      // Search
      const matchesSearch =
        !searchQuery.trim() ||
        (item.patientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.uhid || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.phone || "").includes(searchQuery) ||
        (item.token || "").toLowerCase().includes(searchQuery.toLowerCase());

      // Status
      const matchesStatus =
        selectedStatus === "All Status" || item.status === selectedStatus;

      // Patient Type / OPD / IPD
      let matchesType = true;
      if (selectedPatientType !== "All Patient Types") {
        matchesType = item.patientType === selectedPatientType;
      }

      // Doctor
      const matchesDoctor =
        selectedDoctor === "All Doctors" || (item.doctor || "").includes(selectedDoctor);

      return matchesSearch && matchesStatus && matchesType && matchesDoctor;
    });
  }, [appointments, searchQuery, selectedStatus, selectedPatientType, selectedDoctor]);

  // Compute 7 Stat Numbers
  const safeAppointments = appointments || [];
  const totalBookingsToday = safeAppointments.length;
  const oldPatientsCount = safeAppointments.filter((a) => (a.patientType || "").includes("Old")).length;
  const newPatientsCount = safeAppointments.filter((a) => (a.patientType || "").includes("New")).length;
  const totalConfirmed = safeAppointments.filter((a) => a.status === "Confirmed").length;
  const totalPending = safeAppointments.filter((a) => a.status === "Pending").length;
  const totalCompleted = safeAppointments.filter((a) => a.status === "Completed").length;
  const totalCancelled = safeAppointments.filter((a) => a.status === "Cancelled").length;

  // Handlers
  const handleTodayClick = () => {
    setFromDate("2026-10-01");
    setToDate("2026-10-01");
    toast.success("Filter set to Today (01/10/2026)");
  };

  const handleStatusChange = (id, newStatus) => {
    const updated = mockStore.updateAppointmentStatus(id, newStatus);
    setAppointments(updated);
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleExportCSV = () => {
    const headers = ["Patient Name", "Phone", "UHID", "Type", "Category", "Doctor", "Date", "Token", "Status"];
    const rows = filteredAppointments.map((a) => [
      `"${a.patientName}"`,
      `"${a.phone}"`,
      `"${a.uhid}"`,
      `"${a.patientType}"`,
      `"${a.category}"`,
      `"${a.doctor}"`,
      `"${a.date}"`,
      `"${a.token}"`,
      `"${a.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `appointments_opd_ipd_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
  };

  return (
    <PageContainer>
      <div className="dash-container">
        {/* Header Title Section */}
        <div className="dash-header-card">
          <div className="dash-header-icon-box">
            <Icon name="LuCalendarDays" size={24} />
          </div>
          <div className="dash-header-title-box">
            <h1>Appointments (OPD & IPD)</h1>
            <p>OPD & IPD bookings across all doctors</p>
          </div>
        </div>

        {/* 7 KPI Stat Cards Strip (Exact match to screenshot) */}
        <div className="dash-stats-strip">
          <div className="dash-stat-box">
            <span className="dash-stat-lbl">TOTAL BOOKINGS (TODAY)</span>
            <span className="dash-stat-val dash-stat-val--default">{totalBookingsToday}</span>
          </div>



          <div className="dash-stat-box">
            <span className="dash-stat-lbl">TOTAL CONFIRMED</span>
            <span className="dash-stat-val dash-stat-val--blue">{totalConfirmed}</span>
          </div>

          <div className="dash-stat-box">
            <span className="dash-stat-lbl">TOTAL PENDING</span>
            <span className="dash-stat-val dash-stat-val--amber">{totalPending}</span>
          </div>

          <div className="dash-stat-box">
            <span className="dash-stat-lbl">TOTAL COMPLETED</span>
            <span className="dash-stat-val dash-stat-val--default">{totalCompleted}</span>
          </div>

          <div className="dash-stat-box">
            <span className="dash-stat-lbl">TOTAL CANCELLED</span>
            <span className="dash-stat-val dash-stat-val--red">{totalCancelled}</span>
          </div>
        </div>

        {/* Single Row Filter Controls Panel (Matching Screenshot UI Filter) */}
        <div className="dash-filter-panel">
          <div className="dash-filter-row">
            {/* Search Input */}
            <div className="dash-search-group">
              <Icon name="LuSearch" size={16} className="dash-search-icon" />
              <input
                type="text"
                className="dash-search-input"
                placeholder="Search by name, ID, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Date Pickers */}
            <div className="dash-date-group">
              <span>From:</span>
              <div className="dash-date-input-wrap">
                <input
                  type="date"
                  className="dash-date-input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
            </div>

            <div className="dash-date-group">
              <span>To:</span>
              <div className="dash-date-input-wrap">
                <input
                  type="date"
                  className="dash-date-input"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <button type="button" className="dash-btn-today" onClick={handleTodayClick}>
              Today
            </button>

            {/* Status Dropdown */}
            <select
              className="dash-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Patient Types Dropdown (OPD & IPD strictly) */}
            <select
              className="dash-select"
              value={selectedPatientType}
              onChange={(e) => setSelectedPatientType(e.target.value)}
            >
              <option value="All Patient Types">All Patient Types</option>
              <option value="OPD">OPD</option>
              <option value="IPD">IPD</option>
            </select>

            {/* Doctors Dropdown */}
            <select
              className="dash-select"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option value="All Doctors">All Doctors</option>
              <option value="Dr. Sadhana Chaurasiya">Dr. Sadhana Chaurasiya (BAMS)</option>
              <option value="Dr. Anand Prakash Tiwari">Dr. Anand Prakash Tiwari (MS)Ay</option>
              <option value="Dr. Akhilesh Kumar Singh">Dr. Akhilesh Kumar Singh</option>
              <option value="Dr. Meenakshi Iyer">Dr. Meenakshi Iyer</option>
            </select>
          </div>
        </div>

        {/* Row Count Bar & Export CSV Button */}
        <div className="dash-toolbar-row">
          <div className="dash-toolbar-left">
            <select
              className="dash-rows-select"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={30}>30 rows</option>
              <option value={50}>50 rows</option>
            </select>


          </div>

          <button type="button" className="dash-btn-export" onClick={handleExportCSV}>
            <Icon name="LuDownload" size={14} /> Export CSV
          </button>
        </div>

        {/* Appointments Table List */}
        <div className="dash-table-card">
          <div className="dash-table-container">
            <table className="dash-main-table">
              <thead>
                <tr>
                  <th>PATIENT</th>
                  <th>PATIENT TYPE</th>
                  <th>DOCTOR</th>
                  <th>DATE</th>
                  <th>TOKEN</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.slice(0, rowsPerPage).map((item) => (
                  <tr key={item.id}>
                    {/* Patient Column */}
                    <td>
                      <div className="dash-patient-name">{item.patientName}</div>
                      <div className="dash-patient-sub">
                        {item.phone} • {item.uhid}
                      </div>
                    </td>

                    {/* Patient Type Badge (OPD & IPD Display) */}
                    <td>
                      <span
                        className={`dash-badge-type ${item.patientType === "IPD"
                            ? "dash-badge-type--ipd"
                            : "dash-badge-type--opd"
                          }`}
                      >
                        {item.patientType}
                      </span>
                    </td>

                    {/* Doctor Column */}
                    <td>
                      <div className="dash-doctor-text">{item.doctor}</div>
                    </td>

                    {/* Date Column */}
                    <td>
                      <div className="dash-date-text">{item.date}</div>
                    </td>

                    {/* Token Column */}
                    <td>
                      <span
                        className={`dash-token-pill ${item.category === "IPD" ? "dash-token-pill--ipd" : ""
                          }`}
                      >
                        {item.token}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td>
                      <span
                        className={`dash-status-badge ${item.status === "Confirmed"
                            ? "dash-status-badge--confirmed"
                            : item.status === "Pending"
                              ? "dash-status-badge--pending"
                              : item.status === "Completed"
                                ? "dash-status-badge--completed"
                                : "dash-status-badge--cancelled"
                          }`}
                      >
                        <span className="dash-status-dot"></span>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td>
                      <div className="dash-actions-cell">
                        <button
                          type="button"
                          className="dash-icon-btn dash-icon-btn--view"
                          title="View Details"
                          onClick={() => setViewPatient(item)}
                        >
                          <Icon name="LuEye" size={15} />
                        </button>
                        <button
                          type="button"
                          className="dash-icon-btn dash-icon-btn--edit"
                          title="Edit Appointment"
                          onClick={() => setEditPatient(item)}
                        >
                          <Icon name="LuPencil" size={14} />
                        </button>
                        <button
                          type="button"
                          className="dash-icon-btn dash-icon-btn--print"
                          title="Print OPD/IPD Slip"
                          onClick={() => setPrintSlip(item)}
                        >
                          <Icon name="LuPrinter" size={15} />
                        </button>
                        <button
                          type="button"
                          className="dash-icon-btn dash-icon-btn--check"
                          title="Confirm / Complete"
                          onClick={() => handleStatusChange(item.id, "Confirmed")}
                        >
                          <Icon name="LuCheckCircle2" size={15} />
                        </button>
                        <button
                          type="button"
                          className="dash-icon-btn dash-icon-btn--cross"
                          title="Cancel Booking"
                          onClick={() => handleStatusChange(item.id, "Cancelled")}
                        >
                          <Icon name="LuXCircle" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      No appointment records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>



        {/* VIEW PATIENT MODAL */}
        {viewPatient && (
          <div className="dash-modal-overlay">
            <div className="dash-modal-box">
              <div className="dash-modal-header">
                <h3>📋 Patient Appointment Details</h3>
                <button
                  type="button"
                  className="dash-modal-close"
                  onClick={() => setViewPatient(null)}
                >
                  <Icon name="LuX" size={18} />
                </button>
              </div>
              <div className="dash-modal-body">
                <div className="dash-detail-grid">
                  <div className="dash-detail-item">
                    <span className="dash-detail-lbl">Patient Name</span>
                    <span className="dash-detail-val">{viewPatient.patientName}</span>
                  </div>
                  <div className="dash-detail-item">
                    <span className="dash-detail-lbl">Mobile Phone</span>
                    <span className="dash-detail-val">{viewPatient.phone}</span>
                  </div>
                  <div className="dash-detail-item">
                    <span className="dash-detail-lbl">UHID Number</span>
                    <span className="dash-detail-val">{viewPatient.uhid}</span>
                  </div>
                  <div className="dash-detail-item">
                    <span className="dash-detail-lbl">Patient Type</span>
                    <span className="dash-detail-val">{viewPatient.patientType}</span>
                  </div>
                  <div className="dash-detail-item">
                    <span className="dash-detail-lbl">Doctor</span>
                    <span className="dash-detail-val">{viewPatient.doctor}</span>
                  </div>
                  <div className="dash-detail-item">
                    <span className="dash-detail-lbl">Token Number</span>
                    <span className="dash-detail-val">{viewPatient.token}</span>
                  </div>
                  <div className="dash-detail-item">
                    <span className="dash-detail-lbl">Date</span>
                    <span className="dash-detail-val">{viewPatient.date}</span>
                  </div>
                  <div className="dash-detail-item">
                    <span className="dash-detail-lbl">Booking Status</span>
                    <span className="dash-detail-val">{viewPatient.status}</span>
                  </div>
                </div>
              </div>
              <div className="dash-modal-footer">
                <button
                  type="button"
                  className="dash-btn-sec"
                  onClick={() => setViewPatient(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT PATIENT MODAL */}
        {editPatient && (
          <div className="dash-modal-overlay">
            <div className="dash-modal-box">
              <div className="dash-modal-header">
                <h3>✏️ Edit Appointment Status</h3>
                <button
                  type="button"
                  className="dash-modal-close"
                  onClick={() => setEditPatient(null)}
                >
                  <Icon name="LuX" size={18} />
                </button>
              </div>
              <div className="dash-modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>
                      Patient Name
                    </label>
                    <input
                      type="text"
                      className="dash-search-input"
                      value={editPatient.patientName}
                      disabled
                      style={{ background: "#f1f5f9" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>
                      Status
                    </label>
                    <select
                      className="dash-select"
                      style={{ width: "100%", marginTop: "4px" }}
                      value={editPatient.status}
                      onChange={(e) =>
                        setEditPatient({ ...editPatient, status: e.target.value })
                      }
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="dash-modal-footer">
                <button
                  type="button"
                  className="dash-btn-sec"
                  onClick={() => setEditPatient(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dash-btn-pri"
                  onClick={() => {
                    handleStatusChange(editPatient.id, editPatient.status);
                    setEditPatient(null);
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRINT SLIP MODAL */}
        {printSlip && (
          <div className="dash-modal-overlay">
            <div className="dash-modal-box" style={{ maxWidth: "480px" }}>
              <div className="dash-modal-header">
                <h3>🖨️ Appointment Slip Preview</h3>
                <button
                  type="button"
                  className="dash-modal-close"
                  onClick={() => setPrintSlip(null)}
                >
                  <Icon name="LuX" size={18} />
                </button>
              </div>
              <div className="dash-modal-body" style={{ background: "#f8fafc" }}>
                <div
                  style={{
                    background: "#ffffff",
                    padding: "20px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <div style={{ textTransform: "uppercase", fontWeight: "800", fontSize: "14px" }}>
                    K.G. Nanda Memorial Hospital
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    {printSlip.category} Consultation Ticket • {printSlip.token}
                  </div>
                  <hr style={{ margin: "12px 0", borderColor: "#e2e8f0" }} />
                  <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                    <div><strong>Patient:</strong> {printSlip.patientName}</div>
                    <div><strong>UHID:</strong> {printSlip.uhid}</div>
                    <div><strong>Type:</strong> {printSlip.patientType}</div>
                    <div><strong>Doctor:</strong> {printSlip.doctor}</div>
                    <div><strong>Date:</strong> {printSlip.date}</div>
                    <div><strong>Status:</strong> {printSlip.status}</div>
                  </div>
                </div>
              </div>
              <div className="dash-modal-footer">
                <button
                  type="button"
                  className="dash-btn-sec"
                  onClick={() => setPrintSlip(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="dash-btn-pri"
                  onClick={() => {
                    window.print();
                    toast.success("Printing appointment slip...");
                    setPrintSlip(null);
                  }}
                >
                  Print Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

