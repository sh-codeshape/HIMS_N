import { Router } from 'express';
import { IpdController } from './ipd.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { createIpdAdmissionSchema } from './ipd.schema';

const router = Router();
const controller = new IpdController();

router.use(authenticate); // Require authentication for all IPD routes

router.post('/admissions', validate(createIpdAdmissionSchema), controller.admitPatient);
router.get('/admissions', controller.getAdmissions);

export const ipdRoutes = router;
