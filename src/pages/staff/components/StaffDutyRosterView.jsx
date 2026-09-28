import React, { useState, useEffect } from "react";
import Icon from "../../../components/common/Icon.jsx";
import { mockStore } from "../../../mock/mockStore";

export default function StaffDutyRosterView() {
  const [doctors, setDoctors] = useState([]);
  const [filterDept, setFilterDept] = useState("All");

  useEffect(() => {
    setDoctors(mockStore.getDoctors());
  }, []);

  const filtered = filterDept === "All" ? doctors : doctors.filter((d) => d.department.includes(filterDept));

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Doctor & Clinical Duty Roster</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>
            Real-time doctor shifts, OPD chambers, and emergency call availability
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <select
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="All">All Specialties</option>
            <option value="Surgery">General Surgery</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Gynecology">Gynecology</option>
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
          >
            <Icon name="LuPrinter" size={14} /> Print Shift Roster
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {filtered.map((doc) => (
          <div
            key={doc.id}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#e0e7ff", color: "#3730a3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="LuStethoscope" size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, color: "#0f172a" }}>{doc.name}</h4>
                  <span style={{ fontSize: 11.5, color: "#64748b" }}>{doc.department}</span>
                </div>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: doc.status === "Available" ? "#ecfdf5" : doc.status === "In OT" ? "#fee2e2" : "#eff6ff",
                  color: doc.status === "Available" ? "#059669" : doc.status === "In OT" ? "#dc2626" : "#2563eb",
                }}
              >
                {doc.status}
              </span>
            </div>

            <div style={{ background: "#ffffff", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569" }}>
              <div><strong>OPD Chamber:</strong> {doc.opdRoom}</div>
              <div><strong>Shift Hours:</strong> {doc.timing}</div>
              <div><strong>Patients in Queue:</strong> {doc.patientsWaiting}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
