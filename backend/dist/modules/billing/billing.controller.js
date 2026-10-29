"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const billing_service_1 = require("./billing.service");
const response_1 = require("../../shared/utils/response");
class BillingController {
    service;
    constructor() {
        this.service = new billing_service_1.BillingService();
    }
    createInvoice = async (req, res) => {
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        if (!req.body.facility_id) {
            req.body.facility_id = req.user?.facilityId;
        }
        const result = await this.service.createInvoice(req.body, organizationId);
        (0, response_1.sendSuccess)(res, result, 'Invoice created successfully', 201);
    };
    listInvoices = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        const invoices = await this.service.listInvoices(facilityId);
        (0, response_1.sendSuccess)(res, invoices, 'Invoices retrieved successfully');
    };
    getInvoice = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        const id = req.params.id;
        const invoice = await this.service.getInvoice(id, facilityId);
        (0, response_1.sendSuccess)(res, invoice, 'Invoice retrieved successfully');
    };
    addCharge = async (req, res) => {
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        const userId = req.user?.userId || '00000000-0000-0000-0000-000000000000';
        if (!req.body.facility_id)
            req.body.facility_id = req.user?.facilityId;
        const result = await this.service.addCharge(req.body, organizationId, userId);
        (0, response_1.sendSuccess)(res, result, 'Charge added successfully', 201);
    };
    removeCharge = async (req, res) => {
        const facilityId = req.user?.facilityId || req.body.facility_id || '00000000-0000-0000-0000-000000000000';
        const id = req.params.id;
        const result = await this.service.removeCharge(id, facilityId);
        (0, response_1.sendSuccess)(res, result, 'Charge removed successfully');
    };
    getRunningBill = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        const encounterId = req.params.encounterId;
        const charges = await this.service.getRunningBill(encounterId, facilityId);
        (0, response_1.sendSuccess)(res, charges, 'Running bill retrieved successfully');
    };
    recordAdvancePayment = async (req, res) => {
        const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
        const userId = req.user?.userId || '00000000-0000-0000-0000-000000000000';
        if (!req.body.facility_id)
            req.body.facility_id = req.user?.facilityId;
        const result = await this.service.recordAdvancePayment(req.body, organizationId, userId);
        (0, response_1.sendSuccess)(res, result, 'Advance payment recorded successfully', 201);
    };
    getEncounterPayments = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        const encounterId = req.params.encounterId;
        const payments = await this.service.getEncounterPayments(encounterId, facilityId);
        (0, response_1.sendSuccess)(res, payments, 'Payments retrieved successfully');
    };
    postBedCharges = async (req, res) => {
        const facilityId = req.user?.facilityId || req.body.facility_id || '00000000-0000-0000-0000-000000000000';
        const userId = req.user?.userId || '00000000-0000-0000-0000-000000000000';
        const encounterId = req.body.encounter_id;
        const charges = await this.service.postBedCharges(encounterId, facilityId, userId);
        (0, response_1.sendSuccess)(res, charges, 'Bed charges calculated and posted successfully', 201);
    };
    getReportsSummary = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        const dateFrom = req.query.dateFrom;
        const dateTo = req.query.dateTo;
        const summary = await this.service.getReportsSummary(facilityId, dateFrom, dateTo);
        (0, response_1.sendSuccess)(res, summary, 'Billing reports summary retrieved successfully');
    };
    getPendingDuesReport = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '20', 10);
        const filters = {
            search: req.query.search,
            invoiceType: req.query.invoiceType,
            status: req.query.status,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            encounterStatus: req.query.encounterStatus,
        };
        const report = await this.service.getPendingDuesReport(facilityId, filters, page, limit);
        (0, response_1.sendSuccess)(res, report, 'Pending dues report retrieved successfully');
    };
    getCollectionsReport = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        const filters = {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            paymentMethod: req.query.paymentMethod,
        };
        const report = await this.service.getCollectionsReport(facilityId, filters);
        (0, response_1.sendSuccess)(res, report, 'Collections report retrieved successfully');
    };
    getPatientDues = async (req, res) => {
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        const patientId = req.params.patientId;
        const dues = await this.service.getPatientDues(patientId, facilityId);
        (0, response_1.sendSuccess)(res, dues, 'Patient dues retrieved successfully');
    };
}
exports.BillingController = BillingController;
