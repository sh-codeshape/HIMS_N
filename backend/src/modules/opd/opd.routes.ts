import { Router } from 'express';
import { OpdController } from './opd.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { createOpdEncounterSchema, updateOpdStatusSchema } from './opd.schema';

const router = Router();
const controller = new OpdController();

router.use(authenticate); // Require authentication for all OPD routes

router.post('/tokens', validate(createOpdEncounterSchema), controller.issueToken);
router.get('/queue', controller.getQueue);
router.patch('/tokens/:id/status', validate(updateOpdStatusSchema), controller.updateStatus);

export const opdRoutes = router;
