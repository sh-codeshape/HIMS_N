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

// ---------------------------------------------------------------------------
// Permission catalog (must match the permission codes seeded in the backend).
// Use these codes in sidebarConfig, ProtectedRoute and the permission UI so
// nothing drifts out of sync.
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  // Roles & users
  ROLES_VIEW: 'roles.view',
  ROLES_MANAGE: 'roles.manage',
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',

  // Staff
  STAFF_VIEW: 'staff.view',
  STAFF_CREATE: 'staff.create',
  STAFF_EDIT: 'staff.edit',
  STAFF_DELETE: 'staff.delete',

  // Registration / OPD
  REGISTRATION_VIEW: 'registration.view',
  REGISTRATION_CREATE: 'registration.create',
  OPD_VIEW: 'opd.view',
  OPD_CREATE: 'opd.create',

  // IPD / Ward
  IPD_VIEW: 'ipd.view',
  IPD_CREATE: 'ipd.create',
  WARD_VIEW: 'ward.view',
  BED_MANAGE: 'bed.manage',

  // Billing
  BILLING_VIEW: 'billing.view',
  BILLING_CREATE: 'billing.create',
  BILLING_EDIT: 'billing.edit',
  BILLING_REFUND: 'billing.refund',

  // Pharmacy
  PHARMACY_VIEW: 'pharmacy.view',
  PHARMACY_POS: 'pharmacy.pos',
  PHARMACY_PURCHASE: 'pharmacy.purchase',
  PHARMACY_STOCK: 'pharmacy.stock',

  // Laboratory
  LABORATORY_VIEW: 'laboratory.view',
  LABORATORY_ORDER: 'laboratory.order',
  LABORATORY_REPORT: 'laboratory.report',

  // Radiology
  RADIOLOGY_VIEW: 'radiology.view',
  RADIOLOGY_SCHEDULE: 'radiology.schedule',
  RADIOLOGY_REPORT: 'radiology.report',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',

  // Patients / EMR
  PATIENTS_VIEW: 'patients.view',
  PATIENTS_EMR: 'patients.emr',

  // Emergency
  EMERGENCY_VIEW: 'emergency.view',
  EMERGENCY_CREATE: 'emergency.create',

  // Reports
  REPORTS_VIEW: 'reports.view',
};

export const PERMISSION_LABELS = {
  [PERMISSIONS.ROLES_VIEW]: 'View Roles & Permissions',
  [PERMISSIONS.ROLES_MANAGE]: 'Manage Roles & Permissions',
  [PERMISSIONS.USERS_VIEW]: 'View Users',
  [PERMISSIONS.USERS_MANAGE]: 'Manage Users & Direct Permissions',

  [PERMISSIONS.STAFF_VIEW]: 'View Staff',
  [PERMISSIONS.STAFF_CREATE]: 'Create Staff',
  [PERMISSIONS.STAFF_EDIT]: 'Edit Staff',
  [PERMISSIONS.STAFF_DELETE]: 'Delete Staff',

  [PERMISSIONS.REGISTRATION_VIEW]: 'View Registrations',
  [PERMISSIONS.REGISTRATION_CREATE]: 'Register Patients',
  [PERMISSIONS.OPD_VIEW]: 'View OPD',
  [PERMISSIONS.OPD_CREATE]: 'Create OPD Encounters',

  [PERMISSIONS.IPD_VIEW]: 'View IPD',
  [PERMISSIONS.IPD_CREATE]: 'Create IPD Admissions',
  [PERMISSIONS.WARD_VIEW]: 'View Wards & Beds',
  [PERMISSIONS.BED_MANAGE]: 'Allot & Transfer Beds',

  [PERMISSIONS.BILLING_VIEW]: 'View Billing',
  [PERMISSIONS.BILLING_CREATE]: 'Create Billing',
  [PERMISSIONS.BILLING_EDIT]: 'Edit Billing',
  [PERMISSIONS.BILLING_REFUND]: 'Refunds & Discounts',

  [PERMISSIONS.PHARMACY_VIEW]: 'View Pharmacy',
  [PERMISSIONS.PHARMACY_POS]: 'Pharmacy POS',
  [PERMISSIONS.PHARMACY_PURCHASE]: 'Pharmacy Purchase Orders',
  [PERMISSIONS.PHARMACY_STOCK]: 'Pharmacy Stock',

  [PERMISSIONS.LABORATORY_VIEW]: 'View Laboratory',
  [PERMISSIONS.LABORATORY_ORDER]: 'Lab Test Orders',
  [PERMISSIONS.LABORATORY_REPORT]: 'Lab Report Entry',

  [PERMISSIONS.RADIOLOGY_VIEW]: 'View Radiology',
  [PERMISSIONS.RADIOLOGY_SCHEDULE]: 'Schedule Imaging',
  [PERMISSIONS.RADIOLOGY_REPORT]: 'Scan Reports',

  [PERMISSIONS.INVENTORY_VIEW]: 'View Inventory',
  [PERMISSIONS.INVENTORY_MANAGE]: 'Manage Inventory',

  [PERMISSIONS.PATIENTS_VIEW]: 'View Patient Directory',
  [PERMISSIONS.PATIENTS_EMR]: 'View Patient EMR',

  [PERMISSIONS.EMERGENCY_VIEW]: 'View Emergency',
  [PERMISSIONS.EMERGENCY_CREATE]: 'Create Emergency Cases',

  [PERMISSIONS.REPORTS_VIEW]: 'View Reports',
};

// All permission codes as a flat array (useful for the UI matrix).
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// Group permissions by module for the permission matrix UI.
export const PERMISSION_GROUPS = {
  'Roles & Users': [
    PERMISSIONS.ROLES_VIEW,
    PERMISSIONS.ROLES_MANAGE,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_MANAGE,
  ],
  Staff: [PERMISSIONS.STAFF_VIEW, PERMISSIONS.STAFF_CREATE, PERMISSIONS.STAFF_EDIT, PERMISSIONS.STAFF_DELETE],
  'Registration / OPD': [
    PERMISSIONS.REGISTRATION_VIEW,
    PERMISSIONS.REGISTRATION_CREATE,
    PERMISSIONS.OPD_VIEW,
    PERMISSIONS.OPD_CREATE,
  ],
  'IPD / Ward': [PERMISSIONS.IPD_VIEW, PERMISSIONS.IPD_CREATE, PERMISSIONS.WARD_VIEW, PERMISSIONS.BED_MANAGE],
  Billing: [PERMISSIONS.BILLING_VIEW, PERMISSIONS.BILLING_CREATE, PERMISSIONS.BILLING_EDIT, PERMISSIONS.BILLING_REFUND],
  Pharmacy: [PERMISSIONS.PHARMACY_VIEW, PERMISSIONS.PHARMACY_POS, PERMISSIONS.PHARMACY_PURCHASE, PERMISSIONS.PHARMACY_STOCK],
  Laboratory: [PERMISSIONS.LABORATORY_VIEW, PERMISSIONS.LABORATORY_ORDER, PERMISSIONS.LABORATORY_REPORT],
  Radiology: [PERMISSIONS.RADIOLOGY_VIEW, PERMISSIONS.RADIOLOGY_SCHEDULE, PERMISSIONS.RADIOLOGY_REPORT],
  Inventory: [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE],
  'Patients / EMR': [PERMISSIONS.PATIENTS_VIEW, PERMISSIONS.PATIENTS_EMR],
  Emergency: [PERMISSIONS.EMERGENCY_VIEW, PERMISSIONS.EMERGENCY_CREATE],
  Reports: [PERMISSIONS.REPORTS_VIEW],
};
