import React from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { ROLE_LABELS } from "../../auth/roles";
import Icon from "../common/Icon.jsx";
import "./Topbar.css";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar__search">
        <Icon name="LuSearch" className="topbar__search-icon" size={16} />
        <input placeholder="Search patients, bills, reports..." />
      </div>

      <div className="topbar__right">
        <button className="topbar__icon-btn" type="button" title="Notifications">
          <Icon name="LuBell" size={18} />
        </button>

        <div className="topbar__user">
          <div className="topbar__avatar">{user?.name?.[0]?.toUpperCase() ?? "U"}</div>
          <div className="topbar__user-meta">
            <span className="topbar__user-name">{user?.name ?? "User"}</span>
            <span className="topbar__user-role">{ROLE_LABELS[user?.role] ?? ""}</span>
          </div>
        </div>

        <button className="topbar__logout" type="button" onClick={logout}>
          <Icon name="LuLogOut" size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
