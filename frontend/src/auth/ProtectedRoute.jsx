import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

/**
 * Wrap any route element with this to enforce auth + role checks.
 *
 * <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR]}>
 *   <SomePage />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // could render a splash/loader here

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
