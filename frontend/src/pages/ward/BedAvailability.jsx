import React, { useState } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import "./BedAvailability.css";

export default function BedAvailability() {
  const [activeCategoryPill, setActiveCategoryPill] = useState("All Beds");
  const [expandedFloor, setExpandedFloor] = useState("Ground Floor - General Ward");
  const [selectedRoomModal, setSelectedRoomModal] = useState(null);

  // Filter dropdown states
  const [filters, setFilters] = useState({
    floor: "All Floors",
    ward: "All Wards",
    roomType: "All Types",
    bedType: "All",
    gender: "All",
    status: "All",
  });

  // Overall Stat Cards
  const stats = {
    total: 250,
    available: 48,
    availablePct: "19.2%",
    occupied: 187,
    occupiedPct: "74.8%",
    reserved: 10,
    reservedPct: "4.0%",
    maintenance: 5,
    maintenancePct: "2.0%",
  };

  // Floor Accordions Data (Matching mockup exactly)
  const floorAccordions = [
    {
      id: "ground",
      title: "Ground Floor - General Ward",
      icon: "LuBed",
      badgeBg: "#eff6ff",
      badgeColor: "#2563eb",
      totalBeds: 48,
      occupied: 34,
      available: 10,
      reserved: 3,
      maintenance: 1,
      pct: "71%",
      barColor: "#10b981",
      rooms: [
        { roomNo: "GW-101", roomType: "General Ward", total: 4, occ: 3, avail: 1, res: 0, maint: 0, status: "Almost Full" },
        { roomNo: "GW-102", roomType: "General Ward", total: 4, occ: 2, avail: 2, res: 0, maint: 0, status: "Available" },
        { roomNo: "GW-103", roomType: "General Ward", total: 4, occ: 3, avail: 1, res: 0, maint: 0, status: "Almost Full" },
        { roomNo: "GW-104", roomType: "General Ward", total: 4, occ: 4, avail: 0, res: 0, maint: 0, status: "Full" },
        { roomNo: "GW-105", roomType: "General Ward", total: 4, occ: 2, avail: 1, res: 1, maint: 0, status: "Available" },
        { roomNo: "GW-106", roomType: "General Ward", total: 4, occ: 3, avail: 1, res: 0, maint: 0, status: "Almost Full" },
      ],
    },
    {
      id: "first",
      title: "First Floor - Private Rooms",
      icon: "LuBuilding",
      badgeBg: "#ecfdf5",
      badgeColor: "#10b981",
      totalBeds: 48,
      occupied: 28,
      available: 10,
      reserved: 2,
      maintenance: 0,
      pct: "70%",
      barColor: "#10b981",
      rooms: [
        { roomNo: "PR-201", roomType: "Private Room", total: 2, occ: 1, avail: 1, res: 0, maint: 0, status: "Available" },
        { roomNo: "PR-202", roomType: "Private Room", total: 2, occ: 2, avail: 0, res: 0, maint: 0, status: "Full" },
      ],
    },
    {
      id: "second",
      title: "Second Floor - ICU",
      icon: "LuActivity",
      badgeBg: "#fef2f2",
      badgeColor: "#ef4444",
      totalBeds: 20,
      occupied: 18,
      available: 1,
      reserved: 1,
      maintenance: 0,
      pct: "90%",
      barColor: "#ef4444",
      rooms: [
        { roomNo: "ICU-301", roomType: "ICU", total: 4, occ: 4, avail: 0, res: 0, maint: 0, status: "Full" },
        { roomNo: "ICU-302", roomType: "ICU", total: 4, occ: 3, avail: 1, res: 0, maint: 0, status: "Almost Full" },
      ],
    },
    {
      id: "third",
      title: "Third Floor - Semi Private",
      icon: "LuBedDouble",
      badgeBg: "#fff7ed",
      badgeColor: "#f97316",
      totalBeds: 30,
      occupied: 18,
      available: 10,
      reserved: 2,
      maintenance: 0,
      pct: "60%",
      barColor: "#10b981",
      rooms: [
        { roomNo: "SP-401", roomType: "Semi Private", total: 2, occ: 1, avail: 1, res: 0, maint: 0, status: "Available" },
      ],
    },
    {
      id: "fourth",
      title: "Fourth Floor - Isolation",
      icon: "LuShield",
      badgeBg: "#eff6ff",
      badgeColor: "#0284c7",
      totalBeds: 10,
      occupied: 7,
      available: 2,
      reserved: 1,
      maintenance: 0,
      pct: "70%",
      barColor: "#f97316",
      rooms: [
        { roomNo: "ISO-501", roomType: "Isolation", total: 2, occ: 1, avail: 1, res: 0, maint: 0, status: "Available" },
      ],
    },
    {
      id: "fifth",
      title: "Fifth Floor - Day Care",
      icon: "LuClock",
      badgeBg: "#fff7ed",
      badgeColor: "#d97706",
      totalBeds: 10,
      occupied: 6,
      available: 4,
      reserved: 0,
      maintenance: 0,
      pct: "60%",
      barColor: "#10b981",
      rooms: [
        { roomNo: "DC-601", roomType: "Day Care", total: 2, occ: 1, avail: 1, res: 0, maint: 0, status: "Available" },
      ],
    },
  ];

  // Category Pills
  const categoryPills = [
    { label: "All Beds", count: 250 },
    { label: "General Ward", count: 120 },
    { label: "Private Room", count: 40 },
    { label: "Semi Private", count: 30 },
    { label: "ICU", count: 20 },
    { label: "Emergency", count: 20 },
    { label: "Isolation", count: 10 },
    { label: "Day Care", count: 10 },
  ];

  // Quick View Tiles (8 Colored Tiles)
  const quickViewTiles = [
    { name: "General Ward", count: 120, bg: "#eff6ff", color: "#2563eb", icon: "LuBed" },
    { name: "Private Room", count: 40, bg: "#ecfdf5", color: "#10b981", icon: "LuBuilding" },
    { name: "Semi Private", count: 30, bg: "#f3e8ff", color: "#9333ea", icon: "LuBedDouble" },
    { name: "ICU", count: 20, bg: "#fef2f2", color: "#ef4444", icon: "LuActivity" },
    { name: "Emergency", count: 20, bg: "#fff7ed", color: "#f97316", icon: "LuSiren" },
    { name: "Isolation", count: 10, bg: "#e0f2fe", color: "#0284c7", icon: "LuShield" },
    { name: "Day Care", count: 10, bg: "#fce7f3", color: "#db2777", icon: "LuClock" },
    { name: "Other", count: 20, bg: "#f1f5f9", color: "#475569", icon: "LuLayoutGrid" },
  ];

  // Gender Preference Bars
  const genderPreferences = [
    { label: "General (Any)", count: 28, pct: "100%", color: "#2563eb" },
    { label: "Male", count: 12, pct: "43%", color: "#10b981" },
    { label: "Female", count: 8, pct: "28%", color: "#9333ea" },
    { label: "Pediatric", count: 4, pct: "14%", color: "#f97316" },
    { label: "ICU (Unisex)", count: 4, pct: "14%", color: "#ef4444" },
  ];

  return (
    <div className="bed-avail-page">
      {/* 1. Header Section */}
      <div className="bed-avail-header">
        <div className="bed-avail-header__title-group">
          <div className="bed-avail-header__icon">
            <Icon name="LuBedDouble" size={24} />
          </div>
          <div>
            <h1 className="bed-avail-header__title">Bed Availability</h1>
            <p className="bed-avail-header__subtitle">
              View real-time bed status across all floors, wards and rooms
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
          <div className="breadcrumb-text">
            Home &gt; IPD / OPD Ward &gt; <span>Bed Availability</span>
          </div>
          <button
            type="button"
            className="search-btn-primary"
            onClick={() => toast.success("Exporting Bed Availability Report...")}
          >
            <Icon name="LuDownload" size={14} /> Export
          </button>
        </div>
      </div>

      {/* 2. Top 5 Stat Cards */}
      <div className="floor-map-stats-grid">
        <div className="floor-map-stat-card floor-map-stat-card--total">
          <div className="floor-map-stat-card__info">
            <span className="floor-map-stat-card__label">Total Beds</span>
            <span className="floor-map-stat-card__value">{stats.total}</span>
            <span className="floor-map-stat-card__subtext">100%</span>
          </div>
          <div className="floor-map-stat-card__icon-wrap">
            <Icon name="LuBed" size={20} />
          </div>
        </div>

        <div className="floor-map-stat-card floor-map-stat-card--available">
          <div className="floor-map-stat-card__info">
            <span className="floor-map-stat-card__label">Available</span>
            <span className="floor-map-stat-card__value" style={{ color: "#10b981" }}>
              {stats.available}
            </span>
            <span className="floor-map-stat-card__subtext floor-map-stat-card__subtext--pct" style={{ color: "#10b981" }}>
              {stats.availablePct}
            </span>
          </div>
          <div className="floor-map-stat-card__icon-wrap" style={{ background: "#ecfdf5", color: "#10b981" }}>
            <Icon name="LuUserCheck" size={20} />
          </div>
        </div>

        <div className="floor-map-stat-card floor-map-stat-card--occupied">
          <div className="floor-map-stat-card__info">
            <span className="floor-map-stat-card__label">Occupied</span>
            <span className="floor-map-stat-card__value">{stats.occupied}</span>
            <span className="floor-map-stat-card__subtext floor-map-stat-card__subtext--pct">
              {stats.occupiedPct}
            </span>
          </div>
          <div className="floor-map-stat-card__icon-wrap">
            <Icon name="LuBedSingle" size={20} />
          </div>
        </div>

        <div className="floor-map-stat-card floor-map-stat-card--reserved">
          <div className="floor-map-stat-card__info">
            <span className="floor-map-stat-card__label">Reserved</span>
            <span className="floor-map-stat-card__value">{stats.reserved}</span>
            <span className="floor-map-stat-card__subtext floor-map-stat-card__subtext--pct">
              {stats.reservedPct}
            </span>
          </div>
          <div className="floor-map-stat-card__icon-wrap">
            <Icon name="LuClock" size={20} />
          </div>
        </div>

        <div className="floor-map-stat-card floor-map-stat-card--maintenance">
          <div className="floor-map-stat-card__info">
            <span className="floor-map-stat-card__label">Maintenance</span>
            <span className="floor-map-stat-card__value">{stats.maintenance}</span>
            <span className="floor-map-stat-card__subtext floor-map-stat-card__subtext--pct">
              {stats.maintenancePct}
            </span>
          </div>
          <div className="floor-map-stat-card__icon-wrap" style={{ background: "#f3e8ff", color: "#9333ea" }}>
            <Icon name="LuWrench" size={20} />
          </div>
        </div>
      </div>

      {/* 3. Filter Dropdowns Bar */}
      <div className="bed-avail-filters-bar">
        <div className="filter-dropdowns-group">
          <div className="filter-select-item">
            <span className="filter-select-label">Floor</span>
            <select
              className="filter-select-input"
              value={filters.floor}
              onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
            >
              <option value="All Floors">All Floors</option>
              <option value="Ground Floor">Ground Floor</option>
              <option value="First Floor">First Floor</option>
            </select>
          </div>

          <div className="filter-select-item">
            <span className="filter-select-label">Ward</span>
            <select
              className="filter-select-input"
              value={filters.ward}
              onChange={(e) => setFilters({ ...filters, ward: e.target.value })}
            >
              <option value="All Wards">All Wards</option>
              <option value="General Ward">General Ward</option>
              <option value="ICU Ward">ICU Ward</option>
            </select>
          </div>

          <div className="filter-select-item">
            <span className="filter-select-label">Room Type</span>
            <select
              className="filter-select-input"
              value={filters.roomType}
              onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
            >
              <option value="All Types">All Types</option>
              <option value="General Ward">General Ward</option>
              <option value="Private">Private</option>
            </select>
          </div>

          <div className="filter-select-item">
            <span className="filter-select-label">Bed Type</span>
            <select
              className="filter-select-input"
              value={filters.bedType}
              onChange={(e) => setFilters({ ...filters, bedType: e.target.value })}
            >
              <option value="All">All</option>
              <option value="General">General</option>
              <option value="ICU">ICU</option>
            </select>
          </div>

          <div className="filter-select-item">
            <span className="filter-select-label">Gender Preference</span>
            <select
              className="filter-select-input"
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            >
              <option value="All">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="filter-select-item">
            <span className="filter-select-label">Status</span>
            <select
              className="filter-select-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="All">All</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.8rem" }}>
          <button
            type="button"
            className="search-btn-primary"
            onClick={() => toast.success("Filters applied!")}
          >
            <Icon name="LuSearch" size={14} /> Search
          </button>
          <button
            type="button"
            className="btn-reset"
            onClick={() => {
              setFilters({
                floor: "All Floors",
                ward: "All Wards",
                roomType: "All Types",
                bedType: "All",
                gender: "All",
                status: "All",
              });
              toast.info("Filters reset");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* 4. Category Filter Pills Bar */}
      <div className="category-pills-bar">
        {categoryPills.map((pill) => (
          <button
            key={pill.label}
            type="button"
            className={`category-pill-btn ${
              activeCategoryPill === pill.label ? "category-pill-btn--active" : ""
            }`}
            onClick={() => setActiveCategoryPill(pill.label)}
          >
            <span>{pill.label}</span>
            <span className="category-pill-count">{pill.count}</span>
          </button>
        ))}
      </div>

      {/* 5. Main Dual Column Grid */}
      <div className="bed-avail-main-grid">
        {/* Left Column: Floor wise Bed Availability (Collapsible Accordions) */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.65rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="LuBuilding" size={18} style={{ color: "#2563eb" }} />
            Floor wise Bed Availability
          </h3>

          {floorAccordions.map((floor) => {
            const isExpanded = expandedFloor === floor.title;
            return (
              <div key={floor.id} className="floor-accordion-card">
                <div
                  className="floor-accordion-header"
                  onClick={() => setExpandedFloor(isExpanded ? null : floor.title)}
                >
                  <div className="floor-header-title-wrap">
                    <div className="floor-icon-badge" style={{ background: floor.badgeBg, color: floor.badgeColor }}>
                      <Icon name={floor.icon} size={16} />
                    </div>
                    <div>
                      <div className="floor-name-title">{floor.title}</div>
                      <div className="floor-meta-info">
                        Total Beds: {floor.totalBeds} | Occupied: {floor.occupied} | Available: {floor.available} | Reserved: {floor.reserved} | Maintenance: {floor.maintenance}
                      </div>
                    </div>
                  </div>

                  <div className="floor-progress-group">
                    <div className="floor-progress-bar-track">
                      <div
                        className="floor-progress-bar-fill"
                        style={{ width: floor.pct, background: floor.barColor }}
                      ></div>
                    </div>
                    <span className="floor-pct-text">{floor.pct} Occupied</span>
                    <Icon name={isExpanded ? "LuChevronUp" : "LuChevronDown"} size={18} style={{ color: "#64748b" }} />
                  </div>
                </div>

                {isExpanded && (
                  <table className="floor-rooms-table">
                    <thead>
                      <tr>
                        <th>Room No.</th>
                        <th>Room Type</th>
                        <th>Total Beds</th>
                        <th>Occupied</th>
                        <th>Available</th>
                        <th>Reserved</th>
                        <th>Maintenance</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floor.rooms.map((room) => (
                        <tr key={room.roomNo}>
                          <td style={{ fontWeight: 700, color: "#0f172a" }}>{room.roomNo}</td>
                          <td>{room.roomType}</td>
                          <td>{room.total}</td>
                          <td style={{ color: "#ef4444", fontWeight: 700 }}>{room.occ}</td>
                          <td style={{ color: "#10b981", fontWeight: 700 }}>{room.avail}</td>
                          <td>{room.res}</td>
                          <td>{room.maint}</td>
                          <td>
                            <span
                              className={`room-status-badge room-status-badge--${room.status
                                .toLowerCase()
                                .replace(" ", "-")}`}
                            >
                              {room.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-view-beds"
                              onClick={() => setSelectedRoomModal(room)}
                            >
                              View Beds &gt;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Overview, Quick View, Gender Preference */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Card 1: Bed Status Overview (Donut Chart) */}
          <div className="side-panel-card">
            <h3 className="side-panel-card__title">Bed Status Overview</h3>
            <div className="donut-chart-wrap">
              <svg className="donut-chart-svg" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.8"
                  strokeDasharray="74.8, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.8"
                  strokeDasharray="19.2, 100"
                  strokeDashoffset="-74.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3.8"
                  strokeDasharray="4.0, 100"
                  strokeDashoffset="-94"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#9333ea"
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
                  <span className="overview-legend-dot" style={{ background: "#ef4444" }}></span>
                  <span>Occupied</span>
                </div>
                <span className="overview-legend-val">187 (74.8%)</span>
              </div>
              <div className="overview-legend-item">
                <div className="overview-legend-left">
                  <span className="overview-legend-dot" style={{ background: "#10b981" }}></span>
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
                  <span className="overview-legend-dot" style={{ background: "#9333ea" }}></span>
                  <span>Maintenance</span>
                </div>
                <span className="overview-legend-val">5 (2.0%)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Quick View (8 Colored Department Tiles) */}
          <div className="side-panel-card">
            <h3 className="side-panel-card__title">Quick View</h3>
            <div className="quick-view-tiles-grid">
              {quickViewTiles.map((tile) => (
                <div
                  key={tile.name}
                  className="quick-view-tile"
                  style={{ background: tile.bg, color: tile.color }}
                >
                  <span className="quick-view-tile__icon">
                    <Icon name={tile.icon} size={16} />
                  </span>
                  <span className="quick-view-tile__name">{tile.name}</span>
                  <span className="quick-view-tile__count">{tile.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Available Beds by Gender Preference */}
          <div className="side-panel-card">
            <h3 className="side-panel-card__title">Available Beds by Gender Preference</h3>
            <div>
              {genderPreferences.map((g) => (
                <div key={g.label} className="gender-bar-item">
                  <div className="gender-bar-head">
                    <span>{g.label}</span>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{g.count}</span>
                  </div>
                  <div className="gender-bar-track">
                    <div
                      className="gender-bar-fill"
                      style={{ width: g.pct, background: g.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Room Beds Modal */}
      {selectedRoomModal && (
        <div className="floor-map-modal-overlay" onClick={() => setSelectedRoomModal(null)}>
          <div className="floor-map-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="floor-map-modal-header">
              <h3 className="floor-map-modal-title">
                Room Beds: {selectedRoomModal.roomNo} ({selectedRoomModal.roomType})
              </h3>
              <button
                type="button"
                className="floor-map-modal-close"
                onClick={() => setSelectedRoomModal(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
              <div className="bed-chip bed-chip--selected" style={{ padding: "0.6rem" }}>
                🛏️ {selectedRoomModal.roomNo}-B1 (Available)
              </div>
              <div className="bed-chip" style={{ padding: "0.6rem", background: "#fef2f2", color: "#ef4444" }}>
                🛏️ {selectedRoomModal.roomNo}-B2 (Occupied)
              </div>
              <div className="bed-chip" style={{ padding: "0.6rem", background: "#fef2f2", color: "#ef4444" }}>
                🛏️ {selectedRoomModal.roomNo}-B3 (Occupied)
              </div>
              <div className="bed-chip" style={{ padding: "0.6rem", background: "#fff7ed", color: "#f97316" }}>
                🛏️ {selectedRoomModal.roomNo}-B4 (Reserved)
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="modal-btn-submit"
                onClick={() => {
                  toast.success(`Redirecting to Allotment for ${selectedRoomModal.roomNo}-B1...`);
                  setSelectedRoomModal(null);
                }}
              >
                Allot Bed
              </button>
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setSelectedRoomModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
