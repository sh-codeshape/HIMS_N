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
  approved: "bg-blue-50 text-blue-700",
  sent: "bg-indigo-50 text-indigo-700",
  partially_received: "bg-amber-50 text-amber-700",
  received: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
  closed: "bg-slate-200 text-slate-600",
};

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState({
    organization_id: "",
    status: "",
    search: "",
  });

  // Create modal
  const [openModal, setOpenModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [poItems, setPoItems] = useState([]);
  const [newItem, setNewItem] = useState({
    item_id: "",
    ordered_qty: "",
    unit_cost: "",
    discount_percent: "0",
    tax_amount: "0",
    line_total: "0",
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [poRes, supRes, storeRes, itemRes] = await Promise.all([
        inventoryService.getPurchaseOrders(filters),
        inventoryService.getSuppliers(),
        inventoryService.getStores(),
        inventoryService.getItems(),
      ]);
      setPos(poRes.data || []);
      setMeta(poRes.meta || { page: 1, limit: 50, total: 0 });
      setSuppliers(supRes.data || []);
      setStores(storeRes.data || []);
      setItems(itemRes.data || []);
    } catch (err) {
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    if (!newItem.item_id || !newItem.ordered_qty || !newItem.unit_cost) {
      toast.error("Please fill all item fields");
      return;
    }
    const qty = Number(newItem.ordered_qty);
    const cost = Number(newItem.unit_cost);
    const disc = Number(newItem.discount_percent) || 0;
    const tax = Number(newItem.tax_amount) || 0;
    const lineTotal = qty * cost - disc + tax;

    setPoItems([...poItems, { ...newItem, ordered_qty: qty, unit_cost: cost, line_total: lineTotal }]);
    setNewItem({
      item_id: "", ordered_qty: "", unit_cost: "", discount_percent: "0", tax_amount: "0", line_total: "0",
    });
  };

  const removeLineItem = (index) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const createPO = async () => {
    if (poItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setCreateLoading(true);
    try {
      await inventoryService.createPurchaseOrder({
        organization_id: filters.organization_id,
        supplier_id: document.getElementById("po-supplier").value,
        store_id: document.getElementById("po-store").value,
        expected_date: document.getElementById("po-expected").value || undefined,
        notes: document.getElementById("po-notes").value || undefined,
        items: poItems.map((it) => ({
          item_id: it.item_id,
          ordered_qty: it.ordered_qty,
          unit_cost: it.unit_cost,
          discount_percent: it.discount_percent,
          tax_amount: it.tax_amount,
          line_total: it.line_total,
        })),
      });
      toast.success("Purchase order created");
      setOpenModal(false);
      setPoItems([]);
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
      toast.success("PO approved");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to approve");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this purchase order?")) return;
    try {
      await inventoryService.cancelPurchaseOrder(id);
      toast.success("PO cancelled");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to cancel");
    }
  };

  const totalAmount = poItems.reduce((sum, it) => sum + Number(it.line_total || 0), 0);

  if (loading) {
    return (
      <PageContainer title="Purchase Orders" subtitle="Create and manage purchase orders for inventory procurement">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Purchase Orders" subtitle="Procure items from suppliers and receive into stock">
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search POs..."
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
          <option value="approved">Approved</option>
          <option value="sent">Sent</option>
          <option value="partially_received">Partially Received</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Button onClick={loadData} variant="outline" icon>Refresh</Button>
        <Button onClick={() => setOpenModal(true)} variant="primary" icon>
          New PO
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">PO Number</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Supplier</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Store</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Total</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Order Date</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-slate-700">{po.po_number}</td>
                  <td className="px-4 py-3 text-slate-600">{po.supplier_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{po.store_name || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[po.status] || "bg-slate-100 text-slate-600"}`}>
                      {po.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">₹{Number(po.total_amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{new Date(po.order_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {po.status === "draft" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleApprove(po.id)} className="mr-2">
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleCancel(po.id)}>
                          Cancel
                        </Button>
                      </>
                    )}
                    {po.status !== "draft" && po.status !== "cancelled" && po.status !== "received" && (
                      <Button size="sm" variant="outline" onClick={() => handleCancel(po.id)}>
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!pos || pos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-slate-400 text-center">
                    No purchase orders found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenModal(false)} />
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">Create Purchase Order</h3>
              <Button size="sm" variant="ghost" onClick={() => setOpenModal(false)}>
                <Icon name="LuX" size={18} />
              </Button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createPO(); }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Supplier *"
                  id="po-supplier"
                  required
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
                <Select
                  label="Store *"
                  id="po-store"
                  required
                >
                  <option value="">Select store</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Expected Date"
                  type="date"
                  id="po-expected"
                />
                <Input
                  label="Notes"
                  id="po-notes"
                  placeholder="PO terms/notes..."
                />
              </div>

              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Icon name="LuPackage" size={16} /> Line Items
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
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
                  value={newItem.ordered_qty}
                  onChange={(e) => setNewItem({ ...newItem, ordered_qty: e.target.value })}
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
                      <th className="text-right">Qty</th>
                      <th className="text-right">Cost</th>
                      <th className="text-right">Total</th>
                      <th className="text-right w-10">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.map((it, idx) => {
                      const itemName = items.find((i) => i.id === it.item_id)?.name || it.item_id;
                      return (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-2 text-slate-700">{itemName}</td>
                          <td className="py-2 text-right text-slate-600">{it.ordered_qty}</td>
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
                    {poItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">No line items</td>
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
                <Button type="submit" variant="primary" disabled={createLoading || poItems.length === 0}>
                  {createLoading ? "Creating..." : "Create Purchase Order"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
