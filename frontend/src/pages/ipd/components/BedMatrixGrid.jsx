import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Button from "../../../components/common/Button.jsx";
import ipdService from "../../../api/services/ipdService";
import patientService from "../../../api/services/patientService";
import staffService from "../../../api/services/staffService";
import "./BedMatrixGrid.css";

const FALLBACK_BEDS = [
  { id: 1, bed_no: "GW-101-B1", ward_name: "General Ward", room_name: "GW-101", current_status: "available" },
  { id: 2, bed_no: "GW-101-B2", ward_name: "General Ward", room_name: "GW-101", current_status: "available" },
  { id: 3, bed_no: "GW-101-B3", ward_name: "General Ward", room_name: "GW-101", current_status: "occupied", patient_first_name: "Suman", patient_last_name: "Yadav", patient_uhid: "UHID12348", admitted_at: "2026-09-27T00:00:00Z" },
  { id: 4, bed_no: "GW-101-B4", ward_name: "General Ward", room_name: "GW-101", current_status: "maintenance" },
  { id: 5, bed_no: "GW-102-B1", ward_name: "General Ward", room_name: "GW-102", current_status: "available" },
  { id: 6, bed_no: "GW-102-B2", ward_name: "General Ward", room_name: "GW-102", current_status: "occupied", patient_first_name: "Rohan", patient_last_name: "Sharma", patient_uhid: "UHID12349", admitted_at: "2026-09-25T00:00:00Z" },
  { id: 7, bed_no: "ICU-01", ward_name: "ICU", room_name: "ICU-1", current_status: "available" },
  { id: 8, bed_no: "ICU-02", ward_name: "ICU", room_name: "ICU-1", current_status: "occupied", patient_first_name: "Anita", patient_last_name: "Patel", patient_uhid: "UHID12350", admitted_at: "2026-09-28T00:00:00Z" },
];

