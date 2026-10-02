import { ROLES } from "../auth/roles";

const { SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION, PHARMACY } = ROLES;

/**
 * Single source of truth for the sidebar AND the router.
 * Each top-level entry is a collapsible group (icon + label).
 * Each child has: label, path, allowedRoles.
 *
 * AppRoutes.jsx reads this same array to build <Route> entries,
 * and Sidebar.jsx reads it to render menu items — so adding one
 * module here is enough to get both nav + routing.
 */
const sidebarConfig = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "LuLayoutDashboard",
    path: "/dashboard",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION, PHARMACY],
  },
  {
    key: "registration",
    label: "Registration",
    icon: "LuUserPlus",
    allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION],
    children: [
      { label: "Register Patient", path: "/registration/register-patient", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "Registration Reports", path: "/registration/reports", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
    ],
  },
  {
    key: "opd",
    label: "OPD",
    icon: "LuCalendarDays",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "OPD Registration", path: "/opd/registration", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "OPD Reports", path: "/opd/reports", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION] },
    ],
  },
  {
    key: "ipd",
    label: "IPD",
    icon: "LuBedDouble",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "IPD Admission", path: "/ipd/admission", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "Bed Allotment", path: "/ipd/bed-allotment", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "IPD Discharge", path: "/ipd/discharge", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
      { label: "IPD Reports", path: "/ipd/reports", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
    ],
  },
  {
    key: "billing",
    label: "Billing",
    icon: "LuReceipt",
    allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION, PHARMACY],
    children: [
      { label: "OPD Billing", path: "/billing/opd", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "IPD Billing", path: "/billing/ipd", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "Pharmacy Billing", path: "/billing/pharmacy", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY] },
      { label: "Lab Billing", path: "/billing/lab", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "Payment Collection", path: "/billing/payment-collection", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "Refunds", path: "/billing/refunds", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "Billing Reports", path: "/billing/reports", allowedRoles: [SUPER_ADMIN, ADMIN] },
    ],
  },
  {
    key: "patients",
    label: "Patients",
    icon: "LuUsers",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "Patient Directory", path: "/patients/directory", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION] },
      { label: "EMR / Medical History", path: "/patients/emr", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
      { label: "Discharge Summary", path: "/patients/discharge-summary", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
    ],
  },
  {
    key: "staff",
    label: "Doctors & Staff",
    icon: "LuUserCog",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR],
    children: [
      { label: "Doctor Duty Roster", path: "/staff/duty-roster", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
      { label: "Staff Management", path: "/staff/management", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "Consultant Commission", path: "/staff/consultant-commission", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "Leave Applications", path: "/staff/leave-applications", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
    ],
  },
  {
    key: "masterReports",
    label: "Master Reports",
    icon: "LuFileText",
    path: "/reports/master",
    allowedRoles: [SUPER_ADMIN, ADMIN],
  },
  {
    key: "pharmacy",
    label: "Pharmacy / OOM",
    icon: "LuPill",
    allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY],
    children: [
      { label: "Medicine Sales (POS)", path: "/pharmacy/pos", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY] },
      { label: "Purchase Orders", path: "/pharmacy/purchase-orders", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY] },
      { label: "Expiry Tracker", path: "/pharmacy/expiry-tracker", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY] },
      { label: "Drug Database", path: "/pharmacy/drug-database", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY] },
    ],
  },
  {
    key: "laboratory",
    label: "Laboratory",
    icon: "LuFlaskConical",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR],
    children: [
      { label: "New Lab Test Order", path: "/laboratory/new-order", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
      { label: "Pending Samples", path: "/laboratory/pending-samples", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "Report Entry", path: "/laboratory/report-entry", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "Template Settings", path: "/laboratory/template-settings", allowedRoles: [SUPER_ADMIN, ADMIN] },
    ],
  },
  {
    key: "radiology",
    label: "Radiology & Imaging",
    icon: "LuHeartPulse",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR],
    children: [
      { label: "X-Ray / MRI Schedule", path: "/radiology/schedule", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
      { label: "DICOM Viewer / PACS", path: "/radiology/dicom-viewer", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
      { label: "Scan Reports", path: "/radiology/scan-reports", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
    ],
  },
  {
    key: "ward",
    label: "IPD / OPD Ward",
    icon: "LuHospital",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "OPD Registration", path: "/ward/opd-registration", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "IPD Admission", path: "/ward/ipd-admission", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "Floor & Bed Floor Map", path: "/ward/floor-map", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION] },
      { label: "Nursing Station Log", path: "/ward/nursing-log", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
    ],
  },
  {
    key: "billingInvoices",
    label: "Billing & Invoices",
    icon: "LuFileStack",
    allowedRoles: [SUPER_ADMIN, ADMIN],
    section: "FINANCIALS & ADMIN",
    children: [
      { label: "Create Main Bill", path: "/billing-invoices/create-bill", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "Advance Deposits", path: "/billing-invoices/advance-deposits", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "TPA & Insurance Claims", path: "/billing-invoices/tpa-insurance", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "Refund & Discounts", path: "/billing-invoices/refund-discounts", allowedRoles: [SUPER_ADMIN, ADMIN] },
    ],
  },
  {
    key: "inventory",
    label: "Inventory Management",
    icon: "LuWarehouse",
    allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY],
    children: [
      { label: "Surgical Stock", path: "/inventory/surgical-stock", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "Asset Management", path: "/inventory/asset-management", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "Supplier Portal", path: "/inventory/supplier-portal", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY] },
    ],
  },
  {
    key: "medicalReports",
    label: "Medical Reports",
    icon: "LuFileHeart",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR],
    children: [
      { label: "Birth Certificates", path: "/medical-reports/birth-certificates", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
      { label: "Death Certificates", path: "/medical-reports/death-certificates", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
      { label: "MLC (Medico-Legal Cases)", path: "/medical-reports/mlc", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR] },
    ],
  },
  {
    key: "emergency",
    label: "Emergency Dispatch",
    icon: "LuShieldAlert",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "Ambulance Tracking", path: "/emergency/ambulance-tracking", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION] },
      { label: "Trauma Case Intake", path: "/emergency/trauma-intake", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION] },
    ],
  },
  {
    key: "followup",
    label: "Follow-Up",
    icon: "LuRepeat",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "Follow-Up List", path: "/follow-up/list", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION] },
    ],
  },
  {
    key: "bulkMessaging",
    label: "Bulk Messaging",
    icon: "LuMessageCircle",
    path: "/bulk-messaging",
    allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION],
  },
];

export default sidebarConfig;
