import { Request, Response } from 'express';
import { PractitionerRepository } from './practitioner.repository';
import { db } from '../../config/database';

export class PractitionerController {
  private repository: PractitionerRepository;

  constructor() {
    this.repository = new PractitionerRepository();
  }

  getPractitioners = async (req: Request, res: Response) => {
    // Assuming facilityId comes from the user context via auth middleware
    const facilityId = req.user?.facilityId || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';
    
    if (!facilityId) {
      return res.status(400).json({ success: false, error: { message: 'Facility ID is required' } });
    }

    const practitioners = await this.repository.getPractitioners(facilityId);
    res.json({ success: true, data: practitioners });
  };

  getSchedules = async (req: Request, res: Response) => {
    const practitionerId = req.params.id as string;
    const facilityId = req.user?.facilityId || (req.query.facilityId as string) || '00000000-0000-0000-0000-000000000000';

    if (!facilityId) {
      return res.status(400).json({ success: false, error: { message: 'Facility ID is required' } });
    }

    const schedules = await this.repository.getSchedules(practitionerId, facilityId);
    res.json({ success: true, data: schedules });
  };

  createSchedule = async (req: Request, res: Response) => {
    const practitionerId = req.params.id as string;
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

  updateSchedule = async (req: Request, res: Response) => {
    const scheduleId = req.params.scheduleId as string;
    
    const updatedSchedule = await this.repository.updateSchedule(scheduleId, req.body);
    
    if (!updatedSchedule) {
      return res.status(404).json({ success: false, error: { message: 'Schedule not found' } });
    }

    res.json({ success: true, data: updatedSchedule });
  };

  deleteSchedule = async (req: Request, res: Response) => {
    const scheduleId = req.params.scheduleId as string;
    
    const deleted = await this.repository.deleteSchedule(scheduleId);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: { message: 'Schedule not found' } });
    }

    res.json({ success: true, data: deleted });
  };
}
