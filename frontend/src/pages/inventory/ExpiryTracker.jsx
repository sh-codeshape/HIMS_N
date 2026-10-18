import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Icon from "../../components/common/Icon.jsx";

const EXPIRY_SEVERITY = {
  expired: "bg-rose-100 text-rose-800 border-rose-200",
  critical: "bg-rose-50 text-rose-700 border-rose-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  ok: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export default function ExpiryTrackerPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    organization_id: "",
    store_id: "",
    days_ahead: "30",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await inventoryService.getExpiryTracker(filters);
      setBatches(res || []);
    } catch (err) {
      toast.error("Failed to load expiry tracker");
    } finally {
      setLoading(false);
    }
  };

  const severity = (expiryDate) => {
    if (!expiryDate) return { label: "No Expiry", color: EXPIRY_SEVERITY.ok };
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "EXPIRED", color: EXPIRY_SEVERITY.expired };
    if (days <= 7) return { label: `CRITICAL - ${days}d`, color: EXPIRY_SEVERITY.critical };
    if (days <= 30) return { label: `WARNING - ${days}d`, color: EXPIRY_SEVERITY.warning };
    return { label: `OK - ${days}d`, color: EXPIRY_SEVERITY.ok };
  };

  if (loading) {
    return (
      <PageContainer title="Expiry Tracker" subtitle="Monitor batches approaching expiry">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Expiry Tracker" subtitle="Track batches nearing expiry to prevent stock loss">
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <Select
          value={filters.days_ahead}
          onChange={(e) => setFilters({ ...filters, days_ahead: e.target.value })}
          placeholder="Days ahead"
        >
          <option value="30">Next 30 days</option>
          <option value="60">Next 60 days</option>
          <option value="90">Next 90 days</option>
        </Select>
        <ButtonInline onClick={loadData} label="Refresh" icon />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Batch No</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Item</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Store</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Qty</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Expiry Date</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Severity</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">MRP</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const sev = severity(b.expiry_date);
                return (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-700">{b.batch_no}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{b.item_name}</td>
                    <td className="px-4 py-3 text-slate-600">{b.store_name}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-800">{b.quantity_on_hand}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-600 text-xs">
                      {b.expiry_date || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${sev.color}`}>
                        {sev.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {b.mrp !== null && b.mrp !== undefined ? `₹${b.mrp}` : "—"}
                    </td>
                  </tr>
                );
              })}
              {!batches || batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-slate-400 text-center">
                    No batches nearing expiry
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
