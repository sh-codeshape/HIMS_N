import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-layout__main">
        <Topbar />
        <div className="dashboard-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
