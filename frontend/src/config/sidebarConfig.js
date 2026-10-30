import { ROLES, PERMISSIONS } from "../auth/roles";

const { SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION, PHARMACY, DEVELOPER } = ROLES;

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
    allowedRoles: [], // Accessible to all authenticated users
  },
  {
    key: "registration",
    label: "Registration",
    icon: "LuUserPlus",
    allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION],
    children: [
      { label: "Register Patient", path: "/registration/register-patient", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.REGISTRATION_CREATE] },
      { label: "Registration Reports", path: "/registration/reports", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.REGISTRATION_VIEW] },
    ],
  },
  {
    key: "opd",
    label: "OPD",
    icon: "LuCalendarDays",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "OPD Registration", path: "/opd/registration", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.OPD_CREATE] },
      { label: "OPD Reports", path: "/opd/reports", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.OPD_VIEW] },
    ],
  },
  {
    key: "ipd",
    label: "IPD",
    icon: "LuBedDouble",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "IPD Admission", path: "/ipd/admission", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.IPD_CREATE] },
      { label: "Bed Allotment", path: "/ipd/bed-allotment", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BED_MANAGE] },
      { label: "IPD Discharge", path: "/ipd/discharge", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.IPD_VIEW] },
      { label: "IPD Discharge Summary", path: "/ipd/discharge-summary", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.IPD_VIEW] },
      { label: "IPD Reports", path: "/ipd/reports", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.IPD_VIEW] },
    ],
  },
  {
    key: "billing",
    label: "Billing",
    icon: "LuReceipt",
    allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION, PHARMACY],
    children: [
     
      { label: "IPD Billing", path: "/billing/ipd", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BILLING_CREATE] },
      { label: "Pharmacy Billing", path: "/billing/pharmacy", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY], allowedPermissions: [PERMISSIONS.PHARMACY_POS] },
      { label: "Lab Billing", path: "/billing/lab", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BILLING_CREATE] },
      { label: "Payment Collection", path: "/billing/payment-collection", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BILLING_CREATE] },
      { label: "Refunds", path: "/billing/refunds", allowedRoles: [SUPER_ADMIN, ADMIN], allowedPermissions: [PERMISSIONS.BILLING_REFUND] },
      { label: "Billing Reports", path: "/billing/reports", allowedRoles: [SUPER_ADMIN, ADMIN], allowedPermissions: [PERMISSIONS.BILLING_VIEW] },
    ],
  },
  {
    key: "patients",
    label: "Patients",
    icon: "LuUsers",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "Patient Directory", path: "/patients/directory", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.PATIENTS_VIEW] },
     
      { label: "Discharge Summary", path: "/patients/discharge-summary", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.PATIENTS_VIEW] },
    ],
  },
  {
    key: "staff",
    label: "Doctors & Staff",
    icon: "LuUserCog",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR],
    children: [
      { label: "Doctor Duty Roster", path: "/staff/duty-roster", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.STAFF_VIEW] },
      { label: "Staff Management", path: "/staff/management", allowedRoles: [SUPER_ADMIN, ADMIN], allowedPermissions: [PERMISSIONS.USERS_MANAGE] },
      { label: "Role Management", path: "/staff/roles", allowedRoles: [SUPER_ADMIN], allowedPermissions: [PERMISSIONS.ROLES_MANAGE] },
     
     
    ],
  },
  {
    key: "masterReports",
    label: "Master Reports",
    icon: "LuFileText",
    path: "/reports/master",
    allowedRoles: [SUPER_ADMIN, ADMIN],
    allowedPermissions: [PERMISSIONS.REPORTS_VIEW, "report.view", "report.financial"],
  },
  
  {
    key: "laboratory",
    label: "Pathology",
    icon: "LuFlaskConical",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR],
    children: [
      { label: "Dashboard", path: "/laboratory/dashboard", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.LABORATORY_VIEW] },
      { label: "Add Test Report", path: "/laboratory/add-test-report", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.LABORATORY_ORDER, "lab.enter_result"] },
      { label: "Report Summary", path: "/laboratory/report-summary", allowedRoles: [SUPER_ADMIN, ADMIN], allowedPermissions: [PERMISSIONS.LABORATORY_REPORT, "lab.verify_result"] },
    ],
  },
  {
    key: "radiology",
    label: "Radiology & Imaging",
    icon: "LuHeartPulse",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR],
    children: [
      { label: "X-Ray / MRI Schedule", path: "/radiology/schedule", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.RADIOLOGY_SCHEDULE] },
      { label: "DICOM Viewer / PACS", path: "/radiology/dicom-viewer", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.RADIOLOGY_VIEW] },
      { label: "Scan Reports", path: "/radiology/scan-reports", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.RADIOLOGY_REPORT, "imaging.report"] },
    ],
  },
  {
    key: "ward",
    label: "Floor Mapping",
    icon: "LuHospital",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "Floor & Bed Floor Map", path: "/ward/floor-map", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.WARD_VIEW, PERMISSIONS.BED_MANAGE] },
      { label: "Bed Allotment", path: "/ward/bed-allotment", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BED_MANAGE] },
      { label: "Bed Transfer", path: "/ward/bed-transfer", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BED_MANAGE] },
      { label: "Bed Availability", path: "/ward/bed-availability", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.WARD_VIEW] },
      { label: "Discharge Management", path: "/ward/discharge-management", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.IPD_VIEW] },
     
    ],
  },
  
  {
    key: "inventory",
    label: "Inventory Management",
    icon: "LuWarehouse",
    allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY],
    children: [
      {
        label: "Inventory Overview",
        path: "/inventory/overview",
        allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY],
        allowedPermissions: [PERMISSIONS.INVENTORY_VIEW],
      },
      {
        label: "Add / Receive Inventory",
        path: "/inventory/add",
        allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY],
        allowedPermissions: [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE],
      },
      {
        label: "Inventory Settings",
        path: "/inventory/settings",
        allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY],
        allowedPermissions: [PERMISSIONS.INVENTORY_VIEW],
      },
    ],
  },
 
  {
    key: "emergency",
    label: "Emergency Dispatch",
    icon: "LuShieldAlert",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "Ambulance Tracking", path: "/emergency/ambulance-tracking", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.EMERGENCY_VIEW] },
      { label: "Trauma Case Intake", path: "/emergency/trauma-intake", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.EMERGENCY_CREATE, PERMISSIONS.EMERGENCY_VIEW] },
    ],
  },
  {
    key: "followup",
    label: "Follow-Up",
    icon: "LuRepeat",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "Follow-Up List", path: "/follow-up/list", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.OPD_VIEW, "appointment.manage", "clinical.read"] },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    icon: "LuSliders",
    allowedRoles: [SUPER_ADMIN, ADMIN],
    children: [
      { label: "Outsource Lab Master", path: "/settings/outsource-labs", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "General Settings", path: "/settings/general", allowedRoles: [SUPER_ADMIN, ADMIN] },
    ],
  },
  {
    key: "developerConsole",
    label: "Developer Console",
    icon: "LuTerminal",
    allowedRoles: [DEVELOPER],
    children: [
      { label: "Module Manager", path: "/developer/modules", allowedRoles: [DEVELOPER], allowedPermissions: [PERMISSIONS.DEVELOPER_MODULES] },
      { label: "System Audit Log", path: "/developer/audit", allowedRoles: [DEVELOPER], allowedPermissions: [PERMISSIONS.DEVELOPER_AUDIT] },
      { label: "System Config", path: "/developer/config", allowedRoles: [DEVELOPER], allowedPermissions: [PERMISSIONS.DEVELOPER_CONFIG] },
    ],
  },
];

export default sidebarConfig;
