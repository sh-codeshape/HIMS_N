import React from "react";
import Icon from "../../../components/common/Icon.jsx";

const AMBULANCES = [
  { id: "AMB-101", vehicleNo: "RJ-14-EA-4412", type: "Advanced Life Support (ICU)", driver: "Mukesh Yadav (+91 98290 11223)", status: "On Call / Dispatched", location: "Near Airport Terminal 2", eta: "8 mins" },
  { id: "AMB-102", vehicleNo: "RJ-14-EA-7890", type: "Basic Life Support", driver: "Suresh Meena (+91 94140 33445)", status: "Stationed / Ready", location: "Hospital Emergency Bay", eta: "Ready" },
  { id: "AMB-103", vehicleNo: "RJ-14-EA-9912", type: "Cardiac Ambulance", driver: "Harish Sharma (+91 97820 55667)", status: "Stationed / Ready", location: "Hospital Emergency Bay", eta: "Ready" },
  { id: "AMB-104", vehicleNo: "RJ-14-EA-2201", type: "Patient Transport", driver: "Kailash Gurjar (+91 99280 77889)", status: "On Route to Hospital", location: "Ajmer Road Flyover", eta: "14 mins" },
];

export default function AmbulanceTrackingView() {
  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Emergency Ambulance Fleet & GPS Dispatch</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>
            Real-time ambulance fleet status, driver contacts, and trauma dispatch
          </p>
        </div>
        <span style={{ background: "#fee2e2", color: "#dc2626", fontWeight: 800, fontSize: 11, padding: "4px 10px", borderRadius: 12 }}>
          🚨 24/7 EMERGENCY HELPLINE: 108 / 0141-2890108
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {AMBULANCES.map((amb) => {
          const isBusy = amb.status.includes("On");
          return (
            <div
              key={amb.id}
              style={{
                background: "#f8fafc",
                border: isBusy ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#2563eb" }}>{amb.id}</span>
                  <h4 style={{ margin: "2px 0 0", fontSize: 15, color: "#0f172a" }}>{amb.vehicleNo}</h4>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: isBusy ? "#fee2e2" : "#ecfdf5",
                    color: isBusy ? "#dc2626" : "#059669",
                  }}
                >
                  {amb.status}
                </span>
              </div>

              <div style={{ background: "#ffffff", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569" }}>
                <div><strong>Vehicle Type:</strong> {amb.type}</div>
                <div><strong>Driver & Phone:</strong> {amb.driver}</div>
                <div><strong>Current GPS:</strong> {amb.location}</div>
                <div style={{ marginTop: 4, color: isBusy ? "#dc2626" : "#059669", fontWeight: 700 }}>
                  ETA to Hospital: {amb.eta}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
