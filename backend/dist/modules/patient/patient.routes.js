"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patient_controller_1 = require("./patient.controller");
const validate_1 = require("../../middleware/validate");
const patient_schema_1 = require("./patient.schema");
// import { authenticate } from '../../middleware/authenticate';
const router = (0, express_1.Router)();
// Apply authenticate middleware to all patient routes when ready
// router.use(authenticate);
router.post('/', (0, validate_1.validate)(patient_schema_1.createPatientSchema), patient_controller_1.patientController.createPatient);
router.get('/', (0, validate_1.validate)(patient_schema_1.searchPatientSchema), patient_controller_1.patientController.searchPatients);
router.get('/:id', (0, validate_1.validate)(patient_schema_1.getPatientSchema), patient_controller_1.patientController.getPatient);
router.patch('/:id', (0, validate_1.validate)(patient_schema_1.updatePatientSchema), patient_controller_1.patientController.updatePatient);
router.delete('/:id', (0, validate_1.validate)(patient_schema_1.getPatientSchema), patient_controller_1.patientController.deletePatient);
router.get('/:id/family', (0, validate_1.validate)(patient_schema_1.getPatientSchema), patient_controller_1.patientController.getFamilyMembers);
exports.default = router;
