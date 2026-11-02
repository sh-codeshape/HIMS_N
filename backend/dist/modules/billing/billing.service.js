"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const billing_repository_1 = require("./billing.repository");
const AppError_1 = require("../../shared/errors/AppError");
class BillingService {
    repository;
    constructor() {
        this.repository = new billing_repository_1.BillingRepository();
    }
    async getDiscountReasons(organizationId) {
        return this.repository.getDiscountReasons(organizationId);
    }
    async getReferrals(organizationId, facilityId) {
        return this.repository.getReferrals(organizationId, facilityId);
    }
    async createInvoice(data, organizationId) {
        const subtotal = data.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
        const totalAmount = Math.max(0, subtotal - (data.discount_total || 0));
        return this.repository.createInvoice({
            ...data,
            organization_id: organizationId,
            facility_id: data.facility_id,
            patient_id: data.patient_id,
            encounter_id: data.encounter_id,
            invoice_type: data.invoice_type,
            subtotal,
            discount_total: data.discount_total || 0,
            discount_reason_id: data.discount_reason_id,
            discount_approved_by: data.discount_approved_by,
            discount_reference: data.discount_reference,
            referral_source: data.referral_source,
            referred_by: data.referred_by,
            notes: data.notes,
            total_amount: totalAmount,
            items: data.items,
            payment_mode: data.payment_mode
        });
    }
    async listInvoices(facilityId) {
        return this.repository.listInvoices(facilityId);
    }
    async getInvoice(invoiceId, facilityId) {
        const invoice = await this.repository.getInvoice(invoiceId, facilityId);
        if (!invoice) {
            throw new AppError_1.NotFoundError('Invoice not found');
        }
        return invoice;
    }
    async addCharge(data, organizationId, userId) {
        return this.repository.addCharge({
            ...data,
            organization_id: organizationId || data.organization_id,
            user_id: userId || data.user_id
        });
    }
    async removeCharge(id, facilityId) {
        const charge = await this.repository.removeCharge(id, facilityId);
        if (!charge) {
            throw new AppError_1.NotFoundError('Charge not found or already cancelled');
        }
        return charge;
    }
    async updateChargeDiscount(id, data) {
        return this.repository.updateChargeDiscount(id, data);
    }
    async applyConcessionBatch(data) {
        return this.repository.applyConcessionBatch(data);
    }
    async getRunningBill(encounterId, facilityId) {
        return this.repository.getRunningBill(encounterId, facilityId);
    }
    async recordAdvancePayment(data, organizationId, userId) {
        return this.repository.recordAdvancePayment({
            ...data,
            organization_id: organizationId || data.organization_id,
            user_id: userId || data.user_id
        });
    }
    async getEncounterPayments(encounterId, facilityId) {
        return this.repository.getEncounterPayments(encounterId, facilityId);
    }
    async settleBill(data, organizationId, userId) {
        return this.repository.settleBill({
            ...data,
            organization_id: organizationId || data.organization_id,
            user_id: userId || data.user_id
        });
    }
    async processRefund(data, organizationId, userId) {
        return this.repository.processRefund({
            ...data,
            organization_id: organizationId || data.organization_id,
            user_id: userId || data.user_id
        });
    }
    async creditWallet(data) {
        return this.repository.creditWallet(data);
    }
    async settleWithWallet(data) {
        return this.repository.settleWithWallet(data);
    }
    async postBedCharges(encounterId, facilityId, userId) {
        return this.repository.postBedCharges(encounterId, facilityId, userId);
    }
    async getReportsSummary(facilityId, dateFrom, dateTo) {
        return this.repository.getReportsSummary(facilityId, dateFrom, dateTo);
    }
    async getPendingDuesReport(facilityId, filters, page = 1, limit = 20) {
        return this.repository.getPendingDuesReport(facilityId, filters, page, limit);
    }
    async getCollectionsReport(facilityId, filters) {
        return this.repository.getCollectionsReport(facilityId, filters);
    }
    async getPatientDues(patientId, facilityId) {
        return this.repository.getPatientDues(patientId, facilityId);
    }
}
exports.BillingService = BillingService;