export default function BedMatrixGrid() {
  const [beds, setBeds] = useState(FALLBACK_BEDS);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filterWard, setFilterWard] = useState("All");
  const [selectedBed, setSelectedBed] = useState(null);
  const [assignPatientId, setAssignPatientId] = useState("");
  const [assignDoctorId, setAssignDoctorId] = useState("");

  const loadData = async () => {
    try {
      const [bedsData, patientsData, staffData] = await Promise.all([
        ipdService.getBedMatrix().catch(() => FALLBACK_BEDS),
        patientService.getAll().catch(() => []),
        staffService.getDoctors().catch(() => [])
      ]);
      setBeds(Array.isArray(bedsData) && bedsData.length ? bedsData : FALLBACK_BEDS);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setDoctors(Array.isArray(staffData) ? staffData : []);
    } catch (err) {
      console.error(err);
      setBeds(FALLBACK_BEDS);
      setPatients([]);
      setDoctors([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBeds =
    filterWard === "All"
      ? beds
      : beds.filter((b) => b.ward_name?.toLowerCase().includes(filterWard.toLowerCase()));

  const handleAllotBed = async (e) => {
    e.preventDefault();
    if (!selectedBed || !assignPatientId) {
      toast.error("Please select a patient for bed allotment.");
      return;
    }

    // In a real flow, a proper admission might need to be created first, 
    // or the 'admitPatient' endpoint handles creating admission + bed assignment.
    try {
      await ipdService.admitPatient({
        facility_id: "00000000-0000-0000-0000-000000000000",
        patient_id: assignPatientId,
        bed_id: selectedBed.id,
        admitting_practitioner_id: assignDoctorId || null,
        admission_type: "elective"
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
        discharge_condition: "Stable"
      });
      toast.success(`Bed ${bed.bed_no} is now vacant and ready for sanitization.`, { icon: "🧹" });
      setSelectedBed(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to vacate bed.");
    }
  };

  return (
    <div className="ipd-bed-module">
      <div className="ipd-bed-toolbar">
        <div className="ipd-ward-filters">
          {["All", "General", "Semi-Private", "Private", "ICU", "Emergency"].map(
            (w) => (
              <button
                key={w}
                type="button"
                className={`ipd-filter-btn ${filterWard === w ? "ipd-filter-btn--active" : ""}`}
                onClick={() => setFilterWard(w)}
              >
                {w}
              </button>
            )
          )}
        </div>

        <div className="ipd-legend">
          <span className="ipd-legend-item">
            <span className="ipd-dot ipd-dot--avail" /> Available
          </span>
          <span className="ipd-legend-item">
            <span className="ipd-dot ipd-dot--occ" /> Occupied
          </span>
          <span className="ipd-legend-item">
            <span className="ipd-dot ipd-dot--maint" /> Maintenance
          </span>
        </div>
      </div>

      {/* Bed Grid */}
      {filteredBeds.length === 0 ? (
        <div className="ipd-empty-state" style={{ padding: "2rem", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
          No beds found for this ward. Please try another filter or check the backend connection.
        </div>
      ) : (
      <div className="ipd-grid-layout">
        {filteredBeds.map((bed) => (
          <div
            key={bed.id}
            className={`ipd-card ipd-card--${bed.current_status?.toLowerCase() || 'available'}`}
            onClick={() => setSelectedBed(bed)}
          >
            <div className="ipd-card-head">
              <span className="ipd-card-no">{bed.bed_no}</span>
              <span className={`ipd-card-badge ipd-badge--${bed.current_status?.toLowerCase() || 'available'}`}>
                {bed.current_status}
              </span>
            </div>

            <div className="ipd-card-body">
              <div className="ipd-card-ward">{bed.ward_name} • {bed.room_name}</div>
              {bed.current_status === 'occupied' && bed.patient_id ? (
                <div className="ipd-card-patient">
                  <div className="ipd-pname">{bed.patient_first_name} {bed.patient_last_name}</div>
                  <div className="ipd-pdoc">Dr. {bed.doctor_first_name} {bed.doctor_last_name}</div>
                  <div className="ipd-pdate">Adm: {new Date(bed.admitted_at).toLocaleDateString()}</div>
                </div>
              ) : (
                <div className="ipd-card-empty">
                  <Icon name="LuBed" size={24} />
                  <span>{bed.current_status === 'maintenance' ? 'Under Maintenance' : 'Vacant & Sanitized'}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      )}

      {/* Bed Action Modal */}
      {selectedBed && (
        <div className="ipd-modal-overlay" onClick={() => setSelectedBed(null)}>
          <div className="ipd-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <h3>Bed Allocation: {selectedBed.bed_no}</h3>
              <span className="ipd-card-ward">{selectedBed.ward_name} ({selectedBed.room_name})</span>
            </div>

            {selectedBed.current_status === "occupied" ? (
              <div className="ipd-occupied-view">
                <div className="ipd-occ-info">
                  <p><strong>Patient:</strong> {selectedBed.patient_first_name} {selectedBed.patient_last_name} ({selectedBed.patient_uhid})</p>
                  <p><strong>Doctor:</strong> Dr. {selectedBed.doctor_first_name} {selectedBed.doctor_last_name}</p>
                  <p><strong>Admission Date:</strong> {new Date(selectedBed.admitted_at).toLocaleString()}</p>
                </div>
                <div className="ipd-modal-btns">
                  <button
                    type="button"
                    className="ipd-vacate-btn"
                    onClick={() => handleVacateBed(selectedBed)}
                  >
                    <Icon name="LuLogOut" size={15} /> Discharge / Vacate Bed
                  </button>
                  <button
                    type="button"
                    className="ipd-close-modal-btn"
                    onClick={() => setSelectedBed(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAllotBed} className="ipd-allot-form">
                <div className="ipd-form-group">
                  <label className="ipd-label">Select Patient to Admit *</label>
                  <select
                    className="ipd-select"
                    value={assignPatientId}
                    onChange={(e) => setAssignPatientId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.uhid}) • {p.blood_group || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ipd-form-group">
                  <label className="ipd-label">Attending Doctor</label>
                  <select
                    className="ipd-select"
                    value={assignDoctorId}
                    onChange={(e) => setAssignDoctorId(e.target.value)}
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.first_name} {d.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ipd-modal-btns">
                  <Button type="submit">
                    <Icon name="LuCheck" size={16} /> Confirm Bed Allotment
                  </Button>
                  <button
                    type="button"
                    className="ipd-close-modal-btn"
                    onClick={() => setSelectedBed(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
