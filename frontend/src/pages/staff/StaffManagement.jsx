import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import axiosInstance from "../../api/axiosInstance";
import { ENDPOINTS } from "../../api/endpoints";
import toast from "react-hot-toast";
import { FiEdit2, FiPlus, FiX } from "react-icons/fi";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    staff_type: "other",
    designation: "",
    create_user: true,
    role_ids: []
  });

  const staffTypes = ["doctor", "nurse", "technician", "pharmacist", "receptionist", "billing", "admin", "paramedic", "support", "other"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, rolesRes] = await Promise.all([
        axiosInstance.get(ENDPOINTS.STAFF.BASE),
        axiosInstance.get(ENDPOINTS.ROLES.BASE)
      ]);
      setStaff(staffRes.data.data);
      setRoles(rolesRes.data.data);
    } catch (error) {
      toast.error("Failed to fetch staff data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        first_name: staffMember.first_name || "",
        last_name: staffMember.last_name || "",
        email: staffMember.user_email || staffMember.email || "",
        phone: staffMember.phone || "",
        staff_type: staffMember.staff_type || "other",
        designation: staffMember.designation || "",
        create_user: false,
        role_ids: staffMember.roles ? staffMember.roles.map(r => r.id) : []
      });
    } else {
      setEditingStaff(null);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        staff_type: "other",
        designation: "",
        create_user: true,
        role_ids: []
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStaff(null);
  };

  const handleRoleToggle = (roleId) => {
    setFormData((prev) => {
      const isSelected = prev.role_ids.includes(roleId);
      if (isSelected) {
        return { ...prev, role_ids: prev.role_ids.filter((id) => id !== roleId) };
      } else {
        return { ...prev, role_ids: [...prev.role_ids, roleId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await axiosInstance.put(`${ENDPOINTS.STAFF.BASE}/${editingStaff.id}`, formData);
        toast.success("Staff updated successfully");
      } else {
        await axiosInstance.post(ENDPOINTS.STAFF.BASE, formData);
        toast.success("Staff created successfully");
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Operation failed");
      console.error(error);
    }
  };

  if (loading) {
    return <PageContainer title="Staff Management">Loading...</PageContainer>;
  }

  return (
    <PageContainer title="Staff Management">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">Manage hospital staff, accounts, and their roles.</p>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <FiPlus /> Add Staff
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-700">Code</th>
              <th className="p-4 font-semibold text-gray-700">Name</th>
              <th className="p-4 font-semibold text-gray-700">Type</th>
              <th className="p-4 font-semibold text-gray-700">Email (User)</th>
              <th className="p-4 font-semibold text-gray-700">Roles</th>
              <th className="p-4 font-semibold text-gray-700">Status</th>
              <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4">{s.staff_code}</td>
                <td className="p-4 font-medium">{s.first_name} {s.last_name}</td>
                <td className="p-4 capitalize">{s.staff_type}</td>
                <td className="p-4">{s.user_email || s.email || '-'}</td>
                <td className="p-4">
                  {s.roles && s.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {s.roles.map(r => (
                        <span key={r.id} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {r.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No roles</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleOpenModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                    <FiEdit2 />
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  No staff members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Staff Type</label>
                  <select
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.staff_type}
                    onChange={(e) => setFormData({ ...formData, staff_type: e.target.value })}
                  >
                    {staffTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={formData.create_user}
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {!editingStaff && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="create_user"
                    checked={formData.create_user}
                    onChange={(e) => setFormData({ ...formData, create_user: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="create_user" className="text-sm text-gray-700 font-medium">
                    Create User Account (Requires Email)
                  </label>
                </div>
              )}

              {(formData.create_user || editingStaff) && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Assign Roles</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {roles.map(role => (
                      <label key={role.id} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded"
                          checked={formData.role_ids.includes(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                        />
                        <div>
                          <p className="font-medium text-sm text-gray-800">{role.name}</p>
                          <p className="text-xs text-gray-500">{role.code}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="secondary" onClick={handleCloseModal} type="button">
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStaff ? 'Save Changes' : 'Create Staff'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
