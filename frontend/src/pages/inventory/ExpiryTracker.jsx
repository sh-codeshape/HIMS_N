import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Icon from "../../components/common/Icon.jsx";

const EXPIRY_SEVERITY = {
  expired: "bg-rose-100 text-rose-800 border-rose-300 font-bold",
  critical: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
  warning: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
};

export default function ExpiryTrackerPage({ embedded = false, initialFilters = {}, onNavigateToAdd }) {
  const [batches, setBatches] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    organization_id: "",
    store_id: "",
    days_ahead: "30",
    search: "",
    ...initialFilters,
  });

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters.days_ahead, filters.store_id]);

  const loadStores = async () => {
    try {
      const res = await inventoryService.getStores();
      setStores(res?.data || []);
    } catch (e) {
      // ignore
    }
  };

  const loadData = async () => {
    try {
      setRefreshing(true);
      const res = await inventoryService.getExpiryTracker(filters);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setBatches(list);
    } catch (err) {
      toast.error("Failed to load expiry tracker");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const severity = (expiryDate) => {
    if (!expiryDate) return { label: "No Expiry", color: EXPIRY_SEVERITY.ok, badge: "ok" };
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `EXPIRED (${Math.abs(days)}d ago)`, color: EXPIRY_SEVERITY.expired, badge: "expired" };
    if (days <= 7) return { label: `CRITICAL — ${days}d left`, color: EXPIRY_SEVERITY.critical, badge: "critical" };
    if (days <= 30) return { label: `WARNING — ${days}d left`, color: EXPIRY_SEVERITY.warning, badge: "warning" };
    return { label: `OK — ${days}d left`, color: EXPIRY_SEVERITY.ok, badge: "ok" };
  };

  // Client-side search filtering if present
  const filteredBatches = batches.filter((b) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      b.item_name?.toLowerCase().includes(q) ||
      b.batch_no?.toLowerCase().includes(q) ||
      b.store_name?.toLowerCase().includes(q)
    );
  });

  if (loading && !embedded) {
    return (
      <PageContainer title="Expiry Tracker" subtitle="Monitor batches approaching expiry">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Expiry Tracker"}
      subtitle={embedded ? undefined : "Track batches nearing expiry to prevent stock loss"}
      embedded={embedded}
    >
      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 flex flex-wrap gap-3 items-center">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1">
              <input
                type="text"
                placeholder="Search expiring items or batches..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
              />
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Icon name="LuSearch" size={16} />
              </span>
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, search: "" })}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <Icon name="LuX" size={14} />
                </button>
              )}
            </div>

            {/* Store Dropdown */}
            <div className="w-44">
              <select
                value={filters.store_id}
                onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}
                className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 text-slate-700"
              >
                <option value="">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={loadData}
              title="Refresh data"
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all"
            >
              <Icon name="LuRefreshCw" size={14} className={refreshing ? "animate-spin text-blue-600" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Days Window Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Icon name="LuClock" size={12} /> Expiry horizon:
          </span>
          <button
            type="button"
            onClick={() => setFilters({ ...filters, days_ahead: "7" })}
            className={`px-2.5 py-1 rounded-full border transition-all ${
              filters.days_ahead === "7"
                ? "bg-rose-600 text-white border-rose-600 font-semibold shadow-xs"
                : "bg-rose-50/70 text-rose-700 border-rose-200 hover:bg-rose-100/70"
            }`}
          >
            ⚡ Next 7 Days (Critical)
          </button>
          <button
            type="button"
            onClick={() => setFilters({ ...filters, days_ahead: "30" })}
            className={`px-2.5 py-1 rounded-full border transition-all ${
              filters.days_ahead === "30"
                ? "bg-amber-600 text-white border-amber-600 font-semibold shadow-xs"
                : "bg-amber-50/70 text-amber-700 border-amber-200 hover:bg-amber-100/70"
            }`}
          >
            Next 30 Days
          </button>
          <button
            type="button"
            onClick={() => setFilters({ ...filters, days_ahead: "60" })}
            className={`px-2.5 py-1 rounded-full border transition-all ${
              filters.days_ahead === "60"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Next 60 Days
          </button>
          <button
            type="button"
            onClick={() => setFilters({ ...filters, days_ahead: "90" })}
            className={`px-2.5 py-1 rounded-full border transition-all ${
              filters.days_ahead === "90"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Next 90 Days
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold">Batch No</th>
                <th className="px-4 py-3.5 text-left font-semibold">Item Name</th>
                <th className="px-4 py-3.5 text-left font-semibold">Store Location</th>
                <th className="px-4 py-3.5 text-right font-semibold">Quantity on Hand</th>
                <th className="px-4 py-3.5 text-center font-semibold">Expiry Date</th>
                <th className="px-4 py-3.5 text-center font-semibold">Risk Level</th>
                <th className="px-4 py-3.5 text-right font-semibold">MRP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.map((b) => {
                const sev = severity(b.expiry_date);
                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      sev.badge === "expired" ? "bg-rose-50/30" : sev.badge === "critical" ? "bg-amber-50/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-800 text-xs">
                      {b.batch_no}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{b.item_name}</div>
                      {b.item_code && <div className="text-xs text-slate-400 font-mono">{b.item_code}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        <Icon name="LuMapPin" size={11} className="text-slate-400" />
                        {b.store_name || "Main Store"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                      {b.quantity_on_hand}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-700">
                      {b.expiry_date ? new Date(b.expiry_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs border ${sev.color}`}>
                        {sev.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {b.mrp !== null && b.mrp !== undefined ? `₹${Number(b.mrp).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}

              {filteredBatches.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                        <Icon name="LuShieldCheck" size={24} />
                      </div>
                      <h4 className="font-semibold text-slate-800 text-base mb-1">
                        No Batches Nearing Expiry
                      </h4>
                      <p className="text-xs text-slate-400">
                        No items found expiring within the next {filters.days_ahead} days. All stock in this horizon is safe.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            Tracking <strong className="text-slate-700">{filteredBatches.length}</strong> batches within {filters.days_ahead} days
          </span>
          {refreshing && (
            <span className="flex items-center gap-1.5 text-blue-600 font-medium">
              <Icon name="LuRefreshCw" size={12} className="animate-spin" />
              Updating...
            </span>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
