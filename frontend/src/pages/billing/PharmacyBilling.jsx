import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { BillingInvoiceForm } from "./components";

export default function PharmacyBilling() {
  return (
    <PageContainer
      title="Pharmacy Medicine Billing"
      subtitle="Prescription and OTC medicine sale receipts"
    >
      <BillingInvoiceForm billingType="Pharmacy" />
    </PageContainer>
  );
}
