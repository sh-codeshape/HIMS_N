import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import {
  OPDBilling,
  IPDBilling,
  PharmacyBilling,
  LabBilling,
  PaymentCollection,
  Refunds,
  BillingReports,
} from "../../pages/billing";

const { SUPER_ADMIN, ADMIN, RECEPTION, PHARMACY } = ROLES;

export const billingRoutes = [
  <Route
    key="bill-opd"
    path="/billing/opd"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <OPDBilling />
      </ProtectedRoute>
    }
  />,
  <Route
    key="bill-ipd"
    path="/billing/ipd"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <IPDBilling />
      </ProtectedRoute>
    }
  />,
  <Route
    key="bill-pharma"
    path="/billing/pharmacy"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <PharmacyBilling />
      </ProtectedRoute>
    }
  />,
  <Route
    key="bill-lab"
    path="/billing/lab"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <LabBilling />
      </ProtectedRoute>
    }
  />,
  <Route
    key="bill-pay"
    path="/billing/payment-collection"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <PaymentCollection />
      </ProtectedRoute>
    }
  />,
  <Route
    key="bill-ref"
    path="/billing/refunds"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <Refunds />
      </ProtectedRoute>
    }
  />,
  <Route
    key="bill-rep"
    path="/billing/reports"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <BillingReports />
      </ProtectedRoute>
    }
  />,
];
