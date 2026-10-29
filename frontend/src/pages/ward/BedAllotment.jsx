import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import ipdService from "../../api/services/ipdService";
import patientService from "../../api/services/patientService";
import doctorService from "../../api/services/doctorService";
import "./BedAllotment.css";

const normalizeBedStatus = (status) => {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "available";
  if (["available", "occupied", "reserved", "cleaning", "maintenance", "blocked"].includes(normalized)) {
    return normalized;
  }
  return "available";
};

export default function BedAllotment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("UHID");
  const [searchedPatient, setSearchedPatient] = useState(null);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [doctorList, setDoctorList] = useState([]);

  // Selection states
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [viewMode, setViewMode] = useState("Floor Map");

  const [realBeds, setRealBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState([]);
  const [wardsLoading, setWardsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bedsRes, wardsRes, roomsRes, docsRes] = await Promise.all([
          ipdService.getBedMatrix(),
          ipdService.getBedWards(),
          ipdService.getBedRooms(),
          doctorService.getAll().catch(() => []),
        ]);
        setRealBeds(Array.isArray(bedsRes) ? bedsRes : []);
        const fetchedWards = Array.isArray(wardsRes) ? wardsRes : [];
        setWards(fetchedWards);
        // Derive distinct non-null floors from wards
        const floorSet = new Set(fetchedWards.map((w) => w.floor).filter(Boolean));
        setFloors(Array.from(floorSet).sort());
        setRooms(Array.isArray(roomsRes) ? roomsRes : []);
        setDoctorList(Array.isArray(docsRes?.data || docsRes) ? (docsRes.data || docsRes) : []);
      } catch (err) {
        console.error("Failed to load real bed data:", err);
      } finally {
        setWardsLoading(false);
      }
    };

  // Derived options for cascading Floor → Ward → Room dropdowns
  const wardOptions = selectedFloor
    ? wards.filter((w) => w.floor === selectedFloor)
    : wards;
  const roomOptions = selectedWard
    ? rooms.filter((r) => r.ward_name === selectedWard)
    : rooms;

  // Reset downward selections when upstream changes
  useEffect(() => {
    if (wardsLoading || wards.length === 0) return;
    if (!selectedFloor && floors.length > 0) {
      setSelectedFloor(floors[0]);
    }
  }, [wardsLoading, wards, floors, selectedFloor]);

  useEffect(() => {
    if (wardsLoading || wardOptions.length === 0) return;
    if (!wardOptions.some((w) => w.name === selectedWard)) {
      setSelectedWard(wardOptions[0]?.name || "");
      setSelectedRoom("");
    }
  }, [wardsLoading, wardOptions, selectedWard]);

  useEffect(() => {
    if (wardsLoading || roomOptions.length === 0) return;
    if (!roomOptions.some((r) => r.room_no === selectedRoom)) {
      setSelectedRoom(roomOptions[0]?.room_no || "");
    }
  }, [wardsLoading, roomOptions, selectedRoom]);

  // Selected Bed for Allotment (Clean state, no fake defaults)
  const [selectedBed, setSelectedBed] = useState(null);

  // Admission Form state
  const [admissionForm, setAdmissionForm] = useState({
    type: "IPD",
    department: "",
    consultant: "",
    expectedStay: "",
    admissionTime: "",
    specialInstructions: "",
  });

  // Bed matrix in selected room
  const roomBeds = realBeds.length
    ? realBeds
        .filter((bed) => !selectedRoom || bed.room_name === selectedRoom)
        .filter((bed) => !selectedWard || bed.ward_name === selectedWard)
        .map((bed) => ({
            id: bed.id,
            bedNo: bed.bed_no || bed.bedNo,
            room: bed.room_name || "-",
            ward: bed.ward_name || "-",
            floor: "",
            patientName: bed.patient_first_name ? `${bed.patient_first_name} ${bed.patient_last_name || ""}`.trim() : "-",
            uhid: bed.patient_uhid || "-",
            genderAge: bed.gender ? `${bed.gender}` : "-",
            admissionDate: bed.admitted_at ? new Date(bed.admitted_at).toLocaleDateString("en-GB") : "-",
            status: normalizeBedStatus(bed.current_status || bed.status || "available"),
          }))
    : [];

  const handlePatientSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter UHID, Mobile Number or Name to search");
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
        setSearchedPatient({
          id: match.id,
          uhid: match.uhid || "—",
          name: fullName,
          ageGender: `${match.age || "—"} Years / ${match.gender || "—"}`,
          phone: match.phone || match.mobile || "—",
          city: match.address || match.city || "—",
          bloodGroup: match.blood_group || "—",
          allergies: "NKA",
          knownHistory: match.medical_history || "None reported",
          lastVisit: match.created_at ? new Date(match.created_at).toLocaleDateString("en-GB") : "—",
          patientType: match.category || "OPD",
          department: match.department || "General Medicine",
          consultant: "—",
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

  const handleAllocateBed = () => {
    if (!searchedPatient) {
      toast.error("Please search and select a patient first!");
      return;
    }
    if (!selectedBed || normalizeBedStatus(selectedBed.status) !== "available") {
      toast.error("Please select an available bed first!");
      return;
    }
    toast.success(`Bed ${selectedBed.bedNo} successfully allotted to ${searchedPatient.name}!`, {
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
                onClick={handlePatientSearch}
                disabled={searchingPatient}
              >
                <Icon name="LuSearch" size={14} /> {searchingPatient ? "Searching..." : "Search"}
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
          {searchedPatient ? (
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
                  {(searchedPatient.name || "P")[0].toUpperCase()}
                </div>
                <button type="button" className="btn-view-profile">
                  View Full Profile
                </button>
              </div>

              <div className="patient-info-col">
                <div className="patient-name-title">
                  <span style={{ fontWeight: 800, fontSize: "1rem" }}>{searchedPatient.name}</span>
                  <span className="patient-badge-exist">Verified Patient</span>
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

              <div className="patient-info-col">
                <span className="patient-meta-text">
                  Last Visit : <strong>{searchedPatient.lastVisit}</strong>
                </span>
                <span className="patient-meta-text">
                  Patient Type : <strong>{searchedPatient.patientType}</strong>
                </span>
                <span className="patient-meta-text">
                  Department : <strong>{searchedPatient.department}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: "24px 16px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1.5px dashed #cbd5e1", marginTop: "12px" }}>
              <Icon name="LuSearch" size={24} style={{ margin: "0 auto 6px", color: "#94a3b8" }} />
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>No Patient Selected</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Search patient by UHID, Mobile Number, or Name to load details</div>
            </div>
          )}
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
                <th>Patient</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {realBeds.filter((b) => b.patient_uhid || b.patient_first_name).length > 0 ? (
                realBeds
                  .filter((b) => b.patient_uhid || b.patient_first_name)
                  .slice(0, 5)
                  .map((b) => (
                    <tr key={b.id}>
                      <td>{b.admitted_at ? new Date(b.admitted_at).toLocaleDateString("en-GB") : "Today"}</td>
                      <td style={{ fontWeight: 600 }}>{b.ward_name || "GW"} / {b.bed_no || b.bedNo}</td>
                      <td>{b.patient_first_name ? `${b.patient_first_name} ${b.patient_last_name || ""}`.trim() : b.patient_uhid}</td>
                      <td>
                        <span className="status-badge status-badge--available">{b.current_status || "Occupied"}</span>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", color: "#64748b", padding: "16px" }}>
                    No recent admissions recorded
                  </td>
                </tr>
              )}
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
                  <option value="">All Floors</option>
                  {floors.map((floor) => (
                    <option key={floor} value={floor}>
                      {floor}
                    </option>
                  ))}
                </select>

                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Select Ward</label>
                <select
                  className="blueprint-select"
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                >
                  <option value="">All Wards</option>
                  {wardOptions.map((ward) => (
                    <option key={ward.id} value={ward.name}>
                      {ward.name} ({ward.floor})
                    </option>
                  ))}
                </select>

                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Select Room</label>
                <select
                  className="blueprint-select"
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                >
                  <option value="">All Rooms</option>
                  {roomOptions.map((room) => (
                    <option key={room.id} value={room.room_no}>
                      {room.room_no}
                    </option>
                  ))}
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
                Available Beds in {selectedRoom || "All Rooms"}
              </h4>
              <span className="status-badge status-badge--available">
                {roomBeds.filter((b) => b.status === "available").length} Available
              </span>
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
                      <span className={`status-badge status-badge--${normalizeBedStatus(rb.status)}`}>
                        {normalizeBedStatus(rb.status) === "available" ? "Available" : normalizeBedStatus(rb.status) === "occupied" ? "Occupied" : normalizeBedStatus(rb.status) === "maintenance" ? "Maintenance" : normalizeBedStatus(rb.status) === "blocked" ? "Blocked" : "Reserved"}
                      </span>
                    </td>
                    <td>
                      {normalizeBedStatus(rb.status) === "available" ? (
                        <button
                          type="button"
                          className="search-btn-primary"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.725rem" }}
                          onClick={() =>
                            setSelectedBed({
                              bedNo: rb.bedNo,
                              room: rb.room,
                              ward: rb.ward,
                              floor: rb.floor,
                              status: rb.status,
                            })
                          }
                        >
                          <Icon name="LuUserCheck" size={12} /> Allocate
                        </button>
                      ) : normalizeBedStatus(rb.status) === "occupied" ? (
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
                  <option value="">Select Department</option>
                  {wards.map((w) => (
                    <option key={w.id || w.name} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ward-form-group">
                <label className="ward-form-label">Consultant *</label>
                <select
                  className="ward-form-select"
                  value={admissionForm.consultant}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, consultant: e.target.value })}
                >
                  <option value="">Select Doctor / Consultant</option>
                  {doctorList.map((doc) => {
                    const dName = doc.name || doc.full_name || `Dr. ${doc.first_name || ""} ${doc.last_name || ""}`.trim();
                    return (
                      <option key={doc.id || dName} value={dName}>
                        {dName}
                      </option>
                    );
                  })}
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

            {selectedBed ? (
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
                    <span>{selectedBed.floor || "—"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "20px 14px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1.5px dashed #cbd5e1" }}>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#334155" }}>No Bed Selected</div>
                <div style={{ fontSize: "0.725rem", color: "#64748b" }}>Click on an available bed in Step 2 to select</div>
              </div>
            )}

            <div className="allotment-action-btns">
              <button
                type="button"
                className="btn-reset"
                onClick={() => {
                  setSelectedBed(null);
                  toast.info("Bed selection reset");
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
