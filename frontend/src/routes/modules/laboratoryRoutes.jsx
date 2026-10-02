import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import {
  NewLabTestOrder,
  PendingSamples,
  ReportEntry,
  TemplateSettings,
} from "../../pages/laboratory";

const { SUPER_ADMIN, ADMIN, DOCTOR } = ROLES;

export const laboratoryRoutes = [
  <Route
    key="lab-order"
    path="/laboratory/new-order"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <NewLabTestOrder />
      </ProtectedRoute>
    }
  />,
  <Route
    key="lab-samples"
    path="/laboratory/pending-samples"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <PendingSamples />
      </ProtectedRoute>
    }
  />,
  <Route
    key="lab-entry"
    path="/laboratory/report-entry"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <ReportEntry />
      </ProtectedRoute>
    }
  />,
  <Route
    key="lab-tmpl"
    path="/laboratory/template-settings"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <TemplateSettings />
      </ProtectedRoute>
    }
  />,
];
