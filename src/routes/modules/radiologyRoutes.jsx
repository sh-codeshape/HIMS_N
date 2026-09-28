import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { XrayMriSchedule, DicomViewer, ScanReports } from "../../pages/radiology";

const { SUPER_ADMIN, ADMIN, DOCTOR } = ROLES;

export const radiologyRoutes = [
  <Route
    key="rad-sched"
    path="/radiology/schedule"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <XrayMriSchedule />
      </ProtectedRoute>
    }
  />,
  <Route
    key="rad-dicom"
    path="/radiology/dicom-viewer"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <DicomViewer />
      </ProtectedRoute>
    }
  />,
  <Route
    key="rad-scans"
    path="/radiology/scan-reports"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <ScanReports />
      </ProtectedRoute>
    }
  />,
];
