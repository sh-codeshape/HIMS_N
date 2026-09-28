import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { BillingInvoiceForm } from "./components";

export default function IPDBilling() {
  return (
    <PageContainer
      title="IPD Inpatient Billing & Discharge Clearance"
      subtitle="Generate final indoor hospital bills, bed stay calculations, and insurance claims"
    >
      <BillingInvoiceForm billingType="IPD" />
    </PageContainer>
  );
}
