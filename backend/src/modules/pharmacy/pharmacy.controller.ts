import { Request, Response } from 'express';
import { PharmacyService } from './pharmacy.service';
import { sendSuccess } from '../../shared/utils/response';

export class PharmacyController {
  private service: PharmacyService;

  constructor() {
    this.service = new PharmacyService();
  }

  getMedicines = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId ?? (req.query.facilityId as string);
    const organizationId = req.user?.organizationId ?? (req.query.organizationId as string);
    const medicines = await this.service.getMedicines(facilityId, organizationId);
    sendSuccess(res, medicines, 'Medicines retrieved successfully');
  };

  dispenseMedicine = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId ?? (req.body.facilityId as string);
    const organizationId = req.user?.organizationId ?? (req.body.organizationId as string);
    const { itemId, quantity, patientId, encounterId } = req.body;
    
    const result = await this.service.dispenseMedicine(facilityId, organizationId, itemId, quantity, patientId, encounterId);
    sendSuccess(res, result, 'Medicine dispensed successfully', 201);
  };

  getExpiringMedicines = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId ?? (req.query.facilityId as string);
    const organizationId = req.user?.organizationId ?? (req.query.organizationId as string);
    const daysAhead = req.query.days ? parseInt(req.query.days as string, 10) : 90;
    
    const expiring = await this.service.getExpiringMedicines(facilityId, organizationId, daysAhead);
    sendSuccess(res, expiring, 'Expiring medicines retrieved successfully');
  };
}
