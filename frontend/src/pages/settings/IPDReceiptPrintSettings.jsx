import React from "react";
import UnifiedSlipSettingsTab from "./UnifiedSlipSettingsTab.jsx";

export default function IPDReceiptPrintSettings({ onOpenMaster }) {
  return <UnifiedSlipSettingsTab slipType="ipd_receipt" onOpenMaster={onOpenMaster} />;
}
