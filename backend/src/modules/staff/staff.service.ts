import { StaffRepository } from './staff.repository';

export class StaffService {
  private repository: StaffRepository;

  constructor() {
    this.repository = new StaffRepository();
  }

  async getDoctors(facilityId: string) {
    return await this.repository.getDoctors(facilityId);
  }

  async getStaffList(facilityId: string) {
    return await this.repository.getStaffList(facilityId);
  }
}
