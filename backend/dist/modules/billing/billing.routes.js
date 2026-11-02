"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingRoutes = void 0;
const express_1 = require("express");
const billing_controller_1 = require("./billing.controller");
const validate_1 = require("../../middleware/validate");
const authenticate_1 = require("../../middleware/authenticate");
const moduleGuard_1 = require("../../middleware/moduleGuard");
const billing_schema_1 = require("./billing.schema");
const router = (0, express_1.Router)();
const controller = new billing_controller_1.BillingController();
router.use(authenticate_1.authenticate); // Require authentication for all billing routes
router.use((0, moduleGuard_1.moduleGuard)('billing'));
// Master Data: Discount reasons and referral sources (MUST be declared before /:id)
router.get('/discount-reasons', controller.getDiscountReasons);
router.get('/referrals', controller.getReferrals);
// Report routes (MUST be declared before /:id)
router.get('/reports/summary', controller.getReportsSummary);
router.get('/reports/pending-dues', controller.getPendingDuesReport);
router.get('/reports/collections', controller.getCollectionsReport);
router.get('/patient/:patientId/dues', controller.getPatientDues);
// IPD Running Bill & Settlement routes
router.post('/charges', controller.addCharge);
router.post('/charges/bed', (0, validate_1.validate)(billing_schema_1.postBedChargesSchema), controller.postBedCharges);
router.post('/bed-charges', (0, validate_1.validate)(billing_schema_1.postBedChargesSchema), controller.postBedCharges);
router.post('/charges/apply-concession', controller.applyConcessionBatch);
router.patch('/charges/:id/discount', controller.updateChargeDiscount);
router.delete('/charges/:id', controller.removeCharge);
router.get('/running-bill/:encounterId', controller.getRunningBill);
router.post('/payments/advance', controller.recordAdvancePayment);
router.get('/payments/encounter/:encounterId', controller.getEncounterPayments);
router.post('/settle', controller.settleBill);
router.post('/refund', controller.processRefund);
router.post('/wallet/credit', controller.creditWallet);
router.post('/wallet/settle', controller.settleWithWallet);
// Invoices CRUD
router.post('/', (0, validate_1.validate)(billing_schema_1.createInvoiceSchema), controller.createInvoice);
router.get('/', controller.listInvoices);
router.get('/:id', controller.getInvoice);
exports.billingRoutes = router;
