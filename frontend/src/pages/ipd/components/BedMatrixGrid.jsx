import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Button from "../../../components/common/Button.jsx";
import ipdService from "../../../api/services/ipdService";
import patientService from "../../../api/services/patientService";
import staffService from "../../../api/services/staffService";
import "./BedMatrixGrid.css";

export default function BedMatrixGrid() {
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filterWard, setFilterWard] = useState("All");
  const [selectedBed, setSelectedBed] = useState(null);
  const [assignPatientId, setAssignPatientId] = useState("");
  const [assignDoctorId, setAssignDoctorId] = useState("");

  const loadData = async () => {
    try {
      const [bedsData, patientsData, staffData] = await Promise.all([
        ipdService.getBedMatrix(),
        patientService.getAll(),
        staffService.getAll({ type: "doctor" })
      ]);
      setBeds(bedsData);
      setPatients(patientsData);
      setDoctors(staffData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bed matrix data.");
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
        patient_id: assignPatientId,
        bed_id: selectedBed.id,
        attending_practitioner_id: assignDoctorId,
        admission_type: "elective"
      });
      toast.success(`Bed ${selectedBed.bed_no} allotted successfully!`, { icon: "🛏️" });
      setSelectedBed(null);
      setAssignPatientId("");
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
          {["All", "ICU", "General", "Private"].map(
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
