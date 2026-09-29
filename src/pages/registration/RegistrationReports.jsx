import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { RegistrationReportsTable } from "./components";
import { mockStore } from "../../mock/mockStore";

export default function RegistrationReports() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    setPatients(mockStore.getPatients());
  }, []);

  return (
    <PageContainer
      title="Registration Reports"
      subtitle="Complete database and audit log of registered hospital patients"
    >
      <RegistrationReportsTable patients={patients} />
    </PageContainer>
  );
}
