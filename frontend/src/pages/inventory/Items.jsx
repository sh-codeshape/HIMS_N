import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService, getActiveOrgId } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import Icon from "../../components/common/Icon.jsx";

const ITEM_TYPE_BADGES = {
  drug: "bg-blue-50 text-blue-700 border-blue-200",
  consumable: "bg-amber-50 text-amber-700 border-amber-200",
  implant: "bg-purple-50 text-purple-700 border-purple-200",
  reagent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  equipment: "bg-emerald-50 text-emerald-700 border-emerald-200",
  general: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function ItemsPage({ embedded = false }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    item_type: "",
    is_active: "",
  });
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [itemForm, setItemForm] = useState({
    code: "",
    name: "",
    category_id: "",
    item_type: "drug",
    base_uom: "unit",
    reorder_level: 10,
    reorder_quantity: 50,
    generic_name: "",
    brand_name: "",
    track_batches: true,
    track_expiry: true,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, [filters.item_type]);

  const loadData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        inventoryService.getItems(filters),
        inventoryService.getCategories(),
      ]);
      setItems(itemsRes.data || []);
      setMeta(itemsRes.meta || { page: 1, limit: 50, total: 0 });
      setCategories(catsRes?.data || []);
    } catch (err) {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditing(false);
    setShowAdvanced(false);
    const autoCode = `ITM-${Math.floor(1000 + Math.random() * 9000)}`;
    setItemForm({
      code: autoCode,
      name: "",
      category_id: "",
      item_type: "drug",
      base_uom: "unit",
      reorder_level: 10,
      reorder_quantity: 50,
      generic_name: "",
      brand_name: "",
      track_batches: true,
      track_expiry: true,
      is_active: true,
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditing(true);
    setShowAdvanced(!!(item.generic_name || item.brand_name));
    setItemForm({
      id: item.id,
      code: item.code || "",
      name: item.name || "",
      category_id: item.category_id || "",
      item_type: item.item_type || "drug",
      base_uom: item.base_uom || "unit",
      reorder_level: Number(item.reorder_level) || 0,
      reorder_quantity: Number(item.reorder_quantity) || 0,
      generic_name: item.generic_name || "",
      brand_name: item.brand_name || "",
      track_batches: item.track_batches !== false,
      track_expiry: item.track_expiry !== false,
      is_active: item.is_active !== false,
    });
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!itemForm.name?.trim()) {
      toast.error("Item Name is required");
      return;
    }
    if (!itemForm.code?.trim()) {
      toast.error("Item Code is required");
      return;
    }

    const payload = {
      ...itemForm,
      organization_id: getActiveOrgId(),
      category_id: itemForm.category_id || null,
      generic_name: itemForm.generic_name?.trim() || null,
      brand_name: itemForm.brand_name?.trim() || null,
      reorder_level: Number(itemForm.reorder_level) || 0,
      reorder_quantity: Number(itemForm.reorder_quantity) || 0,
      pack_size: 1,
    };

    try {
      if (editing) {
        await inventoryService.updateItem(itemForm.id, payload);
        toast.success("Item updated successfully");
      } else {
        await inventoryService.createItem(payload);
        toast.success("Item created successfully");
      }
      setOpenModal(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to save item");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item? Existing stock batches will prevent deletion.")) return;
    try {
      await inventoryService.deleteItem(id);
      toast.success("Item deleted successfully");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to delete item");
    }
  };

  const lowStockBadge = (qty, reorder) => {
    const q = Number(qty || 0);
    const r = Number(reorder || 0);
    if (q <= r) return <span className="text-rose-600 font-semibold text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">LOW STOCK</span>;
    return <span className="text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">OK</span>;
  };

  if (loading && !embedded) {
    return (
      <PageContainer title="Item Master" subtitle="Manage inventory items (drugs, consumables, implants, equipment)">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Item Master"}
      subtitle={embedded ? undefined : "Manage catalog items, medicines, consumables, and reorder levels"}
      embedded={embedded}
    >
      {/* Simple, Clean Search Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 flex gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search items by name, code, or generic..."
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

            <div className="w-40">
              <select
                value={filters.item_type}
                onChange={(e) => setFilters({ ...filters, item_type: e.target.value })}
                className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-700"
              >
                <option value="">All Item Types</option>
                <option value="drug">Medicine / Drug</option>
                <option value="consumable">Consumable</option>
                <option value="implant">Implant</option>
                <option value="reagent">Lab Reagent</option>
                <option value="equipment">Equipment</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Refresh"
            >
              <Icon name="LuRefreshCw" size={16} />
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
            >
              <Icon name="LuPlus" size={16} />
              Add New Item
            </button>
          </div>
        </div>
      </div>

      {/* Clean Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold">Code</th>
                <th className="px-4 py-3.5 text-left font-semibold">Item Name</th>
                <th className="px-4 py-3.5 text-left font-semibold">Category</th>
                <th className="px-4 py-3.5 text-center font-semibold">Type</th>
                <th className="px-4 py-3.5 text-center font-semibold">Unit (UOM)</th>
                <th className="px-4 py-3.5 text-right font-semibold">Reorder Alert</th>
                <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-700 text-xs">
                    {item.code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-950">{item.name}</div>
                    {item.generic_name && (
                      <div className="text-xs text-slate-500 font-normal">
                        Generic: {item.generic_name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {item.category_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border capitalize ${
                        ITEM_TYPE_BADGES[item.item_type] || "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {item.item_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 text-xs font-mono">
                    {item.base_uom}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-semibold text-slate-800 text-xs">
                      {item.reorder_level} {item.base_uom}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit Item"
                      >
                        <Icon name="LuEdit" size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete Item"
                      >
                        <Icon name="LuTrash2" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <Icon name="LuBoxes" size={24} />
                      </div>
                      <h4 className="font-semibold text-slate-800 text-base mb-1">No Items Found</h4>
                      <p className="text-xs text-slate-400 mb-4">
                        Create items in your catalog to start managing medicines and hospital stock.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                      >
                        <Icon name="LuPlus" size={14} />
                        Add First Item
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
            Showing <strong className="text-slate-700">{items.length}</strong> items in catalog
          </span>
        </div>
      </div>

      {/* Simplified, Friendly Add / Edit Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenModal(false)} />
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto relative z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon name="LuBoxes" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editing ? "Edit Catalog Item" : "Add New Item"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editing ? "Update item specifications" : "Register medicine or consumable into hospital catalog"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg, Nitrile Gloves (M), IV Cannula 20G"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                  className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800 font-medium"
                />
              </div>

              {/* Code & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Code / SKU *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MED-001"
                    value={itemForm.code}
                    onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                    required
                    className="w-full py-2 px-3 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={itemForm.category_id || ""}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item Type & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Type *
                  </label>
                  <select
                    value={itemForm.item_type}
                    onChange={(e) => setItemForm({ ...itemForm, item_type: e.target.value })}
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800"
                  >
                    <option value="drug">Medicine / Drug</option>
                    <option value="consumable">Consumable</option>
                    <option value="implant">Surgical Implant</option>
                    <option value="reagent">Laboratory Reagent</option>
                    <option value="equipment">Medical Equipment</option>
                    <option value="general">General Store</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement (UOM) *
                  </label>
                  <select
                    value={itemForm.base_uom}
                    onChange={(e) => setItemForm({ ...itemForm, base_uom: e.target.value })}
                    className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-slate-800 font-mono"
                  >
                    <option value="unit">unit (Piece / Each)</option>
                    <option value="tablet">tablet</option>
                    <option value="capsule">capsule</option>
                    <option value="strip">strip (10-15 tabs)</option>
                    <option value="bottle">bottle / syrup</option>
                    <option value="vial">vial / injection</option>
                    <option value="ampoule">ampoule</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                    <option value="kit">kit</option>
                    <option value="tube">tube / ointment</option>
                  </select>
                </div>
              </div>

              {/* Reorder Threshold Alert */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Icon name="LuAlertTriangle" size={13} className="text-amber-500" />
                    Low Stock Alert Level
                  </span>
                  <span className="text-[11px] text-slate-400">Notifies when stock drops below this</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Alert Quantity Threshold</label>
                    <input
                      type="number"
                      min="0"
                      value={itemForm.reorder_level}
                      onChange={(e) => setItemForm({ ...itemForm, reorder_level: e.target.value })}
                      className="w-full py-1.5 px-2.5 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Standard Reorder Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={itemForm.reorder_quantity}
                      onChange={(e) => setItemForm({ ...itemForm, reorder_quantity: e.target.value })}
                      className="w-full py-1.5 px-2.5 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Toggle optional details */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Icon name={showAdvanced ? "LuChevronUp" : "LuChevronDown"} size={14} />
                  {showAdvanced ? "Hide additional details" : "+ Add brand name, generic name, or tracking settings"}
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-3 pt-2 border-t border-slate-100 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Generic Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Acetaminophen"
                        value={itemForm.generic_name}
                        onChange={(e) => setItemForm({ ...itemForm, generic_name: e.target.value })}
                        className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Brand Name / Manufacturer</label>
                      <input
                        type="text"
                        placeholder="e.g. Calpol, Crocin"
                        value={itemForm.brand_name}
                        onChange={(e) => setItemForm({ ...itemForm, brand_name: e.target.value })}
                        className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-md bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={itemForm.track_batches}
                        onChange={(e) => setItemForm({ ...itemForm, track_batches: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      <span>Track Batches</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={itemForm.track_expiry}
                        onChange={(e) => setItemForm({ ...itemForm, track_expiry: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      <span>Track Expiry Dates</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition flex items-center gap-1.5"
                >
                  <Icon name="LuCheck" size={16} />
                  {editing ? "Save Changes" : "Save Item to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
