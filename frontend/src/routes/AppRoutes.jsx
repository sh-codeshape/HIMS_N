import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import { ALL_ROLES } from "../auth/roles";

// Core Pages
import Login from "../pages/auth/Login.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Unauthorized from "../pages/misc/Unauthorized.jsx";
import NotFound from "../pages/misc/NotFound.jsx";

// Modular Route Slices
import { registrationRoutes } from "./modules/registrationRoutes.jsx";
import { opdRoutes } from "./modules/opdRoutes.jsx";
import { ipdRoutes } from "./modules/ipdRoutes.jsx";
import { billingRoutes } from "./modules/billingRoutes.jsx";
import { patientsRoutes } from "./modules/patientsRoutes.jsx";
import { staffRoutes } from "./modules/staffRoutes.jsx";
import { pharmacyRoutes } from "./modules/pharmacyRoutes.jsx";
import { laboratoryRoutes } from "./modules/laboratoryRoutes.jsx";
import { emergencyRoutes } from "./modules/emergencyRoutes.jsx";
import { otherRoutes } from "./modules/otherRoutes.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Authenticated Dashboard Shell */}
      <Route
        element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Modular Feature Routes */}
        {registrationRoutes}
        {opdRoutes}
        {ipdRoutes}
        {billingRoutes}
        {patientsRoutes}
        {staffRoutes}
        {pharmacyRoutes}
        {laboratoryRoutes}
        {emergencyRoutes}
        {otherRoutes}
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
