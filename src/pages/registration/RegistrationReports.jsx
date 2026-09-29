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
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto">
      <RegistrationReportsTable patients={patients} />
    </div>
  );
}
