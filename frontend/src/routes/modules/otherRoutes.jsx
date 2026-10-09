import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";
import { ROLES } from "../../auth/roles";

// Reports
import { MasterReports } from "../../pages/reports";

// Radiology
import XrayMriSchedule from "../../pages/radiology/XrayMriSchedule.jsx";
import DicomViewer from "../../pages/radiology/DicomViewer.jsx";
import ScanReports from "../../pages/radiology/ScanReports.jsx";

// Ward
import WardOPDRegistration from "../../pages/ward/WardOPDRegistration.jsx";
import WardIPDAdmission from "../../pages/ward/WardIPDAdmission.jsx";
import FloorBedMap from "../../pages/ward/FloorBedMap.jsx";
import BedMatrixGrid from "../../pages/ipd/components/BedMatrixGrid.jsx";
import BedTransfer from "../../pages/ward/BedTransfer.jsx";
import BedAvailability from "../../pages/ward/BedAvailability.jsx";
import DischargeManagement from "../../pages/ward/DischargeManagement.jsx";
import DischargeSummary from "../../pages/ward/DischargeSummary.jsx";
import NursingStationLog from "../../pages/ward/NursingStationLog.jsx";

// Billing & Invoices
import CreateMainBill from "../../pages/billingInvoices/CreateMainBill.jsx";
import AdvanceDeposits from "../../pages/billingInvoices/AdvanceDeposits.jsx";
import TPAInsuranceClaims from "../../pages/billingInvoices/TPAInsuranceClaims.jsx";
import RefundDiscounts from "../../pages/billingInvoices/RefundDiscounts.jsx";

// Inventory
import SurgicalStock from "../../pages/inventory/SurgicalStock.jsx";
import AssetManagement from "../../pages/inventory/AssetManagement.jsx";
import SupplierPortal from "../../pages/inventory/SupplierPortal.jsx";

// Medical Reports
import BirthCertificates from "../../pages/medicalReports/BirthCertificates.jsx";
import DeathCertificates from "../../pages/medicalReports/DeathCertificates.jsx";
import MLC from "../../pages/medicalReports/MLC.jsx";

// Follow-up & Messaging
import FollowUpList from "../../pages/followup/FollowUpList.jsx";
import BulkMessaging from "../../pages/bulkMessaging/BulkMessaging.jsx";

const { SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION, PHARMACY } = ROLES;

export const otherRoutes = [
  // Master Reports
  <Route
    key="rep-master"
    path="/reports/master"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <MasterReports />
      </ProtectedRoute>
    }
  />,

  // Radiology
  <Route
    key="rad-sched"
    path="/radiology/schedule"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <XrayMriSchedule />
      </ProtectedRoute>
    }
  />,
  <Route
    key="rad-dicom"
    path="/radiology/dicom-viewer"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <DicomViewer />
      </ProtectedRoute>
    }
  />,
  <Route
    key="rad-scans"
    path="/radiology/scan-reports"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <ScanReports />
      </ProtectedRoute>
    }
  />,

  // Ward
  <Route
    key="ward-opd"
    path="/ward/opd-registration"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <WardOPDRegistration />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-ipd"
    path="/ward/ipd-admission"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <WardIPDAdmission />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-floor"
    path="/ward/floor-map"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <FloorBedMap />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-bed-allotment"
    path="/ward/bed-allotment"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <BedMatrixGrid />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-bed-transfer"
    path="/ward/bed-transfer"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <BedTransfer />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-bed-availability"
    path="/ward/bed-availability"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <BedAvailability />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-discharge-management"
    path="/ward/discharge-management"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <DischargeManagement />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-discharge-summary"
    path="/ward/discharge-summary"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <DischargeSummary />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ward-nurse"
    path="/ward/nursing-log"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <NursingStationLog />
      </ProtectedRoute>
    }
  />,

  // Billing & Invoices
  <Route
    key="binv-bill"
    path="/billing-invoices/create-bill"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <CreateMainBill />
      </ProtectedRoute>
    }
  />,
  <Route
    key="binv-adv"
    path="/billing-invoices/advance-deposits"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <AdvanceDeposits />
      </ProtectedRoute>
    }
  />,
  <Route
    key="binv-tpa"
    path="/billing-invoices/tpa-insurance"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <TPAInsuranceClaims />
      </ProtectedRoute>
    }
  />,
  <Route
    key="binv-ref"
    path="/billing-invoices/refund-discounts"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <RefundDiscounts />
      </ProtectedRoute>
    }
  />,

  // Inventory
  <Route
    key="inv-surg"
    path="/inventory/surgical-stock"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <SurgicalStock />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-asset"
    path="/inventory/asset-management"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN]}>
        <AssetManagement />
      </ProtectedRoute>
    }
  />,
  <Route
    key="inv-supp"
    path="/inventory/supplier-portal"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, PHARMACY]}>
        <SupplierPortal />
      </ProtectedRoute>
    }
  />,

  // Medical Reports
  <Route
    key="mr-birth"
    path="/medical-reports/birth-certificates"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <BirthCertificates />
      </ProtectedRoute>
    }
  />,
  <Route
    key="mr-death"
    path="/medical-reports/death-certificates"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <DeathCertificates />
      </ProtectedRoute>
    }
  />,
  <Route
    key="mr-mlc"
    path="/medical-reports/mlc"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR]}>
        <MLC />
      </ProtectedRoute>
    }
  />,

  // Follow-Up & Messaging
  <Route
    key="fu-list"
    path="/follow-up/list"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, DOCTOR, RECEPTION]}>
        <FollowUpList />
      </ProtectedRoute>
    }
  />,
  <Route
    key="bm-send"
    path="/bulk-messaging"
    element={
      <ProtectedRoute allowedRoles={[SUPER_ADMIN, ADMIN, RECEPTION]}>
        <BulkMessaging />
      </ProtectedRoute>
    }
  />,
];
