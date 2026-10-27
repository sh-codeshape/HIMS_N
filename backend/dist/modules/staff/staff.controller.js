"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const staff_service_1 = require("./staff.service");
const response_1 = require("../../shared/utils/response");
class StaffController {
    service;
    constructor() {
        this.service = new staff_service_1.StaffService();
    }
    getDepartments = async (req, res, next) => {
        try {
            const organizationId = req.user?.organizationId;
            const departments = await this.service.getDepartments(organizationId);
            (0, response_1.sendSuccess)(res, departments, 'Departments retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    getDoctors = async (req, res, next) => {
        try {
            const facilityId = (req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000');
            const doctors = await this.service.getDoctors(facilityId);
            (0, response_1.sendSuccess)(res, doctors, 'Doctors retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    getStaffList = async (req, res, next) => {
        try {
            const organizationId = req.user?.organizationId;
            const staff = await this.service.getStaffList(organizationId);
            (0, response_1.sendSuccess)(res, staff, 'Staff retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    getStaffById = async (req, res, next) => {
        try {
            const organizationId = req.user?.organizationId;
            const staffId = req.params.staffId;
            const staff = await this.service.getStaffById(organizationId, staffId);
            if (!staff) {
                res.status(404).json({ success: false, error: { message: 'Staff not found' } });
                return;
            }
            (0, response_1.sendSuccess)(res, staff, 'Staff retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    createStaff = async (req, res, next) => {
        try {
            const organizationId = req.user?.organizationId;
            const data = req.body;
            const staff = await this.service.createStaff(organizationId, data);
            (0, response_1.sendSuccess)(res, staff, 'Staff created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    };
    updateStaff = async (req, res, next) => {
        try {
            const organizationId = req.user?.organizationId;
            const staffId = req.params.staffId;
            const data = req.body;
            const staff = await this.service.updateStaff(organizationId, staffId, data);
            (0, response_1.sendSuccess)(res, staff, 'Staff updated successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.StaffController = StaffController;
