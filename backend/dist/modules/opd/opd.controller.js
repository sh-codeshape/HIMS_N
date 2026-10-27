"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpdController = void 0;
const opd_service_1 = require("./opd.service");
const AppError_1 = require("../../shared/errors/AppError");
const response_1 = require("../../shared/utils/response");
const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
class OpdController {
    service;
    constructor() {
        this.service = new opd_service_1.OpdService();
    }
    issueToken = async (req, res) => {
        const organizationId = req.user?.organizationId || req.body?.organization_id || req.body?.organizationId;
        const facilityId = req.user?.facilityId || req.body?.facility_id || req.body?.facilityId;
        if (!organizationId || organizationId === ZERO_UUID) {
            throw new AppError_1.ValidationError('Authenticated organization is required for OPD token issuance.');
        }
        if (!facilityId || facilityId === ZERO_UUID) {
            throw new AppError_1.ValidationError('A valid facility is required for OPD token issuance.');
        }
        const result = await this.service.issueToken({ ...req.body, facility_id: facilityId, organization_id: organizationId }, organizationId);
        (0, response_1.sendSuccess)(res, result, 'OPD token issued successfully', 201);
    };
    getQueue = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        const practitionerId = req.query.doctorId;
        const date = req.query.date;
        const queue = await this.service.getQueue(facilityId, practitionerId, date);
        (0, response_1.sendSuccess)(res, queue, 'OPD queue retrieved successfully');
    };
    getReports = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        const from = req.query.from;
        const to = req.query.to;
        const practitionerId = req.query.doctorId;
        const departmentId = req.query.departmentId;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const sortBy = req.query.sortBy || 'started_at';
        const sortOrder = req.query.sortOrder || 'DESC';
        const result = await this.service.getReports(facilityId, from, to, practitionerId, departmentId, page, limit, sortBy, sortOrder);
        (0, response_1.sendPaginated)(res, result.rows, { page: result.page, limit: result.limit, total: result.total });
    };
    updateStatus = async (req, res) => {
        const facilityId = req.user?.facilityId || req.body.facility_id || '00000000-0000-0000-0000-000000000000';
        const { id } = req.params;
        const { status } = req.body;
        const result = await this.service.updateStatus(String(id), String(status), facilityId);
        (0, response_1.sendSuccess)(res, result, 'OPD status updated successfully');
    };
}
exports.OpdController = OpdController;
