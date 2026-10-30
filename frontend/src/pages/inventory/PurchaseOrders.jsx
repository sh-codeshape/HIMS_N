import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Icon from "../../components/common/Icon.jsx";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  sent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  partially_received: "bg-amber-50 text-amber-700 border-amber-200",
  received: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  closed: "bg-slate-200 text-slate-600 border-slate-300",
};

export default function PurchaseOrdersPage({ embedded = false, initialOpenModal = false }) {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState({
    organization_id: "",
    status: "",
    search: "",
  });

  // Modal & form states
  const [openModal, setOpenModal] = useState(initialOpenModal);
  const [createLoading, setCreateLoading] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    supplier_id: "",
    store_id: "",
    expected_date: "",
    notes: "",
  });

  const [poItems, setPoItems] = useState([]);
  const [newItem, setNewItem] = useState({
    item_id: "",
    ordered_qty: "",
    unit_cost: "",
    discount_percent: "0",
    tax_amount: "0",
    line_total: "0",
  });

  useEffect(() => {
    loadData();
  }, [filters.status]);

  const loadData = async () => {
    try {
      const [poRes, supRes, storeRes, itemRes] = await Promise.all([
        inventoryService.getPurchaseOrders(filters),
        inventoryService.getSuppliers(),
        inventoryService.getStores(),
        inventoryService.getItems(),
      ]);
      setPos(poRes?.data || []);
      setMeta(poRes?.meta || { page: 1, limit: 50, total: 0 });
      setSuppliers(supRes?.data || []);
      setStores(storeRes?.data || []);
      setItems(itemRes?.data || []);
    } catch (err) {
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (e) => {
    const selectedId = e.target.value;
    const it = items.find((i) => i.id === selectedId);
    setNewItem((prev) => ({
      ...prev,
      item_id: selectedId,
      unit_cost: prev.unit_cost || (it?.unit_cost ? String(it.unit_cost) : ""),
    }));
  };

  const handleQtyCostChange = (field, val) => {
    setNewItem((prev) => {
      const updated = { ...prev, [field]: val };
      const qty = Number(field === "ordered_qty" ? val : updated.ordered_qty) || 0;
      const cost = Number(field === "unit_cost" ? val : updated.unit_cost) || 0;
      const disc = Number(updated.discount_percent) || 0;
      const tax = Number(updated.tax_amount) || 0;
      const sub = qty * cost;
      const discAmt = (sub * disc) / 100;
      updated.line_total = Math.max(0, sub - discAmt + tax).toFixed(2);
      return updated;
    });
  };

  const addLineItem = () => {
    if (!newItem.item_id || !newItem.ordered_qty || !newItem.unit_cost) {
      toast.error("Please fill item, quantity, and unit cost");
      return;
    }
    const qty = Number(newItem.ordered_qty);
    const cost = Number(newItem.unit_cost);
    const lineTotal = Number(newItem.line_total) || (qty * cost);

    setPoItems((prev) => [
      ...prev,
      {
        ...newItem,
        ordered_qty: qty,
        unit_cost: cost,
        line_total: lineTotal,
      },
    ]);

    setNewItem({
      item_id: "",
      ordered_qty: "",
      unit_cost: "",
      discount_percent: "0",
      tax_amount: "0",
      line_total: "0",
    });
  };

  const removeLineItem = (index) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const createPO = async (e) => {
    if (e) e.preventDefault();
    if (!headerForm.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }
    if (!headerForm.store_id) {
      toast.error("Please select a target store");
      return;
    }
    if (poItems.length === 0) {
      toast.error("Add at least one item to this purchase order");
      return;
    }

    setCreateLoading(true);
    try {
      await inventoryService.createPurchaseOrder({
        organization_id: filters.organization_id || undefined,
        supplier_id: headerForm.supplier_id,
        store_id: headerForm.store_id,
        expected_date: headerForm.expected_date || undefined,
        notes: headerForm.notes || undefined,
        items: poItems.map((it) => ({
          item_id: it.item_id,
          ordered_qty: it.ordered_qty,
          unit_cost: it.unit_cost,
          discount_percent: it.discount_percent,
          tax_amount: it.tax_amount,
          line_total: it.line_total,
        })),
      });
      toast.success("Purchase Order created successfully (Draft)");
      setOpenModal(false);
      setPoItems([]);
      setHeaderForm({
        supplier_id: "",
        store_id: "",
        expected_date: "",
        notes: "",
      });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to create PO");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this purchase order?")) return;
    try {
      await inventoryService.approvePurchaseOrder(id);
      toast.success("PO approved successfully");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to approve PO");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this purchase order?")) return;
    try {
      await inventoryService.cancelPurchaseOrder(id);
      toast.success("PO cancelled");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to cancel PO");
    }
  };

  const totalAmount = poItems.reduce((sum, it) => sum + Number(it.line_total || 0), 0);

  if (loading && !embedded) {
    return (
      <PageContainer title="Purchase Orders" subtitle="Create and manage purchase orders for inventory procurement">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Purchase Orders (PO)"}
      subtitle={embedded ? undefined : "Procure items from suppliers and create delivery orders"}
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
                placeholder="Search PO #, supplier, or items..."
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
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="sent">Sent to Supplier</option>
                <option value="partially_received">Partially Received</option>
                <option value="received">Received in Full</option>
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
              <Icon name="LuPlus" size={16} />
              New Purchase Order
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold">PO Number</th>
                <th className="px-4 py-3.5 text-left font-semibold">Supplier</th>
                <th className="px-4 py-3.5 text-left font-semibold">Store Location</th>
                <th className="px-4 py-3.5 text-center font-semibold">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold">Total Order</th>
                <th className="px-4 py-3.5 text-center font-semibold">Order Date</th>
                <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pos.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 text-xs">
                    {po.po_number}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {po.supplier_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      <Icon name="LuMapPin" size={11} className="text-slate-400" />
                      {po.store_name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        STATUS_COLORS[po.status] || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {po.status?.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    ₹{Number(po.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 text-xs">
                    {new Date(po.order_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {po.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => handleApprove(po.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                          title="Approve PO"
                        >
                          Approve
                        </button>
                      )}
                      {po.status !== "cancelled" && po.status !== "received" && (
                        <button
                          type="button"
                          onClick={() => handleCancel(po.id)}
                          className="px-2 py-1 text-xs font-medium rounded text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Cancel PO"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {pos.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <Icon name="LuClipboardList" size={24} />
                      </div>
                      <h4 className="font-semibold text-slate-800 text-base mb-1">
                        No Purchase Orders Found
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        Generate purchase orders to procure items from suppliers.
                      </p>
                      <button
                        type="button"
                        onClick={() => setOpenModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                      >
                        <Icon name="LuPlus" size={14} />
                        Create Purchase Order
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
            Total <strong className="text-slate-700">{pos.length}</strong> purchase orders
          </span>
        </div>
      </div>

      {/* Create PO Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenModal(false)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto relative z-10 border border-slate-100 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon name="LuClipboardList" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create Purchase Order (PO)</h3>
                  <p className="text-xs text-slate-500">Specify supplier, target store, delivery expectation, and ordered items</p>
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

            {/* Modal Form */}
            <form onSubmit={createPO} className="p-6 space-y-6">
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Supplier / Vendor *</label>
                  <select
                    value={headerForm.supplier_id}
                    onChange={(e) => setHeaderForm({ ...headerForm, supplier_id: e.target.value })}
                    required
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Destination Store *</label>
                  <select
                    value={headerForm.store_id}
                    onChange={(e) => setHeaderForm({ ...headerForm, store_id: e.target.value })}
                    required
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800"
                  >
                    <option value="">Select Store</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={headerForm.expected_date}
                    onChange={(e) => setHeaderForm({ ...headerForm, expected_date: e.target.value })}
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Terms / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Net 30 payment"
                    value={headerForm.notes}
                    onChange={(e) => setHeaderForm({ ...headerForm, notes: e.target.value })}
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Line Items Entry */}
              <div className="border border-slate-200/80 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <Icon name="LuBoxes" size={16} className="text-blue-600" />
                    Order Line Items
                  </h4>
                  <span className="text-xs text-slate-400">Add products and order quantities</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-3 items-end">
                  {/* Item select */}
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Item *</label>
                    <select
                      value={newItem.item_id}
                      onChange={handleItemSelect}
                      className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                    >
                      <option value="">Select Item from Catalog</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} {it.code ? `(${it.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Qty */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ordered Qty *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={newItem.ordered_qty}
                      onChange={(e) => handleQtyCostChange("ordered_qty", e.target.value)}
                      className="w-full py-1.5 px-2.5 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                    />
                  </div>

                  {/* Cost */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unit Cost (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Cost"
                      value={newItem.unit_cost}
                      onChange={(e) => handleQtyCostChange("unit_cost", e.target.value)}
                      className="w-full py-1.5 px-2.5 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                    />
                  </div>

                  {/* Calculated total */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Line Total</label>
                    <div className="py-1.5 px-2.5 text-xs font-mono font-bold text-slate-800 bg-slate-100 rounded-md">
                      ₹{newItem.line_total || "0.00"}
                    </div>
                  </div>

                  {/* Add button */}
                  <div>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="w-full py-1.5 px-3 rounded-md bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Icon name="LuPlus" size={14} />
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Items table */}
                <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-left">Item Name</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                        <th className="py-2 px-3 text-right">Unit Cost</th>
                        <th className="py-2 px-3 text-right">Line Total</th>
                        <th className="py-2 px-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {poItems.map((it, idx) => {
                        const itemObj = items.find((i) => i.id === it.item_id);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {itemObj?.name || it.item_id}
                              {itemObj?.code && <span className="text-[10px] text-slate-400 ml-1">({itemObj.code})</span>}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-medium text-slate-800">
                              {it.ordered_qty}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">₹{it.unit_cost}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              ₹{Number(it.line_total || 0).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeLineItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                              >
                                <Icon name="LuTrash2" size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {poItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No items added yet. Choose an item above and specify quantity to add.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">
                      Items: <strong>{poItems.length}</strong>
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      Total Order: <span className="text-blue-600">₹{totalAmount.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
                  disabled={createLoading || poItems.length === 0}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                >
                  {createLoading ? (
                    <>
                      <Icon name="LuRefreshCw" size={14} className="animate-spin" />
                      Creating PO...
                    </>
                  ) : (
                    <>
                      <Icon name="LuCheck" size={16} />
                      Save Purchase Order (Draft)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
