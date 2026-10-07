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
    DUTY_ROSTER: "/staff/duty-roster",
    CONSULTANT_COMMISSION: "/staff/consultant-commission",
    LEAVE_APPLICATIONS: "/staff/leave-applications",
  },
  PRACTITIONERS: {
    BASE: "/practitioners",
  },
  ROLES: {
    BASE: "/roles",
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
    SURGICAL_STOCK: "/inventory/surgical-stock",
    ASSET_MANAGEMENT: "/inventory/asset-management",
    SUPPLIER_PORTAL: "/inventory/supplier-portal",
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
  MASTER_REPORTS: {
    BASE: "/reports/master",
  },
};
