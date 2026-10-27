"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientController = exports.PatientController = void 0;
const patient_service_1 = require("./patient.service");
const response_1 = require("../../shared/utils/response");
class PatientController {
    async createPatient(req, res) {
        // In real app, organizationId comes from authenticated user token context
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        const patient = await patient_service_1.patientService.createPatient(organizationId, req.body);
        (0, response_1.sendSuccess)(res, patient, 201);
    }
    async searchPatients(req, res) {
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        const result = await patient_service_1.patientService.searchPatients(organizationId, req.query);
        (0, response_1.sendPaginated)(res, result.data, result.meta);
    }
    async getPatient(req, res) {
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        const patient = await patient_service_1.patientService.getPatient(String(req.params.id), organizationId);
        (0, response_1.sendSuccess)(res, patient);
    }
    async getFamilyMembers(req, res) {
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        const familyMembers = await patient_service_1.patientService.getFamilyMembers(String(req.params.id), organizationId);
        (0, response_1.sendSuccess)(res, familyMembers);
    }
    async updatePatient(req, res) {
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        const patient = await patient_service_1.patientService.updatePatient(String(req.params.id), organizationId, req.body);
        (0, response_1.sendSuccess)(res, patient);
    }
    async deletePatient(req, res) {
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        const result = await patient_service_1.patientService.deletePatient(String(req.params.id), organizationId);
        (0, response_1.sendSuccess)(res, result);
    }
}
exports.PatientController = PatientController;
exports.patientController = new PatientController();
