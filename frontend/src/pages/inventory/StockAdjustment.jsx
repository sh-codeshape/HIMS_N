import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Icon from "../../components/common/Icon.jsx";

const PRESET_REASONS = [
  "Physical count discrepancy (Audit reconciliation)",
  "Damaged in storage / Breakage",
  "Expired stock write-off",
  "Found unrecorded stock",
  "Dispensing discrepancy correction",
  "Supplier sample / Free unit addition",
  "Other (Enter custom reason)",
];

export default function StockAdjustmentPage({ embedded = false }) {
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchInfo, setSelectedBatchInfo] = useState(null);

  const [form, setForm] = useState({
    store_id: "",
    item_id: "",
    batch_id: "",
    movement_type: "adjustment_in",
    quantity: "",
    unit_cost: "",
    presetReason: PRESET_REASONS[0],
    customNotes: "",
  });

  useEffect(() => {
    loadStoresAndItems();
  }, []);

  const loadStoresAndItems = async () => {
    try {
      const [storeRes, itemRes] = await Promise.all([
        inventoryService.getStores(),
        inventoryService.getItems(),
      ]);
      setStores(storeRes?.data || []);
      setItems(itemRes?.data || []);
    } catch (e) {
      toast.error("Failed to load stores or items");
    }
  };

  const handleStoreChange = async (e) => {
    const storeId = e.target.value;
    setForm((prev) => ({ ...prev, store_id: storeId, batch_id: "" }));
    setSelectedBatchInfo(null);
    if (!storeId) {
      setBatches([]);
      return;
    }
    try {
      const res = await inventoryService.getStockBatches({ store_id: storeId });
      setBatches(res?.data || []);
    } catch (e) {
      setBatches([]);
    }
  };

  const handleItemChange = (e) => {
    const itemId = e.target.value;
    setForm((prev) => ({ ...prev, item_id: itemId, batch_id: "" }));
    setSelectedBatchInfo(null);
  };

  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    const batchObj = batches.find((b) => b.id === batchId);
    setSelectedBatchInfo(batchObj || null);
    setForm((prev) => ({
      ...prev,
      batch_id: batchId,
      item_id: batchObj?.item_id || prev.item_id,
      unit_cost: batchObj?.mrp ? String(batchObj.mrp) : prev.unit_cost,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.store_id || !form.batch_id || !form.quantity) {
      toast.error("Please fill all mandatory fields (Store, Batch, Quantity)");
      return;
    }

    const qty = Number(form.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be a positive number");
      return;
    }

    if (form.movement_type === "adjustment_out" && selectedBatchInfo) {
      if (qty > Number(selectedBatchInfo.quantity_on_hand)) {
        toast.error(`Cannot reduce more than available on-hand stock (${selectedBatchInfo.quantity_on_hand})`);
        return;
      }
    }

    const finalNotes =
      form.presetReason === "Other (Enter custom reason)"
        ? form.customNotes || "Manual Adjustment"
        : `${form.presetReason}${form.customNotes ? ` — ${form.customNotes}` : ""}`;

    setLoading(true);
    try {
      await inventoryService.adjustStock({
        store_id: form.store_id,
        item_id: form.item_id || selectedBatchInfo?.item_id,
        batch_id: form.batch_id,
        movement_type: form.movement_type,
        quantity: qty,
        unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
        notes: finalNotes,
      });
      toast.success(
        `Stock successfully ${form.movement_type === "adjustment_in" ? "increased" : "reduced"} by ${qty}`
      );
      // Refresh batches for current store
      if (form.store_id) {
        const res = await inventoryService.getStockBatches({ store_id: form.store_id });
        setBatches(res?.data || []);
      }
      setForm((prev) => ({
        ...prev,
        quantity: "",
        unit_cost: "",
        customNotes: "",
      }));
      setSelectedBatchInfo(null);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Stock adjustment failed");
    } finally {
      setLoading(false);
    }
  };

  // Filter batches by item if item selected
  const availableBatches = form.item_id
    ? batches.filter((b) => b.item_id === form.item_id)
    : batches;

  return (
    <PageContainer
      title={embedded ? undefined : "Stock Adjustment"}
      subtitle={embedded ? undefined : "Manually reconcile stock quantities, write-offs, or count discrepancies"}
      embedded={embedded}
    >
      <div className="max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icon name="LuSliders" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Manual Stock Adjustment</h3>
              <p className="text-xs text-slate-500">
                Correct stock on hand with verified reasons and audit logging
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Store & Movement Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Store Location *</label>
                <select
                  value={form.store_id}
                  onChange={handleStoreChange}
                  required
                  className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                >
                  <option value="">Select Store</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Adjustment Direction *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, movement_type: "adjustment_in" })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      form.movement_type === "adjustment_in"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Icon name="LuPlus" size={14} />
                    Stock In (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, movement_type: "adjustment_out" })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      form.movement_type === "adjustment_out"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Icon name="LuMinus" size={14} />
                    Stock Out (-)
                  </button>
                </div>
              </div>
            </div>

            {/* Item & Batch Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Filter by Item (Optional)
                </label>
                <select
                  value={form.item_id}
                  onChange={handleItemChange}
                  disabled={!form.store_id}
                  className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800 disabled:opacity-50"
                >
                  <option value="">All Items in Store</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} {it.code ? `(${it.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Batch *</label>
                <select
                  value={form.batch_id}
                  onChange={handleBatchChange}
                  disabled={!form.store_id || availableBatches.length === 0}
                  required
                  className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800 disabled:opacity-50"
                >
                  <option value="">
                    {!form.store_id
                      ? "Select Store First"
                      : availableBatches.length === 0
                      ? "No Batches Found"
                      : "Choose Batch"}
                  </option>
                  {availableBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.item_name} — Batch: {b.batch_no} (Avail: {b.quantity_on_hand})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Batch Details Pill */}
            {selectedBatchInfo && (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="font-semibold text-slate-800">{selectedBatchInfo.item_name}</span>
                  <span className="text-slate-500 font-mono">({selectedBatchInfo.batch_no})</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <span>
                    Current Stock:{" "}
                    <strong className="text-slate-900 font-mono text-sm">
                      {selectedBatchInfo.quantity_on_hand} {selectedBatchInfo.base_uom || "units"}
                    </strong>
                  </span>
                  {selectedBatchInfo.expiry_date && (
                    <span>
                      Expiry:{" "}
                      <strong className="text-slate-700 font-mono">
                        {new Date(selectedBatchInfo.expiry_date).toLocaleDateString()}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Adjustment Quantity & Unit Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quantity to {form.movement_type === "adjustment_in" ? "Add (+)" : "Remove (-)"} *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                  className="w-full py-2 px-3 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                />
                {form.movement_type === "adjustment_out" && selectedBatchInfo && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Max deductible: {selectedBatchInfo.quantity_on_hand} units
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Unit Cost (₹) (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cost per unit"
                  value={form.unit_cost}
                  onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                  className="w-full py-2 px-3 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                />
              </div>
            </div>

            {/* Preset Reason Dropdown with Custom Entry Fallback */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for Adjustment *
                </label>
                <select
                  value={form.presetReason}
                  onChange={(e) => setForm({ ...form, presetReason: e.target.value })}
                  className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                >
                  {PRESET_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom reason or extra details text field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {form.presetReason === "Other (Enter custom reason)"
                    ? "Specify Reason *"
                    : "Additional Notes / Audit Reference (Optional)"}
                </label>
                <input
                  type="text"
                  placeholder={
                    form.presetReason === "Other (Enter custom reason)"
                      ? "Describe reason for adjustment..."
                      : "Optional remarks or supervisor authorization..."
                  }
                  value={form.customNotes}
                  onChange={(e) => setForm({ ...form, customNotes: e.target.value })}
                  required={form.presetReason === "Other (Enter custom reason)"}
                  className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    quantity: "",
                    unit_cost: "",
                    customNotes: "",
                  })
                }
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading || !form.store_id || !form.batch_id || !form.quantity}
                className={`px-5 py-2 text-sm font-bold rounded-lg text-white shadow-sm transition-all flex items-center gap-2 ${
                  form.movement_type === "adjustment_in"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Icon name="LuRefreshCw" size={14} className="animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Icon name="LuCheck" size={16} />
                    Confirm {form.movement_type === "adjustment_in" ? "+ Stock In" : "- Stock Out"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Informational Card */}
        <div className="mt-4 bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
            <Icon name="LuInfo" size={14} className="text-blue-600" />
            Audit Ledger Notice
          </div>
          <p>
            • Every adjustment writes an append-only transaction into the immutable stock movement audit trail.
          </p>
          <p>
            • Batch quantity on hand is updated immediately upon confirmation.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
