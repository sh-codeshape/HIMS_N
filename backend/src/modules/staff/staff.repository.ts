import { db } from '../../config/database';

export class StaffRepository {
  async getDoctors(facilityId: string) {
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
        AND s.staff_type = 'doctor'
        AND s.is_active = true
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async getStaffList(facilityId: string) {
    const query = `
      SELECT *
      FROM staff
      WHERE organization_id = (SELECT organization_id FROM facilities WHERE id = $1 LIMIT 1)
        AND is_active = true
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }
}
