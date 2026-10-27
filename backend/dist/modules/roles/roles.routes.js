"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesRoutes = void 0;
const express_1 = require("express");
const roles_controller_1 = require("./roles.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const router = (0, express_1.Router)();
const controller = new roles_controller_1.RolesController();
router.use(authenticate_1.authenticate);
/* ---------- Roles ---------- */
router.get('/', (0, authorize_1.authorize)(['roles.view', 'roles.manage']), controller.getRoles);
router.post('/', (0, authorize_1.authorize)(['roles.manage']), controller.createRole);
router.put('/:roleId', (0, authorize_1.authorize)(['roles.manage']), controller.updateRole);
router.delete('/:roleId', (0, authorize_1.authorize)(['roles.manage']), controller.deleteRole);
/* ---------- Permissions catalog ---------- */
router.get('/permissions', (0, authorize_1.authorize)(['roles.view', 'roles.manage']), controller.getPermissions);
router.get('/:roleId/permissions', (0, authorize_1.authorize)(['roles.view', 'roles.manage']), controller.getRolePermissions);
router.put('/:roleId/permissions', (0, authorize_1.authorize)(['roles.manage']), controller.updateRolePermissions);
/* ---------- Users <-> Roles ---------- */
router.get('/users', (0, authorize_1.authorize)(['roles.view', 'roles.manage']), controller.getUsersWithRoles);
router.get('/users/:userId', (0, authorize_1.authorize)(['roles.view', 'roles.manage']), controller.getUserById);
router.get('/:roleId/users', (0, authorize_1.authorize)(['roles.view', 'roles.manage']), controller.getRoleUsers);
router.post('/users/:userId/roles', (0, authorize_1.authorize)(['roles.manage']), controller.assignUserRole);
router.delete('/users/:userId/roles/:roleId', (0, authorize_1.authorize)(['roles.manage']), controller.removeUserRole);
/* ---------- Users <-> Permissions (direct grants) ---------- */
router.get('/users/:userId/permissions', (0, authorize_1.authorize)(['roles.view', 'roles.manage']), controller.getUserPermissions);
router.post('/users/:userId/permissions', (0, authorize_1.authorize)(['roles.manage']), controller.grantUserPermission);
router.delete('/users/:userId/permissions/:permissionId', (0, authorize_1.authorize)(['roles.manage']), controller.revokeUserPermission);
exports.rolesRoutes = router;
