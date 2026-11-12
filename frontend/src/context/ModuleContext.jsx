import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

const ModuleContext = createContext(null);

export function ModuleProvider({ children }) {
  const [enabledModules, setEnabledModules] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.MODULES.BASE);
      const modules = res.data.data || [];
      const map = {};
      modules.forEach((m) => {
        map[m.module_key] = m.is_enabled;
      });
      setEnabledModules(map);
    } catch (error) {
      console.error("Failed to load module registry", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch modules if a token exists — avoids 401 spam when unauthenticated
    if (localStorage.getItem("hims_token")) {
      fetchModules();
    } else {
      setLoading(false);
    }

    // Re-fetch when the user logs in (storage event fires in same tab via our helper)
    const handleStorage = (e) => {
      if (e.key === "hims_token") {
        if (e.newValue) {
          fetchModules();
        } else {
          // Logged out — clear module map
          setEnabledModules({});
          setLoading(false);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [fetchModules]);

  const isModuleEnabled = useCallback((moduleKey) => {
    if (!moduleKey) return true;
    if (Object.keys(enabledModules).length === 0) return true;

    // If it's a submodule like "billing.refunds", check if parent "billing" is disabled
    if (moduleKey.includes('.')) {
      const parentKey = moduleKey.split('.')[0];
      if (enabledModules[parentKey] === false) {
        return false;
      }
    }

    return enabledModules[moduleKey] !== false;
  }, [enabledModules]);

  const value = useMemo(
    () => ({
      enabledModules,
      isModuleEnabled,
      isSubmoduleEnabled: isModuleEnabled,
      isFeatureEnabled: isModuleEnabled,
      loading,
      refetch: fetchModules,
    }),
    [enabledModules, isModuleEnabled, loading, fetchModules]
  );

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModules() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useModules must be used inside <ModuleProvider>");
  return ctx;
}
