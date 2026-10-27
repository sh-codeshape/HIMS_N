// Single source of truth for every API path. Change a backend route once,
// here — nothing else in the app should hardcode a URL string.

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  PATIENTS: {
    BASE: "/patients",
    DIRECTORY: "/patients/directory",
    EMR: (id) => `/patients/${id}/emr`,
    DISCHARGE_SUMMARY: (id) => `/patients/${id}/discharge-summary`,
  },
  REGISTRATION: {
    REGISTER: "/registration/register",
    REPORTS: "/registration/reports",
  },
  OPD: {
    REGISTRATION: "/opd/registration",
    REPORTS: "/opd/reports",
  },
  IPD: {
    ADMISSION: "/ipd/admission",
    BED_ALLOTMENT: "/ipd/bed-allotment",
    DISCHARGE: "/ipd/discharge",
    REPORTS: "/ipd/reports",
  },
  BILLING: {
    OPD: "/billing/opd",
    IPD: "/billing/ipd",
    PHARMACY: "/billing/pharmacy",
    LAB: "/billing/lab",
    PAYMENT_COLLECTION: "/billing/payment-collection",
    REFUNDS: "/billing/refunds",
    REPORTS: "/billing/reports",
  },
  BILLING_INVOICES: {
    BASE: "/billing",
  },
  STAFF: {
    BASE: "/staff",
    DOCTORS: "/staff/doctors",
    DEPARTMENTS: "/staff/departments",
    DUTY_ROSTER: "/staff/duty-roster",
    CONSULTANT_COMMISSION: "/staff/consultant-commission",
    LEAVE_APPLICATIONS: "/staff/leave-applications",
  },
  PRACTITIONERS: {
    BASE: "/practitioners",
  },
  ROLES: {
    BASE: "/roles",
    USERS: "/roles/users",
    USER_BY_ID: (userId) => `/roles/users/${userId}`,
    ROLE_USERS: (roleId) => `/roles/${roleId}/users`,
    ASSIGN_USER_ROLE: (userId) => `/roles/users/${userId}/roles`,
    USER_ROLE: (userId, roleId) => `/roles/users/${userId}/roles/${roleId}`,
    USER_PERMISSIONS: (userId) => `/roles/users/${userId}/permissions`,
    GRANT_USER_PERMISSION: (userId) => `/roles/users/${userId}/permissions`,
    REVOKE_USER_PERMISSION: (userId, permissionId) =>
      `/roles/users/${userId}/permissions/${permissionId}`,
  },
  PHARMACY: {
    POS: "/pharmacy/pos",
    PURCHASE_ORDERS: "/pharmacy/purchase-orders",
    EXPIRY_TRACKER: "/pharmacy/expiry-tracker",
    DRUG_DATABASE: "/pharmacy/drug-database",
  },
  LABORATORY: {
    NEW_ORDER: "/laboratory/new-order",
    PENDING_SAMPLES: "/laboratory/pending-samples",
    REPORT_ENTRY: "/laboratory/report-entry",
    TEMPLATE_SETTINGS: "/laboratory/template-settings",
  },
  RADIOLOGY: {
    SCHEDULE: "/radiology/schedule",
    DICOM_VIEWER: "/radiology/dicom-viewer",
    SCAN_REPORTS: "/radiology/scan-reports",
  },
  WARD: {
    FLOOR_MAP: "/ward/floor-map",
    NURSING_LOG: "/ward/nursing-log",
  },
  INVENTORY: {
    BASE: "/inventory",
    SUPPLIERS: "/inventory/suppliers",
    CATEGORIES: "/inventory/categories",
    ITEMS: "/inventory/items",
    STORES: "/inventory/stores",
    STOCK_BATCHES: "/inventory/stock-batches",
    STOCK_MOVEMENTS: "/inventory/stock-movements",
    STOCK_ADJUSTMENT: "/inventory/stock-adjustment",
    STOCK_WRITE_OFF: "/inventory/stock-write-off",
    PURCHASE_ORDERS: "/inventory/purchase-orders",
    GOODS_RECEIPTS: "/inventory/goods-receipts",
    STOCK_TRANSFERS: "/inventory/stock-transfers",
    DASHBOARD: "/inventory/dashboard",
    EXPIRY_TRACKER: "/inventory/expiry-tracker",
    LOW_STOCK: "/inventory/low-stock",
  },
  MEDICAL_REPORTS: {
    BIRTH_CERTIFICATES: "/medical-reports/birth-certificates",
    DEATH_CERTIFICATES: "/medical-reports/death-certificates",
    MLC: "/medical-reports/mlc",
  },
  EMERGENCY: {
    AMBULANCE_TRACKING: "/emergency/ambulance-tracking",
    TRAUMA_INTAKE: "/emergency/trauma-intake",
  },
  FOLLOW_UP: {
    LIST: "/follow-up/list",
  },
  BULK_MESSAGING: {
    BASE: "/bulk-messaging",
  },
  MODULES: {
    BASE: "/modules",
    TOGGLE: (moduleKey) => `/modules/${moduleKey}`,
  },
  MASTER_REPORTS: {
    BASE: "/reports/master",
  },
};
