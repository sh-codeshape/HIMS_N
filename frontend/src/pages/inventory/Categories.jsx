import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import Icon from "../../components/common/Icon.jsx";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ organization_id: "", is_active: "", search: "" });

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    organization_id: "",
    parent_id: "",
    code: "",
    name: "",
    category_type: "drug",
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await inventoryService.getCategories(filters);
      setCategories(res.data || []);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditing(false);
    setForm({
      organization_id: filters.organization_id,
      parent_id: "",
      code: "",
      name: "",
      category_type: "drug",
      is_active: true,
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditing(true);
    setForm({ ...cat });
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await inventoryService.updateCategory(form.id, form);
        toast.success("Category updated successfully");
      } else {
        await inventoryService.createCategory(form);
        toast.success("Category created successfully");
      }
      setOpenModal(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to save category");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? Items assigned to it will prevent deletion.")) return;
    try {
      await inventoryService.deleteCategory(id);
      toast.success("Category deleted successfully");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to delete category");
    }
  };

  if (loading) {
    return (
      <PageContainer title="Item Categories" subtitle="Manage item categories (drug, consumable, implant, etc.)">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Item Categories" subtitle="Organize inventory items into categories">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search categories..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            icon
          />
        </div>
        <Button onClick={handleOpenCreate} variant="primary" icon>
          Add Category
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Parent</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-slate-700">{cat.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{cat.name}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{cat.category_type}</td>
                  <td className="px-4 py-3 text-slate-600">{cat.parent_id ? "Sub-category" : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      cat.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(cat)}
                      className="mr-2"
                    >
                      <Icon name="LuEdit" size={14} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Icon name="LuTrash2" size={14} /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {!categories || categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-slate-400 text-center">
                    No categories found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenModal(false)} />
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">{editing ? "Edit Category" : "Add Category"}</h3>
              <Button size="sm" variant="ghost" onClick={() => setOpenModal(false)}>
                <Icon name="LuX" size={18} />
              </Button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Category Code *"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
              <Input
                label="Category Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Select
                label="Category Type *"
                value={form.category_type}
                onChange={(e) => setForm({ ...form, category_type: e.target.value })}
                required
              >
                <option value="drug">Drug</option>
                <option value="consumable">Consumable</option>
                <option value="implant">Implant</option>
                <option value="surgical">Surgical</option>
                <option value="reagent">Reagent</option>
                <option value="equipment">Equipment</option>
                <option value="general">General</option>
              </Select>
              <Select
                label="Parent Category"
                value={form.parent_id || ""}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                placeholder="Top-level category"
              >
                {categories
                  .filter((c) => c.id !== form.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </Select>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
                />
                <label className="text-sm text-slate-700">Is active</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editing ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
