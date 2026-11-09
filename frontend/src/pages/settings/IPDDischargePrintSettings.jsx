import React, { useMemo } from "react";
import UnifiedSlipSettingsTab from "./UnifiedSlipSettingsTab.jsx";
import printEngine from "../../services/printEngine.js";
import {
  DEFAULT_IPD_DISCHARGE_SETTINGS,
  SAMPLE_IPD_DISCHARGE,
} from "./ipdDischargePrintConfig.js";

export function IPDDischargePreview({ settings, data = SAMPLE_IPD_DISCHARGE }) {
  const html = useMemo(() => {
    return printEngine.buildSlipHTML("ipd_discharge", data, settings, { isPreview: true });
  }, [settings, data]);

  return (
    <div className="w-full bg-slate-200/90 p-4 rounded-xl flex justify-center overflow-auto">
      <div className="w-full max-w-[820px] bg-white rounded shadow-md border border-slate-300 overflow-hidden">
        <iframe
          title="Discharge Preview"
          srcDoc={html}
          className="w-full border-none"
          style={{ height: "920px", background: "#ffffff" }}
        />
      </div>
    </div>
  );
}

export default function IPDDischargePrintSettings({ onOpenMaster }) {
  return <UnifiedSlipSettingsTab slipType="ipd_discharge" onOpenMaster={onOpenMaster} />;
}

export { DEFAULT_IPD_DISCHARGE_SETTINGS, SAMPLE_IPD_DISCHARGE };
