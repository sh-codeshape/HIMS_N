import React, { useState } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import "./BedAllotment.css";

export default function BedAllotment() {
  const [searchQuery, setSearchQuery] = useState("UHID12345");
  const [searchType, setSearchType] = useState("UHID");

  // Selection states
  const [selectedFloor, setSelectedFloor] = useState("Ground Floor");
  const [selectedWard, setSelectedWard] = useState("General Ward");
  const [selectedRoom, setSelectedRoom] = useState("GW-101 (4 Beds)");
  const [viewMode, setViewMode] = useState("Floor Map");

  // Selected Bed for Allotment
  const [selectedBed, setSelectedBed] = useState({
    bedNo: "GW-101-B1",
    room: "GW-101",
    ward: "General Ward",
    floor: "Ground Floor",
    status: "Available",
  });

  // Admission Form state
  const [admissionForm, setAdmissionForm] = useState({
    type: "IPD",
    department: "General Medicine",
    consultant: "Dr. Amit Sharma",
    expectedStay: "5",
    admissionTime: "29-09-2026 10:30 AM",
    specialInstructions: "",
  });

  // Bed matrix in selected room (GW-101)
  const roomBeds = [
    { id: 1, bedNo: "GW-101-B1", patientName: "-", uhid: "-", genderAge: "-", admissionDate: "-", status: "Available" },
    { id: 2, bedNo: "GW-101-B2", patientName: "-", uhid: "-", genderAge: "-", admissionDate: "-", status: "Available" },
    { id: 3, bedNo: "GW-101-B3", patientName: "Suman Yadav", uhid: "UHID12348", genderAge: "36 Y / Female", admissionDate: "27-09-2026", status: "Occupied" },
    { id: 4, bedNo: "GW-101-B4", patientName: "-", uhid: "-", genderAge: "-", admissionDate: "-", status: "Maintenance" },
  ];

  const handleAllocateBed = () => {
    if (!selectedBed || selectedBed.status !== "Available") {
      toast.error("Please select an Available bed first!");
      return;
    }
    toast.success(`Bed ${selectedBed.bedNo} successfully allotted to Rohit Kumar (UHID12345)!`, {
      icon: "🛏️",
    });
  };

  return (
    <div className="bed-allotment-page">
      {/* 1. Header Section */}
      <div className="bed-allotment-header">
        <div className="bed-allotment-header__title-group">
          <div className="bed-allotment-header__icon">
            <Icon name="LuBed" size={24} />
          </div>
          <div>
            <h1 className="bed-allotment-header__title">Bed Allotment</h1>
            <p className="bed-allotment-header__subtitle">
              Allocate bed for IPD / Emergency patients
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
          <div className="breadcrumb-text">
            Home &gt; IPD / OPD Ward &gt; <span>Bed Allotment</span>
          </div>
          <button
            type="button"
            className="search-btn-primary"
            style={{ background: "#ffffff", color: "#2563eb", border: "1px solid #cbd5e1" }}
            onClick={() => toast.info("Opening Floor Bed Map view...")}
          >
            <Icon name="LuLayoutGrid" size={14} />
            View Bed Map
          </button>
        </div>
      </div>

      {/* 2. Stepper Bar */}
      <div className="allotment-stepper-bar">
        <div className="stepper-item stepper-item--active">
          <span className="stepper-num">1</span>
          <span>Search Patient</span>
        </div>
        <div className="stepper-divider"></div>
        <div className="stepper-item stepper-item--active">
          <span className="stepper-num">2</span>
          <span>Select Ward & Bed</span>
        </div>
        <div className="stepper-divider"></div>
        <div className="stepper-item stepper-item--active">
          <span className="stepper-num">3</span>
          <span>Admission Details</span>
        </div>
        <div className="stepper-divider"></div>
        <div className="stepper-item stepper-item--active">
          <span className="stepper-num">4</span>
          <span>Confirm Allotment</span>
        </div>
      </div>

      {/* 3. Top Dual Grid: Step 1 Search Patient (Left) & Recent Admissions (Right) */}
      <div className="allotment-top-grid">
        {/* Step 1: Search Patient */}
        <div className="allotment-card">
          <div className="allotment-card__step-header">
            <div>
              <span className="step-circle">1</span>
              <span>Search Patient</span>
            </div>
            <div className="search-radio-group">
              <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="searchType"
                  checked={searchType === "UHID"}
                  onChange={() => setSearchType("UHID")}
                />{" "}
                UHID
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="searchType"
                  checked={searchType === "Mobile"}
                  onChange={() => setSearchType("Mobile")}
                />{" "}
                Mobile
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="searchType"
                  checked={searchType === "Name"}
                  onChange={() => setSearchType("Name")}
                />{" "}
                Name
              </label>
            </div>
          </div>

          <div className="patient-search-row">
            <div className="search-input-group">
              <input
                type="text"
                className="search-input-field"
                placeholder="Search by UHID, Mobile, Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="search-btn-primary"
                onClick={() => toast.success("Patient profile loaded!")}
              >
                <Icon name="LuSearch" size={14} /> Search
              </button>
            </div>

            <button
              type="button"
              className="btn-new-patient"
              onClick={() => toast.info("Opening New Patient Registration modal...")}
            >
              <Icon name="LuUserPlus" size={14} /> + New Patient
            </button>
          </div>

          {/* Patient Profile Card Result */}
          <div className="patient-profile-box">
            <div className="patient-avatar-col">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                }}
              >
                RK
              </div>
              <button type="button" className="btn-view-profile">
                View Full Profile
              </button>
            </div>

            <div className="patient-info-col">
              <div className="patient-name-title">
                Rohit Kumar
                <span className="patient-badge-exist">Existing Patient</span>
              </div>
              <span className="patient-meta-text" style={{ fontWeight: 700, color: "#2563eb" }}>
                UHID12345
              </span>
              <span className="patient-meta-text">
                <Icon name="LuUser" size={12} /> 28 Years / Male
              </span>
              <span className="patient-meta-text">
                <Icon name="LuPhone" size={12} /> 9876543210
              </span>
              <span className="patient-meta-text">
                <Icon name="LuMapPin" size={12} /> Varanasi, Uttar Pradesh
              </span>
            </div>

            <div className="patient-info-col">
              <span className="patient-meta-text">
                🩸 Blood Group : <strong style={{ color: "#ef4444" }}>B+</strong>
              </span>
              <span className="patient-meta-text">
                🛡️ Allergies : <strong>NKA</strong>
              </span>
              <span className="patient-meta-text" style={{ marginTop: "0.2rem" }}>
                🫀 Known History : <br />
                <strong>Hypertension, Diabetes</strong>
              </span>
            </div>

            <div className="patient-info-col">
              <span className="patient-meta-text">
                Last Visit : <strong>29-09-2026</strong>
              </span>
              <span className="patient-meta-text">
                Patient Type : <strong>OPD</strong>
              </span>
              <span className="patient-meta-text">
                Department : <strong>General Medicine</strong>
              </span>
              <span className="patient-meta-text">
                Consultant : <strong>Dr. Amit Sharma</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Recent Admissions */}
        <div className="allotment-card">
          <div className="allotment-card__step-header">
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Icon name="LuHistory" size={16} style={{ color: "#ef4444" }} />
              Recent Admissions
            </span>
            <span style={{ fontSize: "0.75rem", color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>
              View All
            </span>
          </div>

          <table className="recent-admissions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ward / Room / Bed</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>29-09-2026</td>
                <td style={{ fontWeight: 600 }}>GW-101 / B-3</td>
                <td>IPD</td>
                <td>
                  <span className="status-badge status-badge--available">Discharged</span>
                </td>
              </tr>
              <tr>
                <td>15-08-2026</td>
                <td style={{ fontWeight: 600 }}>CW-203 / B-1</td>
                <td>IPD</td>
                <td>
                  <span className="status-badge status-badge--available">Discharged</span>
                </td>
              </tr>
              <tr>
                <td>12-06-2026</td>
                <td style={{ fontWeight: 600 }}>GW-104 / B-2</td>
                <td>Emergency</td>
                <td>
                  <span className="status-badge status-badge--reserved">Discharged</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bottom Dual Grid: Step 2 Select Ward & Bed (Left) & Step 3/4 Admission & Confirm (Right) */}
      <div className="allotment-bottom-grid">
        {/* Step 2: Select Ward, Room & Bed */}
        <div className="allotment-card">
          <div className="allotment-card__step-header">
            <div>
              <span className="step-circle">2</span>
              <span>Select Ward, Room & Bed</span>
            </div>

            <div className="ward-filter-selectors">
              <div className="ward-filter-group">
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Select Floor</label>
                <select
                  className="blueprint-select"
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="First Floor">First Floor</option>
                  <option value="Second Floor">Second Floor</option>
                </select>

                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Select Ward</label>
                <select
                  className="blueprint-select"
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                >
                  <option value="General Ward">General Ward</option>
                  <option value="ICU Ward">ICU Ward</option>
                  <option value="Deluxe Ward">Deluxe Ward</option>
                </select>

                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Select Room</label>
                <select
                  className="blueprint-select"
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                >
                  <option value="GW-101 (4 Beds)">GW-101 (4 Beds)</option>
                  <option value="GW-102 (4 Beds)">GW-102 (4 Beds)</option>
                  <option value="GW-103 (4 Beds)">GW-103 (4 Beds)</option>
                </select>
              </div>

              <div className="ward-view-toggle">
                <button
                  type="button"
                  className={`toggle-btn ${viewMode === "Floor Map" ? "toggle-btn--active" : ""}`}
                  onClick={() => setViewMode("Floor Map")}
                >
                  Floor Map
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${viewMode === "List View" ? "toggle-btn--active" : ""}`}
                  onClick={() => setViewMode("List View")}
                >
                  List View
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Blueprint Canvas Layout */}
          <div className="blueprint-frame">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.4rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              <span>Ground Floor - General Ward</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.725rem", color: "#475569" }}>
                <span>🟢 Available</span>
                <span>🔴 Occupied</span>
                <span>🟠 Reserved</span>
                <span>🔘 Maintenance</span>
              </div>
            </div>

            <div className="blueprint-floor-plan">
              {/* Utility Column */}
              <div className="blueprint-utility-column">
                <div className="blueprint-utility-box blueprint-utility-box--nursing">
                  <div className="blueprint-utility-icon">
                    <Icon name="LuUserCheck" size={18} />
                  </div>
                  <span className="blueprint-utility-title">Nursing Station</span>
                </div>
                <div className="blueprint-utility-box blueprint-utility-box--lift">
                  <div className="blueprint-utility-icon">
                    <Icon name="LuArrowUpUp" size={16} />
                  </div>
                  <span className="blueprint-utility-title">Lift</span>
                </div>
                <div className="blueprint-utility-box blueprint-utility-box--stairs">
                  <div className="blueprint-utility-icon">
                    <Icon name="LuFootprints" size={16} />
                  </div>
                  <span className="blueprint-utility-title">Stairs</span>
                </div>
              </div>

              {/* Rooms & Corridor */}
              <div className="blueprint-rooms-container">
                <div className="blueprint-rooms-row">
                  {/* GW-101 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-101</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      <div
                        className={`blueprint-bed-item blueprint-bed-item--available ${
                          selectedBed?.bedNo === "GW-101-B1" ? "bed-chip--selected" : ""
                        }`}
                        onClick={() =>
                          setSelectedBed({
                            bedNo: "GW-101-B1",
                            room: "GW-101",
                            ward: "General Ward",
                            floor: "Ground Floor",
                            status: "Available",
                          })
                        }
                      >
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">1</span>
                      </div>
                      <div
                        className={`blueprint-bed-item blueprint-bed-item--available ${
                          selectedBed?.bedNo === "GW-101-B2" ? "bed-chip--selected" : ""
                        }`}
                        onClick={() =>
                          setSelectedBed({
                            bedNo: "GW-101-B2",
                            room: "GW-101",
                            ward: "General Ward",
                            floor: "Ground Floor",
                            status: "Available",
                          })
                        }
                      >
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">2</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--occupied">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">3</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--maintenance">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">4</span>
                      </div>
                    </div>
                  </div>

                  {/* GW-102 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-102</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">1</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">2</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--reserved">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">3</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">4</span>
                      </div>
                    </div>
                  </div>

                  {/* GW-103 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-103</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">1</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--occupied">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">2</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">3</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">4</span>
                      </div>
                    </div>
                  </div>

                  {/* Isolation */}
                  <div className="blueprint-room blueprint-room--isolation">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">Isolation</div>
                      <div className="blueprint-room__capacity">2 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      <div className="blueprint-bed-item blueprint-bed-item--reserved">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">1</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--reserved">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">2</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="blueprint-corridor">CORRIDOR</div>

                <div className="blueprint-rooms-row">
                  {/* GW-104 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-104</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      <div className="blueprint-bed-item blueprint-bed-item--reserved">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">1</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">2</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--reserved">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">3</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--reserved">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">4</span>
                      </div>
                    </div>
                  </div>

                  {/* GW-105 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-105</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      <div className="blueprint-bed-item blueprint-bed-item--occupied">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">1</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--occupied">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">2</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">3</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">4</span>
                      </div>
                    </div>
                  </div>

                  {/* GW-106 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-106</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">1</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">2</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--available">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">3</span>
                      </div>
                      <div className="blueprint-bed-item blueprint-bed-item--reserved">
                        <Icon name="LuBed" size={16} />
                        <span className="blueprint-bed-num">4</span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Room */}
                  <div className="blueprint-room blueprint-room--doctor">
                    <div className="blueprint-utility-icon" style={{ background: "#2563eb" }}>
                      <Icon name="LuStethoscope" size={18} />
                    </div>
                    <span className="blueprint-utility-title" style={{ color: "#1e3a8a" }}>
                      Doctor Room
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Beds Table in Selected Room */}
          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.4rem",
              }}
            >
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Available Beds in GW-101
              </h4>
              <span className="status-badge status-badge--available">2 Available</span>
            </div>

            <table className="recent-admissions-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bed No.</th>
                  <th>Patient Name</th>
                  <th>UHID</th>
                  <th>Gender / Age</th>
                  <th>Admission Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {roomBeds.map((rb, idx) => (
                  <tr key={rb.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>{rb.bedNo}</td>
                    <td>{rb.patientName}</td>
                    <td>{rb.uhid}</td>
                    <td>{rb.genderAge}</td>
                    <td>{rb.admissionDate}</td>
                    <td>
                      <span className={`status-badge status-badge--${rb.status.toLowerCase()}`}>
                        {rb.status}
                      </span>
                    </td>
                    <td>
                      {rb.status === "Available" ? (
                        <button
                          type="button"
                          className="search-btn-primary"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.725rem" }}
                          onClick={() =>
                            setSelectedBed({
                              bedNo: rb.bedNo,
                              room: "GW-101",
                              ward: "General Ward",
                              floor: "Ground Floor",
                              status: "Available",
                            })
                          }
                        >
                          <Icon name="LuUserCheck" size={12} /> Allocate
                        </button>
                      ) : rb.status === "Occupied" ? (
                        <button
                          type="button"
                          className="search-btn-primary"
                          style={{
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.725rem",
                            background: "#ffffff",
                            color: "#2563eb",
                            border: "1px solid #cbd5e1",
                          }}
                        >
                          <Icon name="LuEye" size={12} /> View
                        </button>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side Column: Step 3 Admission Details & Step 4 Confirm Allotment */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Step 3: Admission Details */}
          <div className="allotment-card">
            <div className="allotment-card__step-header">
              <div>
                <span className="step-circle">3</span>
                <span>Admission Details</span>
              </div>
            </div>

            <div className="ward-form-group">
              <label className="ward-form-label">Admission Type *</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8rem", color: "#334155" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="admType"
                    checked={admissionForm.type === "IPD"}
                    onChange={() => setAdmissionForm({ ...admissionForm, type: "IPD" })}
                  />{" "}
                  IPD
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="admType"
                    checked={admissionForm.type === "Day Care"}
                    onChange={() => setAdmissionForm({ ...admissionForm, type: "Day Care" })}
                  />{" "}
                  Day Care
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="admType"
                    checked={admissionForm.type === "Emergency"}
                    onChange={() => setAdmissionForm({ ...admissionForm, type: "Emergency" })}
                  />{" "}
                  Emergency
                </label>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div className="ward-form-group">
                <label className="ward-form-label">Department *</label>
                <select
                  className="ward-form-select"
                  value={admissionForm.department}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, department: e.target.value })}
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Gynecology">Gynecology</option>
                </select>
              </div>

              <div className="ward-form-group">
                <label className="ward-form-label">Consultant *</label>
                <select
                  className="ward-form-select"
                  value={admissionForm.consultant}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, consultant: e.target.value })}
                >
                  <option value="Dr. Amit Sharma">Dr. Amit Sharma</option>
                  <option value="Dr. Rajesh Sharma">Dr. Rajesh Sharma</option>
                  <option value="Dr. Priya Deshmukh">Dr. Priya Deshmukh</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div className="ward-form-group">
                <label className="ward-form-label">Expected Stay (Days)</label>
                <input
                  type="number"
                  className="ward-form-input"
                  value={admissionForm.expectedStay}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, expectedStay: e.target.value })}
                />
              </div>

              <div className="ward-form-group">
                <label className="ward-form-label">Admission Date & Time *</label>
                <input
                  type="text"
                  className="ward-form-input"
                  value={admissionForm.admissionTime}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, admissionTime: e.target.value })}
                />
              </div>
            </div>

            <div className="ward-form-group">
              <label className="ward-form-label">Special Instructions</label>
              <textarea
                className="ward-form-input"
                rows="2"
                placeholder="Enter special instructions..."
                value={admissionForm.specialInstructions}
                onChange={(e) => setAdmissionForm({ ...admissionForm, specialInstructions: e.target.value })}
              ></textarea>
            </div>
          </div>

          {/* Step 4: Selected Bed Information & Confirmation */}
          <div className="allotment-card">
            <div className="allotment-card__step-header">
              <div>
                <span className="step-circle">4</span>
                <span>Selected Bed Information</span>
              </div>
            </div>

            <div className="selected-bed-banner">
              <div className="bed-banner-head">
                <div>
                  <span style={{ fontSize: "0.725rem", color: "#64748b" }}>Bed No.</span>
                  <div className="bed-banner-num">{selectedBed.bedNo}</div>
                </div>
                <span className="status-badge status-badge--available">{selectedBed.status}</span>
              </div>

              <div className="bed-banner-details">
                <div>
                  Ward <br />
                  <span>{selectedBed.ward}</span>
                </div>
                <div>
                  Room <br />
                  <span>{selectedBed.room}</span>
                </div>
                <div>
                  Floor <br />
                  <span>{selectedBed.floor}</span>
                </div>
              </div>
            </div>

            <div className="allotment-action-btns">
              <button
                type="button"
                className="btn-reset"
                onClick={() => {
                  setSelectedBed({
                    bedNo: "GW-101-B1",
                    room: "GW-101",
                    ward: "General Ward",
                    floor: "Ground Floor",
                    status: "Available",
                  });
                  toast.info("Reset selection");
                }}
              >
                <Icon name="LuRotateCcw" size={14} /> Reset
              </button>

              <button type="button" className="btn-allot-confirm" onClick={handleAllocateBed}>
                <Icon name="LuBed" size={18} /> Allocate Bed
              </button>

              <button
                type="button"
                className="btn-print-icon"
                title="Print Slip"
                onClick={() => toast.success("Printing Bed Allotment Slip...")}
              >
                <Icon name="LuPrinter" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
