import { PharmacyRepository } from './pharmacy.repository';

export class PharmacyService {
  private repository: PharmacyRepository;

  constructor() {
    this.repository = new PharmacyRepository();
  }

  async getMedicines(facilityId: string, organizationId: string) {
    return this.repository.getMedicines(facilityId, organizationId);
  }

  async dispenseMedicine(
    facilityId: string,
    organizationId: string,
    itemId: string,
    quantity: number,
    patientId?: string,
    encounterId?: string
  ) {
    return this.repository.dispenseMedicine(facilityId, organizationId, itemId, quantity, patientId, encounterId);
  }

  async getExpiringMedicines(facilityId: string, organizationId: string, daysAhead?: number) {
    return this.repository.getExpiringMedicines(facilityId, organizationId, daysAhead);
  }
}
