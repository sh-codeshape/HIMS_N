import { Router } from 'express';
import { LabController } from './lab.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { moduleGuard } from '../../middleware/moduleGuard';
import {
  createLabOrderSchema,
  updateLabResultSchema,
  submitBulkResultsSchema,
  verifyResultSchema,
  updateSpecimenStatusSchema,
  outsourceSpecimenSchema,
  outsourceReturnSpecimenSchema,
  outsourceLabSchema,
  updateOutsourceLabSchema,
  createTestDefinitionSchema,
  updateTestDefinitionSchema
} from './lab.schema';

const router = Router();
const controller = new LabController();

router.use(authenticate);
router.use(moduleGuard('laboratory'));

// Dashboard & Catalog
router.get('/dashboard-stats', controller.getDashboardStats);
router.get('/definitions', controller.getTestDefinitions);
router.post('/definitions', validate(createTestDefinitionSchema), controller.createTestDefinition);
router.put('/definitions/:id', validate(updateTestDefinitionSchema), controller.updateTestDefinition);
router.delete('/definitions/:id', controller.deleteTestDefinition);
router.get('/tests', controller.getLabTests);

// Orders & Details
router.post('/orders', validate(createLabOrderSchema), controller.createLabOrder);
router.get('/orders/:id', controller.getOrderDetails);
router.get('/tests/:id/parameters', controller.getOrderItemParameters);

// Results entry & verification
router.patch('/results/:id', validate(updateLabResultSchema), controller.updateLabResult);
router.post('/results/:id/bulk', validate(submitBulkResultsSchema), controller.submitBulkResults);
router.patch('/results/:id/verify', validate(verifyResultSchema), controller.verifyResult);

// Specimens & Outsource Tracking
router.patch('/specimens/:id/status', validate(updateSpecimenStatusSchema), controller.updateSpecimenStatus);
router.patch('/specimens/:id/outsource', validate(outsourceSpecimenSchema), controller.outsourceSpecimen);
router.patch('/specimens/:id/outsource-return', validate(outsourceReturnSpecimenSchema), controller.outsourceReturnSpecimen);

// Outsource Labs Master Data
router.get('/outsource-labs', controller.listOutsourceLabs);
router.post('/outsource-labs', validate(outsourceLabSchema), controller.createOutsourceLab);
router.put('/outsource-labs/:id', validate(updateOutsourceLabSchema), controller.updateOutsourceLab);
router.delete('/outsource-labs/:id', controller.deleteOutsourceLab);

export const labRoutes = router;
