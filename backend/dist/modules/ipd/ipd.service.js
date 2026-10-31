"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpdService = void 0;
const ipd_repository_1 = require("./ipd.repository");
const AppError_1 = require("../../shared/errors/AppError");
class IpdService {
    repository;
    constructor() {
        this.repository = new ipd_repository_1.IpdRepository();
    }
    async admitPatient(data, organizationId) {
        return this.repository.admitPatient(data.facility_id, organizationId, data.patient_id, data.bed_id, data.admitting_practitioner_id, data.department_id, data.referred_by, data.admission_type, data.reason_for_admission, data.attendant_name, data.attendant_relation, data.attendant_phone, data.tariff_plan_id, data.entitled_bed_category_id, data.payer_type, data.patient_coverage_id, data.advance_deposit);
    }
    async getAdmissions(facilityId, search, status) {
        return this.repository.getAdmissions(facilityId, search, status);
    }
    async getAdmissionById(admissionId) {
        const admission = await this.repository.getAdmissionById(admissionId);
        if (!admission) {
            throw new AppError_1.NotFoundError('Admission not found');
        }
        return admission;
    }
    async dischargePatient(facilityId, admissionId, dischargeType, dischargeCondition, autoWalletCredit) {
        const admission = await this.repository.dischargePatient(facilityId, admissionId, dischargeType, dischargeCondition, autoWalletCredit);
        if (!admission) {
            throw new AppError_1.NotFoundError('Admission not found');
        }
        return admission;
    }
    async getDischargeSummary(admissionId) {
        return this.repository.getDischargeSummary(admissionId);
    }
    async saveDischargeSummary(admissionId, data) {
        return this.repository.saveDischargeSummary(admissionId, data);
    }
    async getIpdReportStats(facilityId) {
        return this.repository.getIpdReportStats(facilityId);
    }
    async getPendingDues(encounterId) {
        return this.repository.getPendingDues(encounterId);
    }
}
exports.IpdService = IpdService;
