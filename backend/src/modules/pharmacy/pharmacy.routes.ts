import { Router } from 'express';
import { PharmacyController } from './pharmacy.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { dispenseMedicineSchema } from './pharmacy.schema';

const router = Router();
const controller = new PharmacyController();

router.use(authenticate);

router.get('/medicines', controller.getMedicines);
router.get('/expiring', controller.getExpiringMedicines);
router.post('/dispense', validate(dispenseMedicineSchema), controller.dispenseMedicine);

export const pharmacyRoutes = router;
