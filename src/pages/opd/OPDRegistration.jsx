import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { OPDTokenQueue } from "./components";

export default function OPDRegistration() {
  return (
    <PageContainer
      title="OPD Token & Queue Management"
      subtitle="Issue Outpatient consultation tokens and manage live doctor queue"
    >
      <OPDTokenQueue />
    </PageContainer>
  );
}
