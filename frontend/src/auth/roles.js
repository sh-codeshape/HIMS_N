// Central place for every role in the system.
// Add a new role here once — every other file (sidebar, routes, guards)
// reads from this list so nothing gets out of sync.

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  DOCTOR: "doctor",
  RECEPTION: "reception",
  PHARMACY: "pharmacy",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.ADMIN]: "Admin",
  [ROLES.DOCTOR]: "Doctor",
  [ROLES.RECEPTION]: "Reception",
  [ROLES.PHARMACY]: "Pharmacy",
};

// Shown as selectable cards on the Login screen.
export const LOGIN_ROLE_OPTIONS = [
  { role: ROLES.ADMIN, label: "Admin", icon: "LuShieldCheck", email: "admin@narayanhospital.com", desc: "Hospital Admin & Masters" },
  { role: ROLES.SUPER_ADMIN, label: "Super Admin", icon: "LuCrown", email: "superadmin@narayanhospital.com", desc: "Full System Access" },
  { role: ROLES.DOCTOR, label: "Doctor", icon: "LuStethoscope", email: "dr.priya@narayanhospital.com", desc: "OPD, IPD & EMR" },
  { role: ROLES.RECEPTION, label: "Reception", icon: "LuUserCheck", email: "reception@narayanhospital.com", desc: "Patient Intake & Billing" },
  { role: ROLES.PHARMACY, label: "Pharmacy", icon: "LuPill", email: "pharmacy@narayanhospital.com", desc: "POS & Drug Inventory" },
];

export const ALL_ROLES = Object.values(ROLES);
