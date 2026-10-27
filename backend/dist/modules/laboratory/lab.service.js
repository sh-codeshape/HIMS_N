"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabService = void 0;
const lab_repository_1 = require("./lab.repository");
class LabService {
    repository;
    constructor() {
        this.repository = new lab_repository_1.LabRepository();
    }
    async getLabTests(facilityId) {
        return this.repository.getLabTests(facilityId);
    }
    async getTestDefinitions(organizationId) {
        return this.repository.getTestDefinitions(organizationId);
    }
    async createLabOrder(facilityId, organizationId, patientId, testDefinitionIds, orderedBy) {
        return this.repository.createLabOrder(facilityId, organizationId, patientId, testDefinitionIds, orderedBy);
    }
    async updateLabResult(orderItemId, result, status) {
        return this.repository.updateLabResult(orderItemId, result, status);
    }
}
exports.LabService = LabService;
