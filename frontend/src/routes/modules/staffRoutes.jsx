import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import {
  DoctorDutyRoster,
  StaffManagement,
  ConsultantCommission,
  LeaveApplications,
  RoleManagement,
} from "../../pages/staff";

const { SUPER_ADMIN, ADMIN, DOCTOR } = ROLES;

export const staffRoutes = [
  <Route
    key="st-roster"
    path="/staff/duty-roster"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <DoctorDutyRoster />
      </ProtectedRoute>
    }
  />,
  <Route
    key="st-mgmt"
    path="/staff/management"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <StaffManagement />
      </ProtectedRoute>
    }
  />,
  <Route
    key="st-roles"
    path="/staff/roles"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN]}>
        <RoleManagement />
      </ProtectedRoute>
    }
  />,
  <Route
    key="st-comm"
    path="/staff/consultant-commission"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <ConsultantCommission />
      </ProtectedRoute>
    }
  />,
  <Route
    key="st-leave"
    path="/staff/leave-applications"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <LeaveApplications />
      </ProtectedRoute>
    }
  />,
];
