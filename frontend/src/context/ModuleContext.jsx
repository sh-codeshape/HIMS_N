import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

const ModuleContext = createContext(null);

export function ModuleProvider({ children }) {
  const [enabledModules, setEnabledModules] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
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
  };

  const isModuleEnabled = (moduleKey) => {
    if (!moduleKey) return true;
    return enabledModules[moduleKey] === true; // Only enabled if explicitly true
  };

  const value = useMemo(
    () => ({
      enabledModules,
      isModuleEnabled,
      loading,
      refetch: fetchModules,
    }),
    [enabledModules, loading, fetchModules]
  );

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModules() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useModules must be used inside <ModuleProvider>");
  return ctx;
}
