import { useAuth } from "../auth/AuthContext.jsx";

/**
 * const { role, hasRole } = useRole();
 * if (hasRole(["admin", "super_admin"])) { ... }
 */
export function useRole() {
  const { user } = useAuth();
  const role = user?.role ?? null;

  const hasRole = (allowedRoles = []) => allowedRoles.includes(role);

  return { role, hasRole };
}
