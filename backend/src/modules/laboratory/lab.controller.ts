import { Request, Response } from 'express';
import { LabService } from './lab.service';
import { sendSuccess } from '../../shared/utils/response';

export class LabController {
  private service: LabService;

  constructor() {
    this.service = new LabService();
  }

  getLabTests = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string);
    const filters = {
      search: req.query.search as string,
      status: req.query.status as string,
      source: req.query.source as string,
      date: req.query.date as string
    };
    const tests = await this.service.getLabTests(facilityId, filters);
    sendSuccess(res, tests, 'Lab tests retrieved successfully');
  };

  getTestDefinitions = async (req: Request, res: Response) => {
    const organizationId = (req.user?.organizationId as string) || (req.query.organizationId as string);
    const includeInactive = req.query.includeInactive === 'true';
    const definitions = await this.service.getTestDefinitions(organizationId, includeInactive);
    sendSuccess(res, definitions, 'Test definitions retrieved successfully');
  };

  getOrderDetails = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string);
    const id = req.params.id as string;
    const order = await this.service.getOrderDetails(id, facilityId);
    sendSuccess(res, order, 'Order details retrieved successfully');
  };

  getOrderItemParameters = async (req: Request, res: Response) => {
    const id = req.params.id as string; // order_item_id
    const result = await this.service.getOrderItemParameters(id);
    sendSuccess(res, result, 'Test parameters retrieved successfully');
  };

  createLabOrder = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId || (req.body.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    const organizationId = req.user?.organizationId || (req.body.organizationId as string) || '00000000-0000-0000-0000-000000000000';
    const userId = req.user?.userId;

    const result = await this.service.createLabOrder(facilityId, organizationId, req.body, userId);
    sendSuccess(res, result, 'Lab order created successfully', 201);
  };

  updateLabResult = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { result, notes, status } = req.body;
    
    const updated = await this.service.updateLabResult(id, result || notes, status);
    sendSuccess(res, updated, 'Lab result updated successfully');
  };

  submitBulkResults = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { results, status } = req.body;
    const userId = req.user?.userId;

    const updated = await this.service.submitBulkResults(id, results, status, userId);
    sendSuccess(res, updated, 'Lab results submitted successfully');
  };

  verifyResult = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const verifiedBy = req.body?.verifiedBy || req.user?.userId;
    const comments = req.body?.comments;

    const updated = await this.service.verifyResult(id, verifiedBy, comments);
    sendSuccess(res, updated, 'Lab results verified successfully');
  };

  updateSpecimenStatus = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body;

    const updated = await this.service.updateSpecimenStatus(id, status, rejectionReason);
    sendSuccess(res, updated, 'Specimen status updated successfully');
  };

  outsourceSpecimen = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await this.service.outsourceSpecimen(id, req.body);
    sendSuccess(res, result, 'Specimen marked as outsourced successfully');
  };

  outsourceReturnSpecimen = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await this.service.outsourceReturnSpecimen(id, req.body);
    sendSuccess(res, result, 'Specimen returned from outsource lab successfully');
  };

  getDashboardStats = async (req: Request, res: Response) => {
    const facilityId = (req.user?.facilityId as string) || (req.query.facilityId as string);
    const stats = await this.service.getDashboardStats(facilityId);
    sendSuccess(res, stats, 'Dashboard stats retrieved successfully');
  };

  listOutsourceLabs = async (req: Request, res: Response) => {
    const organizationId = (req.user?.organizationId as string) || (req.query.organizationId as string);
    const labs = await this.service.listOutsourceLabs(organizationId);
    sendSuccess(res, labs, 'Outsource labs retrieved successfully');
  };

  createOutsourceLab = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
    const userId = req.user?.userId;

    const lab = await this.service.createOutsourceLab(organizationId, req.body, userId);
    sendSuccess(res, lab, 'Outsource lab created successfully', 201);
  };

  updateOutsourceLab = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.userId;

    const lab = await this.service.updateOutsourceLab(id, req.body, userId);
    sendSuccess(res, lab, 'Outsource lab updated successfully');
  };

  deleteOutsourceLab = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const lab = await this.service.deleteOutsourceLab(id);
    sendSuccess(res, lab, 'Outsource lab deactivated successfully');
  };

  createTestDefinition = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId || '00000000-0000-0000-0000-000000000000';
    const userId = req.user?.userId;
    const test = await this.service.createTestDefinition(organizationId, req.body, userId);
    sendSuccess(res, test, 'In-house lab test created successfully', 201);
  };

  updateTestDefinition = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.userId;
    const test = await this.service.updateTestDefinition(id, req.body, userId);
    sendSuccess(res, test, 'In-house lab test updated successfully');
  };

  deleteTestDefinition = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const test = await this.service.deleteTestDefinition(id);
    sendSuccess(res, test, 'In-house lab test removed successfully');
  };
}
