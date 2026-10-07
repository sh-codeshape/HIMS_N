import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import axiosInstance from "../../api/axiosInstance";
import { ENDPOINTS } from "../../api/endpoints";
import toast from "react-hot-toast";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        axiosInstance.get(ENDPOINTS.ROLES.BASE),
        axiosInstance.get(`${ENDPOINTS.ROLES.BASE}/permissions`)
      ]);
      setRoles(rolesRes.data.data);
      setPermissions(permsRes.data.data);
      if (rolesRes.data.data.length > 0) {
        handleRoleSelect(rolesRes.data.data[0]);
      }
    } catch (error) {
      toast.error("Failed to load roles and permissions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role) => {
    try {
      setSelectedRole(role);
      const res = await axiosInstance.get(`${ENDPOINTS.ROLES.BASE}/${role.id}/permissions`);
      setRolePermissions(res.data.data.map(p => p.id));
    } catch (error) {
      toast.error("Failed to load permissions for role");
      console.error(error);
    }
  };

  const handleTogglePermission = (permissionId) => {
    setRolePermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      await axiosInstance.put(`${ENDPOINTS.ROLES.BASE}/${selectedRole.id}/permissions`, {
        permissionIds: rolePermissions
      });
      toast.success("Role permissions updated successfully");
    } catch (error) {
      toast.error("Failed to update role permissions");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  if (loading) {
    return <PageContainer title="Role Management">Loading...</PageContainer>;
  }

  return (
    <PageContainer title="Role & Permission Management">
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* Roles List */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">Roles</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={`w-full text-left p-4 border-b transition-colors ${selectedRole?.id === role.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
              >
                <div className="font-medium text-gray-900">{role.name}</div>
                <div className="text-sm text-gray-500 truncate">{role.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="w-full md:w-2/3 bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
          {selectedRole ? (
            <>
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-700">Permissions for: {selectedRole.name}</h3>
                  <p className="text-sm text-gray-500">Select the permissions this role should have</p>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <div key={module} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b font-medium text-gray-700 capitalize">
                      {module.replace(/_/g, ' ')} Module
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                      {perms.map(perm => (
                        <label 
                          key={perm.id} 
                          className="flex items-start gap-3 p-4 border-b sm:border-b-0 sm:border-r last:border-0 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={rolePermissions.includes(perm.id)}
                            onChange={() => handleTogglePermission(perm.id)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{perm.code}</div>
                            <div className="text-xs text-gray-500">{perm.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a role to view and edit its permissions
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
