"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PharmacyController = void 0;
const pharmacy_service_1 = require("./pharmacy.service");
const response_1 = require("../../shared/utils/response");
class PharmacyController {
    service;
    constructor() {
        this.service = new pharmacy_service_1.PharmacyService();
    }
    getMedicines = async (req, res) => {
        const facilityId = req.user?.facilityId ?? req.query.facilityId;
        const organizationId = req.user?.organizationId ?? req.query.organizationId;
        const medicines = await this.service.getMedicines(facilityId, organizationId);
        (0, response_1.sendSuccess)(res, medicines, 'Medicines retrieved successfully');
    };
    dispenseMedicine = async (req, res) => {
        const facilityId = req.user?.facilityId ?? req.body.facilityId;
        const organizationId = req.user?.organizationId ?? req.body.organizationId;
        const { itemId, quantity, patientId, encounterId } = req.body;
        const result = await this.service.dispenseMedicine(facilityId, organizationId, itemId, quantity, patientId, encounterId);
        (0, response_1.sendSuccess)(res, result, 'Medicine dispensed successfully', 201);
    };
    getExpiringMedicines = async (req, res) => {
        const facilityId = req.user?.facilityId ?? req.query.facilityId;
        const organizationId = req.user?.organizationId ?? req.query.organizationId;
        const daysAhead = req.query.days ? parseInt(req.query.days, 10) : 90;
        const expiring = await this.service.getExpiringMedicines(facilityId, organizationId, daysAhead);
        (0, response_1.sendSuccess)(res, expiring, 'Expiring medicines retrieved successfully');
    };
}
exports.PharmacyController = PharmacyController;
