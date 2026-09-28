import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { PatientDirectory, EMR, DischargeSummary } from "../../pages/patients";

const { SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION } = ROLES;

export const patientsRoutes = [
  <Route
    key="pat-dir"
    path="/patients/directory"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <PatientDirectory />
      </ProtectedRoute>
    }
  />,
  <Route
    key="pat-emr"
    path="/patients/emr"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <EMR />
      </ProtectedRoute>
    }
  />,
  <Route
    key="pat-ds"
    path="/patients/discharge-summary"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <DischargeSummary />
      </ProtectedRoute>
    }
  />,
];
