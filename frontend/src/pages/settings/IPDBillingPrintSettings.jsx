import React from "react";
import UnifiedSlipSettingsTab from "./UnifiedSlipSettingsTab.jsx";

export default function IPDBillingPrintSettings({ onOpenMaster }) {
  return <UnifiedSlipSettingsTab slipType="ipd_billing" onOpenMaster={onOpenMaster} />;
}
