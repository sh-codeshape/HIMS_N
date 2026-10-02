import { db } from '../../config/database';
import { PoolClient } from 'pg';

export class PatientRepository {
  async checkPhoneNameExists(organization_id: string, phone: string, first_name: string, last_name: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM patients 
      WHERE organization_id = $1 
      AND phone = $2 
      AND lower(first_name) = lower($3) 
      AND lower(last_name) = lower($4)
      LIMIT 1
    `;
    const result = await db.query(query, [organization_id, phone, first_name, last_name]);
    return (result.rowCount ?? 0) > 0;
  }

  async createPatient(
    client: PoolClient,
    data: {
      organization_id: string;
      uhid: string;
      first_name: string;
      middle_name?: string;
      last_name: string;
      gender: string;
      date_of_birth?: string;
      phone: string;
      email?: string;
      blood_group?: string;
    }
  ) {
    const query = `
      INSERT INTO patients (
        organization_id, uhid, first_name, middle_name, last_name, 
        gender, date_of_birth, phone, email, blood_group
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      data.organization_id,
      data.uhid,
      data.first_name,
      data.middle_name,
      data.last_name,
      data.gender,
      data.date_of_birth || null,
      data.phone,
      data.email,
      data.blood_group
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }

  async createPatientAddress(
    client: PoolClient,
    patient_id: string,
    data: { address_line1?: string; city?: string; state?: string; postal_code?: string; }
  ) {
    if (!data.address_line1 && !data.city && !data.state) return;
    
    const query = `
      INSERT INTO patient_addresses (patient_id, address_type, address_line1, city, state, postal_code, is_primary)
      VALUES ($1, 'home', $2, $3, $4, $5, true)
    `;
    await client.query(query, [patient_id, data.address_line1, data.city, data.state, data.postal_code]);
  }

  async searchPatients(organization_id: string, params: { query?: string; phone?: string; uhid?: string; limit: number; offset: number }) {
    let query = `
      SELECT id, uhid, first_name, middle_name, last_name, gender, date_of_birth, phone, email
      FROM patients
      WHERE organization_id = $1
    `;
    const values: any[] = [organization_id];
    let count = 2;

    if (params.uhid) {
      query += ` AND uhid ILIKE $${count++}`;
      values.push(`%${params.uhid}%`);
    }
    
    if (params.phone) {
      query += ` AND phone ILIKE $${count++}`;
      values.push(`%${params.phone}%`);
    }
    
    if (params.query) {
      query += ` AND full_name ILIKE $${count++}`;
      values.push(`%${params.query}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${count++} OFFSET $${count}`;
    values.push(params.limit, params.offset);

    const result = await db.query(query, values);
    return result.rows;
  }

  async getPatientById(id: string, organization_id: string) {
    const query = `
      SELECT p.*, 
        (SELECT json_agg(a.*) FROM patient_addresses a WHERE a.patient_id = p.id) as addresses
      FROM patients p
      WHERE p.id = $1 AND p.organization_id = $2
    `;
    const result = await db.query(query, [id, organization_id]);
    return result.rows[0] || null;
  }
}

export const patientRepository = new PatientRepository();
