import { Request, Response } from 'express';
import { IpdService } from './ipd.service';
import { sendSuccess } from '../../shared/utils/response';

export class IpdController {
  private service: IpdService;

  constructor() {
    this.service = new IpdService();
  }

  admitPatient = async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId;
    
    // Defaulting facility_id from token if not in body
    if (!req.body.facility_id) {
        req.body.facility_id = req.user!.facilityId;
    }

    const result = await this.service.admitPatient(req.body, organizationId);
    
    sendSuccess(res, result, 'Patient admitted successfully', 201);
  };

  getAdmissions = async (req: Request, res: Response) => {
    const facilityId = req.user!.facilityId;

    const queue = await this.service.getAdmissions(facilityId);
    
    sendSuccess(res, queue, 'Admissions retrieved successfully');
  };
}
