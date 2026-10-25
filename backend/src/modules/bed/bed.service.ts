import { BedRepository } from './bed.repository';
import { NotFoundError } from '../../shared/errors/AppError';

export class BedService {
  private repository: BedRepository;

  constructor() {
    this.repository = new BedRepository();
  }

  async getBeds(facilityId: string) {
    return await this.repository.getBeds(facilityId);
  }

  async getWards(facilityId: string) {
    return await this.repository.getWards(facilityId);
  }

  async getRooms(facilityId: string) {
    return await this.repository.getRooms(facilityId);
  }

  async getBed(bedId: string, facilityId: string) {
    const bed = await this.repository.getBedById(bedId, facilityId);
    if (!bed) {
      throw new NotFoundError('Bed not found');
    }
    return bed;
  }

  async createBed(data: any) {
    const bed = await this.repository.createBed(data);
    if (!bed) {
      throw new NotFoundError('Failed to create bed');
    }
    return bed;
  }

  async updateBed(bedId: string, data: any, facilityId: string, updatedBy?: string) {
    const bed = await this.repository.getBedById(bedId, facilityId);
    if (!bed) {
      throw new NotFoundError('Bed not found');
    }
    const merged = { ...bed, ...data, updated_by: updatedBy ?? data.updated_by ?? bed.updated_by };
    const updatedBed = await this.repository.updateBed(bedId, merged, facilityId);
    if (!updatedBed) {
      throw new NotFoundError('Bed not found');
    }
    return updatedBed;
  }

  async deleteBed(bedId: string, facilityId: string) {
    const bed = await this.repository.getBedById(bedId, facilityId);
    if (!bed) {
      throw new NotFoundError('Bed not found');
    }
    const deletedBed = await this.repository.softDeleteBed(bedId, facilityId);
    if (!deletedBed) {
      throw new NotFoundError('Bed not found');
    }
    return deletedBed;
  }

  async updateBedStatus(bedId: string, status: string, facilityId: string) {
    const updatedBed = await this.repository.updateBedStatus(bedId, status, facilityId);
    if (!updatedBed) {
      throw new NotFoundError('Bed not found or not in facility');
    }
    return updatedBed;
  }

  async transferBed(data: any) {
    const transferredBed = await this.repository.transferBed(data);
    if (!transferredBed) {
      throw new NotFoundError('Bed transfer failed');
    }
    return transferredBed;
  }
}
