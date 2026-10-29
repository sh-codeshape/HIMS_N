"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labRoutes = void 0;
const express_1 = require("express");
const lab_controller_1 = require("./lab.controller");
const validate_1 = require("../../middleware/validate");
const authenticate_1 = require("../../middleware/authenticate");
const moduleGuard_1 = require("../../middleware/moduleGuard");
const lab_schema_1 = require("./lab.schema");
const router = (0, express_1.Router)();
const controller = new lab_controller_1.LabController();
router.use(authenticate_1.authenticate);
router.use((0, moduleGuard_1.moduleGuard)('laboratory'));
// Dashboard & Catalog
router.get('/dashboard-stats', controller.getDashboardStats);
router.get('/definitions', controller.getTestDefinitions);
router.post('/definitions', (0, validate_1.validate)(lab_schema_1.createTestDefinitionSchema), controller.createTestDefinition);
router.put('/definitions/:id', (0, validate_1.validate)(lab_schema_1.updateTestDefinitionSchema), controller.updateTestDefinition);
router.delete('/definitions/:id', controller.deleteTestDefinition);
router.get('/tests', controller.getLabTests);
// Orders & Details
router.post('/orders', (0, validate_1.validate)(lab_schema_1.createLabOrderSchema), controller.createLabOrder);
router.get('/orders/:id', controller.getOrderDetails);
router.get('/tests/:id/parameters', controller.getOrderItemParameters);
// Results entry & verification
router.patch('/results/:id', (0, validate_1.validate)(lab_schema_1.updateLabResultSchema), controller.updateLabResult);
router.post('/results/:id/bulk', (0, validate_1.validate)(lab_schema_1.submitBulkResultsSchema), controller.submitBulkResults);
router.patch('/results/:id/verify', (0, validate_1.validate)(lab_schema_1.verifyResultSchema), controller.verifyResult);
// Specimens & Outsource Tracking
router.patch('/specimens/:id/status', (0, validate_1.validate)(lab_schema_1.updateSpecimenStatusSchema), controller.updateSpecimenStatus);
router.patch('/specimens/:id/outsource', (0, validate_1.validate)(lab_schema_1.outsourceSpecimenSchema), controller.outsourceSpecimen);
router.patch('/specimens/:id/outsource-return', (0, validate_1.validate)(lab_schema_1.outsourceReturnSpecimenSchema), controller.outsourceReturnSpecimen);
// Outsource Labs Master Data
router.get('/outsource-labs', controller.listOutsourceLabs);
router.post('/outsource-labs', (0, validate_1.validate)(lab_schema_1.outsourceLabSchema), controller.createOutsourceLab);
router.put('/outsource-labs/:id', (0, validate_1.validate)(lab_schema_1.updateOutsourceLabSchema), controller.updateOutsourceLab);
router.delete('/outsource-labs/:id', controller.deleteOutsourceLab);
exports.labRoutes = router;
