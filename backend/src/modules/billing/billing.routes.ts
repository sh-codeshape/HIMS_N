import { Router } from 'express';
import { BillingController } from './billing.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { generateInvoiceSchema } from './billing.schema';

const router = Router();
const controller = new BillingController();

router.use(authenticate); // Require authentication for all billing routes

router.post('/invoices', validate(generateInvoiceSchema), controller.generateInvoice);
router.get('/invoices', controller.getInvoices);

export const billingRoutes = router;
