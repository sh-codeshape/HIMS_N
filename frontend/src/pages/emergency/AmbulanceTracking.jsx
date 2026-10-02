import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { AmbulanceTrackingView } from "./components";

export default function AmbulanceTracking() {
  return (
    <PageContainer
      title="Ambulance Tracking & Emergency Dispatch"
      subtitle="Fleet status, GPS driver contacts, and emergency trauma intake queue"
    >
      <AmbulanceTrackingView />
    </PageContainer>
  );
}
