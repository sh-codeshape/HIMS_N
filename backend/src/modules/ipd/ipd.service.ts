import { IpdRepository } from './ipd.repository';
import { CreateIpdAdmissionRequest } from './ipd.schema';
import { NotFoundError } from '../../shared/errors/AppError';

export class IpdService {
  private repository: IpdRepository;

  constructor() {
    this.repository = new IpdRepository();
  }

  async admitPatient(data: CreateIpdAdmissionRequest, organizationId: string) {
    return this.repository.admitPatient(
      data.facility_id,
      organizationId,
      data.patient_id,
      data.bed_id,
      data.admitting_practitioner_id,
      data.department_id,
      data.referred_by,
      data.admission_type,
      data.reason_for_admission,
      data.attendant_name,
      data.attendant_relation,
      data.attendant_phone,
      data.tariff_plan_id,
      data.entitled_bed_category_id,
      data.payer_type,
      data.patient_coverage_id,
      data.advance_deposit
    );
  }

  async getAdmissions(facilityId: string, search?: string, status?: string) {
    return this.repository.getAdmissions(facilityId, search, status);
  }

  async dischargePatient(facilityId: string, admissionId: string, dischargeType: string, dischargeCondition?: string) {
    const admission = await this.repository.dischargePatient(facilityId, admissionId, dischargeType, dischargeCondition);
    if (!admission) {
      throw new NotFoundError('Admission not found');
    }
    return admission;
  }

  async getDischargeSummary(admissionId: string) {
    return this.repository.getDischargeSummary(admissionId);
  }

  async saveDischargeSummary(admissionId: string, data: any) {
    return this.repository.saveDischargeSummary(admissionId, data);
  }

  async getIpdReportStats(facilityId: string) {
    return this.repository.getIpdReportStats(facilityId);
  }

  async getPendingDues(encounterId: string) {
    return this.repository.getPendingDues(encounterId);
  }
}
