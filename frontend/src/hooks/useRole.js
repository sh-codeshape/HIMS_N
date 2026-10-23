import { useAuth } from "../auth/AuthContext.jsx";

/**
 * const { role, roles, permissions, hasRole, hasPermission, hasAnyPermission, isSuperAdmin, isDeveloper } = useRole();
 *
 * role        - primary role (backward compat, e.g. "super_admin")
 * roles       - all roles assigned to the user (from JWT)
 * permissions - all effective permissions (role-inherited + direct grants)
 * isSuperAdmin          - true if user has the super_admin role
 * isDeveloper           - true if user has the developer role
 * hasRole([...])        - true if user has at least one of the given roles
 * hasPermission('x')    - true if user has the given permission (developer/super_admin bypass)
 * hasAnyPermission([...]) - true if user has at least one of the given permissions
 */
export function useRole() {
  const { user } = useAuth();

  const role = user?.role ?? null;
  const roles = Array.isArray(user?.roles) ? user.roles : role ? [role] : [];
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  const isSuperAdmin = roles.includes('super_admin');
  const isDeveloper = roles.includes('developer');

  const hasRole = (allowedRoles = []) =>
    allowedRoles.length === 0 || allowedRoles.some((r) => roles.includes(r));

  const hasPermission = (permission) =>
    isDeveloper || isSuperAdmin || permissions.includes(permission);

  const hasAnyPermission = (allowedPermissions = []) =>
    isDeveloper ||
    isSuperAdmin ||
    allowedPermissions.length === 0 ||
    allowedPermissions.some((p) => permissions.includes(p));

  return {
    role,
    roles,
    permissions,
    isSuperAdmin,
    isDeveloper,
    hasRole,
    hasPermission,
    hasAnyPermission,
  };
}
