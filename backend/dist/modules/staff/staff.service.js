"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const staff_repository_1 = require("./staff.repository");
class StaffService {
    repository;
    constructor() {
        this.repository = new staff_repository_1.StaffRepository();
    }
    async getDepartments(organizationId) {
        return await this.repository.getDepartments(organizationId);
    }
    async getDoctors(facilityId) {
        return await this.repository.getDoctors(facilityId);
    }
    async getStaffList(organizationId) {
        return await this.repository.getStaffList(organizationId);
    }
    async getStaffById(organizationId, staffId) {
        return await this.repository.getStaffById(organizationId, staffId);
    }
    async createStaff(organizationId, data) {
        return await this.repository.createStaff(organizationId, data);
    }
    async updateStaff(organizationId, staffId, data) {
        return await this.repository.updateStaff(organizationId, staffId, data);
    }
}
exports.StaffService = StaffService;
