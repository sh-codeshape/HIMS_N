import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer.jsx";
import Icon from "../../components/common/Icon.jsx";
import OutsourceLabMaster from "./OutsourceLabMaster.jsx";
import LabTestMaster from "./LabTestMaster.jsx";
import PrintSlipSettings from "./PrintSlipSettings.jsx";

export default function SettingsDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes("print-templates") || location.pathname.includes("slips")) {
      return "print-templates";
    }
    if (location.pathname.includes("outsource-labs")) {
      return "outsource-labs";
    }
    if (location.pathname.includes("general")) {
      return "general";
    }
    return "print-templates"; // Default to print slip templates for immediate access
  });

  useEffect(() => {
    if (location.pathname.includes("print-templates") || location.pathname.includes("slips")) {
      setActiveTab("print-templates");
    } else if (location.pathname.includes("outsource-labs")) {
      setActiveTab("outsource-labs");
    } else if (location.pathname.includes("general")) {
      setActiveTab("general");
    }
  }, [location.pathname]);

  return (
    <PageContainer
      title="System Settings & Masters"
      subtitle="Manage diagnostic laboratory partners, investigation templates, and hospital slip configurations"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab("print-templates")}
              className={`py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
                activeTab === "print-templates"
                  ? "border-sky-700 text-sky-800"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon name="LuReceipt" size={17} />
              <span>Print Slip Templates (OPD &amp; IPD)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("inhouse-labs")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === "inhouse-labs"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon name="LuTestTube" size={16} />
              <span>In-House Lab Tests</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("outsource-labs")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === "outsource-labs"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon name="LuFlaskConical" size={16} />
              <span>Outsource Lab Master</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === "general"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon name="LuSliders" size={16} />
              <span>Hospital General Settings</span>
            </button>
          </nav>
        </div>

        {/* Tab Contents */}
        {activeTab === "print-templates" && <PrintSlipSettings />}

        {activeTab === "inhouse-labs" && <LabTestMaster />}

        {activeTab === "outsource-labs" && <OutsourceLabMaster />}

        {activeTab === "general" && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
            <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Icon name="LuSliders" size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Hospital General Configuration</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Organization parameters, tax groups, printer configurations, and operational defaults are managed here.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
