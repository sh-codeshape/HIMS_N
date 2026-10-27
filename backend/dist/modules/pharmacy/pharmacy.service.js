"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PharmacyService = void 0;
const pharmacy_repository_1 = require("./pharmacy.repository");
class PharmacyService {
    repository;
    constructor() {
        this.repository = new pharmacy_repository_1.PharmacyRepository();
    }
    async getMedicines(facilityId, organizationId) {
        return this.repository.getMedicines(facilityId, organizationId);
    }
    async dispenseMedicine(facilityId, organizationId, itemId, quantity, patientId, encounterId) {
        return this.repository.dispenseMedicine(facilityId, organizationId, itemId, quantity, patientId, encounterId);
    }
    async getExpiringMedicines(facilityId, organizationId, daysAhead) {
        return this.repository.getExpiringMedicines(facilityId, organizationId, daysAhead);
    }
}
exports.PharmacyService = PharmacyService;
