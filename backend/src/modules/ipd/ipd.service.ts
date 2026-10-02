import { IpdRepository } from './ipd.repository';
import { CreateIpdAdmissionRequest } from './ipd.schema';
import { NotFoundError } from '../../shared/errors/AppError';

export class IpdService {
  private repository: IpdRepository;

  constructor() {
    this.repository = new IpdRepository();
  }

  async admitPatient(data: CreateIpdAdmissionRequest, organizationId: string) {
    const result = await this.repository.createAdmission(
      data.facility_id,
      organizationId,
      data.patient_id,
      data.bed_id,
      data.admitting_practitioner_id,
      data.department_id,
      data.reason_for_admission
    );
    return result;
  }

  async getAdmissions(facilityId: string) {
    return this.repository.getAdmissions(facilityId);
  }
}
