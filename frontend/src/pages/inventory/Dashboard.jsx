import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Icon from "../../components/common/Icon.jsx";

const STATUS_COLORS = {
  active: "bg-emerald-100 text-emerald-800",
  quarantined: "bg-amber-100 text-amber-800",
  expired: "bg-rose-100 text-rose-800",
  recalled: "bg-slate-100 text-slate-800",
  depleted: "bg-slate-200 text-slate-600",
};

export default function InventoryDashboard({ embedded = false }) {
  const [stats, setStats] = useState({
    total_stock_value: 0,
    low_stock_count: 0,
    expiring_soon_count: 0,
    recent_movements: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await inventoryService.getDashboard();
      setStats(data || {});
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${
        STATUS_COLORS[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );

  if (loading && !embedded) {
    return (
      <PageContainer title="Inventory Dashboard" subtitle="Overview of stock across all stores">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Inventory Dashboard"}
      subtitle={embedded ? undefined : "Real-time overview of stock across all stores and warehouses"}
      embedded={embedded}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Stock Value</p>
              <h3 className="text-2xl font-bold text-slate-900">₹{stats.total_stock_value?.toLocaleString() || "0"}</h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Icon name="LuWallet" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Low Stock Items</p>
              <h3 className={`text-2xl font-bold ${stats.low_stock_count > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {stats.low_stock_count || 0}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 text-slate-600">
              <Icon name="LuAlertTriangle" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Expiring Soon (30 days)</p>
              <h3 className={`text-2xl font-bold ${stats.expiring_soon_count > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {stats.expiring_soon_count || 0}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 text-slate-600">
              <Icon name="LuClock" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movements */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Icon name="LuActivity" size={18} /> Recent Stock Movements
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Batch</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Store</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recent_movements || []).map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(m.moved_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{m.item_name}</td>
                    <td className="px-4 py-3 text-slate-600">{m.batch_no}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                        {m.movement_type.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.store_name}</td>
                  </tr>
                ))}
                {!stats.recent_movements || stats.recent_movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-slate-400 text-center">
                      No recent movements
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Icon name="LuZap" size={18} /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => (window.location.href = "/inventory/stock")}
              variant="primary"
              fullWidth
              icon
            >
              View Stock
            </Button>
            <Button
              onClick={() => (window.location.href = "/inventory/stock-adjustment")}
              variant="outline"
              fullWidth
            >
              Stock Adjustment
            </Button>
            <Button
              onClick={() => (window.location.href = "/inventory/purchase-orders")}
              variant="primary"
              fullWidth
            >
              Purchase Orders
            </Button>
            <Button
              onClick={() => (window.location.href = "/inventory/goods-receipts")}
              variant="outline"
              fullWidth
            >
              Goods Receipts
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function Button({ children, onClick, variant = "primary", fullWidth, icon }) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50",
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-4 py-2.5 text-sm transition-all duration-200 ${variants[variant]} ${fullWidth ? "w-full" : ""}`}
    >
      {icon && <Icon name="LuArrowRight" size={14} className="flex-shrink-0" />}
      {children}
    </button>
  );
}
