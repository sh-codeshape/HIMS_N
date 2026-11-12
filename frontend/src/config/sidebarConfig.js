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
      { label: "Register Patient", path: "/registration/register-patient", submoduleKey: "registration.register_patient", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.REGISTRATION_CREATE] },
      { label: "Registration Reports", path: "/registration/reports", submoduleKey: "registration.reports", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.REGISTRATION_VIEW] },
    ],
  },
  {
    key: "opd",
    label: "OPD",
    icon: "LuCalendarDays",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "OPD Registration", path: "/opd/registration", submoduleKey: "opd.registration", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.OPD_CREATE] },
      { label: "OPD Reports", path: "/opd/reports", submoduleKey: "opd.reports", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.OPD_VIEW] },
    ],
  },
  {
    key: "ipd",
    label: "IPD",
    icon: "LuBedDouble",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "IPD Admission", path: "/ipd/admission", submoduleKey: "ipd.admission", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.IPD_CREATE] },
      { label: "Bed Allotment", path: "/ipd/bed-allotment", submoduleKey: "ipd.bed_allotment", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BED_MANAGE] },
      { label: "IPD Discharge", path: "/ipd/discharge", submoduleKey: "ipd.discharge", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.IPD_VIEW] },
      { label: "IPD Discharge Summary", path: "/ipd/discharge-summary", submoduleKey: "ipd.discharge_summary", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.IPD_VIEW] },
      { label: "IPD Reports", path: "/ipd/reports", submoduleKey: "ipd.reports", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.IPD_VIEW] },
    ],
  },
  {
    key: "billing",
    label: "Billing",
    icon: "LuReceipt",
    allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION, PHARMACY],
    children: [
      { label: "IPD Billing", path: "/billing/ipd", submoduleKey: "billing.ipd", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BILLING_CREATE] },
      { label: "Pharmacy Billing", path: "/billing/pharmacy", submoduleKey: "billing.pharmacy", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY], allowedPermissions: [PERMISSIONS.PHARMACY_POS] },
      { label: "Lab Billing", path: "/billing/lab", submoduleKey: "billing.lab", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BILLING_CREATE] },
      { label: "Payment Collection", path: "/billing/payment-collection", submoduleKey: "billing.payment_collection", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BILLING_CREATE] },
      { label: "Refunds", path: "/billing/refunds", submoduleKey: "billing.refunds", allowedRoles: [SUPER_ADMIN, ADMIN], allowedPermissions: [PERMISSIONS.BILLING_REFUND] },
      { label: "Billing Reports", path: "/billing/reports", submoduleKey: "billing.reports", allowedRoles: [SUPER_ADMIN, ADMIN], allowedPermissions: [PERMISSIONS.BILLING_VIEW] },
    ],
  },
  {
    key: "patients",
    label: "Patients",
    icon: "LuUsers",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "Patient Directory", path: "/patients/directory", submoduleKey: "patients.directory", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.PATIENTS_VIEW] },
      { label: "Discharge Summary", path: "/patients/discharge-summary", submoduleKey: "patients.discharge_summary", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.PATIENTS_VIEW] },
    ],
  },
  {
    key: "staff",
    label: "Doctors & Staff",
    icon: "LuUserCog",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR],
    children: [
      { label: "Doctor Duty Roster", path: "/staff/duty-roster", submoduleKey: "staff.duty_roster", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.STAFF_VIEW] },
      { label: "Staff Management", path: "/staff/management", submoduleKey: "staff.management", allowedRoles: [SUPER_ADMIN, ADMIN], allowedPermissions: [PERMISSIONS.USERS_MANAGE] },
      { label: "Role Management", path: "/staff/roles", submoduleKey: "staff.roles", allowedRoles: [SUPER_ADMIN], allowedPermissions: [PERMISSIONS.ROLES_MANAGE] },
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
    key: "pharmacy",
    label: "Pharmacy",
    icon: "LuPill",
    allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY],
    children: [
      { label: "Medicine Sales POS", path: "/pharmacy/pos", submoduleKey: "pharmacy.pos", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY], allowedPermissions: [PERMISSIONS.PHARMACY_POS] },
      { label: "Purchase Orders", path: "/pharmacy/purchase-orders", submoduleKey: "pharmacy.purchase_orders", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY], allowedPermissions: [PERMISSIONS.PHARMACY_VIEW] },
      { label: "Expiry Tracker", path: "/pharmacy/expiry-tracker", submoduleKey: "pharmacy.expiry_tracker", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY], allowedPermissions: [PERMISSIONS.PHARMACY_VIEW] },
      { label: "Drug Database", path: "/pharmacy/drug-database", submoduleKey: "pharmacy.drug_database", allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY], allowedPermissions: [PERMISSIONS.PHARMACY_VIEW] },
    ],
  },
  {
    key: "laboratory",
    label: "Pathology",
    icon: "LuFlaskConical",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR],
    children: [
      { label: "Dashboard", path: "/laboratory/dashboard", submoduleKey: "laboratory.dashboard", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.LABORATORY_VIEW] },
      { label: "Add Test Report", path: "/laboratory/add-test-report", submoduleKey: "laboratory.add_test_report", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.LABORATORY_ORDER, "lab.enter_result"] },
      { label: "Report Summary", path: "/laboratory/report-summary", submoduleKey: "laboratory.report_summary", allowedRoles: [SUPER_ADMIN, ADMIN], allowedPermissions: [PERMISSIONS.LABORATORY_REPORT, "lab.verify_result"] },
    ],
  },
  {
    key: "radiology",
    label: "Radiology & Imaging",
    icon: "LuHeartPulse",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR],
    children: [
      { label: "X-Ray / MRI Schedule", path: "/radiology/schedule", submoduleKey: "radiology.schedule", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.RADIOLOGY_SCHEDULE] },
      { label: "DICOM Viewer / PACS", path: "/radiology/dicom-viewer", submoduleKey: "radiology.dicom_viewer", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.RADIOLOGY_VIEW] },
      { label: "Scan Reports", path: "/radiology/scan-reports", submoduleKey: "radiology.scan_reports", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR], allowedPermissions: [PERMISSIONS.RADIOLOGY_REPORT, "imaging.report"] },
    ],
  },
  {
    key: "ward",
    label: "Floor Mapping",
    icon: "LuHospital",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "Floor & Bed Floor Map", path: "/ward/floor-map", submoduleKey: "ward.floor_map", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.WARD_VIEW, PERMISSIONS.BED_MANAGE] },
      { label: "Bed Allotment", path: "/ward/bed-allotment", submoduleKey: "ward.bed_allotment", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BED_MANAGE] },
      { label: "Bed Transfer", path: "/ward/bed-transfer", submoduleKey: "ward.bed_transfer", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.BED_MANAGE] },
      { label: "Bed Availability", path: "/ward/bed-availability", submoduleKey: "ward.bed_availability", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.WARD_VIEW] },
      { label: "Discharge Management", path: "/ward/discharge-management", submoduleKey: "ward.discharge_management", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.IPD_VIEW] },
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
        submoduleKey: "inventory.overview",
        allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY],
        allowedPermissions: [PERMISSIONS.INVENTORY_VIEW],
      },
      {
        label: "Add / Receive Inventory",
        path: "/inventory/add",
        submoduleKey: "inventory.add",
        allowedRoles: [SUPER_ADMIN, ADMIN, PHARMACY],
        allowedPermissions: [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE],
      },
      {
        label: "Inventory Settings",
        path: "/inventory/settings",
        submoduleKey: "inventory.settings",
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
      { label: "Ambulance Tracking", path: "/emergency/ambulance-tracking", submoduleKey: "emergency.ambulance_tracking", allowedRoles: [SUPER_ADMIN, ADMIN, RECEPTION], allowedPermissions: [PERMISSIONS.EMERGENCY_VIEW] },
      { label: "Trauma Case Intake", path: "/emergency/trauma-intake", submoduleKey: "emergency.trauma_intake", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.EMERGENCY_CREATE, PERMISSIONS.EMERGENCY_VIEW] },
    ],
  },
  {
    key: "followup",
    label: "Follow-Up",
    icon: "LuRepeat",
    allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION],
    children: [
      { label: "Follow-Up List", path: "/follow-up/list", submoduleKey: "followup.list", allowedRoles: [SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION], allowedPermissions: [PERMISSIONS.OPD_VIEW, "appointment.manage", "clinical.read"] },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    icon: "LuSliders",
    allowedRoles: [SUPER_ADMIN, ADMIN],
    children: [
      { label: "Print Slip Templates", path: "/settings/print-templates", submoduleKey: "settings.print_templates", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "Outsource Lab Master", path: "/settings/outsource-labs", submoduleKey: "settings.outsource_labs", allowedRoles: [SUPER_ADMIN, ADMIN] },
      { label: "General Settings", path: "/settings/general", submoduleKey: "settings.general", allowedRoles: [SUPER_ADMIN, ADMIN] },
    ],
  },
  {
    key: "developerConsole",
    label: "Developer Console",
    icon: "LuTerminal",
    allowedRoles: [DEVELOPER],
    children: [
      { label: "Module Manager", path: "/developer/modules", submoduleKey: "developer.modules", allowedRoles: [DEVELOPER], allowedPermissions: [PERMISSIONS.DEVELOPER_MODULES] },
      { label: "System Audit Log", path: "/developer/audit", submoduleKey: "developer.audit", allowedRoles: [DEVELOPER], allowedPermissions: [PERMISSIONS.DEVELOPER_AUDIT] },
      { label: "System Config", path: "/developer/config", submoduleKey: "developer.config", allowedRoles: [DEVELOPER], allowedPermissions: [PERMISSIONS.DEVELOPER_CONFIG] },
    ],
  },
];

export default sidebarConfig;
