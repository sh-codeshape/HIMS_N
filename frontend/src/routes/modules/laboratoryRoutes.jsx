import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import {
  NewLabTestOrder,
  PendingSamples,
  ReportEntry,
  TemplateSettings,
  PathologyDashboardPage,
} from "../../pages/laboratory";

const { SUPER_ADMIN, ADMIN, DOCTOR } = ROLES;

export const laboratoryRoutes = [
  <Route
    key="lab-root"
    path="/laboratory"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <PathologyDashboardPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="lab-dash"
    path="/laboratory/dashboard"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <PathologyDashboardPage />
      </ProtectedRoute>
    }
  />,
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
    key="lab-add-report"
    path="/laboratory/add-test-report"
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
    key="lab-summary"
    path="/laboratory/report-summary"
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
