import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { IPDAdmission, BedAllotment, IPDDischarge, IPDDischargeDetail, IPDDischargeSummary, IPDReports } from "../../pages/ipd";

const { SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION } = ROLES;

export const ipdRoutes = [
  <Route
    key="ipd-adm"
    path="/ipd/admission"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <IPDAdmission />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ipd-bed"
    path="/ipd/bed-allotment"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <BedAllotment />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ipd-discharge"
    path="/ipd/discharge"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <IPDDischarge />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ipd-discharge-detail"
    path="/ipd/discharge/:id"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <IPDDischargeDetail />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ipd-discharge-summary"
    path="/ipd/discharge-summary"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <IPDDischargeSummary />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ipd-reports"
    path="/ipd/reports"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <IPDReports />
      </ProtectedRoute>
    }
  />,
];
