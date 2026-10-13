import { Request, Response } from 'express';
import { OpdService } from './opd.service';
import { sendSuccess, sendPaginated } from '../../shared/utils/response';

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
    const facilityId = req.user?.facilityId || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const practitionerId = req.query.doctorId as string;
    const date = req.query.date as string;

    const queue = await this.service.getQueue(facilityId, practitionerId, date);
    
    sendSuccess(res, queue, 'OPD queue retrieved successfully');
  };

  getReports = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const from = req.query.from as string;
    const to = req.query.to as string;
    const practitionerId = req.query.doctorId as string;
    const departmentId = req.query.departmentId as string;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const result = await this.service.getReports(facilityId, from, to, practitionerId, departmentId, page, limit);

    sendPaginated(res, result.rows, { page, limit, total: result.total });
  };

  updateStatus = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId || (req.body.facility_id as string) || '00000000-0000-0000-0000-000000000000';
    const { id } = req.params;
    const { status } = req.body;

    const result = await this.service.updateStatus(String(id), String(status), facilityId);

    sendSuccess(res, result, 'OPD status updated successfully');
  };
}
