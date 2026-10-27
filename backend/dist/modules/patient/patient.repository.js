"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientRepository = exports.PatientRepository = void 0;
const database_1 = require("../../config/database");
class PatientRepository {
    async getNextUHIDSerial() {
        const result = await database_1.db.query(`SELECT nextval('uhid_seq') AS next_serial`);
        return Number(result.rows[0].next_serial);
    }
    async checkPhoneNameExists(organization_id, phone, first_name, last_name) {
        const query = `
      SELECT 1 FROM patients 
      WHERE organization_id = $1 
      AND phone = $2 
      AND lower(first_name) = lower($3) 
      AND lower(last_name) = lower($4)
      LIMIT 1
    `;
        const result = await database_1.db.query(query, [organization_id, phone, first_name, last_name]);
        return (result.rowCount ?? 0) > 0;
    }
    async createPatient(client, data) {
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
    async createPatientAddress(client, patient_id, data) {
        if (!data.address_line1 && !data.city && !data.state)
            return;
        const countryCode = (() => {
            const raw = (data.country ?? 'IN').trim();
            if (!raw)
                return 'IN';
            const upper = raw.toUpperCase();
            if (/^[A-Z]{2}$/.test(upper))
                return upper;
            const map = {
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
    async createPatientIdentifier(client, organization_id, patient_id, id_type, id_value) {
        if (!id_value)
            return;
        const query = `
      INSERT INTO patient_identifiers (organization_id, patient_id, id_type, id_value)
      VALUES ($1, $2, $3, $4)
    `;
        await client.query(query, [organization_id, patient_id, id_type, id_value]);
    }
    async createPatientContact(client, patient_id, name, relationship, phone) {
        if (!name)
            return;
        const query = `
      INSERT INTO patient_contacts (patient_id, name, relationship, phone, is_emergency_contact)
      VALUES ($1, $2, $3, $4, true)
    `;
        await client.query(query, [patient_id, name, relationship || null, phone || null]);
    }
    async searchPatients(organization_id, params) {
        let query = `
      SELECT p.*,
             EXTRACT(YEAR FROM AGE(p.date_of_birth))::int AS age,
             (SELECT json_agg(a.*) FROM patient_addresses a WHERE a.patient_id = p.id AND a.is_primary = true) as addresses
      FROM patients p
      WHERE p.organization_id = $1 AND p.deleted_at IS NULL
    `;
        const values = [organization_id];
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
        const result = await database_1.db.query(query, values);
        return result.rows;
    }
    async getPatientById(id, organization_id) {
        const query = `
      SELECT p.*, 
             EXTRACT(YEAR FROM AGE(p.date_of_birth))::int AS age,
             (SELECT json_agg(a.*) FROM patient_addresses a WHERE a.patient_id = p.id) as addresses
      FROM patients p
      WHERE p.id = $1 AND (p.organization_id = $2 OR p.organization_id IS NULL) AND p.deleted_at IS NULL
    `;
        let result = await database_1.db.query(query, [id, organization_id]);
        if (!result.rows[0]) {
            const fallback = await database_1.db.query(`SELECT p.*, EXTRACT(YEAR FROM AGE(p.date_of_birth))::int AS age,
                (SELECT json_agg(a.*) FROM patient_addresses a WHERE a.patient_id = p.id) as addresses
         FROM patients p WHERE p.id = $1 AND p.deleted_at IS NULL`, [id]);
            return fallback.rows[0] || null;
        }
        return result.rows[0] || null;
    }
    async getFamilyMembers(family_head_id, organization_id) {
        const query = `
      SELECT id, uhid, first_name, last_name, relation_to_head, phone
      FROM patients
      WHERE (id = $1 OR family_head_id = $1) AND organization_id = $2 AND deleted_at IS NULL
    `;
        const result = await database_1.db.query(query, [family_head_id, organization_id]);
        return result.rows;
    }
    async updatePatient(id, organization_id, data) {
        const fields = [];
        const values = [id, organization_id];
        let count = 3;
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                if (key === 'custom_fields') {
                    fields.push(`${key} = $${count}::jsonb`);
                    values.push(JSON.stringify(value));
                }
                else {
                    fields.push(`${key} = $${count}`);
                    values.push(value);
                }
                count++;
            }
        }
        if (fields.length === 0)
            return this.getPatientById(id, organization_id);
        const query = `
      UPDATE patients
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
      RETURNING *
    `;
        const result = await database_1.db.query(query, values);
        return result.rows[0] || null;
    }
    async updatePatientAddress(patientId, data) {
        const payload = {
            address_line1: data.address_line1 ?? '',
            city: data.city ?? '',
            state: data.state ?? '',
            postal_code: data.postal_code ?? '',
            country: data.country ?? 'IN',
        };
        const hasAddressData = Object.values(payload).some((value) => String(value).trim().length > 0);
        if (!hasAddressData)
            return null;
        const countryCode = (() => {
            const raw = payload.country.trim();
            if (!raw)
                return 'IN';
            const upper = raw.toUpperCase();
            if (/^[A-Z]{2}$/.test(upper))
                return upper;
            return {
                india: 'IN',
                'united states': 'US',
                'united states of america': 'US',
                usa: 'US',
                'united kingdom': 'GB',
                uk: 'GB',
                canada: 'CA',
                australia: 'AU',
            }[raw.toLowerCase()] ?? 'IN';
        })();
        const updateQuery = `
      UPDATE patient_addresses
      SET line1 = COALESCE(NULLIF($2, ''), line1),
          city = COALESCE(NULLIF($3, ''), city),
          state = COALESCE(NULLIF($4, ''), state),
          postal_code = COALESCE(NULLIF($5, ''), postal_code),
          country = COALESCE(NULLIF($6, ''), country),
          updated_at = NOW()
      WHERE patient_id = $1 AND is_primary = true
      RETURNING *;
    `;
        const updateResult = await database_1.db.query(updateQuery, [patientId, payload.address_line1, payload.city, payload.state, payload.postal_code, countryCode]);
        if ((updateResult.rowCount ?? 0) > 0)
            return updateResult.rows[0];
        const insertQuery = `
      INSERT INTO patient_addresses (patient_id, address_type, line1, city, state, postal_code, country, is_primary)
      VALUES ($1, 'home', $2, $3, $4, $5, $6, true)
      RETURNING *;
    `;
        const insertResult = await database_1.db.query(insertQuery, [patientId, payload.address_line1 || null, payload.city || null, payload.state || null, payload.postal_code || null, countryCode]);
        return insertResult.rows[0] || null;
    }
    async deletePatient(id, organization_id) {
        const query = `
      UPDATE patients 
      SET deleted_at = NOW(), updated_at = NOW() 
      WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL 
      RETURNING id
    `;
        const result = await database_1.db.query(query, [id, organization_id]);
        return (result.rowCount ?? 0) > 0;
    }
}
exports.PatientRepository = PatientRepository;
exports.patientRepository = new PatientRepository();
