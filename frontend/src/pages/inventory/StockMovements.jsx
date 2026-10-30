import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Icon from "../../components/common/Icon.jsx";

const MOVEMENT_BADGES = {
  purchase_receipt: "bg-emerald-50 text-emerald-700 border-emerald-200",
  transfer_in: "bg-emerald-50 text-emerald-700 border-emerald-200",
  adjustment_in: "bg-emerald-50 text-emerald-700 border-emerald-200",
  opening: "bg-blue-50 text-blue-700 border-blue-200",
  dispense: "bg-rose-50 text-rose-700 border-rose-200",
  transfer_out: "bg-rose-50 text-rose-700 border-rose-200",
  adjustment_out: "bg-rose-50 text-rose-700 border-rose-200",
  write_off_expired: "bg-rose-100 text-rose-800 border-rose-300",
  write_off_damaged: "bg-rose-100 text-rose-800 border-rose-300",
  purchase_return: "bg-amber-50 text-amber-700 border-amber-200",
  dispense_return: "bg-amber-50 text-amber-700 border-amber-200",
  consumption: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function StockMovementsPage({ embedded = false, initialFilters = {} }) {
  const [movements, setMovements] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState({
    organization_id: "",
    store_id: "",
    item_id: "",
    movement_type: "",
    from_date: "",
    to_date: "",
    reference_type: "",
    search: "",
    ...initialFilters,
  });

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters.movement_type, filters.store_id, filters.from_date, filters.to_date]);

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
      const res = await inventoryService.getStockMovements(filters);
      setMovements(res?.data || []);
      setMeta(res?.meta || { page: 1, limit: 50, total: 0 });
    } catch (err) {
      toast.error("Failed to load stock movements");
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
      store_id: "",
      item_id: "",
      movement_type: "",
      from_date: "",
      to_date: "",
      reference_type: "",
      search: "",
    });
  };

  if (loading && !embedded) {
    return (
      <PageContainer title="Stock Movements" subtitle="Append-only ledger of all stock movements">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Stock Movements"}
      subtitle={embedded ? undefined : "Complete audit trail of every stock movement (immutable ledger)"}
      embedded={embedded}
    >
      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 flex flex-wrap gap-3 items-center">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1">
              <input
                type="text"
                placeholder="Search item, batch, reference..."
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
                  onClick={() => {
                    setFilters({ ...filters, search: "" });
                    setTimeout(loadData, 0);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <Icon name="LuX" size={14} />
                </button>
              )}
            </div>

            {/* Movement Type Dropdown */}
            <div className="w-44">
              <select
                value={filters.movement_type}
                onChange={(e) => setFilters({ ...filters, movement_type: e.target.value })}
                className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 text-slate-700"
              >
                <option value="">All Movement Types</option>
                <option value="purchase_receipt">Goods Receipt (GRN)</option>
                <option value="adjustment_in">Adjustment In (+)</option>
                <option value="adjustment_out">Adjustment Out (-)</option>
                <option value="transfer_in">Transfer In</option>
                <option value="transfer_out">Transfer Out</option>
                <option value="dispense">Dispensed</option>
                <option value="write_off_expired">Write-off Expired</option>
                <option value="write_off_damaged">Write-off Damaged</option>
                <option value="purchase_return">Purchase Return</option>
              </select>
            </div>

            {/* Store Dropdown */}
            <div className="w-40">
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

            {/* Date Filters */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>From:</span>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                className="py-1.5 px-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
              />
              <span>To:</span>
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                className="py-1.5 px-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              <Icon name="LuFilter" size={14} />
              Filter
            </button>
            <button
              type="button"
              onClick={loadData}
              title="Refresh ledger"
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all"
            >
              <Icon name="LuRefreshCw" size={14} className={refreshing ? "animate-spin text-blue-600" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            {(filters.search || filters.store_id || filters.movement_type || filters.from_date || filters.to_date) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-rose-600 underline px-1"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold">Timestamp</th>
                <th className="px-4 py-3.5 text-left font-semibold">Item & Code</th>
                <th className="px-4 py-3.5 text-left font-semibold">Batch</th>
                <th className="px-4 py-3.5 text-center font-semibold">Movement Type</th>
                <th className="px-4 py-3.5 text-right font-semibold">Qty Change</th>
                <th className="px-4 py-3.5 text-left font-semibold">Store</th>
                <th className="px-4 py-3.5 text-left font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => {
                const isPositive = Number(m.quantity) > 0;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {new Date(m.moved_at).toLocaleDateString()}{" "}
                      <span className="text-slate-400 text-[11px]">
                        {new Date(m.moved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{m.item_name}</div>
                      {m.item_code && <div className="text-xs text-slate-400 font-mono">{m.item_code}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {m.batch_no || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          MOVEMENT_BADGES[m.movement_type] || "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {m.movement_type?.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isPositive ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {m.store_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {m.reference_type ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {m.reference_type}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}

              {movements.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <Icon name="LuActivity" size={24} />
                      </div>
                      <h4 className="font-semibold text-slate-800 text-base mb-1">
                        No Stock Movements
                      </h4>
                      <p className="text-xs text-slate-400">
                        No stock movement entries found for the selected criteria.
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
            Showing <strong className="text-slate-700">{movements.length}</strong> of{" "}
            <strong className="text-slate-700">{meta.total}</strong> ledger records
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
