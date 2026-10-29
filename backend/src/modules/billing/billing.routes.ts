import { Router } from 'express';
import { BillingController } from './billing.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { moduleGuard } from '../../middleware/moduleGuard';
import { createInvoiceSchema, postBedChargesSchema } from './billing.schema';

const router = Router();
const controller = new BillingController();

router.use(authenticate); // Require authentication for all billing routes
router.use(moduleGuard('billing'));

// Report routes (MUST be declared before /:id)
router.get('/reports/summary', controller.getReportsSummary);
router.get('/reports/pending-dues', controller.getPendingDuesReport);
router.get('/reports/collections', controller.getCollectionsReport);
router.get('/patient/:patientId/dues', controller.getPatientDues);

// IPD Running Bill routes
router.post('/charges', controller.addCharge);
router.post('/charges/bed', validate(postBedChargesSchema), controller.postBedCharges);
router.post('/bed-charges', validate(postBedChargesSchema), controller.postBedCharges);
router.delete('/charges/:id', controller.removeCharge);
router.get('/running-bill/:encounterId', controller.getRunningBill);
router.post('/payments/advance', controller.recordAdvancePayment);
router.get('/payments/encounter/:encounterId', controller.getEncounterPayments);

// Invoices CRUD
router.post('/', validate(createInvoiceSchema), controller.createInvoice);
router.get('/', controller.listInvoices);
router.get('/:id', controller.getInvoice);

export const billingRoutes = router;
