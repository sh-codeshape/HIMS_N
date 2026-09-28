import React from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { StaffDutyRosterView } from "./components";

export default function DoctorDutyRoster() {
  return (
    <PageContainer
      title="Doctor & Staff Duty Roster"
      subtitle="Shift assignments, emergency duty on-call, and clinic consultation timings"
    >
      <StaffDutyRosterView />
    </PageContainer>
  );
}
