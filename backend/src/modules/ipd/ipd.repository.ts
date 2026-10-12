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
    reason?: string,
    attendantName?: string | null,
    attendantRelation?: string | null,
    attendantPhone?: string | null
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
          encounter_no,
          attendant_name,
          attendant_relation,
          attendant_phone
        ) VALUES ($1, $2, $3, $4, $5, $6, 'ipd', 'in_progress', $7, $8, $9, $10, $11)
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
        encounterNo,
        attendantName || null,
        attendantRelation || null,
        attendantPhone || null
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
          admitted_at,
          attendant_name,
          attendant_relation,
          attendant_phone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'admitted', NOW(), $10, $11, $12)
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
        reason || null,
        attendantName || null,
        attendantRelation || null,
        attendantPhone || null
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

  async getAdmissions(facilityId: string, search?: string, status?: string) {
    let query = `
      SELECT a.*, e.encounter_no, p.first_name, p.last_name, p.uhid, p.phone,
             p.gender, p.date_of_birth,
             COALESCE(curr_b.bed_no, last_b.bed_no) as bed_name,
             COALESCE(curr_w.name, last_w.name) as ward_name,
             s.first_name as doctor_first_name, s.last_name as doctor_last_name
      FROM admissions a
      JOIN encounters e ON a.encounter_id = e.id
      JOIN patients p ON e.patient_id = p.id
      LEFT JOIN bed_assignments curr_ba ON curr_ba.admission_id = a.id AND curr_ba.assigned_to IS NULL
      LEFT JOIN beds curr_b ON curr_ba.bed_id = curr_b.id
      LEFT JOIN wards curr_w ON curr_b.ward_id = curr_w.id
      LEFT JOIN LATERAL (
        SELECT ba.bed_id, b.bed_no, w.name
        FROM bed_assignments ba
        JOIN beds b ON ba.bed_id = b.id
        LEFT JOIN wards w ON b.ward_id = w.id
        WHERE ba.admission_id = a.id
        ORDER BY ba.assigned_from DESC
        LIMIT 1
      ) last_b ON true
      LEFT JOIN wards last_w ON last_w.name = last_b.name
      LEFT JOIN practitioners prac ON a.attending_practitioner_id = prac.id OR a.admitting_practitioner_id = prac.id
      LEFT JOIN staff s ON prac.staff_id = s.id
      WHERE a.facility_id = $1
    `;
    const params: any[] = [facilityId];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    } else if (!status) {
      query += ` AND a.status = 'admitted'`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        p.first_name ILIKE $${params.length} OR
        p.last_name ILIKE $${params.length} OR
        p.uhid ILIKE $${params.length} OR
        p.phone ILIKE $${params.length} OR
        e.encounter_no ILIKE $${params.length} OR
        a.admission_no ILIKE $${params.length}
      )`;
    }

    query += ` ORDER BY a.admitted_at DESC;`;
    const result = await db.query(query, params);
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

  async getDischargeSummary(admissionId: string) {
    const query = `
      SELECT ds.*, 
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             p.uhid as patient_uhid, p.gender as patient_gender, p.date_of_birth,
             a.admission_no, a.admitted_at, a.discharged_at, a.discharge_type, a.discharge_condition,
             s.first_name as doctor_first_name, s.last_name as doctor_last_name
      FROM discharge_summaries ds
      JOIN admissions a ON ds.admission_id = a.id
      JOIN patients p ON ds.patient_id = p.id
      LEFT JOIN practitioners prac ON ds.authored_by = prac.id OR a.attending_practitioner_id = prac.id
      LEFT JOIN staff s ON prac.staff_id = s.id
      WHERE ds.admission_id = $1;
    `;
    const result = await db.query(query, [admissionId]);
    return result.rows[0] || null;
  }

  async saveDischargeSummary(admissionId: string, summary: any) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const admRes = await client.query(
        `SELECT id, encounter_id, patient_id, attending_practitioner_id FROM admissions WHERE id = $1`,
        [admissionId]
      );
      if (admRes.rows.length === 0) {
        throw new Error('Admission not found');
      }
      const adm = admRes.rows[0];

      const checkSummary = await client.query(
        `SELECT id FROM discharge_summaries WHERE admission_id = $1`,
        [admissionId]
      );

      let result;
      if (checkSummary.rows.length > 0) {
        const updateQuery = `
          UPDATE discharge_summaries
          SET final_diagnosis = $1,
              history_of_present_illness = $2,
              hospital_course = $3,
              procedures_performed = $4,
              condition_at_discharge = $5,
              follow_up_instructions = $6,
              follow_up_date = $7,
              diet_advice = $8,
              activity_advice = $9,
              status = $10,
              data = $11,
              updated_at = NOW()
          WHERE admission_id = $12
          RETURNING *;
        `;
        result = await client.query(updateQuery, [
          summary.final_diagnosis || null,
          summary.history_of_present_illness || null,
          summary.hospital_course || null,
          summary.procedures_performed || null,
          summary.condition_at_discharge || null,
          summary.follow_up_instructions || null,
          summary.follow_up_date || null,
          summary.diet_advice || null,
          summary.activity_advice || null,
          summary.status || 'draft',
          JSON.stringify(summary.data || {}),
          admissionId
        ]);
      } else {
        const insertQuery = `
          INSERT INTO discharge_summaries (
            admission_id, encounter_id, patient_id,
            final_diagnosis, history_of_present_illness, hospital_course,
            procedures_performed, condition_at_discharge,
            follow_up_instructions, follow_up_date, diet_advice,
            activity_advice, status, authored_by, signed_at, data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING *;
        `;
        result = await client.query(insertQuery, [
          admissionId,
          adm.encounter_id,
          adm.patient_id,
          summary.final_diagnosis || null,
          summary.history_of_present_illness || null,
          summary.hospital_course || null,
          summary.procedures_performed || null,
          summary.condition_at_discharge || null,
          summary.follow_up_instructions || null,
          summary.follow_up_date || null,
          summary.diet_advice || null,
          summary.activity_advice || null,
          summary.status || 'draft',
          summary.authored_by || adm.attending_practitioner_id || null,
          summary.status === 'finalized' ? new Date() : null,
          JSON.stringify(summary.data || {})
        ]);
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getIpdReportStats(facilityId: string) {
    // 1. Bed counts
    const bedStatsQuery = `
      SELECT 
        COUNT(*) as total_beds,
        COUNT(*) FILTER (WHERE status = 'occupied') as occupied_beds,
        COUNT(*) FILTER (WHERE status = 'available') as available_beds,
        COUNT(*) FILTER (WHERE status = 'cleaning') as cleaning_beds,
        COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_beds,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked_beds
      FROM beds
      WHERE facility_id = $1 AND is_active = true;
    `;
    const bedStats = (await db.query(bedStatsQuery, [facilityId])).rows[0];

    // 2. Admissions stats
    const admStatsQuery = `
      SELECT
        COUNT(*) as total_admissions,
        COUNT(*) FILTER (WHERE status = 'admitted') as active_inpatients,
        COUNT(*) FILTER (WHERE status = 'discharged') as total_discharged,
        COUNT(*) FILTER (WHERE status = 'discharged' AND discharged_at >= CURRENT_DATE) as discharged_today,
        COUNT(*) FILTER (WHERE status = 'admitted' AND admitted_at >= CURRENT_DATE) as admitted_today,
        ROUND(AVG(
          EXTRACT(EPOCH FROM (COALESCE(discharged_at, NOW()) - admitted_at)) / 86400
        )::numeric, 1) as avg_length_of_stay_days
      FROM admissions
      WHERE facility_id = $1;
    `;
    const admStats = (await db.query(admStatsQuery, [facilityId])).rows[0];

    // 3. Ward wise occupancy
    const wardStatsQuery = `
      SELECT 
        w.id as ward_id,
        w.name as ward_name,
        w.ward_type,
        COUNT(b.id) as total_beds,
        COUNT(b.id) FILTER (WHERE b.status = 'occupied') as occupied_beds,
        COUNT(b.id) FILTER (WHERE b.status = 'available') as available_beds,
        COUNT(b.id) FILTER (WHERE b.status = 'cleaning') as cleaning_beds,
        COUNT(b.id) FILTER (WHERE b.status = 'maintenance') as maintenance_beds,
        ROUND(
          (COUNT(b.id) FILTER (WHERE b.status = 'occupied')::numeric / NULLIF(COUNT(b.id), 0)) * 100, 1
        ) as occupancy_rate
      FROM wards w
      LEFT JOIN beds b ON w.id = b.ward_id AND b.is_active = true
      WHERE w.facility_id = $1
      GROUP BY w.id, w.name, w.ward_type
      ORDER BY w.name;
    `;
    const wardStats = (await db.query(wardStatsQuery, [facilityId])).rows;

    // 4. Discharge Types breakdown
    const dischargeTypesQuery = `
      SELECT discharge_type, COUNT(*) as count
      FROM admissions
      WHERE facility_id = $1 AND status = 'discharged' AND discharge_type IS NOT NULL
      GROUP BY discharge_type;
    `;
    const dischargeTypeStats = (await db.query(dischargeTypesQuery, [facilityId])).rows;

    // 5. Doctor-wise Admissions
    const doctorStatsQuery = `
      SELECT 
        s.first_name, s.last_name,
        COUNT(a.id) as total_admissions,
        COUNT(a.id) FILTER (WHERE a.status = 'admitted') as active_patients,
        COUNT(a.id) FILTER (WHERE a.status = 'discharged') as discharged_patients
      FROM admissions a
      JOIN practitioners prac ON a.attending_practitioner_id = prac.id OR a.admitting_practitioner_id = prac.id
      JOIN staff s ON prac.staff_id = s.id
      WHERE a.facility_id = $1
      GROUP BY s.id, s.first_name, s.last_name
      ORDER BY total_admissions DESC;
    `;
    const doctorStats = (await db.query(doctorStatsQuery, [facilityId])).rows;

    const totalBeds = parseInt(bedStats.total_beds || '0', 10);
    const occupiedBeds = parseInt(bedStats.occupied_beds || '0', 10);
    const overallOccupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    return {
      overview: {
        totalBeds,
        occupiedBeds,
        availableBeds: parseInt(bedStats.available_beds || '0', 10),
        cleaningBeds: parseInt(bedStats.cleaning_beds || '0', 10),
        maintenanceBeds: parseInt(bedStats.maintenance_beds || '0', 10),
        blockedBeds: parseInt(bedStats.blocked_beds || '0', 10),
        occupancyRate: overallOccupancyRate,
        totalAdmissions: parseInt(admStats.total_admissions || '0', 10),
        activeInpatients: parseInt(admStats.active_inpatients || '0', 10),
        totalDischarged: parseInt(admStats.total_discharged || '0', 10),
        dischargedToday: parseInt(admStats.discharged_today || '0', 10),
        admittedToday: parseInt(admStats.admitted_today || '0', 10),
        avgLengthOfStayDays: parseFloat(admStats.avg_length_of_stay_days || '0')
      },
      wardBreakdown: wardStats,
      dischargeTypes: dischargeTypeStats,
      doctorActivity: doctorStats
    };
  }
}
