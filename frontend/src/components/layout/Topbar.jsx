import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { ROLE_LABELS } from "../../auth/roles";
import Icon from "../common/Icon.jsx";
import "./Topbar.css";

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();

  // On the main executive dashboard, the hero header includes integrated facility, date, notification, and profile controls
  if (location.pathname === "/dashboard" || location.pathname === "/") {
    return null;
  }

  return (
    <header className="topbar">
      <div className="topbar__user">
          <div className="topbar__avatar">{user?.name?.[0]?.toUpperCase() ?? "U"}</div>
          <div className="topbar__user-meta">
            <span className="topbar__user-name">{user?.name ?? "User"}</span>
            <span className="topbar__user-role">{ROLE_LABELS[user?.role] ?? ""}</span>
          </div>
      </div>
    </header>
  );
}
