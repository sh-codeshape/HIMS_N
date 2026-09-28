import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { BillingInvoiceForm } from "./components";

export default function LabBilling() {
  return (
    <PageContainer
      title="Pathology & Lab Billing"
      subtitle="Generate diagnostic test receipts and packages"
    >
      <BillingInvoiceForm billingType="Laboratory" />
    </PageContainer>
  );
}
