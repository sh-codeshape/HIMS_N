import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { BillingInvoiceForm } from "./components";

export default function OPDBilling() {
  return (
    <PageContainer
      title="OPD Billing & Invoices"
      subtitle="Create computerized hospital cash receipts, UPI, and TPA billing"
    >
      <BillingInvoiceForm billingType="OPD" />
    </PageContainer>
  );
}
