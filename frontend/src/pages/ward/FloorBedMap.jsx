import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import "./FloorBedMap.css";

// Sample initial data for Ground Floor as displayed in the mockup image
const INITIAL_GROUND_FLOOR_BEDS = [
  { id: 1, bedNo: "GW-101-01", room: "GW-101", roomType: "General Ward", patientName: "Rohit Kumar", uhid: "UHID12345", ageGender: "28 Y / Male", admissionDate: "29-09-2026", department: "General Medicine", status: "Occupied" },
  { id: 2, bedNo: "GW-101-02", room: "GW-101", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  { id: 3, bedNo: "GW-101-03", room: "GW-101", roomType: "General Ward", patientName: "Suman Yadav", uhid: "UHID12348", ageGender: "36 Y / Female", admissionDate: "27-09-2026", department: "Cardiology", status: "Occupied" },
  { id: 4, bedNo: "GW-101-04", room: "GW-101", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  
  { id: 5, bedNo: "GW-102-01", room: "GW-102", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  { id: 6, bedNo: "GW-102-02", room: "GW-102", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  { id: 7, bedNo: "GW-102-03", room: "GW-102", roomType: "General Ward", patientName: "Neha Verma", uhid: "UHID12350", ageGender: "31 Y / Female", admissionDate: "26-09-2026", department: "Gynecology", status: "Reserved" },
  { id: 8, bedNo: "GW-102-04", room: "GW-102", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },

  { id: 9, bedNo: "GW-103-01", room: "GW-103", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  { id: 10, bedNo: "GW-103-02", room: "GW-103", roomType: "General Ward", patientName: "Amitabh Shah", uhid: "UHID12355", ageGender: "45 Y / Male", admissionDate: "28-09-2026", department: "Orthopedics", status: "Occupied" },
  { id: 11, bedNo: "GW-103-03", room: "GW-103", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  { id: 12, bedNo: "GW-103-04", room: "GW-103", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },

  { id: 13, bedNo: "ISO-101", room: "Isolation", roomType: "Isolation", patientName: "Ramesh Gupta", uhid: "UHID12360", ageGender: "52 Y / Male", admissionDate: "25-09-2026", department: "Pulmonology", status: "Reserved" },
  { id: 14, bedNo: "ISO-102", room: "Isolation", roomType: "Isolation", patientName: "Pooja Sharma", uhid: "UHID12361", ageGender: "29 Y / Female", admissionDate: "29-09-2026", department: "Infectious Disease", status: "Reserved" },

  { id: 15, bedNo: "GW-104-01", room: "GW-104", roomType: "General Ward", patientName: "Sanjay Patel", uhid: "UHID12365", ageGender: "40 Y / Male", admissionDate: "28-09-2026", department: "Urology", status: "Reserved" },
  { id: 16, bedNo: "GW-104-02", room: "GW-104", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  { id: 17, bedNo: "GW-104-03", room: "GW-104", roomType: "General Ward", patientName: "Vikas Singh", uhid: "UHID12367", ageGender: "34 Y / Male", admissionDate: "27-09-2026", department: "Neurology", status: "Reserved" },
  { id: 18, bedNo: "GW-104-04", room: "GW-104", roomType: "General Ward", patientName: "Kavita Rao", uhid: "UHID12368", ageGender: "38 Y / Female", admissionDate: "29-09-2026", department: "ENT", status: "Reserved" },

  { id: 19, bedNo: "GW-105-01", room: "GW-105", roomType: "General Ward", patientName: "Deepak Joshi", uhid: "UHID12370", ageGender: "50 Y / Male", admissionDate: "24-09-2026", department: "General Surgery", status: "Occupied" },
  { id: 20, bedNo: "GW-105-02", room: "GW-105", roomType: "General Ward", patientName: "Sunita Devi", uhid: "UHID12371", ageGender: "62 Y / Female", admissionDate: "25-09-2026", department: "Nephrology", status: "Occupied" },
  { id: 21, bedNo: "GW-105-03", room: "GW-105", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  { id: 22, bedNo: "GW-105-04", room: "GW-105", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },

  { id: 23, bedNo: "GW-106-01", room: "GW-106", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  { id: 24, bedNo: "GW-106-02", room: "GW-106", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  { id: 25, bedNo: "GW-106-03", room: "GW-106", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" },
  { id: 26, bedNo: "GW-106-04", room: "GW-106", roomType: "General Ward", patientName: "Manoj Tiwari", uhid: "UHID12380", ageGender: "44 Y / Male", admissionDate: "29-09-2026", department: "General Medicine", status: "Reserved" },

  { id: 27, bedNo: "GW-107-01", room: "GW-107", roomType: "General Ward", patientName: "Ritu Saxena", uhid: "UHID12385", ageGender: "27 Y / Female", admissionDate: "29-09-2026", department: "Gynecology", status: "Maintenance" },
  { id: 28, bedNo: "GW-107-02", room: "GW-107", roomType: "General Ward", patientName: "-", uhid: "-", ageGender: "-", admissionDate: "-", department: "-", status: "Available" }
];

export default function FloorBedMap() {
  const [activeFloor, setActiveFloor] = useState("Ground Floor");
  const [selectedWardFilter, setSelectedWardFilter] = useState("General Ward");
  const [bedsData, setBedsData] = useState(INITIAL_GROUND_FLOOR_BEDS);
  
  // Table search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [roomFilter, setRoomFilter] = useState("All Rooms");

  // Modals state
  const [selectedBedModal, setSelectedBedModal] = useState(null);
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Form states for Allotment
  const [allotForm, setAllotForm] = useState({
    patientName: "",
    uhid: "",
    ageGender: "30 Y / Male",
    department: "General Medicine",
    room: "GW-101",
    bedNo: "GW-101-02"
  });

  // Available floors navigation
  const floorsList = [
    { name: "Basement", count: 12 },
    { name: "Ground Floor", count: 28 },
    { name: "First Floor", count: 48 },
    { name: "Second Floor", count: 52 },
    { name: "Third Floor", count: 46 },
    { name: "Fourth Floor", count: 36 },
    { name: "Fifth Floor", count: 28 },
  ];

  // Overall hospital wide stats (Matching reference mockup image)
  const overallStats = {
    total: 250,
    occupied: 187,
    occupiedPct: "74.8%",
    available: 48,
    availablePct: "19.2%",
    reserved: 10,
    reservedPct: "4.0%",
    maintenance: 5,
    maintenancePct: "2.0%",
  };

  // Current floor summary calculation
  const floorCounts = useMemo(() => {
    const occ = bedsData.filter((b) => b.status === "Occupied").length;
    const avail = bedsData.filter((b) => b.status === "Available").length;
    const res = bedsData.filter((b) => b.status === "Reserved").length;
    const maint = bedsData.filter((b) => b.status === "Maintenance").length;
    return {
      total: bedsData.length,
      occupied: occ,
      available: avail,
      reserved: res,
      maintenance: maint,
    };
  }, [bedsData]);

  // Filtered beds for table
  const filteredBedsForTable = useMemo(() => {
    return bedsData.filter((b) => {
      const matchesSearch =
        b.bedNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.uhid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.room.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All Status" || b.status === statusFilter;

      const matchesRoom =
        roomFilter === "All Rooms" || b.room === roomFilter;

      return matchesSearch && matchesStatus && matchesRoom;
    });
  }, [bedsData, searchTerm, statusFilter, roomFilter]);

  // Handle bed allotment form submit
  const handleAllotSubmit = (e) => {
    e.preventDefault();
    if (!allotForm.patientName || !allotForm.uhid) {
      toast.error("Please fill in patient name and UHID");
      return;
    }

    const updated = bedsData.map((b) => {
      if (b.bedNo === allotForm.bedNo || b.id === selectedBedModal?.id) {
        return {
          ...b,
          patientName: allotForm.patientName,
          uhid: allotForm.uhid,
          ageGender: allotForm.ageGender,
          admissionDate: new Date().toLocaleDateString("en-GB"),
          department: allotForm.department,
          status: "Occupied",
        };
      }
      return b;
    });

    setBedsData(updated);
    toast.success(`Bed ${allotForm.bedNo || selectedBedModal?.bedNo} allotted successfully!`, {
      icon: "🛏️",
    });
    setShowAllotModal(false);
    setSelectedBedModal(null);
  };

  // Handle Vacate Bed
  const handleVacateBed = (bedId) => {
    const updated = bedsData.map((b) => {
      if (b.id === bedId) {
        return {
          ...b,
          patientName: "-",
          uhid: "-",
          ageGender: "-",
          admissionDate: "-",
          department: "-",
          status: "Available",
        };
      }
      return b;
    });
    setBedsData(updated);
    toast.success("Bed vacated and set to Available!", { icon: "🧹" });
    setSelectedBedModal(null);
  };

  // Quick action helpers
  const handleQuickAction = (actionType) => {
    if (actionType === "allocate") {
      setShowAllotModal(true);
    } else if (actionType === "transfer") {
      setShowTransferModal(true);
    } else if (actionType === "block") {
      setShowBlockModal(true);
    } else if (actionType === "reports") {
      toast.info("Opening Ward & Bed Analytics Report...");
    }
  };

  return (
    <div className="floor-map-page">
      {/* 1. Header Section */}
      <div className="floor-map-header">
        <div className="floor-map-header__title-group">
          <div className="floor-map-header__icon-box">
            <Icon name="LuBedDouble" size={28} />
          </div>
          <div>
            <h1 className="floor-map-header__title">Floor & Bed Floor Map</h1>
            <p className="floor-map-header__subtitle">
              View ward-wise bed status, manage bed allocation and availability
            </p>
          </div>
        </div>

        <div className="floor-map-header__right-actions">
          <div className="floor-map-header__live-status">
            <span className="floor-map-header__live-indicator">
              <span className="floor-map-header__live-dot"></span> Live Status
            </span>
            <span className="floor-map-header__last-updated">
              Last updated: 29 Sep 2026, 11:45 AM
            </span>
          </div>

          <button
            type="button"
            className="floor-map-btn-primary"
            onClick={() => setShowAllotModal(true)}
          >
            <Icon name="LuPlus" size={18} />
            <span>Bed Allotment</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards Grid (5 Cards) */}
      <div className="floor-map-stats-grid">
        {/* Total Beds */}
        <div className="floor-map-stat-card floor-map-stat-card--total">
          <div className="floor-map-stat-card__info">
            <span className="floor-map-stat-card__label">Total Beds</span>
            <span className="floor-map-stat-card__value">{overallStats.total}</span>
            <span className="floor-map-stat-card__subtext">All Floors</span>
          </div>
          <div className="floor-map-stat-card__icon-wrap">
            <Icon name="LuBed" size={22} />
          </div>
        </div>

        {/* Occupied */}
        <div className="floor-map-stat-card floor-map-stat-card--occupied">
          <div className="floor-map-stat-card__info">
            <span className="floor-map-stat-card__label">Occupied</span>
            <span className="floor-map-stat-card__value">{overallStats.occupied}</span>
            <span className="floor-map-stat-card__subtext floor-map-stat-card__subtext--pct">
              {overallStats.occupiedPct}
            </span>
          </div>
          <div className="floor-map-stat-card__icon-wrap">
            <Icon name="LuUsers" size={22} />
          </div>
        </div>

        {/* Available */}
        <div className="floor-map-stat-card floor-map-stat-card--available">
          <div className="floor-map-stat-card__info">
            <span className="floor-map-stat-card__label">Available</span>
            <span className="floor-map-stat-card__value">{overallStats.available}</span>
            <span className="floor-map-stat-card__subtext floor-map-stat-card__subtext--pct">
              {overallStats.availablePct}
            </span>
          </div>
          <div className="floor-map-stat-card__icon-wrap">
            <Icon name="LuBedSingle" size={22} />
          </div>
        </div>

        {/* Reserved */}
        <div className="floor-map-stat-card floor-map-stat-card--reserved">
          <div className="floor-map-stat-card__info">
            <span className="floor-map-stat-card__label">Reserved</span>
            <span className="floor-map-stat-card__value">{overallStats.reserved}</span>
            <span className="floor-map-stat-card__subtext floor-map-stat-card__subtext--pct">
              {overallStats.reservedPct}
            </span>
          </div>
          <div className="floor-map-stat-card__icon-wrap">
            <Icon name="LuClock" size={22} />
          </div>
        </div>

        {/* Maintenance */}
        <div className="floor-map-stat-card floor-map-stat-card--maintenance">
          <div className="floor-map-stat-card__info">
            <span className="floor-map-stat-card__label">Maintenance</span>
            <span className="floor-map-stat-card__value">{overallStats.maintenance}</span>
            <span className="floor-map-stat-card__subtext floor-map-stat-card__subtext--pct">
              {overallStats.maintenancePct}
            </span>
          </div>
          <div className="floor-map-stat-card__icon-wrap">
            <Icon name="LuWrench" size={22} />
          </div>
        </div>
      </div>

      {/* 3. Floor Navigation Tabs */}
      <div className="floor-map-tabs">
        {floorsList.map((fl) => (
          <button
            key={fl.name}
            type="button"
            className={`floor-map-tab-btn ${
              activeFloor === fl.name ? "floor-map-tab-btn--active" : ""
            }`}
            onClick={() => {
              setActiveFloor(fl.name);
              toast.success(`Switched view to ${fl.name}`);
            }}
          >
            <span>{fl.name}</span>
            <span className="floor-map-tab-btn__count">{fl.count} beds</span>
          </button>
        ))}
      </div>

      {/* 4. Main Dual Grid: Blueprint Canvas Left + Side Overview Panel Right */}
      <div className="floor-map-main-grid">
        {/* Left Column: Architectural Blueprint Canvas */}
        <div className="blueprint-card">
          <div className="blueprint-card__header">
            <div className="blueprint-card__title-group">
              <span className="blueprint-card__title-icon">
                <Icon name="LuBuilding" size={20} />
              </span>
              <div>
                <h3 className="blueprint-card__title">
                  {activeFloor} - {selectedWardFilter}
                </h3>
                <div className="blueprint-card__meta-summary">
                  <span>Total Beds: {floorCounts.total}</span> |{" "}
                  <span>Occupied: {floorCounts.occupied}</span> |{" "}
                  <span>Available: {floorCounts.available}</span> |{" "}
                  <span>Reserved: {floorCounts.reserved}</span>
                </div>
              </div>
            </div>

            <div className="blueprint-card__controls">
              <select
                className="blueprint-select"
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
              >
                <option value="General Ward">General Ward</option>
                <option value="ICU Ward">ICU Ward</option>
                <option value="Deluxe Ward">Deluxe Private</option>
                <option value="Isolation Ward">Isolation Ward</option>
              </select>

              <button
                type="button"
                className="blueprint-view-list-btn"
                onClick={() => {
                  const tableElem = document.getElementById("bed-details-table-section");
                  tableElem?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Icon name="LuListFilter" size={16} />
                <span>View List</span>
              </button>
            </div>
          </div>

          {/* Blueprint Layout Canvas */}
          <div className="blueprint-frame">
            <div className="blueprint-floor-plan">
              {/* Left Column: Nursing Station, Lift, Stairs */}
              <div className="blueprint-utility-column">
                <div className="blueprint-utility-box blueprint-utility-box--nursing">
                  <div className="blueprint-utility-icon">
                    <Icon name="LuUserCheck" size={20} />
                  </div>
                  <span className="blueprint-utility-title">Nursing Station</span>
                </div>

                <div className="blueprint-utility-box blueprint-utility-box--lift">
                  <div className="blueprint-utility-icon">
                    <Icon name="LuArrowUpUp" size={18} />
                  </div>
                  <span className="blueprint-utility-title">Lift</span>
                </div>

                <div className="blueprint-utility-box blueprint-utility-box--stairs">
                  <div className="blueprint-utility-icon">
                    <Icon name="LuFootprints" size={18} />
                  </div>
                  <span className="blueprint-utility-title">Stairs</span>
                </div>
              </div>

              {/* Center & Right Rooms Grid with Corridor */}
              <div className="blueprint-rooms-container">
                {/* Top Row Rooms: GW-101, GW-102, GW-103, Isolation */}
                <div className="blueprint-rooms-row">
                  {/* GW-101 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-101</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      {bedsData.slice(0, 4).map((b, idx) => (
                        <div
                          key={b.id}
                          className={`blueprint-bed-item blueprint-bed-item--${b.status.toLowerCase()}`}
                          title={`${b.bedNo} (${b.status}) - ${b.patientName}`}
                          onClick={() => setSelectedBedModal(b)}
                        >
                          <span className="blueprint-bed-icon">
                            <Icon name="LuBed" size={18} />
                          </span>
                          <span className="blueprint-bed-num">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GW-102 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-102</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      {bedsData.slice(4, 8).map((b, idx) => (
                        <div
                          key={b.id}
                          className={`blueprint-bed-item blueprint-bed-item--${b.status.toLowerCase()}`}
                          title={`${b.bedNo} (${b.status}) - ${b.patientName}`}
                          onClick={() => setSelectedBedModal(b)}
                        >
                          <span className="blueprint-bed-icon">
                            <Icon name="LuBed" size={18} />
                          </span>
                          <span className="blueprint-bed-num">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GW-103 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-103</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      {bedsData.slice(8, 12).map((b, idx) => (
                        <div
                          key={b.id}
                          className={`blueprint-bed-item blueprint-bed-item--${b.status.toLowerCase()}`}
                          title={`${b.bedNo} (${b.status}) - ${b.patientName}`}
                          onClick={() => setSelectedBedModal(b)}
                        >
                          <span className="blueprint-bed-icon">
                            <Icon name="LuBed" size={18} />
                          </span>
                          <span className="blueprint-bed-num">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Isolation */}
                  <div className="blueprint-room blueprint-room--isolation">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">Isolation</div>
                      <div className="blueprint-room__capacity">2 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      {bedsData.slice(12, 14).map((b, idx) => (
                        <div
                          key={b.id}
                          className={`blueprint-bed-item blueprint-bed-item--${b.status.toLowerCase()}`}
                          title={`${b.bedNo} (${b.status}) - ${b.patientName}`}
                          onClick={() => setSelectedBedModal(b)}
                        >
                          <span className="blueprint-bed-icon">
                            <Icon name="LuBed" size={18} />
                          </span>
                          <span className="blueprint-bed-num">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Central Walkway / Corridor */}
                <div className="blueprint-corridor">CORRIDOR</div>

                {/* Bottom Row Rooms: GW-104, GW-105, GW-106, Doctor Room */}
                <div className="blueprint-rooms-row">
                  {/* GW-104 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-104</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      {bedsData.slice(14, 18).map((b, idx) => (
                        <div
                          key={b.id}
                          className={`blueprint-bed-item blueprint-bed-item--${b.status.toLowerCase()}`}
                          title={`${b.bedNo} (${b.status}) - ${b.patientName}`}
                          onClick={() => setSelectedBedModal(b)}
                        >
                          <span className="blueprint-bed-icon">
                            <Icon name="LuBed" size={18} />
                          </span>
                          <span className="blueprint-bed-num">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GW-105 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-105</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      {bedsData.slice(18, 22).map((b, idx) => (
                        <div
                          key={b.id}
                          className={`blueprint-bed-item blueprint-bed-item--${b.status.toLowerCase()}`}
                          title={`${b.bedNo} (${b.status}) - ${b.patientName}`}
                          onClick={() => setSelectedBedModal(b)}
                        >
                          <span className="blueprint-bed-icon">
                            <Icon name="LuBed" size={18} />
                          </span>
                          <span className="blueprint-bed-num">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GW-106 */}
                  <div className="blueprint-room">
                    <div className="blueprint-room__header">
                      <div className="blueprint-room__name">GW-106</div>
                      <div className="blueprint-room__capacity">4 Beds</div>
                    </div>
                    <div className="blueprint-bed-grid">
                      {bedsData.slice(22, 26).map((b, idx) => (
                        <div
                          key={b.id}
                          className={`blueprint-bed-item blueprint-bed-item--${b.status.toLowerCase()}`}
                          title={`${b.bedNo} (${b.status}) - ${b.patientName}`}
                          onClick={() => setSelectedBedModal(b)}
                        >
                          <span className="blueprint-bed-icon">
                            <Icon name="LuBed" size={18} />
                          </span>
                          <span className="blueprint-bed-num">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doctor Room */}
                  <div className="blueprint-room blueprint-room--doctor">
                    <div className="blueprint-utility-icon" style={{ background: '#2563eb' }}>
                      <Icon name="LuStethoscope" size={20} />
                    </div>
                    <span className="blueprint-utility-title" style={{ color: '#1e3a8a' }}>Doctor Room</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Side Overview Panel */}
        <div className="floor-map-side-panel">
          {/* Bed Status Donut Chart Overview Card */}
          <div className="side-panel-card">
            <h3 className="side-panel-card__title">Bed Status Overview</h3>
            <div className="donut-chart-wrap">
              <svg className="donut-chart-svg" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="3.8"
                />
                {/* Occupied Segment (74.8%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.8"
                  strokeDasharray="74.8, 100"
                />
                {/* Available Segment (19.2%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3.8"
                  strokeDasharray="19.2, 100"
                  strokeDashoffset="-74.8"
                />
                {/* Reserved Segment (4.0%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3.8"
                  strokeDasharray="4.0, 100"
                  strokeDashoffset="-94"
                />
                {/* Maintenance Segment (2.0%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.8"
                  strokeDasharray="2.0, 100"
                  strokeDashoffset="-98"
                />
              </svg>
              <div className="donut-center-text">
                <div className="donut-center-val">250</div>
                <div className="donut-center-lbl">Total Beds</div>
              </div>
            </div>

            <div className="overview-legend-list">
              <div className="overview-legend-item">
                <div className="overview-legend-left">
                  <span className="overview-legend-dot" style={{ background: "#10b981" }}></span>
                  <span>Occupied</span>
                </div>
                <span className="overview-legend-val">187 (74.8%)</span>
              </div>

              <div className="overview-legend-item">
                <div className="overview-legend-left">
                  <span className="overview-legend-dot" style={{ background: "#0284c7" }}></span>
                  <span>Available</span>
                </div>
                <span className="overview-legend-val">48 (19.2%)</span>
              </div>

              <div className="overview-legend-item">
                <div className="overview-legend-left">
                  <span className="overview-legend-dot" style={{ background: "#f97316" }}></span>
                  <span>Reserved</span>
                </div>
                <span className="overview-legend-val">10 (4.0%)</span>
              </div>

              <div className="overview-legend-item">
                <div className="overview-legend-left">
                  <span className="overview-legend-dot" style={{ background: "#ef4444" }}></span>
                  <span>Maintenance</span>
                </div>
                <span className="overview-legend-val">5 (2.0%)</span>
              </div>
            </div>
          </div>

          {/* Legend Card */}
          <div className="side-panel-card">
            <h3 className="side-panel-card__title">Legend</h3>
            <div className="map-legend-grid">
              <div className="map-legend-row">
                <div className="map-legend-icon-badge" style={{ background: "#ecfdf5", color: "#10b981" }}>
                  <Icon name="LuBed" size={16} />
                </div>
                <span>Available Bed</span>
              </div>

              <div className="map-legend-row">
                <div className="map-legend-icon-badge" style={{ background: "#fef2f2", color: "#ef4444" }}>
                  <Icon name="LuBed" size={16} />
                </div>
                <span>Occupied Bed</span>
              </div>

              <div className="map-legend-row">
                <div className="map-legend-icon-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <Icon name="LuBed" size={16} />
                </div>
                <span>Reserved Bed</span>
              </div>

              <div className="map-legend-row">
                <div className="map-legend-icon-badge" style={{ background: "#fff7ed", color: "#f97316" }}>
                  <Icon name="LuWrench" size={16} />
                </div>
                <span>Maintenance</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="side-panel-card">
            <h3 className="side-panel-card__title">Quick Actions</h3>
            <div className="quick-actions-grid">
              <button
                type="button"
                className="quick-action-btn quick-action-btn--allocate"
                onClick={() => handleQuickAction("allocate")}
              >
                <div className="quick-action-btn__icon">
                  <Icon name="LuUserPlus" size={18} />
                </div>
                <span>Allocate Bed</span>
              </button>

              <button
                type="button"
                className="quick-action-btn quick-action-btn--transfer"
                onClick={() => handleQuickAction("transfer")}
              >
                <div className="quick-action-btn__icon">
                  <Icon name="LuArrowLeftRight" size={18} />
                </div>
                <span>Transfer Bed</span>
              </button>

              <button
                type="button"
                className="quick-action-btn quick-action-btn--block"
                onClick={() => handleQuickAction("block")}
              >
                <div className="quick-action-btn__icon">
                  <Icon name="LuLock" size={18} />
                </div>
                <span>Block Bed</span>
              </button>

              <button
                type="button"
                className="quick-action-btn quick-action-btn--reports"
                onClick={() => handleQuickAction("reports")}
              >
                <div className="quick-action-btn__icon">
                  <Icon name="LuFileBarChart" size={18} />
                </div>
                <span>View Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Table Section */}
      <div id="bed-details-table-section" className="floor-map-table-card">
        <div className="table-card__header">
          <h2 className="table-card__title">
            <Icon name="LuFileText" size={20} style={{ color: '#2563eb' }} />
            Bed Details - {activeFloor}
          </h2>

          <div className="table-card__filters">
            <div className="table-search-box">
              <Icon name="LuSearch" size={16} style={{ color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search by Bed No, Patient Name, UHID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="table-select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="Occupied">Occupied</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            <select
              className="table-select-filter"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            >
              <option value="All Rooms">All Rooms</option>
              <option value="GW-101">GW-101</option>
              <option value="GW-102">GW-102</option>
              <option value="GW-103">GW-103</option>
              <option value="Isolation">Isolation</option>
              <option value="GW-104">GW-104</option>
              <option value="GW-105">GW-105</option>
              <option value="GW-106">GW-106</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="floor-map-table-wrapper">
          <table className="floor-map-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bed No.</th>
                <th>Room / Ward</th>
                <th>Patient Name</th>
                <th>UHID</th>
                <th>Age / Gender</th>
                <th>Admission Date</th>
                <th>Department</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBedsForTable.length > 0 ? (
                filteredBedsForTable.map((bed, index) => (
                  <tr key={bed.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{bed.bedNo}</td>
                    <td>{bed.room}</td>
                    <td style={{ fontWeight: bed.patientName !== '-' ? 600 : 400 }}>
                      {bed.patientName}
                    </td>
                    <td>{bed.uhid}</td>
                    <td>{bed.ageGender}</td>
                    <td>{bed.admissionDate}</td>
                    <td>{bed.department}</td>
                    <td>
                      <span className={`status-badge status-badge--${bed.status.toLowerCase()}`}>
                        {bed.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-action-btns">
                        <button
                          type="button"
                          className="table-action-icon-btn"
                          title="View Details"
                          onClick={() => setSelectedBedModal(bed)}
                        >
                          <Icon name="LuEye" size={14} />
                        </button>
                        <button
                          type="button"
                          className="table-action-icon-btn"
                          title="More Options"
                          onClick={() => {
                            if (bed.status === "Available") {
                              setAllotForm({ ...allotForm, bedNo: bed.bedNo, room: bed.room });
                              setShowAllotModal(true);
                            } else {
                              setSelectedBedModal(bed);
                            }
                          }}
                        >
                          <Icon name="LuMoreVertical" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    No bed records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Bed Action / Info Modal */}
      {selectedBedModal && (
        <div className="floor-map-modal-overlay" onClick={() => setSelectedBedModal(null)}>
          <div className="floor-map-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="floor-map-modal-header">
              <h3 className="floor-map-modal-title">
                Bed Details: {selectedBedModal.bedNo}
              </h3>
              <button
                type="button"
                className="floor-map-modal-close"
                onClick={() => setSelectedBedModal(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Room / Ward:</span>
                <strong style={{ fontSize: '0.85rem' }}>{selectedBedModal.room}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Current Status:</span>
                <span className={`status-badge status-badge--${selectedBedModal.status.toLowerCase()}`}>
                  {selectedBedModal.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Patient Name:</span>
                <strong style={{ fontSize: '0.85rem' }}>{selectedBedModal.patientName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>UHID:</span>
                <span style={{ fontSize: '0.85rem' }}>{selectedBedModal.uhid}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Age / Gender:</span>
                <span style={{ fontSize: '0.85rem' }}>{selectedBedModal.ageGender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Admission Date:</span>
                <span style={{ fontSize: '0.85rem' }}>{selectedBedModal.admissionDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Department:</span>
                <span style={{ fontSize: '0.85rem' }}>{selectedBedModal.department}</span>
              </div>
            </div>

            <div className="modal-actions-row">
              {selectedBedModal.status === "Occupied" && (
                <button
                  type="button"
                  className="modal-btn-submit"
                  style={{ background: '#ef4444' }}
                  onClick={() => handleVacateBed(selectedBedModal.id)}
                >
                  Vacate / Discharge
                </button>
              )}
              {selectedBedModal.status === "Available" && (
                <button
                  type="button"
                  className="modal-btn-submit"
                  onClick={() => {
                    setAllotForm({ ...allotForm, bedNo: selectedBedModal.bedNo, room: selectedBedModal.room });
                    setShowAllotModal(true);
                  }}
                >
                  Allocate Bed
                </button>
              )}
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setSelectedBedModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Bed Allotment Modal */}
      {showAllotModal && (
        <div className="floor-map-modal-overlay" onClick={() => setShowAllotModal(false)}>
          <div className="floor-map-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="floor-map-modal-header">
              <h3 className="floor-map-modal-title">New Bed Allotment</h3>
              <button
                type="button"
                className="floor-map-modal-close"
                onClick={() => setShowAllotModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAllotSubmit}>
              <div className="modal-form-group">
                <label className="modal-form-label">Bed No.</label>
                <select
                  className="modal-form-select"
                  value={allotForm.bedNo}
                  onChange={(e) => setAllotForm({ ...allotForm, bedNo: e.target.value })}
                >
                  {bedsData
                    .filter((b) => b.status === "Available")
                    .map((b) => (
                      <option key={b.id} value={b.bedNo}>
                        {b.bedNo} ({b.room})
                      </option>
                    ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-form-label">Patient Name *</label>
                <input
                  type="text"
                  className="modal-form-input"
                  placeholder="Enter patient full name"
                  value={allotForm.patientName}
                  onChange={(e) => setAllotForm({ ...allotForm, patientName: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-form-label">UHID *</label>
                <input
                  type="text"
                  className="modal-form-input"
                  placeholder="e.g. UHID12390"
                  value={allotForm.uhid}
                  onChange={(e) => setAllotForm({ ...allotForm, uhid: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-form-label">Department</label>
                <select
                  className="modal-form-select"
                  value={allotForm.department}
                  onChange={(e) => setAllotForm({ ...allotForm, department: e.target.value })}
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Surgery">General Surgery</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setShowAllotModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn-submit">
                  Confirm Allotment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Bed Transfer Modal */}
      {showTransferModal && (
        <div className="floor-map-modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="floor-map-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="floor-map-modal-header">
              <h3 className="floor-map-modal-title">Transfer Patient Bed</h3>
              <button
                type="button"
                className="floor-map-modal-close"
                onClick={() => setShowTransferModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Select Currently Occupied Bed</label>
              <select className="modal-form-select">
                {bedsData
                  .filter((b) => b.status === "Occupied")
                  .map((b) => (
                    <option key={b.id} value={b.bedNo}>
                      {b.bedNo} - {b.patientName} ({b.room})
                    </option>
                  ))}
              </select>
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Target Vacant Bed</label>
              <select className="modal-form-select">
                {bedsData
                  .filter((b) => b.status === "Available")
                  .map((b) => (
                    <option key={b.id} value={b.bedNo}>
                      {b.bedNo} ({b.room})
                    </option>
                  ))}
              </select>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setShowTransferModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn-submit"
                onClick={() => {
                  toast.success("Bed transfer processed successfully!");
                  setShowTransferModal(false);
                }}
              >
                Process Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Block / Maintenance Modal */}
      {showBlockModal && (
        <div className="floor-map-modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="floor-map-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="floor-map-modal-header">
              <h3 className="floor-map-modal-title">Block Bed / Maintenance</h3>
              <button
                type="button"
                className="floor-map-modal-close"
                onClick={() => setShowBlockModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Select Bed to Block</label>
              <select className="modal-form-select">
                {bedsData.map((b) => (
                  <option key={b.id} value={b.bedNo}>
                    {b.bedNo} - Status: {b.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Reason for Blocking</label>
              <input
                type="text"
                className="modal-form-input"
                placeholder="e.g. Sanitization, Repair, Equipment Servicing"
              />
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setShowBlockModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn-submit"
                style={{ background: "#f97316" }}
                onClick={() => {
                  toast.success("Bed status updated to Maintenance!");
                  setShowBlockModal(false);
                }}
              >
                Block Bed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
