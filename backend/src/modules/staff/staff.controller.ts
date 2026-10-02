import { Request, Response, NextFunction } from 'express';
import { StaffService } from './staff.service';
import { sendSuccess } from '../../shared/utils/response';

export class StaffController {
  private service: StaffService;

  constructor() {
    this.service = new StaffService();
  }

  getDoctors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = ((req as any).user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000') as string;
      const doctors = await this.service.getDoctors(facilityId);
      sendSuccess(res, doctors, 'Doctors retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  getStaffList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = ((req as any).user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000') as string;
      const staff = await this.service.getStaffList(facilityId);
      sendSuccess(res, staff, 'Staff retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}
