import React, { useState, useEffect, useCallback } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import axiosInstance from "../../api/axiosInstance";
import { ENDPOINTS } from "../../api/endpoints";
import { ROLES, PERMISSIONS, PERMISSION_LABELS } from "../../auth/roles";
import toast from "react-hot-toast";

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState("roles"); // 'roles' | 'users' | 'user-permissions'

  /* shared data */
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- Roles tab state ---------- */
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [savingRole, setSavingRole] = useState(false);

  const [creatingRole, setCreatingRole] = useState(false);
  const [roleForm, setRoleForm] = useState({ code: "", name: "", description: "", is_system: false });
  const [editingRole, setEditingRole] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  /* ---------- Users tab state ---------- */
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);

  /* edit-user modal */
  const [editingUser, setEditingUser] = useState(null);   // user being edited (from list)
  const [userDetail, setUserDetail] = useState(null);      // fetched detail: { user, roles, permissions }
  const [assignRoleId, setAssignRoleId] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [directPermissionIds, setDirectPermissionIds] = useState([]);

  /* ---------- User Permissions tab state (legacy quick view) ---------- */
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [granting, setGranting] = useState(false);

  /* ---------- init ---------- */
  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.ROLES.BASE + "/permissions");
      setPermissions(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load permissions");
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(ENDPOINTS.ROLES.BASE);
      const fetchedRoles = res.data.data || [];
      setRoles(fetchedRoles);
      setAllRoles(fetchedRoles);
      if (!selectedRole && fetchedRoles.length > 0) {
        setSelectedRole(fetchedRoles[0]);
      }
    } catch (error) {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.ROLES.USERS);
      setUsers(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load users");
    }
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  const fetchRolePermissions = useCallback(async (roleId) => {
    try {
      const res = await axiosInstance.get(`${ENDPOINTS.ROLES.BASE}/${roleId}/permissions`);
      setRolePermissions((res.data.data || []).map((p) => p.id));
    } catch (error) {
      toast.error("Failed to load role permissions");
    }
  }, []);

  /* ---------- Role handlers ---------- */
  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    setEditingRole(null);
    await fetchRolePermissions(role.id);
  };

  const handleTogglePermission = (permissionId) => {
    setRolePermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    try {
      setSavingRole(true);
      await axiosInstance.put(`${ENDPOINTS.ROLES.BASE}/${selectedRole.id}/permissions`, {
        permissionIds: rolePermissions,
      });
      toast.success("Role permissions updated");
    } catch (error) {
      toast.error("Failed to update role permissions");
    } finally {
      setSavingRole(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      setSavingRole(true);
      await axiosInstance.post(ENDPOINTS.ROLES.BASE, {
        ...roleForm,
      });
      setCreatingRole(false);
      setRoleForm({ code: "", name: "", description: "", is_system: false });
      toast.success("Role created");
      await fetchRoles();
    } catch (error) {
      toast.error("Failed to create role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    try {
      setSavingRole(true);
      await axiosInstance.put(`${ENDPOINTS.ROLES.BASE}/${editingRole.id}`, editForm);
      setEditingRole(null);
      toast.success("Role updated");
      await fetchRoles();
    } catch (error) {
      toast.error("Failed to update role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (!window.confirm(`Delete role "${roleName}"? System roles and assigned roles cannot be deleted.`)) return;
    try {
      setSavingRole(true);
      await axiosInstance.delete(`${ENDPOINTS.ROLES.BASE}/${roleId}`);
      toast.success("Role deleted");
      if (selectedRole?.id === roleId) setSelectedRole(null);
      await fetchRoles();
    } catch (error) {
      toast.error(error?.response?.data?.error?.message || "Failed to delete role");
    } finally {
      setSavingRole(false);
    }
  };

  /* ---------- Users handlers ---------- */
  const openEditUser = async (user) => {
    setEditingUser(user);
    setAssignRoleId("");
    try {
      const res = await axiosInstance.get(ENDPOINTS.ROLES.USER_BY_ID(user.id));
      const data = res.data.data || {};
      setUserDetail({
        user: data.user || user,
        roles: data.roles || [],
        permissions: data.permissions || [],
      });
      setDirectPermissionIds(
        (data.permissions || [])
          .filter((p) => p.source === "direct")
          .map((p) => p.id)
      );
    } catch (error) {
      toast.error("Failed to load user details");
    }
  };

  const closeEditUser = () => {
    setEditingUser(null);
    setUserDetail(null);
    setAssignRoleId("");
    setDirectPermissionIds([]);
  };

  const rolesNotAssigned = (detailRoles) => {
    const assignedCodes = new Set(detailRoles.map((r) => r.code));
    return allRoles.filter((r) => !assignedCodes.includes(r.code));
  };

  const handleAssignUserRole = async () => {
    if (!editingUser || !assignRoleId) return;
    try {
      setSavingUser(true);
      await axiosInstance.post(ENDPOINTS.ROLES.ASSIGN_USER_ROLE(editingUser.id), {
        roleId: assignRoleId,
      });
      toast.success("Role assigned to user");
      setAssignRoleId("");
      await openEditUser(editingUser);
      await fetchUsers();
    } catch (error) {
      toast.error("Failed to assign role");
    } finally {
      setSavingUser(false);
    }
  };

  const handleRemoveUserRole = async (roleId, roleName) => {
    if (!editingUser) return;
    if (!window.confirm(`Remove role "${roleName}" from this user?`)) return;
    try {
      setSavingUser(true);
      await axiosInstance.delete(ENDPOINTS.ROLES.USER_ROLE(editingUser.id, roleId));
      toast.success("Role removed from user");
      await openEditUser(editingUser);
      await fetchUsers();
    } catch (error) {
      toast.error("Failed to remove role");
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleUserPermission = (permissionId) => {
    setDirectPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSaveUserPermissions = async () => {
    if (!editingUser || !userDetail) return;
    try {
      setSavingUser(true);
      const currentlyDirect = new Set(
        userDetail.permissions.filter((p) => p.source === "direct").map((p) => p.id)
      );
      const toRevoke = [...currentlyDirect].filter((id) => !directPermissionIds.includes(id));
      for (const id of toRevoke) {
        await axiosInstance.delete(ENDPOINTS.ROLES.REVOKE_USER_PERMISSION(editingUser.id, id));
      }
      const toGrant = directPermissionIds.filter((id) => !currentlyDirect.has(id));
      for (const id of toGrant) {
        await axiosInstance.post(ENDPOINTS.ROLES.GRANT_USER_PERMISSION(editingUser.id), {
          permissionId: id,
        });
      }
      toast.success("User permissions updated");
      await openEditUser(editingUser);
      await fetchUsers();
    } catch (error) {
      toast.error("Failed to update user permissions");
    } finally {
      setSavingUser(false);
    }
  };

  /* ---------- legacy User Permissions tab handlers ---------- */
  useEffect(() => {
    if (activeTab === "user-permissions" && selectedUser) {
      fetchUserPermissions();
    }
  }, [activeTab, selectedUser]);

  const fetchUserPermissions = async () => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.ROLES.USER_PERMISSIONS(selectedUser.id));
      const perms = res.data.data || [];
      setUserPermissions(perms);
    } catch (error) {
      toast.error("Failed to load user permissions");
    }
  };

  /* ---------- helpers ---------- */
  const isSystemRole = (role) => role && role.is_system;
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  // The standalone `developer` role is seeded directly via seed-developer.ts and is not part
  // of the super admin / hospital admin permission surface, so its module group is only shown
  // when the developer role itself is selected.
  const groupedPermissionEntries = Object.entries(groupedPermissions).filter(
    ([module]) => module !== "developer" || selectedRole?.code === "developer"
  );

  const tabLabel = {
    roles: "Roles",
    users: "Users & Assigned Roles",
    "user-permissions": "User Direct Permissions",
  };

  if (loading) {
    return <PageContainer title="Role & Permission Management">Loading...</PageContainer>;
  }

  return (
    <PageContainer title="Role & Permission Management">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2">
          {["roles", "users", "user-permissions"].map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tabLabel[key]}
            </button>
          ))}
        </div>
        {activeTab === "roles" && (
          <button
            onClick={() => setCreatingRole(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
          >
            + Create Role
          </button>
        )}
      </div>

      {/* ============================ TAB: ROLES ============================ */}
      {activeTab === "roles" && (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-280px)]">
          <div className="w-full md:w-1/3 bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-700">Roles</h3>
              <p className="text-sm text-gray-500">Select a role to manage its permissions.</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {roles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No roles found.</div>
              ) : (
                roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role)}
                    className={`w-full text-left p-4 border-b transition-colors ${
                      selectedRole?.id === role.id
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-900">{role.name}</div>
                      {role.is_system && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">system</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 truncate">{role.description || "—"}</div>
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditForm({ name: role.name, description: role.description || "" });
                          setEditingRole(role);
                        }}
                        disabled={isSystemRole(role)}
                        className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                        title={isSystemRole(role) ? "System role name cannot be edited" : "Edit role"}
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.id, role.name);
                        }}
                        disabled={isSystemRole(role)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
                        title={isSystemRole(role) ? "System role cannot be deleted" : "Delete role"}
                      >
                        Delete
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="w-full md:w-2/3 bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
            {selectedRole ? (
              <>
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-700">
                      Permissions for: {selectedRole.name}
                      {selectedRole.is_system && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-2">system</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Select the permissions this role should have. Changes apply to all users with this role.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveRolePermissions}
                    disabled={savingRole}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {savingRole ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {groupedPermissionEntries.map(([module, perms]) => (
                    <div key={module} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b font-medium text-gray-700 capitalize">
                        {module.replace(/_/g, " ")} Module
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-start gap-3 p-4 border-b sm:border-b-0 sm:border-r last:border-0 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={rolePermissions.includes(perm.id)}
                              onChange={() => handleTogglePermission(perm.id)}
                              disabled={isSystemRole(selectedRole)}
                              className="mt-1 w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                            />
                            <div>
                              <div className={`text-sm font-medium ${isSystemRole(selectedRole) ? "text-gray-500" : "text-gray-900"}`}>
                                {PERMISSION_LABELS[perm.code] || perm.code}
                              </div>
                              <div className="text-xs text-gray-500">{perm.code}</div>
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
      )}

      {/* ============================ TAB: USERS ============================ */}
      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-end mb-6">
            <h3 className="font-semibold text-gray-700">Users &amp; Assigned Roles</h3>
            <p className="text-sm text-gray-500">
              Click a user to view and update their roles and permissions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-gray-600 text-sm">User</th>
                  <th className="p-3 text-gray-600 text-sm">Roles</th>
                  <th className="p-3 text-gray-600 text-sm">Status</th>
                  <th className="p-3 text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => openEditUser(user)}>
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-xs text-gray-500">{user.username}</div>
                      {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                    </td>
                    <td className="p-3">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((code) => {
                          const role = allRoles.find((r) => r.code === code);
                          return (
                            <span
                              key={code}
                              className="inline-flex items-center px-2 py-1 rounded text-xs border mr-1 mb-1"
                              style={{
                                backgroundColor: "#eff6ff",
                                borderColor: "#bfdbfe",
                                color: "#1d4ed8",
                              }}
                            >
                              {role ? role.name : code}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-gray-400 text-xs italic">No roles</span>
                      )}
                      {user.is_superadmin && (
                        <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">super admin</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditUser(user); }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================== TAB: USER PERMISSIONS (quick view) ================== */}
      {activeTab === "user-permissions" && (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-280px)]">
          <div className="w-full md:w-1/3 bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-700">Select User</h3>
              <p className="text-sm text-gray-500">View a user's direct permissions.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {users.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No users found.</div>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                    }}
                    className={`w-full text-left p-3 border-b transition-colors ${
                      selectedUser?.id === user.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-gray-900">{user.full_name}</div>
                    <div className="text-sm text-gray-500 truncate">{user.username}</div>
                    {user.is_superadmin && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1">super admin</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="w-full md:w-2/3 bg-white rounded-lg shadow flex flex-col h-full overflow-hidden">
            {selectedUser ? (
              <>
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-700">
                      Direct Permissions: {selectedUser.full_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Permissions granted directly to this user (in addition to role-inherited ones).
                    </p>
                  </div>
                  <button
                    onClick={() => openEditUser(selectedUser)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Roles & Permissions
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {userPermissions.length > 0 ? (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {userPermissions.map((perm) => (
                        <span
                          key={perm.id}
                          className={`inline-flex items-center px-3 py-1.5 rounded border text-xs ${
                            perm.source === "direct"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }`}
                        >
                          {PERMISSION_LABELS[perm.code] || perm.code}
                          {perm.source === "direct" && <span className="ml-1 text-[10px] opacity-70">direct</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">No permissions.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a user to view their direct permissions
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================ MODAL: EDIT USER (roles + permissions) ============================ */}
      {editingUser && userDetail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
                <p className="text-sm text-gray-500">
                  {userDetail.user.full_name} <span className="text-gray-400">({userDetail.user.username})</span>
                </p>
              </div>
              <button
                onClick={closeEditUser}
                className="text-gray-500 hover:text-gray-900"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Roles section */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-blue-600">👤</span> Assigned Roles
              </h4>
              <div className="space-y-2">
                {userDetail.roles.length > 0 ? (
                  userDetail.roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-medium ${
                            role.is_system ? "text-gray-700" : "text-gray-900"
                          }`}
                        >
                          {role.name}
                        </span>
                        {role.is_system && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">system</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveUserRole(role.id, role.name)}
                        disabled={savingUser}
                        className="text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">No roles assigned.</div>
                )}
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Assign a Role</h4>
                <div className="flex gap-2 items-end">
                  <select
                    value={assignRoleId}
                    onChange={(e) => setAssignRoleId(e.target.value)}
                    disabled={savingUser}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">-- Select role --</option>
                    {rolesNotAssigned(userDetail.roles).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignUserRole}
                    disabled={savingUser || !assignRoleId}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingUser ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </div>
            </div>

            {/* Permissions section */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-purple-600">🔐</span> Direct Permissions
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Grant or revoke permissions directly to this user. These apply in addition to role-inherited permissions.
              </p>
              <div className="space-y-4">
                {groupedPermissionEntries.map(([module, perms]) => (
                  <div key={module} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b font-medium text-gray-700 capitalize">
                      {module.replace(/_/g, " ")} Module
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                      {perms.map((perm) => {
                        const alreadyDirect = directPermissionIds.includes(perm.id);
                        const inherited = userDetail.permissions.some(
                          (p) => p.id === perm.id && p.source === "role"
                        );
                        return (
                          <label
                            key={perm.id}
                            className="flex items-start gap-3 p-4 border-b sm:border-b-0 sm:border-r last:border-0 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={alreadyDirect}
                              onChange={() => handleToggleUserPermission(perm.id)}
                              className="mt-1 w-4 h-4 text-blue-600 rounded"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {PERMISSION_LABELS[perm.code] || perm.code}
                              </div>
                              <div className="text-xs text-gray-500">
                                {perm.code}
                                {inherited ? <span className="ml-2 text-[10px] text-green-600">(inherited via role)</span> : null}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={closeEditUser}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={handleSaveUserPermissions}
                disabled={savingUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {savingUser ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================ MODAL: CREATE ROLE ============================ */}
      {creatingRole && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Code</label>
                <input
                  value={roleForm.code}
                  onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })}
                  placeholder="e.g. nurse"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="e.g. Nurse"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="e.g. Nursing staff"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roleForm.is_system}
                  onChange={(e) => setRoleForm({ ...roleForm, is_system: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label className="text-sm text-gray-700">System role (cannot be edited/deleted)</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setCreatingRole(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={savingRole || !roleForm.code || !roleForm.name}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {savingRole ? "Creating..." : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================ MODAL: EDIT ROLE ============================ */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Code</label>
                <input
                  value={editingRole.code}
                  disabled
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50"
                />
                {editingRole.is_system && (
                  <p className="text-[10px] text-gray-500 mt-1">System role code cannot be changed.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  disabled={isSystemRole(editingRole)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  disabled={isSystemRole(editingRole)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditingRole(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={savingRole || isSystemRole(editingRole)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {savingRole ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
