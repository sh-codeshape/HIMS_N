import { BedRepository } from './bed.repository';

export class BedService {
  private repository: BedRepository;

  constructor() {
    this.repository = new BedRepository();
  }

  async getBeds(facilityId: string) {
    return await this.repository.getBeds(facilityId);
  }

  async updateBedStatus(bedId: string, status: string, facilityId: string) {
    const updatedBed = await this.repository.updateBedStatus(bedId, status, facilityId);
    if (!updatedBed) {
      throw new Error('Bed not found or not in facility');
    }
    return updatedBed;
  }
}
