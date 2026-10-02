import { LabRepository } from './lab.repository';

export class LabService {
  private repository: LabRepository;

  constructor() {
    this.repository = new LabRepository();
  }

  async getLabTests(facilityId: string) {
    return this.repository.getLabTests(facilityId);
  }

  async getTestDefinitions(organizationId: string) {
    return this.repository.getTestDefinitions(organizationId);
  }

  async createLabOrder(
    facilityId: string, 
    organizationId: string, 
    patientId: string, 
    testDefinitionIds: string[], 
    orderedBy?: string | null
  ) {
    return this.repository.createLabOrder(facilityId, organizationId, patientId, testDefinitionIds, orderedBy);
  }

  async updateLabResult(orderItemId: string, result: string, status: string) {
    return this.repository.updateLabResult(orderItemId, result, status);
  }
}
