import { Router } from 'express';
import { StaffController } from './staff.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
const controller = new StaffController();

router.use(authenticate);

router.get('/doctors', controller.getDoctors);
router.get('/', controller.getStaffList);

export const staffRoutes = router;
