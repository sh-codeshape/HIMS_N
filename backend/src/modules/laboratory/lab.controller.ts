import { Request, Response } from 'express';
import { LabService } from './lab.service';
import { sendSuccess } from '../../shared/utils/response';

export class LabController {
  private service: LabService;

  constructor() {
    this.service = new LabService();
  }

  getLabTests = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId ?? (req.query.facilityId as string);
    const tests = await this.service.getLabTests(facilityId);
    sendSuccess(res, tests, 'Lab tests retrieved successfully');
  };

  getTestDefinitions = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId ?? (req.query.organizationId as string);
    const definitions = await this.service.getTestDefinitions(organizationId);
    sendSuccess(res, definitions, 'Test definitions retrieved successfully');
  };

  createLabOrder = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId ?? (req.body.facilityId as string);
    const organizationId = req.user?.organizationId ?? (req.body.organizationId as string);
    const { patientId, testDefinitionIds, orderedBy } = req.body;
    
    const result = await this.service.createLabOrder(facilityId, organizationId, patientId, testDefinitionIds, orderedBy);
    sendSuccess(res, result, 'Lab order created successfully', 201);
  };

  updateLabResult = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { result, status } = req.body;
    
    const updated = await this.service.updateLabResult(id, result, status);
    sendSuccess(res, updated, 'Lab result updated successfully');
  };
}
