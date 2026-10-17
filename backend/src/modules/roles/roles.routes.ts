import { Router } from 'express';
import { RolesController } from './roles.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
const controller = new RolesController();

router.use(authenticate);

/* ---------- Roles ---------- */
router.get('/', authorize(['roles.view', 'roles.manage']), controller.getRoles);
router.post('/', authorize(['roles.manage']), controller.createRole);
router.put('/:roleId', authorize(['roles.manage']), controller.updateRole);
router.delete('/:roleId', authorize(['roles.manage']), controller.deleteRole);

/* ---------- Permissions catalog ---------- */
router.get('/permissions', authorize(['roles.view', 'roles.manage']), controller.getPermissions);
router.get('/:roleId/permissions', authorize(['roles.view', 'roles.manage']), controller.getRolePermissions);
router.put('/:roleId/permissions', authorize(['roles.manage']), controller.updateRolePermissions);

/* ---------- Users <-> Roles ---------- */
router.get('/users', authorize(['roles.view', 'roles.manage']), controller.getUsersWithRoles);
router.get('/:roleId/users', authorize(['roles.view', 'roles.manage']), controller.getRoleUsers);
router.post('/users/:userId/roles', authorize(['roles.manage']), controller.assignUserRole);
router.delete('/users/:userId/roles/:roleId', authorize(['roles.manage']), controller.removeUserRole);

/* ---------- Users <-> Permissions (direct grants) ---------- */
router.get('/users/:userId/permissions', authorize(['roles.view', 'roles.manage']), controller.getUserPermissions);
router.post('/users/:userId/permissions', authorize(['roles.manage']), controller.grantUserPermission);
router.delete('/users/:userId/permissions/:permissionId', authorize(['roles.manage']), controller.revokeUserPermission);

export const rolesRoutes = router;
