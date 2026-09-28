import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { OPDReportsView } from "./components";

export default function OPDReports() {
  return (
    <PageContainer
      title="OPD Consultation Reports"
      subtitle="Complete register of all outpatient consultations and room flow"
    >
      <OPDReportsView />
    </PageContainer>
  );
}
