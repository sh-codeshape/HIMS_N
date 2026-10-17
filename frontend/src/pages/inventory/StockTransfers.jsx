import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import Icon from "../../components/common/Icon.jsx";

const STATUS_COLORS = {
  requested: "bg-slate-100 text-slate-700",
  approved: "bg-blue-50 text-blue-700",
  in_transit: "bg-indigo-50 text-indigo-700",
  received: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  cancelled: "bg-slate-200 text-slate-600",
};

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState({ organization_id: "", status: "", search: "" });

  const [openModal, setOpenModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [trItems, setTrItems] = useState([]);
  const [newItem, setNewItem] = useState({ item_id: "", requested_qty: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trRes, storeRes, itemRes] = await Promise.all([
        inventoryService.getStockTransfers(filters),
        inventoryService.getStores(),
        inventoryService.getItems(),
      ]);
      setTransfers(trRes.data || []);
      setMeta(trRes.meta || { page: 1, limit: 50, total: 0 });
      setStores(storeRes.data || []);
      setItems(itemRes.data || []);
    } catch (err) {
      toast.error("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    if (!newItem.item_id || !newItem.requested_qty) {
      toast.error("Fill item and quantity");
      return;
    }
    setTrItems([...trItems, { ...newItem, requested_qty: Number(newItem.requested_qty) }]);
    setNewItem({ item_id: "", requested_qty: "" });
  };

  const removeLineItem = (index) => {
    setTrItems(trItems.filter((_, i) => i !== index));
  };

  const createTransfer = async () => {
    if (trItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setCreateLoading(true);
    try {
      await inventoryService.createStockTransfer({
        organization_id: filters.organization_id,
        from_store_id: document.getElementById("tr-from").value,
        to_store_id: document.getElementById("tr-to").value,
        notes: document.getElementById("tr-notes").value || undefined,
        items: trItems.map((it) => ({ item_id: it.item_id, requested_qty: it.requested_qty })),
      });
      toast.success("Transfer requested");
      setOpenModal(false);
      setTrItems([]);
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
    if (!window.confirm("Receive transfer? This moves stock to destination store.")) return;
    try {
      await inventoryService.receiveStockTransfer(id);
      toast.success("Transfer received - stock moved");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to receive");
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

  if (loading) {
    return (
      <PageContainer title="Stock Transfers" subtitle="Request and manage inter-store stock transfers">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Stock Transfers" subtitle="Move stock between stores (pharmacy, ward, OT, etc.)">
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search transfers..."
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
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="in_transit">In Transit</option>
          <option value="received">Received</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Button onClick={loadData} variant="outline" icon>Refresh</Button>
        <Button onClick={() => setOpenModal(true)} variant="primary" icon>
          New Transfer
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Transfer No</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">From Store</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">To Store</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Requested At</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((tr) => (
                <tr key={tr.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-slate-700">{tr.transfer_no}</td>
                  <td className="px-4 py-3 text-slate-600">{tr.from_store_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{tr.to_store_name || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[tr.status] || "bg-slate-100 text-slate-600"}`}>
                      {tr.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{new Date(tr.requested_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {tr.status === "requested" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleApprove(tr.id)} className="mr-2">
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(tr.id)}>
                          Reject
                        </Button>
                      </>
                    )}
                    {tr.status === "approved" && (
                      <Button size="sm" variant="primary" onClick={() => handleReceive(tr.id)}>
                        Receive
                      </Button>
                    )}
                    {(tr.status === "rejected" || tr.status === "cancelled") && (
                      <Button size="sm" variant="ghost">Closed</Button>
                    )}
                  </td>
                </tr>
              ))}
              {!transfers || transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-slate-400 text-center">
                    No transfers found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transfer Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenModal(false)} />
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">Request Stock Transfer</h3>
              <Button size="sm" variant="ghost" onClick={() => setOpenModal(false)}>
                <Icon name="LuX" size={18} />
              </Button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createTransfer(); }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="From Store *"
                  id="tr-from"
                  required
                >
                  <option value="">Select source store</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
                <Select
                  label="To Store *"
                  id="tr-to"
                  required
                >
                  <option value="">Select destination store</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
              <Input
                label="Notes"
                id="tr-notes"
                placeholder="Reason for transfer..."
              />

              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Icon name="LuTruck" size={16} /> Transfer Items
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <Select
                  label="Item *"
                  value={newItem.item_id}
                  onChange={(e) => setNewItem({ ...newItem, item_id: e.target.value })}
                  required
                >
                  <option value="">Select item</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  ))}
                </Select>
                <Input
                  label="Qty *"
                  type="number"
                  value={newItem.requested_qty}
                  onChange={(e) => setNewItem({ ...newItem, requested_qty: e.target.value })}
                  required
                />
                <Button
                  onClick={addLineItem}
                  variant="primary"
                  disabled={createLoading}
                  className="pt-2.5"
                >
                  <Icon name="LuPlus" size={16} />
                </Button>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-slate-200 mb-2">
                      <th className="text-left">Item</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right w-10">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trItems.map((it, idx) => {
                      const itemName = items.find((i) => i.id === it.item_id)?.name || it.item_id;
                      return (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-2 text-slate-700">{itemName}</td>
                          <td className="py-2 text-right text-slate-600">{it.requested_qty}</td>
                          <td className="py-2 text-right">
                            <Button size="sm" variant="ghost" onClick={() => removeLineItem(idx)}>
                              <Icon name="LuTrash2" size={14} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {trItems.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-400 text-xs">No items</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={createLoading || trItems.length === 0}>
                  {createLoading ? "Requesting..." : "Request Transfer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
