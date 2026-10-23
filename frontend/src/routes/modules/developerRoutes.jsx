import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ModuleManager } from "../../pages/developer/ModuleManager.jsx";
import { ROLES } from "../../auth/roles";

const { DEVELOPER } = ROLES;

export const developerRoutes = [
  <Route
    key="dev-modules"
    path="/developer/modules"
    element={
      <ProtectedRoute allowedRoles={[DEVELOPER]} allowedPermissions={['developer.modules']} moduleKey="developerConsole">
        <ModuleManager />
      </ProtectedRoute>
    }
  />,
  <Route
    key="dev-audit"
    path="/developer/audit"
    element={
      <ProtectedRoute allowedRoles={[DEVELOPER]} allowedPermissions={['developer.audit']} moduleKey="developerConsole">
        <div className="p-4">System Audit Log (Coming Soon)</div>
      </ProtectedRoute>
    }
  />,
  <Route
    key="dev-config"
    path="/developer/config"
    element={
      <ProtectedRoute allowedRoles={[DEVELOPER]} allowedPermissions={['developer.config']} moduleKey="developerConsole">
        <div className="p-4">System Config (Coming Soon)</div>
      </ProtectedRoute>
    }
  />,
];
