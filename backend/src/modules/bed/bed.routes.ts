import { Router } from 'express';
import { BedController } from './bed.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { moduleGuard } from '../../middleware/moduleGuard';
import { getBedSchema, getBedByIdSchema, listBedsSchema, createBedSchema, updateBedSchema, deleteBedSchema, deleteWardSchema, deleteRoomSchema, updateBedStatusSchema, transferBedSchema, createWardSchema, createRoomSchema } from './bed.schema';

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
router.post('/wards', authorize(['bed.manage']), validate(createWardSchema), controller.createWard);
router.post('/rooms', authorize(['bed.manage']), validate(createRoomSchema), controller.createRoom);
router.post('/', authorize(['bed.manage']), validate(createBedSchema), controller.createBed);
router.put('/:id', authorize(['bed.manage']), validate(updateBedSchema), controller.updateBed);
router.delete('/wards/:id', authorize(['bed.manage']), validate(deleteWardSchema), controller.deleteWard);
router.delete('/rooms/:id', authorize(['bed.manage']), validate(deleteRoomSchema), controller.deleteRoom);
router.delete('/:id', authorize(['bed.manage']), validate(deleteBedSchema), controller.deleteBed);
router.patch('/:id/status', validate(updateBedStatusSchema), controller.updateBedStatus);
router.post('/transfer', authorize(['bed.manage']), validate(transferBedSchema), controller.transferBed);

export const bedRoutes = router;
