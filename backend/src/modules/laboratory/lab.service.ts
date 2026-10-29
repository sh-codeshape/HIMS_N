import { LabRepository } from './lab.repository';

export class LabService {
  private repository: LabRepository;

  constructor() {
    this.repository = new LabRepository();
  }

  async getLabTests(facilityId?: string, filters?: { search?: string; status?: string; source?: string; date?: string }) {
    return this.repository.getLabTests(facilityId, filters);
  }

  async getTestDefinitions(organizationId?: string, includeInactive: boolean = false) {
    return this.repository.getTestDefinitions(organizationId, includeInactive);
  }

  async createTestDefinition(organizationId: string, data: any, userId?: string) {
    return this.repository.createTestDefinition(organizationId, data, userId);
  }

  async updateTestDefinition(serviceId: string, data: any, userId?: string) {
    return this.repository.updateTestDefinition(serviceId, data, userId);
  }

  async deleteTestDefinition(serviceId: string) {
    return this.repository.deleteTestDefinition(serviceId);
  }

  async getOrderDetails(orderId: string, facilityId?: string) {
    return this.repository.getOrderDetails(orderId, facilityId);
  }

  async getOrderItemParameters(orderItemId: string) {
    return this.repository.getOrderItemParameters(orderItemId);
  }

  async createLabOrder(
    facilityId: string, 
    organizationId: string, 
    payload: {
      patientId: string;
      encounterId?: string | null;
      testDefinitionIds: string[];
      orderedBy?: string | null;
      priority?: string;
      clinicalInfo?: string | null;
      processingSource?: string;
      outsourceLabId?: string | null;
      specimenType?: string | null;
      collectedBy?: string | null;
      fasting?: string | null;
      barcode?: string | null;
    },
    userId?: string
  ) {
    return this.repository.createLabOrder({
      facilityId,
      organizationId,
      patientId: payload.patientId,
      encounterId: payload.encounterId,
      testDefinitionIds: payload.testDefinitionIds,
      orderedBy: payload.orderedBy,
      priority: payload.priority,
      clinicalInfo: payload.clinicalInfo,
      processingSource: payload.processingSource,
      outsourceLabId: payload.outsourceLabId,
      specimenType: payload.specimenType,
      collectedBy: payload.collectedBy,
      fasting: payload.fasting,
      barcode: payload.barcode,
      userId
    });
  }

  async updateLabResult(orderItemId: string, result: string, status?: string) {
    return this.repository.updateLabResult(orderItemId, result, status);
  }

  async submitBulkResults(
    orderItemId: string,
    results: Array<{
      parameterId?: string | null;
      parameterName?: string;
      valueNumeric?: number | null;
      valueText?: string | null;
      unit?: string | null;
      referenceLow?: number | null;
      referenceHigh?: number | null;
      flag?: string | null;
      comments?: string | null;
    }>,
    status: string = 'preliminary',
    userId?: string
  ) {
    return this.repository.submitBulkResults(orderItemId, results, status, userId);
  }

  async verifyResult(orderItemId: string, verifiedBy?: string, comments?: string) {
    return this.repository.verifyResult(orderItemId, verifiedBy, comments);
  }

  async updateSpecimenStatus(specimenId: string, status: string, rejectionReason?: string) {
    return this.repository.updateSpecimenStatus(specimenId, status, rejectionReason);
  }

  async outsourceSpecimen(
    specimenId: string,
    data: {
      outsourceLabId: string;
      outsourceRefNo?: string | null;
      expectedReturnAt?: string | null;
      outsourceCost?: number | null;
    }
  ) {
    return this.repository.outsourceSpecimen(specimenId, data);
  }

  async outsourceReturnSpecimen(specimenId: string, data: { returnedAt?: string | null; notes?: string | null }) {
    return this.repository.outsourceReturnSpecimen(specimenId, data);
  }

  async getDashboardStats(facilityId?: string) {
    return this.repository.getDashboardStats(facilityId);
  }

  async listOutsourceLabs(organizationId?: string) {
    return this.repository.listOutsourceLabs(organizationId);
  }

  async getOutsourceLabById(id: string) {
    return this.repository.getOutsourceLabById(id);
  }

  async createOutsourceLab(organizationId: string, data: any, userId?: string) {
    return this.repository.createOutsourceLab(organizationId, data, userId);
  }

  async updateOutsourceLab(id: string, data: any, userId?: string) {
    return this.repository.updateOutsourceLab(id, data, userId);
  }

  async deleteOutsourceLab(id: string) {
    return this.repository.deleteOutsourceLab(id);
  }
}
