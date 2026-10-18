import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import Icon from "../../components/common/Icon.jsx";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700",
  posted: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export default function GoodsReceiptsPage() {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [pos, setPos] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState({ organization_id: "", status: "", search: "" });

  const [openModal, setOpenModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [grItems, setGrItems] = useState([]);
  const [newItem, setNewItem] = useState({
    item_id: "", batch_no: "", received_qty: "", free_qty: "",
    unit_cost: "", mrp: "", line_total: "", expiry_date: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [grRes, supRes, storeRes, poRes] = await Promise.all([
        inventoryService.getGoodsReceipts(filters),
        inventoryService.getSuppliers(),
        inventoryService.getStores(),
        inventoryService.getPurchaseOrders({ status: "approved" }),
      ]);
      setGrns(grRes.data || []);
      setMeta(grRes.meta || { page: 1, limit: 50, total: 0 });
      setSuppliers(supRes.data || []);
      setStores(storeRes.data || []);
      setPos(poRes.data || []);
    } catch (err) {
      toast.error("Failed to load goods receipts");
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    if (!newItem.item_id || !newItem.batch_no || !newItem.received_qty || !newItem.unit_cost) {
      toast.error("Please fill all required fields");
      return;
    }
    const qty = Number(newItem.received_qty);
    const cost = Number(newItem.unit_cost);
    const lineTotal = qty * cost;
    setGrItems([...grItems, { ...newItem, received_qty: qty, unit_cost: cost, line_total: lineTotal }]);
    setNewItem({ item_id: "", batch_no: "", received_qty: "", free_qty: "", unit_cost: "", mrp: "", line_total: "", expiry_date: "" });
  };

  const removeLineItem = (index) => {
    setGrItems(grItems.filter((_, i) => i !== index));
  };

  const createGRN = async () => {
    if (grItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setCreateLoading(true);
    try {
      await inventoryService.createGoodsReceipt({
        organization_id: filters.organization_id,
        supplier_id: document.getElementById("gr-supplier").value,
        store_id: document.getElementById("gr-store").value,
        purchase_order_id: document.getElementById("gr-po").value || undefined,
        supplier_invoice_no: document.getElementById("gr-invoice").value || undefined,
        items: grItems.map((it) => ({
          item_id: it.item_id,
          batch_no: it.batch_no,
          received_qty: it.received_qty,
          free_qty: Number(it.free_qty) || 0,
          unit_cost: it.unit_cost,
          mrp: it.mrp || undefined,
          line_total: it.line_total,
          expiry_date: it.expiry_date || undefined,
        })),
      });
      toast.success("Goods receipt created");
      setOpenModal(false);
      setGrItems([]);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to create GRN");
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePost = async (id) => {
    if (!window.confirm("Post this goods receipt? This will add stock to batches.")) return;
    try {
      await inventoryService.postGoodsReceipt(id);
      toast.success("GRN posted - stock updated");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to post");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this goods receipt?")) return;
    try {
      await inventoryService.cancelGoodsReceipt(id);
      toast.success("GRN cancelled");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to cancel");
    }
  };

  const totalAmount = grItems.reduce((sum, it) => sum + Number(it.line_total || 0), 0);

  if (loading) {
    return (
      <PageContainer title="Goods Receipts" subtitle="Record goods received from suppliers against purchase orders">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Goods Receipts" subtitle="Receive goods from suppliers and post to stock">
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search GRNs..."
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
          <option value="draft">Draft</option>
          <option value="posted">Posted</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Button onClick={loadData} variant="outline" icon>Refresh</Button>
        <Button onClick={() => setOpenModal(true)} variant="primary" icon>
          New GRN
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">GRN Number</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Supplier</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Store</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Total</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Received At</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grns.map((gr) => (
                <tr key={gr.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-slate-700">{gr.grn_number}</td>
                  <td className="px-4 py-3 text-slate-600">{gr.supplier_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{gr.store_name || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[gr.status] || "bg-slate-100 text-slate-600"}`}>
                      {gr.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">₹{Number(gr.total_amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{new Date(gr.received_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {gr.status === "draft" && (
                      <Button size="sm" variant="outline" onClick={() => handlePost(gr.id)} className="mr-2">
                        Post
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleCancel(gr.id)} disabled={gr.status !== "draft"}>
                      Cancel
                    </Button>
                  </td>
                </tr>
              ))}
              {!grns || grns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-slate-400 text-center">
                    No goods receipts found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create GRN Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenModal(false)} />
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">Create Goods Receipt</h3>
              <Button size="sm" variant="ghost" onClick={() => setOpenModal(false)}>
                <Icon name="LuX" size={18} />
              </Button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createGRN(); }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Supplier *"
                  id="gr-supplier"
                  required
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
                <Select
                  label="Store *"
                  id="gr-store"
                  required
                >
                  <option value="">Select store</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Purchase Order"
                  id="gr-po"
                >
                  <option value="">No PO (direct receipt)</option>
                  {pos.map((p) => (
                    <option key={p.id} value={p.id}>{p.po_number}</option>
                  ))}
                </Select>
                <Input
                  label="Supplier Invoice No"
                  id="gr-invoice"
                  placeholder="Optional supplier invoice reference"
                />
              </div>

              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Icon name="LuPackage" size={16} /> Received Items
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                <Select
                  label="Item *"
                  value={newItem.item_id}
                  onChange={(e) => setNewItem({ ...newItem, item_id: e.target.value })}
                  required
                >
                  <option value="">Select item</option>
                  {items && items.map ? items.map((it) => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  )) : null}
                </Select>
                <Input
                  label="Batch No *"
                  value={newItem.batch_no}
                  onChange={(e) => setNewItem({ ...newItem, batch_no: e.target.value })}
                  required
                />
                <Input
                  label="Qty *"
                  type="number"
                  value={newItem.received_qty}
                  onChange={(e) => setNewItem({ ...newItem, received_qty: e.target.value })}
                  required
                />
                <Input
                  label="Unit Cost *"
                  type="number"
                  step="0.0001"
                  value={newItem.unit_cost}
                  onChange={(e) => setNewItem({ ...newItem, unit_cost: e.target.value })}
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
                      <th className="text-left">Batch</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Cost</th>
                      <th className="text-right">Total</th>
                      <th className="text-right w-10">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grItems.map((it, idx) => {
                      const itemName = items.find((i) => i.id === it.item_id)?.name || it.item_id;
                      return (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-2 text-slate-700">{itemName}</td>
                          <td className="py-2 text-slate-600 font-mono text-xs">{it.batch_no}</td>
                          <td className="py-2 text-right text-slate-600">{it.received_qty}</td>
                          <td className="py-2 text-right text-slate-600">₹{it.unit_cost}</td>
                          <td className="py-2 text-right font-mono text-slate-800">₹{it.line_total}</td>
                          <td className="py-2 text-right">
                            <Button size="sm" variant="ghost" onClick={() => removeLineItem(idx)}>
                              <Icon name="LuTrash2" size={14} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {grItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400 text-xs">No items</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-end mt-2">
                  <span className="font-bold text-lg text-slate-900 mr-2">Total: ₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={createLoading || grItems.length === 0}>
                  {createLoading ? "Creating..." : "Create Goods Receipt"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
