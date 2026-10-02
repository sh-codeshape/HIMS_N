import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { IPDAdmission, BedAllotment, IPDDischarge, IPDReports } from "../../pages/ipd";

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
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <IPDDischarge />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ipd-reports"
    path="/ipd/reports"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <IPDReports />
      </ProtectedRoute>
    }
  />,
];
