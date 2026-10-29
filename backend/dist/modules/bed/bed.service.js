"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedService = void 0;
const bed_repository_1 = require("./bed.repository");
const AppError_1 = require("../../shared/errors/AppError");
class BedService {
    repository;
    constructor() {
        this.repository = new bed_repository_1.BedRepository();
    }
    async getBeds(facilityId) {
        return await this.repository.getBeds(facilityId);
    }
    async getWards(facilityId) {
        return await this.repository.getWards(facilityId);
    }
    async getRooms(facilityId) {
        return await this.repository.getRooms(facilityId);
    }
    async getBedCategories(facilityId) {
        return await this.repository.getBedCategories(facilityId);
    }
    async syncAllBedsToInventory(facilityId) {
        return await this.repository.syncAllBedsToInventory(facilityId);
    }
    async getBed(bedId, facilityId) {
        const bed = await this.repository.getBedById(bedId, facilityId);
        if (!bed) {
            throw new AppError_1.NotFoundError('Bed not found');
        }
        return bed;
    }
    async createBed(data) {
        const bed = await this.repository.createBed(data);
        if (!bed) {
            throw new AppError_1.NotFoundError('Failed to create bed');
        }
        return bed;
    }
    async createWard(data) {
        const ward = await this.repository.createWard(data);
        if (!ward) {
            throw new AppError_1.NotFoundError('Failed to create ward');
        }
        return ward;
    }
    async createRoom(data) {
        const room = await this.repository.createRoom(data);
        if (!room) {
            throw new AppError_1.NotFoundError('Failed to create room');
        }
        return room;
    }
    async deleteWard(wardId, facilityId) {
        return await this.repository.deleteWard(wardId, facilityId);
    }
    async deleteRoom(roomId, facilityId) {
        return await this.repository.deleteRoom(roomId, facilityId);
    }
    async updateBed(bedId, data, facilityId, updatedBy) {
        const bed = await this.repository.getBedById(bedId, facilityId);
        if (!bed) {
            throw new AppError_1.NotFoundError('Bed not found');
        }
        const merged = { ...bed, ...data, updated_by: updatedBy ?? data.updated_by ?? bed.updated_by };
        const updatedBed = await this.repository.updateBed(bedId, merged, facilityId);
        if (!updatedBed) {
            throw new AppError_1.NotFoundError('Bed not found');
        }
        return updatedBed;
    }
    async deleteBed(bedId, facilityId) {
        const bed = await this.repository.getBedById(bedId, facilityId);
        if (!bed) {
            throw new AppError_1.NotFoundError('Bed not found');
        }
        if (bed.status === 'occupied' || bed.current_status === 'occupied') {
            throw new AppError_1.ConflictError('Cannot delete an occupied bed. Please discharge or transfer the patient before deleting.');
        }
        const deletedBed = await this.repository.softDeleteBed(bedId, facilityId);
        if (!deletedBed) {
            throw new AppError_1.NotFoundError('Bed not found');
        }
        return deletedBed;
    }
    async updateBedStatus(bedId, status, facilityId) {
        const updatedBed = await this.repository.updateBedStatus(bedId, status, facilityId);
        if (!updatedBed) {
            throw new AppError_1.NotFoundError('Bed not found or not in facility');
        }
        return updatedBed;
    }
    async transferBed(data) {
        const transferredBed = await this.repository.transferBed(data);
        if (!transferredBed) {
            throw new AppError_1.NotFoundError('Bed transfer failed');
        }
        return transferredBed;
    }
}
exports.BedService = BedService;
