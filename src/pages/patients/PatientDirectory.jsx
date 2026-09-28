import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { PatientDirectoryTable } from "./components";

export default function PatientDirectory() {
  return (
    <PageContainer
      title="Master Patient Directory"
      subtitle="Complete Electronic Health Registry and Medical Record Database"
    >
      <PatientDirectoryTable />
    </PageContainer>
  );
}
