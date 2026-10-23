import { Router } from 'express';
import { IpdController } from './ipd.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { moduleGuard } from '../../middleware/moduleGuard';
import { createIpdAdmissionSchema, dischargePatientSchema } from './ipd.schema';

const router = Router();
const controller = new IpdController();

router.use(authenticate); // Require authentication for all IPD routes
router.use(moduleGuard('ipd'));

router.post('/admissions', validate(createIpdAdmissionSchema), controller.admitPatient);
router.get('/admissions', controller.getAdmissions);
router.post('/admissions/:id/discharge', validate(dischargePatientSchema), controller.dischargePatient);
router.get('/admissions/:id/discharge-summary', controller.getDischargeSummary);
router.post('/admissions/:id/discharge-summary', controller.saveDischargeSummary);
router.get('/reports/stats', controller.getIpdReportStats);
router.get('/admissions/:id/pending-dues', controller.getPendingDues);

export const ipdRoutes = router;
