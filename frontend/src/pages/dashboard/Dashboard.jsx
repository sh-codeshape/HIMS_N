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
  const [patients, setPatients] = useState([]);
  const [opdQueue, setOpdQueue] = useState([]);
  const [beds, setBeds] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const results = await Promise.allSettled([
          patientService.getAll(),
          opdService.getQueue(),
          ipdService.getBedMatrix(),
        ]);

        const patientList = results[0].status === "fulfilled" && Array.isArray(results[0].value) ? results[0].value : [];
        const queueList = results[1].status === "fulfilled" && Array.isArray(results[1].value) ? results[1].value : [];
        const bedList = results[2].status === "fulfilled" && Array.isArray(results[2].value) ? results[2].value : [];

        setPatients(patientList);

        setOpdQueue(queueList.map((item) => ({
          tokenNo: item.tokenNo || item.token_no || item.id || "—",
          patientName: item.patientName || item.patient_name || item.full_name || `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Patient",
          uhid: item.uhid || "—",
          doctor: item.doctor || item.referred_by || "—",
          department: item.department || "General Medicine",
          time: item.time || new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: item.status || "Waiting",
        })));

        setBeds(bedList.map((bed) => ({
          id: bed.id,
          bedNo: bed.bed_no || bed.bedNo || "—",
          ward: bed.ward_name || bed.ward || "General",
          room: bed.room_name || bed.room || "General",
          status: bed.current_status || bed.status || "Available",
        })));

        setInvoices([]);
        setDoctors([]);

        // Generate appointments from registered patients
        const sourceList = (patientList.length > 0) ? patientList : queueList;
        const apptsMapped = sourceList.map((item, idx) => {
          const customFields = typeof item.custom_fields === "string" ? JSON.parse(item.custom_fields || "{}") : (item.custom_fields || {});
          
          const addressStr = typeof item.address === "object" && item.address !== null
            ? [item.address.street, item.address.city, item.address.state, item.address.pincode].filter(Boolean).join(", ")
            : (item.address || item.city || "Civil Lines, Kota, Rajasthan");

          return {
            id: item.id || Math.random().toString(),
            patientName: item.patientName || item.full_name || `${item.first_name || ""} ${item.last_name || ""}`.trim() || item.name || "Patient",
            uhid: item.uhid || item.id?.substring(0, 8) || `1026-00${String(idx + 1).padStart(2, "0")}`,
            phone: item.phone || item.mobile1 || item.mobile || "9878987876",
            email: item.email || "patient@narayanhospital.com",
            gender: item.gender || (idx % 2 === 0 ? "Male" : "Female"),
            age: item.age || item.age_years || item.ageYrs || (28 + (idx % 35)),
            bloodGroup: item.blood_group || item.bloodGroup || (idx % 3 === 0 ? "B+" : idx % 3 === 1 ? "O+" : "A+"),
            address: addressStr,
            patientType: (item.encounter_type === "ipd" || item.category === "IPD" || item.patientType === "IPD") ? "IPD" : "OPD",
            category: item.department_name || item.department || "General Medicine",
            department: item.department_name || item.department || "General Medicine",
            doctor: item.doctor || item.referred_by || (item.doc_first_name ? `Dr. ${item.doc_first_name} ${item.doc_last_name || ""}`.trim() : "Dr. Amit Sharma (MD)"),
            doctorDegree: item.doctor_degree || "MBBS, MD (General Medicine)",
            date: item.started_at ? new Date(item.started_at).toLocaleDateString() : (item.created_at ? new Date(item.created_at).toLocaleDateString() : new Date().toLocaleDateString()),
            time: item.time || "10:30 AM",
            token: customFields.opd_token || item.tokenNo || item.token_no || item.token || `T-${new Date().toISOString().slice(2, 4)}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-GEN-${String(idx + 1).padStart(2, "0")}`,
            status: item.status || "active",
            maritalStatus: item.marital_status || item.maritalStatus || "Married",
            emergencyContact: item.emergency_contact_name || item.attendantName || item.attendant_name || "Ramesh Sharma",
            emergencyPhone: item.emergency_contact_phone || item.attendantMobile || item.attendant_mobile || "9829012345",
            insurance: item.insurance_provider || item.insurance || "Self Pay / PM-JAY",
            chiefComplaint: item.chief_complaint || item.chiefComplaint || (Array.isArray(item.complaints) ? item.complaints.join(", ") : item.complaints) || "Acute viral fever, body ache & weakness",
            diagnosis: item.provisional_diagnosis || item.provisionalDiagnosis || item.diagnosis || "Viral Pyrexia / Routine Observation",
            vitals: item.vitals || { bp: "120/80 mmHg", pulse: "76 bpm", temp: "98.6 °F", spo2: "99%", weight: "65 kg" },
            fee: item.fee || item.consultationFee || item.amount || 500,
            paymentMode: item.payment_mode || item.paymentMode || "Cash",
            paymentStatus: item.payment_status || item.paymentStatus || "Paid",
            roomNo: item.room_no || item.roomNo || "Room 104",
            wardType: item.ward_name || item.wardType || "General Ward",
            rawPatient: item,
          };
        });

        setAppointments(apptsMapped);
      } catch (err) {
        console.error("Dashboard live data load failed:", err);
      }
    };

    loadDashboardData();
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
  const [prescribePatient, setPrescribePatient] = useState(null);

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

  // Compute Stat Numbers
  const safeAppointments = appointments || [];
  const totalBookingsToday = safeAppointments.length;
  const oldPatientsCount = safeAppointments.filter((a) => (a.patientType || "").includes("Old")).length;
  const newPatientsCount = safeAppointments.filter((a) => (a.patientType || "").includes("New")).length;
  const totalConfirmed = safeAppointments.filter((a) => {
    const s = (a.status || "").toLowerCase();
    return s === "confirmed" || s === "active";
  }).length;
  const totalPending = safeAppointments.filter((a) => {
    const s = (a.status || "").toLowerCase();
    return s === "pending" || s === "waiting";
  }).length;
  const totalCompleted = safeAppointments.filter((a) => {
    const s = (a.status || "").toLowerCase();
    return s === "completed";
  }).length;
  const totalCancelled = safeAppointments.filter((a) => {
    const s = (a.status || "").toLowerCase();
    return s === "cancelled";
  }).length;

  // Handlers
  const handleTodayClick = () => {
    setFromDate("2026-10-01");
    setToDate("2026-10-01");
    toast.success("Filter set to Today (01/10/2026)");
  };

  const handleStatusChange = async (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    try {
      await patientService.update(id, { status: newStatus });
    } catch (err) {
      console.warn("Backend status update error:", err?.message);
    }
    toast.success(`Patient status updated to ${newStatus}`);
  };

  // Rx Prescription State
  const [rxData, setRxData] = useState({
    bp: "120/80 mmHg",
    pulse: "76 bpm",
    temp: "98.6 °F",
    spo2: "99 %",
    weight: "65 kg",
    chiefComplaints: "Acute viral fever, body ache, mild dehydration",
    diagnosis: "Viral Pyrexia / Upper Respiratory Infection",
    medicines: [
      { id: 1, name: "Tab. Paracetamol 650mg", dosage: "1-0-1", timing: "After Food", duration: "3 Days" },
      { id: 2, name: "Cap. Amoxicillin 500mg", dosage: "1-0-1", timing: "After Food", duration: "5 Days" },
      { id: 3, name: "Syp. ORS Electral", dosage: "100ml SOS", timing: "As Needed", duration: "3 Days" },
      { id: 4, name: "Tab. Pantoprazole 40mg", dosage: "1-0-0", timing: "Before Food", duration: "5 Days" },
    ],
    advice: "Drink plenty of boiled warm water. Complete bed rest for 2-3 days. Avoid cold/fried food.",
    followUp: "After 3 Days (20/10/2026) or SOS",
  });

  // Modal Openers & Handlers
  const handleOpenView = (item) => {
    setViewPatient(item);
  };

  const handleOpenEdit = (item) => {
    setEditPatient({
      ...item,
      patientName: item.patientName || "",
      phone: item.phone || "",
      age: item.age || "32",
      gender: item.gender || "Male",
      bloodGroup: item.bloodGroup || "B+",
      email: item.email || "",
      address: item.address || "",
      patientType: item.patientType || "OPD",
      category: item.category || item.department || "General Medicine",
      doctor: item.doctor || "Dr. Amit Sharma",
      date: item.date || new Date().toLocaleDateString(),
      time: item.time || "10:30 AM",
      token: item.token || "",
      status: item.status || "active",
      chiefComplaint: item.chiefComplaint || "",
      diagnosis: item.diagnosis || "",
      emergencyContact: item.emergencyContact || "",
      emergencyPhone: item.emergencyPhone || "",
      fee: item.fee || 500,
      paymentMode: item.paymentMode || "Cash",
      paymentStatus: item.paymentStatus || "Paid",
    });
  };

  const handleSaveEdit = async () => {
    if (!editPatient) return;
    const { id } = editPatient;
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...editPatient } : item))
    );
    try {
      await patientService.update(id, editPatient);
    } catch (err) {
      console.warn("Backend update error:", err?.message);
    }
    toast.success("Patient details updated successfully!");
    setEditPatient(null);
  };

  const handleOpenPrescribe = (item) => {
    setPrescribePatient(item);
    setRxData({
      bp: item.vitals?.bp || "120/80 mmHg",
      pulse: item.vitals?.pulse || "76 bpm",
      temp: item.vitals?.temp || "98.6 °F",
      spo2: item.vitals?.spo2 || "99 %",
      weight: item.vitals?.weight || "65 kg",
      chiefComplaints: item.chiefComplaint || "Acute viral fever, body ache, mild dehydration",
      diagnosis: item.diagnosis || "Viral Pyrexia / Upper Respiratory Infection",
      medicines: [
        { id: 1, name: "Tab. Paracetamol 650mg", dosage: "1-0-1", timing: "After Food", duration: "3 Days" },
        { id: 2, name: "Cap. Amoxicillin 500mg", dosage: "1-0-1", timing: "After Food", duration: "5 Days" },
        { id: 3, name: "Syp. ORS Electral", dosage: "100ml SOS", timing: "As Needed", duration: "3 Days" },
        { id: 4, name: "Tab. Pantoprazole 40mg", dosage: "1-0-0", timing: "Before Food", duration: "5 Days" },
      ],
      advice: "Drink plenty of boiled warm water. Complete bed rest for 2-3 days. Avoid cold/fried food.",
      followUp: "After 3 Days (20/10/2026) or SOS",
    });
  };

  const handleAddMedicineRow = () => {
    setRxData((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          id: Date.now(),
          name: "",
          dosage: "1-0-1",
          timing: "After Food",
          duration: "3 Days",
        },
      ],
    }));
  };

  const handleRemoveMedicineRow = (medId) => {
    setRxData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((m) => m.id !== medId),
    }));
  };

  const handleMedicineChange = (medId, field, val) => {
    setRxData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) =>
        m.id === medId ? { ...m, [field]: val } : m
      ),
    }));
  };

  const handleSavePrescription = () => {
    if (!prescribePatient) return;
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === prescribePatient.id
          ? {
              ...item,
              chiefComplaint: rxData.chiefComplaints,
              diagnosis: rxData.diagnosis,
              vitals: {
                bp: rxData.bp,
                pulse: rxData.pulse,
                temp: rxData.temp,
                spo2: rxData.spo2,
                weight: rxData.weight,
              },
            }
          : item
      )
    );
    toast.success(`Prescription issued successfully for ${prescribePatient.patientName}!`, { icon: "💊" });
    setPrescribePatient(null);
  };

  const handleOpenPrint = (item) => {
    setPrintSlip(item);
  };

  const handlePrintTicket = () => {
    window.print();
    toast.success("Printing appointment slip...");
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
    <PageContainer className="!max-w-none !p-0 !m-0 !w-full">
      <div className="dash-container">
        {/* Header Title Section */}
        <div className="dash-header-card">
          <div className="dash-header-icon-box">
            <Icon name="LuCalendarDays" size={24} />
          </div>
          <div className="dash-header-title-box">
            <h1>Appointments (OPD & IPD)</h1>
            <p>OPD & IPD bookings</p>
          </div>
        </div>

        {/* KPI Stat Cards Strip */}
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

        {/* Filter Controls Panel */}
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
                        className={`dash-status-badge ${
                          item.status?.toLowerCase() === "confirmed" || item.status?.toLowerCase() === "active"
                            ? "dash-status-badge--confirmed"
                            : item.status?.toLowerCase() === "pending" || item.status?.toLowerCase() === "waiting"
                              ? "dash-status-badge--pending"
                              : item.status?.toLowerCase() === "completed"
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
                          title="View Complete Patient Details"
                          onClick={() => handleOpenView(item)}
                        >
                          <Icon name="LuEye" size={15} />
                        </button>
                        <button
                          type="button"
                          className="dash-icon-btn dash-icon-btn--edit"
                          title="Edit Patient Details"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Icon name="LuPencil" size={14} />
                        </button>
                        <button
                          type="button"
                          className="dash-icon-btn dash-icon-btn--prescribe"
                          title="Prescribe Medication (Rx)"
                          onClick={() => handleOpenPrescribe(item)}
                        >
                          <Icon name="LuPill" size={15} />
                        </button>
                        <button
                          type="button"
                          className="dash-icon-btn dash-icon-btn--print"
                          title="Print OPD/IPD Appointment Slip"
                          onClick={() => handleOpenPrint(item)}
                        >
                          <Icon name="LuPrinter" size={15} />
                        </button>
                        <button
                          type="button"
                          className="dash-icon-btn dash-icon-btn--check"
                          title="Confirm / Complete Status"
                          onClick={() => handleStatusChange(item.id, item.status === "Confirmed" ? "Completed" : "Confirmed")}
                        >
                          <Icon name="LuCircleCheck" size={15} />
                        </button>
                        <button
                          type="button"
                          className="dash-icon-btn dash-icon-btn--cross"
                          title="Cancel Booking"
                          onClick={() => handleStatusChange(item.id, "Cancelled")}
                        >
                          <Icon name="LuCircleX" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#55698a", fontWeight: 600 }}>
                      No appointment records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 1. VIEW PATIENT MODAL (ALL DETAILS PROPER + PREMIUM UI)  */}
        {/* ======================================================== */}
        {viewPatient && (
          <div className="dash-modal-overlay">
            <div className="dash-modal-box dash-modal-box--view">
              <div className="dash-modal-header">
                <div className="dash-modal-header-left">
                  <div className="dash-modal-header-icon">
                    <Icon name="LuUserCheck" size={20} />
                  </div>
                  <div>
                    <h3>Patient Complete Profile &amp; Appointment</h3>
                   
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-modal-close"
                  onClick={() => setViewPatient(null)}
                >
                  <Icon name="LuX" size={18} />
                </button>
              </div>

              <div className="dash-modal-body">
                {/* Hero Profile Ribbon */}
                

                {/* Section 1: Personal & Demographic Information */}
                <div className="dash-detail-section-card">
                  <div className="dash-section-card-title">
                    <Icon name="LuUser" size={15} />
                    <span>Personal Details <span className="dash-hint">· व्यक्तिगत विवरण</span></span>
                  </div>
                  <div className="dash-detail-grid-4">
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">UHID Number</span>
                      <span className="dash-detail-val font-mono text-blue-700">{viewPatient.uhid}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Full Name</span>
                      <span className="dash-detail-val">{viewPatient.patientName}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Age / Gender</span>
                      <span className="dash-detail-val">{viewPatient.age} Yrs / {viewPatient.gender}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Blood Group</span>
                      <span className="dash-detail-val text-red-600 font-bold">🩸 {viewPatient.bloodGroup}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Mobile Phone</span>
                      <span className="dash-detail-val">{viewPatient.phone}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Email Address</span>
                      <span className="dash-detail-val">{viewPatient.email || "—"}</span>
                    </div>
                   
                    <div className="dash-detail-item dash-col-span-2">
                      <span className="dash-detail-lbl">Residential Address</span>
                      <span className="dash-detail-val">{viewPatient.address || "Civil Lines, Kota, Rajasthan"}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Appointment & Hospital Details */}
                <div className="dash-detail-section-card">
                  <div className="dash-section-card-title">
                    <Icon name="LuCalendarDays" size={15} />
                    <span>Appointment &amp; Consultation Details <span className="dash-hint">· अपॉइंटमेंट विवरण</span></span>
                  </div>
                  <div className="dash-detail-grid-4">
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Encounter Type</span>
                      <span className="dash-detail-val font-bold text-teal-700">{viewPatient.patientType} (Inpatient/Outpatient)</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Department / Specialty</span>
                      <span className="dash-detail-val">{viewPatient.category || viewPatient.department || "General Medicine"}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Consulting Doctor</span>
                      <span className="dash-detail-val font-semibold">{viewPatient.doctor}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Doctor Degree</span>
                      <span className="dash-detail-val text-slate-600">{viewPatient.doctorDegree || "MBBS, MD"}</span>
                    </div>
                    
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Appointment Date &amp; Time</span>
                      <span className="dash-detail-val">{viewPatient.date} at {viewPatient.time || "10:30 AM"}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Booking Status</span>
                      <span className={`dash-status-pill-lg ${viewPatient.status?.toLowerCase()}`}>
                        {viewPatient.status}
                      </span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Room / Bed Allotted</span>
                      <span className="dash-detail-val">{viewPatient.patientType === "IPD" ? `${viewPatient.wardType} - ${viewPatient.roomNo}` : "OPD Consultation Chamber 3"}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Clinical & Medical Information */}
                <div className="dash-detail-section-card">
                  <div className="dash-section-card-title">
                    <Icon name="LuStethoscope" size={15} />
                    <span>Clinical &amp; Medical Findings <span className="dash-hint">· नैदानिक एवं परामर्श विवरण</span></span>
                  </div>
                  <div className="dash-detail-grid-2">
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Chief Complaint / Symptoms</span>
                      <span className="dash-detail-val text-slate-800 font-medium">
                        {viewPatient.chiefComplaint || "General consultation / routine follow-up"}
                      </span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Provisional Diagnosis</span>
                      <span className="dash-detail-val text-blue-900 font-semibold">
                        {viewPatient.diagnosis || "Under clinical evaluation"}
                      </span>
                    </div>
                   
                  </div>
                </div>

                {/* Section 4: Emergency Contact & Billing Details */}
                <div className="dash-detail-section-card">
                  <div className="dash-section-card-title">
                    <Icon name="LuCreditCard" size={15} />
                    <span>Emergency Contact &amp; Billing Details <span className="dash-hint">· तीमारदार एवं शुल्क विवरण</span></span>
                  </div>
                  <div className="dash-detail-grid-4">
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Attendant / Guardian</span>
                      <span className="dash-detail-val">{viewPatient.emergencyContact || "—"}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Attendant Mobile</span>
                      <span className="dash-detail-val">{viewPatient.emergencyPhone || "—"}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Payer / Insurance</span>
                      <span className="dash-detail-val">{viewPatient.insurance || "Self Pay / Cash"}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Consultation Fee</span>
                      <span className="dash-detail-val font-bold text-emerald-800">₹ {Number(viewPatient.fee || 500).toFixed(2)}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Payment Mode</span>
                      <span className="dash-detail-val">{viewPatient.paymentMode || "Cash"}</span>
                    </div>
                    <div className="dash-detail-item">
                      <span className="dash-detail-lbl">Payment Status</span>
                      <span className="dash-detail-val font-bold text-green-700">✓ {viewPatient.paymentStatus || "Paid"}</span>
                    </div>
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
                <button
                  type="button"
                  className="dash-btn-action-alt"
                  onClick={() => {
                    const target = viewPatient;
                    setViewPatient(null);
                    handleOpenPrint(target);
                  }}
                >
                  <Icon name="LuPrinter" size={14} /> Print Slip
                </button>
                <button
                  type="button"
                  className="dash-btn-action-alt"
                  onClick={() => {
                    const target = viewPatient;
                    setViewPatient(null);
                    handleOpenPrescribe(target);
                  }}
                >
                  <Icon name="LuPill" size={14} /> Prescribe Rx
                </button>
                <button
                  type="button"
                  className="dash-btn-pri"
                  onClick={() => {
                    const target = viewPatient;
                    setViewPatient(null);
                    handleOpenEdit(target);
                  }}
                >
                  <Icon name="LuPencil" size={14} /> Edit Patient
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. EDIT PATIENT MODAL (ALL DETAILS PROPER & EDITABLE)    */}
        {/* ======================================================== */}
        {editPatient && (
          <div className="dash-modal-overlay">
            <div className="dash-modal-box dash-modal-box--edit">
              <div className="dash-modal-header">
                <div className="dash-modal-header-left">
                  <div className="dash-modal-header-icon edit">
                    <Icon name="LuPencil" size={20} />
                  </div>
                  <div>
                    <h3>Edit Patient &amp; Appointment Details</h3>
                    <p className="dash-modal-subtitle">मरीज का व्यक्तिगत, अपॉइंटमेंट एवं नैदानिक विवरण संशोधित करें</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-modal-close"
                  onClick={() => setEditPatient(null)}
                >
                  <Icon name="LuX" size={18} />
                </button>
              </div>

              <div className="dash-modal-body">
                {/* 1. Demographics Section */}
                <div className="dash-edit-section">
                  <div className="dash-edit-sec-head">
                    <Icon name="LuUser" size={15} />
                    <span>Demographic &amp; Contact Details · व्यक्तिगत एवं संपर्क जानकारी</span>
                  </div>
                  <div className="dash-form-grid-3">
                    <div>
                      <label className="dash-form-label">
                        Patient Full Name <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        className="dash-form-input"
                        value={editPatient.patientName || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, patientName: e.target.value })}
                        placeholder="Full Patient Name"
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">
                        Mobile Phone <span className="req">*</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        className="dash-form-input"
                        value={editPatient.phone || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, phone: e.target.value })}
                        placeholder="10-digit mobile"
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Email Address</label>
                      <input
                        type="email"
                        className="dash-form-input"
                        value={editPatient.email || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, email: e.target.value })}
                        placeholder="patient@example.com"
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Age (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="125"
                        className="dash-form-input"
                        value={editPatient.age || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, age: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Gender</label>
                      <select
                        className="dash-form-select"
                        value={editPatient.gender || "Male"}
                        onChange={(e) => setEditPatient({ ...editPatient, gender: e.target.value })}
                      >
                        <option value="Male">Male (पुरुष)</option>
                        <option value="Female">Female (महिला)</option>
                        <option value="Other">Other (अन्य)</option>
                      </select>
                    </div>
                    <div>
                      <label className="dash-form-label">Blood Group</label>
                      <select
                        className="dash-form-select"
                        value={editPatient.bloodGroup || "B+"}
                        onChange={(e) => setEditPatient({ ...editPatient, bloodGroup: e.target.value })}
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div className="dash-col-span-3">
                      <label className="dash-form-label">Residential Address</label>
                      <input
                        type="text"
                        className="dash-form-input"
                        value={editPatient.address || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, address: e.target.value })}
                        placeholder="Full Street Address, City, State"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Hospital & Appointment Details */}
                <div className="dash-edit-section">
                  <div className="dash-edit-sec-head">
                    <Icon name="LuHospital" size={15} />
                    <span>Hospital &amp; Appointment Details · अस्पताल एवं अपॉइंटमेंट</span>
                  </div>
                  <div className="dash-form-grid-3">
                    <div>
                      <label className="dash-form-label">Patient Type</label>
                      <select
                        className="dash-form-select font-bold text-teal-800"
                        value={editPatient.patientType || "OPD"}
                        onChange={(e) => setEditPatient({ ...editPatient, patientType: e.target.value })}
                      >
                        <option value="OPD">OPD (Outpatient)</option>
                        <option value="IPD">IPD (Inpatient)</option>
                      </select>
                    </div>
                    <div>
                      <label className="dash-form-label">Department / Specialty</label>
                      <select
                        className="dash-form-select"
                        value={editPatient.category || editPatient.department || "General Medicine"}
                        onChange={(e) => setEditPatient({ ...editPatient, category: e.target.value, department: e.target.value })}
                      >
                        <option value="General Medicine">General Medicine</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Gynecology">Gynecology</option>
                        <option value="ENT">ENT</option>
                        <option value="General Surgery">General Surgery</option>
                        <option value="Dermatology">Dermatology</option>
                      </select>
                    </div>
                    <div>
                      <label className="dash-form-label">Assigned Doctor</label>
                      <input
                        type="text"
                        className="dash-form-input"
                        value={editPatient.doctor || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, doctor: e.target.value })}
                        placeholder="Doctor Name"
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Appointment Date</label>
                      <input
                        type="text"
                        className="dash-form-input"
                        value={editPatient.date || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Appointment Time</label>
                      <input
                        type="text"
                        className="dash-form-input"
                        value={editPatient.time || "10:30 AM"}
                        onChange={(e) => setEditPatient({ ...editPatient, time: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Token Number</label>
                      <input
                        type="text"
                        className="dash-form-input font-mono font-bold"
                        value={editPatient.token || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, token: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Booking Status <span className="req">*</span></label>
                      <select
                        className="dash-form-select font-bold"
                        value={editPatient.status || "active"}
                        onChange={(e) => setEditPatient({ ...editPatient, status: e.target.value })}
                      >
                        <option value="active">Active (सक्रिय)</option>
                        <option value="Confirmed">Confirmed (पुष्टि)</option>
                        <option value="Pending">Pending (लंबित)</option>
                        <option value="Completed">Completed (पूर्ण)</option>
                        <option value="Cancelled">Cancelled (रद्द)</option>
                      </select>
                    </div>
                    <div>
                      <label className="dash-form-label">Consultation Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className="dash-form-input"
                        value={editPatient.fee || 500}
                        onChange={(e) => setEditPatient({ ...editPatient, fee: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Payment Status</label>
                      <select
                        className="dash-form-select"
                        value={editPatient.paymentStatus || "Paid"}
                        onChange={(e) => setEditPatient({ ...editPatient, paymentStatus: e.target.value })}
                      >
                        <option value="Paid">Paid (प्राप्त)</option>
                        <option value="Pending">Pending (लंबित)</option>
                        <option value="Partial">Partial (आंशिक)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Clinical & Guardian Info */}
                <div className="dash-edit-section">
                  <div className="dash-edit-sec-head">
                    <Icon name="LuStethoscope" size={15} />
                    <span>Clinical &amp; Guardian Details · नैदानिक एवं तीमारदार विवरण</span>
                  </div>
                  <div className="dash-form-grid-2">
                    <div>
                      <label className="dash-form-label">Chief Complaint / Symptoms</label>
                      <input
                        type="text"
                        className="dash-form-input"
                        value={editPatient.chiefComplaint || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, chiefComplaint: e.target.value })}
                        placeholder="e.g. Acute viral fever, body ache"
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Provisional Diagnosis</label>
                      <input
                        type="text"
                        className="dash-form-input"
                        value={editPatient.diagnosis || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, diagnosis: e.target.value })}
                        placeholder="e.g. Viral Pyrexia"
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Attendant / Guardian Name</label>
                      <input
                        type="text"
                        className="dash-form-input"
                        value={editPatient.emergencyContact || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, emergencyContact: e.target.value })}
                        placeholder="Guardian Name"
                      />
                    </div>
                    <div>
                      <label className="dash-form-label">Attendant Mobile</label>
                      <input
                        type="tel"
                        maxLength={10}
                        className="dash-form-input"
                        value={editPatient.emergencyPhone || ""}
                        onChange={(e) => setEditPatient({ ...editPatient, emergencyPhone: e.target.value })}
                        placeholder="10-digit mobile"
                      />
                    </div>
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
                  onClick={handleSaveEdit}
                >
                  <Icon name="LuCheckCircle" size={15} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. DOCTOR PRESCRIPTION (Rx) MODAL (PREMIUM CLINICAL UI)  */}
        {/* ======================================================== */}
        {prescribePatient && (
          <div className="dash-modal-overlay">
            <div className="dash-modal-box dash-modal-box--rx">
              <div className="dash-modal-header">
                <div className="dash-modal-header-left">
                  <div className="dash-modal-header-icon rx">
                    <Icon name="LuPill" size={20} />
                  </div>
                  <div>
                    <h3>Doctor Prescription (Rx)</h3>
                    <p className="dash-modal-subtitle">Electronic Prescription &amp; Clinical Management · ई-परामर्श पर्ची</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-modal-close"
                  onClick={() => setPrescribePatient(null)}
                >
                  <Icon name="LuX" size={18} />
                </button>
              </div>

              <div className="dash-modal-body">
                {/* Patient Header Ribbon */}
                <div className="dash-rx-patient-bar">
                  <div className="dash-rx-p-left">
                    <div className="dash-rx-p-name">
                      {prescribePatient.patientName}
                      <span className="dash-rx-badge font-mono">{prescribePatient.uhid}</span>
                      <span className="dash-rx-badge">🩸 {prescribePatient.bloodGroup || "B+"}</span>
                    </div>
                    <div className="dash-rx-p-sub">
                      Age/Gender: <strong>{prescribePatient.age} Yrs / {prescribePatient.gender}</strong> | Token: <strong className="font-mono text-emerald-800">{prescribePatient.token}</strong> | Phone: {prescribePatient.phone}
                    </div>
                  </div>
                  <div className="dash-rx-p-right">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-500">Consultant:</span>
                      <div className="font-bold text-navy-900 text-sm">{prescribePatient.doctor}</div>
                      <div className="text-xs text-blue-800">{prescribePatient.category || "General Medicine"}</div>
                    </div>
                  </div>
                </div>

                {/* Vitals Input Strip */}
                <div className="dash-rx-vitals-strip">
                  <div className="dash-rx-vital-box">
                    <label>Blood Pressure (BP)</label>
                    <input
                      type="text"
                      value={rxData.bp}
                      onChange={(e) => setRxData({ ...rxData, bp: e.target.value })}
                      placeholder="120/80 mmHg"
                    />
                  </div>
                  <div className="dash-rx-vital-box">
                    <label>Pulse Rate</label>
                    <input
                      type="text"
                      value={rxData.pulse}
                      onChange={(e) => setRxData({ ...rxData, pulse: e.target.value })}
                      placeholder="76 bpm"
                    />
                  </div>
                  <div className="dash-rx-vital-box">
                    <label>Body Temp (°F)</label>
                    <input
                      type="text"
                      value={rxData.temp}
                      onChange={(e) => setRxData({ ...rxData, temp: e.target.value })}
                      placeholder="98.6 °F"
                    />
                  </div>
                  <div className="dash-rx-vital-box">
                    <label>Oxygen (SpO2)</label>
                    <input
                      type="text"
                      value={rxData.spo2}
                      onChange={(e) => setRxData({ ...rxData, spo2: e.target.value })}
                      placeholder="99 %"
                    />
                  </div>
                  <div className="dash-rx-vital-box">
                    <label>Patient Weight</label>
                    <input
                      type="text"
                      value={rxData.weight}
                      onChange={(e) => setRxData({ ...rxData, weight: e.target.value })}
                      placeholder="65 kg"
                    />
                  </div>
                </div>

                {/* Clinical Findings & Diagnosis */}
                <div className="dash-rx-findings-grid">
                  <div>
                    <label className="dash-form-label">Chief Complaints / Clinical Symptoms</label>
                    <input
                      type="text"
                      className="dash-form-input"
                      value={rxData.chiefComplaints}
                      onChange={(e) => setRxData({ ...rxData, chiefComplaints: e.target.value })}
                      placeholder="Symptoms and complaints..."
                    />
                  </div>
                  <div>
                    <label className="dash-form-label">Provisional Clinical Diagnosis</label>
                    <input
                      type="text"
                      className="dash-form-input font-semibold text-blue-900"
                      value={rxData.diagnosis}
                      onChange={(e) => setRxData({ ...rxData, diagnosis: e.target.value })}
                      placeholder="Clinical diagnosis..."
                    />
                  </div>
                </div>

                {/* Prescribed Medications Table (Rx) */}
                <div className="dash-rx-meds-card">
                  <div className="dash-rx-meds-head">
                    <div className="dash-rx-symbol-title">
                      <span className="dash-rx-symbol">℞</span>
                      <strong>Prescribed Medications &amp; Dosage Instructions</strong>
                    </div>
                    <button
                      type="button"
                      className="dash-rx-add-btn"
                      onClick={handleAddMedicineRow}
                    >
                      + Add Medicine
                    </button>
                  </div>

                  <div className="dash-rx-table-wrap">
                    <table className="dash-rx-table">
                      <thead>
                        <tr>
                          <th style={{ width: "6%" }}>#</th>
                          <th style={{ width: "42%" }}>MEDICINE NAME &amp; STRENGTH</th>
                          <th style={{ width: "20%" }}>DOSAGE (FREQ)</th>
                          <th style={{ width: "18%" }}>TIMING</th>
                          <th style={{ width: "14%" }}>DURATION</th>
                          <th style={{ width: "8%" }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rxData.medicines.map((med, index) => (
                          <tr key={med.id}>
                            <td className="font-mono text-center text-xs font-bold text-slate-500">
                              {String(index + 1).padStart(2, "0")}
                            </td>
                            <td>
                              <input
                                type="text"
                                className="dash-rx-input-name"
                                value={med.name}
                                onChange={(e) => handleMedicineChange(med.id, "name", e.target.value)}
                                placeholder="e.g. Tab. Paracetamol 650mg"
                              />
                            </td>
                            <td>
                              <select
                                className="dash-rx-select"
                                value={med.dosage}
                                onChange={(e) => handleMedicineChange(med.id, "dosage", e.target.value)}
                              >
                                <option value="1-0-1">1-0-1 (Morning-Night)</option>
                                <option value="1-1-1">1-1-1 (TDS - Thrice)</option>
                                <option value="1-0-0">1-0-0 (Morning Only)</option>
                                <option value="0-0-1">0-0-1 (Night Only)</option>
                                <option value="100ml SOS">SOS (When Needed)</option>
                              </select>
                            </td>
                            <td>
                              <select
                                className="dash-rx-select"
                                value={med.timing}
                                onChange={(e) => handleMedicineChange(med.id, "timing", e.target.value)}
                              >
                                <option value="After Food">After Food (भोजन बाद)</option>
                                <option value="Before Food">Before Food (खाली पेट)</option>
                                <option value="As Needed">As Needed (जरूरत पर)</option>
                                <option value="At Bedtime">At Bedtime (सोते समय)</option>
                              </select>
                            </td>
                            <td>
                              <select
                                className="dash-rx-select"
                                value={med.duration}
                                onChange={(e) => handleMedicineChange(med.id, "duration", e.target.value)}
                              >
                                <option value="3 Days">3 Days</option>
                                <option value="5 Days">5 Days</option>
                                <option value="7 Days">7 Days</option>
                                <option value="10 Days">10 Days</option>
                                <option value="14 Days">14 Days</option>
                                <option value="1 Month">1 Month</option>
                              </select>
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="dash-rx-btn-trash"
                                onClick={() => handleRemoveMedicineRow(med.id)}
                                title="Remove Medicine"
                                disabled={rxData.medicines.length <= 1}
                              >
                                <Icon name="LuTrash2" size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dietary Advice & Follow-Up */}
                <div className="dash-rx-footer-grid">
                  <div>
                    <label className="dash-form-label">Special Advice / Dietary Precautions</label>
                    <textarea
                      className="dash-form-textarea"
                      rows={2}
                      value={rxData.advice}
                      onChange={(e) => setRxData({ ...rxData, advice: e.target.value })}
                      placeholder="Special instructions for patient..."
                    />
                  </div>
                  <div>
                    <label className="dash-form-label">Next Follow-Up Visit</label>
                    <input
                      type="text"
                      className="dash-form-input font-semibold"
                      value={rxData.followUp}
                      onChange={(e) => setRxData({ ...rxData, followUp: e.target.value })}
                      placeholder="e.g. After 3 Days or SOS"
                    />
                  </div>
                </div>
              </div>

              <div className="dash-modal-footer">
                <button
                  type="button"
                  className="dash-btn-sec"
                  onClick={() => setPrescribePatient(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dash-btn-action-alt"
                  onClick={() => {
                    const target = prescribePatient;
                    setPrescribePatient(null);
                    handleOpenPrint(target);
                  }}
                >
                  <Icon name="LuPrinter" size={14} /> Print Appointment Slip
                </button>
                <button
                  type="button"
                  className="dash-btn-pri"
                  onClick={handleSavePrescription}
                >
                  <Icon name="LuCheckCircle" size={15} /> Save &amp; Issue Prescription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. PRINT SLIP MODAL & TICKET (PREMIUM UI + NO BLANK PAGE)*/}
        {/* ======================================================== */}
        {printSlip && (
          <div className="dash-modal-overlay">
            <div className="dash-modal-box dash-modal-box--print">
              <div className="dash-modal-header">
                <div className="dash-modal-header-left">
                  <div className="dash-modal-header-icon print">
                    <Icon name="LuPrinter" size={20} />
                  </div>
                  <div>
                    <h3>Appointment Slip Preview</h3>
                    <p className="dash-modal-subtitle">Hospital Inpatient &amp; Outpatient Token Ticket · परामर्श पर्ची</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-modal-close"
                  onClick={() => setPrintSlip(null)}
                >
                  <Icon name="LuX" size={18} />
                </button>
              </div>

              <div className="dash-modal-body">
                {/* Printable Appointment Slip (ID matches @media print) */}
                <div className="dash-printable-slip" id="dash-printable-slip">
                  {/* Top Accent Strip */}
                  <div className="dash-slip-top-accent"></div>

                  {/* Hospital Branding Header */}
                  <div className="dash-slip-hosp-header">
                    <div className="dash-slip-brand">
                      <div className="dash-slip-logo">
                        <Icon name="LuPlus" size={24} />
                      </div>
                      <div>
                        <h2 className="dash-slip-hosp-name">NARAYAN HOSPITAL &amp; MEDICAL RESEARCH CENTRE</h2>
                        <p className="dash-slip-hosp-sub">NABH Accredited Multi-Specialty Hospital • 24x7 Emergency &amp; Trauma Care</p>
                        <p className="dash-slip-hosp-addr">Station Road, Civil Lines, Kota, Rajasthan - 324001 • Tel: +91 744 2450000</p>
                      </div>
                    </div>
                    <div className="dash-slip-token-box">
                      <span className="dash-slip-token-lbl">{printSlip.patientType} TOKEN NO.</span>
                      <span className="dash-slip-token-num">{printSlip.token}</span>
                      <span className="dash-slip-token-date">{printSlip.date}</span>
                    </div>
                  </div>

                  <div className="dash-slip-title-bar">
                    <span>{printSlip.patientType} CONSULTATION &amp; APPOINTMENT TOKEN TICKET</span>
                  </div>

                  {/* 2-Column Info Grid */}
                  <div className="dash-slip-grid">
                    <div className="dash-slip-row">
                      <span className="dash-slip-lbl">Patient Name:</span>
                      <span className="dash-slip-val font-bold text-slate-900">{printSlip.patientName}</span>
                    </div>
                    <div className="dash-slip-row">
                      <span className="dash-slip-lbl">UHID Number:</span>
                      <span className="dash-slip-val font-mono font-bold text-blue-900">{printSlip.uhid}</span>
                    </div>
                    <div className="dash-slip-row">
                      <span className="dash-slip-lbl">Age / Gender:</span>
                      <span className="dash-slip-val">{printSlip.age} Yrs / {printSlip.gender}</span>
                    </div>
                    <div className="dash-slip-row">
                      <span className="dash-slip-lbl">Mobile Phone:</span>
                      <span className="dash-slip-val">{printSlip.phone}</span>
                    </div>
                    <div className="dash-slip-row">
                      <span className="dash-slip-lbl">Blood Group:</span>
                      <span className="dash-slip-val font-bold text-red-600">🩸 {printSlip.bloodGroup || "B+"}</span>
                    </div>
                    <div className="dash-slip-row">
                      <span className="dash-slip-lbl">Patient Type:</span>
                      <span className="dash-slip-val font-bold text-teal-800">{printSlip.patientType} Patient</span>
                    </div>
                    <div className="dash-slip-row">
                      <span className="dash-slip-lbl">Attending Doctor:</span>
                      <span className="dash-slip-val font-semibold">{printSlip.doctor}</span>
                    </div>
                    <div className="dash-slip-row">
                      <span className="dash-slip-lbl">Department / Specialty:</span>
                      <span className="dash-slip-val">{printSlip.category || printSlip.department || "General Medicine"}</span>
                    </div>
                    <div className="dash-slip-row">
                      <span className="dash-slip-lbl">Date &amp; Time:</span>
                      <span className="dash-slip-val">{printSlip.date} at {printSlip.time || "10:30 AM"}</span>
                    </div>
                    <div className="dash-slip-row">
                      <span className="dash-slip-lbl">Booking Status:</span>
                      <span className="dash-slip-val font-bold text-emerald-800">{printSlip.status}</span>
                    </div>
                    <div className="dash-slip-row full">
                      <span className="dash-slip-lbl">Chief Complaint:</span>
                      <span className="dash-slip-val">{printSlip.chiefComplaint || "General consultation & clinical checkup"}</span>
                    </div>
                    <div className="dash-slip-row full">
                      <span className="dash-slip-lbl">Provisional Diagnosis:</span>
                      <span className="dash-slip-val">{printSlip.diagnosis || "Under clinical evaluation"}</span>
                    </div>
                    <div className="dash-slip-row full">
                      <span className="dash-slip-lbl">Residential Address:</span>
                      <span className="dash-slip-val">{printSlip.address || "Civil Lines, Kota, Rajasthan"}</span>
                    </div>
                  </div>

                  {/* Fee & Receipt Summary Box */}
                  <div className="dash-slip-fee-box">
                    <div className="dash-slip-fee-line">
                      <span>Particular / Service Description:</span>
                      <strong>{printSlip.patientType} Consultation &amp; Registration Fee</strong>
                    </div>
                    <div className="dash-slip-fee-line">
                      <span>Total Amount Paid ({printSlip.paymentMode || "Cash"}):</span>
                      <strong className="text-emerald-900 text-base">₹ {Number(printSlip.fee || 500).toFixed(2)}</strong>
                    </div>
                    <div className="dash-slip-fee-line">
                      <span>Payment Status:</span>
                      <strong className="text-green-700">✓ PAID (प्राप्त)</strong>
                    </div>
                  </div>

                  {/* Instructions & Footer */}
                  <div className="dash-slip-footer-notes">
                    <div className="dash-slip-notes-left">
                      <p>• Please present this consultation slip at Doctor Consultation Chamber / OPD Counter.</p>
                      <p>• Valid for 7 days from issue date for routine follow-up consultation.</p>
                      <p className="text-[11px] text-slate-500 mt-1">* Computer generated electronic token receipt.</p>
                      {/* Barcode Graphic */}
                      <div className="dash-slip-barcode">
                        <div className="dash-barcode-lines"></div>
                        <span className="dash-barcode-text">*{printSlip.uhid}-{printSlip.token}*</span>
                      </div>
                    </div>
                    <div className="dash-slip-notes-right">
                      <div className="dash-slip-sig-line"></div>
                      <span className="dash-slip-signature">Authorized Hospital Signatory</span>
                      <span className="dash-slip-timestamp">Generated: {new Date().toLocaleString()}</span>
                    </div>
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
                  onClick={handlePrintTicket}
                >
                  <Icon name="LuPrinter" size={15} /> Print Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}