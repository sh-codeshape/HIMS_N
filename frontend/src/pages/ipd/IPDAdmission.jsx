import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { IPDAdmissionView } from "./components";

export default function IPDAdmission() {
  return (
    <PageContainer
      title="IPD Patient Admission"
      subtitle="Register new inpatient admissions and allocate ward bed units"
    >
      <IPDAdmissionView />
    </PageContainer>
  );
}
