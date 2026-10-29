import React, { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import ipdService from "../../api/services/ipdService";
import patientService from "../../api/services/patientService";
import staffService from "../../api/services/staffService";
import "./FloorBedMap.css";

const STATUS_CONFIG = {
  available: {
    label: "Available",
    badgeClass: "status-badge--available",
    dotColor: "#10b981",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    textColor: "#047857",
  },
  occupied: {
    label: "Occupied",
    badgeClass: "status-badge--occupied",
    dotColor: "#ef4444",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    textColor: "#b91c1c",
  },
  reserved: {
    label: "Reserved",
    badgeClass: "status-badge--reserved",
    dotColor: "#3b82f6",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    textColor: "#1d4ed8",
  },
  cleaning: {
    label: "Cleaning",
    badgeClass: "status-badge--cleaning",
    dotColor: "#06b6d4",
    bgColor: "#ecfeff",
    borderColor: "#a5f3fc",
    textColor: "#0e7490",
  },
  maintenance: {
    label: "Maintenance",
    badgeClass: "status-badge--maintenance",
    dotColor: "#f59e0b",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    textColor: "#b45309",
  },
  blocked: {
    label: "Blocked",
    badgeClass: "status-badge--blocked",
    dotColor: "#64748b",
    bgColor: "#f1f5f9",
    borderColor: "#cbd5e1",
    textColor: "#334155",
  },
};

const normalizeBedStatus = (status) => {
  const norm = String(status || "").trim().toLowerCase();
  return STATUS_CONFIG[norm] ? norm : "available";
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? age : null;
};

export default function FloorBedMap() {
  // Master data
  const [bedsData, setBedsData] = useState([]);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Views
  const [activeFloor, setActiveFloor] = useState("All Floors");
  const [selectedWardFilter, setSelectedWardFilter] = useState("All Wards");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("blueprint"); // "blueprint" | "matrix" | "table"

  // Bed details & command modal
  const [activeBed, setActiveBed] = useState(null);
  const [bedModalTab, setBedModalTab] = useState("overview"); // "overview" | "allot" | "transfer" | "edit"

  // Quick Action Modals
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [addAssetTab, setAddAssetTab] = useState("bed"); // "bed" | "room" | "ward"
  const [assetSubmitting, setAssetSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Ward & Room deletion state
  const [wardToDelete, setWardToDelete] = useState(null);
  const [showDeleteWardConfirm, setShowDeleteWardConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [showDeleteRoomConfirm, setShowDeleteRoomConfirm] = useState(false);

  // Custom Input Toggles & Fields for Add Bed
  const [isCustomFloor, setIsCustomFloor] = useState(false);
  const [customFloorInput, setCustomFloorInput] = useState("");
  const [isCustomWard, setIsCustomWard] = useState(false);
  const [customWardForm, setCustomWardForm] = useState({
    code: "",
    name: "",
    ward_type: "general",
    gender_policy: "any",
  });
  const [isCustomWardType, setIsCustomWardType] = useState(false);
  const [customWardTypeInput, setCustomWardTypeInput] = useState("");
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [customRoomNo, setCustomRoomNo] = useState("");
  const [customRoomType, setCustomRoomType] = useState("general");
  const [isCustomRoomType, setIsCustomRoomType] = useState(false);
  const [customRoomTypeInput, setCustomRoomTypeInput] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [customAmenitiesList, setCustomAmenitiesList] = useState([]);

  // Custom Input Toggles & Fields for Add Room
  const [isRoomCustomWard, setIsRoomCustomWard] = useState(false);
  const [roomCustomWardForm, setRoomCustomWardForm] = useState({
    code: "",
    name: "",
    ward_type: "general",
    floor: "Ground Floor",
  });
  const [isRoomCustomFloor, setIsRoomCustomFloor] = useState(false);
  const [roomCustomFloorInput, setRoomCustomFloorInput] = useState("");
  const [isRoomCustomType, setIsRoomCustomType] = useState(false);
  const [roomCustomTypeInput, setRoomCustomTypeInput] = useState("");

  // Custom Input Toggles & Fields for Add Ward
  const [isWardCustomFloor, setIsWardCustomFloor] = useState(false);
  const [wardCustomFloorInput, setWardCustomFloorInput] = useState("");
  const [isWardCustomType, setIsWardCustomType] = useState(false);
  const [wardCustomTypeInput, setWardCustomTypeInput] = useState("");
  const [isWardCustomGender, setIsWardCustomGender] = useState(false);
  const [wardCustomGenderInput, setWardCustomGenderInput] = useState("");
  const [isWardCustomCategory, setIsWardCustomCategory] = useState(false);
  const [wardCustomCategoryInput, setWardCustomCategoryInput] = useState("");

  // Custom Input Toggles & Fields for Edit Bed Drawer
  const [editBedFloor, setEditBedFloor] = useState("Ground Floor");
  const [isEditCustomFloor, setIsEditCustomFloor] = useState(false);
  const [editCustomFloorInput, setEditCustomFloorInput] = useState("");
  const [isEditCustomCategory, setIsEditCustomCategory] = useState(false);
  const [editCustomCategoryInput, setEditCustomCategoryInput] = useState("");
  const [isEditCustomRoom, setIsEditCustomRoom] = useState(false);
  const [editCustomRoomNo, setEditCustomRoomNo] = useState("");

  // Forms
  const [allotForm, setAllotForm] = useState({
    patient_id: "",
    admitting_practitioner_id: "",
    admission_type: "elective",
    reason_for_admission: "",
  });

  const [transferForm, setTransferForm] = useState({
    toBedId: "",
    transferReason: "",
  });

  const [editBedForm, setEditBedForm] = useState({
    id: "",
    bed_no: "",
    ward_id: "",
    room_id: "",
    room_no: "",
    room_type: "general",
    bed_category_id: "",
    status: "available",
    features: {
      oxygen: false,
      monitor: false,
      ventilator: false,
      motorized: false,
      emergency_call_bell: false,
      iv_pole: false,
      suction: false,
    },
    is_active: true,
  });

  const [addBedForm, setAddBedForm] = useState({
    floor: "Ground Floor",
    ward_id: "",
    room_id: "",
    room_no: "",
    room_type: "general",
    bed_category_id: "",
    bed_no: "",
    status: "available",
    features: {
      oxygen: false,
      monitor: false,
      ventilator: false,
      motorized: false,
      emergency_call_bell: false,
      iv_pole: false,
      suction: false,
      dialysis_port: false,
      ac: false,
      tv: false,
    },
  });

  const [addRoomForm, setAddRoomForm] = useState({
    ward_id: "",
    room_no: "",
    room_type: "general",
  });

  const [addWardForm, setAddWardForm] = useState({
    code: "",
    name: "",
    ward_type: "general",
    floor: "Ground Floor",
    gender_policy: "any",
    bed_category_id: "",
    initial_room_no: "",
  });

  // Load all master data
  const loadWardMaster = useCallback(async (preserveFloor = null) => {
    try {
      setLoading(true);
      const [bedsRes, wardsRes, roomsRes, catsRes, patientsRes, doctorsRes] = await Promise.all([
        ipdService.getBedMatrix().catch(() => []),
        ipdService.getBedWards().catch(() => []),
        ipdService.getBedRooms().catch(() => []),
        ipdService.getBedCategories().catch(() => []),
        patientService.getAll({ limit: 300 }).catch(() => []),
        staffService.getDoctors().catch(() => []),
      ]);

      const rawBeds = Array.isArray(bedsRes) ? bedsRes : bedsRes?.data || [];
      const rawWards = Array.isArray(wardsRes) ? wardsRes : wardsRes?.data || [];
      const rawRooms = Array.isArray(roomsRes) ? roomsRes : roomsRes?.data || [];
      const rawCats = Array.isArray(catsRes) ? catsRes : catsRes?.data || [];
      const rawPatients = Array.isArray(patientsRes)
        ? patientsRes
        : patientsRes?.data || [];
      const rawDoctors = Array.isArray(doctorsRes)
        ? doctorsRes
        : doctorsRes?.data || [];

      setBedsData(rawBeds);
      setWards(rawWards);
      setRooms(rawRooms);
      setCategoriesList(rawCats);
      setPatientsList(rawPatients);
      setDoctorsList(rawDoctors);

      if (preserveFloor) {
        setActiveFloor(preserveFloor);
      }
    } catch (err) {
      console.error("Failed to load floor map data:", err);
      toast.error("Could not load latest ward & bed status");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWardMaster();
  }, [loadWardMaster]);

  // Normalize bed view shape
  const bedsView = useMemo(() => {
    const wardMap = new Map(wards.map((w) => [w.id, w]));
    return bedsData.map((b) => {
      const parentWard = wardMap.get(b.ward_id) || {};
      const resolvedFloor = parentWard.floor || b.floor || "Ground Floor";
      const resolvedWardName = b.ward_name || parentWard.name || "General Ward";
      const resolvedRoomName = b.room_name || b.room_no || "Room 101";
      const pName = b.patient_first_name || b.patient_last_name
        ? `${b.patient_first_name || ""} ${b.patient_last_name || ""}`.trim()
        : null;
      const statusKey = normalizeBedStatus(b.current_status || b.status);

      return {
        id: b.id,
        bedNo: b.bed_no || "-",
        floor: resolvedFloor,
        wardId: b.ward_id || parentWard.id,
        wardName: resolvedWardName,
        wardType: b.ward_type || parentWard.ward_type || "general",
        roomId: b.room_id,
        roomName: resolvedRoomName,
        roomType: b.room_type || "general",
        bedCategoryId: b.bed_category_id || parentWard.bed_category_id,
        categoryName: b.category_name || parentWard.bed_category_name || "Standard",
        bedChargeRate: b.bed_charge_rate || 0,
        status: statusKey,
        features: typeof b.features === "object" && b.features !== null ? b.features : {},
        isActive: b.is_active !== undefined ? b.is_active : true,
        patientName: pName,
        uhid: b.patient_uhid || null,
        patientId: b.patient_id || null,
        gender: b.gender || null,
        age: calculateAge(b.date_of_birth),
        admissionId: b.admission_id || null,
        admittedAt: b.admitted_at ? new Date(b.admitted_at).toLocaleDateString("en-GB") : null,
        doctorName: b.doctor_first_name || b.doctor_last_name
          ? `Dr. ${b.doctor_first_name || ""} ${b.doctor_last_name || ""}`.trim()
          : null,
        rawBed: b,
      };
    });
  }, [bedsData, wards]);

  // Distinct Floors List with live counts
  const floorsList = useMemo(() => {
    const counts = new Map();
    counts.set("All Floors", bedsView.length);

    bedsView.forEach((b) => {
      const f = b.floor || "Ground Floor";
      counts.set(f, (counts.get(f) || 0) + 1);
    });

    // Also include wards with assigned floors even if 0 beds
    wards.forEach((w) => {
      const f = w.floor || "Ground Floor";
      if (!counts.has(f)) counts.set(f, 0);
    });

    const list = Array.from(counts.entries()).map(([name, count]) => ({
      name,
      count,
    }));

    return list.sort((a, b) => {
      if (a.name === "All Floors") return -1;
      if (b.name === "All Floors") return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  }, [bedsView, wards]);

  // Distinct Floor Options dynamically fetched from live data + presets for form dropdowns
  const availableFloors = useMemo(() => {
    const floorSet = new Set(["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor"]);
    wards.forEach((w) => {
      if (w.floor && w.floor.trim()) floorSet.add(w.floor.trim());
    });
    bedsData.forEach((b) => {
      if (b.floor && b.floor.trim()) floorSet.add(b.floor.trim());
    });
    return Array.from(floorSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [wards, bedsData]);

  // Distinct Room Types dynamically fetched from live data + standard presets
  const availableRoomTypes = useMemo(() => {
    const typeSet = new Set([
      "general",
      "semi_private",
      "private",
      "icu",
      "isolation",
      "emergency",
      "daycare",
    ]);
    rooms.forEach((r) => {
      if (r.room_type && r.room_type.trim()) typeSet.add(r.room_type.trim().toLowerCase());
    });
    return Array.from(typeSet);
  }, [rooms]);

  // Distinct Ward Types dynamically fetched from live data + standard presets
  const availableWardTypes = useMemo(() => {
    const typeSet = new Set([
      "general",
      "semi_private",
      "private",
      "icu",
      "nicu",
      "picu",
      "hdu",
      "isolation",
      "emergency",
      "maternity",
      "daycare",
      "other",
    ]);
    wards.forEach((w) => {
      if (w.ward_type && w.ward_type.trim()) typeSet.add(w.ward_type.trim().toLowerCase());
    });
    return Array.from(typeSet);
  }, [wards]);

  // Overall & Scoped Stats
  const overallStats = useMemo(() => {
    const total = bedsView.length;
    const occupied = bedsView.filter((b) => b.status === "occupied").length;
    const available = bedsView.filter((b) => b.status === "available").length;
    const reserved = bedsView.filter((b) => b.status === "reserved").length;
    const cleaning = bedsView.filter((b) => b.status === "cleaning").length;
    const maintenance = bedsView.filter((b) => b.status === "maintenance").length;
    const blocked = bedsView.filter((b) => b.status === "blocked").length;
    const pct = (n) => (total > 0 ? Number(((n / total) * 100).toFixed(1)) : 0);

    return {
      total,
      occupied,
      occupiedPct: pct(occupied),
      available,
      availablePct: pct(available),
      reserved,
      reservedPct: pct(reserved),
      cleaning,
      cleaningPct: pct(cleaning),
      maintenance,
      maintenancePct: pct(maintenance),
      blocked,
      blockedPct: pct(blocked),
    };
  }, [bedsView]);

  // Ward Filter Options for Current Floor
  const wardOptions = useMemo(() => {
    const set = new Set();
    bedsView.forEach((b) => {
      if (activeFloor === "All Floors" || b.floor === activeFloor) {
        if (b.wardName) set.add(b.wardName);
      }
    });
    return ["All Wards", ...Array.from(set).sort()];
  }, [bedsView, activeFloor]);

  // Filtered beds based on Floor, Ward, Status & Search
  const filteredBeds = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return bedsView.filter((b) => {
      const matchFloor = activeFloor === "All Floors" || b.floor === activeFloor;
      const matchWard = selectedWardFilter === "All Wards" || b.wardName === selectedWardFilter;
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const matchSearch =
        !query ||
        b.bedNo.toLowerCase().includes(query) ||
        b.roomName.toLowerCase().includes(query) ||
        b.wardName.toLowerCase().includes(query) ||
        (b.patientName && b.patientName.toLowerCase().includes(query)) ||
        (b.uhid && b.uhid.toLowerCase().includes(query)) ||
        (b.doctorName && b.doctorName.toLowerCase().includes(query));

      return matchFloor && matchWard && matchStatus && matchSearch;
    });
  }, [bedsView, activeFloor, selectedWardFilter, statusFilter, searchTerm]);

  // Group filtered beds into Room Units for the Blueprint & Matrix
  const groupedRooms = useMemo(() => {
    const roomMap = new Map();

    filteredBeds.forEach((bed) => {
      const key = `${bed.floor}::${bed.wardName}::${bed.roomName}`;
      if (!roomMap.has(key)) {
        roomMap.set(key, {
          key,
          floor: bed.floor,
          wardName: bed.wardName,
          wardId: bed.wardId,
          roomName: bed.roomName,
          roomId: bed.roomId,
          roomType: bed.roomType,
          beds: [],
        });
      }
      roomMap.get(key).beds.push(bed);
    });

    const roomsList = Array.from(roomMap.values());
    roomsList.forEach((r) => {
      r.beds.sort((a, b) =>
        a.bedNo.localeCompare(b.bedNo, undefined, { numeric: true })
      );
      r.occupiedCount = r.beds.filter((b) => b.status === "occupied").length;
      r.totalCount = r.beds.length;
      r.occupancyRate = r.totalCount > 0 ? Math.round((r.occupiedCount / r.totalCount) * 100) : 0;
    });

    return roomsList.sort((a, b) => {
      if (a.floor !== b.floor) return a.floor.localeCompare(b.floor);
      if (a.wardName !== b.wardName) return a.wardName.localeCompare(b.wardName);
      return a.roomName.localeCompare(b.roomName, undefined, { numeric: true });
    });
  }, [filteredBeds]);

  // Group wards with their rooms and beds for modular floor map rendering
  const groupedWards = useMemo(() => {
    const wardMap = new Map();

    // 1. Initialize wards matching floor and ward filters
    wards.forEach((w) => {
      const wFloor = w.floor || "Ground Floor";
      const matchFloor = activeFloor === "All Floors" || wFloor === activeFloor;
      const matchWardFilter = selectedWardFilter === "All Wards" || w.name === selectedWardFilter;
      if (matchFloor && matchWardFilter) {
        wardMap.set(w.id, {
          id: w.id,
          code: w.code,
          name: w.name,
          floor: wFloor,
          ward_type: w.ward_type,
          gender_policy: w.gender_policy,
          rooms: new Map(),
        });
      }
    });

    // 2. Put filtered beds into appropriate ward and room
    filteredBeds.forEach((bed) => {
      let w = wardMap.get(bed.wardId);
      if (!w) {
        w = {
          id: bed.wardId,
          code: bed.wardName,
          name: bed.wardName,
          floor: bed.floor,
          ward_type: bed.wardType,
          gender_policy: "any",
          rooms: new Map(),
        };
        wardMap.set(bed.wardId, w);
      }

      const rKey = bed.roomId || bed.roomName;
      if (!w.rooms.has(rKey)) {
        w.rooms.set(rKey, {
          id: bed.roomId,
          roomName: bed.roomName,
          roomType: bed.roomType,
          wardId: bed.wardId,
          wardName: bed.wardName,
          floor: bed.floor,
          beds: [],
        });
      }
      w.rooms.get(rKey).beds.push(bed);
    });

    // 3. Include rooms that currently have 0 beds (e.g. newly created rooms)
    rooms.forEach((rm) => {
      const w = wardMap.get(rm.ward_id);
      if (w && !w.rooms.has(rm.id)) {
        const query = searchTerm.trim().toLowerCase();
        if (!query || rm.room_no.toLowerCase().includes(query) || w.name.toLowerCase().includes(query)) {
          w.rooms.set(rm.id, {
            id: rm.id,
            roomName: rm.room_no,
            roomType: rm.room_type || "general",
            wardId: w.id,
            wardName: w.name,
            floor: w.floor,
            beds: [],
          });
        }
      }
    });

    const result = Array.from(wardMap.values()).map((w) => {
      const roomList = Array.from(w.rooms.values()).map((rm) => {
        rm.beds.sort((a, b) => a.bedNo.localeCompare(b.bedNo, undefined, { numeric: true }));
        rm.occupiedCount = rm.beds.filter((b) => b.status === "occupied").length;
        rm.totalCount = rm.beds.length;
        rm.occupancyRate = rm.totalCount > 0 ? Math.round((rm.occupiedCount / rm.totalCount) * 100) : 0;
        return rm;
      });

      roomList.sort((a, b) => a.roomName.localeCompare(b.roomName, undefined, { numeric: true }));
      const totalBedsInWard = roomList.reduce((acc, r) => acc + r.totalCount, 0);
      const occupiedBedsInWard = roomList.reduce((acc, r) => acc + r.occupiedCount, 0);

      return {
        ...w,
        roomsList: roomList,
        totalBeds: totalBedsInWard,
        occupiedBeds: occupiedBedsInWard,
        occupancyRate: totalBedsInWard > 0 ? Math.round((occupiedBedsInWard / totalBedsInWard) * 100) : 0,
      };
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [wards, rooms, filteredBeds, activeFloor, selectedWardFilter, searchTerm]);

  // SVG Donut Calculations (Circumference C = 2 * PI * r = 2 * PI * 38 = 238.761)
  const donutGeometry = useMemo(() => {
    const r = 38;
    const c = 2 * Math.PI * r;
    const total = overallStats.total || 1;

    const occLen = (overallStats.occupied / total) * c;
    const availLen = (overallStats.available / total) * c;
    const resLen = (overallStats.reserved / total) * c;
    const cleanLen = (overallStats.cleaning / total) * c;
    const maintLen = (overallStats.maintenance / total) * c;

    return {
      c,
      occLen,
      availLen,
      resLen,
      cleanLen,
      maintLen,
    };
  }, [overallStats]);

  // Open Bed Command Drawer / Modal
  const handleOpenBedDetails = (bed) => {
    setActiveBed(bed);
    setBedModalTab("overview");
    setAllotForm({
      patient_id: "",
      admitting_practitioner_id: "",
      admission_type: "elective",
      reason_for_admission: "",
    });
    setTransferForm({
      toBedId: "",
      transferReason: "",
    });
    setEditBedForm({
      id: bed.id,
      bed_no: bed.bedNo,
      ward_id: bed.wardId || "",
      room_id: bed.roomId || "",
      room_no: bed.roomName,
      room_type: bed.roomType || "general",
      bed_category_id: bed.bedCategoryId || "",
      status: bed.status,
      features: { ...bed.features },
      is_active: bed.isActive,
    });
    setEditBedFloor(bed.floor || "Ground Floor");
    setIsEditCustomFloor(false);
    setEditCustomFloorInput("");
    setIsEditCustomCategory(false);
    setEditCustomCategoryInput("");
    setIsEditCustomRoom(false);
    setEditCustomRoomNo("");
  };

  // 1. Direct Status Update API
  const handleUpdateBedStatus = async (bedId, newStatus) => {
    try {
      setActionLoading(true);
      await ipdService.updateBedStatus(bedId, newStatus);
      toast.success(`Bed marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      await loadWardMaster();
      if (activeBed && activeBed.id === bedId) {
        setActiveBed((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to update bed status");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Real Allotment API (POST /ipd/admissions)
  const handleAllotSubmit = async (e) => {
    e.preventDefault();
    if (!activeBed) return;
    if (!allotForm.patient_id) {
      toast.error("Please select a registered patient");
      return;
    }

    try {
      setActionLoading(true);
      await ipdService.admitPatient({
        facility_id: "00000000-0000-0000-0000-000000000000",
        patient_id: allotForm.patient_id,
        bed_id: activeBed.id,
        admitting_practitioner_id: allotForm.admitting_practitioner_id || null,
        admission_type: allotForm.admission_type || "elective",
        reason_for_admission: allotForm.reason_for_admission || "Admitted from Ward Floor Map",
      });

      toast.success(`Bed ${activeBed.bedNo} allotted successfully!`, { icon: "🛏️" });
      setActiveBed(null);
      await loadWardMaster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to admit patient");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Real Bed Transfer API (POST /beds/transfer)
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!activeBed || !transferForm.toBedId) {
      toast.error("Please select a target vacant bed");
      return;
    }

    try {
      setActionLoading(true);
      await ipdService.transferBed({
        fromBedId: activeBed.id,
        toBedId: transferForm.toBedId,
        admission_id: activeBed.admissionId || undefined,
      });

      toast.success(`Patient transferred successfully!`, { icon: "🔄" });
      setActiveBed(null);
      await loadWardMaster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Bed transfer failed");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Real Vacate / Discharge API
  const handleVacateBed = async (bed) => {
    if (!bed) return;
    try {
      setActionLoading(true);
      if (bed.admissionId) {
        await ipdService.dischargePatient(bed.admissionId, {
          discharge_type: "normal",
          discharge_condition: "Stable - Discharged via Ward Management",
        });
      }
      await ipdService.updateBedStatus(bed.id, "cleaning");
      toast.success(`Bed ${bed.bedNo} vacated and marked for Cleaning!`, { icon: "🧹" });
      setActiveBed(null);
      await loadWardMaster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to vacate bed");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Real Edit Bed API (PUT /beds/:id)
  const handleEditBedSubmit = async (e) => {
    e.preventDefault();
    if (!editBedForm.id || !editBedForm.bed_no.trim()) {
      toast.error("Bed number is required");
      return;
    }

    const finalFloor = isEditCustomFloor
      ? editCustomFloorInput.trim()
      : (editBedFloor || "Ground Floor");

    let finalRoomNo = editBedForm.room_no;
    let finalRoomId = editBedForm.room_id;
    if (isEditCustomRoom) {
      if (!editCustomRoomNo.trim()) {
        toast.error("Please enter room number");
        return;
      }
      finalRoomNo = editCustomRoomNo.trim();
      finalRoomId = null;
    }

    try {
      setActionLoading(true);
      const selectedCategory = categoriesList.find((c) => c.id === editBedForm.bed_category_id);
      await ipdService.updateBed(editBedForm.id, {
        bed_no: editBedForm.bed_no.trim(),
        floor: finalFloor,
        ward_id: editBedForm.ward_id || undefined,
        room_id: finalRoomId,
        room_no: finalRoomNo || undefined,
        room_type: editBedForm.room_type || "general",
        bed_category_id: isEditCustomCategory ? null : (editBedForm.bed_category_id || null),
        custom_bed_category: isEditCustomCategory ? editCustomCategoryInput.trim() : undefined,
        bed_charge_service_id: selectedCategory?.bed_charge_service_id || undefined,
        status: editBedForm.status,
        features: editBedForm.features,
        is_active: editBedForm.is_active,
      });

      toast.success(`Bed ${editBedForm.bed_no} updated successfully!`);
      setActiveBed(null);
      await loadWardMaster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to update bed");
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Delete Bed API (DELETE /beds/:id)
  const handleDeleteBedConfirm = async () => {
    if (!activeBed) return;
    if (activeBed.status === "occupied") {
      toast.error("Cannot delete an occupied bed. Discharge or transfer patient first.");
      return;
    }

    try {
      setActionLoading(true);
      await ipdService.deleteBed(activeBed.id);
      toast.success(`Bed ${activeBed.bedNo} deleted!`, { icon: "🗑️" });
      setShowDeleteConfirm(false);
      setActiveBed(null);
      await loadWardMaster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to delete bed");
    } finally {
      setActionLoading(false);
    }
  };

  // 6b. Delete Ward API (DELETE /beds/wards/:id)
  const handleDeleteWardConfirm = async () => {
    if (!wardToDelete) return;
    try {
      setActionLoading(true);
      await ipdService.deleteWard(wardToDelete.id);
      toast.success(`Ward "${wardToDelete.name}" and its spaces removed!`, { icon: "🗑️" });
      setShowDeleteWardConfirm(false);
      setWardToDelete(null);
      await loadWardMaster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to delete ward");
    } finally {
      setActionLoading(false);
    }
  };

  // 6c. Delete Room API (DELETE /beds/rooms/:id)
  const handleDeleteRoomConfirm = async () => {
    if (!roomToDelete) return;
    try {
      setActionLoading(true);
      await ipdService.deleteRoom(roomToDelete.id);
      toast.success(`Room "${roomToDelete.roomName || roomToDelete.room_no}" removed!`, { icon: "🗑️" });
      setShowDeleteRoomConfirm(false);
      setRoomToDelete(null);
      await loadWardMaster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to delete room");
    } finally {
      setActionLoading(false);
    }
  };

  // 6d. Quick triggers to add in context
  const handleQuickAddWard = (floorName) => {
    setAddAssetTab("ward");
    setIsWardCustomFloor(false);
    setIsWardCustomType(false);
    setIsWardCustomGender(false);
    setIsWardCustomCategory(false);
    setWardCustomFloorInput("");
    setWardCustomTypeInput("");
    setWardCustomGenderInput("");
    setWardCustomCategoryInput("");
    setAddWardForm({
      code: "",
      name: "",
      ward_type: "general",
      floor: floorName && floorName !== "All Floors" ? floorName : "Ground Floor",
      gender_policy: "any",
      bed_category_id: "",
      initial_room_no: "",
    });
    setShowAddAssetModal(true);
  };

  const handleQuickAddRoom = (ward) => {
    setAddAssetTab("room");
    setIsRoomCustomWard(false);
    setIsRoomCustomFloor(false);
    setIsRoomCustomType(false);
    setRoomCustomFloorInput("");
    setRoomCustomTypeInput("");
    setAddRoomForm({
      ward_id: ward?.id || "",
      room_no: "",
      room_type: ward?.ward_type || "general",
    });
    setShowAddAssetModal(true);
  };

  const handleQuickAddBed = (room) => {
    setAddAssetTab("bed");
    setIsCustomWard(false);
    setIsCustomRoom(false);
    setIsCustomFloor(false);
    setIsCustomCategory(false);
    setAddBedForm({
      floor: room.floor || "Ground Floor",
      ward_id: room.wardId || "",
      room_id: room.id || "",
      room_no: room.roomName || "",
      room_type: room.roomType || "general",
      bed_category_id: "",
      bed_no: "",
      status: "available",
      features: {
        oxygen: false,
        monitor: false,
        ventilator: false,
        motorized: false,
        emergency_call_bell: false,
        iv_pole: false,
        suction: false,
        dialysis_port: false,
        ac: false,
        tv: false,
      },
    });
    setShowAddAssetModal(true);
  };

  const handleAddCustomAmenity = () => {
    const val = customAmenityInput.trim();
    if (!val) return;
    if (!customAmenitiesList.includes(val)) {
      setCustomAmenitiesList([...customAmenitiesList, val]);
    }
    setCustomAmenityInput("");
  };

  const handleRemoveCustomAmenity = (amenity) => {
    setCustomAmenitiesList(customAmenitiesList.filter((a) => a !== amenity));
  };

  // 7. Add Asset Handlers (Add Bed / Room / Ward with Custom Options)
  const handleAddBedSubmit = async (e) => {
    e.preventDefault();
    if (!addBedForm.bed_no.trim()) {
      toast.error("Bed number is required");
      return;
    }

    const finalFloor = isCustomFloor ? customFloorInput.trim() : (addBedForm.floor || "Ground Floor");
    if (isCustomFloor && !finalFloor) {
      toast.error("Please enter a custom floor name");
      return;
    }

    let finalWardId = addBedForm.ward_id;
    let customWardCode = "";
    let customWardName = "";
    let customWardType = "general";
    let customGenderPolicy = "any";

    if (isCustomWard) {
      if (!customWardForm.code.trim() || !customWardForm.name.trim()) {
        toast.error("Please enter both Ward Code and Ward Name");
        return;
      }
      customWardCode = customWardForm.code.trim().toUpperCase();
      customWardName = customWardForm.name.trim();
      customWardType = customWardForm.ward_type || "general";
      customGenderPolicy = customWardForm.gender_policy || "any";
    } else if (!finalWardId) {
      toast.error("Please select a ward");
      return;
    }

    const selWard = wards.find((w) => w.id === finalWardId);

    // Resolve room
    let finalRoomId = null;
    let finalRoomNo = "";
    let finalRoomType = "general";

    if (isCustomRoom) {
      if (!customRoomNo.trim()) {
        toast.error("Please enter custom room number");
        return;
      }
      finalRoomNo = customRoomNo.trim();
      finalRoomType = customRoomType;
    } else {
      if (addBedForm.room_id) {
        finalRoomId = addBedForm.room_id;
        const selRoom = rooms.find((r) => r.id === finalRoomId);
        finalRoomNo = selRoom?.room_no || "";
        finalRoomType = selRoom?.room_type || "general";
      } else if (addBedForm.room_no?.trim()) {
        finalRoomNo = addBedForm.room_no.trim();
        finalRoomType = addBedForm.room_type || "general";
      }
    }

    // Resolve category
    let finalCategoryId = isCustomCategory ? null : (addBedForm.bed_category_id || selWard?.bed_category_id || null);
    let customCategory = isCustomCategory ? customCategoryInput.trim() : "";
    const selCat = categoriesList.find((c) => c.id === finalCategoryId);

    // Bundle features (standard + dynamic custom amenities tags)
    const bundledFeatures = {
      ...(addBedForm.features || {}),
    };
    customAmenitiesList.forEach((amenity) => {
      const key = amenity.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (key) bundledFeatures[key] = true;
    });

    try {
      setAssetSubmitting(true);
      await ipdService.addBed({
        facility_id: "00000000-0000-0000-0000-000000000000",
        ward_id: isCustomWard ? undefined : finalWardId,
        ward_code: isCustomWard ? customWardCode : undefined,
        ward_name: isCustomWard ? customWardName : undefined,
        ward_type: isCustomWard ? customWardType : (selWard?.ward_type || "general"),
        gender_policy: isCustomWard ? customGenderPolicy : (selWard?.gender_policy || "any"),
        floor: finalFloor,
        room_id: finalRoomId,
        room_no: finalRoomNo || undefined,
        room_type: finalRoomType,
        bed_no: addBedForm.bed_no.trim(),
        bed_category_id: finalCategoryId,
        custom_bed_category: customCategory || undefined,
        bed_charge_service_id: selCat?.bed_charge_service_id || undefined,
        status: addBedForm.status || "available",
        features: bundledFeatures,
      });

      toast.success(`Bed ${addBedForm.bed_no.trim()} created!`, { icon: "🛏️" });
      setShowAddAssetModal(false);

      // Reset custom field states
      setIsCustomFloor(false);
      setCustomFloorInput("");
      setIsCustomWard(false);
      setCustomWardForm({ code: "", name: "", ward_type: "general", gender_policy: "any" });
      setIsCustomRoom(false);
      setCustomRoomNo("");
      setCustomRoomType("general");
      setIsCustomCategory(false);
      setCustomCategoryInput("");
      setCustomAmenitiesList([]);
      setCustomAmenityInput("");

      await loadWardMaster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to create bed");
    } finally {
      setAssetSubmitting(false);
    }
  };

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    if (!addRoomForm.room_no.trim()) {
      toast.error("Please enter room number / name");
      return;
    }

    let finalWardId = addRoomForm.ward_id;
    let customWardCode = "";
    let customWardName = "";
    let customWardType = "general";

    if (isRoomCustomWard) {
      if (!roomCustomWardForm.code.trim() || !roomCustomWardForm.name.trim()) {
        toast.error("Please enter both Ward Code and Ward Name");
        return;
      }
      customWardCode = roomCustomWardForm.code.trim().toUpperCase();
      customWardName = roomCustomWardForm.name.trim();
      customWardType = isRoomCustomType
        ? (roomCustomTypeInput.trim() || "general")
        : (roomCustomWardForm.ward_type || "general");
    } else if (!finalWardId) {
      toast.error("Please select a ward");
      return;
    }

    const selWard = wards.find((w) => w.id === finalWardId);
    const finalRoomFloor = isRoomCustomFloor
      ? roomCustomFloorInput.trim()
      : (isRoomCustomWard ? roomCustomWardForm.floor : (selWard?.floor || "Ground Floor"));

    const finalRoomType = isRoomCustomType
      ? (roomCustomTypeInput.trim() || "general")
      : (addRoomForm.room_type || "general");

    try {
      setAssetSubmitting(true);
      await ipdService.createRoom({
        ward_id: isRoomCustomWard ? undefined : finalWardId,
        ward_code: isRoomCustomWard ? customWardCode : undefined,
        ward_name: isRoomCustomWard ? customWardName : undefined,
        ward_type: isRoomCustomWard ? customWardType : (selWard?.ward_type || "general"),
        floor: finalRoomFloor,
        room_no: addRoomForm.room_no.trim(),
        room_type: finalRoomType,
      });

      toast.success(`Room ${addRoomForm.room_no.trim()} added!`, { icon: "🚪" });
      setShowAddAssetModal(false);

      // Reset room custom states
      setIsRoomCustomWard(false);
      setRoomCustomWardForm({ code: "", name: "", ward_type: "general", floor: "Ground Floor" });
      setIsRoomCustomFloor(false);
      setRoomCustomFloorInput("");
      setIsRoomCustomType(false);
      setRoomCustomTypeInput("");

      await loadWardMaster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to create room");
    } finally {
      setAssetSubmitting(false);
    }
  };

  const handleAddWardSubmit = async (e) => {
    e.preventDefault();
    if (!addWardForm.code.trim() || !addWardForm.name.trim()) {
      toast.error("Ward Code and Ward Name are required");
      return;
    }

    const finalWardFloor = isWardCustomFloor
      ? wardCustomFloorInput.trim()
      : (addWardForm.floor || "Ground Floor");

    if (isWardCustomFloor && !finalWardFloor) {
      toast.error("Please enter a custom floor name");
      return;
    }

    const finalWardType = isWardCustomType
      ? (wardCustomTypeInput.trim() || "general")
      : (addWardForm.ward_type || "general");

    const finalGenderPolicy = isWardCustomGender
      ? (wardCustomGenderInput.trim() || "any")
      : (addWardForm.gender_policy || "any");

    const finalCategoryId = isWardCustomCategory
      ? null
      : (addWardForm.bed_category_id || null);

    const customCategory = isWardCustomCategory
      ? wardCustomCategoryInput.trim()
      : "";

    try {
      setAssetSubmitting(true);
      const createdWard = await ipdService.createWard({
        facility_id: "00000000-0000-0000-0000-000000000000",
        code: addWardForm.code.trim().toUpperCase(),
        name: addWardForm.name.trim(),
        ward_type: finalWardType,
        gender_policy: finalGenderPolicy,
        floor: finalWardFloor,
        bed_category_id: finalCategoryId,
        custom_bed_category: customCategory || undefined,
      });

      if (addWardForm.initial_room_no?.trim() && createdWard?.id) {
        await ipdService.createRoom({
          ward_id: createdWard.id,
          room_no: addWardForm.initial_room_no.trim(),
          room_type: finalWardType,
        });
      }

      toast.success(`Ward "${addWardForm.name}" created on ${finalWardFloor}!`, { icon: "🏥" });
      setShowAddAssetModal(false);

      // Reset ward custom states
      setIsWardCustomFloor(false);
      setWardCustomFloorInput("");
      setIsWardCustomType(false);
      setWardCustomTypeInput("");
      setIsWardCustomGender(false);
      setWardCustomGenderInput("");
      setIsWardCustomCategory(false);
      setWardCustomCategoryInput("");

      await loadWardMaster();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to create ward");
    } finally {
      setAssetSubmitting(false);
    }
  };

  return (
    <div className="floor-command-page">
      {/* 1. Header Toolbar */}
      <header className="fcp-header">
        <div className="fcp-header__left">
          <div className="fcp-header__badge-icon">
            <Icon name="LuHospital" size={24} />
          </div>
          <div>
            <div className="fcp-header__title-row">
              <h1 className="fcp-header__title">Floor & Bed Command Map</h1>
              <span className="fcp-live-indicator">
                <span className="fcp-live-indicator__dot"></span>
                <span>Live Ward Sync</span>
              </span>
            </div>
            <p className="fcp-header__subtitle">
              Interactive architectural blueprints, real-time telemetry, and bed allocation
            </p>
          </div>
        </div>

        <div className="fcp-header__actions">
          <button
            type="button"
            className={`fcp-btn fcp-btn--secondary ${isRefreshing ? "fcp-btn--spinning" : ""}`}
            onClick={() => {
              setIsRefreshing(true);
              loadWardMaster();
            }}
            title="Refresh Real-time Status"
          >
            <Icon name="LuRefreshCw" size={16} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="fcp-btn fcp-btn--primary"
            onClick={() => {
              setAddAssetTab("bed");
              setShowAddAssetModal(true);
            }}
          >
            <Icon name="LuPlus" size={17} />
            <span>Add Facility Asset</span>
          </button>
        </div>
      </header>

      {/* 2. Live Census & Statistics Grid */}
      <section className="fcp-kpi-row">
        <div className="fcp-kpi-card fcp-kpi-card--total">
          <div className="fcp-kpi-card__body">
            <span className="fcp-kpi-card__label">Total Bed Census</span>
            <span className="fcp-kpi-card__value">{overallStats.total}</span>
            <div className="fcp-kpi-progress">
              <div
                className="fcp-kpi-progress__bar fcp-kpi-progress__bar--occupied"
                style={{ width: `${overallStats.occupiedPct}%` }}
                title={`Occupied: ${overallStats.occupiedPct}%`}
              ></div>
              <div
                className="fcp-kpi-progress__bar fcp-kpi-progress__bar--available"
                style={{ width: `${overallStats.availablePct}%` }}
                title={`Available: ${overallStats.availablePct}%`}
              ></div>
            </div>
            <span className="fcp-kpi-card__subtext">
              {overallStats.occupiedPct}% Current Occupancy Rate
            </span>
          </div>
          <div className="fcp-kpi-card__icon">
            <Icon name="LuBedDouble" size={24} />
          </div>
        </div>

        <div
          className={`fcp-kpi-card fcp-kpi-card--available ${statusFilter === "available" ? "fcp-kpi-card--active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "available" ? "all" : "available")}
        >
          <div className="fcp-kpi-card__body">
            <span className="fcp-kpi-card__label">Available Beds</span>
            <span className="fcp-kpi-card__value text-emerald-600">{overallStats.available}</span>
            <span className="fcp-kpi-card__pill bg-emerald-50 text-emerald-700">
              {overallStats.availablePct}% Vacant
            </span>
          </div>
          <div className="fcp-kpi-card__icon bg-emerald-50 text-emerald-600">
            <Icon name="LuBedSingle" size={24} />
          </div>
        </div>

        <div
          className={`fcp-kpi-card fcp-kpi-card--occupied ${statusFilter === "occupied" ? "fcp-kpi-card--active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "occupied" ? "all" : "occupied")}
        >
          <div className="fcp-kpi-card__body">
            <span className="fcp-kpi-card__label">Occupied / Admitted</span>
            <span className="fcp-kpi-card__value text-rose-600">{overallStats.occupied}</span>
            <span className="fcp-kpi-card__pill bg-rose-50 text-rose-700">
              {overallStats.occupiedPct}% Active IPD
            </span>
          </div>
          <div className="fcp-kpi-card__icon bg-rose-50 text-rose-600">
            <Icon name="LuUsers" size={24} />
          </div>
        </div>

        <div
          className={`fcp-kpi-card fcp-kpi-card--reserved ${statusFilter === "reserved" ? "fcp-kpi-card--active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "reserved" ? "all" : "reserved")}
        >
          <div className="fcp-kpi-card__body">
            <span className="fcp-kpi-card__label">Reserved & Intake</span>
            <span className="fcp-kpi-card__value text-blue-600">{overallStats.reserved}</span>
            <span className="fcp-kpi-card__pill bg-blue-50 text-blue-700">
              {overallStats.reservedPct}% Holding
            </span>
          </div>
          <div className="fcp-kpi-card__icon bg-blue-50 text-blue-600">
            <Icon name="LuClock" size={24} />
          </div>
        </div>

        <div
          className={`fcp-kpi-card fcp-kpi-card--maintenance ${statusFilter === "maintenance" ? "fcp-kpi-card--active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "maintenance" ? "all" : "maintenance")}
        >
          <div className="fcp-kpi-card__body">
            <span className="fcp-kpi-card__label">Sanitize & Repair</span>
            <span className="fcp-kpi-card__value text-amber-600">
              {overallStats.cleaning + overallStats.maintenance + overallStats.blocked}
            </span>
            <span className="fcp-kpi-card__pill bg-amber-50 text-amber-700">
              {overallStats.cleaning} Clean | {overallStats.maintenance} Maint
            </span>
          </div>
          <div className="fcp-kpi-card__icon bg-amber-50 text-amber-600">
            <Icon name="LuWrench" size={24} />
          </div>
        </div>
      </section>

      {/* 3. Navigation Floor Tabs & Controls Bar */}
      <section className="fcp-controls-bar">
        {/* Floor selector pill tabs */}
        <div className="fcp-floor-tabs">
          {floorsList.map((fl) => (
            <button
              key={fl.name}
              type="button"
              className={`fcp-floor-tab ${activeFloor === fl.name ? "fcp-floor-tab--active" : ""}`}
              onClick={() => setActiveFloor(fl.name)}
            >
              <Icon name="LuLayers" size={15} />
              <span>{fl.name}</span>
              <span className="fcp-floor-tab__count">{fl.count}</span>
            </button>
          ))}
          <button
            type="button"
            className="fcp-action-btn fcp-action-btn--primary shadow-sm"
            style={{ marginLeft: "4px" }}
            onClick={() => handleQuickAddWard(activeFloor)}
            title="Create a new Ward unit on this floor"
          >
            <Icon name="LuPlus" size={14} />
            <span>Add Ward</span>
          </button>
        </div>

        {/* View Mode Switcher + Ward Filter + Search */}
        <div className="fcp-controls-right">
          <div className="fcp-search-wrap">
            <Icon name="LuSearch" size={16} className="fcp-search-icon" />
            <input
              type="text"
              placeholder="Search Bed, Patient, UHID, Doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="fcp-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="fcp-search-clear"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="fcp-ward-select-wrap">
            <Icon name="LuFilter" size={14} className="fcp-select-icon" />
            <select
              className="fcp-select"
              value={selectedWardFilter}
              onChange={(e) => setSelectedWardFilter(e.target.value)}
            >
              {wardOptions.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="fcp-view-toggle">
            <button
              type="button"
              className={`fcp-view-btn ${viewMode === "blueprint" ? "fcp-view-btn--active" : ""}`}
              onClick={() => setViewMode("blueprint")}
              title="Architectural Floor Blueprint View"
            >
              <Icon name="LuMap" size={16} />
              <span>Blueprint</span>
            </button>
            <button
              type="button"
              className={`fcp-view-btn ${viewMode === "matrix" ? "fcp-view-btn--active" : ""}`}
              onClick={() => setViewMode("matrix")}
              title="Room & Bed Matrix View"
            >
              <Icon name="LuLayoutGrid" size={16} />
              <span>Matrix</span>
            </button>
            <button
              type="button"
              className={`fcp-view-btn ${viewMode === "table" ? "fcp-view-btn--active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Comprehensive Bed Census Table"
            >
              <Icon name="LuTable" size={16} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Main Body: Blueprint / Matrix / Table with Sidebar Analytics */}
      <div className="fcp-layout-split">
        {/* Left/Main Content Area */}
        <div className="fcp-main-stage">
          {loading ? (
            <div className="fcp-loading-state">
              <Icon name="LuRefreshCw" size={32} className="fcp-spinner" />
              <span>Loading Hospital Bed Infrastructure...</span>
            </div>
          ) : filteredBeds.length === 0 ? (
            <div className="fcp-empty-state">
              <div className="fcp-empty-state__icon">
                <Icon name="LuBed" size={40} />
              </div>
              <h3 className="fcp-empty-state__title">No Beds Found Matching Filters</h3>
              <p className="fcp-empty-state__subtitle">
                Try switching floors, selecting "All Wards", or clearing your search term.
              </p>
              <button
                type="button"
                className="fcp-btn fcp-btn--secondary"
                onClick={() => {
                  setActiveFloor("All Floors");
                  setSelectedWardFilter("All Wards");
                  setStatusFilter("all");
                  setSearchTerm("");
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === "blueprint" ? (
            /* ================= VIEW 1: ARCHITECTURAL FLOOR BLUEPRINT ================= */
            <div className="blueprint-schematic-card">
              <div className="blueprint-schematic-header">
                <div className="blueprint-schematic-header__title">
                  <Icon name="LuBuilding" size={18} className="text-blue-600" />
                  <div>
                    <h2 className="blueprint-schematic-title-text">
                      {activeFloor} Architectural Blueprint
                    </h2>
                    <span className="blueprint-schematic-meta">
                      {groupedRooms.length} Ward Rooms • {filteredBeds.length} Active Beds Rendered
                    </span>
                  </div>
                </div>

                <div className="blueprint-legend-pills">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      className={`blueprint-legend-pill ${statusFilter === key ? "blueprint-legend-pill--selected" : ""}`}
                      onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
                    >
                      <span
                        className="blueprint-legend-dot"
                        style={{ backgroundColor: cfg.dotColor }}
                      ></span>
                      <span>{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* The Architectural Canvas */}
              <div className="blueprint-canvas-scroll">
                <div className="blueprint-canvas">
                  {/* Central Hub: Nurse Command Center, Elevators, Medical Supply */}
                  <div className="blueprint-central-hub">
                    <div className="blueprint-hub-item blueprint-hub-item--nurse">
                      <div className="blueprint-hub-icon">
                        <Icon name="LuActivity" size={20} />
                      </div>
                      <div className="blueprint-hub-text">
                        <strong>NURSING COMMAND STATION</strong>
                        <span>Floor Monitoring & Crash Cart Station</span>
                      </div>
                    </div>

                    <div className="blueprint-hub-utilities">
                      <div className="blueprint-util-box">
                        <Icon name="LuArrowRightLeft" size={16} />
                        <span>Elevator Core</span>
                      </div>
                      <div className="blueprint-util-box">
                        <Icon name="LuDoorOpen" size={16} />
                        <span>Emergency Stairwell</span>
                      </div>
                      <div className="blueprint-util-box">
                        <Icon name="LuShieldCheck" size={16} />
                        <span>Pharmacy Stash</span>
                      </div>
                    </div>
                  </div>

                  <div className="blueprint-corridor-label">
                    <span>MAIN WARD CIRCULATION CORRIDOR</span>
                  </div>

                  {/* Wards & Rooms Architectural Bays */}
                  <div className="flex flex-col gap-6 mt-4">
                    {groupedWards.map((ward) => (
                      <div key={ward.id || ward.code} className="fcp-ward-section">
                        <div className="fcp-ward-section__header">
                          <div className="fcp-ward-section__header-left">
                            <div className="fcp-ward-badge-icon">
                              <Icon name="LuBuilding" size={18} />
                            </div>
                            <div>
                              <h3 className="fcp-ward-section__title">
                                <span>{ward.name}</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                                  {ward.ward_type}
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                  {ward.floor}
                                </span>
                              </h3>
                              <div className="fcp-ward-section__meta">
                                <span>Code: {ward.code}</span>
                                <span>•</span>
                                <span>{ward.roomsList.length} Rooms</span>
                                <span>•</span>
                                <span>{ward.occupiedBeds}/{ward.totalBeds} Beds Occupied ({ward.occupancyRate}%)</span>
                              </div>
                            </div>
                          </div>

                          <div className="fcp-ward-section__actions">
                            <button
                              type="button"
                              className="fcp-action-btn fcp-action-btn--primary"
                              onClick={() => handleQuickAddRoom(ward)}
                              title={`Add a new room inside ${ward.name}`}
                            >
                              <Icon name="LuPlus" size={13} />
                              <span>Add Room</span>
                            </button>
                            <button
                              type="button"
                              className="fcp-action-btn fcp-action-btn--ghost-danger"
                              onClick={() => {
                                setWardToDelete(ward);
                                setShowDeleteWardConfirm(true);
                              }}
                              title={`Delete Ward ${ward.name}`}
                            >
                              <Icon name="LuTrash2" size={13} />
                              <span>Delete Ward</span>
                            </button>
                          </div>
                        </div>

                        {ward.roomsList.length === 0 ? (
                          <div className="blueprint-room-bay blueprint-room-bay--empty">
                            <div className="fcp-empty-room-prompt">
                              <Icon name="LuDoorOpen" size={24} />
                              <span>No rooms configured in this ward yet.</span>
                              <button
                                type="button"
                                className="fcp-action-btn fcp-action-btn--secondary"
                                onClick={() => handleQuickAddRoom(ward)}
                              >
                                <Icon name="LuPlus" size={13} />
                                <span>Add First Room</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="blueprint-rooms-grid">
                            {ward.roomsList.map((room) => (
                              <div
                                key={room.id || room.roomName}
                                className={`blueprint-room-bay ${room.beds.length === 0 ? "blueprint-room-bay--empty" : ""}`}
                              >
                                <div className="blueprint-room-bay__header">
                                  <div className="blueprint-room-bay__title-wrap">
                                    <span className="blueprint-room-bay__door-icon">
                                      <Icon name="LuDoorOpen" size={14} />
                                    </span>
                                    <div>
                                      <strong className="blueprint-room-bay__name">
                                        Room {room.roomName}
                                      </strong>
                                      <span className="blueprint-room-bay__ward-badge">
                                        Type: {room.roomType || "general"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`blueprint-occ-tag ${room.occupancyRate >= 100 ? "blueprint-occ-tag--full" : room.occupancyRate > 0 ? "blueprint-occ-tag--partial" : "blueprint-occ-tag--empty"}`}
                                    >
                                      {room.occupiedCount}/{room.totalCount} Beds
                                    </span>
                                    <button
                                      type="button"
                                      className="fcp-action-btn fcp-action-btn--secondary"
                                      style={{ padding: "3px 8px", fontSize: "0.7rem" }}
                                      onClick={() => handleQuickAddBed(room)}
                                      title={`Add a bed to Room ${room.roomName}`}
                                    >
                                      <Icon name="LuPlus" size={12} />
                                      <span>Bed</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="fcp-action-btn fcp-action-btn--ghost-danger"
                                      style={{ padding: "3px 6px" }}
                                      onClick={() => {
                                        setRoomToDelete(room);
                                        setShowDeleteRoomConfirm(true);
                                      }}
                                      title={`Delete Room ${room.roomName}`}
                                    >
                                      <Icon name="LuTrash2" size={12} />
                                    </button>
                                  </div>
                                </div>

                                {room.beds.length === 0 ? (
                                  <div className="fcp-empty-room-prompt">
                                    <span>No beds in this room.</span>
                                    <button
                                      type="button"
                                      className="fcp-action-btn fcp-action-btn--primary"
                                      onClick={() => handleQuickAddBed(room)}
                                    >
                                      <Icon name="LuPlus" size={12} />
                                      <span>Add First Bed</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="blueprint-beds-row">
                                    {room.beds.map((bed) => {
                                      const cfg = STATUS_CONFIG[bed.status] || STATUS_CONFIG.available;
                                      return (
                                        <div
                                          key={bed.id}
                                          className={`blueprint-bed-pod blueprint-bed-pod--${bed.status}`}
                                          onClick={() => handleOpenBedDetails(bed)}
                                          title={`Bed ${bed.bedNo} (${cfg.label}) - Click to manage`}
                                        >
                                          <div className="blueprint-bed-pod__top">
                                            <span
                                              className="blueprint-bed-pod__status-dot"
                                              style={{ backgroundColor: cfg.dotColor }}
                                            ></span>
                                            <span className="blueprint-bed-pod__num">{bed.bedNo}</span>
                                          </div>

                                          <div className="blueprint-bed-pod__center">
                                            <div
                                              className="blueprint-bed-pod__icon-wrap"
                                              style={{ color: cfg.dotColor, backgroundColor: cfg.bgColor }}
                                            >
                                              <Icon name="LuBed" size={20} />
                                            </div>
                                            <div className="blueprint-bed-pod__patient">
                                              {bed.patientName ? (
                                                <span className="blueprint-patient-name" title={bed.patientName}>
                                                  {bed.patientName}
                                                </span>
                                              ) : (
                                                <span className="blueprint-patient-vacant">Vacant</span>
                                              )}
                                              {bed.uhid && (
                                                <span className="blueprint-patient-uhid">{bed.uhid}</span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="blueprint-bed-pod__amenities">
                                            {bed.features?.oxygen && (
                                              <span className="amenity-tag" title="Oxygen Port Available">
                                                O₂
                                              </span>
                                            )}
                                            {bed.features?.monitor && (
                                              <span className="amenity-tag" title="Cardiac Monitor Attached">
                                                ECG
                                              </span>
                                            )}
                                            {bed.features?.ventilator && (
                                              <span className="amenity-tag" title="ICU Ventilator Equipped">
                                                Vent
                                              </span>
                                            )}
                                            {bed.features?.motorized && (
                                              <span className="amenity-tag" title="Motorized Electric Bed">
                                                Mot
                                              </span>
                                            )}
                                            {bed.features?.dialysis_port && (
                                              <span className="amenity-tag" title="Dialysis Port">
                                                Dia
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === "matrix" ? (
            /* ================= VIEW 2: HIGH-DENSITY ROOM MATRIX GRID ================= */
            <div className="fcp-matrix-container">
              {groupedWards.map((ward) => (
                <div key={ward.id || ward.code} className="fcp-ward-section mb-6">
                  <div className="fcp-ward-section__header">
                    <div className="fcp-ward-section__header-left">
                      <div className="fcp-ward-badge-icon">
                        <Icon name="LuBuilding" size={18} />
                      </div>
                      <div>
                        <h3 className="fcp-ward-section__title">
                          <span>{ward.name}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                            {ward.ward_type}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {ward.floor}
                          </span>
                        </h3>
                        <div className="fcp-ward-section__meta">
                          <span>Code: {ward.code}</span>
                          <span>•</span>
                          <span>{ward.roomsList.length} Rooms</span>
                          <span>•</span>
                          <span>{ward.occupiedBeds}/{ward.totalBeds} Beds Occupied ({ward.occupancyRate}%)</span>
                        </div>
                      </div>
                    </div>

                    <div className="fcp-ward-section__actions">
                      <button
                        type="button"
                        className="fcp-action-btn fcp-action-btn--primary"
                        onClick={() => handleQuickAddRoom(ward)}
                        title={`Add a new room inside ${ward.name}`}
                      >
                        <Icon name="LuPlus" size={13} />
                        <span>Add Room</span>
                      </button>
                      <button
                        type="button"
                        className="fcp-action-btn fcp-action-btn--ghost-danger"
                        onClick={() => {
                          setWardToDelete(ward);
                          setShowDeleteWardConfirm(true);
                        }}
                        title={`Delete Ward ${ward.name}`}
                      >
                        <Icon name="LuTrash2" size={13} />
                        <span>Delete Ward</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-2">
                    {ward.roomsList.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
                        No rooms configured in this ward yet. Click "+ Add Room" to create one.
                      </div>
                    ) : (
                      ward.roomsList.map((room) => (
                        <div key={room.id || room.roomName} className="matrix-room-card">
                          <div className="matrix-room-card__header">
                            <div className="matrix-room-card__header-left">
                              <div className="matrix-room-icon">
                                <Icon name="LuDoorOpen" size={18} />
                              </div>
                              <div>
                                <h3 className="matrix-room-title">Room {room.roomName}</h3>
                                <span className="matrix-room-sub">
                                  Type: {room.roomType || "general"}
                                </span>
                              </div>
                            </div>
                            <div className="matrix-room-card__header-right flex items-center gap-3">
                              <div className="matrix-room-meter">
                                <div
                                  className="matrix-room-meter__fill"
                                  style={{ width: `${room.occupancyRate}%` }}
                                ></div>
                              </div>
                              <span className="matrix-room-meter-label">
                                {room.occupiedCount} / {room.totalCount} ({room.occupancyRate}%)
                              </span>
                              <button
                                type="button"
                                className="fcp-action-btn fcp-action-btn--secondary"
                                style={{ padding: "3px 8px", fontSize: "0.725rem" }}
                                onClick={() => handleQuickAddBed(room)}
                                title={`Add bed to Room ${room.roomName}`}
                              >
                                <Icon name="LuPlus" size={12} />
                                <span>Add Bed</span>
                              </button>
                              <button
                                type="button"
                                className="fcp-action-btn fcp-action-btn--ghost-danger"
                                style={{ padding: "3px 6px" }}
                                onClick={() => {
                                  setRoomToDelete(room);
                                  setShowDeleteRoomConfirm(true);
                                }}
                                title={`Delete Room ${room.roomName}`}
                              >
                                <Icon name="LuTrash2" size={13} />
                              </button>
                            </div>
                          </div>

                          {room.beds.length === 0 ? (
                            <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-2">
                              <span>No beds in this room yet.</span>
                              <button
                                type="button"
                                className="fcp-action-btn fcp-action-btn--primary"
                                onClick={() => handleQuickAddBed(room)}
                              >
                                <Icon name="LuPlus" size={12} />
                                <span>Add First Bed</span>
                              </button>
                            </div>
                          ) : (
                            <div className="matrix-beds-grid">
                              {room.beds.map((bed) => {
                                const cfg = STATUS_CONFIG[bed.status] || STATUS_CONFIG.available;
                                return (
                                  <div
                                    key={bed.id}
                                    className={`matrix-bed-card matrix-bed-card--${bed.status}`}
                                    onClick={() => handleOpenBedDetails(bed)}
                                  >
                                    <div className="matrix-bed-card__top">
                                      <span className="matrix-bed-card__no">
                                        <Icon name="LuBed" size={15} />
                                        {bed.bedNo}
                                      </span>
                                      <span className={`status-badge ${cfg.badgeClass}`}>
                                        {cfg.label}
                                      </span>
                                    </div>

                                    <div className="matrix-bed-card__body">
                                      {bed.patientName ? (
                                        <div className="matrix-bed-card__patient-info">
                                          <span className="matrix-patient-title">{bed.patientName}</span>
                                          <div className="matrix-patient-meta">
                                            <span>UHID: {bed.uhid || "N/A"}</span>
                                            {bed.age && <span>• {bed.age} Y / {bed.gender || "-"}</span>}
                                          </div>
                                          {bed.doctorName && (
                                            <div className="matrix-patient-doctor">
                                              <Icon name="LuStethoscope" size={12} />
                                              <span>{bed.doctorName}</span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="matrix-bed-card__vacant-state">
                                          <span>Ready for patient allotment</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="matrix-bed-card__footer">
                                      <span className="matrix-bed-rate">
                                        ₹{Number(bed.bedChargeRate || 0).toLocaleString()} / day
                                      </span>
                                      <span className="matrix-manage-link">Manage →</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ================= VIEW 3: CENSUS TABLE ================= */
            <div className="fcp-table-card">
              <div className="fcp-table-responsive">
                <table className="fcp-data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Bed No</th>
                      <th>Floor / Ward</th>
                      <th>Room</th>
                      <th>Class & Rate</th>
                      <th>Patient Name</th>
                      <th>UHID</th>
                      <th>Attending Doctor</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBeds.map((bed, idx) => {
                      const cfg = STATUS_CONFIG[bed.status] || STATUS_CONFIG.available;
                      return (
                        <tr key={bed.id}>
                          <td>{idx + 1}</td>
                          <td className="font-bold text-slate-900">{bed.bedNo}</td>
                          <td>
                            <div className="table-ward-cell">
                              <span className="table-ward-name">{bed.wardName}</span>
                              <span className="table-floor-badge">{bed.floor}</span>
                            </div>
                          </td>
                          <td>{bed.roomName}</td>
                          <td>
                            <div className="table-cat-cell">
                              <span>{bed.categoryName}</span>
                              <span className="table-rate">
                                ₹{Number(bed.bedChargeRate || 0).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td>
                            {bed.patientName ? (
                              <span className="table-patient-name">{bed.patientName}</span>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td>{bed.uhid || "—"}</td>
                          <td>{bed.doctorName || "—"}</td>
                          <td>
                            <span className={`status-badge ${cfg.badgeClass}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="fcp-table-btn"
                              onClick={() => handleOpenBedDetails(bed)}
                            >
                              <Icon name="LuPencil" size={13} />
                              <span>Manage</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Overview Panel */}
        <aside className="fcp-side-panel">
          {/* Bed Census Donut Chart */}
          <div className="fcp-side-card">
            <h3 className="fcp-side-card__title">Bed Occupancy Meter</h3>
            <div className="fcp-donut-wrapper">
              <svg className="fcp-donut-svg" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="9"
                />
                {/* Occupied Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="9"
                  strokeDasharray={`${donutGeometry.occLen} ${donutGeometry.c}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                {/* Available Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="9"
                  strokeDasharray={`${donutGeometry.availLen} ${donutGeometry.c}`}
                  strokeDashoffset={-donutGeometry.occLen}
                  strokeLinecap="round"
                />
                {/* Reserved Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="9"
                  strokeDasharray={`${donutGeometry.resLen} ${donutGeometry.c}`}
                  strokeDashoffset={-(donutGeometry.occLen + donutGeometry.availLen)}
                  strokeLinecap="round"
                />
                {/* Cleaning & Maintenance Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="9"
                  strokeDasharray={`${donutGeometry.cleanLen + donutGeometry.maintLen} ${donutGeometry.c}`}
                  strokeDashoffset={-(donutGeometry.occLen + donutGeometry.availLen + donutGeometry.resLen)}
                  strokeLinecap="round"
                />
              </svg>

              <div className="fcp-donut-center">
                <span className="fcp-donut-num">{overallStats.occupiedPct}%</span>
                <span className="fcp-donut-label">Occupied</span>
              </div>
            </div>

            {/* Status Breakdown Legend */}
            <div className="fcp-donut-breakdown">
              <div
                className="fcp-breakdown-row cursor-pointer"
                onClick={() => setStatusFilter("available")}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-semibold text-slate-700">Available</span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {overallStats.available} ({overallStats.availablePct}%)
                </span>
              </div>

              <div
                className="fcp-breakdown-row cursor-pointer"
                onClick={() => setStatusFilter("occupied")}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-xs font-semibold text-slate-700">Occupied</span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {overallStats.occupied} ({overallStats.occupiedPct}%)
                </span>
              </div>

              <div
                className="fcp-breakdown-row cursor-pointer"
                onClick={() => setStatusFilter("reserved")}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-xs font-semibold text-slate-700">Reserved</span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {overallStats.reserved} ({overallStats.reservedPct}%)
                </span>
              </div>

              <div
                className="fcp-breakdown-row cursor-pointer"
                onClick={() => setStatusFilter("maintenance")}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-semibold text-slate-700">Service / Maint</span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {overallStats.cleaning + overallStats.maintenance + overallStats.blocked}
                </span>
              </div>
            </div>
          </div>

          {/* Floor Capacity Overview Card */}
          <div className="fcp-side-card">
            <h3 className="fcp-side-card__title">Floor Capacity Distribution</h3>
            <div className="fcp-floors-distribution">
              {floorsList
                .filter((f) => f.name !== "All Floors")
                .map((fl) => {
                  const floorBeds = bedsView.filter((b) => b.floor === fl.name);
                  const occCount = floorBeds.filter((b) => b.status === "occupied").length;
                  const rate = floorBeds.length > 0 ? Math.round((occCount / floorBeds.length) * 100) : 0;
                  return (
                    <div
                      key={fl.name}
                      className={`fcp-floor-dist-item ${activeFloor === fl.name ? "fcp-floor-dist-item--active" : ""}`}
                      onClick={() => setActiveFloor(fl.name)}
                    >
                      <div className="fcp-floor-dist-row">
                        <span className="font-semibold text-xs text-slate-800">{fl.name}</span>
                        <span className="text-xs text-slate-600 font-bold">
                          {occCount}/{floorBeds.length} ({rate}%)
                        </span>
                      </div>
                      <div className="fcp-mini-progress">
                        <div
                          className="fcp-mini-progress__bar"
                          style={{ width: `${rate}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="fcp-side-card">
            <h3 className="fcp-side-card__title">Hospital Bed Actions</h3>
            <div className="fcp-quick-actions-list">
              <button
                type="button"
                className="fcp-quick-btn"
                onClick={() => {
                  setAddAssetTab("bed");
                  setShowAddAssetModal(true);
                }}
              >
                <Icon name="LuBed" size={16} />
                <span>Add New Bed</span>
              </button>

              <button
                type="button"
                className="fcp-quick-btn"
                onClick={() => {
                  setAddAssetTab("room");
                  setShowAddAssetModal(true);
                }}
              >
                <Icon name="LuDoorOpen" size={16} />
                <span>Add Room to Ward</span>
              </button>

              <button
                type="button"
                className="fcp-quick-btn"
                onClick={() => {
                  setAddAssetTab("ward");
                  setShowAddAssetModal(true);
                }}
              >
                <Icon name="LuBuilding" size={16} />
                <span>Create New Ward Unit</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ================= MODAL: BED COMMAND CENTER DRAWER / DIALOG ================= */}
      {activeBed && (
        <div className="fcp-modal-backdrop" onClick={() => setActiveBed(null)}>
          <div
            className="fcp-bed-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer Header */}
            <div className="fcp-drawer-header">
              <div className="fcp-drawer-header__title-wrap">
                <div
                  className="fcp-drawer-header__icon"
                  style={{
                    backgroundColor: STATUS_CONFIG[activeBed.status]?.bgColor,
                    color: STATUS_CONFIG[activeBed.status]?.textColor,
                  }}
                >
                  <Icon name="LuBed" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="fcp-drawer-title">Bed {activeBed.bedNo}</h2>
                    <span className={`status-badge ${STATUS_CONFIG[activeBed.status]?.badgeClass}`}>
                      {STATUS_CONFIG[activeBed.status]?.label}
                    </span>
                  </div>
                  <span className="fcp-drawer-sub">
                    {activeBed.roomName} • {activeBed.wardName} • {activeBed.floor}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="fcp-modal-close-btn"
                onClick={() => setActiveBed(null)}
              >
                ✕
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="fcp-drawer-tabs">
              <button
                type="button"
                className={`fcp-drawer-tab ${bedModalTab === "overview" ? "fcp-drawer-tab--active" : ""}`}
                onClick={() => setBedModalTab("overview")}
              >
                <Icon name="LuFileText" size={14} />
                <span>Overview & Status</span>
              </button>

              {activeBed.status === "available" && (
                <button
                  type="button"
                  className={`fcp-drawer-tab ${bedModalTab === "allot" ? "fcp-drawer-tab--active" : ""}`}
                  onClick={() => setBedModalTab("allot")}
                >
                  <Icon name="LuUserPlus" size={14} />
                  <span>Allot Patient</span>
                </button>
              )}

              {activeBed.status === "occupied" && (
                <button
                  type="button"
                  className={`fcp-drawer-tab ${bedModalTab === "transfer" ? "fcp-drawer-tab--active" : ""}`}
                  onClick={() => setBedModalTab("transfer")}
                >
                  <Icon name="LuArrowRightLeft" size={14} />
                  <span>Transfer Patient</span>
                </button>
              )}

              <button
                type="button"
                className={`fcp-drawer-tab ${bedModalTab === "edit" ? "fcp-drawer-tab--active" : ""}`}
                onClick={() => setBedModalTab("edit")}
              >
                <Icon name="LuPencil" size={14} />
                <span>Edit Bed</span>
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="fcp-drawer-body">
              {bedModalTab === "overview" && (
                <div className="fcp-overview-pane">
                  {/* Occupant Clinical Card if Admitted */}
                  {activeBed.status === "occupied" ? (
                    <div className="fcp-patient-clinical-card">
                      <div className="fcp-pcard-header">
                        <div className="flex items-center gap-3">
                          <div className="fcp-pcard-avatar">
                            {activeBed.patientName ? activeBed.patientName[0].toUpperCase() : "P"}
                          </div>
                          <div>
                            <h4 className="fcp-pcard-name">{activeBed.patientName || "Admitted Patient"}</h4>
                            <span className="fcp-pcard-uhid">UHID: {activeBed.uhid || "Not Linked"}</span>
                          </div>
                        </div>
                        <span className="fcp-pcard-badge">Admitted IPD</span>
                      </div>

                      <div className="fcp-pcard-grid">
                        <div className="fcp-pcard-field">
                          <span className="fcp-field-label">Age / Gender</span>
                          <span className="fcp-field-value">
                            {activeBed.age ? `${activeBed.age} Y` : "N/A"} / {activeBed.gender || "Unspecified"}
                          </span>
                        </div>
                        <div className="fcp-pcard-field">
                          <span className="fcp-field-label">Admission Date</span>
                          <span className="fcp-field-value">{activeBed.admittedAt || "Recent"}</span>
                        </div>
                        <div className="fcp-pcard-field">
                          <span className="fcp-field-label">Attending Consultant</span>
                          <span className="fcp-field-value font-semibold text-slate-800">
                            {activeBed.doctorName || "Duty Medical Officer"}
                          </span>
                        </div>
                        <div className="fcp-pcard-field">
                          <span className="fcp-field-label">Daily Bed Tariff</span>
                          <span className="fcp-field-value font-semibold text-blue-600">
                            ₹{Number(activeBed.bedChargeRate || 0).toLocaleString()} / day
                          </span>
                        </div>
                      </div>

                      <div className="fcp-pcard-actions">
                        <button
                          type="button"
                          className="fcp-btn fcp-btn--danger"
                          disabled={actionLoading}
                          onClick={() => handleVacateBed(activeBed)}
                        >
                          <Icon name="LuDoorOpen" size={15} />
                          <span>Discharge / Vacate Bed</span>
                        </button>
                        <button
                          type="button"
                          className="fcp-btn fcp-btn--secondary"
                          onClick={() => setBedModalTab("transfer")}
                        >
                          <Icon name="LuArrowRightLeft" size={15} />
                          <span>Transfer to Another Bed</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="fcp-vacant-callout">
                      <div className="fcp-vacant-callout__icon">
                        <Icon name="LuShieldCheck" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Bed is Currently {STATUS_CONFIG[activeBed.status]?.label}</h4>
                        <p className="text-xs text-slate-500 m-0">
                          {activeBed.status === "available"
                            ? "Ready for admission. Click 'Allot Patient' to admit directly from OPD or Emergency."
                            : "Bed is undergoing maintenance or cleaning."}
                        </p>
                      </div>
                      {activeBed.status === "available" && (
                        <button
                          type="button"
                          className="fcp-btn fcp-btn--primary"
                          onClick={() => setBedModalTab("allot")}
                        >
                          <Icon name="LuUserPlus" size={15} />
                          <span>Allot Patient</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Operational Status Switcher */}
                  <div className="fcp-section-box">
                    <h4 className="fcp-section-title">Change Operational Status</h4>
                    <p className="fcp-section-desc">
                      Instantly change status to update house-keeping and ward nursing logs.
                    </p>
                    <div className="fcp-status-buttons-grid">
                      {["available", "cleaning", "maintenance", "blocked"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={actionLoading || (activeBed.status === "occupied" && st === "available")}
                          className={`fcp-status-chip fcp-status-chip--${st} ${activeBed.status === st ? "fcp-status-chip--active" : ""}`}
                          onClick={() => handleUpdateBedStatus(activeBed.id, st)}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: STATUS_CONFIG[st]?.dotColor }}
                          ></span>
                          <span>{STATUS_CONFIG[st]?.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Biomedical Amenities & Features */}
                  <div className="fcp-section-box">
                    <h4 className="fcp-section-title">Biomedical Equipment & Amenities</h4>
                    <div className="fcp-amenities-tags-grid">
                      {[
                        { key: "oxygen", label: "Oxygen Flowmeter Port", icon: "LuActivity" },
                        { key: "monitor", label: "Cardiac Multipara Monitor", icon: "LuHeartPulse" },
                        { key: "ventilator", label: "Mechanical Ventilator", icon: "LuActivity" },
                        { key: "motorized", label: "Electric Motorized Bed", icon: "LuBed" },
                        { key: "emergency_call_bell", label: "Emergency Nurse Call Bell", icon: "LuActivity" },
                        { key: "iv_pole", label: "IV Infusion Stand", icon: "LuPlus" },
                        { key: "suction", label: "Wall Vacuum Suction Port", icon: "LuActivity" },
                      ].map((item) => {
                        const hasAmenity = !!activeBed.features?.[item.key];
                        return (
                          <div
                            key={item.key}
                            className={`fcp-amenity-card ${hasAmenity ? "fcp-amenity-card--equipped" : ""}`}
                          >
                            <span className="fcp-amenity-check">
                              {hasAmenity ? "✓" : "—"}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Danger Zone: Delete Bed */}
                  <div className="fcp-danger-zone">
                    <div>
                      <span className="font-bold text-xs text-red-700">Delete Bed Asset</span>
                      <p className="text-xs text-red-500 m-0">
                        Permanently remove this bed from room inventory.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="fcp-btn fcp-btn--danger-outline"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Icon name="LuTrash2" size={14} />
                      <span>Delete Bed</span>
                    </button>
                  </div>
                </div>
              )}

              {bedModalTab === "allot" && (
                <form onSubmit={handleAllotSubmit} className="fcp-form-stack">
                  <div className="fcp-alert-info">
                    <Icon name="LuShieldCheck" size={18} />
                    <span>
                      Admitting patient directly links them with this bed in the IPD Admissions register.
                    </span>
                  </div>

                  <div className="fcp-form-group">
                    <label className="fcp-form-label">Select Registered Patient *</label>
                    <select
                      className="fcp-form-select"
                      value={allotForm.patient_id}
                      onChange={(e) => setAllotForm({ ...allotForm, patient_id: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Registered Patient --</option>
                      {patientsList.map((p) => {
                        const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown";
                        return (
                          <option key={p.id} value={p.id}>
                            {name} {p.uhid ? `(UHID: ${p.uhid})` : ""} {p.phone ? `• ${p.phone}` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="fcp-form-group">
                    <label className="fcp-form-label">Attending Doctor / Consultant</label>
                    <select
                      className="fcp-form-select"
                      value={allotForm.admitting_practitioner_id}
                      onChange={(e) =>
                        setAllotForm({ ...allotForm, admitting_practitioner_id: e.target.value })
                      }
                    >
                      <option value="">-- Select Attending Doctor (Optional) --</option>
                      {doctorsList.map((doc) => {
                        const name = doc.full_name || [doc.first_name, doc.last_name].filter(Boolean).join(" ") || doc.name;
                        return (
                          <option key={doc.id} value={doc.id}>
                            {name ? `Dr. ${name.replace(/^Dr\.\s*/i, "")}` : doc.id}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="fcp-form-group">
                      <label className="fcp-form-label">Admission Type</label>
                      <select
                        className="fcp-form-select"
                        value={allotForm.admission_type}
                        onChange={(e) => setAllotForm({ ...allotForm, admission_type: e.target.value })}
                      >
                        <option value="elective">Elective / Scheduled</option>
                        <option value="emergency">Emergency / Trauma</option>
                        <option value="daycare">Daycare</option>
                        <option value="maternity">Maternity</option>
                      </select>
                    </div>

                    <div className="fcp-form-group">
                      <label className="fcp-form-label">Target Bed</label>
                      <input
                        type="text"
                        className="fcp-form-input bg-slate-50 cursor-not-allowed"
                        value={`${activeBed.bedNo} (${activeBed.roomName})`}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="fcp-form-group">
                    <label className="fcp-form-label">Reason for Admission / Diagnosis</label>
                    <input
                      type="text"
                      className="fcp-form-input"
                      placeholder="e.g. Acute appendicitis, Post-op monitoring, Fever workup"
                      value={allotForm.reason_for_admission}
                      onChange={(e) =>
                        setAllotForm({ ...allotForm, reason_for_admission: e.target.value })
                      }
                    />
                  </div>

                  <div className="fcp-form-actions">
                    <button
                      type="button"
                      className="fcp-btn fcp-btn--secondary"
                      onClick={() => setBedModalTab("overview")}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="fcp-btn fcp-btn--primary"
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Processing Admission..." : "Confirm & Allot Bed"}
                    </button>
                  </div>
                </form>
              )}

              {bedModalTab === "transfer" && (
                <form onSubmit={handleTransferSubmit} className="fcp-form-stack">
                  <div className="fcp-alert-info">
                    <Icon name="LuArrowRightLeft" size={18} />
                    <span>
                      Transferring moves patient <strong>{activeBed.patientName}</strong> to another vacant bed instantly.
                    </span>
                  </div>

                  <div className="fcp-form-group">
                    <label className="fcp-form-label">Target Vacant Bed *</label>
                    <select
                      className="fcp-form-select"
                      value={transferForm.toBedId}
                      onChange={(e) => setTransferForm({ ...transferForm, toBedId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Vacant Target Bed --</option>
                      {bedsView
                        .filter((b) => b.id !== activeBed.id && b.status === "available")
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            Bed {b.bedNo} ({b.roomName} • {b.wardName} • {b.floor})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="fcp-form-group">
                    <label className="fcp-form-label">Clinical Transfer Reason</label>
                    <input
                      type="text"
                      className="fcp-form-input"
                      placeholder="e.g. Upgraded to ICU, Shifted to General Ward, Isolation required"
                      value={transferForm.transferReason}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, transferReason: e.target.value })
                      }
                    />
                  </div>

                  <div className="fcp-form-actions">
                    <button
                      type="button"
                      className="fcp-btn fcp-btn--secondary"
                      onClick={() => setBedModalTab("overview")}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="fcp-btn fcp-btn--primary"
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Transferring Patient..." : "Execute Bed Transfer"}
                    </button>
                  </div>
                </form>
              )}

              {bedModalTab === "edit" && (
                <form onSubmit={handleEditBedSubmit} className="fcp-form-stack">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="fcp-form-group">
                      <label className="fcp-form-label">Bed No. *</label>
                      <input
                        type="text"
                        className="fcp-form-input"
                        value={editBedForm.bed_no}
                        onChange={(e) => setEditBedForm({ ...editBedForm, bed_no: e.target.value })}
                        required
                      />
                    </div>

                    <div className="fcp-form-group">
                      <label className="fcp-form-label">Operational Status</label>
                      <select
                        className="fcp-form-select"
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

                  <div className="grid grid-cols-2 gap-3">
                    {/* Floor Location for Bed */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Floor Location</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsEditCustomFloor(!isEditCustomFloor)}
                        >
                          {isEditCustomFloor ? "← Dropdown" : "✏️ Custom Floor"}
                        </button>
                      </div>
                      {isEditCustomFloor ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. 5th Floor, Basement 2"
                          value={editCustomFloorInput}
                          onChange={(e) => setEditCustomFloorInput(e.target.value)}
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={editBedFloor}
                          onChange={(e) => setEditBedFloor(e.target.value)}
                        >
                          {availableFloors.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Ward Unit */}
                    <div className="fcp-form-group">
                      <label className="fcp-form-label">Ward Unit</label>
                      <select
                        className="fcp-form-select"
                        value={editBedForm.ward_id}
                        onChange={(e) => {
                          const wid = e.target.value;
                          const sel = wards.find((w) => w.id === wid);
                          setEditBedForm({
                            ...editBedForm,
                            ward_id: wid,
                            room_id: "",
                          });
                          if (sel?.floor) setEditBedFloor(sel.floor);
                        }}
                      >
                        {wards.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} {w.floor ? `(${w.floor})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Room No. / Space */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Room No. / Space</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsEditCustomRoom(!isEditCustomRoom)}
                        >
                          {isEditCustomRoom ? "← Dropdown" : "✏️ Custom Room"}
                        </button>
                      </div>
                      {isEditCustomRoom ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. 105 or ICU-Bay-A"
                          value={editCustomRoomNo}
                          onChange={(e) => setEditCustomRoomNo(e.target.value)}
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={editBedForm.room_id || ""}
                          onChange={(e) => {
                            const rid = e.target.value;
                            const selR = rooms.find((r) => r.id === rid);
                            setEditBedForm({
                              ...editBedForm,
                              room_id: rid,
                              room_no: selR?.room_no || editBedForm.room_no,
                              room_type: selR?.room_type || editBedForm.room_type,
                            });
                          }}
                        >
                          <option value="">-- Choose Existing Room --</option>
                          {rooms
                            .filter((r) => !editBedForm.ward_id || r.ward_id === editBedForm.ward_id)
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                Room {r.room_no} ({r.room_type || "general"})
                              </option>
                            ))}
                        </select>
                      )}
                    </div>

                    {/* Bed Category / Class */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Bed Category / Class</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsEditCustomCategory(!isEditCustomCategory)}
                        >
                          {isEditCustomCategory ? "← Dropdown" : "+ Custom Class"}
                        </button>
                      </div>
                      {isEditCustomCategory ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. VIP Suite, Post-Op Stepdown"
                          value={editCustomCategoryInput}
                          onChange={(e) => setEditCustomCategoryInput(e.target.value)}
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={editBedForm.bed_category_id}
                          onChange={(e) => setEditBedForm({ ...editBedForm, bed_category_id: e.target.value })}
                        >
                          <option value="">-- General / Default --</option>
                          {categoriesList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.daily_rate ? `(₹${Number(c.daily_rate).toLocaleString()}/day)` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="fcp-form-group">
                    <label className="fcp-form-label">Biomedical Amenities Equipped</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[
                        { key: "oxygen", label: "Oxygen Supply" },
                        { key: "monitor", label: "Cardiac Monitor" },
                        { key: "ventilator", label: "Ventilator" },
                        { key: "motorized", label: "Motorized Bed" },
                        { key: "emergency_call_bell", label: "Call Bell" },
                        { key: "iv_pole", label: "IV Infusion Pole" },
                        { key: "suction", label: "Suction Port" },
                      ].map((item) => (
                        <label key={item.key} className="fcp-checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!editBedForm.features?.[item.key]}
                            onChange={(e) =>
                              setEditBedForm({
                                ...editBedForm,
                                features: {
                                  ...editBedForm.features,
                                  [item.key]: e.target.checked,
                                },
                              })
                            }
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="fcp-form-actions">
                    <button
                      type="button"
                      className="fcp-btn fcp-btn--secondary"
                      onClick={() => setBedModalTab("overview")}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="fcp-btn fcp-btn--primary"
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD FACILITY ASSET (BED / ROOM / WARD) ================= */}
      {showAddAssetModal && (
        <div className="fcp-modal-backdrop" onClick={() => setShowAddAssetModal(false)}>
          <div
            className="fcp-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="fcp-modal-header">
              <div className="flex items-center gap-2">
                <Icon name="LuPlus" size={20} className="text-blue-600" />
                <h3 className="fcp-modal-title">Add Facility Infrastructure Asset</h3>
              </div>
              <button
                type="button"
                className="fcp-modal-close-btn"
                onClick={() => setShowAddAssetModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="fcp-modal-tabs">
              <button
                type="button"
                className={`fcp-modal-tab ${addAssetTab === "bed" ? "fcp-modal-tab--active" : ""}`}
                onClick={() => setAddAssetTab("bed")}
              >
                <Icon name="LuBed" size={15} />
                <span>Add Bed</span>
              </button>
              <button
                type="button"
                className={`fcp-modal-tab ${addAssetTab === "room" ? "fcp-modal-tab--active" : ""}`}
                onClick={() => setAddAssetTab("room")}
              >
                <Icon name="LuDoorOpen" size={15} />
                <span>Add Room</span>
              </button>
              <button
                type="button"
                className={`fcp-modal-tab ${addAssetTab === "ward" ? "fcp-modal-tab--active" : ""}`}
                onClick={() => setAddAssetTab("ward")}
              >
                <Icon name="LuBuilding" size={15} />
                <span>Add Ward</span>
              </button>
            </div>

            <div className="fcp-modal-body">
              {/* TAB 1: ADD BED */}
              {addAssetTab === "bed" && (
                <form onSubmit={handleAddBedSubmit} className="fcp-form-stack">
                  {/* Floor & Ward Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* 1. Floor Location */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Floor Location</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsCustomFloor(!isCustomFloor)}
                        >
                          {isCustomFloor ? "← Dropdown" : "+ Custom Floor"}
                        </button>
                      </div>
                      {isCustomFloor ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. 5th Floor, Basement 2"
                          value={customFloorInput}
                          onChange={(e) => setCustomFloorInput(e.target.value)}
                          required
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={addBedForm.floor}
                          onChange={(e) => setAddBedForm({ ...addBedForm, floor: e.target.value })}
                        >
                          {availableFloors.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* 2. Target Ward */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Target Ward *</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsCustomWard(!isCustomWard)}
                        >
                          {isCustomWard ? "← Dropdown" : "+ New Ward"}
                        </button>
                      </div>
                      {isCustomWard ? (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              className="fcp-form-input text-xs uppercase"
                              placeholder="Code (e.g. W-ICU3)"
                              value={customWardForm.code}
                              onChange={(e) =>
                                setCustomWardForm({ ...customWardForm, code: e.target.value })
                              }
                              required
                            />
                            <input
                              type="text"
                              className="fcp-form-input text-xs"
                              placeholder="Ward Name (e.g. Trauma ICU)"
                              value={customWardForm.name}
                              onChange={(e) =>
                                setCustomWardForm({ ...customWardForm, name: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <select
                              className="fcp-form-select text-xs py-1"
                              value={customWardForm.ward_type}
                              onChange={(e) =>
                                setCustomWardForm({ ...customWardForm, ward_type: e.target.value })
                              }
                            >
                              <option value="general">General</option>
                              <option value="semi_private">Semi-Private</option>
                              <option value="private">Private Deluxe</option>
                              <option value="icu">ICU</option>
                              <option value="nicu">NICU</option>
                              <option value="picu">PICU</option>
                              <option value="emergency">Emergency</option>
                              <option value="isolation">Isolation</option>
                              <option value="maternity">Maternity</option>
                            </select>
                            <select
                              className="fcp-form-select text-xs py-1"
                              value={customWardForm.gender_policy}
                              onChange={(e) =>
                                setCustomWardForm({ ...customWardForm, gender_policy: e.target.value })
                              }
                            >
                              <option value="any">Any Gender</option>
                              <option value="male_only">Male Only</option>
                              <option value="female_only">Female Only</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={addBedForm.ward_id}
                          onChange={(e) => {
                            const wid = e.target.value;
                            const sel = wards.find((w) => w.id === wid);
                            setAddBedForm({
                              ...addBedForm,
                              ward_id: wid,
                              floor: sel?.floor || addBedForm.floor,
                              room_id: "",
                              room_no: "",
                            });
                          }}
                          required
                        >
                          <option value="">-- Choose Existing Ward --</option>
                          {wards.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} {w.floor ? `(${w.floor})` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Room & Bed Number */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* 3. Room Number / Space */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Room Number / Bay</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsCustomRoom(!isCustomRoom)}
                        >
                          {isCustomRoom ? "← Dropdown" : "+ Custom Room"}
                        </button>
                      </div>
                      {isCustomRoom ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            className="fcp-form-input text-xs"
                            placeholder="Room No (e.g. 105)"
                            value={customRoomNo}
                            onChange={(e) => setCustomRoomNo(e.target.value)}
                            required
                          />
                          <select
                            className="fcp-form-select text-xs py-1"
                            value={customRoomType}
                            onChange={(e) => setCustomRoomType(e.target.value)}
                          >
                            <option value="general">General</option>
                            <option value="semi_private">Semi-Private</option>
                            <option value="private">Private</option>
                            <option value="icu">ICU</option>
                            <option value="isolation">Isolation</option>
                            <option value="emergency">Emergency</option>
                            <option value="daycare">Daycare</option>
                          </select>
                        </div>
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={addBedForm.room_id || ""}
                          onChange={(e) => {
                            const rid = e.target.value;
                            const selR = rooms.find((r) => r.id === rid);
                            setAddBedForm({
                              ...addBedForm,
                              room_id: rid,
                              room_no: selR?.room_no || "",
                              room_type: selR?.room_type || "general",
                              ward_id: selR?.ward_id || addBedForm.ward_id,
                            });
                          }}
                        >
                          <option value="">-- Choose Existing Room --</option>
                          {rooms
                            .filter((r) => !addBedForm.ward_id || r.ward_id === addBedForm.ward_id)
                            .map((r) => {
                              const parentWard = wards.find((w) => w.id === r.ward_id);
                              return (
                                <option key={r.id} value={r.id}>
                                  Room {r.room_no} {parentWard ? `• ${parentWard.name}` : ""}
                                </option>
                              );
                            })}
                        </select>
                      )}
                    </div>

                    {/* 4. Bed Number */}
                    <div className="fcp-form-group">
                      <label className="fcp-form-label">Bed Number / Code *</label>
                      <input
                        type="text"
                        className="fcp-form-input"
                        placeholder="e.g. B101-A or ICU-08"
                        value={addBedForm.bed_no}
                        onChange={(e) => setAddBedForm({ ...addBedForm, bed_no: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Bed Category & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* 5. Bed Category / Class */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Bed Category / Class</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsCustomCategory(!isCustomCategory)}
                        >
                          {isCustomCategory ? "← Dropdown" : "+ Custom Class"}
                        </button>
                      </div>
                      {isCustomCategory ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. VIP Suite, Post-Op Stepdown"
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={addBedForm.bed_category_id}
                          onChange={(e) =>
                            setAddBedForm({ ...addBedForm, bed_category_id: e.target.value })
                          }
                        >
                          <option value="">-- General Standard --</option>
                          {categoriesList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.daily_rate ? `(₹${Number(c.daily_rate).toLocaleString()})` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* 6. Initial Status */}
                    <div className="fcp-form-group">
                      <label className="fcp-form-label">Initial Operational Status</label>
                      <select
                        className="fcp-form-select"
                        value={addBedForm.status}
                        onChange={(e) => setAddBedForm({ ...addBedForm, status: e.target.value })}
                      >
                        <option value="available">Available (Vacant)</option>
                        <option value="cleaning">Cleaning / Sanitizing</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="blocked">Blocked / Out of Order</option>
                        <option value="reserved">Reserved</option>
                      </select>
                    </div>
                  </div>

                  {/* 7. Biomedical Amenities & Equipment (Standard Chips + Custom Adder) */}
                  <div className="fcp-form-group">
                    <label className="fcp-form-label">Biomedical Equipment & Amenities</label>
                    <div className="fcp-amenity-grid">
                      {[
                        { key: "oxygen", label: "Oxygen Supply" },
                        { key: "monitor", label: "Cardiac Monitor" },
                        { key: "ventilator", label: "Ventilator" },
                        { key: "motorized", label: "Motorized Bed" },
                        { key: "emergency_call_bell", label: "Nurse Call Bell" },
                        { key: "iv_pole", label: "IV Stand" },
                        { key: "suction", label: "Suction Port" },
                        { key: "dialysis_port", label: "Dialysis Port" },
                        { key: "ac", label: "Air Conditioner" },
                        { key: "tv", label: "Television" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className={`fcp-amenity-chip ${addBedForm.features?.[item.key] ? "fcp-amenity-chip--active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={!!addBedForm.features?.[item.key]}
                            onChange={(e) =>
                              setAddBedForm({
                                ...addBedForm,
                                features: { ...addBedForm.features, [item.key]: e.target.checked },
                              })
                            }
                          />
                          <span>{addBedForm.features?.[item.key] ? "✓" : "+"}</span>
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Custom Amenity Adder */}
                    <div className="mt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="fcp-form-input text-xs"
                          placeholder="Add custom amenity (e.g. Syringe Pump, Radiant Warmer, BiPAP)..."
                          value={customAmenityInput}
                          onChange={(e) => setCustomAmenityInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomAmenity();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="fcp-action-btn fcp-action-btn--secondary"
                          onClick={handleAddCustomAmenity}
                        >
                          <Icon name="LuPlus" size={13} />
                          <span>Add</span>
                        </button>
                      </div>

                      {customAmenitiesList.length > 0 && (
                        <div className="fcp-custom-tags-wrap">
                          {customAmenitiesList.map((amenity) => (
                            <span key={amenity} className="fcp-custom-tag">
                              <span>{amenity}</span>
                              <button
                                type="button"
                                className="fcp-custom-tag__remove"
                                onClick={() => handleRemoveCustomAmenity(amenity)}
                                title="Remove"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="fcp-form-actions">
                    <button
                      type="button"
                      className="fcp-btn fcp-btn--secondary"
                      onClick={() => setShowAddAssetModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="fcp-btn fcp-btn--primary"
                      disabled={assetSubmitting}
                    >
                      {assetSubmitting ? "Adding Bed..." : "Create Bed Asset"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: ADD ROOM */}
              {addAssetTab === "room" && (
                <form onSubmit={handleAddRoomSubmit} className="fcp-form-stack">
                  {/* Target Ward */}
                  <div className="fcp-form-group">
                    <div className="fcp-field-toggle-row">
                      <label className="fcp-form-label m-0">Target Ward Unit *</label>
                      <button
                        type="button"
                        className="fcp-toggle-text-btn"
                        onClick={() => setIsRoomCustomWard(!isRoomCustomWard)}
                      >
                        {isRoomCustomWard ? "← Choose Existing Ward" : "+ Create New Ward"}
                      </button>
                    </div>
                    {isRoomCustomWard ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Ward Code *</label>
                            <input
                              type="text"
                              className="fcp-form-input uppercase text-xs"
                              placeholder="e.g. W-NEURO"
                              value={roomCustomWardForm.code}
                              onChange={(e) =>
                                setRoomCustomWardForm({ ...roomCustomWardForm, code: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Ward Full Name *</label>
                            <input
                              type="text"
                              className="fcp-form-input text-xs"
                              placeholder="e.g. Neurology Unit"
                              value={roomCustomWardForm.name}
                              onChange={(e) =>
                                setRoomCustomWardForm({ ...roomCustomWardForm, name: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="fcp-field-toggle-row">
                              <label className="text-[11px] font-semibold text-slate-600 m-0">Floor</label>
                              <button
                                type="button"
                                className="fcp-toggle-text-btn text-[10px]"
                                onClick={() => setIsRoomCustomFloor(!isRoomCustomFloor)}
                              >
                                {isRoomCustomFloor ? "← Dropdown" : "✏️ Custom"}
                              </button>
                            </div>
                            {isRoomCustomFloor ? (
                              <input
                                type="text"
                                className="fcp-form-input text-xs"
                                placeholder="e.g. 4th Floor"
                                value={roomCustomFloorInput}
                                onChange={(e) => setRoomCustomFloorInput(e.target.value)}
                              />
                            ) : (
                              <select
                                className="fcp-form-select text-xs py-1.5"
                                value={roomCustomWardForm.floor}
                                onChange={(e) =>
                                  setRoomCustomWardForm({ ...roomCustomWardForm, floor: e.target.value })
                                }
                              >
                                {availableFloors.map((f) => (
                                  <option key={f} value={f}>
                                    {f}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Ward Classification</label>
                            <select
                              className="fcp-form-select text-xs py-1.5"
                              value={roomCustomWardForm.ward_type}
                              onChange={(e) =>
                                setRoomCustomWardForm({ ...roomCustomWardForm, ward_type: e.target.value })
                              }
                            >
                              {availableWardTypes.map((t) => (
                                <option key={t} value={t}>
                                  {t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <select
                        className="fcp-form-select"
                        value={addRoomForm.ward_id}
                        onChange={(e) => {
                          const wid = e.target.value;
                          setAddRoomForm({ ...addRoomForm, ward_id: wid });
                        }}
                        required
                      >
                        <option value="">-- Choose Existing Ward --</option>
                        {wards.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} {w.floor ? `(${w.floor})` : ""} - {w.ward_type}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Floor Location for this Unit */}
                  {!isRoomCustomWard && (
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Floor Location for this Unit</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsRoomCustomFloor(!isRoomCustomFloor)}
                        >
                          {isRoomCustomFloor ? "← Dropdown" : "✏️ Custom Floor"}
                        </button>
                      </div>
                      {isRoomCustomFloor ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. 5th Floor, Basement 1"
                          value={roomCustomFloorInput}
                          onChange={(e) => setRoomCustomFloorInput(e.target.value)}
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={
                            roomCustomFloorInput ||
                            wards.find((w) => w.id === addRoomForm.ward_id)?.floor ||
                            "Ground Floor"
                          }
                          onChange={(e) => setRoomCustomFloorInput(e.target.value)}
                        >
                          {availableFloors.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="fcp-form-group">
                      <label className="fcp-form-label">Room Number / Name *</label>
                      <input
                        type="text"
                        className="fcp-form-input"
                        placeholder="e.g. 204 or GW-East-03"
                        value={addRoomForm.room_no}
                        onChange={(e) => setAddRoomForm({ ...addRoomForm, room_no: e.target.value })}
                        required
                      />
                    </div>

                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Room Type</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsRoomCustomType(!isRoomCustomType)}
                        >
                          {isRoomCustomType ? "← Dropdown" : "✏️ Custom Type"}
                        </button>
                      </div>
                      {isRoomCustomType ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. Chemotherapy Bay, Bone Marrow Unit"
                          value={roomCustomTypeInput}
                          onChange={(e) => setRoomCustomTypeInput(e.target.value)}
                          required
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={addRoomForm.room_type}
                          onChange={(e) => setAddRoomForm({ ...addRoomForm, room_type: e.target.value })}
                        >
                          {availableRoomTypes.map((t) => (
                            <option key={t} value={t}>
                              {t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="fcp-form-actions">
                    <button
                      type="button"
                      className="fcp-btn fcp-btn--secondary"
                      onClick={() => setShowAddAssetModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="fcp-btn fcp-btn--primary"
                      disabled={assetSubmitting}
                    >
                      {assetSubmitting ? "Creating Room..." : "Create Room"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: ADD WARD */}
              {addAssetTab === "ward" && (
                <form onSubmit={handleAddWardSubmit} className="fcp-form-stack">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="fcp-form-group">
                      <label className="fcp-form-label">Ward Code *</label>
                      <input
                        type="text"
                        className="fcp-form-input uppercase"
                        placeholder="e.g. W-ICU2"
                        value={addWardForm.code}
                        onChange={(e) => setAddWardForm({ ...addWardForm, code: e.target.value })}
                        required
                      />
                    </div>

                    <div className="fcp-form-group">
                      <label className="fcp-form-label">Ward Full Name *</label>
                      <input
                        type="text"
                        className="fcp-form-input"
                        placeholder="e.g. Cardiac Care Unit (CCU)"
                        value={addWardForm.name}
                        onChange={(e) => setAddWardForm({ ...addWardForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Floor Location */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Floor Location *</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsWardCustomFloor(!isWardCustomFloor)}
                        >
                          {isWardCustomFloor ? "← Dropdown" : "✏️ Custom Floor"}
                        </button>
                      </div>
                      {isWardCustomFloor ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. 5th Floor, Basement 2, Cath Wing"
                          value={wardCustomFloorInput}
                          onChange={(e) => setWardCustomFloorInput(e.target.value)}
                          required
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={addWardForm.floor}
                          onChange={(e) => setAddWardForm({ ...addWardForm, floor: e.target.value })}
                        >
                          {availableFloors.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Ward Classification */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Ward Classification</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsWardCustomType(!isWardCustomType)}
                        >
                          {isWardCustomType ? "← Dropdown" : "✏️ Custom Type"}
                        </button>
                      </div>
                      {isWardCustomType ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. Neuro Trauma, Pediatric Oncology"
                          value={wardCustomTypeInput}
                          onChange={(e) => setWardCustomTypeInput(e.target.value)}
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={addWardForm.ward_type}
                          onChange={(e) => setAddWardForm({ ...addWardForm, ward_type: e.target.value })}
                        >
                          {availableWardTypes.map((t) => (
                            <option key={t} value={t}>
                              {t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Gender Policy */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Gender Policy</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsWardCustomGender(!isWardCustomGender)}
                        >
                          {isWardCustomGender ? "← Dropdown" : "✏️ Custom Policy"}
                        </button>
                      </div>
                      {isWardCustomGender ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. Maternal/Infant Only"
                          value={wardCustomGenderInput}
                          onChange={(e) => setWardCustomGenderInput(e.target.value)}
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={addWardForm.gender_policy}
                          onChange={(e) => setAddWardForm({ ...addWardForm, gender_policy: e.target.value })}
                        >
                          <option value="any">Any Gender</option>
                          <option value="male">Male Only</option>
                          <option value="female">Female Only</option>
                        </select>
                      )}
                    </div>

                    {/* Default Bed Category */}
                    <div className="fcp-form-group">
                      <div className="fcp-field-toggle-row">
                        <label className="fcp-form-label m-0">Default Bed Category / Class</label>
                        <button
                          type="button"
                          className="fcp-toggle-text-btn"
                          onClick={() => setIsWardCustomCategory(!isWardCustomCategory)}
                        >
                          {isWardCustomCategory ? "← Dropdown" : "+ Custom Class"}
                        </button>
                      </div>
                      {isWardCustomCategory ? (
                        <input
                          type="text"
                          className="fcp-form-input"
                          placeholder="e.g. Executive Deluxe, Stepdown"
                          value={wardCustomCategoryInput}
                          onChange={(e) => setWardCustomCategoryInput(e.target.value)}
                        />
                      ) : (
                        <select
                          className="fcp-form-select"
                          value={addWardForm.bed_category_id}
                          onChange={(e) =>
                            setAddWardForm({ ...addWardForm, bed_category_id: e.target.value })
                          }
                        >
                          <option value="">-- General Standard --</option>
                          {categoriesList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.daily_rate ? `(₹${Number(c.daily_rate).toLocaleString()})` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="fcp-form-group">
                    <label className="fcp-form-label">Initial Room No. (Optional)</label>
                    <input
                      type="text"
                      className="fcp-form-input"
                      placeholder="e.g. 301 (creates an initial room under this ward)"
                      value={addWardForm.initial_room_no}
                      onChange={(e) =>
                        setAddWardForm({ ...addWardForm, initial_room_no: e.target.value })
                      }
                    />
                  </div>

                  <div className="fcp-form-actions">
                    <button
                      type="button"
                      className="fcp-btn fcp-btn--secondary"
                      onClick={() => setShowAddAssetModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="fcp-btn fcp-btn--primary"
                      disabled={assetSubmitting}
                    >
                      {assetSubmitting ? "Creating Ward..." : "Create Ward Unit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE BED CONFIRMATION ================= */}
      {showDeleteConfirm && activeBed && (
        <div className="fcp-modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="fcp-modal-dialog fcp-modal-dialog--sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fcp-modal-header border-none pb-0">
              <div className="flex items-center gap-2 text-red-600">
                <Icon name="LuAlertCircle" size={24} />
                <h3 className="fcp-modal-title text-red-700">Confirm Bed Deletion</h3>
              </div>
              <button
                type="button"
                className="fcp-modal-close-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ✕
              </button>
            </div>

            <div className="fcp-modal-body">
              <p className="text-sm text-slate-700 m-0">
                Are you sure you want to permanently delete <strong>Bed {activeBed.bedNo}</strong> in{" "}
                <strong>{activeBed.roomName}</strong> ({activeBed.wardName})?
              </p>
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                This will remove the bed from active floor maps and prevent future hospital admissions into this slot.
              </div>
            </div>

            <div className="fcp-form-actions border-t border-slate-100 p-4">
              <button
                type="button"
                className="fcp-btn fcp-btn--secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fcp-btn fcp-btn--danger"
                disabled={actionLoading}
                onClick={handleDeleteBedConfirm}
              >
                {actionLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE WARD CONFIRMATION ================= */}
      {showDeleteWardConfirm && wardToDelete && (
        <div className="fcp-modal-backdrop" onClick={() => setShowDeleteWardConfirm(false)}>
          <div
            className="fcp-modal-dialog fcp-modal-dialog--sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="fcp-modal-header border-none pb-0">
              <div className="flex items-center gap-2 text-rose-600">
                <Icon name="LuAlertTriangle" size={24} />
                <h3 className="fcp-modal-title text-rose-700">Confirm Ward Deletion</h3>
              </div>
              <button
                type="button"
                className="fcp-modal-close-btn"
                onClick={() => setShowDeleteWardConfirm(false)}
              >
                ✕
              </button>
            </div>

            <div className="fcp-modal-body">
              <p className="text-sm text-slate-700 m-0">
                Are you sure you want to delete Ward <strong>{wardToDelete.name}</strong> ({wardToDelete.code || "N/A"})?
              </p>

              {wardToDelete.occupiedBeds > 0 ? (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                  <Icon name="LuAlertCircle" size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Ward Cannot Be Deleted!</strong>
                    <span>
                      This ward currently has <strong>{wardToDelete.occupiedBeds} occupied bed(s)</strong> with active inpatient admissions. You must transfer or discharge all patients before deleting this ward unit.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  This ward contains <strong>{wardToDelete.roomsList?.length || 0} room(s)</strong> and <strong>{wardToDelete.totalBeds || 0} total bed(s)</strong>. Deleting this ward unit will archive the ward along with its rooms and vacant beds.
                </div>
              )}
            </div>

            <div className="fcp-form-actions border-t border-slate-100 p-4">
              <button
                type="button"
                className="fcp-btn fcp-btn--secondary"
                onClick={() => setShowDeleteWardConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fcp-btn fcp-btn--danger"
                disabled={actionLoading || wardToDelete.occupiedBeds > 0}
                onClick={handleDeleteWardConfirm}
              >
                {actionLoading ? "Deleting Ward..." : "Permanently Delete Ward"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE ROOM CONFIRMATION ================= */}
      {showDeleteRoomConfirm && roomToDelete && (
        <div className="fcp-modal-backdrop" onClick={() => setShowDeleteRoomConfirm(false)}>
          <div
            className="fcp-modal-dialog fcp-modal-dialog--sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="fcp-modal-header border-none pb-0">
              <div className="flex items-center gap-2 text-rose-600">
                <Icon name="LuAlertTriangle" size={24} />
                <h3 className="fcp-modal-title text-rose-700">Confirm Room Deletion</h3>
              </div>
              <button
                type="button"
                className="fcp-modal-close-btn"
                onClick={() => setShowDeleteRoomConfirm(false)}
              >
                ✕
              </button>
            </div>

            <div className="fcp-modal-body">
              <p className="text-sm text-slate-700 m-0">
                Are you sure you want to delete <strong>Room {roomToDelete.roomName || roomToDelete.room_no}</strong> in <strong>{roomToDelete.wardName || "Ward"}</strong>?
              </p>

              {roomToDelete.occupiedCount > 0 ? (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                  <Icon name="LuAlertCircle" size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Room Cannot Be Deleted!</strong>
                    <span>
                      This room currently has <strong>{roomToDelete.occupiedCount} occupied bed(s)</strong> with active inpatient admissions. Please discharge or transfer the patients first.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  This room contains <strong>{roomToDelete.totalCount || 0} vacant bed(s)</strong>. Deleting this room will remove it from the floor map and archive its beds.
                </div>
              )}
            </div>

            <div className="fcp-form-actions border-t border-slate-100 p-4">
              <button
                type="button"
                className="fcp-btn fcp-btn--secondary"
                onClick={() => setShowDeleteRoomConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fcp-btn fcp-btn--danger"
                disabled={actionLoading || roomToDelete.occupiedCount > 0}
                onClick={handleDeleteRoomConfirm}
              >
                {actionLoading ? "Deleting Room..." : "Permanently Delete Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
