import { Request, Response } from 'express';
import { OpdService } from './opd.service';
import { sendSuccess } from '../../shared/utils/response';

export class OpdController {
  private service: OpdService;

  constructor() {
    this.service = new OpdService();
  }

  issueToken = async (req: Request, res: Response) => {
    // Both facility_id and organization_id should come from the logged in user context
    // For now we'll take facility_id from the body, but organization_id from user
    const organizationId = req.user!.organizationId;
    
    const result = await this.service.issueToken(req.body, organizationId);
    
    sendSuccess(res, result, 'OPD token issued successfully', 201);
  };

  getQueue = async (req: Request, res: Response) => {
    const facilityId = req.user!.facilityId;
    const practitionerId = req.query.doctorId as string;
    const date = req.query.date as string;

    const queue = await this.service.getQueue(facilityId, practitionerId, date);
    
    sendSuccess(res, queue, 'OPD queue retrieved successfully');
  };

  updateStatus = async (req: Request, res: Response) => {
    const facilityId = req.user!.facilityId;
    const { id } = req.params;
    const { status } = req.body;

    const result = await this.service.updateStatus(id, status, facilityId);

    sendSuccess(res, result, 'OPD status updated successfully');
  };
}
