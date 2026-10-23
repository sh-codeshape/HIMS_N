import { Router } from 'express';
import { ModulesController } from './modules.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
const controller = new ModulesController();

router.use(authenticate);

// Any authenticated user can view which modules are enabled
router.get('/', authenticate, controller.getModules);

// Only developer.modules can toggle modules
router.put('/:moduleKey', authenticate, authorize(['developer.modules']), controller.toggleModule);

export const modulesRoutes = router;
