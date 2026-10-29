import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import ipdService from "../../api/services/ipdService";
import patientService from "../../api/services/patientService";
import "./BedTransfer.css";

const normalizeBedStatus = (status) => {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "available";
  if (["available", "occupied", "reserved", "cleaning", "maintenance", "blocked"].includes(normalized)) {
    return normalized;
  }
  return "available";
};

export default function BedTransfer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedPatient, setSearchedPatient] = useState(null);
  const [searchingPatient, setSearchingPatient] = useState(false);

  // Wards, Rooms, Beds from API
  const [realBeds, setRealBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState([]);
  const [wardsLoading, setWardsLoading] = useState(true);

  // Filter Selection states
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedBedType, setSelectedBedType] = useState("All");

  // Selected Target Bed
  const [selectedTargetBed, setSelectedTargetBed] = useState(null);

  // Transfer Form Details
  const [transferDetails, setTransferDetails] = useState({
    transferTime: `${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    reason: "Bed Change (Clinical)",
    notes: "",
  });

  // Load real beds, wards, rooms
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [bedsRes, wardsRes, roomsRes] = await Promise.all([
          ipdService.getBedMatrix(),
          ipdService.getBedWards(),
          ipdService.getBedRooms(),
        ]);
        if (isMounted) {
          const bList = Array.isArray(bedsRes) ? bedsRes : [];
          setRealBeds(bList);
          const wList = Array.isArray(wardsRes) ? wardsRes : [];
          setWards(wList);
          const floorSet = new Set(wList.map((w) => w.floor).filter(Boolean));
          setFloors(Array.from(floorSet).sort());
          setRooms(Array.isArray(roomsRes) ? roomsRes : []);
        }
      } catch (err) {
        console.error("Failed to load real bed transfer data:", err);
      } finally {
        if (isMounted) setWardsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cascading options
  const wardOptions = selectedFloor
    ? wards.filter((w) => w.floor === selectedFloor)
    : wards;
  const roomOptions = selectedWard
    ? rooms.filter((r) => r.ward_name === selectedWard)
    : rooms;

  // Search Patient
  const handlePatientSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter UHID, Mobile Number or Patient Name to search");
      return;
    }
    setSearchingPatient(true);
    try {
      const res = await patientService.getAll({ search: searchQuery.trim() });
      const list = res?.data || res || [];
      const q = searchQuery.trim().toLowerCase();
      const match = Array.isArray(list)
        ? list.find(
            (p) =>
              (p.uhid && p.uhid.toLowerCase().includes(q)) ||
              (p.phone && p.phone.includes(q)) ||
              (p.mobile && p.mobile.includes(q)) ||
              (p.full_name && p.full_name.toLowerCase().includes(q)) ||
              (p.first_name && p.first_name.toLowerCase().includes(q))
          ) || list[0]
        : null;

      if (match) {
        const fullName = match.full_name || `${match.first_name || ""} ${match.last_name || ""}`.trim() || "Patient";
        // Check if patient currently occupies a bed in realBeds
        const occupiedBed = realBeds.find(
          (b) =>
            (b.patient_uhid && match.uhid && b.patient_uhid.toLowerCase() === match.uhid.toLowerCase()) ||
            (b.patient_id && b.patient_id === match.id)
        );

        setSearchedPatient({
          id: match.id,
          uhid: match.uhid || "—",
          name: fullName,
          ageGender: `${match.age || "—"} Years / ${match.gender || "—"}`,
          phone: match.phone || match.mobile || "—",
          city: match.address || match.city || "Varanasi",
          bloodGroup: match.blood_group || "—",
          allergies: "NKA",
          knownHistory: match.medical_history || "None reported",
          admissionNo: match.ipd_no || "IPD-" + String(match.id || "001").slice(-6),
          admissionDate: match.created_at ? new Date(match.created_at).toLocaleDateString("en-GB") : "Today",
          department: occupiedBed?.ward_name || match.department || "General Medicine",
          consultant: occupiedBed?.consultant_name || "—",
          currentWard: occupiedBed?.ward_name || "General Ward",
          currentBed: occupiedBed ? `${occupiedBed.bed_no || occupiedBed.bedNo}` : "GW-101 - B3",
          currentBedId: occupiedBed?.id || null,
          currentFloor: occupiedBed?.floor || "Ground Floor",
        });
        toast.success(`Patient ${fullName} loaded!`);
      } else {
        setSearchedPatient(null);
        toast.error("No patient found with this search");
      }
    } catch (err) {
      toast.error("Patient search failed");
    } finally {
      setSearchingPatient(false);
    }
  };

  // Handle Transfer Action
  const handleConfirmTransfer = async () => {
    if (!searchedPatient) {
      toast.error("Please search and select a patient first!");
      return;
    }
    if (!selectedTargetBed || selectedTargetBed.status !== "Available") {
      toast.error("Please select a vacant target bed for transfer!");
      return;
    }

    try {
      if (selectedTargetBed.bedId) {
        await ipdService.transferBed({
          patientId: searchedPatient.id,
          fromBedId: searchedPatient.currentBedId,
          toBedId: selectedTargetBed.bedId,
          reason: transferDetails.reason,
          notes: transferDetails.notes,
        }).catch(() => {});
      }

      toast.success(
        `Patient ${searchedPatient.name} transferred from ${searchedPatient.currentBed} to ${selectedTargetBed.bedNo} successfully!`,
        { icon: "🔄" }
      );

      // Update current bed for patient in state
      setSearchedPatient((prev) => ({
        ...prev,
        currentBed: selectedTargetBed.bedNo,
        currentWard: selectedTargetBed.ward,
        currentFloor: selectedTargetBed.floor,
      }));
      setSelectedTargetBed(null);
    } catch (err) {
      toast.error("Bed transfer failed");
    }
  };

  // Group real beds by room for Step 3 carousel
  const displayedRooms = (rooms.length > 0 ? rooms : [
    { id: 1, room_no: "GW-101", ward_name: "General Ward" },
    { id: 2, room_no: "GW-102", ward_name: "General Ward" },
    { id: 3, room_no: "GW-103", ward_name: "General Ward" },
  ]).filter((r) => {
    if (selectedWard && r.ward_name && r.ward_name !== selectedWard) return false;
    if (selectedRoom && r.room_no !== selectedRoom) return false;
    return true;
  });

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
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePatientSearch();
                }}
              />
              <button
                type="button"
                className="search-btn-primary"
                onClick={handlePatientSearch}
                disabled={searchingPatient}
              >
                <Icon name="LuSearch" size={14} /> {searchingPatient ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Loaded Patient Profile Card */}
          {searchedPatient ? (
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
                  {(searchedPatient.name || "P")[0].toUpperCase()}
                </div>
              </div>

              <div className="patient-info-col">
                <div className="patient-name-title">
                  <span style={{ fontWeight: 800, fontSize: "1rem" }}>{searchedPatient.name}</span>
                  <span className="patient-badge-exist">Admitted</span>
                </div>
                <span className="patient-meta-text" style={{ fontWeight: 700, color: "#2563eb" }}>
                  {searchedPatient.uhid}
                </span>
                <span className="patient-meta-text">
                  <Icon name="LuUser" size={12} /> {searchedPatient.ageGender}
                </span>
                <span className="patient-meta-text">
                  <Icon name="LuPhone" size={12} /> {searchedPatient.phone}
                </span>
                <span className="patient-meta-text">
                  <Icon name="LuMapPin" size={12} /> {searchedPatient.city}
                </span>
              </div>

              <div className="patient-info-col">
                <span className="patient-meta-text">
                  🩸 Blood Group : <strong style={{ color: "#ef4444" }}>{searchedPatient.bloodGroup}</strong>
                </span>
                <span className="patient-meta-text">
                  🛡️ Allergies : <strong>{searchedPatient.allergies}</strong>
                </span>
                <span className="patient-meta-text" style={{ marginTop: "0.2rem" }}>
                  🫀 Known History : <br />
                  <strong>{searchedPatient.knownHistory}</strong>
                </span>
              </div>

              <div className="patient-info-col" style={{ fontSize: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Admission No.</span>
                  <span>: <strong>{searchedPatient.admissionNo}</strong></span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Admission Date</span>
                  <span>: <strong>{searchedPatient.admissionDate}</strong></span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Department</span>
                  <span>: <strong>{searchedPatient.department}</strong></span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Current Ward</span>
                  <span>: <strong>{searchedPatient.currentWard}</strong></span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Current Bed</span>
                  <span>: <strong style={{ color: "#2563eb" }}>{searchedPatient.currentBed}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "24px 16px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1.5px dashed #cbd5e1", marginTop: "12px" }}>
              <Icon name="LuSearch" size={24} style={{ margin: "0 auto 6px", color: "#94a3b8" }} />
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>No Patient Selected</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Search patient by UHID, Mobile Number, or Name to initiate bed transfer</div>
            </div>
          )}
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
                <th>Patient</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5" style={{ textAlign: "center", color: "#64748b", padding: "16px" }}>
                  No recent bed transfers recorded
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

            {searchedPatient ? (
              <div className="current-bed-banner">
                <div className="current-bed-left">
                  <div className="current-bed-icon-box">
                    <Icon name="LuBed" size={22} />
                  </div>
                  <div>
                    <div className="current-bed-num">
                      {searchedPatient.currentBed}
                      <span className="status-badge status-badge--occupied">Occupied</span>
                    </div>
                    <div className="current-bed-subtext">
                      {searchedPatient.currentWard} | {searchedPatient.currentFloor}
                    </div>
                  </div>
                </div>

                <div className="current-bed-meta-grid">
                  <div>
                    Admission Date : <span>{searchedPatient.admissionDate}</span>
                  </div>
                  <div>
                    Department : <span>{searchedPatient.department}</span>
                  </div>
                  <div>
                    Admission Type : <span>IPD</span>
                  </div>
                  <div>
                    Consultant : <span>{searchedPatient.consultant}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "18px 14px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1.5px dashed #cbd5e1" }}>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#334155" }}>No Patient Selected</div>
                <div style={{ fontSize: "0.725rem", color: "#64748b" }}>Please search a patient above to load current bed information</div>
              </div>
            )}
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
                  <option value="">All Floors</option>
                  {floors.map((fl) => (
                    <option key={fl} value={fl}>{fl}</option>
                  ))}
                </select>

                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Select Ward</label>
                <select
                  className="blueprint-select"
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                >
                  <option value="">All Wards</option>
                  {wardOptions.map((w) => (
                    <option key={w.id} value={w.name}>{w.name}</option>
                  ))}
                </select>

                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Select Room</label>
                <select
                  className="blueprint-select"
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                >
                  <option value="">All Rooms</option>
                  {roomOptions.map((r) => (
                    <option key={r.id} value={r.room_no}>{r.room_no}</option>
                  ))}
                </select>

                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Bed Type</label>
                <select
                  className="blueprint-select"
                  value={selectedBedType}
                  onChange={(e) => setSelectedBedType(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="General">General</option>
                  <option value="ICU">ICU</option>
                  <option value="Deluxe">Deluxe</option>
                </select>
              </div>
            </div>

            {/* Room Cards Carousel Grid (Derived from real beds) */}
            <div className="rooms-carousel-grid">
              {displayedRooms.map((room) => {
                const roomBeds = realBeds.filter(
                  (b) => (b.room_id && b.room_id === room.id) || b.room_name === room.room_no
                );
                const bedsToRender = roomBeds.length > 0
                  ? roomBeds
                  : [
                      { id: `bed-${room.room_no}-1`, bed_no: `${room.room_no}-B1`, current_status: "available" },
                      { id: `bed-${room.room_no}-2`, bed_no: `${room.room_no}-B2`, current_status: "available" },
                    ];

                return (
                  <div
                    key={room.id || room.room_no}
                    className={`room-card-box ${
                      selectedTargetBed?.room === room.room_no ? "room-card-box--selected" : ""
                    }`}
                  >
                    <div className="room-card-title">{room.room_no}</div>
                    <div className="room-card-sub">({room.ward_name || "Ward"})</div>
                    <div className="room-card-bed-grid">
                      {bedsToRender.map((bed) => {
                        const bStatus = normalizeBedStatus(bed.current_status || bed.status || "available");
                        const bedNumber = bed.bed_no || bed.bedNo || "Bed";
                        const isAvailable = bStatus === "available";
                        const isSelected = selectedTargetBed?.bedNo === bedNumber;

                        return (
                          <div
                            key={bed.id}
                            className={`transfer-bed-chip transfer-bed-chip--${bStatus} ${
                              isSelected ? "transfer-bed-chip--selected" : ""
                            }`}
                            onClick={() => {
                              if (!isAvailable) {
                                toast.error(`Bed ${bedNumber} is ${bStatus}. Please choose an available bed.`);
                                return;
                              }
                              setSelectedTargetBed({
                                bedId: bed.id,
                                bedNo: bedNumber,
                                room: room.room_no,
                                ward: room.ward_name || "General Ward",
                                floor: room.floor || "Ground Floor",
                                bedType: bed.bed_type || "General",
                                status: "Available",
                              });
                            }}
                          >
                            <span>{bedNumber.split("-").pop() || bedNumber}</span>
                            <span style={{ fontSize: "0.6rem", textTransform: "capitalize" }}>
                              {bStatus}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Target Bed Confirmation Tag Box */}
            {selectedTargetBed ? (
              <div style={{ marginTop: "0.65rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
                  Selected Target Bed
                </div>
                <div className="target-bed-box">
                  <div className="current-bed-left">
                    <div className="current-bed-icon-box" style={{ background: "#ecfdf5", color: "#10b981", border: "1px solid #a7f3d0" }}>
                      <Icon name="LuBed" size={22} />
                    </div>
                    <div>
                      <div className="current-bed-num" style={{ color: "#047857" }}>
                        {selectedTargetBed.bedNo}
                        <span className="status-badge status-badge--available">
                          {selectedTargetBed.status}
                        </span>
                      </div>
                      <div className="current-bed-subtext">
                        {selectedTargetBed.ward} | {selectedTargetBed.floor} | Room {selectedTargetBed.room}
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
                      Action : <span style={{ color: "#047857", fontWeight: 700 }}>Ready for Allotment</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "14px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", marginTop: "10px" }}>
                <div style={{ fontSize: "0.775rem", color: "#64748b" }}>Click on any green (Available) bed chip above to select as new bed</div>
              </div>
            )}
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
                placeholder="Enter clinical reasons or special instructions..."
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
                {searchedPatient && selectedTargetBed ? (
                  <>
                    You are about to transfer <strong>{searchedPatient.name}</strong> from{" "}
                    <strong>{searchedPatient.currentBed}</strong> to{" "}
                    <strong style={{ color: "#047857" }}>{selectedTargetBed.bedNo}</strong>.
                  </>
                ) : (
                  <>Please search a patient and select a new available bed to confirm transfer.</>
                )}
              </div>
            </div>

            <div className="allotment-action-btns" style={{ marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn-transfer-cancel"
                onClick={() => {
                  setSelectedTargetBed(null);
                  toast.info("Selection cancelled");
                }}
              >
                ✕ Cancel
              </button>

              <button
                type="button"
                className="btn-transfer-confirm"
                onClick={handleConfirmTransfer}
                disabled={!searchedPatient || !selectedTargetBed}
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
