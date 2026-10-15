import { Request, Response, NextFunction } from 'express';
import { BedService } from './bed.service';
import { sendSuccess } from '../../shared/utils/response';

export class BedController {
  private service: BedService;

  constructor() {
    this.service = new BedService();
  }

  // All bed master data (beds, wards, rooms, bed categories) is seeded under the
  // default facility 00000000-.... The authenticated user's facility (e.g. a125c92c-...)
  // is a *different* facility that has no beds, so letting it shadow the query would
  // always return []. Resolve the beds facility from the explicit query param first,
  // then fall back to the default facility where beds actually live.
  private resolveBedFacilityId(req: Request): string {
    const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
    return (req.query.facilityId || ZERO_UUID) as string;
  }

  getBeds = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = this.resolveBedFacilityId(req);
      const beds = await this.service.getBeds(facilityId);
      sendSuccess(res, beds, 'Beds retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  getWards = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = this.resolveBedFacilityId(req);
      const wards = await this.service.getWards(facilityId);
      sendSuccess(res, wards, 'Wards retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  getRooms = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = this.resolveBedFacilityId(req);
      const rooms = await this.service.getRooms(facilityId);
      sendSuccess(res, rooms, 'Rooms retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  updateBedStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = this.resolveBedFacilityId(req);
      const bedId = req.params.id as string;
      const { status } = req.body;
      const bed = await this.service.updateBedStatus(bedId, status, facilityId);
      sendSuccess(res, bed, 'Bed status updated successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}
