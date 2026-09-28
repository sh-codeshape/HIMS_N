import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { LabTestOrderView } from "./components";

export default function NewLabTestOrder() {
  return (
    <PageContainer
      title="Pathology & Laboratory Test Orders"
      subtitle="Book diagnostic lab investigations, sample accession, and view test report statuses"
    >
      <LabTestOrderView />
    </PageContainer>
  );
}
