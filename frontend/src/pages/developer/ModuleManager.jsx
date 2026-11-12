import React, { useState, useEffect, useMemo, useCallback } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import axiosInstance from "../../api/axiosInstance";
import { ENDPOINTS } from "../../api/endpoints";
import { useModules } from "../../context/ModuleContext.jsx";
import Icon from "../../components/common/Icon.jsx";
import toast from "react-hot-toast";

export function ModuleManager() {
  const { refetch: refetchGlobalModules } = useModules();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'enabled' | 'disabled'
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(ENDPOINTS.MODULES.BASE);
      const data = res.data.data || [];
      setModules(data);
      // Default: expand all parent modules that have submodules
      const parentsWithSubs = new Set();
      data.forEach((m) => {
        if (m.module_key.includes(".")) {
          parentsWithSubs.add(m.module_key.split(".")[0]);
        }
      });
      setExpandedKeys(parentsWithSubs);
    } catch (error) {
      toast.error("Failed to load modules registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allParents = new Set(moduleTree.map((g) => g.parent.module_key));
    setExpandedKeys(allParents);
  };

  const collapseAll = () => {
    setExpandedKeys(new Set());
  };

  const handleToggle = async (moduleKey, currentEnabled, label) => {
    if (toggling.has(moduleKey)) return;
    setToggling((prev) => new Set([...prev, moduleKey]));

    try {
      const res = await axiosInstance.put(ENDPOINTS.MODULES.TOGGLE(moduleKey), {
        enabled: !currentEnabled,
      });
      const updated = res.data.data;
      setModules((prev) =>
        prev.map((m) => (m.module_key === moduleKey ? updated : m))
      );
      toast.success(
        `"${label || moduleKey}" ${updated.is_enabled ? "enabled" : "disabled"} successfully`
      );
      // Sync global application context immediately
      if (refetchGlobalModules) {
        refetchGlobalModules();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to toggle "${label || moduleKey}"`);
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(moduleKey);
        return next;
      });
    }
  };

  const handleBatchToggleSubmodules = async (group, targetState) => {
    const toUpdate = group.submodules.filter((s) => s.is_enabled !== targetState);
    if (toUpdate.length === 0) return;

    for (const sub of toUpdate) {
      await handleToggle(sub.module_key, sub.is_enabled, sub.label);
    }
  };

  // Group modules into Parents and Submodules
  const moduleTree = useMemo(() => {
    const parentMap = new Map();
    const submodules = [];

    modules.forEach((m) => {
      if (m.module_key.includes(".")) {
        submodules.push(m);
      } else {
        parentMap.set(m.module_key, {
          parent: m,
          submodules: [],
        });
      }
    });

    submodules.forEach((sub) => {
      const parentKey = sub.module_key.split(".")[0];
      if (parentMap.has(parentKey)) {
        parentMap.get(parentKey).submodules.push(sub);
      } else {
        // Parent doesn't exist yet in registry, synthesize a parent entry
        parentMap.set(parentKey, {
          parent: {
            module_key: parentKey,
            label: parentKey.charAt(0).toUpperCase() + parentKey.slice(1),
            is_enabled: true,
            synthetic: true,
          },
          submodules: [sub],
        });
      }
    });

    return Array.from(parentMap.values()).sort((a, b) =>
      a.parent.label.localeCompare(b.parent.label)
    );
  }, [modules]);

  // Filter tree based on search query and status filter
  const filteredTree = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return moduleTree
      .map((group) => {
        const parentMatch =
          !query ||
          group.parent.label.toLowerCase().includes(query) ||
          group.parent.module_key.toLowerCase().includes(query);

        const filteredSubs = group.submodules.filter((sub) => {
          const subMatch =
            !query ||
            parentMatch ||
            sub.label.toLowerCase().includes(query) ||
            sub.module_key.toLowerCase().includes(query);

          if (!subMatch) return false;

          if (statusFilter === "enabled") return sub.is_enabled && group.parent.is_enabled;
          if (statusFilter === "disabled") return !sub.is_enabled || !group.parent.is_enabled;
          return true;
        });

        // Parent filter logic
        let includeParent = parentMatch;
        if (statusFilter === "enabled" && !group.parent.is_enabled) {
          includeParent = false;
        } else if (statusFilter === "disabled" && group.parent.is_enabled && filteredSubs.length === 0) {
          includeParent = false;
        }

        if (includeParent || filteredSubs.length > 0) {
          return {
            ...group,
            submodules: filteredSubs,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [moduleTree, searchQuery, statusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    let totalParents = 0;
    let activeParents = 0;
    let totalSubs = 0;
    let activeSubs = 0;

    modules.forEach((m) => {
      if (m.module_key.includes(".")) {
        totalSubs++;
        if (m.is_enabled) activeSubs++;
      } else {
        totalParents++;
        if (m.is_enabled) activeParents++;
      }
    });

    return { totalParents, activeParents, totalSubs, activeSubs, total: modules.length };
  }, [modules]);

  if (loading) {
    return (
      <PageContainer title="Developer Console - Module Manager">
        <div className="flex items-center justify-center p-12 text-gray-500 gap-3">
          <Icon name="LuRefreshCw" className="animate-spin" size={24} />
          <span className="font-medium text-lg">Loading modules registry...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Developer Console - Module Manager">
      {/* Header and Mission Control Banner */}
      <div className="mb-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <Icon name="LuShield" size={12} className="mr-1" /> Developer Exclusive
              </span>
              <span className="text-xs text-slate-400">
                Hospital Roles & Super Admin Bypasses Blocked
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Module & Submodule Feature Control</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Lock and customize hospital functionality per client contract. Any module or submodule
              disabled here is completely locked down and invisible to hospital administrators and staff.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-3 rounded-lg border border-slate-700/50">
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 uppercase font-medium">Main Modules</div>
              <div className="text-lg font-bold text-white">
                {stats.activeParents} / {stats.totalParents}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 uppercase font-medium">Submodules</div>
              <div className="text-lg font-bold text-emerald-400">
                {stats.activeSubs} / {stats.totalSubs}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, and Expand/Collapse */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative w-full max-w-md">
            <Icon
              name="LuSearch"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search module or submodule (e.g. refunds, bed, billing)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({modules.length})
            </button>
            <button
              onClick={() => setStatusFilter("enabled")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === "enabled" ? "bg-white text-emerald-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Enabled
            </button>
            <button
              onClick={() => setStatusFilter("disabled")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === "disabled" ? "bg-white text-rose-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Disabled
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Collapse All
          </button>
          <button
            onClick={fetchModules}
            className="p-1.5 text-gray-600 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 rounded-md border border-gray-200 transition-colors"
            title="Refresh registry"
          >
            <Icon name="LuRefreshCw" size={16} />
          </button>
        </div>
      </div>

      {/* Grouped Accordion / Tree Cards */}
      <div className="space-y-4">
        {filteredTree.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center text-gray-500 border border-gray-200">
            <Icon name="LuLayers" size={40} className="mx-auto mb-3 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-800">No matching modules found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search query or filter</p>
          </div>
        ) : (
          filteredTree.map((group) => {
            const { parent, submodules } = group;
            const isExpanded = expandedKeys.has(parent.module_key);
            const isParentToggling = toggling.has(parent.module_key);
            const hasSubmodules = submodules.length > 0;
            const activeSubsInGroup = submodules.filter((s) => s.is_enabled).length;

            return (
              <div
                key={parent.module_key}
                className={`bg-white rounded-xl shadow-sm border transition-all ${
                  parent.is_enabled
                    ? "border-gray-200 hover:border-gray-300"
                    : "border-rose-200 bg-rose-50/20"
                }`}
              >
                {/* Parent Module Bar */}
                <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {hasSubmodules ? (
                      <button
                        onClick={() => toggleExpand(parent.module_key)}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        <Icon
                          name={isExpanded ? "LuChevronDown" : "LuChevronRight"}
                          size={20}
                        />
                      </button>
                    ) : (
                      <div className="w-6" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-base">
                          {parent.label}
                        </span>
                        <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                          {parent.module_key}
                        </code>
                        {parent.module_key === "developerConsole" && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                            Dev Only
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        {hasSubmodules ? (
                          <span
                            className={`inline-flex items-center font-medium ${
                              activeSubsInGroup === submodules.length
                                ? "text-emerald-700"
                                : activeSubsInGroup === 0
                                ? "text-rose-600"
                                : "text-amber-700"
                            }`}
                          >
                            {activeSubsInGroup} of {submodules.length} submodules active
                          </span>
                        ) : (
                          <span>Standalone Root Module</span>
                        )}

                        {parent.disabled_at && (
                          <span className="text-rose-600">
                            • Disabled {new Date(parent.disabled_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasSubmodules && isExpanded && parent.is_enabled && (
                      <div className="hidden sm:flex items-center gap-1.5 mr-2">
                        <button
                          onClick={() => handleBatchToggleSubmodules(group, true)}
                          className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                        >
                          Enable All
                        </button>
                        <button
                          onClick={() => handleBatchToggleSubmodules(group, false)}
                          className="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                        >
                          Disable All
                        </button>
                      </div>
                    )}

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        parent.is_enabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {parent.is_enabled ? "Module Active" : "Module Disabled"}
                    </span>

                    <button
                      onClick={() => handleToggle(parent.module_key, parent.is_enabled, parent.label)}
                      disabled={isParentToggling || parent.synthetic}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                        parent.is_enabled
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      } ${isParentToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isParentToggling ? (
                        <span className="flex items-center gap-1">
                          <Icon name="LuRefreshCw" className="animate-spin" size={12} /> Updating...
                        </span>
                      ) : parent.is_enabled ? (
                        "Disable Module"
                      ) : (
                        "Enable Module"
                      )}
                    </button>
                  </div>
                </div>

                {/* Submodule Section when Expanded */}
                {hasSubmodules && isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/60 p-4 rounded-b-xl">
                    {!parent.is_enabled && (
                      <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                        <Icon name="LuAlertTriangle" size={16} className="text-amber-600 flex-shrink-0" />
                        <span>
                          <strong>Parent Module Suspended:</strong> Even though individual submodules below may be toggled active, they are currently inaccessible to all hospital users because the parent module <code>{parent.module_key}</code> is disabled.
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {submodules.map((sub) => {
                        const isSubToggling = toggling.has(sub.module_key);
                        const isEffectiveActive = parent.is_enabled && sub.is_enabled;

                        return (
                          <div
                            key={sub.module_key}
                            className={`flex flex-wrap items-center justify-between p-3 rounded-lg border transition-all ${
                              isEffectiveActive
                                ? "bg-white border-gray-200 shadow-sm"
                                : !parent.is_enabled
                                ? "bg-amber-50/40 border-amber-200/60 opacity-80"
                                : "bg-white/70 border-rose-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isEffectiveActive
                                    ? "bg-emerald-500"
                                    : !parent.is_enabled
                                    ? "bg-amber-400"
                                    : "bg-rose-400"
                                }`}
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-800">
                                  {sub.label}
                                </div>
                                <div className="text-xs text-gray-400 font-mono">
                                  {sub.module_key}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  !parent.is_enabled
                                    ? "bg-amber-100 text-amber-800"
                                    : sub.is_enabled
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {!parent.is_enabled
                                  ? "Suspended by Parent"
                                  : sub.is_enabled
                                  ? "Active"
                                  : "Disabled by Dev"}
                              </span>

                              <button
                                onClick={() => handleToggle(sub.module_key, sub.is_enabled, sub.label)}
                                disabled={isSubToggling}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                  sub.is_enabled
                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                } ${isSubToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                {isSubToggling ? "..." : sub.is_enabled ? "Disable" : "Enable"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Informative Security Guarantee Footer */}
      <div className="mt-8 p-5 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
          <Icon name="LuShield" size={16} className="text-indigo-600" />
          Developer Access & Security Enforcement Protocol
        </h3>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Developer Isolation:</strong> The Developer Console and module toggle APIs are strictly restricted to <code>roles: ['developer']</code>. Super Admin and Admin hospital accounts cannot access or tamper with these settings.
          </li>
          <li>
            <strong>Super Admin Integrity:</strong> Super Admin continues to enjoy full operational authority across all active hospital modules. However, any module or submodule locked by the developer cannot be bypassed by any hospital account.
          </li>
          <li>
            <strong>Immediate Propagation:</strong> Disabling any module or submodule instantly removes it from hospital user sidebars and blocks direct route access and backend API endpoints with HTTP 403 Forbidden.
          </li>
        </ul>
      </div>
    </PageContainer>
  );
}

export default ModuleManager;