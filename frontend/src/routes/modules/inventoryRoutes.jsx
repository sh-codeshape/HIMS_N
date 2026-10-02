import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import { SurgicalStock, AssetManagement, SupplierPortal } from "../../pages/inventory";

const { SUPER_ADMIN, ADMIN, PHARMACY } = ROLES;

export const inventoryRoutes = [
  <Route
    key="inv-surg"
    path="/inventory/surgical-stock"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <SurgicalStock />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-asset"
    path="/inventory/asset-management"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <AssetManagement />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-supp"
    path="/inventory/supplier-portal"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <SupplierPortal />
      </ProtectedRoute>
    }
  />,
];
