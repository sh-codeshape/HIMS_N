import { StaffRepository } from './staff.repository';

export class StaffService {
  private repository: StaffRepository;

  constructor() {
    this.repository = new StaffRepository();
  }

  async getDoctors(facilityId: string) {
    return await this.repository.getDoctors(facilityId);
  }

  async getStaffList(organizationId: string) {
    return await this.repository.getStaffList(organizationId);
  }

  async getStaffById(organizationId: string, staffId: string) {
    return await this.repository.getStaffById(organizationId, staffId);
  }

  async createStaff(organizationId: string, data: any) {
    return await this.repository.createStaff(organizationId, data);
  }

  async updateStaff(organizationId: string, staffId: string, data: any) {
    return await this.repository.updateStaff(organizationId, staffId, data);
  }
}
