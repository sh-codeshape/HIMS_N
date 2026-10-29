import React, { useState } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import Icon from "../../components/common/Icon.jsx";
import OutsourceLabMaster from "./OutsourceLabMaster.jsx";
import LabTestMaster from "./LabTestMaster.jsx";

export default function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState("inhouse-labs");

  return (
    <PageContainer
      title="System Settings & Masters"
      subtitle="Manage diagnostic laboratory partners, investigation templates, and hospital configuration"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8">
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
