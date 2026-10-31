import { Request, Response } from 'express';
import { IpdService } from './ipd.service';
import { sendSuccess } from '../../shared/utils/response';

export class IpdController {
  private service: IpdService;

  constructor() {
    this.service = new IpdService();
  }

  admitPatient = async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId;
    const zeroUuid = '00000000-0000-0000-000000000000';

    // Use facility from JWT token; never allow nil UUID to reach the service layer.
    // If the frontend sends nil UUID or no facility_id, fall back to the user's facility.
    const bodyFacilityId = req.body.facility_id;
    const tokenFacilityId = req.user?.facilityId;
    req.body.facility_id = tokenFacilityId || bodyFacilityId || undefined;

    // Reject nil UUID explicitly
    if (req.body.facility_id === zeroUuid) {
      req.body.facility_id = tokenFacilityId || undefined;
    }

    const result = await this.service.admitPatient(req.body, organizationId);
    
    sendSuccess(res, result, 'Patient admitted successfully', 201);
  };

  getAdmissions = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId ?? (req.query.facilityId as string) ?? '';
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const queue = await this.service.getAdmissions(facilityId, search, status);
    
    sendSuccess(res, queue, 'Admissions retrieved successfully');
  };

  getAdmissionById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const admission = await this.service.getAdmissionById(String(id));
    sendSuccess(res, admission, 'Admission retrieved successfully');
  };

  dischargePatient = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId ?? (req.body.facility_id as string) ?? '';
    const { id } = req.params;
    const { discharge_type, discharge_condition, auto_wallet_credit } = req.body;

    const result = await this.service.dischargePatient(facilityId, String(id), String(discharge_type), discharge_condition, auto_wallet_credit);

    sendSuccess(res, result, 'Patient discharged successfully');
  };

  getDischargeSummary = async (req: Request, res: Response) => {
    const { id } = req.params;
    const summary = await this.service.getDischargeSummary(String(id));
    sendSuccess(res, summary, 'Discharge summary retrieved successfully');
  };

  saveDischargeSummary = async (req: Request, res: Response) => {
    const { id } = req.params;
    const summary = await this.service.saveDischargeSummary(String(id), req.body);
    sendSuccess(res, summary, 'Discharge summary saved successfully');
  };

  getIpdReportStats = async (req: Request, res: Response) => {
    const facilityId = req.user?.facilityId ?? (req.query.facilityId as string) ?? '';
    const stats = await this.service.getIpdReportStats(facilityId);
    sendSuccess(res, stats, 'IPD report statistics retrieved successfully');
  };

  getPendingDues = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.getPendingDues(String(id));
    sendSuccess(res, result, 'Pending dues retrieved successfully');
  };
}
