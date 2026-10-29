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
        const facilityId = req.user?.facilityId || req.query.facilityId;
        const filters = {
            search: req.query.search,
            status: req.query.status,
            source: req.query.source,
            date: req.query.date
        };
        const tests = await this.service.getLabTests(facilityId, filters);
        (0, response_1.sendSuccess)(res, tests, 'Lab tests retrieved successfully');
    };
    getTestDefinitions = async (req, res) => {
        const organizationId = req.user?.organizationId || req.query.organizationId;
        const includeInactive = req.query.includeInactive === 'true';
        const definitions = await this.service.getTestDefinitions(organizationId, includeInactive);
        (0, response_1.sendSuccess)(res, definitions, 'Test definitions retrieved successfully');
    };
    getOrderDetails = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId;
        const id = req.params.id;
        const order = await this.service.getOrderDetails(id, facilityId);
        (0, response_1.sendSuccess)(res, order, 'Order details retrieved successfully');
    };
    getOrderItemParameters = async (req, res) => {
        const id = req.params.id; // order_item_id
        const result = await this.service.getOrderItemParameters(id);
        (0, response_1.sendSuccess)(res, result, 'Test parameters retrieved successfully');
    };
    createLabOrder = async (req, res) => {
        const facilityId = req.user?.facilityId || req.body.facilityId || '00000000-0000-0000-0000-000000000000';
        const organizationId = req.user?.organizationId || req.body.organizationId || '00000000-0000-0000-0000-000000000000';
        const userId = req.user?.userId;
        const result = await this.service.createLabOrder(facilityId, organizationId, req.body, userId);
        (0, response_1.sendSuccess)(res, result, 'Lab order created successfully', 201);
    };
    updateLabResult = async (req, res) => {
        const id = req.params.id;
        const { result, notes, status } = req.body;
        const updated = await this.service.updateLabResult(id, result || notes, status);
        (0, response_1.sendSuccess)(res, updated, 'Lab result updated successfully');
    };
    submitBulkResults = async (req, res) => {
        const id = req.params.id;
        const { results, status } = req.body;
        const userId = req.user?.userId;
        const updated = await this.service.submitBulkResults(id, results, status, userId);
        (0, response_1.sendSuccess)(res, updated, 'Lab results submitted successfully');
    };
    verifyResult = async (req, res) => {
        const id = req.params.id;
        const verifiedBy = req.body?.verifiedBy || req.user?.userId;
        const comments = req.body?.comments;
        const updated = await this.service.verifyResult(id, verifiedBy, comments);
        (0, response_1.sendSuccess)(res, updated, 'Lab results verified successfully');
    };
    updateSpecimenStatus = async (req, res) => {
        const id = req.params.id;
        const { status, rejectionReason } = req.body;
        const updated = await this.service.updateSpecimenStatus(id, status, rejectionReason);
        (0, response_1.sendSuccess)(res, updated, 'Specimen status updated successfully');
    };
    outsourceSpecimen = async (req, res) => {
        const id = req.params.id;
        const result = await this.service.outsourceSpecimen(id, req.body);
        (0, response_1.sendSuccess)(res, result, 'Specimen marked as outsourced successfully');
    };
    outsourceReturnSpecimen = async (req, res) => {
        const id = req.params.id;
        const result = await this.service.outsourceReturnSpecimen(id, req.body);
        (0, response_1.sendSuccess)(res, result, 'Specimen returned from outsource lab successfully');
    };
    getDashboardStats = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId;
        const stats = await this.service.getDashboardStats(facilityId);
        (0, response_1.sendSuccess)(res, stats, 'Dashboard stats retrieved successfully');
    };
    listOutsourceLabs = async (req, res) => {
        const organizationId = req.user?.organizationId || req.query.organizationId;
        const labs = await this.service.listOutsourceLabs(organizationId);
        (0, response_1.sendSuccess)(res, labs, 'Outsource labs retrieved successfully');
    };
    createOutsourceLab = async (req, res) => {
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        const userId = req.user?.userId;
        const lab = await this.service.createOutsourceLab(organizationId, req.body, userId);
        (0, response_1.sendSuccess)(res, lab, 'Outsource lab created successfully', 201);
    };
    updateOutsourceLab = async (req, res) => {
        const id = req.params.id;
        const userId = req.user?.userId;
        const lab = await this.service.updateOutsourceLab(id, req.body, userId);
        (0, response_1.sendSuccess)(res, lab, 'Outsource lab updated successfully');
    };
    deleteOutsourceLab = async (req, res) => {
        const id = req.params.id;
        const lab = await this.service.deleteOutsourceLab(id);
        (0, response_1.sendSuccess)(res, lab, 'Outsource lab deactivated successfully');
    };
    createTestDefinition = async (req, res) => {
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        const userId = req.user?.userId;
        const test = await this.service.createTestDefinition(organizationId, req.body, userId);
        (0, response_1.sendSuccess)(res, test, 'In-house lab test created successfully', 201);
    };
    updateTestDefinition = async (req, res) => {
        const id = req.params.id;
        const userId = req.user?.userId;
        const test = await this.service.updateTestDefinition(id, req.body, userId);
        (0, response_1.sendSuccess)(res, test, 'In-house lab test updated successfully');
    };
    deleteTestDefinition = async (req, res) => {
        const id = req.params.id;
        const test = await this.service.deleteTestDefinition(id);
        (0, response_1.sendSuccess)(res, test, 'In-house lab test removed successfully');
    };
}
exports.LabController = LabController;
