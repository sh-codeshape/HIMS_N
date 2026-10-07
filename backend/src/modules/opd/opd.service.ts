import { OpdRepository } from './opd.repository';
import { CreateOpdEncounterRequest } from './opd.schema';
import { NotFoundError } from '../../shared/errors/AppError';

export class OpdService {
  private repository: OpdRepository;

  constructor() {
    this.repository = new OpdRepository();
  }

  async issueToken(data: CreateOpdEncounterRequest, organizationId: string) {
    const nextToken = await this.repository.getNextToken(data.facility_id, data.primary_practitioner_id);

    const encounter = await this.repository.createEncounter(
      data.facility_id,
      organizationId,
      data.patient_id,
      data.primary_practitioner_id,
      data.department_id,
      data.referred_by,
      data.chief_complaint,
      nextToken,
      data.attendant_name,
      data.attendant_relation,
      data.attendant_phone
    );

    // If there were vitals, we would insert into observations here...

    return {
      ...encounter,
      token_number: nextToken
    };
  }

  async getQueue(facilityId: string, practitionerId?: string, date?: string) {
    return this.repository.getQueue(facilityId, practitionerId, date);
  }

  async updateStatus(encounterId: string, status: string, facilityId: string) {
    const updated = await this.repository.updateStatus(encounterId, status, facilityId);
    if (!updated) {
      throw new NotFoundError('Encounter not found or does not belong to this facility');
    }
    return updated;
  }
}
