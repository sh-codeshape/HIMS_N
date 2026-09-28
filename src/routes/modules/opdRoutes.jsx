import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { OPDRegistration, OPDReports } from "../../pages/opd";

const { SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION } = ROLES;

export const opdRoutes = [
  <Route
    key="opd-reg"
    path="/opd/registration"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <OPDRegistration />
      </ProtectedRoute>
    }
  />,
  <Route
    key="opd-reports"
    path="/opd/reports"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <OPDReports />
      </ProtectedRoute>
    }
  />,
];
