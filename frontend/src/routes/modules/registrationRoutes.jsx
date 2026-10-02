import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { RegisterPatient, RegistrationReports } from "../../pages/registration";

const { SUPER_ADMIN, ADMIN, RECEPTION } = ROLES;

export const registrationRoutes = [
  <Route
    key="reg-patient"
    path="/registration/register-patient"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <RegisterPatient />
      </ProtectedRoute>
    }
  />,
  <Route
    key="reg-reports"
    path="/registration/reports"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <RegistrationReports />
      </ProtectedRoute>
    }
  />,
];
