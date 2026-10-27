"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabController = void 0;
const lab_service_1 = require("./lab.service");
const response_1 = require("../../shared/utils/response");
class LabController {
    service;
    constructor() {
        this.service = new lab_service_1.LabService();
    }
    getLabTests = async (req, res) => {
        const facilityId = req.user?.facilityId ?? req.query.facilityId;
        const tests = await this.service.getLabTests(facilityId);
        (0, response_1.sendSuccess)(res, tests, 'Lab tests retrieved successfully');
    };
    getTestDefinitions = async (req, res) => {
        const organizationId = req.user?.organizationId ?? req.query.organizationId;
        const definitions = await this.service.getTestDefinitions(organizationId);
        (0, response_1.sendSuccess)(res, definitions, 'Test definitions retrieved successfully');
    };
    createLabOrder = async (req, res) => {
        const facilityId = req.user?.facilityId || req.body.facilityId || '00000000-0000-0000-0000-000000000000';
        const organizationId = req.user?.organizationId || req.body.organizationId || '00000000-0000-0000-0000-000000000000';
        const { patientId, testDefinitionIds, orderedBy } = req.body;
        const result = await this.service.createLabOrder(facilityId, organizationId, patientId, testDefinitionIds, orderedBy);
        (0, response_1.sendSuccess)(res, result, 'Lab order created successfully', 201);
    };
    updateLabResult = async (req, res) => {
        const id = req.params.id;
        const { result, status } = req.body;
        const updated = await this.service.updateLabResult(id, result, status);
        (0, response_1.sendSuccess)(res, updated, 'Lab result updated successfully');
    };
}
exports.LabController = LabController;
