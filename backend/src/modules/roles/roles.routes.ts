import { Router } from 'express';
import { RolesController } from './roles.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
const controller = new RolesController();

router.use(authenticate);

// Only users with 'roles.manage' or 'roles.view' (for GETs) can access these routes
router.get('/', authorize(['roles.view', 'roles.manage']), controller.getRoles);
router.get('/permissions', authorize(['roles.view', 'roles.manage']), controller.getPermissions);
router.get('/:roleId/permissions', authorize(['roles.view', 'roles.manage']), controller.getRolePermissions);
router.put('/:roleId/permissions', authorize(['roles.manage']), controller.updateRolePermissions);

export const rolesRoutes = router;
