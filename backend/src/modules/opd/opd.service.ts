import { OpdRepository } from './opd.repository';
import { CreateOpdEncounterRequest } from './opd.schema';
import { NotFoundError } from '../../shared/errors/AppError';

export type ReportQueryInput = {
  from?: string;
  to?: string;
  practitionerId?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
};

export function normalizeReportQuery(input: ReportQueryInput = {}) {
  const from = input.from ? input.from.trim() : '';
  const to = input.to ? input.to.trim() : '';

  const normalizedFrom = from && to && from > to ? to : from;
  const normalizedTo = from && to && from > to ? from : to;

  const rawPage = Number.isFinite(input.page) ? Number(input.page) : 1;
  const rawLimit = Number.isFinite(input.limit) ? Number(input.limit) : 50;
  const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);
  const limit = Math.max(1, Math.min(rawLimit, 500));

  const sortBy = input.sortBy && input.sortBy.trim() ? input.sortBy.trim() : 'started_at';
  const sortOrder = input.sortOrder && /^(ASC|DESC)$/i.test(String(input.sortOrder))
    ? String(input.sortOrder).toUpperCase() as 'ASC' | 'DESC'
    : 'DESC';

  return {
    from: normalizedFrom,
    to: normalizedTo,
    practitionerId: input.practitionerId,
    departmentId: input.departmentId,
    page,
    limit,
    sortBy,
    sortOrder,
  };
}

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

  async getReports(
    facilityId: string,
    from?: string,
    to?: string,
    practitionerId?: string,
    departmentId?: string,
    page: number = 1,
    limit: number = 50,
    sortBy: string = 'started_at',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ) {
    const normalized = normalizeReportQuery({
      from,
      to,
      practitionerId,
      departmentId,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return this.repository.getReports(
      facilityId,
      normalized.from,
      normalized.to,
      normalized.practitionerId,
      normalized.departmentId,
      normalized.page,
      normalized.limit,
      normalized.sortBy,
      normalized.sortOrder
    );
  }

  async updateStatus(encounterId: string, status: string, facilityId: string) {
    const updated = await this.repository.updateStatus(encounterId, status, facilityId);
    if (!updated) {
      throw new NotFoundError('Encounter not found or does not belong to this facility');
    }
    return updated;
  }
}
