import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { BirthCertificates, DeathCertificates, MLC } from "../../pages/medicalReports";

const { SUPER_ADMIN, ADMIN, DOCTOR } = ROLES;

export const medicalReportsRoutes = [
  <Route
    key="mr-birth"
    path="/medical-reports/birth-certificates"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <BirthCertificates />
      </ProtectedRoute>
    }
  />,
  <Route
    key="mr-death"
    path="/medical-reports/death-certificates"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <DeathCertificates />
      </ProtectedRoute>
    }
  />,
  <Route
    key="mr-mlc"
    path="/medical-reports/mlc"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <MLC />
      </ProtectedRoute>
    }
  />,
];
