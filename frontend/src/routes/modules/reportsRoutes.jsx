import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { MasterReports } from "../../pages/reports";

const { SUPER_ADMIN, ADMIN } = ROLES;

export const reportsRoutes = [
  <Route
    key="rep-master"
    path="/reports/master"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <MasterReports />
      </ProtectedRoute>
    }
  />,
];
