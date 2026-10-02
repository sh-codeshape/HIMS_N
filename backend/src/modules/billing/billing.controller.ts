import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { sendSuccess } from '../../shared/utils/response';

export class BillingController {
  private service: BillingService;

  constructor() {
    this.service = new BillingService();
  }

  generateInvoice = async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId;
    const createdById = req.user!.userId;
    
    if (!req.body.facility_id) {
        req.body.facility_id = req.user!.facilityId;
    }

    const result = await this.service.generateInvoice(req.body, organizationId, createdById);
    
    sendSuccess(res, result, 'Invoice generated successfully', 201);
  };

  getInvoices = async (req: Request, res: Response) => {
    const facilityId = req.user!.facilityId;

    const invoices = await this.service.getInvoices(facilityId);
    
    sendSuccess(res, invoices, 'Invoices retrieved successfully');
  };
}
