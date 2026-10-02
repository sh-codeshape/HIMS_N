import { db } from '../../config/database';

export class IpdRepository {
  async admitPatient(
    facilityId: string,
    organizationId: string,
    patientId: string,
    bedId?: string | null,
    practitionerId?: string | null,
    departmentId?: string | null,
    referredBy?: string | null,
    admissionType?: string | null,
    reason?: string
  ) {
    const client = await db.getClient();
    
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
          referred_by,
          encounter_type,
          status,
          chief_complaint,
          encounter_no
        ) VALUES ($1, $2, $3, $4, $5, $6, 'ipd', 'in_progress', $7, $8)
        RETURNING *;
      `;
      const encounterNo = `IPD-${Date.now()}`;
      const encounterResult = await client.query(encounterQuery, [
        facilityId,
        organizationId,
        patientId,
        practitionerId || null,
        departmentId || null,
        referredBy || null,
        reason,
        encounterNo
      ]);
      const encounter = encounterResult.rows[0];

      // 2. Create Admission
      const admissionQuery = `
        INSERT INTO admissions (
          organization_id,
          facility_id,
          patient_id,
          encounter_id,
          admitting_practitioner_id,
          department_id,
          admission_no,
          admission_type,
          admission_diagnosis,
          status,
          admitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'admitted', NOW())
        RETURNING *;
      `;
      const admissionNo = `ADM-${Date.now()}`;
      const admissionResult = await client.query(admissionQuery, [
        organizationId,
        facilityId,
        patientId,
        encounter.id,
        practitionerId || null,
        departmentId || null,
        admissionNo,
        admissionType || 'elective',
        reason || null
      ]);
      const admission = admissionResult.rows[0];

      // 3. Assign Bed (if provided)
      if (bedId) {
        const bedAssignQuery = `
          INSERT INTO bed_assignments (
            admission_id,
            bed_id,
            assigned_from
          ) VALUES ($1, $2, NOW())
          RETURNING *;
        `;
        await client.query(bedAssignQuery, [admission.id, bedId]);
        
        // 4. Update Bed Status
        await client.query(
          `UPDATE beds SET status = 'occupied', updated_at = NOW() WHERE id = $1`,
          [bedId]
        );
      }

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
             b.bed_no as bed_name, w.name as ward_name
      FROM admissions a
      JOIN encounters e ON a.encounter_id = e.id
      JOIN patients p ON e.patient_id = p.id
      LEFT JOIN bed_assignments ba ON ba.admission_id = a.id AND ba.assigned_to IS NULL
      LEFT JOIN beds b ON ba.bed_id = b.id
      LEFT JOIN wards w ON b.ward_id = w.id
      WHERE a.facility_id = $1 AND a.status = 'admitted'
      ORDER BY a.admitted_at DESC;
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async dischargePatient(facilityId: string, admissionId: string, dischargeType: string, dischargeCondition?: string) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const admissionQuery = `
        UPDATE admissions
        SET status = 'discharged',
            discharged_at = NOW(),
            discharge_type = $1,
            discharge_condition = $2,
            updated_at = NOW()
        WHERE id = $3 AND facility_id = $4
        RETURNING *;
      `;
      const admissionRes = await client.query(admissionQuery, [
        dischargeType, dischargeCondition || null, admissionId, facilityId
      ]);
      const admission = admissionRes.rows[0];

      if (admission) {
        // Update encounter
        await client.query(`
          UPDATE encounters
          SET status = 'finished',
              ended_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
        `, [admission.encounter_id]);

        // Unassign bed
        const bedAssignRes = await client.query(`
          UPDATE bed_assignments
          SET assigned_to = NOW()
          WHERE admission_id = $1 AND assigned_to IS NULL
          RETURNING bed_id;
        `, [admission.id]);

        if (bedAssignRes.rows.length > 0) {
          const bedId = bedAssignRes.rows[0].bed_id;
          await client.query(`
            UPDATE beds
            SET status = 'cleaning', updated_at = NOW()
            WHERE id = $1
          `, [bedId]);
        }
      }

      await client.query('COMMIT');
      return admission;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
