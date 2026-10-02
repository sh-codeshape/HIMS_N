import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <h2>403 — Access Denied</h2>
      <p>Your role doesn't have permission to view this page.</p>
      <Link to="/dashboard" style={{ color: "#2563eb", fontWeight: 600 }}>
        Back to Dashboard
      </Link>
    </div>
  );
}
