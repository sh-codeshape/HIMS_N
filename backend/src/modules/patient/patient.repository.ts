import { db } from '../../config/database';
import { PoolClient } from 'pg';

export class PatientRepository {
  async getNextUHIDSerial(): Promise<number> {
    const result = await db.query(`SELECT nextval('uhid_seq') AS next_serial`);
    return Number(result.rows[0].next_serial);
  }

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
      last_name?: string;
      gender: string;
      date_of_birth?: string;
      phone: string;
      email?: string;
      blood_group?: string;
      marital_status?: string;
      occupation?: string;
      nationality?: string;
      alternate_phone?: string;
      family_head_id?: string;
      relation_to_head?: string;
      custom_fields?: any;
    }
  ) {
    const query = `
      INSERT INTO patients (
        organization_id, uhid, first_name, middle_name, last_name, 
        gender, date_of_birth, phone, email, blood_group,
        marital_status, occupation, nationality, alternate_phone,
        family_head_id, relation_to_head, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
    const values = [
      data.organization_id,
      data.uhid,
      data.first_name,
      data.middle_name || null,
      data.last_name || null,
      data.gender,
      data.date_of_birth || null,
      data.phone,
      data.email || null,
      data.blood_group || null,
      data.marital_status || null,
      data.occupation || null,
      data.nationality || null,
      data.alternate_phone || null,
      data.family_head_id || null,
      data.relation_to_head || null,
      data.custom_fields ? JSON.stringify(data.custom_fields) : '{}'
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }

  async createPatientAddress(
    client: PoolClient,
    patient_id: string,
    data: { address_line1?: string; city?: string; state?: string; postal_code?: string; country?: string; }
  ) {
    if (!data.address_line1 && !data.city && !data.state) return;

    const countryCode = (() => {
      const raw = (data.country ?? 'IN').trim();
      if (!raw) return 'IN';
      const upper = raw.toUpperCase();
      if (/^[A-Z]{2}$/.test(upper)) return upper;
      const map: Record<string, string> = {
        india: 'IN',
        'united states': 'US',
        'united states of america': 'US',
        usa: 'US',
        'united kingdom': 'GB',
        uk: 'GB',
        canada: 'CA',
        australia: 'AU',
      };
      return map[raw.toLowerCase()] ?? 'IN';
    })();
    
    const query = `
      INSERT INTO patient_addresses (patient_id, address_type, line1, city, state, postal_code, country, is_primary)
      VALUES ($1, 'home', $2, $3, $4, $5, $6, true)
    `;
    await client.query(query, [patient_id, data.address_line1, data.city, data.state, data.postal_code, countryCode]);
  }

  async createPatientIdentifier(
    client: PoolClient,
    organization_id: string,
    patient_id: string,
    id_type: string,
    id_value: string
  ) {
    if (!id_value) return;
    const query = `
      INSERT INTO patient_identifiers (organization_id, patient_id, id_type, id_value)
      VALUES ($1, $2, $3, $4)
    `;
    await client.query(query, [organization_id, patient_id, id_type, id_value]);
  }

  async createPatientContact(
    client: PoolClient,
    patient_id: string,
    name: string,
    relationship?: string,
    phone?: string
  ) {
    if (!name) return;
    const query = `
      INSERT INTO patient_contacts (patient_id, name, relationship, phone, is_emergency_contact)
      VALUES ($1, $2, $3, $4, true)
    `;
    await client.query(query, [patient_id, name, relationship || null, phone || null]);
  }

  async searchPatients(organization_id: string, params: { query?: string; phone?: string; uhid?: string; limit: number; offset: number }) {
    let query = `
      SELECT id, uhid, first_name, middle_name, last_name, full_name, gender, date_of_birth,
             EXTRACT(YEAR FROM AGE(date_of_birth))::int AS age, phone, email, blood_group, created_at, custom_fields, status
      FROM patients
      WHERE organization_id = $1 AND deleted_at IS NULL
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
      query += ` AND (
        first_name ILIKE $${count} 
        OR last_name ILIKE $${count} 
        OR CONCAT(first_name, ' ', last_name) ILIKE $${count}
        OR full_name ILIKE $${count} 
        OR uhid ILIKE $${count} 
        OR phone ILIKE $${count}
      )`;
      values.push(`%${params.query}%`);
      count++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${count++} OFFSET $${count}`;
    values.push(params.limit, params.offset);

    const result = await db.query(query, values);
    return result.rows;
  }

  async getPatientById(id: string, organization_id: string) {
    const query = `
      SELECT p.*, 
             EXTRACT(YEAR FROM AGE(p.date_of_birth))::int AS age,
             (SELECT json_agg(a.*) FROM patient_addresses a WHERE a.patient_id = p.id) as addresses
      FROM patients p
      WHERE p.id = $1 AND p.organization_id = $2 AND p.deleted_at IS NULL
    `;
    const result = await db.query(query, [id, organization_id]);
    return result.rows[0] || null;
  }

  async getFamilyMembers(family_head_id: string, organization_id: string) {
    const query = `
      SELECT id, uhid, first_name, last_name, relation_to_head, phone
      FROM patients
      WHERE (id = $1 OR family_head_id = $1) AND organization_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [family_head_id, organization_id]);
    return result.rows;
  }

  async updatePatient(id: string, organization_id: string, data: Partial<any>) {
    const fields: string[] = [];
    const values: any[] = [id, organization_id];
    let count = 3;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (key === 'custom_fields') {
            fields.push(`${key} = $${count}::jsonb`);
            values.push(JSON.stringify(value));
        } else {
            fields.push(`${key} = $${count}`);
            values.push(value);
        }
        count++;
      }
    }

    if (fields.length === 0) return this.getPatientById(id, organization_id);

    const query = `
      UPDATE patients
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  async deletePatient(id: string, organization_id: string) {
    const query = `
      UPDATE patients 
      SET deleted_at = NOW(), updated_at = NOW() 
      WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL 
      RETURNING id
    `;
    const result = await db.query(query, [id, organization_id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const patientRepository = new PatientRepository();
