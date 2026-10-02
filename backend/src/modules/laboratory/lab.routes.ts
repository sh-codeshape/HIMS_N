import { Router } from 'express';
import { LabController } from './lab.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { createLabOrderSchema, updateLabResultSchema } from './lab.schema';

const router = Router();
const controller = new LabController();

router.use(authenticate);

router.get('/tests', controller.getLabTests);
router.get('/definitions', controller.getTestDefinitions);
router.post('/orders', validate(createLabOrderSchema), controller.createLabOrder);
router.patch('/results/:id', validate(updateLabResultSchema), controller.updateLabResult);

export const labRoutes = router;
