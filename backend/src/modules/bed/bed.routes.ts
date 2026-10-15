import { Router } from 'express';
import { BedController } from './bed.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { getBedSchema, updateBedStatusSchema } from './bed.schema';

const router = Router();
const controller = new BedController();

router.use(authenticate);

router.get('/', validate(getBedSchema), controller.getBeds);
router.get('/wards', controller.getWards);
router.get('/rooms', controller.getRooms);
router.patch('/:id/status', validate(updateBedStatusSchema), controller.updateBedStatus);

export const bedRoutes = router;
