import { BillingRepository } from './billing.repository';
import { GenerateInvoiceRequest } from './billing.schema';

export class BillingService {
  private repository: BillingRepository;

  constructor() {
    this.repository = new BillingRepository();
  }

  async generateInvoice(data: GenerateInvoiceRequest, organizationId: string, createdById: string) {
    const result = await this.repository.createInvoice(
      data.facility_id,
      organizationId,
      data.patient_id,
      data.encounter_id,
      data.items,
      createdById
    );
    return result;
  }

  async getInvoices(facilityId: string) {
    return this.repository.getInvoices(facilityId);
  }
}
