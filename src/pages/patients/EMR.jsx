import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { PatientEMRView } from "./components";

export default function EMR() {
  return (
    <PageContainer
      title="Electronic Medical Record (EMR)"
      subtitle="Detailed patient clinical records, diagnosis timeline, and vitals"
    >
      <PatientEMRView />
    </PageContainer>
  );
}
