import React, { useState, useEffect } from "react";
import Icon from "../../../components/common/Icon.jsx";
import opdService from "../../../api/services/opdService";

export default function OPDReportsView() {
  const [opdQueue, setOpdQueue] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadOpdQueue();
  }, []);

  const loadOpdQueue = async () => {
    try {
      const queue = await opdService.getQueue();
      
      const mappedQueue = queue.map((item) => ({
        id: item.id,
        tokenNo: item.custom_fields?.opd_token || item.encounter_no,
        patientName: [item.first_name, item.last_name].filter(Boolean).join(" ") || "Unknown",
        uhid: item.uhid,
        doctor: [item.doc_first_name, item.doc_last_name].filter(Boolean).join(" ") || "Unknown Doc",
        department: item.department_name || "General",
        time: new Date(item.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: item.status === 'arrived' ? 'In Consultation' : (item.status === 'completed' ? 'Completed' : 'Waiting')
      }));
      setOpdQueue(mappedQueue);
    } catch (err) {
      console.error("Failed to load OPD queue:", err);
    }
  };

  const filtered = opdQueue.filter(
    (item) =>
      item.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      item.uhid?.toLowerCase().includes(search.toLowerCase()) ||
      item.doctor?.toLowerCase().includes(search.toLowerCase()) ||
      item.tokenNo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>OPD Daily Consultation Register</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
            Summary of all outpatients consulted today
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 12px" }}>
            <Icon name="LuSearch" size={15} />
            <input
              type="text"
              placeholder="Search token, patient, doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13 }}
            />
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
          >
            <Icon name="LuPrinter" size={14} /> Print OPD Register
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "10px 12px" }}>Token</th>
              <th style={{ padding: "10px 12px" }}>Patient Name</th>
              <th style={{ padding: "10px 12px" }}>Doctor & Room</th>
              <th style={{ padding: "10px 12px" }}>Department</th>
              <th style={{ padding: "10px 12px" }}>Time</th>
              <th style={{ padding: "10px 12px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.tokenNo} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px" }}>
                  <span style={{ fontWeight: 800, color: "#1e40af", background: "#eff6ff", padding: "3px 8px", borderRadius: 6 }}>
                    {item.tokenNo}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.patientName}</div>
                  <div style={{ fontSize: 11.5, color: "#64748b" }}>{item.uhid}</div>
                </td>
                <td style={{ padding: "12px", fontWeight: 600, color: "#334155" }}>{item.doctor}</td>
                <td style={{ padding: "12px", color: "#475569" }}>{item.department}</td>
                <td style={{ padding: "12px", color: "#64748b" }}>{item.time}</td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: item.status === "Completed" ? "#ecfdf5" : item.status === "In Consultation" ? "#eff6ff" : "#fffbeb",
                      color: item.status === "Completed" ? "#059669" : item.status === "In Consultation" ? "#2563eb" : "#d97706",
                    }}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
