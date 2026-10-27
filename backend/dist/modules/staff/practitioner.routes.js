"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.practitionerRoutes = void 0;
const express_1 = require("express");
const practitioner_controller_1 = require("./practitioner.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const moduleGuard_1 = require("../../middleware/moduleGuard");
const router = (0, express_1.Router)();
const controller = new practitioner_controller_1.PractitionerController();
router.use(authenticate_1.authenticate);
router.use((0, moduleGuard_1.moduleGuard)('staff'));
// Doctors/Practitioners
router.get('/', (0, authorize_1.authorize)(['staff.view', 'staff.manage']), controller.getPractitioners);
router.post('/', (0, authorize_1.authorize)(['staff.manage']), controller.createPractitioner);
router.put('/:id', (0, authorize_1.authorize)(['staff.manage']), controller.updatePractitioner);
router.patch('/:id/toggle', (0, authorize_1.authorize)(['staff.manage']), controller.togglePractitioner);
router.delete('/:id', (0, authorize_1.authorize)(['staff.manage']), controller.deletePractitioner);
// Doctor Schedules
router.get('/:id/schedules', (0, authorize_1.authorize)(['staff.view', 'staff.manage']), controller.getSchedules);
router.post('/:id/schedules', (0, authorize_1.authorize)(['staff.manage']), controller.createSchedule);
router.put('/:id/schedules/:scheduleId', (0, authorize_1.authorize)(['staff.manage']), controller.updateSchedule);
router.delete('/:id/schedules/:scheduleId', (0, authorize_1.authorize)(['staff.manage']), controller.deleteSchedule);
exports.practitionerRoutes = router;
