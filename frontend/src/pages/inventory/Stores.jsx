import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import Icon from "../../components/common/Icon.jsx";

const STORE_TYPE_LABELS = {
  central: "Central Store",
  pharmacy: "Pharmacy",
  ward: "Ward",
  ot: "Operation Theatre",
  lab: "Laboratory",
  other: "Other",
};

export default function StoresPage({ embedded = false }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ organization_id: "", facility_id: "", is_active: "", search: "" });

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    organization_id: "",
    facility_id: "",
    code: "",
    name: "",
    store_type: "pharmacy",
    is_dispensing_point: false,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await inventoryService.getStores(filters);
      setStores(res.data || []);
    } catch (err) {
      toast.error("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditing(false);
    setForm({
      organization_id: filters.organization_id,
      facility_id: filters.facility_id,
      code: "",
      name: "",
      store_type: "pharmacy",
      is_dispensing_point: false,
      is_active: true,
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (store) => {
    setEditing(true);
    setForm({ ...store });
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        parent_store_id: form.parent_store_id || null,
        department_id: form.department_id || null,
      };
      if (editing) {
        await inventoryService.updateStore(form.id, payload);
        toast.success("Store updated successfully");
      } else {
        await inventoryService.createStore(payload);
        toast.success("Store created successfully");
      }
      setOpenModal(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to save store");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this store? Stock batches will prevent deletion.")) return;
    try {
      await inventoryService.deleteStore(id);
      toast.success("Store deleted successfully");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to delete store");
    }
  };

  if (loading && !embedded) {
    return (
      <PageContainer title="Stores" subtitle="Manage warehouses, pharmacy stores, and dispensing points">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Stores"}
      subtitle={embedded ? undefined : "Manage hospital stores, pharmacies, and ward stock locations"}
      embedded={embedded}
    >
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search stores..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            icon
          />
        </div>
        <Button onClick={handleOpenCreate} variant="primary" icon>
          Add Store
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
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Dispensing</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-slate-700">{store.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{store.name}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{STORE_TYPE_LABELS[store.store_type] || store.store_type}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      store.is_dispensing_point ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {store.is_dispensing_point ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      store.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {store.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(store)}
                      className="mr-2"
                    >
                      <Icon name="LuEdit" size={14} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(store.id)}
                    >
                      <Icon name="LuTrash2" size={14} /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {!stores || stores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-slate-400 text-center">
                    No stores found
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
              <h3 className="font-semibold text-slate-900">{editing ? "Edit Store" : "Add Store"}</h3>
              <Button size="sm" variant="ghost" onClick={() => setOpenModal(false)}>
                <Icon name="LuX" size={18} />
              </Button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Store Code *"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
              <Input
                label="Store Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Select
                label="Store Type *"
                value={form.store_type}
                onChange={(e) => setForm({ ...form, store_type: e.target.value })}
                required
              >
                <option value="central">Central Store</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="ward">Ward</option>
                <option value="ot">Operation Theatre</option>
                <option value="lab">Laboratory</option>
                <option value="other">Other</option>
              </Select>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_dispensing_point}
                  onChange={(e) => setForm({ ...form, is_dispensing_point: e.target.checked })}
                  className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
                />
                <label className="text-sm text-slate-700">Is dispensing point</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
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
                  {editing ? "Update Store" : "Create Store"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
