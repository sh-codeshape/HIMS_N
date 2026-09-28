import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { AmbulanceTracking, TraumaCaseIntake } from "../../pages/emergency";

const { SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION } = ROLES;

export const emergencyRoutes = [
  <Route
    key="emg-amb"
    path="/emergency/ambulance-tracking"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <AmbulanceTracking />
      </ProtectedRoute>
    }
  />,
  <Route
    key="emg-trauma"
    path="/emergency/trauma-intake"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <TraumaCaseIntake />
      </ProtectedRoute>
    }
  />,
];
