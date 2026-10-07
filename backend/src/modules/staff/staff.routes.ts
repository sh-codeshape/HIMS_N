import { Router } from 'express';
import { StaffController } from './staff.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
const controller = new StaffController();

router.use(authenticate);

router.get('/doctors', controller.getDoctors);
router.get('/', authorize(['staff.view', 'staff.manage']), controller.getStaffList);
router.get('/:staffId', authorize(['staff.view', 'staff.manage']), controller.getStaffById);
router.post('/', authorize(['staff.manage']), controller.createStaff);
router.put('/:staffId', authorize(['staff.manage']), controller.updateStaff);

export const staffRoutes = router;
