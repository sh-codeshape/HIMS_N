import { db } from '../../config/database';

export class BedRepository {
  async getBeds(facilityId: string) {
    const query = `
      SELECT 
        b.*, 
        r.room_no as room_name, 
        w.name as ward_name, 
        b.status as current_status,
        bc.name as category_name,
        bc.is_icu,
        p.id as patient_id,
        p.uhid as patient_uhid,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.date_of_birth,
        p.gender,
        adm.id as admission_id,
        adm.admitted_at,
        adm.status as admission_status,
        s.first_name as doctor_first_name,
        s.last_name as doctor_last_name
      FROM beds b
      LEFT JOIN rooms r ON b.room_id = r.id
      JOIN wards w ON b.ward_id = w.id
      JOIN bed_categories bc ON b.bed_category_id = bc.id
      LEFT JOIN bed_assignments ba ON ba.bed_id = b.id AND ba.assigned_to IS NULL
      LEFT JOIN admissions adm ON ba.admission_id = adm.id AND adm.status IN ('admitted', 'discharge_initiated')
      LEFT JOIN patients p ON adm.patient_id = p.id
      LEFT JOIN practitioners prac ON adm.attending_practitioner_id = prac.id OR adm.admitting_practitioner_id = prac.id
      LEFT JOIN staff s ON prac.staff_id = s.id
      WHERE b.facility_id = $1 AND b.is_active = true
      ORDER BY w.name, r.room_no, b.bed_no
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async getBedById(bedId: string) {
    const query = `
      SELECT * FROM beds WHERE id = $1 AND is_active = true
    `;
    const result = await db.query(query, [bedId]);
    return result.rows[0];
  }

  async updateBedStatus(bedId: string, status: string, facilityId: string) {
    const query = `
      UPDATE beds
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND facility_id = $3
      RETURNING *;
    `;
    const result = await db.query(query, [status, bedId, facilityId]);
    return result.rows[0];
  }
}
