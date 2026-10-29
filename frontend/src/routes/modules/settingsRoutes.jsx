import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { SettingsDashboard, OutsourceLabMaster } from "../../pages/settings";

const { SUPER_ADMIN, ADMIN } = ROLES;

export const settingsRoutes = [
  <Route
    key="settings-root"
    path="/settings"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <SettingsDashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="settings-outsource"
    path="/settings/outsource-labs"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <SettingsDashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="settings-lab-tests"
    path="/settings/lab-tests"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <SettingsDashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="settings-general"
    path="/settings/general"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <SettingsDashboard />
      </ProtectedRoute>
    }
  />,
];
