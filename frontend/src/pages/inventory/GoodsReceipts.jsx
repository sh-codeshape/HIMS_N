import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import Icon from "../../components/common/Icon.jsx";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function GoodsReceiptsPage({ embedded = false, initialOpenModal = false }) {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [pos, setPos] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState({ organization_id: "", status: "", search: "" });

  const [openModal, setOpenModal] = useState(initialOpenModal);
  const [createLoading, setCreateLoading] = useState(false);
  const [autoPost, setAutoPost] = useState(true);
  
  // Header form fields
  const [headerForm, setHeaderForm] = useState({
    supplier_id: "",
    store_id: "",
    purchase_order_id: "",
    supplier_invoice_no: "",
  });

  const [grItems, setGrItems] = useState([]);
  const [newItem, setNewItem] = useState({
    item_id: "",
    batch_no: "",
    received_qty: "",
    free_qty: "0",
    unit_cost: "",
    mrp: "",
    line_total: "",
    expiry_date: "",
  });

  useEffect(() => {
    loadData();
  }, [filters.status]);

  const loadData = async () => {
    try {
      const [grRes, supRes, storeRes, poRes, itemsRes] = await Promise.all([
        inventoryService.getGoodsReceipts(filters),
        inventoryService.getSuppliers(),
        inventoryService.getStores(),
        inventoryService.getPurchaseOrders({ status: "approved" }),
        inventoryService.getItems(),
      ]);
      setGrns(grRes?.data || []);
      setMeta(grRes?.meta || { page: 1, limit: 50, total: 0 });
      setSuppliers(supRes?.data || []);
      setStores(storeRes?.data || []);
      setPos(poRes?.data || []);
      setItems(itemsRes?.data || []);
    } catch (err) {
      toast.error("Failed to load goods receipts");
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (e) => {
    const selectedId = e.target.value;
    const itemObj = items.find((i) => i.id === selectedId);
    setNewItem((prev) => ({
      ...prev,
      item_id: selectedId,
      unit_cost: prev.unit_cost || (itemObj?.unit_cost ? String(itemObj.unit_cost) : ""),
      mrp: prev.mrp || (itemObj?.mrp ? String(itemObj.mrp) : ""),
    }));
  };

  const handleQtyCostChange = (field, val) => {
    setNewItem((prev) => {
      const updated = { ...prev, [field]: val };
      const qty = Number(field === "received_qty" ? val : updated.received_qty) || 0;
      const cost = Number(field === "unit_cost" ? val : updated.unit_cost) || 0;
      updated.line_total = (qty * cost).toFixed(2);
      return updated;
    });
  };

  const addLineItem = () => {
    if (!newItem.item_id || !newItem.batch_no || !newItem.received_qty || !newItem.unit_cost) {
      toast.error("Please fill item, batch no, quantity, and unit cost");
      return;
    }
    const qty = Number(newItem.received_qty);
    const cost = Number(newItem.unit_cost);
    const lineTotal = Number(newItem.line_total) || (qty * cost);

    setGrItems((prev) => [
      ...prev,
      {
        ...newItem,
        received_qty: qty,
        free_qty: Number(newItem.free_qty) || 0,
        unit_cost: cost,
        line_total: lineTotal,
      },
    ]);

    setNewItem({
      item_id: "",
      batch_no: "",
      received_qty: "",
      free_qty: "0",
      unit_cost: "",
      mrp: "",
      line_total: "",
      expiry_date: "",
    });
  };

  const removeLineItem = (index) => {
    setGrItems((prev) => prev.filter((_, i) => i !== index));
  };

  const createGRN = async (e) => {
    if (e) e.preventDefault();
    if (!headerForm.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }
    if (!headerForm.store_id) {
      toast.error("Please select a receiving store");
      return;
    }
    if (grItems.length === 0) {
      toast.error("Add at least one item to this receipt");
      return;
    }

    setCreateLoading(true);
    try {
      const created = await inventoryService.createGoodsReceipt({
        organization_id: filters.organization_id || undefined,
        supplier_id: headerForm.supplier_id,
        store_id: headerForm.store_id,
        purchase_order_id: headerForm.purchase_order_id || undefined,
        supplier_invoice_no: headerForm.supplier_invoice_no || undefined,
        items: grItems.map((it) => ({
          item_id: it.item_id,
          batch_no: it.batch_no,
          received_qty: it.received_qty,
          free_qty: Number(it.free_qty) || 0,
          unit_cost: it.unit_cost,
          mrp: it.mrp ? Number(it.mrp) : undefined,
          line_total: it.line_total,
          expiry_date: it.expiry_date || undefined,
        })),
      });

      if (autoPost && created?.id) {
        try {
          await inventoryService.postGoodsReceipt(created.id);
          toast.success("Delivery received and stock posted to batches!");
        } catch {
          toast.success("Goods Receipt saved as draft");
        }
      } else {
        toast.success("Goods Receipt created successfully (Draft)");
      }

      setOpenModal(false);
      setGrItems([]);
      setHeaderForm({
        supplier_id: "",
        store_id: "",
        purchase_order_id: "",
        supplier_invoice_no: "",
      });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to create GRN");
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePost = async (id) => {
    if (!window.confirm("Post this goods receipt? This will immediately add the items and quantities into live stock.")) {
      return;
    }
    try {
      await inventoryService.postGoodsReceipt(id);
      toast.success("GRN posted — stock updated successfully!");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to post GRN");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this goods receipt?")) return;
    try {
      await inventoryService.cancelGoodsReceipt(id);
      toast.success("GRN cancelled");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to cancel GRN");
    }
  };

  const totalAmount = grItems.reduce((sum, it) => sum + Number(it.line_total || 0), 0);

  if (loading && !embedded) {
    return (
      <PageContainer title="Goods Receipts" subtitle="Record goods received from suppliers against purchase orders">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Goods Receipts (GRN)"}
      subtitle={embedded ? undefined : "Receive goods from suppliers and post quantities directly into store stock"}
      embedded={embedded}
    >
      {/* Top Action & Filter Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1">
              <input
                type="text"
                placeholder="Search by GRN #, invoice, or supplier..."
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
            <div className="w-40">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft (Pending Post)</option>
                <option value="posted">Posted (Stock Added)</option>
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
              New Goods Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold">GRN Number</th>
                <th className="px-4 py-3.5 text-left font-semibold">Supplier</th>
                <th className="px-4 py-3.5 text-left font-semibold">Destination Store</th>
                <th className="px-4 py-3.5 text-center font-semibold">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold">Total Amount</th>
                <th className="px-4 py-3.5 text-left font-semibold">Received Date</th>
                <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grns.map((gr) => (
                <tr key={gr.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 text-xs">
                    {gr.grn_number}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {gr.supplier_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      <Icon name="LuMapPin" size={11} className="text-slate-400" />
                      {gr.store_name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${
                        STATUS_COLORS[gr.status] || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {gr.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    ₹{Number(gr.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {new Date(gr.received_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {gr.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => handlePost(gr.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                          title="Post to Stock"
                        >
                          Post Stock
                        </button>
                      )}
                      {gr.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => handleCancel(gr.id)}
                          className="px-2 py-1 text-xs font-medium rounded text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Cancel GRN"
                        >
                          Cancel
                        </button>
                      )}
                      {gr.status === "posted" && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <Icon name="LuCheckCircle2" size={13} /> Stock added
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {grns.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <Icon name="LuPackageCheck" size={24} />
                      </div>
                      <h4 className="font-semibold text-slate-800 text-base mb-1">
                        No Goods Receipts Yet
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        Record your first vendor delivery to generate batches and add stock.
                      </p>
                      <button
                        type="button"
                        onClick={() => setOpenModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                      >
                        <Icon name="LuPlus" size={14} />
                        Create First GRN
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
            Total <strong className="text-slate-700">{grns.length}</strong> goods receipts
          </span>
        </div>
      </div>

      {/* Create GRN Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenModal(false)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto relative z-10 border border-slate-100 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon name="LuPackageCheck" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Record Goods Receipt (GRN)</h3>
                  <p className="text-xs text-slate-500">Receive delivery from supplier, specify batches, and prepare to post</p>
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

            {/* Modal Body */}
            <form onSubmit={createGRN} className="p-6 space-y-6">
              {/* Top Form Grid */}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Receiving Store *</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Link Purchase Order</label>
                  <select
                    value={headerForm.purchase_order_id}
                    onChange={(e) => setHeaderForm({ ...headerForm, purchase_order_id: e.target.value })}
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800"
                  >
                    <option value="">Direct Receipt (No PO)</option>
                    {pos.map((p) => (
                      <option key={p.id} value={p.id}>{p.po_number} (₹{p.total_amount})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Vendor Invoice No</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-901"
                    value={headerForm.supplier_invoice_no}
                    onChange={(e) => setHeaderForm({ ...headerForm, supplier_invoice_no: e.target.value })}
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Line Items Entry Section */}
              <div className="border border-slate-200/80 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <Icon name="LuBoxes" size={16} className="text-blue-600" />
                    Add Received Line Items
                  </h4>
                  <span className="text-xs text-slate-400">Specify batch, quantities, and costs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 mb-3 items-end">
                  {/* Item selection */}
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

                  {/* Batch No */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Batch No *</label>
                    <input
                      type="text"
                      placeholder="e.g. BTH-881"
                      value={newItem.batch_no}
                      onChange={(e) => setNewItem({ ...newItem, batch_no: e.target.value })}
                      className="w-full py-1.5 px-2.5 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                    />
                  </div>

                  {/* Received Qty */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Recv Qty *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={newItem.received_qty}
                      onChange={(e) => handleQtyCostChange("received_qty", e.target.value)}
                      className="w-full py-1.5 px-2.5 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                    />
                  </div>

                  {/* Unit Cost */}
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

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={newItem.expiry_date}
                      onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
                      className="w-full py-1.5 px-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                    />
                  </div>

                  {/* Add Button */}
                  <div>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="w-full py-1.5 px-3 rounded-md bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Icon name="LuPlus" size={14} />
                      Add Line
                    </button>
                  </div>
                </div>

                {/* Additional optional fields toggle or info */}
                <div className="flex items-center gap-4 text-[11px] text-slate-500 px-1">
                  <span>Line Total: <strong className="text-slate-800 font-mono">₹{newItem.line_total || "0.00"}</strong></span>
                </div>

                {/* Line Items Table */}
                <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-left">Item Name</th>
                        <th className="py-2 px-3 text-left">Batch No</th>
                        <th className="py-2 px-3 text-right">Received Qty</th>
                        <th className="py-2 px-3 text-right">Unit Cost</th>
                        <th className="py-2 px-3 text-center">Expiry</th>
                        <th className="py-2 px-3 text-right">Line Total</th>
                        <th className="py-2 px-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grItems.map((it, idx) => {
                        const itemObj = items.find((i) => i.id === it.item_id);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {itemObj?.name || it.item_id}
                              {itemObj?.code && <span className="text-[10px] text-slate-400 ml-1">({itemObj.code})</span>}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700">{it.batch_no}</td>
                            <td className="py-2 px-3 text-right font-mono font-medium text-slate-800">
                              {it.received_qty}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">₹{it.unit_cost}</td>
                            <td className="py-2 px-3 text-center text-slate-600 font-mono text-[11px]">
                              {it.expiry_date || "—"}
                            </td>
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

                      {grItems.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400">
                            No items added yet. Use the inputs above to add delivery items.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">
                      Items Count: <strong>{grItems.length}</strong>
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      Total Invoice Amount: <span className="text-blue-600">₹{totalAmount.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={autoPost}
                    onChange={(e) => setAutoPost(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span className="font-semibold text-emerald-700">
                    Immediately post to live stock batches
                  </span>
                </label>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || grItems.length === 0}
                    className="px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                  >
                    {createLoading ? (
                      <>
                        <Icon name="LuRefreshCw" size={14} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Icon name="LuCheck" size={16} />
                        {autoPost ? "Receive & Post Stock" : "Save as Draft"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
