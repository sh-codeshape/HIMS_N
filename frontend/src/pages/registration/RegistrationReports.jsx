import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { RegistrationReportsTable } from "./components";
import patientService from "../../api/services/patientService";
import { isMockMode } from "../../config/appConfig";
import { mockStore } from "../../mock/mockStore";

export default function RegistrationReports() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const loadPatients = async () => {
      if (isMockMode()) {
        setPatients(mockStore.getPatients());
        return;
      }

      try {
        const result = await patientService.getAll();
        setPatients(result || []);
      } catch (err) {
        console.error("Registration reports live load failed:", err);
        setPatients(mockStore.getPatients());
      }
    };

    loadPatients();
  }, []);

  return (
    <PageContainer
    
    >
      <RegistrationReportsTable patients={patients} />
    </PageContainer>
  );
}
