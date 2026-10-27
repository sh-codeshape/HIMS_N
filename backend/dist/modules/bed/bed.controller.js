"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedController = void 0;
const bed_service_1 = require("./bed.service");
const response_1 = require("../../shared/utils/response");
class BedController {
    service;
    constructor() {
        this.service = new bed_service_1.BedService();
    }
    // All bed master data (beds, wards, rooms, bed categories) is seeded under the
    // default facility 00000000-.... The authenticated user's facility (e.g. a125c92c-...)
    // is a *different* facility that has no beds, so letting it shadow the query would
    // always return []. Resolve the beds facility from the explicit query param first,
    // then fall back to the default facility where beds actually live.
    resolveBedFacilityId(req) {
        const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
        return (req.query.facilityId || ZERO_UUID);
    }
    getBeds = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const beds = await this.service.getBeds(facilityId);
            (0, response_1.sendSuccess)(res, beds, 'Beds retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    getWards = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const wards = await this.service.getWards(facilityId);
            (0, response_1.sendSuccess)(res, wards, 'Wards retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    getRooms = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const rooms = await this.service.getRooms(facilityId);
            (0, response_1.sendSuccess)(res, rooms, 'Rooms retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    getBedCategories = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const categories = await this.service.getBedCategories(facilityId);
            (0, response_1.sendSuccess)(res, categories, 'Bed categories retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    syncAllBedsToInventory = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const result = await this.service.syncAllBedsToInventory(facilityId);
            (0, response_1.sendSuccess)(res, result, 'Beds synchronized with inventory assets successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    getBed = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const bed = await this.service.getBed(req.params.id, facilityId);
            (0, response_1.sendSuccess)(res, bed, 'Bed retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    createBed = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const userId = req.user?.userId;
            const bed = await this.service.createBed({
                organization_id: req.user?.organizationId,
                facility_id: facilityId,
                ward_id: req.body.ward_id ?? null,
                ward_code: req.body.ward_code,
                ward_name: req.body.ward_name,
                ward_type: req.body.ward_type,
                floor: req.body.floor,
                gender_policy: req.body.gender_policy,
                bed_category_id: req.body.bed_category_id ?? null,
                bed_charge_service_id: req.body.bed_charge_service_id ?? null,
                room_id: req.body.room_id ?? null,
                room_no: req.body.room_no,
                room_type: req.body.room_type,
                bed_no: req.body.bed_no,
                status: req.body.status,
                features: req.body.features,
                is_active: req.body.is_active,
                created_by: userId,
                updated_by: userId,
            });
            (0, response_1.sendSuccess)(res, bed, 'Bed created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    };
    updateBed = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const bed = await this.service.updateBed(req.params.id, req.body, facilityId, req.user?.userId);
            (0, response_1.sendSuccess)(res, bed, 'Bed updated successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    deleteBed = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const bed = await this.service.deleteBed(req.params.id, facilityId);
            (0, response_1.sendSuccess)(res, bed, 'Bed deleted successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    updateBedStatus = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const bedId = req.params.id;
            const { status } = req.body;
            const bed = await this.service.updateBedStatus(bedId, status, facilityId);
            (0, response_1.sendSuccess)(res, bed, 'Bed status updated successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    transferBed = async (req, res, next) => {
        try {
            const facilityId = this.resolveBedFacilityId(req);
            const bed = await this.service.transferBed({
                fromBedId: req.body.fromBedId,
                toBedId: req.body.toBedId,
                facilityId,
                admission_id: req.body.admission_id,
            });
            (0, response_1.sendSuccess)(res, bed, 'Bed transfer processed successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.BedController = BedController;
