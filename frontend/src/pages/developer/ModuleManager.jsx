import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import axiosInstance from "../../api/axiosInstance";
import { ENDPOINTS } from "../../api/endpoints";
import toast from "react-hot-toast";

export function ModuleManager() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(new Set());

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(ENDPOINTS.MODULES.BASE);
      setModules(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (moduleKey, currentEnabled, label) => {
    if (toggling.has(moduleKey)) return;
    setToggling((prev) => new Set([...prev, moduleKey]));

    try {
      const res = await axiosInstance.put(
        ENDPOINTS.MODULES.TOGGLE(moduleKey),
        { enabled: !currentEnabled }
      );
      const updated = res.data.data;
      setModules((prev) =>
        prev.map((m) => (m.module_key === moduleKey ? updated : m))
      );
      toast.success(
        `Module "${label}" ${updated.is_enabled ? "enabled" : "disabled"} successfully`
      );
    } catch (error) {
      toast.error("Failed to toggle module");
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(moduleKey);
        return next;
      });
    }
  };

  if (loading) {
    return <PageContainer title="Developer Console - Module Manager">Loading...</PageContainer>;
  }

  return (
    <PageContainer title="Developer Console - Module Manager">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Module Manager</h1>
        <p className="text-gray-600">
          Toggle entire modules on/off globally. Disabling a module hides it from all
          users (except developers) and blocks API access to it.
        </p>
        <p className="text-sm text-amber-600 mt-2">
          <span className="font-bold">⚠ Warning:</span> This is a global kill-switch.
          Disabling "Laboratory" removes it for everyone, including super admins.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-4 text-gray-600 text-sm font-medium">Module</th>
              <th className="p-4 text-gray-600 text-sm font-medium">Status</th>
              <th className="p-4 text-gray-600 text-sm font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod.module_key} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-medium text-gray-900">{mod.label}</div>
                  <div className="text-xs text-gray-500">{mod.module_key}</div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      mod.is_enabled
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {mod.is_enabled ? "Enabled" : "Disabled"}
                  </span>
                  {mod.disabled_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      Disabled {new Date(mod.disabled_at).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleToggle(mod.module_key, mod.is_enabled, mod.label)}
                    disabled={saving || toggling.has(mod.module_key)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      mod.is_enabled
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                    } ${saving || toggling.has(mod.module_key) ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {toggling.has(mod.module_key) ? "Toggling..." : mod.is_enabled ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Developer role bypasses all module checks — developer always sees everything.</li>
          <li>When a module is disabled, it vanishes from the sidebar for all non-developer users.</li>
          <li>Direct API calls to disabled modules return 403 Forbidden for non-developers.</li>
          <li>Toggling takes effect immediately on the next page load for all users.</li>
        </ul>
      </div>
    </PageContainer>
  );
}
