import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import Icon from "../../components/common/Icon.jsx";

const ITEM_TYPE_BADGES = {
  drug: "bg-blue-50 text-blue-700",
  consumable: "bg-amber-50 text-amber-700",
  implant: "bg-purple-50 text-purple-700",
  reagent: "bg-indigo-50 text-indigo-700",
  equipment: "bg-emerald-50 text-emerald-700",
  general: "bg-slate-50 text-slate-700",
};

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    organization_id: "",
    search: "",
    item_type: "",
    is_active: "",
  });
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0 });

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [itemForm, setItemForm] = useState({
    organization_id: "",
    category_id: "",
    code: "",
    name: "",
    generic_name: "",
    brand_name: "",
    item_type: "drug",
    base_uom: "unit",
    reorder_level: "0",
    reorder_quantity: "0",
    track_batches: true,
    track_expiry: true,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        inventoryService.getItems(filters),
        inventoryService.getCategories({ organization_id: filters.organization_id }),
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
    setItemForm({
      organization_id: filters.organization_id,
      category_id: "",
      code: "",
      name: "",
      generic_name: "",
      brand_name: "",
      item_type: "drug",
      base_uom: "unit",
      reorder_level: "0",
      reorder_quantity: "0",
      track_batches: true,
      track_expiry: true,
      is_active: true,
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditing(true);
    setItemForm({ ...item });
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await inventoryService.updateItem(itemForm.id, itemForm);
        toast.success("Item updated successfully");
      } else {
        await inventoryService.createItem(itemForm);
        toast.success("Item created successfully");
      }
      setOpenModal(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to save item");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item? This cannot be undone if stock exists.")) return;
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
    if (q <= r) return <span className="text-rose-600 font-semibold">LOW STOCK</span>;
    return <span className="text-emerald-600 text-xs">OK</span>;
  };

  if (loading) {
    return (
      <PageContainer title="Item Master" subtitle="Manage inventory items (drugs, consumables, implants, equipment)">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Item Master" subtitle="Manage drugs, consumables, implants, and equipment">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 md:flex-1">
          <Input
            placeholder="Search items by name, code, or generic name"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            icon
          />
        </div>
        <div className="w-full md:w-64">
          <Select
            value={filters.item_type}
            onChange={(e) => setFilters({ ...filters, item_type: e.target.value })}
            placeholder="Item Type"
          >
            <option value="">All Types</option>
            <option value="drug">Drug</option>
            <option value="consumable">Consumable</option>
            <option value="implant">Implant</option>
            <option value="equipment">Equipment</option>
            <option value="general">General</option>
          </Select>
        </div>
        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon
        >
          Add Item
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Category</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">UOM</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Reorder</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Stock</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-slate-700">{item.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.category_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ITEM_TYPE_BADGES[item.item_type] || "bg-slate-50 text-slate-700"}`}>
                      {item.item_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.base_uom}</td>
                  <td className="px-4 py-3 text-slate-600">{item.reorder_level}</td>
                  <td className="px-4 py-3">{lowStockBadge(item.quantity_on_hand, item.reorder_level)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(item)}
                      className="mr-2"
                    >
                      <Icon name="LuEdit" size={14} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Icon name="LuTrash2" size={14} /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {!items || items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-slate-400 text-center">
                    No items found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 bg-slate-50 p-3 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {items.length} of {meta.total} items</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenModal(false)} />
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">{editing ? "Edit Item" : "Add New Item"}</h3>
              <Button size="sm" variant="ghost" onClick={() => setOpenModal(false)}>
                <Icon name="LuX" size={18} />
              </Button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Item Code *"
                  value={itemForm.code}
                  onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                  required
                />
                <Select
                  label="Category"
                  value={itemForm.category_id || ""}
                  onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                  placeholder="Select category"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <Input
                label="Item Name *"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
              />
              <Input
                label="Generic Name"
                value={itemForm.generic_name || ""}
                onChange={(e) => setItemForm({ ...itemForm, generic_name: e.target.value })}
              />
              <Input
                label="Brand Name"
                value={itemForm.brand_name || ""}
                onChange={(e) => setItemForm({ ...itemForm, brand_name: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Item Type *"
                  value={itemForm.item_type}
                  onChange={(e) => setItemForm({ ...itemForm, item_type: e.target.value })}
                  required
                >
                  <option value="drug">Drug</option>
                  <option value="consumable">Consumable</option>
                  <option value="implant">Implant</option>
                  <option value="reagent">Reagent</option>
                  <option value="equipment">Equipment</option>
                  <option value="general">General</option>
                </Select>
                <Input
                  label="Base UOM"
                  value={itemForm.base_uom}
                  onChange={(e) => setItemForm({ ...itemForm, base_uom: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Reorder Level"
                  type="number"
                  value={itemForm.reorder_level}
                  onChange={(e) => setItemForm({ ...itemForm, reorder_level: e.target.value })}
                />
                <Input
                  label="Reorder Quantity"
                  type="number"
                  value={itemForm.reorder_quantity}
                  onChange={(e) => setItemForm({ ...itemForm, reorder_quantity: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={itemForm.track_batches}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, track_batches: e.target.checked })
                  }
                  className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
                />
                <label className="text-sm text-slate-700">Track batches</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={itemForm.track_expiry}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, track_expiry: e.target.checked })
                  }
                  className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
                />
                <label className="text-sm text-slate-700">Track expiry</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={itemForm.is_active}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, is_active: e.target.checked })
                  }
                  className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
                />
                <label className="text-sm text-slate-700">Is active</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editing ? "Update Item" : "Create Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
