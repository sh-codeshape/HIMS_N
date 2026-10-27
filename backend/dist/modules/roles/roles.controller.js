"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesController = void 0;
const roles_service_1 = require("./roles.service");
const response_1 = require("../../shared/utils/response");
class RolesController {
    service;
    constructor() {
        this.service = new roles_service_1.RolesService();
    }
    /* ---------- Roles ---------- */
    getRoles = async (req, res, next) => {
        try {
            const organizationId = req.user?.organizationId;
            const roles = await this.service.getRoles(organizationId);
            (0, response_1.sendSuccess)(res, roles, 'Roles retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    createRole = async (req, res, next) => {
        try {
            const organizationId = req.user?.organizationId;
            const createdBy = req.user?.userId;
            const role = await this.service.createRole(organizationId, {
                ...req.body,
                createdBy,
                updatedBy: createdBy,
            });
            (0, response_1.sendSuccess)(res, role, 'Role created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    };
    updateRole = async (req, res, next) => {
        try {
            const roleId = req.params.roleId;
            const updatedBy = req.user?.userId;
            const role = await this.service.updateRole(roleId, {
                ...req.body,
                updatedBy,
            });
            (0, response_1.sendSuccess)(res, role, 'Role updated successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    deleteRole = async (req, res, next) => {
        try {
            const roleId = req.params.roleId;
            await this.service.deleteRole(roleId);
            (0, response_1.sendSuccess)(res, null, 'Role deleted successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    /* ---------- Permissions catalog ---------- */
    getPermissions = async (req, res, next) => {
        try {
            const permissions = await this.service.getPermissions();
            (0, response_1.sendSuccess)(res, permissions, 'Permissions retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    getRolePermissions = async (req, res, next) => {
        try {
            const roleId = req.params.roleId;
            const permissions = await this.service.getRolePermissions(roleId);
            (0, response_1.sendSuccess)(res, permissions, 'Role permissions retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    updateRolePermissions = async (req, res, next) => {
        try {
            const roleId = req.params.roleId;
            const { permissionIds } = req.body;
            await this.service.updateRolePermissions(roleId, permissionIds);
            (0, response_1.sendSuccess)(res, null, 'Role permissions updated successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    /* ---------- Users <-> Roles ---------- */
    getUsersWithRoles = async (req, res, next) => {
        try {
            const organizationId = req.user?.organizationId;
            const users = await this.service.getUsersWithRoles(organizationId);
            (0, response_1.sendSuccess)(res, users, 'Users with roles retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    getUserById = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const user = await this.service.getUserById(userId);
            const roles = await this.service.getUserRoles(userId);
            const permissions = await this.service.getUserPermissions(userId);
            (0, response_1.sendSuccess)(res, { user, roles, permissions }, 'User details retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    getRoleUsers = async (req, res, next) => {
        try {
            const roleId = req.params.roleId;
            const users = await this.service.getRoleUsers(roleId);
            (0, response_1.sendSuccess)(res, users, 'Role users retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    assignUserRole = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { roleId, facilityId } = req.body;
            await this.service.assignUserRole(userId, roleId, facilityId);
            (0, response_1.sendSuccess)(res, null, 'Role assigned to user successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    removeUserRole = async (req, res, next) => {
        try {
            const { userId, roleId } = req.params;
            await this.service.removeUserRole(userId, roleId);
            (0, response_1.sendSuccess)(res, null, 'Role removed from user successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    /* ---------- Users <-> Permissions (direct grants) ---------- */
    getUserPermissions = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const permissions = await this.service.getUserPermissions(userId);
            (0, response_1.sendSuccess)(res, permissions, 'User permissions retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    grantUserPermission = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const grantedBy = req.user?.userId;
            const { permissionId, expiresAt } = req.body;
            await this.service.grantUserPermission(userId, permissionId, grantedBy, expiresAt);
            (0, response_1.sendSuccess)(res, null, 'Permission granted to user successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    revokeUserPermission = async (req, res, next) => {
        try {
            const { userId, permissionId } = req.params;
            await this.service.revokeUserPermission(userId, permissionId);
            (0, response_1.sendSuccess)(res, null, 'Permission revoked from user successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.RolesController = RolesController;
