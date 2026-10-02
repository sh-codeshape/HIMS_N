import { db } from '../../config/database';

export class BedRepository {
  async getBeds(facilityId: string) {
    const query = `
      SELECT b.*, r.room_no as room_name, w.name as ward_name, b.status as current_status
      FROM beds b
      LEFT JOIN rooms r ON b.room_id = r.id
      JOIN wards w ON b.ward_id = w.id
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
