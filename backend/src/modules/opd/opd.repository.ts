import { db } from '../../config/database';

export class OpdRepository {
  async createEncounter(
    facilityId: string,
    organizationId: string,
    patientId: string,
    practitionerId?: string | null,
    departmentId?: string | null,
    referredBy?: string | null,
    chiefComplaint?: string,
    tokenNumber?: string,
    attendantName?: string | null,
    attendantRelation?: string | null,
    attendantPhone?: string | null
  ) {
    const customFields = tokenNumber ? { opd_token: tokenNumber } : {};

    const query = `
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
        custom_fields,
        encounter_no,
        attendant_name,
        attendant_relation,
        attendant_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, 'opd', 'arrived', $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const encounterNo = `OPD-${Date.now()}`; // Temporary till we fix sequence

    const result = await db.query(query, [
      facilityId,
      organizationId,
      patientId,
      practitionerId || null,
      departmentId || null,
      referredBy || null,
      chiefComplaint,
      JSON.stringify(customFields),
      encounterNo,
      attendantName || null,
      attendantRelation || null,
      attendantPhone || null
    ]);
    return result.rows[0];
  }

  async getNextToken(facilityId: string, practitionerId?: string | null): Promise<string> {
    const query = `
      SELECT COUNT(*) + 1 as next_token
      FROM encounters
      WHERE facility_id = $1
        AND ($2::uuid IS NULL OR primary_practitioner_id = $2)
        AND encounter_type = 'opd'
        AND DATE(started_at) = CURRENT_DATE
    `;
    const result = await db.query(query, [facilityId, practitionerId || null]);
    const nextTokenNum = result.rows[0].next_token;

    let doctorCode = 'GEN';
    if (practitionerId) {
      const codeQuery = `
        SELECT s.staff_code 
        FROM practitioners p 
        JOIN staff s ON p.staff_id = s.id 
        WHERE p.id = $1
      `;
      const codeResult = await db.query(codeQuery, [practitionerId]);
      if (codeResult.rows.length > 0 && codeResult.rows[0].staff_code) {
        doctorCode = codeResult.rows[0].staff_code;
      }
    }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    return `T-${dd}${mm}${yy}-${doctorCode}-${String(nextTokenNum).padStart(2, '0')}`;
  }

  async getQueue(facilityId: string, practitionerId?: string, date?: string) {
    let query = `
      SELECT 
        e.*, 
        p.first_name, 
        p.last_name, 
        p.uhid,
        s.first_name as doc_first_name,
        s.last_name as doc_last_name,
        d.name as department_name
      FROM encounters e
      JOIN patients p ON e.patient_id = p.id
      LEFT JOIN practitioners pr ON e.primary_practitioner_id = pr.id
      LEFT JOIN staff s ON pr.staff_id = s.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.facility_id = $1
        AND e.encounter_type = 'opd'
    `;
    const params: any[] = [facilityId];
    let paramCount = 1;

    if (practitionerId) {
      paramCount++;
      query += ` AND e.primary_practitioner_id = $${paramCount}`;
      params.push(practitionerId);
    }

    if (date) {
      paramCount++;
      query += ` AND DATE(e.started_at) = $${paramCount}`;
      params.push(date);
    } else {
      query += ` AND DATE(e.started_at) = CURRENT_DATE`;
    }

    query += ` ORDER BY e.started_at ASC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  async updateStatus(encounterId: string, status: string, facilityId: string) {
    const query = `
      UPDATE encounters
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND facility_id = $3
      RETURNING *;
    `;
    const result = await db.query(query, [status, encounterId, facilityId]);
    return result.rows[0];
  }
}
