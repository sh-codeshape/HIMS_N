import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { MasterReportsAnalyticsView } from "./components";

export default function MasterReports() {
  return (
    <PageContainer
      title="Hospital Master Analytics"
      subtitle="Executive clinical throughput, departmental load, and financial overview"
    >
      <MasterReportsAnalyticsView />
    </PageContainer>
  );
}
