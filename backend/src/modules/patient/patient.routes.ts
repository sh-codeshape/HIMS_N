import { Router } from 'express';
import { patientController } from './patient.controller';
import { validate } from '../../middleware/validate';
import { createPatientSchema, searchPatientSchema, getPatientSchema } from './patient.schema';
// import { authenticate } from '../../middleware/authenticate';

const router = Router();

// Apply authenticate middleware to all patient routes when ready
// router.use(authenticate);

router.post('/', validate(createPatientSchema), patientController.createPatient);
router.get('/', validate(searchPatientSchema), patientController.searchPatients);
router.get('/:id', validate(getPatientSchema), patientController.getPatient);

export default router;
