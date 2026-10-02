import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Button from "../../../components/common/Button.jsx";
import { mockStore } from "../../../mock/mockStore";
import "./BedMatrixGrid.css";

export default function BedMatrixGrid() {
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filterWard, setFilterWard] = useState("All");
  const [selectedBed, setSelectedBed] = useState(null);
  const [assignPatientUhid, setAssignPatientUhid] = useState("");
  const [assignDoctor, setAssignDoctor] = useState("Dr. Rajesh Sharma");

  useEffect(() => {
    setBeds(mockStore.getBeds());
    setPatients(mockStore.getPatients());
  }, []);

  const filteredBeds =
    filterWard === "All"
      ? beds
      : beds.filter((b) => b.ward.toLowerCase().includes(filterWard.toLowerCase()));

  const handleAllotBed = (e) => {
    e.preventDefault();
    if (!selectedBed || !assignPatientUhid) {
      toast.error("Please select a patient for bed allotment.");
      return;
    }

    const patient = patients.find((p) => p.uhid === assignPatientUhid);
    const updated = mockStore.updateBedStatus(selectedBed.bedNo, {
      status: "Occupied",
      patient: `${patient.name} (${patient.age}${patient.gender?.[0] || "M"})`,
      doctor: assignDoctor,
      admittedDate: new Date().toISOString().slice(0, 10),
    });

    setBeds(updated);
    toast.success(`Bed ${selectedBed.bedNo} allotted to ${patient.name}!`, { icon: "🛏️" });
    setSelectedBed(null);
    setAssignPatientUhid("");
  };

  const handleVacateBed = (bedNo) => {
    const updated = mockStore.updateBedStatus(bedNo, {
      status: "Available",
      patient: null,
      doctor: null,
      admittedDate: null,
    });
    setBeds(updated);
    toast.success(`Bed ${bedNo} is now vacant and ready for sanitization.`, { icon: "🧹" });
    setSelectedBed(null);
  };

  return (
    <div className="ipd-bed-module">
      <div className="ipd-bed-toolbar">
        <div className="ipd-ward-filters">
          {["All", "ICU", "General Male", "General Female", "Private Room", "Emergency"].map(
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
            className={`ipd-card ipd-card--${bed.status.toLowerCase()}`}
            onClick={() => setSelectedBed(bed)}
          >
            <div className="ipd-card-head">
              <span className="ipd-card-no">{bed.bedNo}</span>
              <span className={`ipd-card-badge ipd-badge--${bed.status.toLowerCase()}`}>
                {bed.status}
              </span>
            </div>

            <div className="ipd-card-body">
              <div className="ipd-card-ward">{bed.ward} • {bed.floor}</div>
              {bed.patient ? (
                <div className="ipd-card-patient">
                  <div className="ipd-pname">{bed.patient}</div>
                  <div className="ipd-pdoc">{bed.doctor}</div>
                  <div className="ipd-pdate">Adm: {bed.admittedDate}</div>
                </div>
              ) : (
                <div className="ipd-card-empty">
                  <Icon name="LuBed" size={24} />
                  <span>Vacant & Sanitized</span>
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
              <h3>Bed Allocation: {selectedBed.bedNo}</h3>
              <span className="ipd-card-ward">{selectedBed.ward} ({selectedBed.floor})</span>
            </div>

            {selectedBed.status === "Occupied" ? (
              <div className="ipd-occupied-view">
                <div className="ipd-occ-info">
                  <p><strong>Patient:</strong> {selectedBed.patient}</p>
                  <p><strong>Doctor:</strong> {selectedBed.doctor}</p>
                  <p><strong>Admission Date:</strong> {selectedBed.admittedDate}</p>
                </div>
                <div className="ipd-modal-btns">
                  <button
                    type="button"
                    className="ipd-vacate-btn"
                    onClick={() => handleVacateBed(selectedBed.bedNo)}
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
                    value={assignPatientUhid}
                    onChange={(e) => setAssignPatientUhid(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p.uhid} value={p.uhid}>
                        {p.name} ({p.uhid}) • {p.bloodGroup}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ipd-form-group">
                  <label className="ipd-label">Attending Doctor</label>
                  <select
                    className="ipd-select"
                    value={assignDoctor}
                    onChange={(e) => setAssignDoctor(e.target.value)}
                  >
                    <option value="Dr. Rajesh Sharma">Dr. Rajesh Sharma (Gen Surgery)</option>
                    <option value="Dr. Priya Deshmukh">Dr. Priya Deshmukh (Cardiology)</option>
                    <option value="Dr. Anand Kulkarni">Dr. Anand Kulkarni (Orthopedics)</option>
                    <option value="Dr. Meenakshi Iyer">Dr. Meenakshi Iyer (Gynecology)</option>
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
