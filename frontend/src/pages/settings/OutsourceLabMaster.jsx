import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import settingsService from "../../api/services/settingsService";

export default function OutsourceLabMaster() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    contractRate: 15,
    turnaroundDays: 2,
    isActive: true,
  });

  const loadLabs = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getOutsourceLabs();
      setLabs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load outsource labs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  const handleOpenAdd = () => {
    setEditingLab(null);
    setForm({
      name: "",
      code: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      contractRate: 15,
      turnaroundDays: 2,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lab) => {
    setEditingLab(lab);
    setForm({
      name: lab.name || "",
      code: lab.code || "",
      contactPerson: lab.contact_person || "",
      phone: lab.phone || "",
      email: lab.email || "",
      address: lab.address || "",
      contractRate: Number(lab.contract_rate) || 0,
      turnaroundDays: Number(lab.turnaround_days) || 2,
      isActive: lab.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a laboratory name");
      return;
    }

    setSubmitting(true);
    try {
      if (editingLab) {
        await settingsService.updateOutsourceLab(editingLab.id, form);
        toast.success(`Updated ${form.name} successfully!`);
      } else {
        await settingsService.createOutsourceLab(form);
        toast.success(`Added ${form.name} successfully!`);
      }
      setIsModalOpen(false);
      loadLabs();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (lab) => {
    const updatedStatus = !lab.is_active;
    try {
      await settingsService.updateOutsourceLab(lab.id, { isActive: updatedStatus });
      toast.success(`${lab.name} ${updatedStatus ? "activated" : "deactivated"}`);
      loadLabs();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Filtered labs
  const filteredLabs = labs.filter((lab) => {
    if (statusFilter === "active" && !lab.is_active) return false;
    if (statusFilter === "inactive" && lab.is_active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        lab.name?.toLowerCase().includes(q) ||
        lab.code?.toLowerCase().includes(q) ||
        lab.contact_person?.toLowerCase().includes(q) ||
        lab.phone?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCount = labs.length;
  const activeCount = labs.filter((l) => l.is_active).length;
  const avgDiscount = totalCount > 0 ? (labs.reduce((acc, l) => acc + (Number(l.contract_rate) || 0), 0) / totalCount).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* ── HEADER SUMMARY STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Partners</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Icon name="LuFlaskConical" size={18} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</div>
          <div className="text-xs text-slate-500 mt-1">Contracted diagnostic labs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Centers</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Icon name="LuCheckCircle2" size={18} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{activeCount}</div>
          <div className="text-xs text-slate-500 mt-1">Available for outsource routing</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. Turnaround</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Icon name="LuClock" size={18} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">2-3 Days</div>
          <div className="text-xs text-slate-500 mt-1">Dispatch to report delivery</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. Contract Margin</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Icon name="LuPercent" size={18} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{avgDiscount}%</div>
          <div className="text-xs text-slate-500 mt-1">Hospital commission discount</div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icon name="LuSearch" size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by lab name, code, contact or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === "active" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === "inactive" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Icon name="LuPlus" size={16} />
          <span>Add Outsource Lab</span>
        </button>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin text-indigo-600 mb-2">
              <Icon name="LuRotateCw" size={24} />
            </div>
            <p className="text-sm">Loading outsource laboratories...</p>
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold text-slate-700">No partner labs found</p>
            <p className="text-sm mt-1">Try adjusting your search query or add a new outsource partner.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Lab Partner</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Address / Hub</th>
                  <th className="py-3.5 px-4 text-center">Contract Margin</th>
                  <th className="py-3.5 px-4 text-center">Turnaround</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLabs.map((lab) => (
                  <tr key={lab.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900">{lab.name}</div>
                      {lab.code && (
                        <span className="inline-block mt-0.5 text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {lab.code}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">{lab.contact_person || "—"}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-col gap-0.5">
                        {lab.phone && <span>📞 {lab.phone}</span>}
                        {lab.email && <span>✉️ {lab.email}</span>}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 text-xs max-w-xs truncate">
                      {lab.address || "—"}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {Number(lab.contract_rate) || 0}% Off
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="text-xs font-medium text-slate-700">
                        {lab.turnaround_days || 2} Days
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {lab.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(lab)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Partner Details"
                        >
                          <Icon name="LuPencil" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(lab)}
                          className={`p-1.5 rounded-lg transition ${
                            lab.is_active
                              ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={lab.is_active ? "Deactivate Partner" : "Activate Partner"}
                        >
                          <Icon name={lab.is_active ? "LuPowerOff" : "LuPower"} size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: ADD / EDIT PARTNER LAB ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingLab ? "Edit Outsource Laboratory" : "Add Third-Party Diagnostic Partner"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure contract terms, turnaround times, and hub contacts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Laboratory Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr Lal PathLabs, SRL Diagnostics"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Code / Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. DRLAL"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Contact Person / Nodal Officer</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Alok Verma"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Contact Phone / Hotline</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Official Email</label>
                  <input
                    type="email"
                    placeholder="e.g. care@partnerlab.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Turnaround Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={form.turnaroundDays}
                    onChange={(e) => setForm({ ...form, turnaroundDays: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Lab Address / Dispatch Hub</label>
                <textarea
                  rows="2"
                  placeholder="Reference Lab Address, Courier Dispatch Details..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Contract Discount / Margin (% from MRP)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={form.contractRate}
                      onChange={(e) => setForm({ ...form, contractRate: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Discount off standard test catalog rate</p>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActiveCheckbox" className="text-sm font-medium text-slate-700">
                    Active for sample dispatch
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting && <Icon name="LuRotateCw" size={14} className="animate-spin" />}
                  <span>{editingLab ? "Save Changes" : "Create Partner"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
