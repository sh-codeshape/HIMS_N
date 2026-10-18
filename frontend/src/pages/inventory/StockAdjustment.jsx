import React, { useState } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import Icon from "../../components/common/Icon.jsx";

export default function StockAdjustmentPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    store_id: "",
    item_id: "",
    batch_id: "",
    movement_type: "adjustment_in",
    quantity: "",
    unit_cost: "",
    notes: "",
  });
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    loadStores();
    loadItems();
  }, []);

  const loadStores = async () => {
    try {
      const res = await inventoryService.getStores();
      setStores(res?.data || []);
    } catch (e) {
      toast.error("Failed to load stores");
    }
  };

  const loadItems = async () => {
    try {
      const res = await inventoryService.getItems();
      setItems(res?.data || []);
    } catch (e) {
      toast.error("Failed to load items");
    }
  };

  const handleStoreChange = async (e) => {
    const storeId = e.target.value;
    setForm({ ...form, store_id: storeId, batch_id: "" });
    try {
      const res = await inventoryService.getStockBatches({ store_id: storeId });
      setBatches(res.data || []);
    } catch (e) {
      setBatches([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryService.adjustStock({
        ...form,
        quantity: Number(form.quantity),
        unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
      });
      toast.success("Stock adjusted successfully");
      setForm({
        store_id: form.store_id,
        item_id: "",
        batch_id: "",
        movement_type: form.movement_type,
        quantity: "",
        unit_cost: "",
        notes: "",
      });
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Adjustment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Stock Adjustment" subtitle="Manually increase or decrease stock for a batch">
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Store *"
                value={form.store_id}
                onChange={handleStoreChange}
                required
              >
                <option value="">Select store</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
              <Select
                label="Movement Type *"
                value={form.movement_type}
                onChange={(e) => setForm({ ...form, movement_type: e.target.value })}
                required
              >
                <option value="adjustment_in">Stock In (Adjustment)</option>
                <option value="adjustment_out">Stock Out (Adjustment)</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Item *"
                value={form.item_id}
                onChange={(e) => setForm({ ...form, item_id: e.target.value, batch_id: "" })}
                required
              >
                <option value="">Select item</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name} ({it.code})</option>
                ))}
              </Select>
              <Select
                label="Batch *"
                value={form.batch_id}
                onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                required
              >
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_no} - {b.quantity_on_hand} {b.base_uom} on hand
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quantity *"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
                helper={form.movement_type === "adjustment_out" ? "Cannot exceed available stock" : undefined}
              />
              <Input
                label="Unit Cost"
                type="number"
                step="0.0001"
                value={form.unit_cost}
                onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                helper="Per base unit"
              />
            </div>

            <Input
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Reason for adjustment..."
            />

            <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
              <Button type="button" variant="ghost" onClick={() => setForm({ ...form, quantity: "", unit_cost: "", notes: "" })}>
                Reset
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                {loading ? "Posting..." : "Post Adjustment"}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Icon name="LuInfo" size={16} /> How it works
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Select a store first to see its available batches.</li>
            <li><strong>Stock In:</strong> increases quantity_on_hand for the batch.</li>
            <li><strong>Stock Out:</strong> decreases quantity_on_hand (cannot go below zero).</li>
            <li>All adjustments are recorded as immutable stock_movements entries.</li>
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}
