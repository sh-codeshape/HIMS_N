import { Router } from 'express';
import { PractitionerController } from './practitioner.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
const controller = new PractitionerController();

router.use(authenticate);

// Doctors/Practitioners
router.get('/', authorize(['staff.view', 'staff.manage']), controller.getPractitioners);

// Doctor Schedules
router.get('/:id/schedules', authorize(['staff.view', 'staff.manage']), controller.getSchedules);
router.post('/:id/schedules', authorize(['staff.manage']), controller.createSchedule);
router.put('/:id/schedules/:scheduleId', authorize(['staff.manage']), controller.updateSchedule);
router.delete('/:id/schedules/:scheduleId', authorize(['staff.manage']), controller.deleteSchedule);

export const practitionerRoutes = router;
