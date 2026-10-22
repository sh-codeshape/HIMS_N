import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { useRole } from "../hooks/useRole";
import { useModules } from "../context/ModuleContext";

/**
 * Wrap any route element with this to enforce auth + role/permission checks.
 *
 * <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR]} allowedPermissions={['staff.manage']} moduleKey="pharmacy">
 *   <SomePage />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles, allowedPermissions, moduleKey }) {
  const { isAuthenticated, user, loading } = useAuth();
  const { roles } = useRole();
  const { isModuleEnabled } = useModules();
  const location = useLocation();

  if (loading) return null; // could render a splash/loader here

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoles =
    Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles
      : user.role
        ? [user.role]
        : [];
  const userPermissions = user.permissions || [];

  const isDeveloper = roles.includes('developer');

  // Module-level gate (developer bypasses)
  if (!isDeveloper && moduleKey && !isModuleEnabled(moduleKey)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check roles (if specified, user must have at least one allowed role)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.some(role => userRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permissions (if specified, user must have at least one allowed permission, unless super_admin or developer)
  if (allowedPermissions && allowedPermissions.length > 0) {
    const isSuperAdmin = userRoles.includes('super_admin');
    const hasPermission = allowedPermissions.some(perm => userPermissions.includes(perm));
    
    if (!isDeveloper && !isSuperAdmin && !hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
