import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import ipdService from "../../api/services/ipdService";
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
  const [bedsData, setBedsData] = useState([]);
  const [bedsLoading, setBedsLoading] = useState(true);
  
  // Table search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [roomFilter, setRoomFilter] = useState("All Rooms");

  // Modals state
  const [selectedBedModal, setSelectedBedModal] = useState(null);
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ fromBedId: "", toBedId: "" });

  // Add Bed form state
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [addBedForm, setAddBedForm] = useState({
    ward_id: "",
    ward_code: "",
    ward_name: "",
    ward_type: "general",
    floor: "",
    gender_policy: "any",
    bed_category_id: "",
    bed_charge_service_id: "",
    room_id: "",
    room_no: "",
    room_type: "general",
    bed_no: "",
    status: "available",
    features: { oxygen: false, monitor: false, ventilator: false },
  });

  // Form states for Allotment
  const [allotForm, setAllotForm] = useState({
    patientName: "",
    uhid: "",
    ageGender: "30 Y / Male",
    department: "General Medicine",
    room: "GW-101",
    bedNo: "GW-101-02"
  });

  // Load ward / room / bed master for floor map + bed addition
  useEffect(() => {
    const loadWardMaster = async () => {
      try {
        const [bedsData, wardsData, roomsData] = await Promise.all([
          ipdService.getBedMatrix().catch(() => []),
          ipdService.getBedWards().catch(() => []),
          ipdService.getBedRooms().catch(() => []),
        ]);
        setBedsData(Array.isArray(bedsData) ? bedsData : []);
        setWards(Array.isArray(wardsData) ? wardsData : []);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        if (Array.isArray(wardsData) && wardsData.length > 0) {
          const floorNames = Array.from(
            new Set(wardsData.map((w) => w.floor).filter(Boolean))
          );
          if (floorNames.length > 0 && !floorNames.includes(activeFloor)) {
            setActiveFloor(floorNames[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setBedsLoading(false);
      }
    };
    loadWardMaster();
  }, []);

  // Bed categories derived from wards
  const bedCategories = useMemo(() => {
    const map = new Map();
    wards.forEach((w) => {
      if (w.bed_category_id && !map.has(w.bed_category_id)) {
        map.set(w.bed_category_id, {
          id: w.bed_category_id,
          name: w.bed_category_name || w.bed_category_code || "Bed Category",
        });
      }
    });
    return Array.from(map.values());
  }, [wards]);

  // Available floors navigation (derived from wards + live bed data)
  const floorsList = useMemo(() => {
    const floorMap = new Map();
    wards.forEach((w) => {
      const floor = w.floor || "Unknown";
      if (!floorMap.has(floor)) floorMap.set(floor, { name: floor, count: 0 });
    });
    const wardFloor = new Map(wards.map((w) => [w.id, w.floor || "Unknown"]));
    bedsData.forEach((b) => {
      const floor = wardFloor.get(b.ward_id) || b.floor || "Unknown";
      const entry = floorMap.get(floor);
      if (entry) entry.count += 1;
    });
    return Array.from(floorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [wards, bedsData]);

  // Overall hospital wide stats from live bed data
  const overallStats = useMemo(() => {
    const total = bedsData.length;
    const occupied = bedsData.filter((b) => b.current_status === "occupied").length;
    const available = bedsData.filter((b) => b.current_status === "available").length;
    const reserved = bedsData.filter((b) => b.current_status === "reserved").length;
    const maintenance = bedsData.filter((b) => b.current_status === "maintenance").length;
    const pct = (n) => (total > 0 ? Number(((n / total) * 100).toFixed(1)) : 0);
    return {
      total,
      occupied,
      occupiedPct: pct(occupied),
      available,
      availablePct: pct(available),
      reserved,
      reservedPct: pct(reserved),
      maintenance,
      maintenancePct: pct(maintenance),
    };
  }, [bedsData]);

  // Current floor summary calculation (live data, scoped to active floor)
  const floorCounts = useMemo(() => {
    const floorBeds = bedsData.filter(
      (b) => (wards.find((w) => w.id === b.ward_id)?.floor || b.floor) === activeFloor
    );
    return {
      total: floorBeds.length,
      occupied: floorBeds.filter((b) => b.current_status === "occupied").length,
      available: floorBeds.filter((b) => b.current_status === "available").length,
      reserved: floorBeds.filter((b) => b.current_status === "reserved").length,
      maintenance: floorBeds.filter((b) => b.current_status === "maintenance").length,
    };
  }, [bedsData, wards, activeFloor]);

  // Map raw API bed rows into the display shape used by table / actions
  const calculateBedAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age;
  };

  const bedViewFromApi = (b) => ({
    id: b.id,
    bedNo: b.bed_no,
    room: b.room_name || b.room_id || "-",
    wardName: b.ward_name || "-",
    patientName: b.patient_first_name || b.patient_last_name ? `${b.patient_first_name || ""} ${b.patient_last_name || ""}`.trim() : "-",
    uhid: b.patient_uhid || "-",
    ageGender: b.patient_id ? `${calculateBedAge(b.date_of_birth) ?? "-"} Y / ${b.gender || "-"}` : "-",
    admissionDate: b.admission_id ? new Date(b.admitted_at).toLocaleDateString("en-GB") : "-",
    department: b.department_name || "-",
    status: b.current_status,
  });

  const bedsView = useMemo(() => bedsData.map(bedViewFromApi), [bedsData]);

  // Filtered beds for table
  const filteredBedsForTable = useMemo(() => {
    return bedsView.filter((b) => {
      const matchesSearch =
        String(b.bedNo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(b.patientName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(b.uhid ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(b.room ?? "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All Status" || b.status === statusFilter;

      const matchesRoom =
        roomFilter === "All Rooms" || b.room === roomFilter;

      return matchesSearch && matchesStatus && matchesRoom;
    });
  }, [bedsView, searchTerm, statusFilter, roomFilter]);

  // Ward options scoped to the active floor (from live ward data)
  const wardOptions = useMemo(() => {
    const names = new Set();
    wards.forEach((w) => {
      if (w.floor === activeFloor) names.add(w.name);
    });
    return Array.from(names);
  }, [wards, activeFloor]);

  const effectiveWardFilter =
    wardOptions.includes(selectedWardFilter) ? selectedWardFilter : "All";

  // Beds scoped to the active floor (+ selected ward)
  const bedsInFloor = useMemo(() => {
    const floorBeds = bedsData.filter(
      (b) => (wards.find((w) => w.id === b.ward_id)?.floor || b.floor) === activeFloor
    );
    if (effectiveWardFilter !== "All") {
      return floorBeds.filter((b) => (b.ward_name || "") === effectiveWardFilter);
    }
    return floorBeds;
  }, [bedsData, wards, activeFloor, effectiveWardFilter]);

  // Group beds of the active floor (+ ward) into rooms for the blueprint
  const blueprintRooms = useMemo(() => {
    const map = new Map();
    bedsInFloor.forEach((b) => {
      const key = `${b.ward_id || "ward"}::${b.room_id || b.room_name}`;
      if (!map.has(key)) {
        map.set(key, { key, room_no: b.room_name || b.room_id, ward_id: b.ward_id, beds: [] });
      }
      map.get(key).beds.push(b);
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.room_no).localeCompare(String(b.room_no))
    );
  }, [bedsInFloor]);

  const blueprintRoomRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < blueprintRooms.length; i += 4) {
      rows.push(blueprintRooms.slice(i, i + 4));
    }
    return rows;
  }, [blueprintRooms]);

  // Handle bed allotment form submit
  const handleAllotSubmit = (e) => {
    e.preventDefault();
    if (!allotForm.patientName || !allotForm.uhid) {
      toast.error("Please fill in patient name and UHID");
      return;
    }

    const updated = bedsData.map((b) => {
      const matches =
        (allotForm.bedNo && b.bed_no === allotForm.bedNo) ||
        (selectedBedModal?.id && b.id === selectedBedModal.id);
      if (matches) {
        return {
          ...b,
          patient_first_name: allotForm.patientName,
          patient_last_name: null,
          patient_id: null,
          patient_uhid: allotForm.uhid,
          gender: allotForm.ageGender?.split(" / ")[1]?.trim() || null,
          date_of_birth: null,
          admission_id: null,
          status: "occupied",
          current_status: "occupied",
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

  // Handle Add Bed (floor-wise) submission -> POST /beds
  const handleAddBedSubmit = async (e) => {
    e.preventDefault();
    if (!addBedForm.bed_no) {
      toast.error("Bed number is required");
      return;
    }
    if (!addBedForm.ward_id && !addBedForm.ward_code) {
      toast.error("Please select an existing ward or enter a new ward code");
      return;
    }

    try {
      const payload = {
        facility_id: "00000000-0000-0000-0000-000000000000",
        ward_id: addBedForm.ward_id || undefined,
        ward_code: addBedForm.ward_code || undefined,
        ward_name: addBedForm.ward_name || undefined,
        ward_type: addBedForm.ward_type,
        floor: addBedForm.floor || undefined,
        gender_policy: addBedForm.gender_policy,
        bed_category_id: addBedForm.bed_category_id || null,
        room_id: addBedForm.room_id || null,
        room_no: addBedForm.room_no || undefined,
        room_type: addBedForm.room_type,
        bed_no: addBedForm.bed_no,
        status: addBedForm.status,
        features: addBedForm.features,
      };
      const bed = await ipdService.addBed(payload);
      toast.success(`Bed ${addBedForm.bed_no} added successfully!`, { icon: "🛏️" });
      setShowAddBedModal(false);
      setAddBedForm({
        ward_id: "",
        ward_code: "",
        ward_name: "",
        ward_type: "general",
        floor: "",
        gender_policy: "any",
        bed_category_id: "",
        bed_charge_service_id: "",
        room_id: "",
        room_no: "",
        room_type: "general",
        bed_no: "",
        status: "available",
        features: { oxygen: false, monitor: false, ventilator: false },
      });
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to add bed");
    }
  };

  // Handle Vacate Bed (discharge via IPD module when admission exists)
  const handleVacateBed = async (bedId) => {
    const bed = bedsData.find((b) => b.id === bedId);
    if (bed?.admission_id) {
      try {
        await ipdService.dischargePatient(bed.admission_id, {
          discharge_type: "normal",
          discharge_condition: "Stable",
        });
      } catch (err) {
        console.error(err);
      }
    }
    const updated = bedsData.map((b) => {
      if (b.id === bedId) {
        return {
          ...b,
          patient_first_name: null,
          patient_last_name: null,
          patient_id: null,
          patient_uhid: null,
          gender: null,
          date_of_birth: null,
          admission_id: null,
          status: "available",
          current_status: "available",
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

          <button
            type="button"
            className="floor-map-btn-primary"
            onClick={() => setShowAddBedModal(true)}
          >
            <Icon name="LuPlus" size={18} />
            <span>Add Bed</span>
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
              {overallStats.occupiedPct}%
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
              {overallStats.availablePct}%
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
              {overallStats.reservedPct}%
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
              {overallStats.maintenancePct}%
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
                  {activeFloor} - {effectiveWardFilter}
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
                value={effectiveWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
              >
                <option value="All">All Wards</option>
                {wardOptions.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
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
                {blueprintRoomRows.map((row, rowIdx) => (
                  <React.Fragment key={`blueprint-row-${rowIdx}`}>
                    {rowIdx > 0 && (
                      <div className="blueprint-corridor">CORRIDOR</div>
                    )}
                    <div className="blueprint-rooms-row">
                      {row.map((roomGroup) => (
                        <div className="blueprint-room" key={roomGroup.key}>
                          <div className="blueprint-room__header">
                            <div className="blueprint-room__name">{roomGroup.room_no}</div>
                            <div className="blueprint-room__capacity">{roomGroup.beds.length} Beds</div>
                          </div>
                          <div className="blueprint-bed-grid">
                            {roomGroup.beds.map((b, idx) => (
                              <div
                                key={b.id}
                                className={`blueprint-bed-item blueprint-bed-item--${(b.current_status || "available").toLowerCase()}`}
                                title={`${b.bed_no} (${b.current_status}) - ${b.patient_first_name || b.patient_last_name ? `${b.patient_first_name || ""} ${b.patient_last_name || ""}`.trim() : "-"}`}
                                onClick={() => setSelectedBedModal(bedViewFromApi(b))}
                              >
                                <span className="blueprint-bed-icon">
                                  <Icon name="LuBed" size={18} />
                                </span>
                                <span className="blueprint-bed-num">{idx + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                ))}
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
                  strokeDasharray={`${overallStats.occupiedPct}, 100`}
                />
                {/* Available Segment (19.2%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3.8"
                  strokeDasharray={`${overallStats.availablePct}, 100`}
                  strokeDashoffset={-overallStats.occupiedPct}
                />
                {/* Reserved Segment (4.0%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3.8"
                  strokeDasharray={`${overallStats.reservedPct}, 100`}
                  strokeDashoffset={-overallStats.occupiedPct - overallStats.availablePct}
                />
                {/* Maintenance Segment (2.0%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.8"
                  strokeDasharray={`${overallStats.maintenancePct}, 100`}
                  strokeDashoffset={-overallStats.occupiedPct - overallStats.availablePct - overallStats.reservedPct}
                />
              </svg>
              <div className="donut-center-text">
                <div className="donut-center-val">{overallStats.total}</div>
                <div className="donut-center-lbl">Total Beds</div>
              </div>
            </div>

            <div className="overview-legend-list">
              <div className="overview-legend-item">
                <div className="overview-legend-left">
                  <span className="overview-legend-dot" style={{ background: "#10b981" }}></span>
                  <span>Occupied</span>
                </div>
                <span className="overview-legend-val">{overallStats.occupied} ({overallStats.occupiedPct}%)</span>
              </div>

              <div className="overview-legend-item">
                <div className="overview-legend-left">
                  <span className="overview-legend-dot" style={{ background: "#0284c7" }}></span>
                  <span>Available</span>
                </div>
                <span className="overview-legend-val">{overallStats.available} ({overallStats.availablePct}%)</span>
              </div>

              <div className="overview-legend-item">
                <div className="overview-legend-left">
                  <span className="overview-legend-dot" style={{ background: "#f97316" }}></span>
                  <span>Reserved</span>
                </div>
                <span className="overview-legend-val">{overallStats.reserved} ({overallStats.reservedPct}%)</span>
              </div>

              <div className="overview-legend-item">
                <div className="overview-legend-left">
                  <span className="overview-legend-dot" style={{ background: "#ef4444" }}></span>
                  <span>Maintenance</span>
                </div>
                <span className="overview-legend-val">{overallStats.maintenance} ({overallStats.maintenancePct}%)</span>
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
                            if (bed.status === "available") {
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
              {selectedBedModal.status === "occupied" && (
                <button
                  type="button"
                  className="modal-btn-submit"
                  style={{ background: '#ef4444' }}
                  onClick={() => handleVacateBed(selectedBedModal.id)}
                >
                  Vacate / Discharge
                </button>
              )}
              {selectedBedModal.status === "available" && (
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
                  {bedsView
                    .filter((b) => b.status === "available")
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
              <select
                className="modal-form-select"
                value={transferForm.fromBedId}
                onChange={(e) => setTransferForm({ ...transferForm, fromBedId: e.target.value })}
              >
                <option value="">-- Select Occupied Bed --</option>
                {bedsView
                  .filter((b) => b.status === "occupied")
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNo} - {b.patientName} ({b.room})
                    </option>
                  ))}
              </select>
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Target Vacant Bed</label>
              <select
                className="modal-form-select"
                value={transferForm.toBedId}
                onChange={(e) => setTransferForm({ ...transferForm, toBedId: e.target.value })}
              >
                <option value="">-- Select Vacant Bed --</option>
                {bedsView
                  .filter((b) => b.status === "available")
                  .map((b) => (
                    <option key={b.id} value={b.id}>
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
                onClick={async () => {
                  if (!transferForm.fromBedId || !transferForm.toBedId) {
                    toast.error("Please select source and target bed");
                    return;
                  }
                  try {
                    await ipdService.transferBed({
                      fromBedId: transferForm.fromBedId,
                      toBedId: transferForm.toBedId,
                    });
                    toast.success("Bed transfer processed successfully!");
                    setShowTransferModal(false);
                  } catch (err) {
                    toast.error(err?.response?.data?.error?.message || "Bed transfer failed");
                  }
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
              <select className="modal-form-select" value={selectedBedModal?.id || ""}>
                {bedsView.map((b) => (
                  <option key={b.id} value={b.id}>
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
                onClick={async () => {
                  if (!selectedBedModal?.id) {
                    toast.error("Please select a bed to block");
                    return;
                  }
                  try {
                    await ipdService.updateBedStatus(selectedBedModal.id, "maintenance");
                    setBedsData((prev) =>
                      prev.map((b) =>
                        b.id === selectedBedModal.id
                          ? { ...b, status: "maintenance", current_status: "maintenance" }
                          : b
                      )
                    );
                    toast.success("Bed status updated to Maintenance!");
                  } catch (err) {
                    toast.error(err?.response?.data?.error?.message || "Failed to update bed status");
                  } finally {
                    setShowBlockModal(false);
                  }
                }}
              >
                Block Bed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Add Bed Modal */}
      {showAddBedModal && (
        <div className="floor-map-modal-overlay" onClick={() => setShowAddBedModal(false)}>
          <div className="floor-map-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="floor-map-modal-header">
              <h3 className="floor-map-modal-title">Add New Bed</h3>
              <button
                type="button"
                className="floor-map-modal-close"
                onClick={() => setShowAddBedModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBedSubmit}>
              <div className="modal-form-group">
                <label className="modal-form-label">Floor</label>
                <input
                  type="text"
                  className="modal-form-input"
                  placeholder="e.g. Ground Floor"
                  value={addBedForm.floor}
                  onChange={(e) => setAddBedForm({ ...addBedForm, floor: e.target.value })}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-form-label">Ward</label>
                <select
                  className="modal-form-select"
                  value={addBedForm.ward_id}
                  onChange={(e) => setAddBedForm({ ...addBedForm, ward_id: e.target.value })}
                >
                  <option value="">-- New Ward (auto-create) --</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.floor ? `— ${w.floor}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {addBedForm.ward_id === "" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  <div className="modal-form-group">
                    <label className="modal-form-label">New Ward Code *</label>
                    <input
                      type="text"
                      className="modal-form-input"
                      placeholder="e.g. GW-108"
                      value={addBedForm.ward_code}
                      onChange={(e) => setAddBedForm({ ...addBedForm, ward_code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-form-group">
                    <label className="modal-form-label">New Ward Name</label>
                    <input
                      type="text"
                      className="modal-form-input"
                      placeholder="e.g. General Ward - Second Shift"
                      value={addBedForm.ward_name}
                      onChange={(e) => setAddBedForm({ ...addBedForm, ward_name: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                    <div className="modal-form-group">
                      <label className="modal-form-label">Ward Type</label>
                      <select
                        className="modal-form-select"
                        value={addBedForm.ward_type}
                        onChange={(e) => setAddBedForm({ ...addBedForm, ward_type: e.target.value })}
                      >
                        <option value="general">General</option>
                        <option value="semi_private">Semi Private</option>
                        <option value="private">Private</option>
                        <option value="icu">ICU</option>
                        <option value="nicu">NICU</option>
                        <option value="picu">PICU</option>
                        <option value="hdu">HDU</option>
                        <option value="isolation">Isolation</option>
                        <option value="emergency">Emergency</option>
                        <option value="maternity">Maternity</option>
                        <option value="daycare">Daycare</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="modal-form-group">
                      <label className="modal-form-label">Gender Policy</label>
                      <select
                        className="modal-form-select"
                        value={addBedForm.gender_policy}
                        onChange={(e) => setAddBedForm({ ...addBedForm, gender_policy: e.target.value })}
                      >
                        <option value="any">Any</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {addBedForm.ward_id && (
                <div className="modal-form-group">
                  <label className="modal-form-label">Room No.</label>
                  <input
                    type="text"
                    className="modal-form-input"
                    placeholder="e.g. GW-101"
                    value={addBedForm.room_no}
                    onChange={(e) => setAddBedForm({ ...addBedForm, room_no: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div className="modal-form-group">
                  <label className="modal-form-label">Bed Category</label>
                  <select
                    className="modal-form-select"
                    value={addBedForm.bed_category_id}
                    onChange={(e) => setAddBedForm({ ...addBedForm, bed_category_id: e.target.value })}
                  >
                    <option value="">-- None / Default --</option>
                    {bedCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Bed No. *</label>
                  <input
                    type="text"
                    className="modal-form-input"
                    placeholder="e.g. GW-101-05"
                    value={addBedForm.bed_no}
                    onChange={(e) => setAddBedForm({ ...addBedForm, bed_no: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Status</label>
                  <select
                    className="modal-form-select"
                    value={addBedForm.status}
                    onChange={(e) => setAddBedForm({ ...addBedForm, status: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Features</label>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    {[
                      { key: "oxygen", label: "Oxygen" },
                      { key: "monitor", label: "Monitor" },
                      { key: "ventilator", label: "Ventilator" },
                    ].map((f) => (
                      <label key={f.key} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <input
                          type="checkbox"
                          checked={!!addBedForm.features?.[f.key]}
                          onChange={(e) =>
                            setAddBedForm({
                              ...addBedForm,
                              features: { ...addBedForm.features, [f.key]: e.target.checked },
                            })
                          }
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="modal-btn-cancel" onClick={() => setShowAddBedModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-submit">
                  Add Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
