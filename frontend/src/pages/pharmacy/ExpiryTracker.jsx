import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { ExpiryTrackerView } from "./components";

export default function ExpiryTracker() {
  return (
    <PageContainer
      title="Drug Expiry & Batch Tracker"
      subtitle="Alerts for near-expiry and low stock pharmaceuticals"
    >
      <ExpiryTrackerView />
    </PageContainer>
  );
}
