import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import {
  WardOPDRegistration,
  WardIPDAdmission,
  FloorBedMap,
  BedAllotment,
  BedTransfer,
  DischargeManagement,
  NursingStationLog,
} from "../../pages/ward";

const { SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION } = ROLES;

export const wardRoutes = [
  <Route
    key="ward-opd"
    path="/ward/opd-registration"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <WardOPDRegistration />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-ipd"
    path="/ward/ipd-admission"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <WardIPDAdmission />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-floor"
    path="/ward/floor-map"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <FloorBedMap />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-bed-allotment"
    path="/ward/bed-allotment"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <BedAllotment />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-bed-transfer"
    path="/ward/bed-transfer"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <BedTransfer />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-discharge-management"
    path="/ward/discharge-management"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <DischargeManagement />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-nurse"
    path="/ward/nursing-log"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <NursingStationLog />
      </ProtectedRoute>
    }
  />,
];
