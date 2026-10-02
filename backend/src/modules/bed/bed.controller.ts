import { Request, Response, NextFunction } from 'express';
import { BedService } from './bed.service';
import { sendSuccess } from '../../shared/utils/response';

export class BedController {
  private service: BedService;

  constructor() {
    this.service = new BedService();
  }

  getBeds = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = ((req as any).user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000') as string;
      const beds = await this.service.getBeds(facilityId);
      sendSuccess(res, beds, 'Beds retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  updateBedStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = ((req as any).user?.facilityId || '00000000-0000-0000-0000-000000000000') as string;
      const bedId = req.params.id as string;
      const { status } = req.body;
      const bed = await this.service.updateBedStatus(bedId, status, facilityId);
      sendSuccess(res, bed, 'Bed status updated successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}
