"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpdService = void 0;
exports.normalizeReportQuery = normalizeReportQuery;
const opd_repository_1 = require("./opd.repository");
const AppError_1 = require("../../shared/errors/AppError");
function normalizeReportQuery(input = {}) {
    const from = input.from ? input.from.trim() : '';
    const to = input.to ? input.to.trim() : '';
    const normalizedFrom = from && to && from > to ? to : from;
    const normalizedTo = from && to && from > to ? from : to;
    const rawPage = Number.isFinite(input.page) ? Number(input.page) : 1;
    const rawLimit = Number.isFinite(input.limit) ? Number(input.limit) : 50;
    const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);
    const limit = Math.max(1, Math.min(rawLimit, 500));
    const sortBy = input.sortBy && input.sortBy.trim() ? input.sortBy.trim() : 'started_at';
    const sortOrder = input.sortOrder && /^(ASC|DESC)$/i.test(String(input.sortOrder))
        ? String(input.sortOrder).toUpperCase()
        : 'DESC';
    return {
        from: normalizedFrom,
        to: normalizedTo,
        practitionerId: input.practitionerId,
        departmentId: input.departmentId,
        page,
        limit,
        sortBy,
        sortOrder,
    };
}
class OpdService {
    repository;
    constructor() {
        this.repository = new opd_repository_1.OpdRepository();
    }
    async issueToken(data, organizationId) {
        if (data.patient_id) {
            const alreadyRegisteredToday = await this.repository.hasOpdEncounterToday(data.patient_id);
            if (alreadyRegisteredToday) {
                throw new AppError_1.ConflictError('This patient already has an OPD registration today. Only one OPD registration is allowed per patient per day.');
            }
        }
        const nextToken = await this.repository.getNextToken(data.facility_id, data.primary_practitioner_id);
        const encounter = await this.repository.createEncounter(data.facility_id, organizationId, data.patient_id, data.primary_practitioner_id, data.department_id, data.referred_by, data.chief_complaint, nextToken, data.attendant_name, data.attendant_relation, data.attendant_phone);
        // If there were vitals, we would insert into observations here...
        return {
            ...encounter,
            token_number: nextToken
        };
    }
    async getQueue(facilityId, practitionerId, date) {
        return this.repository.getQueue(facilityId, practitionerId, date);
    }
    async getReports(facilityId, from, to, practitionerId, departmentId, page = 1, limit = 50, sortBy = 'started_at', sortOrder = 'DESC') {
        const normalized = normalizeReportQuery({
            from,
            to,
            practitionerId,
            departmentId,
            page,
            limit,
            sortBy,
            sortOrder,
        });
        return this.repository.getReports(facilityId, normalized.from, normalized.to, normalized.practitionerId, normalized.departmentId, normalized.page, normalized.limit, normalized.sortBy, normalized.sortOrder);
    }
    async updateStatus(encounterId, status, facilityId) {
        const updated = await this.repository.updateStatus(encounterId, status, facilityId);
        if (!updated) {
            throw new AppError_1.NotFoundError('Encounter not found or does not belong to this facility');
        }
        return updated;
    }
}
exports.OpdService = OpdService;
