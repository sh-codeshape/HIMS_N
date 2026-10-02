import { db } from '../../config/database';

export class OpdRepository {
  async createEncounter(
    facilityId: string,
    organizationId: string,
    patientId: string,
    practitionerId: string,
    departmentId?: string,
    chiefComplaint?: string,
    tokenNumber?: string
  ) {
    const customFields = tokenNumber ? { opd_token: tokenNumber } : {};

    const query = `
      INSERT INTO encounters (
        facility_id,
        organization_id,
        patient_id,
        primary_practitioner_id,
        department_id,
        encounter_type,
        status,
        chief_complaint,
        custom_fields,
        encounter_no
      ) VALUES ($1, $2, $3, $4, $5, 'opd', 'arrived', $6, $7, $8)
      RETURNING *;
    `;
    const encounterNo = `OPD-${Date.now()}`; // Temporary till we fix sequence

    const result = await db.query(query, [
      facilityId,
      organizationId,
      patientId,
      practitionerId,
      departmentId,
      chiefComplaint,
      JSON.stringify(customFields),
      encounterNo
    ]);
    return result.rows[0];
  }

  async getNextToken(facilityId: string, practitionerId: string): Promise<string> {
    const query = `
      SELECT COUNT(*) + 1 as next_token
      FROM encounters
      WHERE facility_id = $1
        AND primary_practitioner_id = $2
        AND encounter_type = 'opd'
        AND DATE(started_at) = CURRENT_DATE
    `;
    const result = await db.query(query, [facilityId, practitionerId]);
    return `T-${String(result.rows[0].next_token).padStart(2, '0')}`;
  }

  async getQueue(facilityId: string, practitionerId?: string, date?: string) {
    let query = `
      SELECT e.*, p.first_name, p.last_name, p.uhid
      FROM encounters e
      JOIN patients p ON e.patient_id = p.id
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
