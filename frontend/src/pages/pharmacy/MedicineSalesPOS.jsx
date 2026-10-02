import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { PharmacyPOSView } from "./components";

export default function MedicineSalesPOS() {
  return (
    <PageContainer
      title="Pharmacy Point of Sale (POS)"
      subtitle="Dispense prescription drugs, OTC medicines, and real-time inventory deduction"
    >
      <PharmacyPOSView />
    </PageContainer>
  );
}
