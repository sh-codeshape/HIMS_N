import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Icon from "../../components/common/Icon.jsx";

// Tab components
import Stock from "./Stock.jsx";
import ExpiryTracker from "./ExpiryTracker.jsx";
import StockMovements from "./StockMovements.jsx";

export default function InventoryOverview() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab state: 'all' | 'low_stock' | 'expiring' | 'movements'
  const currentTab = searchParams.get("tab") || "all";

  const [stats, setStats] = useState({
    total_stock_value: 0,
    low_stock_count: 0,
    expiring_soon_count: 0,
    recent_movements: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await inventoryService.getDashboard();
      setStats(data || {});
    } catch (err) {
      toast.error("Failed to load inventory summary metrics");
    } finally {
      setLoadingStats(false);
    }
  };

  const setTab = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  return (
    <PageContainer
      title="Inventory Overview"
      subtitle="Centralized command center for live stock levels, replenishment alerts, and audit ledgers"
      rightAction={
        <button
          type="button"
          onClick={() => navigate("/inventory/add")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all"
        >
          <Icon name="LuPlus" size={16} />
          <span>Add / Receive Inventory</span>
        </button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Total Stock Value */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Total Stock Valuation
            </p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono">
              ₹{Number(stats.total_stock_value || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Across all warehouses & dispensing points</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Icon name="LuWallet" size={24} />
          </div>
        </div>

        {/* Low Stock Items Card (Clickable to switch tab) */}
        <div
          onClick={() => setTab("low_stock")}
          className={`bg-white p-5 rounded-2xl shadow-sm border transition-all cursor-pointer group hover:shadow-md ${
            currentTab === "low_stock"
              ? "border-rose-400 ring-2 ring-rose-200"
              : "border-slate-200/80 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                Low Stock Items
                {stats.low_stock_count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                )}
              </p>
              <h3
                className={`text-2xl font-bold font-mono ${
                  stats.low_stock_count > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {stats.low_stock_count || 0}
              </h3>
              <p className="text-xs text-slate-400 mt-1 group-hover:text-rose-600 transition-colors">
                {stats.low_stock_count > 0 ? "Items below reorder point → Click to view" : "All items healthy"}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                stats.low_stock_count > 0
                  ? "bg-rose-50 text-rose-600 group-hover:bg-rose-100"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Icon name="LuAlertTriangle" size={24} />
            </div>
          </div>
        </div>

        {/* Expiring Soon Card (Clickable to switch tab) */}
        <div
          onClick={() => setTab("expiring")}
          className={`bg-white p-5 rounded-2xl shadow-sm border transition-all cursor-pointer group hover:shadow-md sm:col-span-2 lg:col-span-1 ${
            currentTab === "expiring"
              ? "border-amber-400 ring-2 ring-amber-200"
              : "border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                Expiring (30 Days)
                {stats.expiring_soon_count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </p>
              <h3
                className={`text-2xl font-bold font-mono ${
                  stats.expiring_soon_count > 0 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {stats.expiring_soon_count || 0}
              </h3>
              <p className="text-xs text-slate-400 mt-1 group-hover:text-amber-600 transition-colors">
                {stats.expiring_soon_count > 0 ? "Batches approaching expiry → Click to view" : "No urgent expiries"}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                stats.expiring_soon_count > 0
                  ? "bg-amber-50 text-amber-600 group-hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Icon name="LuClock" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="border-b border-slate-200 mb-5">
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto pb-px" aria-label="Tabs">
          {/* Tab 1: All Stock */}
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-sm rounded-t-lg transition-all flex items-center gap-2 ${
              currentTab === "all"
                ? "border-blue-600 text-blue-600 bg-blue-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Icon name="LuBoxes" size={17} />
            <span>All Stock Batches</span>
          </button>

          {/* Tab 2: Low Stock */}
          <button
            type="button"
            onClick={() => setTab("low_stock")}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-sm rounded-t-lg transition-all flex items-center gap-2 ${
              currentTab === "low_stock"
                ? "border-rose-600 text-rose-600 bg-rose-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Icon name="LuAlertTriangle" size={17} />
            <span>Low Stock</span>
            {stats.low_stock_count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
                {stats.low_stock_count}
              </span>
            )}
          </button>

          {/* Tab 3: Expiring Soon */}
          <button
            type="button"
            onClick={() => setTab("expiring")}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-sm rounded-t-lg transition-all flex items-center gap-2 ${
              currentTab === "expiring"
                ? "border-amber-600 text-amber-600 bg-amber-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Icon name="LuClock" size={17} />
            <span>Expiring Soon</span>
            {stats.expiring_soon_count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                {stats.expiring_soon_count}
              </span>
            )}
          </button>

          {/* Tab 4: Movements Log */}
          <button
            type="button"
            onClick={() => setTab("movements")}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-sm rounded-t-lg transition-all flex items-center gap-2 ${
              currentTab === "movements"
                ? "border-blue-600 text-blue-600 bg-blue-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Icon name="LuActivity" size={17} />
            <span>Movements Audit Trail</span>
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="transition-opacity duration-200">
        {currentTab === "all" && (
          <Stock
            embedded={true}
            initialFilters={{ low_stock: "" }}
            onNavigateToAdd={() => navigate("/inventory/add")}
          />
        )}

        {currentTab === "low_stock" && (
          <Stock
            embedded={true}
            initialFilters={{ low_stock: "true" }}
            onNavigateToAdd={() => navigate("/inventory/add")}
          />
        )}

        {currentTab === "expiring" && (
          <ExpiryTracker
            embedded={true}
            onNavigateToAdd={() => navigate("/inventory/add")}
          />
        )}

        {currentTab === "movements" && (
          <StockMovements embedded={true} />
        )}
      </div>
    </PageContainer>
  );
}
