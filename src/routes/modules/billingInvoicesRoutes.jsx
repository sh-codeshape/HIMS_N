import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import {
  CreateMainBill,
  AdvanceDeposits,
  TPAInsuranceClaims,
  RefundDiscounts,
} from "../../pages/billingInvoices";

const { SUPER_ADMIN, ADMIN } = ROLES;

export const billingInvoicesRoutes = [
  <Route
    key="binv-bill"
    path="/billing-invoices/create-bill"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <CreateMainBill />
      </ProtectedRoute>
    }
  />,
  <Route
    key="binv-adv"
    path="/billing-invoices/advance-deposits"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <AdvanceDeposits />
      </ProtectedRoute>
    }
  />,
  <Route
    key="binv-tpa"
    path="/billing-invoices/tpa-insurance"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <TPAInsuranceClaims />
      </ProtectedRoute>
    }
  />,
  <Route
    key="binv-ref"
    path="/billing-invoices/refund-discounts"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <RefundDiscounts />
      </ProtectedRoute>
    }
  />,
];
