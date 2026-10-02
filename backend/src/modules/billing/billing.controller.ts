import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { sendSuccess } from '../../shared/utils/response';

export class BillingController {
  private service: BillingService;

  constructor() {
    this.service = new BillingService();
  }

  createInvoice = async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId;
    const result = await this.service.createInvoice(req.body, organizationId);
    sendSuccess(res, result, 'Invoice created successfully', 201);
  };

  listInvoices = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) ?? (req.query.facilityId as string) ?? '';
    const invoices = await this.service.listInvoices(facilityId);
    sendSuccess(res, invoices, 'Invoices retrieved successfully');
  };

  getInvoice = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) ?? (req.query.facilityId as string) ?? '';
    const id = req.params.id as string;
    const invoice = await this.service.getInvoice(id, facilityId);
    sendSuccess(res, invoice, 'Invoice retrieved successfully');
  };
}
