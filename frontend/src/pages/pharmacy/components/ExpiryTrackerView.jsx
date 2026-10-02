import React, { useState, useEffect } from "react";
import Icon from "../../../components/common/Icon.jsx";
import { mockStore } from "../../../mock/mockStore";

export default function ExpiryTrackerView() {
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    setMedicines(mockStore.getMedicines());
  }, []);

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Drug Expiry & Batch Tracker</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>
            Alerts for near-expiry and low stock pharmaceuticals
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
        >
          <Icon name="LuDownload" size={14} /> Export Expiry Report
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "10px 12px" }}>Medicine Name</th>
              <th style={{ padding: "10px 12px" }}>Generic & Category</th>
              <th style={{ padding: "10px 12px" }}>Batch No</th>
              <th style={{ padding: "10px 12px" }}>Expiry Date</th>
              <th style={{ padding: "10px 12px" }}>Current Stock</th>
              <th style={{ padding: "10px 12px" }}>Supplier</th>
              <th style={{ padding: "10px 12px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m) => {
              const isNearExpiry = m.expiry.startsWith("2026");
              return (
                <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>{m.name}</td>
                  <td style={{ padding: "12px", color: "#475569" }}>{m.generic} ({m.category})</td>
                  <td style={{ padding: "12px", fontFamily: "monospace", fontWeight: 600 }}>{m.batch}</td>
                  <td style={{ padding: "12px", fontWeight: 600, color: isNearExpiry ? "#dc2626" : "#0f172a" }}>
                    {m.expiry}
                  </td>
                  <td style={{ padding: "12px", fontWeight: 700 }}>{m.stock} Units</td>
                  <td style={{ padding: "12px", color: "#64748b" }}>{m.supplier}</td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: isNearExpiry ? "#fee2e2" : "#ecfdf5",
                        color: isNearExpiry ? "#dc2626" : "#059669",
                      }}
                    >
                      {isNearExpiry ? "Near Expiry Alert" : "Safe Shelf-Life"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
