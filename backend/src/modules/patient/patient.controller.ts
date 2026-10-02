import { Request, Response } from 'express';
import { patientService } from './patient.service';
import { sendPaginated, sendSuccess } from '../../shared/utils/response';

export class PatientController {
  async createPatient(req: Request, res: Response) {
    // In real app, organizationId comes from authenticated user token context
    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
    const patient = await patientService.createPatient(organizationId, req.body);
    sendSuccess(res, patient, 201);
  }

  async searchPatients(req: Request, res: Response) {
    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
    const result = await patientService.searchPatients(organizationId, req.query);
    sendPaginated(res, result.data, result.meta);
  }

  async getPatient(req: Request, res: Response) {
    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
    const patient = await patientService.getPatient(String(req.params.id), organizationId);
    sendSuccess(res, patient);
  }
}

export const patientController = new PatientController();
