"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PractitionerController = void 0;
const practitioner_repository_1 = require("./practitioner.repository");
class PractitionerController {
    repository;
    constructor() {
        this.repository = new practitioner_repository_1.PractitionerRepository();
    }
    getPractitioners = async (req, res) => {
        // Assuming facilityId comes from the user context via auth middleware
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        if (!facilityId) {
            return res.status(400).json({ success: false, error: { message: 'Facility ID is required' } });
        }
        const practitioners = await this.repository.getPractitioners(facilityId);
        res.json({ success: true, data: practitioners });
    };
    createPractitioner = async (req, res) => {
        const organizationId = req.user?.organizationId;
        const facilityId = (req.user?.facilityId || req.body.facilityId || '00000000-0000-0000-0000-000000000000');
        const newPractitioner = await this.repository.createPractitioner(organizationId, facilityId, req.body);
        res.status(201).json({ success: true, data: newPractitioner });
    };
    updatePractitioner = async (req, res) => {
        const practitionerId = req.params.id;
        const updated = await this.repository.updatePractitioner(practitionerId, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, error: { message: 'Doctor not found' } });
        }
        res.json({ success: true, data: updated });
    };
    togglePractitioner = async (req, res) => {
        const practitionerId = req.params.id;
        const toggled = await this.repository.togglePractitioner(practitionerId);
        if (!toggled) {
            return res.status(404).json({ success: false, error: { message: 'Doctor not found' } });
        }
        res.json({ success: true, data: toggled });
    };
    deletePractitioner = async (req, res) => {
        const practitionerId = req.params.id;
        const deleted = await this.repository.deletePractitioner(practitionerId);
        if (!deleted) {
            return res.status(404).json({ success: false, error: { message: 'Doctor not found' } });
        }
        res.json({ success: true, data: deleted });
    };
    getSchedules = async (req, res) => {
        const practitionerId = req.params.id;
        const facilityId = req.user?.facilityId || req.query.facilityId || '00000000-0000-0000-0000-000000000000';
        if (!facilityId) {
            return res.status(400).json({ success: false, error: { message: 'Facility ID is required' } });
        }
        const schedules = await this.repository.getSchedules(practitionerId, facilityId);
        res.json({ success: true, data: schedules });
    };
    createSchedule = async (req, res) => {
        const practitionerId = req.params.id;
        const facilityId = req.user?.facilityId || req.body.facilityId || '00000000-0000-0000-0000-000000000000';
        if (!facilityId) {
            return res.status(400).json({ success: false, error: { message: 'Facility ID is required' } });
        }
        const scheduleData = {
            ...req.body,
            practitioner_id: practitionerId,
            facility_id: facilityId
        };
        const newSchedule = await this.repository.createSchedule(scheduleData);
        res.status(201).json({ success: true, data: newSchedule });
    };
    updateSchedule = async (req, res) => {
        const scheduleId = req.params.scheduleId;
        const updatedSchedule = await this.repository.updateSchedule(scheduleId, req.body);
        if (!updatedSchedule) {
            return res.status(404).json({ success: false, error: { message: 'Schedule not found' } });
        }
        res.json({ success: true, data: updatedSchedule });
    };
    deleteSchedule = async (req, res) => {
        const scheduleId = req.params.scheduleId;
        const deleted = await this.repository.deleteSchedule(scheduleId);
        if (!deleted) {
            return res.status(404).json({ success: false, error: { message: 'Schedule not found' } });
        }
        res.json({ success: true, data: deleted });
    };
}
exports.PractitionerController = PractitionerController;
