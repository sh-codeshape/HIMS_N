import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Button from "../../../components/common/Button.jsx";
import { mockStore } from "../../../mock/mockStore";
import "./OPDTokenQueue.css";

export default function OPDTokenQueue() {
  const [patients, setPatients] = useState([]);
  const [opdQueue, setOpdQueue] = useState([]);
  const [selectedPatientUhid, setSelectedPatientUhid] = useState("");
  const [doctor, setDoctor] = useState("Dr. Priya Deshmukh (Cardiology)");
  const [department, setDepartment] = useState("Cardiology");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [vitals, setVitals] = useState({ bp: "120/80", pulse: "72", temp: "98.4", spo2: "99" });

  useEffect(() => {
    setPatients(mockStore.getPatients());
    setOpdQueue(mockStore.getOPDQueue());
  }, []);

  const handleIssueToken = (e) => {
    e.preventDefault();
    if (!selectedPatientUhid) {
      toast.error("Please select a registered patient.");
      return;
    }

    const patient = patients.find((p) => p.uhid === selectedPatientUhid);
    if (!patient) return;

    const newEntry = mockStore.addOPDToken({
      patientName: patient.name,
      uhid: patient.uhid,
      doctor: doctor.split(" (")[0],
      department: department,
      chiefComplaint,
      vitals,
    });

    setOpdQueue(mockStore.getOPDQueue());
    toast.success(`OPD Token ${newEntry.tokenNo} Issued for ${patient.name}!`, {
      icon: "🎫",
    });

    setChiefComplaint("");
  };

  const handleStatusChange = (tokenNo, status) => {
    const updated = mockStore.updateOPDStatus(tokenNo, status);
    setOpdQueue(updated);
  };

  return (
    <div className="opd-module-grid">
      {/* Token Generator Form */}
      <div className="opd-module-card">
        <div className="opd-mod-header">
          <Icon name="LuTicket" size={20} className="opd-mod-icon" />
          <div>
            <h3 className="opd-mod-title">Issue OPD Consultation Slip</h3>
            <p className="opd-mod-sub">Assign doctor room & record preliminary vitals</p>
          </div>
        </div>

        <form onSubmit={handleIssueToken} className="opd-mod-form">
          <div className="opd-mod-group">
            <label className="opd-mod-label">Select Registered Patient *</label>
            <select
              className="opd-mod-select"
              value={selectedPatientUhid}
              onChange={(e) => setSelectedPatientUhid(e.target.value)}
              required
            >
              <option value="">-- Choose Patient by Name / UHID --</option>
              {patients.map((p) => (
                <option key={p.uhid} value={p.uhid}>
                  {p.name} ({p.uhid}) • Age: {p.age}Y
                </option>
              ))}
            </select>
          </div>

          <div className="opd-mod-row">
            <div className="opd-mod-group">
              <label className="opd-mod-label">Department *</label>
              <select
                className="opd-mod-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Cardiology">Cardiology (OPD-102)</option>
                <option value="General Medicine">General Medicine (OPD-101)</option>
                <option value="Orthopedics">Orthopedics (OPD-103)</option>
                <option value="Pediatrics">Pediatrics (OPD-105)</option>
                <option value="Gynecology">Gynecology (OPD-104)</option>
                <option value="General Surgery">General Surgery (OPD-106)</option>
              </select>
            </div>

            <div className="opd-mod-group">
              <label className="opd-mod-label">Consultant Doctor *</label>
              <select
                className="opd-mod-select"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              >
                <option value="Dr. Priya Deshmukh (Cardiology)">Dr. Priya Deshmukh, MD (Cardio)</option>
                <option value="Dr. Rajesh Sharma (Surgery)">Dr. Rajesh Sharma, MS (Gen Surgery)</option>
                <option value="Dr. Anand Kulkarni (Ortho)">Dr. Anand Kulkarni, MS (Ortho)</option>
                <option value="Dr. Arvind Saxena (Pedia)">Dr. Arvind Saxena, MD (Pediatrics)</option>
                <option value="Dr. Meenakshi Iyer (Gynae)">Dr. Meenakshi Iyer, DGO (Gynae)</option>
              </select>
            </div>
          </div>

          {/* Quick Vitals */}
          <div className="opd-vitals-card">
            <span className="opd-vitals-heading">🩺 OPD Intake Vitals</span>
            <div className="opd-vitals-4col">
              <div>
                <label className="opd-vit-lbl">BP (mmHg)</label>
                <input
                  type="text"
                  className="opd-vit-inp"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                />
              </div>
              <div>
                <label className="opd-vit-lbl">Pulse (bpm)</label>
                <input
                  type="text"
                  className="opd-vit-inp"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                />
              </div>
              <div>
                <label className="opd-vit-lbl">Temp (°F)</label>
                <input
                  type="text"
                  className="opd-vit-inp"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                />
              </div>
              <div>
                <label className="opd-vit-lbl">SpO2 (%)</label>
                <input
                  type="text"
                  className="opd-vit-inp"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="opd-mod-group">
            <label className="opd-mod-label">Chief Complaint / Symptoms</label>
            <input
              type="text"
              className="opd-mod-input"
              placeholder="e.g. Chest discomfort, severe headache, joint pain for 3 days"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
            />
          </div>

          <Button type="submit">
            <Icon name="LuPlus" size={16} /> Issue OPD Token & Add to Queue
          </Button>
        </form>
      </div>

      {/* Live Queue Display Board */}
      <div className="opd-module-card">
        <div className="opd-mod-header">
          <div>
            <h3 className="opd-mod-title">Live Token Queue Board</h3>
            <p className="opd-mod-sub">Current consultation stream</p>
          </div>
          <span className="opd-mod-live-tag">🔴 LIVE QUEUE</span>
        </div>

        <div className="opd-mod-queue-list">
          {opdQueue.map((item) => (
            <div
              key={item.tokenNo}
              className={`opd-mod-token-row ${
                item.status === "In Consultation"
                  ? "opd-row--active"
                  : item.status === "Completed"
                  ? "opd-row--done"
                  : ""
              }`}
            >
              <div className="opd-token-num">{item.tokenNo}</div>
              <div className="opd-token-details">
                <span className="opd-token-name">{item.patientName}</span>
                <span className="opd-token-meta">
                  {item.doctor} • {item.department}
                </span>
                <span className="opd-token-time">Checked in: {item.time}</span>
              </div>

              <div className="opd-token-actions-col">
                <span
                  className={`opd-mod-status-tag ${
                    item.status === "Completed"
                      ? "opd-status--done"
                      : item.status === "In Consultation"
                      ? "opd-status--active"
                      : "opd-status--wait"
                  }`}
                >
                  {item.status}
                </span>

                <div className="opd-mod-btn-group">
                  {item.status === "Waiting" && (
                    <button
                      type="button"
                      className="opd-call-btn"
                      onClick={() => handleStatusChange(item.tokenNo, "In Consultation")}
                    >
                      Call Patient
                    </button>
                  )}
                  {item.status === "In Consultation" && (
                    <button
                      type="button"
                      className="opd-finish-btn"
                      onClick={() => handleStatusChange(item.tokenNo, "Completed")}
                    >
                      Finish Consultation
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
