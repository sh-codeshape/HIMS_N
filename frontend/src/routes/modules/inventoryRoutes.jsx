import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";
import {
  Dashboard,
  Items,
  Categories,
  Stores,
  Suppliers,
  Stock,
  StockMovements,
  StockAdjustment,
  PurchaseOrders,
  GoodsReceipts,
  StockTransfers,
  ExpiryTracker,
} from "../../pages/inventory";

const { SUPER_ADMIN, ADMIN, PHARMACY } = ROLES;

export const inventoryRoutes = [
  <Route
    key="inv-dash"
    path="/inventory/dashboard"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <Dashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-items"
    path="/inventory/items"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <Items />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-categories"
    path="/inventory/categories"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <Categories />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-stores"
    path="/inventory/stores"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <Stores />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-suppliers"
    path="/inventory/suppliers"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <Suppliers />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-stock"
    path="/inventory/stock"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <Stock />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-stock-movements"
    path="/inventory/stock-movements"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <StockMovements />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-stock-adjustment"
    path="/inventory/stock-adjustment"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <StockAdjustment />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-purchase-orders"
    path="/inventory/purchase-orders"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <PurchaseOrders />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-goods-receipts"
    path="/inventory/goods-receipts"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <GoodsReceipts />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-stock-transfers"
    path="/inventory/stock-transfers"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <StockTransfers />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-expiry-tracker"
    path="/inventory/expiry-tracker"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <ExpiryTracker />
      </ProtectedRoute>
    }
  />,
];
