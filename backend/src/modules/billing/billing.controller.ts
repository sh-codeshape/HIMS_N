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
    if (!req.body.facility_id) {
      req.body.facility_id = req.user?.facilityId;
    }
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
    const userId = req.user?.userId || '00000000-0000-0000-0000-000000000000';
    
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
    const userId = req.user?.userId || '00000000-0000-0000-0000-000000000000';
    
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

  postBedCharges = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || req.body.facility_id || '00000000-0000-0000-0000-000000000000';
    const userId = req.user?.userId || '00000000-0000-0000-0000-000000000000';
    const encounterId = req.body.encounter_id;
    const charges = await this.service.postBedCharges(encounterId, facilityId, userId);
    sendSuccess(res, charges, 'Bed charges calculated and posted successfully', 201);
  };

  getReportsSummary = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    const summary = await this.service.getReportsSummary(facilityId, dateFrom, dateTo);
    sendSuccess(res, summary, 'Billing reports summary retrieved successfully');
  };

  getPendingDuesReport = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const filters = {
      search: req.query.search as string,
      invoiceType: req.query.invoiceType as string,
      status: req.query.status as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      encounterStatus: req.query.encounterStatus as string,
    };

    const report = await this.service.getPendingDuesReport(facilityId, filters, page, limit);
    sendSuccess(res, report, 'Pending dues report retrieved successfully');
  };

  getCollectionsReport = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const filters = {
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      paymentMethod: req.query.paymentMethod as string,
    };

    const report = await this.service.getCollectionsReport(facilityId, filters);
    sendSuccess(res, report, 'Collections report retrieved successfully');
  };

  getPatientDues = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const patientId = req.params.patientId as string;

    const dues = await this.service.getPatientDues(patientId, facilityId);
    sendSuccess(res, dues, 'Patient dues retrieved successfully');
  };
}
