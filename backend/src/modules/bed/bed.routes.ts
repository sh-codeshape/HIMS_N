import { Router } from 'express';
import { BedController } from './bed.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { moduleGuard } from '../../middleware/moduleGuard';
import { getBedSchema, getBedByIdSchema, listBedsSchema, createBedSchema, updateBedSchema, deleteBedSchema, updateBedStatusSchema, transferBedSchema } from './bed.schema';

const router = Router();
const controller = new BedController();

router.use(authenticate);
router.use(moduleGuard('ward'));

router.get('/', validate(getBedSchema), controller.getBeds);
router.get('/wards', controller.getWards);
router.get('/rooms', controller.getRooms);
router.get('/categories', controller.getBedCategories);
router.post('/sync-inventory', authorize(['bed.manage']), controller.syncAllBedsToInventory);
router.get('/:id', validate(getBedByIdSchema), controller.getBed);
router.post('/', authorize(['bed.manage']), validate(createBedSchema), controller.createBed);
router.put('/:id', authorize(['bed.manage']), validate(updateBedSchema), controller.updateBed);
router.delete('/:id', authorize(['bed.manage']), validate(deleteBedSchema), controller.deleteBed);
router.patch('/:id/status', validate(updateBedStatusSchema), controller.updateBedStatus);
router.post('/transfer', authorize(['bed.manage']), validate(transferBedSchema), controller.transferBed);

export const bedRoutes = router;
