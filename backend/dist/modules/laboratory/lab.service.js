"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabService = void 0;
const lab_repository_1 = require("./lab.repository");
class LabService {
    repository;
    constructor() {
        this.repository = new lab_repository_1.LabRepository();
    }
    async getLabTests(facilityId, filters) {
        return this.repository.getLabTests(facilityId, filters);
    }
    async getTestDefinitions(organizationId, includeInactive = false) {
        return this.repository.getTestDefinitions(organizationId, includeInactive);
    }
    async createTestDefinition(organizationId, data, userId) {
        return this.repository.createTestDefinition(organizationId, data, userId);
    }
    async updateTestDefinition(serviceId, data, userId) {
        return this.repository.updateTestDefinition(serviceId, data, userId);
    }
    async deleteTestDefinition(serviceId) {
        return this.repository.deleteTestDefinition(serviceId);
    }
    async getOrderDetails(orderId, facilityId) {
        return this.repository.getOrderDetails(orderId, facilityId);
    }
    async getOrderItemParameters(orderItemId) {
        return this.repository.getOrderItemParameters(orderItemId);
    }
    async createLabOrder(facilityId, organizationId, payload, userId) {
        return this.repository.createLabOrder({
            facilityId,
            organizationId,
            patientId: payload.patientId,
            encounterId: payload.encounterId,
            testDefinitionIds: payload.testDefinitionIds || [],
            orderedBy: payload.orderedBy,
            priority: payload.priority,
            clinicalInfo: payload.clinicalInfo,
            processingSource: payload.processingSource,
            outsourceLabId: payload.outsourceLabId,
            specimenType: payload.specimenType,
            collectedBy: payload.collectedBy,
            fasting: payload.fasting,
            barcode: payload.barcode,
            items: payload.items,
            paymentStatus: payload.paymentStatus,
            paymentMode: payload.paymentMode,
            userId
        });
    }
    async updateLabResult(orderItemId, result, status) {
        return this.repository.updateLabResult(orderItemId, result, status);
    }
    async submitBulkResults(orderItemId, results, status = 'preliminary', userId) {
        return this.repository.submitBulkResults(orderItemId, results, status, userId);
    }
    async verifyResult(orderItemId, verifiedBy, comments) {
        return this.repository.verifyResult(orderItemId, verifiedBy, comments);
    }
    async updateSpecimenStatus(specimenId, status, rejectionReason) {
        return this.repository.updateSpecimenStatus(specimenId, status, rejectionReason);
    }
    async outsourceSpecimen(specimenId, data) {
        return this.repository.outsourceSpecimen(specimenId, data);
    }
    async outsourceReturnSpecimen(specimenId, data) {
        return this.repository.outsourceReturnSpecimen(specimenId, data);
    }
    async getDashboardStats(facilityId) {
        return this.repository.getDashboardStats(facilityId);
    }
    async listOutsourceLabs(organizationId) {
        return this.repository.listOutsourceLabs(organizationId);
    }
    async getOutsourceLabById(id) {
        return this.repository.getOutsourceLabById(id);
    }
    async createOutsourceLab(organizationId, data, userId) {
        return this.repository.createOutsourceLab(organizationId, data, userId);
    }
    async updateOutsourceLab(id, data, userId) {
        return this.repository.updateOutsourceLab(id, data, userId);
    }
    async deleteOutsourceLab(id) {
        return this.repository.deleteOutsourceLab(id);
    }
}
exports.LabService = LabService;
