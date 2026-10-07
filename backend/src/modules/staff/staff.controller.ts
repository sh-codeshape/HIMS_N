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
      const facilityId = (req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000') as string;
      const doctors = await this.service.getDoctors(facilityId);
      sendSuccess(res, doctors, 'Doctors retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  getStaffList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user?.organizationId as string;
      const staff = await this.service.getStaffList(organizationId);
      sendSuccess(res, staff, 'Staff retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  getStaffById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user?.organizationId as string;
      const staffId = req.params.staffId as string;
      const staff = await this.service.getStaffById(organizationId, staffId);
      if (!staff) {
        res.status(404).json({ success: false, error: { message: 'Staff not found' } });
        return;
      }
      sendSuccess(res, staff, 'Staff retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  createStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user?.organizationId as string;
      const data = req.body;
      const staff = await this.service.createStaff(organizationId, data);
      sendSuccess(res, staff, 'Staff created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user?.organizationId as string;
      const staffId = req.params.staffId as string;
      const data = req.body;
      const staff = await this.service.updateStaff(organizationId, staffId, data);
      sendSuccess(res, staff, 'Staff updated successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}
