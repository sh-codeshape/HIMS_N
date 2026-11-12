import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { useRole } from "../hooks/useRole";
import { useModules } from "../context/ModuleContext";
import sidebarConfig from "../config/sidebarConfig";

// Find route metadata (moduleKey, submoduleKey, permissions, allowedRoles) from sidebarConfig
function findRouteConfig(pathname) {
  if (!pathname) return null;
  const current = pathname.toLowerCase();
  for (const item of sidebarConfig) {
    if (item.path && (item.path.toLowerCase() === current || current.startsWith(item.path.toLowerCase() + "/"))) {
      return {
        moduleKey: item.key,
        submoduleKey: item.submoduleKey || null,
        allowedRoles: item.allowedRoles || [],
        allowedPermissions: item.allowedPermissions || [],
      };
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.path && (child.path.toLowerCase() === current || current.startsWith(child.path.toLowerCase() + "/"))) {
          return {
            moduleKey: item.key,
            submoduleKey: child.submoduleKey || null,
            allowedRoles: child.allowedRoles || item.allowedRoles || [],
            allowedPermissions: child.allowedPermissions || [],
          };
        }
      }
    }
  }
  return null;
}

// Find permissions for a route path from sidebarConfig (legacy helper fallback)
function findRoutePermissions(pathname) {
  const meta = findRouteConfig(pathname);
  return meta?.allowedPermissions?.length ? meta.allowedPermissions : null;
}

// Domain-level fallback check for custom role users
function hasDomainPermission(pathname, userPermissions) {
  if (!pathname || !userPermissions || userPermissions.length === 0) return false;
  const segment = pathname.split("/")[1]?.toLowerCase();
  if (!segment) return false;

  if (segment === "dashboard") return true;

  const domainMap = {
    registration: ["registration", "patient"],
    opd: ["opd", "appointment", "clinical"],
    ipd: ["ipd", "bed", "admission"],
    ward: ["ward", "bed", "ipd"],
    billing: ["billing", "invoice", "payment", "charge", "discount", "creditnote", "cashsession"],
    "billing-invoices": ["billing", "invoice", "payment", "charge", "discount", "creditnote"],
    patients: ["patient", "patients", "clinical"],
    staff: ["staff", "users", "roles"],
    pharmacy: ["pharmacy"],
    laboratory: ["laboratory", "lab"],
    radiology: ["radiology", "imaging"],
    inventory: ["inventory", "purchase", "grn"],
    emergency: ["emergency"],
    reports: ["report", "reports"],
    "medical-reports": ["report", "reports", "clinical"],
    "follow-up": ["appointment", "opd", "clinical"],
  };

  const allowedPrefixes = domainMap[segment];
  if (!allowedPrefixes) return false;

  return userPermissions.some((perm) => {
    const prefix = perm.split(".")[0].toLowerCase();
    return allowedPrefixes.includes(prefix);
  });
}

/**
 * Wrap any route element with this to enforce auth + role/permission checks.
 */
export default function ProtectedRoute({ children, allowedRoles, allowedPermissions, moduleKey, submoduleKey }) {
  const { isAuthenticated, user, loading } = useAuth();
  const { roles } = useRole();
  const { isModuleEnabled } = useModules();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoles =
    Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles
      : user.role
        ? [user.role]
        : [];
  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];

  const isDeveloper = roles.includes("developer") || userRoles.includes("developer");
  const isSuperAdmin = userRoles.includes("super_admin") || !!user.is_superadmin;

  // Resolve route-level module & submodule from config if not explicitly passed
  const routeMeta = findRouteConfig(location.pathname);
  const effectiveModuleKey = moduleKey || routeMeta?.moduleKey;
  const effectiveSubmoduleKey = submoduleKey || routeMeta?.submoduleKey;

  // 1. Developer Console is strictly isolated for developer accounts only
  // Super admin and admin CANNOT access /developer routes
  const isDevConsoleRoute =
    effectiveModuleKey === "developerConsole" ||
    location.pathname.toLowerCase().startsWith("/developer") ||
    (allowedRoles && allowedRoles.length === 1 && allowedRoles[0] === "developer");

  if (isDevConsoleRoute && !isDeveloper) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 2. Global Module & Submodule gates (developer bypasses all)
  // Super admin and other users CANNOT access disabled modules or disabled submodules
  if (!isDeveloper) {
    if (effectiveModuleKey && !isModuleEnabled(effectiveModuleKey)) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (effectiveSubmoduleKey && !isModuleEnabled(effectiveSubmoduleKey)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 3. Super Admin and Developer have full operational access across all active hospital modules
  if (isDeveloper || isSuperAdmin) {
    return children;
  }

  // If no restrictions on roles or permissions, allow authenticated user
  const hasRoleReq = allowedRoles && allowedRoles.length > 0;
  const hasPermReq = allowedPermissions && allowedPermissions.length > 0;

  if (!hasRoleReq && !hasPermReq && !moduleKey) {
    return children;
  }

  // 1. Direct role check
  if (hasRoleReq && allowedRoles.some((r) => userRoles.includes(r))) {
    return children;
  }

  // 2. Explicit permission check
  if (hasPermReq && allowedPermissions.some((p) => userPermissions.includes(p))) {
    return children;
  }

  // 3. Fallback: check sidebarConfig permissions for this path
  const routePerms = findRoutePermissions(location.pathname);
  if (routePerms && routePerms.length > 0) {
    if (routePerms.some((p) => userPermissions.includes(p))) {
      return children;
    }
  }

  // 4. Fallback: check domain matching for this module
  if (hasDomainPermission(location.pathname, userPermissions)) {
    return children;
  }

  return <Navigate to="/unauthorized" replace />;
}
