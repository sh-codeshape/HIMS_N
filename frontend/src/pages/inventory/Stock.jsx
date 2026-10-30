import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Icon from "../../components/common/Icon.jsx";

const STATUS_COLORS = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  quarantined: "bg-amber-100 text-amber-800 border-amber-200",
  expired: "bg-rose-100 text-rose-800 border-rose-200",
  recalled: "bg-slate-100 text-slate-800 border-slate-200",
  depleted: "bg-slate-200 text-slate-600 border-slate-200",
};

export default function StockPage({ embedded = false, initialFilters = {}, onNavigateToAdd }) {
  const [batches, setBatches] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState({
    organization_id: "",
    facility_id: "",
    store_id: "",
    item_id: "",
    status: "",
    low_stock: "",
    search: "",
    ...initialFilters,
  });

  // Sync initialFilters if prop changes
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters?.low_stock, initialFilters?.status]);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters.status, filters.low_stock, filters.store_id]);

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
      const res = await inventoryService.getStockBatches(filters);
      setBatches(res?.data || []);
      setMeta(res?.meta || { page: 1, limit: 50, total: 0 });
    } catch (err) {
      toast.error("Failed to load stock batches");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const clearFilters = () => {
    setFilters({
      organization_id: "",
      facility_id: "",
      store_id: "",
      item_id: "",
      status: "",
      low_stock: initialFilters.low_stock || "",
      search: "",
    });
  };

  const expiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: "No Expiry", color: "text-slate-500" };
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Expired", color: "text-rose-600 font-semibold" };
    if (days <= 30) return { label: `Expires in ${days}d`, color: "text-rose-600 font-semibold" };
    if (days <= 90) return { label: `Expires in ${days}d`, color: "text-amber-600 font-semibold" };
    return { label: `Expires in ${days}d`, color: "text-emerald-600 text-xs" };
  };

  const isLowStockView = filters.low_stock === "true";

  if (loading && !embedded) {
    return (
      <PageContainer title="Stock" subtitle="View and manage stock batches across all stores">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Stock"}
      subtitle={embedded ? undefined : "Track stock batches, quantities, and expiry across stores"}
      embedded={embedded}
    >
      {/* Simplified, Clean Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-3.5 mb-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 flex flex-wrap gap-2.5 items-center">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1">
              <input
                type="text"
                placeholder="Search item, batch, or code..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }}
                className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
              />
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Icon name="LuSearch" size={15} />
              </span>
              {filters.search && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ ...filters, search: "" });
                    setTimeout(loadData, 0);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <Icon name="LuX" size={13} />
                </button>
              )}
            </div>

            {/* Store Dropdown */}
            <div className="w-44">
              <select
                value={filters.store_id}
                onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-700"
              >
                <option value="">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Status Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setFilters({ ...filters, status: "" })}
                className={`px-2.5 py-1.5 rounded-lg border text-xs transition ${
                  !filters.status
                    ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, status: "active" })}
                className={`px-2.5 py-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                  filters.status === "active"
                    ? "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs"
                    : "bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, status: "quarantined" })}
                className={`px-2.5 py-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                  filters.status === "quarantined"
                    ? "bg-amber-600 text-white border-amber-600 font-semibold shadow-xs"
                    : "bg-white text-amber-700 border-slate-200 hover:bg-amber-50"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Quarantined
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, status: "expired" })}
                className={`px-2.5 py-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                  filters.status === "expired"
                    ? "bg-rose-600 text-white border-rose-600 font-semibold shadow-xs"
                    : "bg-white text-rose-700 border-slate-200 hover:bg-rose-50"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Expired
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={loadData}
              title="Refresh"
              disabled={refreshing}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            >
              <Icon name="LuRefreshCw" size={15} className={refreshing ? "animate-spin text-blue-600" : ""} />
            </button>
            {(filters.search || filters.store_id || filters.status) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-rose-600 underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stock Batches Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold">Batch No</th>
                <th className="px-4 py-3.5 text-left font-semibold">Item & Code</th>
                <th className="px-4 py-3.5 text-left font-semibold">Store Location</th>
                <th className="px-4 py-3.5 text-right font-semibold">Qty On Hand</th>
                <th className="px-4 py-3.5 text-center font-semibold">Expiry Date</th>
                <th className="px-4 py-3.5 text-center font-semibold">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold">MRP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((batch) => {
                const exp = expiryStatus(batch.expiry_date);
                const isLow = Number(batch.quantity_on_hand || 0) <= 10;
                return (
                  <tr
                    key={batch.id}
                    className={`hover:bg-blue-50/30 transition-colors ${
                      isLow ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-800 text-xs">
                      {batch.batch_no}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{batch.item_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{batch.item_code}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        <Icon name="LuMapPin" size={11} className="text-slate-400" />
                        {batch.store_name || "Main Store"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-semibold text-slate-900">
                        {batch.quantity_on_hand}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">
                        {batch.base_uom || "units"}
                      </span>
                      {isLow && (
                        <div className="inline-block ml-2 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold text-[10px] tracking-tight border border-rose-200">
                          LOW STOCK
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={exp.color}>{exp.label}</span>
                      {batch.expiry_date && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          {new Date(batch.expiry_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                          STATUS_COLORS[batch.status] || "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                      {batch.mrp !== null && batch.mrp !== undefined ? `₹${Number(batch.mrp).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}

              {batches.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <Icon name="LuPackage" size={24} />
                      </div>
                      <h4 className="font-semibold text-slate-700 text-base mb-1">
                        {isLowStockView ? "No Low Stock Items" : "No Stock Batches Found"}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        {isLowStockView
                          ? "All stock levels are currently healthy and above reorder thresholds."
                          : "No inventory batches matched your search or filter criteria."}
                      </p>
                      {onNavigateToAdd && (
                        <button
                          type="button"
                          onClick={onNavigateToAdd}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                        >
                          <Icon name="LuPlus" size={14} />
                          Add / Receive Stock
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{batches.length}</strong> of{" "}
            <strong className="text-slate-700">{meta.total}</strong> batches
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
