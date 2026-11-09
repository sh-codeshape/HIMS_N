import React from "react";
import UnifiedSlipSettingsTab from "./UnifiedSlipSettingsTab.jsx";

export default function IPDAdmissionPrintSettings({ onOpenMaster }) {
  return <UnifiedSlipSettingsTab slipType="ipd_admission" onOpenMaster={onOpenMaster} />;
}
