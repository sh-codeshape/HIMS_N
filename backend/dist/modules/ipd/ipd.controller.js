"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpdController = void 0;
const ipd_service_1 = require("./ipd.service");
const response_1 = require("../../shared/utils/response");
class IpdController {
    service;
    constructor() {
        this.service = new ipd_service_1.IpdService();
    }
    admitPatient = async (req, res) => {
        const organizationId = req.user.organizationId;
        const zeroUuid = '00000000-0000-0000-000000000000';
        // Use facility from JWT token; never allow nil UUID to reach the service layer.
        // If the frontend sends nil UUID or no facility_id, fall back to the user's facility.
        const bodyFacilityId = req.body.facility_id;
        const tokenFacilityId = req.user?.facilityId;
        req.body.facility_id = tokenFacilityId || bodyFacilityId || undefined;
        // Reject nil UUID explicitly
        if (req.body.facility_id === zeroUuid) {
            req.body.facility_id = tokenFacilityId || undefined;
        }
        const result = await this.service.admitPatient(req.body, organizationId);
        (0, response_1.sendSuccess)(res, result, 'Patient admitted successfully', 201);
    };
    getAdmissions = async (req, res) => {
        const facilityId = req.user?.facilityId ?? req.query.facilityId ?? '';
        const search = req.query.search;
        const status = req.query.status;
        const queue = await this.service.getAdmissions(facilityId, search, status);
        (0, response_1.sendSuccess)(res, queue, 'Admissions retrieved successfully');
    };
    dischargePatient = async (req, res) => {
        const facilityId = req.user?.facilityId ?? req.body.facility_id ?? '';
        const { id } = req.params;
        const { discharge_type, discharge_condition } = req.body;
        const result = await this.service.dischargePatient(facilityId, String(id), String(discharge_type), discharge_condition);
        (0, response_1.sendSuccess)(res, result, 'Patient discharged successfully');
    };
    getDischargeSummary = async (req, res) => {
        const { id } = req.params;
        const summary = await this.service.getDischargeSummary(String(id));
        (0, response_1.sendSuccess)(res, summary, 'Discharge summary retrieved successfully');
    };
    saveDischargeSummary = async (req, res) => {
        const { id } = req.params;
        const summary = await this.service.saveDischargeSummary(String(id), req.body);
        (0, response_1.sendSuccess)(res, summary, 'Discharge summary saved successfully');
    };
    getIpdReportStats = async (req, res) => {
        const facilityId = req.user?.facilityId ?? req.query.facilityId ?? '';
        const stats = await this.service.getIpdReportStats(facilityId);
        (0, response_1.sendSuccess)(res, stats, 'IPD report statistics retrieved successfully');
    };
    getPendingDues = async (req, res) => {
        const { id } = req.params;
        const result = await this.service.getPendingDues(String(id));
        (0, response_1.sendSuccess)(res, result, 'Pending dues retrieved successfully');
    };
}
exports.IpdController = IpdController;
