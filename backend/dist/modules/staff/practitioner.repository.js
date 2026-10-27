"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PractitionerRepository = void 0;
const database_1 = require("../../config/database");
class PractitionerRepository {
    async getPractitioners(facilityId) {
        const query = `
      SELECT
        p.id as practitioner_id,
        p.id,
        s.id as staff_id,
        s.first_name,
        s.last_name,
        TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) as name,
        s.staff_code,
        s.department_id,
        d.name as department,
        p.specialty_id,
        p.registration_no,
        p.qualifications as qualification,
        p.experience_years,
        s.designation as role,
        s.phone,
        s.email,
        s.is_active,
        s.custom_fields,
        COALESCE((s.custom_fields->>'consultation_fee')::numeric, 500) as consultation_fee,
        COALESCE((s.custom_fields->>'old_patient_fee')::numeric, 300) as old_patient_fee,
        COALESCE((s.custom_fields->>'emergency_fee')::numeric, 800) as emergency_fee,
        s.custom_fields->>'name_hindi' as "nameHindi",
        s.custom_fields->>'qualification_hindi' as "qualificationHindi",
        s.custom_fields->>'specialization_hindi' as "specializationHindi",
        COALESCE(s.custom_fields->>'specialization', d.name, 'General Medicine') as specialization,
        s.custom_fields->>'specialty' as specialty,
        COALESCE(s.custom_fields->>'experience', CONCAT(p.experience_years, ' Years')) as experience,
        s.custom_fields->>'gender' as gender,
        s.custom_fields->>'display_schedule' as "displaySchedule",
        COALESCE((s.custom_fields->>'max_new_patients')::int, 40) as "maxNewPatients",
        COALESCE((s.custom_fields->>'max_old_patients')::int, 30) as "maxOldPatients",
        s.custom_fields->>'address' as address,
        s.custom_fields->>'avatar' as avatar
      FROM practitioners p
      JOIN staff s ON p.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE s.organization_id = (SELECT organization_id FROM facilities WHERE id = $1 LIMIT 1)
      ORDER BY s.is_active DESC, s.first_name ASC
    `;
        const result = await database_1.db.query(query, [facilityId]);
        return result.rows;
    }
    async createPractitioner(organizationId, facilityId, data) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            const nameParts = (data.name || '').trim().split(/\s+/);
            const firstName = nameParts[0] || 'Dr.';
            const lastName = nameParts.slice(1).join(' ') || null;
            const countResult = await client.query('SELECT COUNT(*) FROM staff WHERE organization_id = $1', [organizationId]);
            const count = parseInt(countResult.rows[0].count) + 1;
            const staffCode = `DOC-${count.toString().padStart(4, '0')}`;
            // Resolve or auto-provision department_id from specialization
            let departmentId = data.department_id || null;
            const specName = data.specialization || 'General Medicine';
            if (!departmentId && specName) {
                try {
                    const deptCheck = await client.query(`SELECT id FROM departments 
             WHERE organization_id = $1 AND (LOWER(name) = LOWER($2) OR LOWER(code) = LOWER($2)) 
             LIMIT 1`, [organizationId, specName]);
                    if (deptCheck.rows.length > 0) {
                        departmentId = deptCheck.rows[0].id;
                    }
                    else {
                        const baseCode = specName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase() || 'DEPT';
                        const deptCountRes = await client.query('SELECT COUNT(*) FROM departments WHERE facility_id = $1', [facilityId]);
                        const deptCode = `${baseCode}-${(parseInt(deptCountRes.rows[0]?.count || '0') + 1).toString().padStart(2, '0')}`;
                        const newDeptRes = await client.query(`INSERT INTO departments (
                 organization_id, facility_id, code, name, department_type, is_active
               )
               VALUES ($1, $2, $3, $4, 'clinical', true)
               RETURNING id`, [organizationId, facilityId, deptCode, specName]);
                        if (newDeptRes.rows.length > 0) {
                            departmentId = newDeptRes.rows[0].id;
                        }
                    }
                }
                catch (err) {
                    console.warn('Could not auto-link department:', err);
                }
            }
            const customFields = {
                name_hindi: data.nameHindi || '',
                qualification_hindi: data.qualificationHindi || '',
                specialization_hindi: data.specializationHindi || '',
                specialization: data.specialization || 'General Medicine',
                specialty: data.specialty || '',
                experience: data.experience || '',
                consultation_fee: Number(data.consultation_fee || 500),
                old_patient_fee: Number(data.old_patient_fee || 300),
                emergency_fee: Number(data.emergency_fee || 800),
                gender: data.gender || 'male',
                display_schedule: data.displaySchedule || '',
                max_new_patients: Number(data.maxNewPatients || 40),
                max_old_patients: Number(data.maxOldPatients || 30),
                address: data.address || '',
                avatar: data.avatar || '',
            };
            const staffQuery = `
        INSERT INTO staff (
          organization_id, department_id, staff_code, first_name, last_name, 
          staff_type, designation, phone, email, is_active, custom_fields
        )
        VALUES ($1, $2, $3, $4, $5, 'doctor', $6, $7, $8, true, $9)
        RETURNING *
      `;
            const staffResult = await client.query(staffQuery, [
                organizationId,
                departmentId,
                staffCode,
                firstName,
                lastName,
                data.role || 'Doctor',
                data.phone || null,
                data.email || null,
                JSON.stringify(customFields),
            ]);
            const staffId = staffResult.rows[0].id;
            const practitionerQuery = `
        INSERT INTO practitioners (
          staff_id, registration_no, qualifications, experience_years, bio
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
            const pResult = await client.query(practitionerQuery, [
                staffId,
                data.registration_no || null,
                data.qualification || 'MBBS',
                parseInt(data.experience) || null,
                data.specialty || null,
            ]);
            await client.query('COMMIT');
            return {
                id: pResult.rows[0].id,
                practitioner_id: pResult.rows[0].id,
                staff_id: staffId,
                name: data.name,
                is_active: true,
                ...data,
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async updatePractitioner(practitionerId, data) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            const pCheck = await client.query('SELECT staff_id FROM practitioners WHERE id = $1', [practitionerId]);
            if (pCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }
            const staffId = pCheck.rows[0].staff_id;
            // Update practitioner
            if (data.qualification !== undefined) {
                await client.query('UPDATE practitioners SET qualifications = $1, updated_at = NOW() WHERE id = $2', [
                    data.qualification,
                    practitionerId,
                ]);
            }
            // Update staff details and custom_fields
            const currentStaffRes = await client.query('SELECT * FROM staff WHERE id = $1', [staffId]);
            const currentStaff = currentStaffRes.rows[0] || {};
            const currentCustom = currentStaff.custom_fields || {};
            const updatedCustom = {
                ...currentCustom,
                ...(data.nameHindi !== undefined && { name_hindi: data.nameHindi }),
                ...(data.qualificationHindi !== undefined && { qualification_hindi: data.qualificationHindi }),
                ...(data.specializationHindi !== undefined && { specialization_hindi: data.specializationHindi }),
                ...(data.specialization !== undefined && { specialization: data.specialization }),
                ...(data.specialty !== undefined && { specialty: data.specialty }),
                ...(data.experience !== undefined && { experience: data.experience }),
                ...(data.consultation_fee !== undefined && { consultation_fee: Number(data.consultation_fee) }),
                ...(data.old_patient_fee !== undefined && { old_patient_fee: Number(data.old_patient_fee) }),
                ...(data.emergency_fee !== undefined && { emergency_fee: Number(data.emergency_fee) }),
                ...(data.gender !== undefined && { gender: data.gender }),
                ...(data.displaySchedule !== undefined && { display_schedule: data.displaySchedule }),
                ...(data.maxNewPatients !== undefined && { max_new_patients: Number(data.maxNewPatients) }),
                ...(data.maxOldPatients !== undefined && { max_old_patients: Number(data.maxOldPatients) }),
                ...(data.address !== undefined && { address: data.address }),
                ...(data.avatar !== undefined && { avatar: data.avatar }),
            };
            let firstName = currentStaff.first_name;
            let lastName = currentStaff.last_name;
            if (data.name) {
                const parts = data.name.trim().split(/\s+/);
                firstName = parts[0];
                lastName = parts.slice(1).join(' ') || null;
            }
            let departmentId = data.department_id;
            if (departmentId === undefined && data.specialization) {
                try {
                    const deptCheck = await client.query(`SELECT id FROM departments 
             WHERE (LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($1)) 
             LIMIT 1`, [data.specialization]);
                    if (deptCheck.rows.length > 0) {
                        departmentId = deptCheck.rows[0].id;
                    }
                }
                catch (err) {
                    console.warn('Could not auto-link department on update:', err);
                }
            }
            await client.query(`UPDATE staff 
         SET first_name = $1, last_name = $2, designation = COALESCE($3, designation), 
             phone = COALESCE($4, phone), email = COALESCE($5, email),
             is_active = COALESCE($6, is_active), custom_fields = $7,
             department_id = COALESCE($8, department_id),
             updated_at = NOW()
         WHERE id = $9`, [
                firstName,
                lastName,
                data.role || null,
                data.phone || null,
                data.email || null,
                data.is_active !== undefined ? data.is_active : null,
                JSON.stringify(updatedCustom),
                departmentId || null,
                staffId,
            ]);
            await client.query('COMMIT');
            return {
                id: practitionerId,
                practitioner_id: practitionerId,
                staff_id: staffId,
                ...data,
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async togglePractitioner(practitionerId) {
        const query = `
      UPDATE staff
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = (SELECT staff_id FROM practitioners WHERE id = $1)
      RETURNING id, is_active
    `;
        const result = await database_1.db.query(query, [practitionerId]);
        return result.rows[0];
    }
    async deletePractitioner(practitionerId) {
        const query = `
      UPDATE staff
      SET is_active = false, updated_at = NOW()
      WHERE id = (SELECT staff_id FROM practitioners WHERE id = $1)
      RETURNING id
    `;
        const result = await database_1.db.query(query, [practitionerId]);
        return result.rows[0];
    }
    async getSchedules(practitionerId, facilityId) {
        const query = `
      SELECT * FROM practitioner_schedules
      WHERE practitioner_id = $1 AND facility_id = $2
      ORDER BY day_of_week ASC, start_time ASC
    `;
        const result = await database_1.db.query(query, [practitionerId, facilityId]);
        return result.rows;
    }
    async createSchedule(data) {
        const query = `
      INSERT INTO practitioner_schedules (
        practitioner_id, facility_id, department_id, day_of_week, 
        start_time, end_time, slot_minutes, consultation_mode, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `;
        const result = await database_1.db.query(query, [
            data.practitioner_id,
            data.facility_id,
            data.department_id || null,
            data.day_of_week,
            data.start_time,
            data.end_time,
            data.slot_minutes || 15,
            data.consultation_mode || 'both'
        ]);
        return result.rows[0];
    }
    async updateSchedule(scheduleId, data) {
        const updates = [];
        const values = [scheduleId];
        let paramIndex = 2;
        const allowedFields = ['day_of_week', 'start_time', 'end_time', 'slot_minutes', 'consultation_mode', 'is_active'];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = $${paramIndex}`);
                values.push(data[field]);
                paramIndex++;
            }
        }
        if (updates.length === 0)
            return null;
        const query = `
      UPDATE practitioner_schedules 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
        const result = await database_1.db.query(query, values);
        return result.rows[0];
    }
    async deleteSchedule(scheduleId) {
        const query = `DELETE FROM practitioner_schedules WHERE id = $1 RETURNING id`;
        const result = await database_1.db.query(query, [scheduleId]);
        return result.rows[0];
    }
}
exports.PractitionerRepository = PractitionerRepository;
