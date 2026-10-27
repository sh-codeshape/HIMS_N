import React, { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import {
  LuUserCheck,
  LuUsers,
  LuCalendar,
  LuClock,
  LuPlus,
  LuSearch,
  LuFilter,
  LuPencil,
  LuTrash2,
  LuPhone,
  LuMail,
  LuMapPin,
  LuAward,
  LuIndianRupee,
  LuUpload,
  LuCheck,
  LuX,
  LuStethoscope,
  LuActivity,
} from "react-icons/lu";

import PageContainer from "../../components/common/PageContainer.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Modal from "../../components/common/Modal.jsx";
import Loader from "../../components/common/Loader.jsx";

import doctorService from "../../services/doctorService";
import { SPECIALIZATIONS, DEGREE_OPTIONS } from "../../utils/constants";
import { formatCurrency, getInitials } from "../../utils/formatters";
import styles from "./DoctorDutyRoster.module.css";

const DAYS_OF_WEEK = [
  { index: 1, name: "Monday" },
  { index: 2, name: "Tuesday" },
  { index: 3, name: "Wednesday" },
  { index: 4, name: "Thursday" },
  { index: 5, name: "Friday" },
  { index: 6, name: "Saturday" },
  { index: 0, name: "Sunday" },
];

const INITIAL_FORM_DATA = {
  name: "",
  nameHindi: "",
  qualification: "MBBS",
  qualificationHindi: "",
  specialization: "General Medicine",
  specializationHindi: "",
  specialty: "",
  experience: "5 Years",
  consultation_fee: 500,
  old_patient_fee: 300,
  emergency_fee: 800,
  gender: "male",
  displaySchedule: "Mon - Sat: 09:00 AM - 02:00 PM",
  maxNewPatients: 40,
  maxOldPatients: 30,
  registration_no: "",
  phone: "",
  email: "",
  address: "",
  avatar: "",
  role: "Consultant",
  is_active: true,
};

export default function DoctorDutyRoster() {
  const [activeTab, setActiveTab] = useState("directory"); // 'directory' | 'roster'
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'

  // Duty Roster state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  // Doctor Add/Edit Modal
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorFormData, setDoctorFormData] = useState(INITIAL_FORM_DATA);
  const [customQualification, setCustomQualification] = useState("");
  const [submittingDoctor, setSubmittingDoctor] = useState(false);
  const fileInputRef = useRef(null);

  // Schedule Slot Add/Edit Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "14:00",
    slot_minutes: 15,
    consultation_mode: "both",
  });
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Load doctors on mount
  useEffect(() => {
    loadDoctors();
  }, []);

  // When selected doctor changes, fetch their schedules
  useEffect(() => {
    if (selectedDoctor?.id || selectedDoctor?.practitioner_id) {
      loadSchedules(selectedDoctor.practitioner_id || selectedDoctor.id);
    } else {
      setSchedules([]);
    }
  }, [selectedDoctor]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getDoctors();
      setDoctors(data || []);
      if (!selectedDoctor && data?.length > 0) {
        setSelectedDoctor(data[0]);
      }
    } catch (err) {
      console.error("Failed to load doctors:", err);
      toast.error("Could not load doctor list");
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async (practitionerId) => {
    try {
      setSchedulesLoading(true);
      const list = await doctorService.getSchedules(practitionerId);
      setSchedules(list || []);
    } catch (err) {
      console.error("Failed to load schedules:", err);
      toast.error("Could not load duty roster schedules");
    } finally {
      setSchedulesLoading(false);
    }
  };

  // Filtered doctors list
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.name?.toLowerCase().includes(q) ||
        doc.nameHindi?.toLowerCase().includes(q) ||
        doc.specialization?.toLowerCase().includes(q) ||
        doc.phone?.toLowerCase().includes(q) ||
        doc.registration_no?.toLowerCase().includes(q) ||
        doc.staff_code?.toLowerCase().includes(q);

      const matchesSpec =
        !selectedSpecialization || doc.specialization === selectedSpecialization;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && doc.is_active) ||
        (statusFilter === "inactive" && !doc.is_active);

      return matchesSearch && matchesSpec && matchesStatus;
    });
  }, [doctors, searchQuery, selectedSpecialization, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = doctors.length;
    const active = doctors.filter((d) => d.is_active).length;
    const inactive = total - active;
    const departments = new Set(doctors.map((d) => d.specialization).filter(Boolean)).size;
    return { total, active, inactive, departments };
  }, [doctors]);

  // Handle Quick Toggle Status
  const handleToggleActive = async (doctor, e) => {
    e?.stopPropagation?.();
    const id = doctor.id || doctor.practitioner_id;
    try {
      // Optimistic update
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === id || d.practitioner_id === id ? { ...d, is_active: !d.is_active } : d
        )
      );
      if (selectedDoctor && (selectedDoctor.id === id || selectedDoctor.practitioner_id === id)) {
        setSelectedDoctor((prev) => ({ ...prev, is_active: !prev.is_active }));
      }

      const res = await doctorService.toggleActive(id);
      toast.success(
        `${doctor.name} is now ${res?.is_active ? "Available / Active" : "On Leave / Inactive"}`
      );
    } catch (err) {
      console.error("Toggle error:", err);
      toast.error("Failed to update status");
      loadDoctors();
    }
  };

  // Handle Photo Upload (Convert to base64 Data URL)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDoctorFormData((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  // Open Add/Edit Doctor Modal
  const handleOpenDoctorModal = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      const isKnownDegree = DEGREE_OPTIONS.includes(doctor.qualification);
      setDoctorFormData({
        name: doctor.name || "",
        nameHindi: doctor.nameHindi || "",
        qualification: isKnownDegree ? doctor.qualification : "Other / Custom...",
        qualificationHindi: doctor.qualificationHindi || "",
        specialization: doctor.specialization || "General Medicine",
        specializationHindi: doctor.specializationHindi || "",
        specialty: doctor.specialty || "",
        experience: doctor.experience || "5 Years",
        consultation_fee: doctor.consultation_fee ?? 500,
        old_patient_fee: doctor.old_patient_fee ?? 300,
        emergency_fee: doctor.emergency_fee ?? 800,
        gender: doctor.gender || "male",
        displaySchedule: doctor.displaySchedule || "Mon - Sat: 09:00 AM - 02:00 PM",
        maxNewPatients: doctor.maxNewPatients ?? 40,
        maxOldPatients: doctor.maxOldPatients ?? 30,
        registration_no: doctor.registration_no || "",
        phone: doctor.phone || "",
        email: doctor.email || "",
        address: doctor.address || "",
        avatar: doctor.avatar || "",
        role: doctor.role || "Consultant",
        is_active: doctor.is_active ?? true,
      });
      setCustomQualification(isKnownDegree ? "" : doctor.qualification || "");
    } else {
      setEditingDoctor(null);
      setDoctorFormData(INITIAL_FORM_DATA);
      setCustomQualification("");
    }
    setDoctorModalOpen(true);
  };

  // Save Doctor
  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    if (!doctorFormData.name?.trim()) {
      toast.error("Doctor name is required");
      return;
    }

    const finalQualification =
      doctorFormData.qualification === "Other / Custom..."
        ? customQualification.trim() || "MBBS"
        : doctorFormData.qualification;

    const payload = {
      ...doctorFormData,
      qualification: finalQualification,
    };

    try {
      setSubmittingDoctor(true);
      if (editingDoctor) {
        const id = editingDoctor.id || editingDoctor.practitioner_id;
        await doctorService.updateDoctor(id, payload);
        toast.success("Doctor profile updated successfully");
      } else {
        await doctorService.createDoctor(payload);
        toast.success("New doctor registered successfully");
      }
      setDoctorModalOpen(false);
      await loadDoctors();
    } catch (err) {
      console.error("Save doctor error:", err);
      toast.error("Failed to save doctor");
    } finally {
      setSubmittingDoctor(false);
    }
  };

  // Delete Doctor
  const handleDeleteDoctor = async (doctor) => {
    const id = doctor.id || doctor.practitioner_id;
    if (
      !window.confirm(
        `Are you sure you want to delete ${doctor.name}? This will mark them inactive and remove them from the directory.`
      )
    ) {
      return;
    }

    try {
      await doctorService.deleteDoctor(id);
      toast.success(`${doctor.name} removed successfully`);
      await loadDoctors();
      if (selectedDoctor?.id === id || selectedDoctor?.practitioner_id === id) {
        setSelectedDoctor(doctors.find((d) => d.id !== id) || null);
      }
    } catch (err) {
      console.error("Delete doctor error:", err);
      toast.error("Failed to delete doctor");
    }
  };

  // Switch to Duty Roster tab for specific doctor
  const handleViewRosterForDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setActiveTab("roster");
  };

  // Open Schedule Slot Modal
  const handleOpenScheduleModal = (slot = null, defaultDay = 1) => {
    if (!selectedDoctor) {
      toast.error("Please select a doctor first");
      return;
    }

    if (slot) {
      setEditingSchedule(slot);
      setScheduleFormData({
        day_of_week: slot.day_of_week,
        start_time: (slot.start_time || "09:00").substring(0, 5),
        end_time: (slot.end_time || "14:00").substring(0, 5),
        slot_minutes: slot.slot_minutes || 15,
        consultation_mode: slot.consultation_mode || "both",
      });
    } else {
      setEditingSchedule(null);
      setScheduleFormData({
        day_of_week: defaultDay,
        start_time: "09:00",
        end_time: "14:00",
        slot_minutes: 15,
        consultation_mode: "both",
      });
    }
    setScheduleModalOpen(true);
  };

  // Save Schedule Slot
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    const docId = selectedDoctor.practitioner_id || selectedDoctor.id;

    try {
      setSubmittingSchedule(true);
      if (editingSchedule) {
        await doctorService.updateSchedule(docId, editingSchedule.id, scheduleFormData);
        toast.success("Schedule slot updated successfully");
      } else {
        await doctorService.createSchedule(docId, scheduleFormData);
        toast.success("Schedule slot added successfully");
      }
      setScheduleModalOpen(false);
      loadSchedules(docId);
    } catch (err) {
      console.error("Save schedule error:", err);
      toast.error("Failed to save schedule slot");
    } finally {
      setSubmittingSchedule(false);
    }
  };

  // Delete Schedule Slot
  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm("Are you sure you want to remove this duty roster time slot?")) {
      return;
    }
    const docId = selectedDoctor.practitioner_id || selectedDoctor.id;
    try {
      await doctorService.deleteSchedule(docId, scheduleId);
      toast.success("Schedule slot removed");
      loadSchedules(docId);
    } catch (err) {
      console.error("Delete schedule error:", err);
      toast.error("Failed to delete schedule slot");
    }
  };

  return (
    <PageContainer>
      <div className={styles.container}>
        {/* Page Header */}
        <PageHeader
          title="Doctor Management & Duty Roster"
          subtitle="Manage doctor profiles, consultation fees, quotas, availability, and weekly duty rosters"
          icon={LuStethoscope}
          badge={`${stats.total} Total Doctors`}
          actions={
            <Button
              variant="primary"
              icon={LuPlus}
              onClick={() => handleOpenDoctorModal()}
            >
              Add New Doctor
            </Button>
          }
        />

        {/* Top 4 Stat Summary Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIconWrap} bg-blue-50 text-blue-600`}>
              <LuUsers size={22} />
            </div>
            <div>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total Doctors</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconWrap} bg-emerald-50 text-emerald-600`}>
              <LuUserCheck size={22} />
            </div>
            <div>
              <div className={styles.statValue}>{stats.active}</div>
              <div className={styles.statLabel}>Active / Available Now</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconWrap} bg-slate-100 text-slate-500`}>
              <LuActivity size={22} />
            </div>
            <div>
              <div className={styles.statValue}>{stats.inactive}</div>
              <div className={styles.statLabel}>On Leave / Inactive</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconWrap} bg-purple-50 text-purple-600`}>
              <LuAward size={22} />
            </div>
            <div>
              <div className={styles.statValue}>{stats.departments}</div>
              <div className={styles.statLabel}>Clinical Specialties</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabsContainer}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "directory" ? styles.activeTabBtn : ""}`}
            onClick={() => setActiveTab("directory")}
          >
            <LuUsers size={16} /> Doctor Profiles & Directory
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "roster" ? styles.activeTabBtn : ""}`}
            onClick={() => setActiveTab("roster")}
          >
            <LuCalendar size={16} /> Weekly Schedules & Duty Roster
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: DOCTOR DIRECTORY & CARDS                                        */}
        {/* ════════════════════════════════════════════════════════════════════════ */}
        {activeTab === "directory" && (
          <div>
            {/* Filter and Search Bar */}
            <div className={styles.toolbar}>
              <div className={styles.searchBox}>
                <LuSearch className={styles.searchIcon} size={18} />
                <input
                  type="text"
                  placeholder="Search doctor by name, phone, registration no..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <select
                  className={styles.filterSelect}
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                >
                  <option value="">All Specializations</option>
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>

                <select
                  className={styles.filterSelect}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>

                {(searchQuery || selectedSpecialization || statusFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSpecialization("");
                      setStatusFilter("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Doctors Grid */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader size="lg" text="Loading doctor profiles..." />
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <LuStethoscope size={48} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-700">No doctors found</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Try adjusting your search criteria or register a new doctor profile.
                </p>
                <Button
                  variant="primary"
                  icon={LuPlus}
                  className="mt-4"
                  onClick={() => handleOpenDoctorModal()}
                >
                  Add New Doctor
                </Button>
              </div>
            ) : (
              <div className={styles.cardsGrid}>
                {filteredDoctors.map((doc) => {
                  const initials = getInitials(doc.name);
                  return (
                    <div key={doc.id || doc.practitioner_id} className={styles.doctorCard}>
                      <div>
                        {/* Top Section: Avatar, Name, Toggle */}
                        <div className={styles.cardTop}>
                          <div className={styles.avatarAndInfo}>
                            <div className={styles.avatar}>
                              {doc.avatar ? (
                                <img
                                  src={doc.avatar}
                                  alt={doc.name}
                                  className={styles.avatarImg}
                                />
                              ) : (
                                <span>{initials}</span>
                              )}
                            </div>

                            <div className={styles.doctorInfo}>
                              <h3 className={styles.doctorName} title={doc.name}>
                                {doc.name}
                              </h3>
                              {doc.nameHindi && (
                                <p className={styles.doctorHindiName}>
                                  {doc.nameHindi}
                                </p>
                              )}
                              <p className={styles.doctorQualification}>
                                {doc.qualification}
                                {doc.qualificationHindi && (
                                  <span className="text-slate-400 font-normal">
                                    {" "}
                                    · {doc.qualificationHindi}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Quick Interactive Availability Toggle */}
                          <div className={styles.toggleSwitchContainer}>
                            <label
                              className={styles.switch}
                              title={doc.is_active ? "Click to set On Leave" : "Click to set Available"}
                            >
                              <input
                                type="checkbox"
                                checked={doc.is_active}
                                onChange={(e) => handleToggleActive(doc, e)}
                              />
                              <span className={styles.slider}></span>
                            </label>
                            <span
                              className={`${styles.switchLabel} ${
                                doc.is_active ? styles.activeText : styles.inactiveText
                              }`}
                            >
                              {doc.is_active ? "Available" : "On Leave"}
                            </span>
                          </div>
                        </div>

                        {/* Badges Row */}
                        <div className={styles.badgesRow}>
                          <span className={styles.deptBadge}>
                            <LuStethoscope size={11} />
                            {doc.specialization}
                          </span>
                          <span className={styles.genderBadge}>
                            {doc.gender === "female" ? "Female" : "Male"}
                          </span>
                          {doc.experience && (
                            <span className={styles.expBadge}>
                              <LuAward size={11} /> {doc.experience} Exp
                            </span>
                          )}
                          {doc.staff_code && (
                            <span className={styles.codeBadge}>{doc.staff_code}</span>
                          )}
                        </div>

                        {/* Consultation Fees Box */}
                        <div className={styles.feesCard}>
                          <div className={styles.feesGrid}>
                            <div className={styles.feeItem}>
                              <span className={styles.feeLabel}>New OPD</span>
                              <span className={styles.feeAmount}>
                                {formatCurrency(doc.consultation_fee)}
                              </span>
                            </div>
                            <div className={styles.feeItem}>
                              <span className={styles.feeLabel}>Re-visit</span>
                              <span className={styles.feeAmount}>
                                {formatCurrency(doc.old_patient_fee)}
                              </span>
                            </div>
                            <div className={styles.feeItem}>
                              <span className={styles.feeLabel}>Emergency</span>
                              <span className={styles.feeAmount}>
                                {formatCurrency(doc.emergency_fee)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Meta details list */}
                        <div className={styles.metaList}>
                          {doc.address && (
                            <div className={styles.metaItem}>
                              <LuMapPin size={14} className={styles.metaIcon} />
                              <span className={styles.metaText}>{doc.address}</span>
                            </div>
                          )}
                          <div className={styles.metaItem}>
                            <LuClock size={14} className={styles.metaIcon} />
                            <span className={styles.metaText}>{doc.displaySchedule}</span>
                          </div>
                          <div className={styles.metaItem}>
                            <LuUsers size={14} className={styles.metaIcon} />
                            <span className={styles.metaText}>
                              Daily Quota: Max {doc.maxNewPatients} New / {doc.maxOldPatients} Old
                            </span>
                          </div>
                          {doc.phone && (
                            <div className={styles.metaItem}>
                              <LuPhone size={14} className={styles.metaIcon} />
                              <span className={styles.metaText}>{doc.phone}</span>
                            </div>
                          )}
                          {doc.registration_no && (
                            <div className={styles.metaItem}>
                              <LuAward size={14} className={styles.metaIcon} />
                              <span className={styles.metaText}>
                                Reg: {doc.registration_no}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                          onClick={() => handleViewRosterForDoctor(doc)}
                          title="View weekly schedule for this doctor"
                        >
                          <LuCalendar size={14} /> Duty Roster
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleOpenDoctorModal(doc)}
                            title="Edit doctor profile"
                          >
                            <LuPencil size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => handleDeleteDoctor(doc)}
                            title="Remove doctor"
                          >
                            <LuTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: WEEKLY SCHEDULES & DUTY ROSTER                                  */}
        {/* ════════════════════════════════════════════════════════════════════════ */}
        {activeTab === "roster" && (
          <div className={styles.rosterContainer}>
            {/* Left Doctor Selector */}
            <div className={styles.doctorSelectorCard}>
              <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <LuUsers size={16} className="text-blue-600" /> Select Doctor
              </h3>

              <div className={styles.doctorListScroll}>
                {doctors.map((doc) => {
                  const isSelected =
                    selectedDoctor &&
                    (selectedDoctor.id === doc.id ||
                      selectedDoctor.practitioner_id === doc.practitioner_id);
                  const initials = getInitials(doc.name);

                  return (
                    <button
                      key={doc.id || doc.practitioner_id}
                      type="button"
                      className={`${styles.doctorListItem} ${
                        isSelected ? styles.doctorListItemActive : ""
                      }`}
                      onClick={() => setSelectedDoctor(doc)}
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {doc.avatar ? (
                          <img
                            src={doc.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-slate-800 truncate">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {doc.specialization}
                        </p>
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          doc.is_active ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Roster Content */}
            <div className={styles.rosterMain}>
              {selectedDoctor ? (
                <>
                  {/* Doctor Info Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 overflow-hidden shadow-sm">
                        {selectedDoctor.avatar ? (
                          <img
                            src={selectedDoctor.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(selectedDoctor.name)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">
                            {selectedDoctor.name}
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              selectedDoctor.is_active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {selectedDoctor.is_active ? "Active" : "On Leave"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {selectedDoctor.qualification} · {selectedDoctor.specialization}{" "}
                          {selectedDoctor.address ? `(${selectedDoctor.address})` : ""}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      icon={LuPlus}
                      onClick={() => handleOpenScheduleModal(null, 1)}
                    >
                      Add Schedule Slot
                    </Button>
                  </div>

                  {/* 7 Days of Week Visual Grid */}
                  {schedulesLoading ? (
                    <div className="py-20 flex justify-center">
                      <Loader text="Loading schedule slots..." />
                    </div>
                  ) : (
                    <div className={styles.daysGrid}>
                      {DAYS_OF_WEEK.map((day) => {
                        const daySlots = schedules.filter(
                          (s) => Number(s.day_of_week) === day.index
                        );

                        return (
                          <div key={day.index} className={styles.dayCard}>
                            <div className={styles.dayCardHeader}>
                              <div className="flex items-center gap-2">
                                <span className={styles.dayName}>{day.name}</span>
                                <span className={styles.daySlotsCount}>
                                  {daySlots.length} {daySlots.length === 1 ? "slot" : "slots"}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"
                                onClick={() => handleOpenScheduleModal(null, day.index)}
                                title={`Add slot for ${day.name}`}
                              >
                                <LuPlus size={14} /> Add
                              </button>
                            </div>

                            {daySlots.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {daySlots.map((slot) => (
                                  <div key={slot.id} className={styles.slotItem}>
                                    <div>
                                      <div className={styles.slotTime}>
                                        {(slot.start_time || "").substring(0, 5)} -{" "}
                                        {(slot.end_time || "").substring(0, 5)}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={styles.slotMode}>
                                          {(slot.consultation_mode || "both").replace("_", " ")}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                          {slot.slot_minutes || 15}m per patient
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenScheduleModal(slot)}
                                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                        title="Edit slot"
                                      >
                                        <LuPencil size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSchedule(slot.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                        title="Delete slot"
                                      >
                                        <LuTrash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={styles.emptySlots}>No duty hours scheduled</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 text-center text-slate-400">
                  <LuCalendar size={48} className="mx-auto mb-2 text-slate-300" />
                  <p>Select a doctor from the list to view and configure duty hours.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════ */}
        {/* MODAL: ADD / EDIT DOCTOR                                               */}
        {/* ════════════════════════════════════════════════════════════════════════ */}
        <Modal
          isOpen={doctorModalOpen}
          onClose={() => setDoctorModalOpen(false)}
          title={editingDoctor ? "Edit Doctor Profile" : "Register New Doctor"}
          maxWidth="max-w-3xl"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDoctorModalOpen(false)}
                disabled={submittingDoctor}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveDoctor}
                loading={submittingDoctor}
                icon={LuCheck}
              >
                {editingDoctor ? "Update Profile" : "Save Doctor"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveDoctor} className={styles.modalForm}>
            {/* Photo Upload Section */}
            <div className={styles.photoUploadContainer}>
              <div className={styles.photoPreviewCircle}>
                {doctorFormData.avatar ? (
                  <img
                    src={doctorFormData.avatar}
                    alt="Preview"
                    className={styles.photoPreviewImg}
                  />
                ) : (
                  <span className="text-slate-400 text-xs font-semibold text-center px-1">
                    No Photo
                  </span>
                )}
              </div>

              <div className={styles.photoUploadActions}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={LuUpload}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Photo
                  </Button>
                  {doctorFormData.avatar && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setDoctorFormData((prev) => ({ ...prev, avatar: "" }))}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Recommended: Square JPG or PNG, under 2MB.
                </p>
              </div>
            </div>

            {/* Section 1: Basic Identity */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                <LuUsers size={16} /> Basic Doctor Information
              </h4>
              <div className={styles.formGrid2}>
                <Input
                  label="Doctor Full Name (English)"
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={doctorFormData.name}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, name: e.target.value })
                  }
                  required
                />
                <Input
                  label="Doctor Name (Hindi)"
                  placeholder="e.g. डॉ. राजेश शर्मा"
                  value={doctorFormData.nameHindi}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, nameHindi: e.target.value })
                  }
                />
              </div>

              <div className={`${styles.formGrid3} mt-3`}>
                <Select
                  label="Gender"
                  value={doctorFormData.gender}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, gender: e.target.value })
                  }
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>

                <Input
                  label="Medical Registration No."
                  placeholder="e.g. MCI-48201"
                  value={doctorFormData.registration_no}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, registration_no: e.target.value })
                  }
                />

                <Input
                  label="Designation / Role"
                  placeholder="e.g. Senior Consultant"
                  value={doctorFormData.role}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, role: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Section 2: Clinical Specialty & Qualifications */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                <LuAward size={16} /> Qualifications & Department
              </h4>
              <div className={styles.formGrid2}>
                <Select
                  label="Clinical Specialization"
                  value={doctorFormData.specialization}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, specialization: e.target.value })
                  }
                  required
                >
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Specialization in Hindi"
                  placeholder="e.g. सामान्य एवं लैप्रोस्कोपिक सर्जरी"
                  value={doctorFormData.specializationHindi}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, specializationHindi: e.target.value })
                  }
                />
              </div>

              <div className={`${styles.formGrid2} mt-3`}>
                <Select
                  label="Primary Medical Degree"
                  value={doctorFormData.qualification}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, qualification: e.target.value })
                  }
                  required
                >
                  {DEGREE_OPTIONS.map((deg) => (
                    <option key={deg} value={deg}>
                      {deg}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Qualification in Hindi"
                  placeholder="e.g. एम.बी.बी.एस., एम.एस."
                  value={doctorFormData.qualificationHindi}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, qualificationHindi: e.target.value })
                  }
                />
              </div>

              {doctorFormData.qualification === "Other / Custom..." && (
                <div className="mt-3">
                  <Input
                    label="Custom Qualification (Enter Degree Name)"
                    placeholder="e.g. MBBS, Fellowship in Diabetology"
                    value={customQualification}
                    onChange={(e) => setCustomQualification(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className={`${styles.formGrid2} mt-3`}>
                <Input
                  label="Sub-specialty / Focus Area"
                  placeholder="e.g. Advanced Laparoscopy & GI Surgery"
                  value={doctorFormData.specialty}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, specialty: e.target.value })
                  }
                />

                <Input
                  label="Years of Experience"
                  placeholder="e.g. 14 Years"
                  value={doctorFormData.experience}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, experience: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Section 3: Consultation Fees */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                <LuIndianRupee size={16} /> Consultation Fee Tiers (₹)
              </h4>
              <div className={styles.formGrid3}>
                <Input
                  label="New Patient Fee (₹)"
                  type="number"
                  min="0"
                  value={doctorFormData.consultation_fee}
                  onChange={(e) =>
                    setDoctorFormData({
                      ...doctorFormData,
                      consultation_fee: e.target.value,
                    })
                  }
                  required
                />
                <Input
                  label="Follow-up / Old Patient (₹)"
                  type="number"
                  min="0"
                  value={doctorFormData.old_patient_fee}
                  onChange={(e) =>
                    setDoctorFormData({
                      ...doctorFormData,
                      old_patient_fee: e.target.value,
                    })
                  }
                  required
                />
                <Input
                  label="Emergency / Urgent (₹)"
                  type="number"
                  min="0"
                  value={doctorFormData.emergency_fee}
                  onChange={(e) =>
                    setDoctorFormData({
                      ...doctorFormData,
                      emergency_fee: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Section 4: Timings & Quotas */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                <LuClock size={16} /> OPD Chamber & Daily Quotas
              </h4>
              <div className={styles.formGrid2}>
                <Input
                  label="OPD Chamber / Room"
                  placeholder="e.g. OPD Room 101, Ground Floor"
                  value={doctorFormData.address}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, address: e.target.value })
                  }
                />

                <Input
                  label="General Schedule Display Text"
                  placeholder="e.g. Mon - Sat: 09:00 AM - 02:00 PM"
                  value={doctorFormData.displaySchedule}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, displaySchedule: e.target.value })
                  }
                />
              </div>

              <div className={`${styles.formGrid2} mt-3`}>
                <Input
                  label="Max New Patients / Day"
                  type="number"
                  min="1"
                  value={doctorFormData.maxNewPatients}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, maxNewPatients: e.target.value })
                  }
                />

                <Input
                  label="Max Old Patients / Day"
                  type="number"
                  min="1"
                  value={doctorFormData.maxOldPatients}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, maxOldPatients: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Section 5: Contact Details */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                <LuPhone size={16} /> Contact Information
              </h4>
              <div className={styles.formGrid2}>
                <Input
                  label="Contact Phone"
                  placeholder="e.g. +91 98765 43210"
                  value={doctorFormData.phone}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, phone: e.target.value })
                  }
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. doctor@hospital.com"
                  value={doctorFormData.email}
                  onChange={(e) =>
                    setDoctorFormData({ ...doctorFormData, email: e.target.value })
                  }
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════════ */}
        {/* MODAL: ADD / EDIT SCHEDULE SLOT                                        */}
        {/* ════════════════════════════════════════════════════════════════════════ */}
        <Modal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          title={editingSchedule ? "Edit Schedule Slot" : "Add Schedule Slot"}
          maxWidth="max-w-md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setScheduleModalOpen(false)}
                disabled={submittingSchedule}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveSchedule}
                loading={submittingSchedule}
                icon={LuCheck}
              >
                {editingSchedule ? "Save Changes" : "Add Slot"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveSchedule} className="space-y-4">
            <Select
              label="Day of Week"
              value={scheduleFormData.day_of_week}
              onChange={(e) =>
                setScheduleFormData({
                  ...scheduleFormData,
                  day_of_week: parseInt(e.target.value, 10),
                })
              }
              required
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.index} value={d.index}>
                  {d.name}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Time"
                type="time"
                value={scheduleFormData.start_time}
                onChange={(e) =>
                  setScheduleFormData({ ...scheduleFormData, start_time: e.target.value })
                }
                required
              />
              <Input
                label="End Time"
                type="time"
                value={scheduleFormData.end_time}
                onChange={(e) =>
                  setScheduleFormData({ ...scheduleFormData, end_time: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Consultation Mode"
                value={scheduleFormData.consultation_mode}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    consultation_mode: e.target.value,
                  })
                }
                required
              >
                <option value="both">Both (In-Person & Teleconsult)</option>
                <option value="in_person">In-Person Only</option>
                <option value="teleconsult">Teleconsult Only</option>
              </Select>

              <Input
                label="Slot Duration (mins)"
                type="number"
                min="5"
                step="5"
                value={scheduleFormData.slot_minutes}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    slot_minutes: parseInt(e.target.value, 10) || 15,
                  })
                }
                required
              />
            </div>
          </form>
        </Modal>
      </div>
    </PageContainer>
  );
}
