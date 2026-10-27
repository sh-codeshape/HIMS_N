import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import ipdService from "../../../api/services/ipdService";
import patientService from "../../../api/services/patientService";
import staffService from "../../../api/services/staffService";
import "./BedMatrixGrid.css";

const FALLBACK_BEDS = [
  { id: 1, bed_no: "GW-101-B1", ward_name: "General Ward", room_name: "Room GW-101", current_status: "available", daily_rate: 800 },
  { id: 2, bed_no: "GW-101-B2", ward_name: "General Ward", room_name: "Room GW-101", current_status: "available", daily_rate: 800 },
  { id: 3, bed_no: "GW-101-B3", ward_name: "General Ward", room_name: "Room GW-101", current_status: "occupied", patient_first_name: "Suman", patient_last_name: "Yadav", patient_uhid: "1026-0062", doctor_first_name: "Sadhana", doctor_last_name: "Chaurasiya", admitted_at: "2026-10-22T09:30:00Z", admission_id: "adm-103", daily_rate: 800 },
  { id: 4, bed_no: "GW-101-B4", ward_name: "General Ward", room_name: "Room GW-101", current_status: "maintenance", daily_rate: 800 },
  { id: 5, bed_no: "GW-102-B1", ward_name: "General Ward", room_name: "Room GW-102", current_status: "available", daily_rate: 800 },
  { id: 6, bed_no: "GW-102-B2", ward_name: "General Ward", room_name: "Room GW-102", current_status: "occupied", patient_first_name: "Rohan", patient_last_name: "Sharma", patient_uhid: "1026-0063", doctor_first_name: "Akhilesh", doctor_last_name: "Singh", admitted_at: "2026-10-24T11:15:00Z", admission_id: "adm-106", daily_rate: 800 },
  { id: 7, bed_no: "ICU-01", ward_name: "ICU", room_name: "Critical Bay 1", current_status: "available", daily_rate: 3500 },
  { id: 8, bed_no: "ICU-02", ward_name: "ICU", room_name: "Critical Bay 1", current_status: "occupied", patient_first_name: "Anita", patient_last_name: "Patel", patient_uhid: "1026-0071", doctor_first_name: "Anand", doctor_last_name: "Tiwari", admitted_at: "2026-10-25T14:00:00Z", admission_id: "adm-108", daily_rate: 3500 },
  { id: 9, bed_no: "PVT-201", ward_name: "Private Ward", room_name: "Deluxe Suite 201", current_status: "available", daily_rate: 2400 },
  { id: 10, bed_no: "PVT-202", ward_name: "Private Ward", room_name: "Deluxe Suite 202", current_status: "occupied", patient_first_name: "Shyam", patient_last_name: "Tripathi", patient_uhid: "1026-0074", doctor_first_name: "Meenakshi", doctor_last_name: "Iyer", admitted_at: "2026-10-26T08:45:00Z", admission_id: "adm-110", daily_rate: 2400 },
  { id: 11, bed_no: "SP-301-A", ward_name: "Semi-Private", room_name: "Room 301", current_status: "available", daily_rate: 1500 },
  { id: 12, bed_no: "EMG-01", ward_name: "Emergency", room_name: "Trauma Bay", current_status: "available", daily_rate: 1800 },
];

