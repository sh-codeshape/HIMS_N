import React, { useState } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import "./BedTransfer.css";

export default function BedTransfer() {
  const [searchQuery, setSearchQuery] = useState("UHID12345");
  
  // Selection states
  const [selectedFloor, setSelectedFloor] = useState("Ground Floor");
  const [selectedWard, setSelectedWard] = useState("General Ward");
  const [selectedRoom, setSelectedRoom] = useState("GW-102 (4 Beds)");
  const [selectedBedType, setSelectedBedType] = useState("All");

  // Selected Target Bed
  const [selectedTargetBed, setSelectedTargetBed] = useState({
    bedNo: "GW-102 - B2",
    room: "GW-102",
    ward: "General Ward",
    floor: "Ground Floor",
    bedType: "General",
    status: "Available",
  });

  // Transfer Form Details
  const [transferDetails, setTransferDetails] = useState({
    transferTime: "30-09-2026 11:15 AM",
    reason: "Bed Change (Clinical)",
    notes: "",
  });

  // Handle Transfer Action
  const handleConfirmTransfer = () => {
    if (!selectedTargetBed || selectedTargetBed.status !== "Available") {
      toast.error("Please select a valid vacant bed for transfer!");
      return;
    }
    toast.success(
      `Patient Rohit Kumar transferred from GW-101 - B3 to ${selectedTargetBed.bedNo} successfully!`,
      { icon: "🔄" }
    );
  };

  return (
    <div className="bed-transfer-page">
      {/* 1. Header Section */}
      <div className="bed-transfer-header">
        <div className="bed-transfer-header__title-group">
          <div className="bed-transfer-header__icon">
            <Icon name="LuArrowLeftRight" size={24} />
          </div>
          <div>
            <h1 className="bed-transfer-header__title">Bed Transfer</h1>
            <p className="bed-transfer-header__subtitle">
              Transfer patient from one bed to another
            </p>
          </div>
        </div>

        <div className="breadcrumb-text">
          Home &gt; IPD / OPD Ward &gt; <span>Bed Transfer</span>
        </div>
      </div>

      {/* 2. Stepper Bar */}
      <div className="transfer-stepper-bar">
        <div className="transfer-stepper-item transfer-stepper-item--active">
          <span className="transfer-stepper-num">1</span>
          <span>Search Patient</span>
        </div>
        <div className="transfer-stepper-divider"></div>
        <div className="transfer-stepper-item transfer-stepper-item--active">
          <span className="transfer-stepper-num">2</span>
          <span>Current Bed Details</span>
        </div>
        <div className="transfer-stepper-divider"></div>
        <div className="transfer-stepper-item transfer-stepper-item--active">
          <span className="transfer-stepper-num">3</span>
          <span>Select New Bed</span>
        </div>
        <div className="transfer-stepper-divider"></div>
        <div className="transfer-stepper-item">
          <span className="transfer-stepper-num">4</span>
          <span>Confirm Transfer</span>
        </div>
      </div>

      {/* 3. Top Dual Grid: Step 1 Search Patient (Left) & Recent History (Right) */}
      <div className="transfer-top-grid">
        {/* Step 1: Search Patient */}
        <div className="transfer-card">
          <div className="transfer-card__header">
            <div>
              <span className="transfer-step-num">1</span>
              <span>Search Patient</span>
            </div>
          </div>

          <div className="patient-search-row">
            <div className="search-input-group">
              <input
                type="text"
                className="search-input-field"
                placeholder="Enter UHID, Mobile, Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="search-btn-primary"
                onClick={() => toast.success("Patient details loaded!")}
              >
                <Icon name="LuSearch" size={14} /> Search
              </button>
            </div>
          </div>

          {/* Loaded Patient Profile Card */}
          <div className="patient-profile-box" style={{ gridTemplateColumns: "110px 1.2fr 1fr 1.2fr" }}>
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
            </div>

            <div className="patient-info-col">
              <div className="patient-name-title">
                Rohit Kumar
                <span className="patient-badge-exist">Admitted</span>
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

            <div className="patient-info-col" style={{ fontSize: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Admission No.</span>
                <span>: <strong>IPD20260929001</strong></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Admission Date</span>
                <span>: <strong>29-09-2026 10:30 AM</strong></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Department</span>
                <span>: <strong>General Medicine</strong></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Consultant</span>
                <span>: <strong>Dr. Amit Sharma</strong></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Current Ward</span>
                <span>: <strong>General Ward</strong></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Current Bed</span>
                <span>: <strong style={{ color: "#2563eb" }}>GW-101 - B3</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transfer History */}
        <div className="transfer-card">
          <div className="transfer-card__header">
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Icon name="LuShieldCheck" size={16} style={{ color: "#2563eb" }} />
              Recent Transfer History
            </span>
            <span style={{ fontSize: "0.75rem", color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>
              View All
            </span>
          </div>

          <table className="recent-admissions-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>From Bed</th>
                <th>To Bed</th>
                <th>By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>28-09-2026 02:15 PM</td>
                <td style={{ fontWeight: 600 }}>GW-102-B1</td>
                <td style={{ fontWeight: 600, color: "#10b981" }}>GW-103-B2</td>
                <td>Priya</td>
                <td>
                  <span className="status-badge status-badge--available">Completed</span>
                </td>
              </tr>
              <tr>
                <td>25-09-2026 11:30 AM</td>
                <td style={{ fontWeight: 600 }}>GW-105-B3</td>
                <td style={{ fontWeight: 600, color: "#10b981" }}>GW-106-B1</td>
                <td>Amit</td>
                <td>
                  <span className="status-badge status-badge--available">Completed</span>
                </td>
              </tr>
              <tr>
                <td>20-09-2026 10:45 AM</td>
                <td style={{ fontWeight: 600 }}>ICU-01-B2</td>
                <td style={{ fontWeight: 600, color: "#10b981" }}>GW-101-B3</td>
                <td>Sneha</td>
                <td>
                  <span className="status-badge status-badge--available">Completed</span>
                </td>
              </tr>
              <tr>
                <td>18-09-2026 05:20 PM</td>
                <td style={{ fontWeight: 600 }}>GW-104-B1</td>
                <td style={{ fontWeight: 600, color: "#10b981" }}>GW-104-B4</td>
                <td>Rohan</td>
                <td>
                  <span className="status-badge status-badge--available">Completed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bottom Main Grid */}
      <div className="transfer-top-grid">
        {/* Left Side: Step 2 Current Bed Info & Step 3 Select New Bed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Step 2: Current Bed Information */}
          <div className="transfer-card">
            <div className="transfer-card__header">
              <div>
                <span className="transfer-step-num">2</span>
                <span>Current Bed Information</span>
              </div>
            </div>

            <div className="current-bed-banner">
              <div className="current-bed-left">
                <div className="current-bed-icon-box">
                  <Icon name="LuBed" size={22} />
                </div>
                <div>
                  <div className="current-bed-num">
                    GW-101 - B3
                    <span className="status-badge status-badge--occupied">Occupied</span>
                  </div>
                  <div className="current-bed-subtext">General Ward | Ground Floor</div>
                </div>
              </div>

              <div className="current-bed-meta-grid">
                <div>
                  Admission Date : <span>29-09-2026</span>
                </div>
                <div>
                  Department : <span>General Medicine</span>
                </div>
                <div>
                  Admission Type : <span>IPD</span>
                </div>
                <div>
                  Consultant : <span>Dr. Amit Sharma</span>
                </div>
                <div>
                  Length of Stay : <span>2 Days</span>
                </div>
                <div>
                  Reason : <span>Fever & Infection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Select New Bed */}
          <div className="transfer-card">
            <div className="transfer-card__header">
              <div>
                <span className="transfer-step-num">3</span>
                <span>Select New Bed</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", fontSize: "0.725rem", color: "#475569" }}>
                <span>🟢 Available</span>
                <span>🔴 Occupied</span>
                <span>🟠 Reserved</span>
                <span>🔘 Maintenance</span>
              </div>
            </div>

            {/* Filters Row */}
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
                  <option value="GW-102 (4 Beds)">GW-102 (4 Beds)</option>
                  <option value="GW-101 (4 Beds)">GW-101 (4 Beds)</option>
                  <option value="GW-103 (4 Beds)">GW-103 (4 Beds)</option>
                </select>

                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Bed Type</label>
                <select
                  className="blueprint-select"
                  value={selectedBedType}
                  onChange={(e) => setSelectedBedType(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="General">General</option>
                  <option value="ICU">ICU</option>
                </select>
              </div>
            </div>

            {/* Room Cards Carousel Grid */}
            <div className="rooms-carousel-grid">
              {/* Room 1: GW-101 */}
              <div className="room-card-box">
                <div className="room-card-title">GW-101</div>
                <div className="room-card-sub">(General Ward)</div>
                <div className="room-card-bed-grid">
                  <div
                    className={`transfer-bed-chip transfer-bed-chip--available ${
                      selectedTargetBed.bedNo === "GW-101 - B1" ? "transfer-bed-chip--selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedTargetBed({
                        bedNo: "GW-101 - B1",
                        room: "GW-101",
                        ward: "General Ward",
                        floor: "Ground Floor",
                        bedType: "General",
                        status: "Available",
                      })
                    }
                  >
                    <span>B1</span>
                    <span style={{ fontSize: "0.6rem" }}>Available</span>
                  </div>
                  <div className="transfer-bed-chip transfer-bed-chip--occupied">
                    <span>B2</span>
                    <span style={{ fontSize: "0.6rem" }}>Occupied</span>
                  </div>
                  <div className="transfer-bed-chip transfer-bed-chip--occupied">
                    <span>B3</span>
                    <span style={{ fontSize: "0.6rem" }}>Occupied</span>
                  </div>
                  <div className="transfer-bed-chip transfer-bed-chip--maintenance">
                    <span>B4</span>
                    <span style={{ fontSize: "0.6rem" }}>Maintenance</span>
                  </div>
                </div>
              </div>

              {/* Room 2: GW-102 (Active Selected) */}
              <div className="room-card-box room-card-box--selected">
                <div className="room-card-title">GW-102</div>
                <div className="room-card-sub">(General Ward)</div>
                <div className="room-card-bed-grid">
                  <div
                    className={`transfer-bed-chip transfer-bed-chip--available ${
                      selectedTargetBed.bedNo === "GW-102 - B1" ? "transfer-bed-chip--selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedTargetBed({
                        bedNo: "GW-102 - B1",
                        room: "GW-102",
                        ward: "General Ward",
                        floor: "Ground Floor",
                        bedType: "General",
                        status: "Available",
                      })
                    }
                  >
                    <span>B1</span>
                    <span style={{ fontSize: "0.6rem" }}>Available</span>
                  </div>
                  <div
                    className={`transfer-bed-chip transfer-bed-chip--available ${
                      selectedTargetBed.bedNo === "GW-102 - B2" ? "transfer-bed-chip--selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedTargetBed({
                        bedNo: "GW-102 - B2",
                        room: "GW-102",
                        ward: "General Ward",
                        floor: "Ground Floor",
                        bedType: "General",
                        status: "Available",
                      })
                    }
                  >
                    <span>B2</span>
                    <span style={{ fontSize: "0.6rem" }}>Available</span>
                  </div>
                  <div className="transfer-bed-chip transfer-bed-chip--occupied">
                    <span>B3</span>
                    <span style={{ fontSize: "0.6rem" }}>Occupied</span>
                  </div>
                  <div
                    className={`transfer-bed-chip transfer-bed-chip--available ${
                      selectedTargetBed.bedNo === "GW-102 - B4" ? "transfer-bed-chip--selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedTargetBed({
                        bedNo: "GW-102 - B4",
                        room: "GW-102",
                        ward: "General Ward",
                        floor: "Ground Floor",
                        bedType: "General",
                        status: "Available",
                      })
                    }
                  >
                    <span>B4</span>
                    <span style={{ fontSize: "0.6rem" }}>Available</span>
                  </div>
                </div>
              </div>

              {/* Room 3: GW-103 */}
              <div className="room-card-box">
                <div className="room-card-title">GW-103</div>
                <div className="room-card-sub">(General Ward)</div>
                <div className="room-card-bed-grid">
                  <div className="transfer-bed-chip transfer-bed-chip--reserved">
                    <span>B1</span>
                    <span style={{ fontSize: "0.6rem" }}>Reserved</span>
                  </div>
                  <div
                    className={`transfer-bed-chip transfer-bed-chip--available ${
                      selectedTargetBed.bedNo === "GW-103 - B2" ? "transfer-bed-chip--selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedTargetBed({
                        bedNo: "GW-103 - B2",
                        room: "GW-103",
                        ward: "General Ward",
                        floor: "Ground Floor",
                        bedType: "General",
                        status: "Available",
                      })
                    }
                  >
                    <span>B2</span>
                    <span style={{ fontSize: "0.6rem" }}>Available</span>
                  </div>
                  <div
                    className={`transfer-bed-chip transfer-bed-chip--available ${
                      selectedTargetBed.bedNo === "GW-103 - B3" ? "transfer-bed-chip--selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedTargetBed({
                        bedNo: "GW-103 - B3",
                        room: "GW-103",
                        ward: "General Ward",
                        floor: "Ground Floor",
                        bedType: "General",
                        status: "Available",
                      })
                    }
                  >
                    <span>B3</span>
                    <span style={{ fontSize: "0.6rem" }}>Available</span>
                  </div>
                  <div className="transfer-bed-chip transfer-bed-chip--occupied">
                    <span>B4</span>
                    <span style={{ fontSize: "0.6rem" }}>Occupied</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected New Bed Details Box */}
            <div style={{ marginTop: "0.5rem" }}>
              <span className="ward-form-label" style={{ color: "#475569" }}>
                Selected New Bed Details
              </span>
              <div className="selected-new-bed-box" style={{ marginTop: "0.25rem" }}>
                <div className="new-bed-left">
                  <div className="new-bed-icon-box">
                    <Icon name="LuBed" size={22} />
                  </div>
                  <div>
                    <div className="new-bed-num">
                      {selectedTargetBed.bedNo}
                      <span className="status-badge status-badge--available">
                        {selectedTargetBed.status}
                      </span>
                    </div>
                    <div className="current-bed-subtext">
                      {selectedTargetBed.ward} | {selectedTargetBed.floor} | 4 Bed Room
                    </div>
                  </div>
                </div>

                <div className="current-bed-meta-grid">
                  <div>
                    Bed Type : <span>{selectedTargetBed.bedType}</span>
                  </div>
                  <div>
                    Room No. : <span>{selectedTargetBed.room}</span>
                  </div>
                  <div>
                    Ward : <span>{selectedTargetBed.ward}</span>
                  </div>
                  <div>
                    Remarks : <span>-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Column: Step 4 Transfer Details & Step 5 Confirm Transfer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Step 4: Transfer Details */}
          <div className="transfer-card">
            <div className="transfer-card__header">
              <div>
                <span className="transfer-step-num">4</span>
                <span>Transfer Details</span>
              </div>
            </div>

            <div className="ward-form-group">
              <label className="ward-form-label">Transfer Date & Time *</label>
              <input
                type="text"
                className="ward-form-input"
                value={transferDetails.transferTime}
                onChange={(e) =>
                  setTransferDetails({ ...transferDetails, transferTime: e.target.value })
                }
              />
            </div>

            <div className="ward-form-group">
              <label className="ward-form-label">Transfer Reason *</label>
              <select
                className="ward-form-select"
                value={transferDetails.reason}
                onChange={(e) =>
                  setTransferDetails({ ...transferDetails, reason: e.target.value })
                }
              >
                <option value="Bed Change (Clinical)">Bed Change (Clinical)</option>
                <option value="ICU Required">ICU Required</option>
                <option value="Room Upgrade Request">Room Upgrade Request</option>
                <option value="Patient Preference">Patient Preference</option>
              </select>
            </div>

            <div className="ward-form-group">
              <label className="ward-form-label">Transfer Notes (Optional)</label>
              <textarea
                className="ward-form-input"
                rows="3"
                placeholder="Enter reason for transfer..."
                value={transferDetails.notes}
                onChange={(e) =>
                  setTransferDetails({ ...transferDetails, notes: e.target.value })
                }
              ></textarea>
            </div>
          </div>

          {/* Step 5: Confirm Transfer */}
          <div className="transfer-card">
            <div className="transfer-card__header">
              <div>
                <span className="transfer-step-num">5</span>
                <span>Confirm Transfer</span>
              </div>
            </div>

            <div className="confirm-alert-box">
              <Icon name="LuAlertTriangle" size={20} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <div>
                You are about to transfer this patient from <strong>GW-101 - B3</strong> to{" "}
                <strong>{selectedTargetBed.bedNo}</strong>. Please confirm to proceed.
              </div>
            </div>

            <div className="allotment-action-btns" style={{ marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn-transfer-cancel"
                onClick={() => toast.info("Transfer cancelled")}
              >
                ✕ Cancel
              </button>

              <button
                type="button"
                className="btn-transfer-confirm"
                onClick={handleConfirmTransfer}
              >
                <Icon name="LuArrowLeftRight" size={18} /> Transfer Bed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
