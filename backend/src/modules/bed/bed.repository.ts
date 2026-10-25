import { db } from '../../config/database';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';

export class BedRepository {
  async getBeds(facilityId: string) {
    const query = `
      SELECT 
        b.*, 
        r.room_no as room_name, 
        w.name as ward_name, 
        w.ward_type as ward_type,
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

  async getWards(facilityId: string) {
    const query = `
      SELECT
        w.id,
        w.code,
        w.name,
        w.floor,
        w.ward_type,
        w.gender_policy,
        bc.id as bed_category_id,
        bc.code as bed_category_code,
        bc.name as bed_category_name
      FROM wards w
      JOIN bed_categories bc ON w.bed_category_id = bc.id
      WHERE w.facility_id = $1
      ORDER BY w.floor NULLS LAST, w.name
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async getRooms(facilityId: string) {
    const query = `
      SELECT
        r.id,
        r.room_no,
        r.room_type,
        r.ward_id,
        w.name as ward_name,
        w.floor,
        w.ward_type
      FROM rooms r
      JOIN wards w ON r.ward_id = w.id
      WHERE w.facility_id = $1
      ORDER BY w.floor NULLS LAST, w.name, r.room_no
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async getBedById(bedId: string, facilityId: string) {
    const query = `
      SELECT b.*, r.room_no as room_name, w.name as ward_name, w.ward_type as ward_type, bc.name as category_name, bc.is_icu
      FROM beds b
      LEFT JOIN rooms r ON b.room_id = r.id
      JOIN wards w ON b.ward_id = w.id
      JOIN bed_categories bc ON b.bed_category_id = bc.id
      WHERE b.id = $1 AND b.facility_id = $2 AND b.is_active = true
      ORDER BY w.name, r.room_no, b.bed_no
    `;
    const result = await db.query(query, [bedId, facilityId]);
    return result.rows[0];
  }

  async createBed(data: any) {
    // Resolve (or auto-create) the ward when only ward reference details are provided
    let wardId = data.ward_id || null;

    if (!wardId) {
      const wardQuery = `
        SELECT id FROM wards
        WHERE facility_id = $1 AND code = $2 AND is_active = true
        LIMIT 1;
      `;
      const wardRes = await db.query(wardQuery, [data.facility_id, data.ward_code]);
      if (wardRes.rows.length > 0) {
        wardId = wardRes.rows[0].id;
      } else {
        const wardInsert = await db.query(
          `INSERT INTO wards (
            organization_id, facility_id, code, name, ward_type, gender_policy, floor, is_active, created_at, updated_at, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW(), $8, $9) RETURNING *;`,
          [
            data.organization_id || null,
            data.facility_id,
            data.ward_code,
            data.ward_name || data.ward_code,
            data.ward_type || 'general',
            data.gender_policy || 'any',
            data.floor || null,
            data.created_by || null,
            data.updated_by || null,
          ]
        );
        wardId = wardInsert.rows[0].id;
      }
    }

    // Resolve (or auto-create) the room when room details are provided without an existing room
    let roomId = data.room_id || null;
    if (!roomId && data.room_no) {
      const roomQuery = `SELECT id FROM rooms WHERE ward_id = $1 AND room_no = $2 LIMIT 1;`;
      const roomRes = await db.query(roomQuery, [wardId, data.room_no]);
      if (roomRes.rows.length > 0) {
        roomId = roomRes.rows[0].id;
      } else {
        const roomInsert = await db.query(
          `INSERT INTO rooms (ward_id, room_no, room_type, is_active) VALUES ($1, $2, $3, true) RETURNING *;`,
          [wardId, data.room_no, data.room_type || 'general']
        );
        roomId = roomInsert.rows[0].id;
      }
    }

    const exists = await db.query(
      `SELECT id FROM beds WHERE facility_id = $1 AND ward_id = $2 AND bed_no = $3 AND is_active = true`,
      [data.facility_id, wardId, data.bed_no]
    );
    if (exists.rows.length > 0) {
      throw new ConflictError(`Bed number '${data.bed_no}' already exists in the specified ward`);
    }

    const query = `
      INSERT INTO beds (
        organization_id, facility_id, ward_id, room_id, bed_category_id,
        bed_charge_service_id, bed_no, status, features, is_active,
        created_at, updated_at, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11, $12
      ) RETURNING *;
    `;
    const result = await db.query(query, [
      data.organization_id || null,
      data.facility_id,
      wardId,
      roomId,
      data.bed_category_id || null,
      data.bed_charge_service_id || null,
      data.bed_no,
      data.status || 'available',
      data.features || {},
      data.is_active === undefined ? true : data.is_active,
      data.created_by || null,
      data.updated_by || null,
    ]);
    return result.rows[0];
  }

  async updateBed(bedId: string, data: any, facilityId: string) {
    const query = `
      UPDATE beds
      SET ward_id = $2, room_id = $3, bed_category_id = $4, bed_charge_service_id = $5,
          bed_no = $6, status = $7, features = $8, is_active = $9, updated_at = NOW(), updated_by = $10
      WHERE id = $1 AND facility_id = $11
      RETURNING *;
    `;
    const result = await db.query(query, [
      bedId,
      data.ward_id ?? null,
      data.room_id ?? null,
      data.bed_category_id ?? null,
      data.bed_charge_service_id ?? null,
      data.bed_no,
      data.status || 'available',
      data.features || {},
      data.is_active ?? true,
      data.updated_by || null,
      facilityId,
    ]);
    return result.rows[0];
  }

  async softDeleteBed(bedId: string, facilityId: string) {
    const query = `
      UPDATE beds
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND facility_id = $2
      RETURNING *;
    `;
    const result = await db.query(query, [bedId, facilityId]);
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

  async transferBed(data: any) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const fromBed = await client.query(
        `SELECT * FROM beds WHERE id = $1 AND facility_id = $2 AND is_active = true`,
        [data.fromBedId, data.facilityId]
      );
      if (fromBed.rows.length === 0) {
        throw new NotFoundError('Source bed not found');
      }

      const toBed = await client.query(
        `SELECT * FROM beds WHERE id = $1 AND facility_id = $2 AND is_active = true`,
        [data.toBedId, data.facilityId]
      );
      if (toBed.rows.length === 0) {
        throw new NotFoundError('Target bed not found');
      }

      if (fromBed.rows[0].status !== 'occupied') {
        throw new ConflictError('Source bed is not occupied');
      }
      if (toBed.rows[0].status !== 'available') {
        throw new ConflictError('Target bed is not available');
      }

      const admissionRes = await client.query(
        `SELECT admission_id FROM bed_assignments WHERE bed_id = $1 AND assigned_to IS NULL LIMIT 1`,
        [data.fromBedId]
      );
      const admissionId = data.admission_id || admissionRes.rows[0]?.admission_id;
      if (!admissionId) {
        throw new NotFoundError('No active admission found for source bed');
      }

      // Close current assignment on source bed, open new one on target bed
      await client.query(
        `UPDATE bed_assignments SET assigned_to = NOW() WHERE bed_id = $1 AND assigned_to IS NULL`,
        [data.fromBedId]
      );

      const assignRes = await client.query(
        `INSERT INTO bed_assignments (admission_id, bed_id, assigned_from) VALUES ($1, $2, NOW()) RETURNING *;`,
        [admissionId, data.toBedId]
      );

      await client.query(
        `UPDATE beds SET status = 'available', updated_at = NOW() WHERE id = $1`,
        [data.fromBedId]
      );

      const updatedBed = await client.query(
        `UPDATE beds SET status = 'occupied', updated_at = NOW() WHERE id = $1 RETURNING *;`,
        [data.toBedId]
      );

      await client.query('COMMIT');
      return updatedBed.rows[0];
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {
        // ignore rollback errors
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
