"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opdRoutes = void 0;
const express_1 = require("express");
const opd_controller_1 = require("./opd.controller");
const validate_1 = require("../../middleware/validate");
const authenticate_1 = require("../../middleware/authenticate");
const moduleGuard_1 = require("../../middleware/moduleGuard");
const opd_schema_1 = require("./opd.schema");
const router = (0, express_1.Router)();
const controller = new opd_controller_1.OpdController();
router.use(authenticate_1.authenticate); // Require authentication for all OPD routes
router.use((0, moduleGuard_1.moduleGuard)('opd'));
router.post('/tokens', (0, validate_1.validate)(opd_schema_1.createOpdEncounterSchema), controller.issueToken);
router.get('/queue', controller.getQueue);
router.get('/reports', controller.getReports);
router.patch('/tokens/:id/status', (0, validate_1.validate)(opd_schema_1.updateOpdStatusSchema), controller.updateStatus);
exports.opdRoutes = router;
