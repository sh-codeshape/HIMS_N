import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import ipdService from "../../api/services/ipdService";
import "./FloorBedMap.css";



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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bedToDelete, setBedToDelete] = useState(null);
  const [transferForm, setTransferForm] = useState({ fromBedId: "", toBedId: "" });

  // Edit Bed form state
  const [editBedForm, setEditBedForm] = useState({
    id: "",
    bed_no: "",
    ward_id: "",
    room_id: "",
    room_no: "",
    room_type: "general",
    bed_category_id: "",
    bed_charge_service_id: "",
    status: "available",
    features: {
      oxygen: false,
      monitor: false,
      ventilator: false,
      motorized: false,
      emergency_call_bell: false,
      iv_pole: false,
      suction: false,
      side_rails: false,
    },
    is_active: true,
    patientName: "",
    uhid: "",
  });

  // Add Bed form state
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [addBedForm, setAddBedForm] = useState({
    ward_id: "",
    ward_code: "",
    ward_name: "",
    ward_type: "",
    floor: "",
    gender_policy: "",
    bed_category_id: "",
    bed_charge_service_id: "",
    room_id: "",
    room_no: "",
    room_type: "",
    bed_no: "",
    status: "",
    features: { oxygen: false, monitor: false, ventilator: false },
  });

  // Form states for Allotment
  const [allotForm, setAllotForm] = useState({
    patientName: "",
    uhid: "",
    ageGender: "",
    department: "",
    room: "",
    bedNo: "2"
  });

  // Load ward / room / bed master for floor map + bed addition
  useEffect(() => {
    const loadWardMaster = async () => {
      try {
        const [bedsData, wardsData, roomsData, catsData] = await Promise.all([
          ipdService.getBedMatrix().catch(() => []),
          ipdService.getBedWards().catch(() => []),
          ipdService.getBedRooms().catch(() => []),
          ipdService.getBedCategories().catch(() => []),
        ]);
        setBedsData(Array.isArray(bedsData) ? bedsData : []);
        setWards(Array.isArray(wardsData) ? wardsData : []);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        setCategoriesList(Array.isArray(catsData) ? catsData : catsData?.data || []);
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

  // Bed categories from master API (fallback to wards)
  const bedCategories = useMemo(() => {
    if (categoriesList && categoriesList.length > 0) {
      return categoriesList;
    }
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
  }, [categoriesList, wards]);

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
    wardId: b.ward_id,
    roomId: b.room_id,
    bedCategoryId: b.bed_category_id,
    categoryName: b.category_name || "-",
    bedChargeRate: b.bed_charge_rate || 0,
    features: typeof b.features === "object" && b.features !== null ? b.features : {},
    isActive: b.is_active !== undefined ? b.is_active : true,
    patientName: b.patient_first_name || b.patient_last_name ? `${b.patient_first_name || ""} ${b.patient_last_name || ""}`.trim() : "-",
    uhid: b.patient_uhid || "-",
    ageGender: b.patient_id ? `${calculateBedAge(b.date_of_birth) ?? "-"} Y / ${b.gender || "-"}` : "-",
    admissionDate: b.admission_id ? new Date(b.admitted_at).toLocaleDateString("en-GB") : "-",
    doctorName: b.doctor_first_name || b.doctor_last_name ? `Dr. ${b.doctor_first_name || ""} ${b.doctor_last_name || ""}`.trim() : "-",
    department: b.department_name || b.ward_type || "-",
    status: b.current_status || b.status || "available",
    rawBed: b,
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
      const selectedCategory = bedCategories.find((c) => c.id === addBedForm.bed_category_id);
      const payload = {
        facility_id: "00000000-0000-0000-0000-000000000000",
        ward_id: addBedForm.ward_id || undefined,
        ward_code: addBedForm.ward_code || undefined,
        ward_name: addBedForm.ward_name || undefined,
        ward_type: addBedForm.ward_type,
        floor: addBedForm.floor || undefined,
        gender_policy: addBedForm.gender_policy,
        bed_category_id: addBedForm.bed_category_id || null,
        bed_charge_service_id: selectedCategory?.bed_charge_service_id || undefined,
        room_id: addBedForm.room_id || null,
        room_no: addBedForm.room_no || undefined,
        room_type: addBedForm.room_type,
        bed_no: addBedForm.bed_no,
        status: addBedForm.status,
        features: addBedForm.features,
      };
      const bed = await ipdService.addBed(payload);
      if (bed) {
        setBedsData((prev) => [...prev, bed]);
      }
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

  // Rooms available for the ward selected in the Edit Bed form
  const editRoomsForWard = useMemo(() => {
    if (!editBedForm.ward_id) return rooms;
    return rooms.filter((r) => r.ward_id === editBedForm.ward_id);
  }, [rooms, editBedForm.ward_id]);

  // Open Edit Bed modal with full current configuration
  const handleOpenEditModal = (bed) => {
    const raw = bedsData.find((b) => b.id === bed.id) || bed.rawBed || bed;
    const feats = typeof raw.features === "object" && raw.features !== null ? raw.features : {};
    setEditBedForm({
      id: raw.id,
      bed_no: raw.bed_no || bed.bedNo || "",
      ward_id: raw.ward_id || bed.wardId || "",
      room_id: raw.room_id || bed.roomId || "",
      room_no: raw.room_name || raw.room_no || bed.room || "",
      room_type: raw.room_type || "general",
      bed_category_id: raw.bed_category_id || bed.bedCategoryId || "",
      bed_charge_service_id: raw.bed_charge_service_id || "",
      status: (raw.current_status || raw.status || bed.status || "available").toLowerCase(),
      features: {
        oxygen: !!feats.oxygen,
        monitor: !!feats.monitor,
        ventilator: !!feats.ventilator,
        motorized: !!feats.motorized,
        emergency_call_bell: !!feats.emergency_call_bell,
        iv_pole: !!feats.iv_pole,
        suction: !!feats.suction,
        side_rails: !!feats.side_rails,
      },
      is_active: raw.is_active !== undefined ? raw.is_active : true,
      patientName: bed.patientName !== "-" ? bed.patientName : (raw.patient_first_name || raw.patient_last_name ? `${raw.patient_first_name || ""} ${raw.patient_last_name || ""}`.trim() : null),
      uhid: bed.uhid !== "-" ? bed.uhid : (raw.patient_uhid || null),
    });
    setSelectedBedModal(null);
    setShowEditModal(true);
  };

  // Handle Edit Bed submission -> PUT /beds/:id
  const handleEditBedSubmit = async (e) => {
    e.preventDefault();
    if (!editBedForm.bed_no.trim()) {
      toast.error("Bed number is required");
      return;
    }
    if (!editBedForm.ward_id) {
      toast.error("Please select a ward");
      return;
    }

    try {
      setEditLoading(true);
      const selectedCategory = bedCategories.find((c) => c.id === editBedForm.bed_category_id);
      const selectedWard = wards.find((w) => w.id === editBedForm.ward_id);
      const selectedRoom = rooms.find((r) => r.id === editBedForm.room_id);

      const payload = {
        bed_no: editBedForm.bed_no.trim(),
        ward_id: editBedForm.ward_id,
        room_id: editBedForm.room_id || null,
        room_no: editBedForm.room_no || selectedRoom?.room_no || undefined,
        room_type: editBedForm.room_type,
        bed_category_id: editBedForm.bed_category_id || null,
        bed_charge_service_id: selectedCategory?.bed_charge_service_id || undefined,
        status: editBedForm.status,
        features: editBedForm.features,
        is_active: editBedForm.is_active,
      };

      const updated = await ipdService.updateBed(editBedForm.id, payload);

      setBedsData((prev) =>
        prev.map((b) => {
          if (b.id === editBedForm.id) {
            return {
              ...b,
              ...(updated || {}),
              bed_no: editBedForm.bed_no.trim(),
              ward_id: editBedForm.ward_id,
              ward_name: selectedWard?.name || b.ward_name,
              floor: selectedWard?.floor || b.floor,
              room_id: editBedForm.room_id || b.room_id,
              room_name: editBedForm.room_no || selectedRoom?.room_no || b.room_name,
              bed_category_id: editBedForm.bed_category_id,
              category_name: selectedCategory?.name || b.category_name,
              bed_charge_rate: selectedCategory?.daily_rate || b.bed_charge_rate,
              status: editBedForm.status,
              current_status: editBedForm.status,
              features: editBedForm.features,
              is_active: editBedForm.is_active,
            };
          }
          return b;
        })
      );

      toast.success(`Bed ${editBedForm.bed_no} updated successfully!`, { icon: "✅" });
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || err?.message || "Failed to update bed");
    } finally {
      setEditLoading(false);
    }
  };

  // Open Delete Confirmation modal
  const handlePromptDeleteBed = (bed) => {
    const raw = bedsData.find((b) => b.id === bed.id) || bed.rawBed || bed;
    setBedToDelete({
      id: raw.id,
      bedNo: raw.bed_no || bed.bedNo || "-",
      room: raw.room_name || raw.room_no || bed.room || "-",
      wardName: raw.ward_name || bed.wardName || "-",
      status: (raw.current_status || raw.status || bed.status || "available").toLowerCase(),
      patientName: bed.patientName !== "-" ? bed.patientName : (raw.patient_first_name || raw.patient_last_name ? `${raw.patient_first_name || ""} ${raw.patient_last_name || ""}`.trim() : null),
      uhid: bed.uhid !== "-" ? bed.uhid : (raw.patient_uhid || null),
    });
    setShowDeleteConfirmModal(true);
  };

  // Confirm delete bed -> DELETE /beds/:id
  const handleDeleteBedConfirm = async () => {
    if (!bedToDelete?.id) return;
    try {
      setDeleteLoading(true);
      await ipdService.deleteBed(bedToDelete.id);
      setBedsData((prev) => prev.filter((b) => b.id !== bedToDelete.id));
      toast.success(`Bed ${bedToDelete.bedNo} deleted successfully!`, { icon: "🗑️" });
      setShowDeleteConfirmModal(false);
      setBedToDelete(null);
      setSelectedBedModal(null);
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || err?.message || "Failed to delete bed");
    } finally {
      setDeleteLoading(false);
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
                          className="table-action-icon-btn table-action-icon-btn--edit"
                          title="Edit Bed"
                          onClick={() => handleOpenEditModal(bed)}
                        >
                          <Icon name="LuPencil" size={14} />
                        </button>
                        <button
                          type="button"
                          className="table-action-icon-btn table-action-icon-btn--delete"
                          title="Delete Bed"
                          onClick={() => handlePromptDeleteBed(bed)}
                        >
                          <Icon name="LuTrash2" size={14} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#2563eb' }}><Icon name="LuBed" size={20} /></span>
                <h3 className="floor-map-modal-title">
                  Bed Details: {selectedBedModal.bedNo}
                </h3>
              </div>
              <button
                type="button"
                className="floor-map-modal-close"
                onClick={() => setSelectedBedModal(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Room / Ward:</span>
                <strong style={{ fontSize: '0.85rem' }}>
                  {selectedBedModal.room} {selectedBedModal.wardName !== "-" ? `(${selectedBedModal.wardName})` : ""}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Category & Rate:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {selectedBedModal.categoryName || "General"}
                  {selectedBedModal.bedChargeRate ? ` — ₹${Number(selectedBedModal.bedChargeRate).toLocaleString()} / day` : ""}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Current Status:</span>
                <span className={`status-badge status-badge--${(selectedBedModal.status || "available").toLowerCase()}`}>
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
              {selectedBedModal.doctorName && selectedBedModal.doctorName !== "-" && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Attending Doctor:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedBedModal.doctorName}</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.825rem' }}>Amenities / Equipment:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {Object.entries(selectedBedModal.features || {})
                    .filter(([k, v]) => v === true && k !== 'is_bed_asset')
                    .map(([k]) => (
                      <span key={k} className="amenity-chip amenity-chip--active">
                        ✓ {k.replace(/_/g, ' ')}
                      </span>
                    ))}
                  {Object.entries(selectedBedModal.features || {}).filter(([k, v]) => v === true && k !== 'is_bed_asset').length === 0 && (
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Standard Bed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="modal-btn-delete"
                onClick={() => handlePromptDeleteBed(selectedBedModal)}
              >
                <Icon name="LuTrash2" size={15} />
                <span>Delete Bed</span>
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="modal-btn-edit"
                  onClick={() => handleOpenEditModal(selectedBedModal)}
                >
                  <Icon name="LuPencil" size={15} />
                  <span>Edit Bed</span>
                </button>
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
                      setSelectedBedModal(null);
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
                    <option value="">-- None / Default (General) --</option>
                    {bedCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.daily_rate ? `— ₹${Number(c.daily_rate).toLocaleString()} / day` : ""}
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

      {/* 11. Edit Bed Modal - Full Configuration of All Bed Properties */}
      {showEditModal && (
        <div className="floor-map-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="floor-map-modal-card floor-map-modal-card--lg" onClick={(e) => e.stopPropagation()}>
            <div className="floor-map-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#2563eb' }}><Icon name="LuPencil" size={20} /></span>
                <h3 className="floor-map-modal-title">Edit Bed: {editBedForm.bed_no}</h3>
              </div>
              <button
                type="button"
                className="floor-map-modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            {editBedForm.status === "occupied" && editBedForm.patientName && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '0.85rem', fontSize: '0.8rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="LuUsers" size={16} />
                <span>Currently occupied by <strong>{editBedForm.patientName}</strong> (UHID: {editBedForm.uhid || "-"})</span>
              </div>
            )}

            <form onSubmit={handleEditBedSubmit}>
              <div className="modal-form-grid-2">
                <div className="modal-form-group">
                  <label className="modal-form-label">Bed No. *</label>
                  <input
                    type="text"
                    className="modal-form-input"
                    value={editBedForm.bed_no}
                    onChange={(e) => setEditBedForm({ ...editBedForm, bed_no: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Status *</label>
                  <select
                    className="modal-form-select"
                    value={editBedForm.status}
                    onChange={(e) => setEditBedForm({ ...editBedForm, status: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="modal-form-grid-2">
                <div className="modal-form-group">
                  <label className="modal-form-label">Ward *</label>
                  <select
                    className="modal-form-select"
                    value={editBedForm.ward_id}
                    onChange={(e) => {
                      const newWardId = e.target.value;
                      setEditBedForm({
                        ...editBedForm,
                        ward_id: newWardId,
                        room_id: "",
                        room_no: "",
                      });
                    }}
                    required
                  >
                    <option value="">-- Select Ward --</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.floor ? `(${w.floor})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Room</label>
                  <select
                    className="modal-form-select"
                    value={editBedForm.room_id}
                    onChange={(e) => {
                      const rId = e.target.value;
                      const matched = editRoomsForWard.find((r) => r.id === rId);
                      setEditBedForm({
                        ...editBedForm,
                        room_id: rId,
                        room_no: matched?.room_no || editBedForm.room_no,
                      });
                    }}
                  >
                    <option value="">-- Custom / Select Room --</option>
                    {editRoomsForWard.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.room_no} {r.room_type ? `(${r.room_type})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!editBedForm.room_id && (
                <div className="modal-form-group">
                  <label className="modal-form-label">Custom Room No. (optional)</label>
                  <input
                    type="text"
                    className="modal-form-input"
                    placeholder="e.g. GW-101 or ISO-1"
                    value={editBedForm.room_no}
                    onChange={(e) => setEditBedForm({ ...editBedForm, room_no: e.target.value })}
                  />
                </div>
              )}

              <div className="modal-form-grid-2">
                <div className="modal-form-group">
                  <label className="modal-form-label">Bed Category / Class</label>
                  <select
                    className="modal-form-select"
                    value={editBedForm.bed_category_id}
                    onChange={(e) => setEditBedForm({ ...editBedForm, bed_category_id: e.target.value })}
                  >
                    <option value="">-- Standard / General --</option>
                    {bedCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.daily_rate ? `— ₹${Number(c.daily_rate).toLocaleString()} / day` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Operational State</label>
                  <div style={{ display: 'flex', alignItems: 'center', height: '38px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                      <input
                        type="checkbox"
                        checked={editBedForm.is_active}
                        onChange={(e) => setEditBedForm({ ...editBedForm, is_active: e.target.checked })}
                      />
                      Active Bed (available in IPD)
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-form-group">
                <label className="modal-form-label">Features & Biomedical Amenities</label>
                <div className="amenities-grid">
                  {[
                    { key: "oxygen", label: "Oxygen Port" },
                    { key: "monitor", label: "Cardiac Monitor" },
                    { key: "ventilator", label: "Ventilator" },
                    { key: "motorized", label: "Motorized Bed" },
                    { key: "emergency_call_bell", label: "Call Bell" },
                    { key: "iv_pole", label: "IV Infusion Pole" },
                    { key: "suction", label: "Wall Suction" },
                    { key: "side_rails", label: "Safety Rails" },
                  ].map((feat) => (
                    <label key={feat.key} className="amenity-checkbox-label">
                      <input
                        type="checkbox"
                        checked={!!editBedForm.features?.[feat.key]}
                        onChange={(e) =>
                          setEditBedForm({
                            ...editBedForm,
                            features: {
                              ...editBedForm.features,
                              [feat.key]: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>{feat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions-row" style={{ justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="modal-btn-delete"
                  onClick={() => {
                    handlePromptDeleteBed(editBedForm);
                  }}
                >
                  <Icon name="LuTrash2" size={15} />
                  <span>Delete Bed</span>
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="modal-btn-cancel"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-btn-submit"
                    disabled={editLoading}
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Delete Bed Confirmation Modal */}
      {showDeleteConfirmModal && bedToDelete && (
        <div className="floor-map-modal-overlay" onClick={() => setShowDeleteConfirmModal(false)}>
          <div className="floor-map-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="floor-map-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#dc2626' }}><Icon name="LuTrash2" size={20} /></span>
                <h3 className="floor-map-modal-title">Delete Bed: {bedToDelete.bedNo}</h3>
              </div>
              <button
                type="button"
                className="floor-map-modal-close"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                ✕
              </button>
            </div>

            {bedToDelete.status === "occupied" ? (
              <div className="delete-warning-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                  <Icon name="LuAlertTriangle" size={16} />
                  <span>Cannot Delete Occupied Bed</span>
                </div>
                <div>
                  Patient <strong>{bedToDelete.patientName || "Admitted Patient"}</strong> (UHID: {bedToDelete.uhid || "-"}) is currently occupying this bed.
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.775rem' }}>
                  Please vacate, discharge, or transfer the patient before deleting this bed from the ward.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>
                  Are you sure you want to delete <strong>Bed {bedToDelete.bedNo}</strong> in <strong>{bedToDelete.room}</strong> ({bedToDelete.wardName})?
                </p>
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                  This action will soft-delete the bed and remove it from active floor maps and ward allocations.
                </div>
              </div>
            )}

            <div className="modal-actions-row">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                Cancel
              </button>
              {bedToDelete.status === "occupied" ? (
                <button
                  type="button"
                  className="modal-btn-submit"
                  style={{ background: '#ef4444' }}
                  onClick={() => {
                    handleVacateBed(bedToDelete.id);
                    setShowDeleteConfirmModal(false);
                  }}
                >
                  Vacate / Discharge First
                </button>
              ) : (
                <button
                  type="button"
                  className="modal-btn-submit"
                  style={{ background: '#dc2626' }}
                  disabled={deleteLoading}
                  onClick={handleDeleteBedConfirm}
                >
                  {deleteLoading ? "Deleting..." : "Confirm Delete"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
