import React, { useState } from "react";
import Icon from "../../components/common/Icon.jsx";
import ErrorBoundary from "../../components/common/ErrorBoundary.jsx";
import SharedHeaderFooterDesigner from "./SharedHeaderFooterDesigner.jsx";
import UnifiedSlipSettingsTab from "./UnifiedSlipSettingsTab.jsx";

export default function PrintSlipSettings() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");
      if (tab) {
        if (tab === "receipt" || tab === "ipd-receipt") return "ipd-receipt";
        return tab;
      }
    }
    return "shared-master";
  });

  return (
    <div className="space-y-6">
      {/* Tab Switcher Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("shared-master")}
            className={`px-4 py-2 font-bold text-xs rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "shared-master"
                ? "bg-gradient-to-r from-sky-800 to-indigo-900 text-white shadow-sm ring-2 ring-sky-300"
                : "bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100"
            }`}
          >
            <Icon name="LuSparkles" size={15} className="text-amber-300" />
            <span>Master Shared Header &amp; Footer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("opd")}
            className={`px-4 py-2 font-bold text-xs rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "opd"
                ? "bg-sky-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Icon name="LuReceipt" size={15} />
            <span>OPD Consultation Slip</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ipd-billing")}
            className={`px-4 py-2 font-bold text-xs rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "ipd-billing"
                ? "bg-sky-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Icon name="LuIndianRupee" size={15} />
            <span>IPD Billing Slip / Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ipd-discharge")}
            className={`px-4 py-2 font-bold text-xs rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "ipd-discharge"
                ? "bg-sky-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Icon name="LuFileCheck" size={15} />
            <span>IPD Discharge Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ipd")}
            className={`px-4 py-2 font-bold text-xs rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "ipd"
                ? "bg-emerald-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Icon name="LuBed" size={15} />
            <span>IPD Admission Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ipd-receipt")}
            className={`px-4 py-2 font-bold text-xs rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "ipd-receipt"
                ? "bg-sky-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Icon name="LuReceipt" size={15} />
            <span>Payment Receipt (Half Page)</span>
          </button>
        </div>
      </div>

      {/* Tab Contents with Error Boundary */}
      <ErrorBoundary>
        {/* Render Master Shared Header & Footer Designer */}
        {activeTab === "shared-master" && <SharedHeaderFooterDesigner />}

        {/* Render OPD Consultation Slip */}
        {activeTab === "opd" && (
          <UnifiedSlipSettingsTab
            slipType="opd"
            onOpenMaster={() => setActiveTab("shared-master")}
          />
        )}

        {/* Render IPD Billing Slip */}
        {activeTab === "ipd-billing" && (
          <UnifiedSlipSettingsTab
            slipType="ipd_billing"
            onOpenMaster={() => setActiveTab("shared-master")}
          />
        )}

        {/* Render IPD Discharge Summary */}
        {activeTab === "ipd-discharge" && (
          <UnifiedSlipSettingsTab
            slipType="ipd_discharge"
            onOpenMaster={() => setActiveTab("shared-master")}
          />
        )}

        {/* Render IPD Admission Ticket */}
        {activeTab === "ipd" && (
          <UnifiedSlipSettingsTab
            slipType="ipd_admission"
            onOpenMaster={() => setActiveTab("shared-master")}
          />
        )}

        {/* Render Payment Receipt Slip */}
        {activeTab === "ipd-receipt" && (
          <UnifiedSlipSettingsTab
            slipType="ipd_receipt"
            onOpenMaster={() => setActiveTab("shared-master")}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}
