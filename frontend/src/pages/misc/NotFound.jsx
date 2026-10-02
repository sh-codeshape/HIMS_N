import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <h2>404 — Page Not Found</h2>
      <Link to="/dashboard" style={{ color: "#2563eb", fontWeight: 600 }}>
        Back to Dashboard
      </Link>
    </div>
  );
}
