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
      data.attendant_phone
    );
  }

  async getAdmissions(facilityId: string, search?: string) {
    return this.repository.getAdmissions(facilityId, search);
  }

  async dischargePatient(facilityId: string, admissionId: string, dischargeType: string, dischargeCondition?: string) {
    const admission = await this.repository.dischargePatient(facilityId, admissionId, dischargeType, dischargeCondition);
    if (!admission) {
      throw new NotFoundError('Admission not found');
    }
    return admission;
  }
}
