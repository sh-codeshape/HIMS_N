import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import {
  MedicineSalesPOS,
  PurchaseOrders,
  ExpiryTracker,
  DrugDatabase,
} from "../../pages/pharmacy";

const { SUPER_ADMIN, ADMIN, PHARMACY } = ROLES;

export const pharmacyRoutes = [
  <Route
    key="ph-pos"
    path="/pharmacy/pos"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <MedicineSalesPOS />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ph-po"
    path="/pharmacy/purchase-orders"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <PurchaseOrders />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ph-exp"
    path="/pharmacy/expiry-tracker"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <ExpiryTracker />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ph-db"
    path="/pharmacy/drug-database"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <DrugDatabase />
      </ProtectedRoute>
    }
  />,
];
