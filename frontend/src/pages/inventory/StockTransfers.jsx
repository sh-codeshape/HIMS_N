import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Icon from "../../components/common/Icon.jsx";

const STATUS_COLORS = {
  requested: "bg-slate-100 text-slate-700 border-slate-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  in_transit: "bg-indigo-50 text-indigo-700 border-indigo-200",
  received: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-slate-200 text-slate-600 border-slate-300",
};

export default function StockTransfersPage({ embedded = false }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState({ organization_id: "", status: "", search: "" });

  const [openModal, setOpenModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    from_store_id: "",
    to_store_id: "",
    notes: "",
  });

  const [trItems, setTrItems] = useState([]);
  const [newItem, setNewItem] = useState({ item_id: "", requested_qty: "" });

  useEffect(() => {
    loadData();
  }, [filters.status]);

  const loadData = async () => {
    try {
      const [trRes, storeRes, itemRes] = await Promise.all([
        inventoryService.getStockTransfers(filters),
        inventoryService.getStores(),
        inventoryService.getItems(),
      ]);
      setTransfers(trRes?.data || []);
      setMeta(trRes?.meta || { page: 1, limit: 50, total: 0 });
      setStores(storeRes?.data || []);
      setItems(itemRes?.data || []);
    } catch (err) {
      toast.error("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    if (!newItem.item_id || !newItem.requested_qty) {
      toast.error("Please fill item and quantity");
      return;
    }
    const qty = Number(newItem.requested_qty);
    if (qty <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }
    setTrItems([...trItems, { item_id: newItem.item_id, requested_qty: qty }]);
    setNewItem({ item_id: "", requested_qty: "" });
  };

  const removeLineItem = (index) => {
    setTrItems(trItems.filter((_, i) => i !== index));
  };

  const createTransfer = async (e) => {
    if (e) e.preventDefault();
    if (!headerForm.from_store_id || !headerForm.to_store_id) {
      toast.error("Select both source and destination stores");
      return;
    }
    if (headerForm.from_store_id === headerForm.to_store_id) {
      toast.error("Source and destination store cannot be the same");
      return;
    }
    if (trItems.length === 0) {
      toast.error("Add at least one item to transfer");
      return;
    }

    setCreateLoading(true);
    try {
      await inventoryService.createStockTransfer({
        organization_id: filters.organization_id || undefined,
        from_store_id: headerForm.from_store_id,
        to_store_id: headerForm.to_store_id,
        notes: headerForm.notes || undefined,
        items: trItems.map((it) => ({ item_id: it.item_id, requested_qty: it.requested_qty })),
      });
      toast.success("Stock transfer requested successfully");
      setOpenModal(false);
      setTrItems([]);
      setHeaderForm({ from_store_id: "", to_store_id: "", notes: "" });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to create transfer");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await inventoryService.approveStockTransfer(id);
      toast.success("Transfer approved");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to approve");
    }
  };

  const handleReceive = async (id) => {
    if (!window.confirm("Receive transfer? This moves stock into destination store.")) return;
    try {
      await inventoryService.receiveStockTransfer(id);
      toast.success("Transfer received — stock relocated successfully");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to receive transfer");
    }
  };

  const handleReject = async (id) => {
    try {
      await inventoryService.rejectStockTransfer(id);
      toast.success("Transfer rejected");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to reject");
    }
  };

  if (loading && !embedded) {
    return (
      <PageContainer title="Stock Transfers" subtitle="Request and manage inter-store stock transfers">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Stock Transfers"}
      subtitle={embedded ? undefined : "Move stock between internal stores (pharmacy, wards, OT, central)"}
      embedded={embedded}
    >
      {/* Search & Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1">
              <input
                type="text"
                placeholder="Search transfer #, store, or items..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
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

            {/* Status Filter */}
            <div className="w-44">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="in_transit">In Transit</option>
                <option value="received">Received</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              title="Refresh list"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
            >
              <Icon name="LuRefreshCw" size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setOpenModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              <Icon name="LuArrowLeftRight" size={16} />
              Request Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold">Transfer No</th>
                <th className="px-4 py-3.5 text-left font-semibold">Source (From)</th>
                <th className="px-4 py-3.5 text-left font-semibold">Destination (To)</th>
                <th className="px-4 py-3.5 text-center font-semibold">Status</th>
                <th className="px-4 py-3.5 text-left font-semibold">Requested At</th>
                <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 text-xs">
                    {tr.transfer_no}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {tr.from_store_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {tr.to_store_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        STATUS_COLORS[tr.status] || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {tr.status?.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {new Date(tr.requested_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {tr.status === "requested" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(tr.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(tr.id)}
                            className="px-2 py-1 text-xs font-medium rounded text-rose-600 hover:bg-rose-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {tr.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => handleReceive(tr.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                        >
                          Receive Stock
                        </button>
                      )}
                      {tr.status === "received" && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <Icon name="LuCheckCircle2" size={13} /> Completed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {transfers.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <Icon name="LuArrowLeftRight" size={24} />
                      </div>
                      <h4 className="font-semibold text-slate-800 text-base mb-1">
                        No Internal Transfers
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        Request a stock transfer to relocate items between stores, pharmacy, or wards.
                      </p>
                      <button
                        type="button"
                        onClick={() => setOpenModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                      >
                        <Icon name="LuPlus" size={14} />
                        Request Transfer
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total <strong className="text-slate-700">{transfers.length}</strong> transfer records
          </span>
        </div>
      </div>

      {/* Create Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenModal(false)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto relative z-10 border border-slate-100 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon name="LuArrowLeftRight" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Request Stock Transfer</h3>
                  <p className="text-xs text-slate-500">Relocate items between internal hospital stores</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <form onSubmit={createTransfer} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Source Store (From) *</label>
                  <select
                    value={headerForm.from_store_id}
                    onChange={(e) => setHeaderForm({ ...headerForm, from_store_id: e.target.value })}
                    required
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                  >
                    <option value="">Select Origin</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Destination Store (To) *</label>
                  <select
                    value={headerForm.to_store_id}
                    onChange={(e) => setHeaderForm({ ...headerForm, to_store_id: e.target.value })}
                    required
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                  >
                    <option value="">Select Destination</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Transfer Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Ward replenishment, emergency stock request"
                  value={headerForm.notes}
                  onChange={(e) => setHeaderForm({ ...headerForm, notes: e.target.value })}
                  className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                />
              </div>

              {/* Add items */}
              <div className="border border-slate-200/80 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-800 text-xs">Items to Transfer</h4>
                  <span className="text-[11px] text-slate-400">Add catalog items</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Item *</label>
                    <select
                      value={newItem.item_id}
                      onChange={(e) => setNewItem({ ...newItem, item_id: e.target.value })}
                      className="w-full py-1.5 px-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                    >
                      <option value="">Select Item</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>{it.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Quantity *</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={newItem.requested_qty}
                        onChange={(e) => setNewItem({ ...newItem, requested_qty: e.target.value })}
                        className="w-full py-1.5 px-2 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                      />
                      <button
                        type="button"
                        onClick={addLineItem}
                        className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        <Icon name="LuPlus" size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-left">Item</th>
                        <th className="py-2 px-3 text-right">Requested Qty</th>
                        <th className="py-2 px-3 text-center w-10">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trItems.map((it, idx) => {
                        const itemObj = items.find((i) => i.id === it.item_id);
                        return (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium text-slate-800">{itemObj?.name || it.item_id}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{it.requested_qty}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeLineItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Icon name="LuTrash2" size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {trItems.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400">
                            No items added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || trItems.length === 0}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                >
                  {createLoading ? "Submitting..." : "Submit Transfer Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
