import { useAuth } from "../auth/AuthContext.jsx";

/**
 * const { role, roles, permissions, hasRole, hasPermission, hasAnyPermission, isSuperAdmin } = useRole();
 *
 * role        - primary role (backward compat, e.g. "super_admin")
 * roles       - all roles assigned to the user (from JWT)
 * permissions - all effective permissions (role-inherited + direct grants)
 * hasRole([...])        - true if user has at least one of the given roles
 * hasPermission('x')    - true if user has the given permission
 * hasAnyPermission([...]) - true if user has at least one of the given permissions
 * isSuperAdmin          - true if user has the super_admin role
 */
export function useRole() {
  const { user } = useAuth();

  const role = user?.role ?? null;
  const roles = Array.isArray(user?.roles) ? user.roles : role ? [role] : [];
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  const isSuperAdmin = roles.includes('super_admin');

  const hasRole = (allowedRoles = []) =>
    allowedRoles.length === 0 || allowedRoles.some((r) => roles.includes(r));

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  const hasAnyPermission = (allowedPermissions = []) =>
    isSuperAdmin ||
    allowedPermissions.length === 0 ||
    allowedPermissions.some((p) => permissions.includes(p));

  return {
    role,
    roles,
    permissions,
    isSuperAdmin,
    hasRole,
    hasPermission,
    hasAnyPermission,
  };
}
