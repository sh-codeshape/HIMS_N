import { Request, Response } from 'express';
import { OpdService } from './opd.service';
import { ValidationError } from '../../shared/errors/AppError';
import { sendSuccess, sendPaginated } from '../../shared/utils/response';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

export class OpdController {
  private service: OpdService;

  constructor() {
    this.service = new OpdService();
  }

  issueToken = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId || (req.body?.organization_id as string) || (req.body?.organizationId as string);
    const facilityId = req.user?.facilityId || (req.body?.facility_id as string) || (req.body?.facilityId as string);

    if (!organizationId || organizationId === ZERO_UUID) {
      throw new ValidationError('Authenticated organization is required for OPD token issuance.');
    }
    if (!facilityId || facilityId === ZERO_UUID) {
      throw new ValidationError('A valid facility is required for OPD token issuance.');
    }

    const result = await this.service.issueToken({ ...req.body, facility_id: facilityId, organization_id: organizationId }, organizationId);

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
    const sortBy = (req.query.sortBy as string) || 'started_at';
    const sortOrder = (req.query.sortOrder as string) || 'DESC';

    const result = await this.service.getReports(
      facilityId,
      from,
      to,
      practitionerId,
      departmentId,
      page,
      limit,
      sortBy,
      sortOrder as 'ASC' | 'DESC'
    );

    sendPaginated(res, result.rows, { page: result.page, limit: result.limit, total: result.total });
  };

  updateStatus = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId || (req.body.facility_id as string) || '00000000-0000-0000-0000-000000000000';
    const { id } = req.params;
    const { status } = req.body;

    const result = await this.service.updateStatus(String(id), String(status), facilityId);

    sendSuccess(res, result, 'OPD status updated successfully');
  };
}