export default function BedMatrixGrid() {
  const [beds, setBeds] = useState(FALLBACK_BEDS);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filterWard, setFilterWard] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBed, setSelectedBed] = useState(null);
  const [assignPatientId, setAssignPatientId] = useState("");
  const [assignDoctorId, setAssignDoctorId] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bedsData, patientsData, staffData] = await Promise.all([
        ipdService.getBedMatrix().catch(() => FALLBACK_BEDS),
        patientService.getAll().catch(() => []),
        staffService.getDoctors().catch(() => []),
      ]);
      setBeds(Array.isArray(bedsData) && bedsData.length ? bedsData : FALLBACK_BEDS);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setDoctors(Array.isArray(staffData) ? staffData : []);
    } catch (err) {
      console.error(err);
      setBeds(FALLBACK_BEDS);
      setPatients([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered beds based on Ward, Status, and Search Query
  const filteredBeds = beds.filter((b) => {
    // Ward filter
    const matchWard =
      filterWard === "All" ||
      b.ward_name?.toLowerCase().includes(filterWard.toLowerCase());

    // Status filter
    const statusNorm = (b.current_status || "available").toLowerCase();
    const matchStatus =
      filterStatus === "All" ||
      statusNorm === filterStatus.toLowerCase();

    // Search query
    const query = searchQuery.trim().toLowerCase();
    const matchSearch =
      !query ||
      b.bed_no?.toLowerCase().includes(query) ||
      b.room_name?.toLowerCase().includes(query) ||
      b.ward_name?.toLowerCase().includes(query) ||
      `${b.patient_first_name || ""} ${b.patient_last_name || ""}`.toLowerCase().includes(query) ||
      b.patient_uhid?.toLowerCase().includes(query);

    return matchWard && matchStatus && matchSearch;
  });

  // KPI Calculations
  const totalBeds = beds.length;
  const availableBeds = beds.filter((b) => (b.current_status || "available").toLowerCase() === "available").length;
  const occupiedBeds = beds.filter((b) => (b.current_status || "").toLowerCase() === "occupied").length;
  const maintenanceBeds = beds.filter((b) => (b.current_status || "").toLowerCase() === "maintenance").length;
  const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const handleAllotBed = async (e) => {
    e.preventDefault();
    if (!selectedBed || !assignPatientId) {
      toast.error("Please select a patient for bed allotment.");
      return;
    }

    try {
      await ipdService.admitPatient({
        facility_id: "00000000-0000-0000-0000-000000000000",
        patient_id: assignPatientId,
        bed_id: selectedBed.id,
        admitting_practitioner_id: assignDoctorId || null,
        admission_type: "elective",
      });
      toast.success(`Bed ${selectedBed.bed_no} allotted successfully!`, { icon: "🛏️" });
      setSelectedBed(null);
      setAssignPatientId("");
      setAssignDoctorId("");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to allot bed.");
    }
  };

  const handleVacateBed = async (bed) => {
    if (!bed.admission_id) {
      toast.error("No active admission found for this bed.");
      return;
    }
    try {
      await ipdService.dischargePatient(bed.admission_id, {
        discharge_type: "normal",
        discharge_condition: "Stable",
      });
      toast.success(`Bed ${bed.bed_no} is now vacant and ready for sanitization.`, { icon: "🧹" });
      setSelectedBed(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to vacate bed.");
    }
  };

  const getInitials = (firstName, lastName) => {
    const f = firstName ? firstName[0].toUpperCase() : "";
    const l = lastName ? lastName[0].toUpperCase() : "";
    return `${f}${l}` || "P";
  };

  return (
    <div className="ipd-bed-page">

      {/* ── 1. PAGE HEADER ── */}
      <div className="ipd-header">
        <div className="ipd-header-left">
          <div className="ipd-header-icon">
            <Icon name="LuBedDouble" size={24} />
          </div>
          <div>
            <h1 className="ipd-title">IPD Bed Allotment &amp; Ward Matrix</h1>
           
          </div>
        </div>

        <div className="ipd-header-right">
         

         
        </div>
      </div>


      {/* ── 3. CONTROLS & FILTER TOOLBAR ── */}
      <div className="ipd-toolbar-card">
        <div className="ipd-toolbar-row">
          {/* Ward Filters */}
          <div className="ipd-ward-filters">
            <span className="ipd-ward-label">Wards:</span>
            {["All", "General", "ICU", "Private", "Semi-Private", "Emergency"].map((w) => (
              <button
                key={w}
                type="button"
                className={`ipd-filter-btn ${filterWard === w ? "ipd-filter-btn--active" : ""}`}
                onClick={() => setFilterWard(w)}
              >
                {w === "All" ? "All Wards" : w}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="ipd-filter-right">
            <div className="ipd-search-wrap">
              <Icon name="LuSearch" size={15} />
              <input
                type="text"
                placeholder="Search bed no, patient name, UHID, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onClick={() => setSearchQuery("")}
                >
                  <Icon name="LuX" size={14} />
                </button>
              )}
            </div>

            {/* Status Legend Pills */}
            <div className="ipd-legend-pills">
              <span
                className={`ipd-legend-pill ${filterStatus === "All" ? "ipd-legend-pill--all" : ""}`}
                onClick={() => setFilterStatus("All")}
              >
                All ({totalBeds})
              </span>
              <span
                className={`ipd-legend-pill ipd-legend-pill--avail`}
                onClick={() => setFilterStatus("available")}
                style={filterStatus === "available" ? { boxShadow: "0 0 0 2px #059669" } : {}}
              >
                <span className="ipd-pulse-dot" /> Available ({availableBeds})
              </span>
              <span
                className={`ipd-legend-pill ipd-legend-pill--occ`}
                onClick={() => setFilterStatus("occupied")}
                style={filterStatus === "occupied" ? { boxShadow: "0 0 0 2px #dc2626" } : {}}
              >
                <span className="ipd-pulse-dot" /> Occupied ({occupiedBeds})
              </span>
              <span
                className={`ipd-legend-pill ipd-legend-pill--maint`}
                onClick={() => setFilterStatus("maintenance")}
                style={filterStatus === "maintenance" ? { boxShadow: "0 0 0 2px #d97706" } : {}}
              >
                <span className="ipd-pulse-dot" /> Maint. ({maintenanceBeds})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. EYE-CATCHING BED CARDS GRID ── */}
      {filteredBeds.length === 0 ? (
        <div className="ipd-empty-box">
          <div className="ipd-empty-icon">
            <Icon name="LuBed" size={28} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "var(--navy-900)" }}>No Beds Found</h3>
          <p style={{ margin: 0, fontSize: 13 }}>
            No beds match your selected ward or search criteria. Try selecting another ward or clearing your search.
          </p>
        </div>
      ) : (
        <div className="ipd-grid-layout">
          {filteredBeds.map((bed) => {
            const status = (bed.current_status || "available").toLowerCase();
            const isAvailable = status === "available";
            const isOccupied = status === "occupied";
            const isMaintenance = status === "maintenance";

            return (
              <div
                key={bed.id}
                className={`bed-card bed-card--${status}`}
              >
                <div>
                  {/* Card Header: Bed No & Status Badge */}
                  <div className="bed-card-head">
                    <div className="bed-card-no-wrap">
                      <div className="bed-card-icon-pill">
                        <Icon name="LuBed" size={16} />
                      </div>
                      <span className="bed-card-no">{bed.bed_no}</span>
                    </div>

                    <span className={`bed-status-badge bed-status-badge--${status}`}>
                      <i />
                      {status === "available" ? "Available" : status === "occupied" ? "Occupied" : "Maintenance"}
                    </span>
                  </div>

                  {/* Ward & Room Tag */}
                  <div className="bed-card-meta">
                    <div className="bed-meta-location">
                      <Icon name="LuDoorOpen" size={13} />
                      <span>{bed.ward_name} • {bed.room_name}</span>
                    </div>
                    {bed.daily_rate && (
                      <span className="bed-meta-rate">₹{bed.daily_rate}/day</span>
                    )}
                  </div>

                  {/* Body: Available State */}
                  {isAvailable && (
                    <div className="bed-vacant-view">
                      <div className="bed-vacant-icon">
                        <Icon name="LuSparkles" size={20} />
                      </div>
                      <span className="bed-vacant-title">Vacant &amp; Sanitized</span>
                      <span className="bed-vacant-hint">Ready for immediate patient allotment</span>
                    </div>
                  )}

                  {/* Body: Occupied State */}
                  {isOccupied && (
                    <div className="bed-patient-view">
                      <div className="bed-patient-top">
                        <div className="bed-patient-avatar">
                          {getInitials(bed.patient_first_name, bed.patient_last_name)}
                        </div>
                        <div className="bed-patient-info">
                          <div className="bed-pname">
                            {bed.patient_first_name} {bed.patient_last_name}
                          </div>
                          <div className="bed-puhid">
                            {bed.patient_uhid || "UHID: —"}
                          </div>
                        </div>
                      </div>

                      <div className="bed-patient-doctor">
                        <Icon name="LuStethoscope" size={13} style={{ color: "#1e5a8e" }} />
                        <span>Dr. {bed.doctor_first_name || "Assigned"} {bed.doctor_last_name || "Doctor"}</span>
                      </div>

                      {bed.admitted_at && (
                        <div className="bed-patient-date">
                          Admitted: {new Date(bed.admitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Body: Maintenance State */}
                  {isMaintenance && (
                    <div className="bed-maint-view">
                      <div className="bed-maint-icon">
                        <Icon name="LuWrench" size={20} />
                      </div>
                      <span className="bed-maint-title">Under Maintenance</span>
                      <span className="bed-maint-hint">Deep cleaning &amp; sanitization in progress</span>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <div>
                  {isAvailable && (
                    <button
                      type="button"
                      className="bed-action-btn bed-action-btn--allot"
                      onClick={() => setSelectedBed(bed)}
                    >
                      <Icon name="LuPlus" size={15} /> Allot This Bed
                    </button>
                  )}

                  {isOccupied && (
                    <button
                      type="button"
                      className="bed-action-btn bed-action-btn--manage"
                      onClick={() => setSelectedBed(bed)}
                    >
                      <Icon name="LuUserCheck" size={15} /> Manage / Discharge
                    </button>
                  )}

                  {isMaintenance && (
                    <button
                      type="button"
                      className="bed-action-btn bed-action-btn--ready"
                      onClick={() => {
                        toast.success(`Bed ${bed.bed_no} marked as sanitized & ready!`);
                        setBeds((prev) =>
                          prev.map((b) => (b.id === bed.id ? { ...b, current_status: "available" } : b))
                        );
                      }}
                    >
                      <Icon name="LuCheckCircle" size={15} /> Mark as Sanitized
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. BED ACTION MODAL (ALLOTMENT & MANAGEMENT) ── */}
      {selectedBed && (
        <div className="ipd-modal-overlay" onClick={() => setSelectedBed(null)}>
          <div className="ipd-modal-content" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="ipd-modal-header">
              <div className="ipd-modal-head-left">
                <div className="ipd-modal-head-icon">
                  <Icon name="LuBed" size={20} />
                </div>
                <div>
                  <h3>
                    {selectedBed.current_status === "occupied" ? "Inpatient Bed Details" : "Allot Inpatient Bed"}
                  </h3>
                  <div className="ipd-modal-subtitle">
                    Bed #{selectedBed.bed_no} • {selectedBed.ward_name} ({selectedBed.room_name})
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="ipd-modal-close-btn"
                onClick={() => setSelectedBed(null)}
                title="Close"
              >
                <Icon name="LuCircleX" size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="ipd-modal-body">
              {/* Bed Summary Banner */}
              <div className="ipd-banner-summary">
                <div>
                  <div className="ipd-banner-bed-no">Bed #{selectedBed.bed_no}</div>
                  <div className="ipd-banner-bed-ward">{selectedBed.ward_name} • {selectedBed.room_name}</div>
                </div>
                <span className={`bed-status-badge bed-status-badge--${(selectedBed.current_status || "available").toLowerCase()}`}>
                  <i /> {selectedBed.current_status || "Available"}
                </span>
              </div>

              {selectedBed.current_status === "occupied" ? (
                /* Occupied View */
                <div>
                  <table className="ipd-occ-details-table">
                    <tbody>
                      <tr>
                        <td className="ipd-occ-lbl">Patient Full Name</td>
                        <td className="ipd-occ-val">
                          <strong>{selectedBed.patient_first_name} {selectedBed.patient_last_name}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="ipd-occ-lbl">UHID Number</td>
                        <td className="ipd-occ-val" style={{ color: "#1d4ed8", fontWeight: 800 }}>
                          {selectedBed.patient_uhid || "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="ipd-occ-lbl">Attending Doctor</td>
                        <td className="ipd-occ-val">
                          Dr. {selectedBed.doctor_first_name} {selectedBed.doctor_last_name}
                        </td>
                      </tr>
                      <tr>
                        <td className="ipd-occ-lbl">Admission Time</td>
                        <td className="ipd-occ-val">
                          {selectedBed.admitted_at ? new Date(selectedBed.admitted_at).toLocaleString("en-IN") : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="ipd-occ-lbl">Daily Room Rate</td>
                        <td className="ipd-occ-val">
                          ₹{selectedBed.daily_rate || 800} / day
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Allotment Form */
                <form id="bed-allot-form" onSubmit={handleAllotBed} className="ipd-allot-form">
                  <div className="ipd-form-group">
                    <label className="ipd-form-label">Select Patient to Admit *</label>
                    <select
                      className="ipd-form-select"
                      value={assignPatientId}
                      onChange={(e) => setAssignPatientId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Registered Patient --</option>
                      {patients.map((p) => {
                        const pName = p.full_name || p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim();
                        return (
                          <option key={p.id} value={p.id}>
                            {pName} ({p.uhid || "No UHID"}) • {p.gender || "—"} • {p.phone || p.mobile1 || ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="ipd-form-group">
                    <label className="ipd-form-label">Attending Doctor</label>
                    <select
                      className="ipd-form-select"
                      value={assignDoctorId}
                      onChange={(e) => setAssignDoctorId(e.target.value)}
                    >
                      <option value="">-- Select Incharge Doctor --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.first_name || d.name} {d.last_name || ""} ({d.department || "General"})
                        </option>
                      ))}
                    </select>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="ipd-modal-footer">
              <button
                type="button"
                className="ipd-btn-cancel"
                onClick={() => setSelectedBed(null)}
              >
                Close
              </button>

              {selectedBed.current_status === "occupied" ? (
                <button
                  type="button"
                  className="ipd-btn-vacate"
                  onClick={() => handleVacateBed(selectedBed)}
                >
                  <Icon name="LuLogOut" size={15} /> Discharge / Vacate Bed
                </button>
              ) : (
                <button
                  type="submit"
                  form="bed-allot-form"
                  className="ipd-btn-confirm"
                >
                  <Icon name="LuCheck" size={16} /> Confirm Bed Allotment
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
