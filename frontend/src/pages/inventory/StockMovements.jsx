import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Icon from "../../components/common/Icon.jsx";

const MOVEMENT_BADGES = {
  purchase_receipt: "bg-emerald-50 text-emerald-700",
  transfer_in: "bg-emerald-50 text-emerald-700",
  adjustment_in: "bg-emerald-50 text-emerald-700",
  opening: "bg-blue-50 text-blue-700",
  dispense: "bg-rose-50 text-rose-700",
  transfer_out: "bg-rose-50 text-rose-700",
  adjustment_out: "bg-rose-50 text-rose-700",
  write_off_expired: "bg-rose-100 text-rose-800",
  write_off_damaged: "bg-rose-100 text-rose-800",
  purchase_return: "bg-amber-50 text-amber-700",
  dispense_return: "bg-amber-50 text-amber-700",
  consumption: "bg-amber-50 text-amber-700",
};

export default function StockMovementsPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
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
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await inventoryService.getStockMovements(filters);
      setMovements(res.data || []);
      setMeta(res.meta || { page: 1, limit: 50, total: 0 });
    } catch (err) {
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Stock Movements" subtitle="Append-only ledger of all stock movements">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Stock Movements" subtitle="Complete audit trail of every stock movement (immutable ledger)">
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search item, batch, or reference..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            icon
          />
        </div>
        <Input
          label="From"
          type="date"
          value={filters.from_date}
          onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
        />
        <Input
          label="To"
          type="date"
          value={filters.to_date}
          onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
        />
        <ButtonInline onClick={loadData} label="Refresh" icon />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Moved At</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Item</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Batch</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Type</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Quantity</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Store</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {new Date(m.moved_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.item_name}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{m.batch_no}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${MOVEMENT_BADGES[m.movement_type] || "bg-slate-50 text-slate-700"}`}>
                      {m.movement_type.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">
                    {m.quantity > 0 ? (
                      <>
                        <span className="text-emerald-600">+</span>{m.quantity}
                      </>
                    ) : (
                      <span className="text-rose-600">{m.quantity}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.store_name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {m.reference_type || "—"}
                  </td>
                </tr>
              ))}
              {!movements || movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-slate-400 text-center">
                    No stock movements found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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
