import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Button from "../../../components/common/Button.jsx";
import patientService from "../../../api/services/patientService";
import opdService from "../../../api/services/opdService";
import "./OPDTokenQueue.css";

const statusMap = {
  arrived: "Waiting",
  in_progress: "In Consultation",
  finished: "Completed"
};
const revStatusMap = {
  "Waiting": "arrived",
  "In Consultation": "in_progress",
  "Completed": "finished"
};

const mapOpdEntry = (item) => ({
  id: item.id,
  tokenNo: item.custom_fields?.opd_token || item.encounter_no,
  patientName: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
  uhid: item.uhid,
  doctor: item.referred_by || "—",
  department: "—",
  chiefComplaint: item.chief_complaint,
  time: new Date(item.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  status: statusMap[item.status] || "Waiting"
});

export default function OPDTokenQueue() {
  const [opdQueue, setOpdQueue] = useState([]);
  const [patientSearchText, setPatientSearchText] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchPage, setPatientSearchPage] = useState(1);
  const [hasMorePatients, setHasMorePatients] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  const [doctor, setDoctor] = useState("Dr. Priya Deshmukh (Cardiology)");
  const [department, setDepartment] = useState("Cardiology");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [vitals, setVitals] = useState({ bp: "120/80", pulse: "72", temp: "98.4", spo2: "99" });

  const fetchQueue = async () => {
    try {
      const data = await opdService.getQueue();
      setOpdQueue(data.map(mapOpdEntry));
    } catch (err) {
      toast.error("Failed to load OPD queue");
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (patientSearchText && !selectedPatient) {
        setPatientSearchPage(1);
        setIsSearching(true);
        try {
          const data = await patientService.getAll({ query: patientSearchText, limit: 10, page: 1 });
          setPatientSearchResults(data);
          setHasMorePatients(data.length === 10);
          setShowPatientDropdown(true);
        } catch (err) {
          toast.error("Failed to search patients");
        } finally {
          setIsSearching(false);
        }
      } else {
        setPatientSearchResults([]);
        setShowPatientDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [patientSearchText, selectedPatient]);

  const handleScrollPatients = async (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 10;
    if (bottom && hasMorePatients && !isSearching) {
      setIsSearching(true);
      const nextPage = patientSearchPage + 1;
      try {
        const data = await patientService.getAll({ query: patientSearchText, limit: 10, page: nextPage });
        setPatientSearchResults(prev => [...prev, ...data]);
        setPatientSearchPage(nextPage);
        setHasMorePatients(data.length === 10);
      } catch (err) {
        toast.error("Failed to load more patients");
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleIssueToken = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Please select a registered patient.");
      return;
    }

    try {
      await opdService.issueToken({
        patient_id: selectedPatient.id,
        facility_id: "00000000-0000-0000-0000-000000000000",
        referred_by: doctor.split(" (")[0],
        chief_complaint: chiefComplaint
      });
      toast.success(`OPD Token Issued for ${selectedPatient.full_name || selectedPatient.first_name}!`, { icon: "🎫" });
      setChiefComplaint("");
      setSelectedPatient(null);
      setPatientSearchText("");
      fetchQueue();
    } catch (err) {
      toast.error("Failed to issue token");
    }
  };

  const handleStatusChange = async (id, statusLabel) => {
    try {
      await opdService.updateStatus(id, revStatusMap[statusLabel]);
      fetchQueue();
    } catch (err) {
      toast.error("Failed to update status");
    }
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
          <div className="opd-mod-group" style={{ position: "relative" }}>
            <label className="opd-mod-label">Select Registered Patient *</label>
            <input
              type="text"
              className="opd-mod-input"
              placeholder="Search by name, UHID, or phone..."
              value={patientSearchText}
              onChange={(e) => {
                setPatientSearchText(e.target.value);
                if (selectedPatient) setSelectedPatient(null);
              }}
              required
            />
            {showPatientDropdown && (patientSearchResults.length > 0 || isSearching) && (
              <div 
                style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #ccc", zIndex: 10, maxHeight: "200px", overflowY: "auto", borderRadius: "4px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                onScroll={handleScrollPatients}
              >
                {patientSearchResults.map((p) => {
                  const age = p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth).getTime()) / 3.15576e+10) : 0;
                  const name = p.full_name || `${p.first_name} ${p.last_name}`;
                  return (
                    <div 
                      key={p.id} 
                      style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "14px" }}
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientSearchText(`${name} (${p.uhid})`);
                        setShowPatientDropdown(false);
                      }}
                    >
                      <strong>{name}</strong> ({p.uhid}) • Age: {age}Y
                    </div>
                  );
                })}
                {isSearching && <div style={{ padding: "8px 12px", textAlign: "center", fontSize: "12px", color: "#666" }}>Loading...</div>}
                {!hasMorePatients && patientSearchResults.length > 0 && <div style={{ padding: "8px 12px", textAlign: "center", fontSize: "12px", color: "#666" }}>End of results</div>}
              </div>
            )}
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
              key={item.id}
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
                      onClick={() => handleStatusChange(item.id, "In Consultation")}
                    >
                      Call Patient
                    </button>
                  )}
                  {item.status === "In Consultation" && (
                    <button
                      type="button"
                      className="opd-finish-btn"
                      onClick={() => handleStatusChange(item.id, "Completed")}
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
