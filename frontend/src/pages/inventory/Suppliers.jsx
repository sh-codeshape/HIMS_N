import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import Icon from "../../components/common/Icon.jsx";

export default function SuppliersPage({ embedded = false }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ organization_id: "", is_active: "", search: "" });

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    organization_id: "",
    code: "",
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    drug_license_no: "",
    payment_terms_days: 30,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await inventoryService.getSuppliers(filters);
      setSuppliers(res.data || []);
    } catch (err) {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditing(false);
    setForm({
      organization_id: filters.organization_id,
      code: "",
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      gstin: "",
      drug_license_no: "",
      payment_terms_days: 30,
      is_active: true,
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (sup) => {
    setEditing(true);
    setForm({ ...sup });
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        payment_terms_days: Number(form.payment_terms_days) || 30,
        contact_person: form.contact_person || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        gstin: form.gstin || null,
        drug_license_no: form.drug_license_no || null,
      };
      if (editing) {
        await inventoryService.updateSupplier(form.id, payload);
        toast.success("Supplier updated successfully");
      } else {
        await inventoryService.createSupplier(payload);
        toast.success("Supplier created successfully");
      }
      setOpenModal(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to save supplier");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this supplier? Linked POs/GRNs will prevent deletion.")) return;
    try {
      await inventoryService.deleteSupplier(id);
      toast.success("Supplier deleted successfully");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to delete supplier");
    }
  };

  if (loading && !embedded) {
    return (
      <PageContainer title="Suppliers" subtitle="Manage medicine and consumable suppliers">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Suppliers"}
      subtitle={embedded ? undefined : "Manage vendors and suppliers for inventory procurement"}
      embedded={embedded}
    >
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search suppliers..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            icon
          />
        </div>
        <Button onClick={handleOpenCreate} variant="primary" icon>
          Add Supplier
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Contact</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Phone</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">GSTIN</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((sup) => (
                <tr key={sup.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-slate-700">{sup.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{sup.name}</td>
                  <td className="px-4 py-3 text-slate-600">{sup.contact_person || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{sup.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{sup.gstin || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      sup.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {sup.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(sup)}
                      className="mr-2"
                    >
                      <Icon name="LuEdit" size={14} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(sup.id)}
                    >
                      <Icon name="LuTrash2" size={14} /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {!suppliers || suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-slate-400 text-center">
                    No suppliers found
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
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">{editing ? "Edit Supplier" : "Add Supplier"}</h3>
              <Button size="sm" variant="ghost" onClick={() => setOpenModal(false)}>
                <Icon name="LuX" size={18} />
              </Button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Supplier Code *"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
                <Input
                  label="Supplier Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Contact Person"
                value={form.contact_person || ""}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <Input
                label="Address"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GSTIN"
                  value={form.gstin || ""}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                />
                <Input
                  label="Drug License No"
                  value={form.drug_license_no || ""}
                  onChange={(e) => setForm({ ...form, drug_license_no: e.target.value })}
                />
              </div>
              <Input
                label="Payment Terms (Days)"
                type="number"
                value={form.payment_terms_days}
                onChange={(e) => setForm({ ...form, payment_terms_days: Number(e.target.value) || 30 })}
              />
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
                  {editing ? "Update Supplier" : "Create Supplier"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
