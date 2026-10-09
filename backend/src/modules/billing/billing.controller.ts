import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { sendSuccess } from '../../shared/utils/response';

export class BillingController {
  private service: BillingService;

  constructor() {
    this.service = new BillingService();
  }

  createInvoice = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
    const result = await this.service.createInvoice(req.body, organizationId);
    sendSuccess(res, result, 'Invoice created successfully', 201);
  };

  listInvoices = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const invoices = await this.service.listInvoices(facilityId);
    sendSuccess(res, invoices, 'Invoices retrieved successfully');
  };

  getInvoice = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const id = req.params.id as string;
    const invoice = await this.service.getInvoice(id, facilityId);
    sendSuccess(res, invoice, 'Invoice retrieved successfully');
  };

  addCharge = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    
    if (!req.body.facility_id) req.body.facility_id = req.user?.facilityId;
    
    const result = await this.service.addCharge(req.body, organizationId, userId);
    sendSuccess(res, result, 'Charge added successfully', 201);
  };

  removeCharge = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.body.facility_id as string) || '00000000-0000-0000-0000-000000000000';
    const id = req.params.id as string;
    const result = await this.service.removeCharge(id, facilityId);
    sendSuccess(res, result, 'Charge removed successfully');
  };

  getRunningBill = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const encounterId = req.params.encounterId as string;
    const charges = await this.service.getRunningBill(encounterId, facilityId);
    sendSuccess(res, charges, 'Running bill retrieved successfully');
  };

  recordAdvancePayment = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    
    if (!req.body.facility_id) req.body.facility_id = req.user?.facilityId;
    
    const result = await this.service.recordAdvancePayment(req.body, organizationId, userId);
    sendSuccess(res, result, 'Advance payment recorded successfully', 201);
  };

  getEncounterPayments = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const encounterId = req.params.encounterId as string;
    const payments = await this.service.getEncounterPayments(encounterId, facilityId);
    sendSuccess(res, payments, 'Payments retrieved successfully');
  };
}
