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

export default function StockPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState({
    organization_id: "",
    facility_id: "",
    store_id: "",
    item_id: "",
    status: "",
    low_stock: "",
    search: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await inventoryService.getStockBatches(filters);
      setBatches(res.data || []);
      setMeta(res.meta || { page: 1, limit: 50, total: 0 });
    } catch (err) {
      toast.error("Failed to load stock batches");
    } finally {
      setLoading(false);
    }
  };

  const expiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: "No Expiry", color: "text-slate-500" };
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Expired", color: "text-rose-600 font-semibold" };
    if (days <= 30) return { label: `Expires in ${days}d`, color: "text-rose-600 font-semibold" };
    if (days <= 90) return { label: `Expires in ${days}d`, color: "text-amber-600 font-semibold" };
    return { label: `Expires in ${days}d`, color: "text-emerald-600 text-xs" };
  };

  if (loading) {
    return (
      <PageContainer title="Stock" subtitle="View and manage stock batches across all stores">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Stock" subtitle="Track stock batches, quantities, and expiry across stores">
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search item or batch..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            icon
          />
        </div>
        <Select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          placeholder="Status"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="quarantined">Quarantined</option>
          <option value="expired">Expired</option>
          <option value="depleted">Depleted</option>
        </Select>
        <Select
          value={filters.low_stock}
          onChange={(e) => setFilters({ ...filters, low_stock: e.target.value })}
          placeholder="Stock Level"
        >
          <option value="">All Levels</option>
          <option value="true">Low Stock Only</option>
          <option value="false">Healthy Stock</option>
        </Select>
        <ButtonInline
          onClick={loadData}
          label="Refresh"
          icon
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Batch No</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Item</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Store</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Qty On Hand</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Expiry</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">MRP</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const exp = expiryStatus(batch.expiry_date);
                const isLow = Number(batch.quantity_on_hand || 0) <= 10;
                return (
                  <tr
                    key={batch.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                      isLow ? "bg-rose-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-slate-700">{batch.batch_no}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {batch.item_name} <span className="text-xs text-slate-400 ml-2">({batch.item_code})</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{batch.store_name}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      {batch.quantity_on_hand} {batch.base_uom}
                      {isLow && <span className="ml-1 text-rose-600 text-xs font-semibold">↓LOW</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={exp.color}>{exp.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${STATUS_COLORS[batch.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {batch.mrp !== null && batch.mrp !== undefined ? `₹${batch.mrp}` : "—"}
                    </td>
                  </tr>
                );
              })}
              {!batches || batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-slate-400 text-center">
                    No stock batches found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 bg-slate-50 p-3 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {batches.length} of {meta.total} batches</span>
        </div>
      </div>
    </PageContainer>
  );
}

function ButtonInline({ onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 font-semibold rounded-lg px-3 py-2 text-sm transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700"
    >
      {icon && <Icon name="LuRefreshCw" size={14} className="flex-shrink-0" />}
      {label}
    </button>
  );
}
