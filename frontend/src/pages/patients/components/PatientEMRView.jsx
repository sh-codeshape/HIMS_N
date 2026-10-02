import React, { useState, useEffect } from "react";
import Icon from "../../../components/common/Icon.jsx";
import { mockStore } from "../../../mock/mockStore";

export default function PatientEMRView() {
  const [patients, setPatients] = useState([]);
  const [selectedUhid, setSelectedUhid] = useState("");

  useEffect(() => {
    const list = mockStore.getPatients();
    setPatients(list);
    if (list.length > 0) setSelectedUhid(list[0].uhid);
  }, []);

  const patient = patients.find((p) => p.uhid === selectedUhid);

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Electronic Medical Record (EMR) Timeline</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>
            Comprehensive clinical visit history & diagnostic chart
          </p>
        </div>

        <div style={{ minWidth: 260 }}>
          <select
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
            value={selectedUhid}
            onChange={(e) => setSelectedUhid(e.target.value)}
          >
            {patients.map((p) => (
              <option key={p.uhid} value={p.uhid}>
                {p.name} ({p.uhid})
              </option>
            ))}
          </select>
        </div>
      </div>

      {patient && (
        <div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 16, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 16, color: "#1e3a8a" }}>{patient.name}</h4>
              <p style={{ margin: 0, fontSize: 12.5, color: "#3b82f6" }}>
                UHID: <strong>{patient.uhid}</strong> • {patient.age} Y / {patient.gender} • Blood Group: <strong>{patient.bloodGroup}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
            >
              <Icon name="LuPrinter" size={14} /> Print Case Sheet
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Blood Pressure</span>
              <strong style={{ fontSize: 16, color: "#0f172a" }}>{patient.vitals?.bp || "120/80"}</strong>
            </div>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Pulse Rate</span>
              <strong style={{ fontSize: 16, color: "#0f172a" }}>{patient.vitals?.pulse || "74 bpm"}</strong>
            </div>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Temperature</span>
              <strong style={{ fontSize: 16, color: "#0f172a" }}>{patient.vitals?.temp || "98.4 F"}</strong>
            </div>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Oxygen SpO2</span>
              <strong style={{ fontSize: 16, color: "#059669" }}>{patient.vitals?.spo2 || "99%"}</strong>
            </div>
          </div>

          <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#1e293b" }}>Clinical Encounter History</h4>
          <div style={{ borderLeft: "2px solid #3b82f6", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Date: {patient.registeredAt} • Dept: {patient.department}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Consultation with {patient.doctor}</div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#475569" }}>
                Patient presented for routine consultation. Clinical vitals recorded within standard parameters. Follow up advised after 7 days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
