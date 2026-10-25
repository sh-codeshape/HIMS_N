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

  getBed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = this.resolveBedFacilityId(req);
      const bed = await this.service.getBed(req.params.id as string, facilityId);
      sendSuccess(res, bed, 'Bed retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  createBed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = this.resolveBedFacilityId(req);
      const userId = req.user?.userId;
      const bed = await this.service.createBed({
        organization_id: req.user?.organizationId,
        facility_id: facilityId,
        ward_id: req.body.ward_id ?? null,
        ward_code: req.body.ward_code,
        ward_name: req.body.ward_name,
        ward_type: req.body.ward_type,
        floor: req.body.floor,
        gender_policy: req.body.gender_policy,
        bed_category_id: req.body.bed_category_id ?? null,
        bed_charge_service_id: req.body.bed_charge_service_id ?? null,
        room_id: req.body.room_id ?? null,
        room_no: req.body.room_no,
        room_type: req.body.room_type,
        bed_no: req.body.bed_no,
        status: req.body.status,
        features: req.body.features,
        is_active: req.body.is_active,
        created_by: userId,
        updated_by: userId,
      });
      sendSuccess(res, bed, 'Bed created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateBed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = this.resolveBedFacilityId(req);
      const bed = await this.service.updateBed(
        req.params.id as string,
        req.body,
        facilityId,
        req.user?.userId
      );
      sendSuccess(res, bed, 'Bed updated successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  deleteBed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = this.resolveBedFacilityId(req);
      const bed = await this.service.deleteBed(req.params.id as string, facilityId);
      sendSuccess(res, bed, 'Bed deleted successfully', 200);
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

  transferBed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilityId = this.resolveBedFacilityId(req);
      const bed = await this.service.transferBed({
        fromBedId: req.body.fromBedId,
        toBedId: req.body.toBedId,
        facilityId,
        admission_id: req.body.admission_id,
      });
      sendSuccess(res, bed, 'Bed transfer processed successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}
