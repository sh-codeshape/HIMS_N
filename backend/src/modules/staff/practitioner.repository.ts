import { db } from '../../config/database';

export class PractitionerRepository {
  async getPractitioners(facilityId: string) {
    const query = `
      SELECT
        p.id as practitioner_id,
        s.id as staff_id,
        s.first_name,
        s.last_name,
        s.staff_code,
        s.department_id,
        p.specialty_id,
        p.registration_no,
        p.qualifications,
        s.is_active
      FROM practitioners p
      JOIN staff s ON p.staff_id = s.id
      WHERE s.organization_id = (SELECT organization_id FROM facilities WHERE id = $1 LIMIT 1)
        AND s.is_active = true
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async getSchedules(practitionerId: string, facilityId: string) {
    const query = `
      SELECT * FROM practitioner_schedules
      WHERE practitioner_id = $1 AND facility_id = $2
      ORDER BY day_of_week ASC, start_time ASC
    `;
    const result = await db.query(query, [practitionerId, facilityId]);
    return result.rows;
  }

  async createSchedule(data: any) {
    const query = `
      INSERT INTO practitioner_schedules (
        practitioner_id, facility_id, department_id, day_of_week, 
        start_time, end_time, slot_minutes, consultation_mode, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `;
    const result = await db.query(query, [
      data.practitioner_id,
      data.facility_id,
      data.department_id || null,
      data.day_of_week,
      data.start_time,
      data.end_time,
      data.slot_minutes || 15,
      data.consultation_mode || 'both'
    ]);
    return result.rows[0];
  }

  async updateSchedule(scheduleId: string, data: any) {
    const updates = [];
    const values = [scheduleId];
    let paramIndex = 2;

    const allowedFields = ['day_of_week', 'start_time', 'end_time', 'slot_minutes', 'consultation_mode', 'is_active'];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) return null;

    const query = `
      UPDATE practitioner_schedules 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async deleteSchedule(scheduleId: string) {
    const query = `DELETE FROM practitioner_schedules WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [scheduleId]);
    return result.rows[0];
  }
}
