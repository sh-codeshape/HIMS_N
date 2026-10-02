import { Router } from 'express';
import { BillingController } from './billing.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { createInvoiceSchema } from './billing.schema';

const router = Router();
const controller = new BillingController();

router.use(authenticate); // Require authentication for all billing routes

router.post('/', validate(createInvoiceSchema), controller.createInvoice);
router.get('/', controller.listInvoices);
router.get('/:id', controller.getInvoice);

export const billingRoutes = router;
