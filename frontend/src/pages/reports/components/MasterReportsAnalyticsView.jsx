import React, { useState, useEffect } from "react";
import Icon from "../../../components/common/Icon.jsx";
import { mockStore } from "../../../mock/mockStore";

export default function MasterReportsAnalyticsView() {
  const [patients, setPatients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [opdQueue, setOpdQueue] = useState([]);

  useEffect(() => {
    setPatients(mockStore.getPatients());
    setInvoices(mockStore.getInvoices());
    setOpdQueue(mockStore.getOPDQueue());
  }, []);

  const totalRevenue = invoices.reduce((acc, curr) => acc + (Number(curr.netAmount) || 0), 0);

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Hospital Executive Master Analytics</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>
            Consolidated clinical and financial performance reports
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
        >
          <Icon name="LuPrinter" size={14} /> Print Audit Report
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Total Registered Patients</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{patients.length + 480}</div>
          <span style={{ fontSize: 11, color: "#059669" }}>+12% this month</span>
        </div>

        <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Cumulative Billing Revenue</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            ₹{(totalRevenue + 450000).toLocaleString("en-IN")}
          </div>
          <span style={{ fontSize: 11, color: "#059669" }}>100% audited</span>
        </div>

        <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>OPD Encounters Handled</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{opdQueue.length + 320}</div>
          <span style={{ fontSize: 11, color: "#2563eb" }}>Avg 4.8★ Patient Rating</span>
        </div>
      </div>

      <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#1e293b" }}>Department-wise Patient Intake Distribution</h4>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "10px 12px" }}>Department</th>
              <th style={{ padding: "10px 12px" }}>OPD Footfall</th>
              <th style={{ padding: "10px 12px" }}>IPD Admissions</th>
              <th style={{ padding: "10px 12px" }}>Lab Orders</th>
              <th style={{ padding: "10px 12px" }}>Revenue Generated</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "12px", fontWeight: 700 }}>Cardiology</td>
              <td style={{ padding: "12px" }}>84</td>
              <td style={{ padding: "12px" }}>14</td>
              <td style={{ padding: "12px" }}>92</td>
              <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>₹1,42,000</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "12px", fontWeight: 700 }}>General Surgery</td>
              <td style={{ padding: "12px" }}>62</td>
              <td style={{ padding: "12px" }}>22</td>
              <td style={{ padding: "12px" }}>78</td>
              <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>₹2,85,000</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "12px", fontWeight: 700 }}>Orthopedics</td>
              <td style={{ padding: "12px" }}>48</td>
              <td style={{ padding: "12px" }}>8</td>
              <td style={{ padding: "12px" }}>45</td>
              <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>₹95,000</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "12px", fontWeight: 700 }}>Pediatrics</td>
              <td style={{ padding: "12px" }}>56</td>
              <td style={{ padding: "12px" }}>4</td>
              <td style={{ padding: "12px" }}>32</td>
              <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>₹48,000</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
