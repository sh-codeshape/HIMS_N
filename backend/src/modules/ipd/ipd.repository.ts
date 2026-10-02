import { db } from '../../config/database';

export class IpdRepository {
  async createAdmission(
    facilityId: string,
    organizationId: string,
    patientId: string,
    bedId: string,
    practitionerId: string,
    departmentId?: string,
    reason?: string
  ) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Create Encounter
      const encounterQuery = `
        INSERT INTO encounters (
          facility_id,
          organization_id,
          patient_id,
          primary_practitioner_id,
          department_id,
          encounter_type,
          status,
          chief_complaint,
          encounter_no
        ) VALUES ($1, $2, $3, $4, $5, 'ipd', 'in_progress', $6, $7)
        RETURNING *;
      `;
      const encounterNo = `IPD-${Date.now()}`;
      const encounterResult = await client.query(encounterQuery, [
        facilityId,
        organizationId,
        patientId,
        practitionerId,
        departmentId,
        reason,
        encounterNo
      ]);
      const encounter = encounterResult.rows[0];

      // 2. Create Admission
      const admissionQuery = `
        INSERT INTO admissions (
          encounter_id,
          facility_id,
          admitting_practitioner_id,
          admission_time,
          expected_discharge_time,
          status,
          reason_for_admission
        ) VALUES ($1, $2, $3, NOW(), NULL, 'admitted', $4)
        RETURNING *;
      `;
      const admissionResult = await client.query(admissionQuery, [
        encounter.id,
        facilityId,
        practitionerId,
        reason
      ]);
      const admission = admissionResult.rows[0];

      // 3. Assign Bed
      const bedAssignQuery = `
        INSERT INTO bed_assignments (
          admission_id,
          bed_id,
          assigned_at,
          status
        ) VALUES ($1, $2, NOW(), 'active')
        RETURNING *;
      `;
      await client.query(bedAssignQuery, [admission.id, bedId]);
      
      // 4. Update Bed Status
      await client.query(
        `UPDATE beds SET current_status = 'occupied', updated_at = NOW() WHERE id = $1`,
        [bedId]
      );

      await client.query('COMMIT');
      return { encounter, admission };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAdmissions(facilityId: string) {
    const query = `
      SELECT a.*, e.encounter_no, p.first_name, p.last_name, p.uhid,
             b.name as bed_name, w.name as ward_name
      FROM admissions a
      JOIN encounters e ON a.encounter_id = e.id
      JOIN patients p ON e.patient_id = p.id
      LEFT JOIN bed_assignments ba ON ba.admission_id = a.id AND ba.status = 'active'
      LEFT JOIN beds b ON ba.bed_id = b.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN wards w ON r.ward_id = w.id
      WHERE a.facility_id = $1 AND a.status = 'admitted'
      ORDER BY a.admission_time DESC;
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }
}
