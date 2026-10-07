import { db } from '../../config/database';
import bcrypt from 'bcryptjs';

export class StaffRepository {
  async getDoctors(facilityId: string) {
    const query = `
      SELECT
        p.id as practitioner_id,
        s.id as staff_id,
        s.first_name,
        s.last_name,
        s.staff_code,
        s.department_id,
        p.specialty_id,
        p.registration_no,
        p.qualifications,
        s.is_active
      FROM practitioners p
      JOIN staff s ON p.staff_id = s.id
      WHERE s.organization_id = (SELECT organization_id FROM facilities WHERE id = $1 LIMIT 1)
        AND s.staff_type = 'doctor'
        AND s.is_active = true
    `;
    const result = await db.query(query, [facilityId]);
    return result.rows;
  }

  async getStaffList(organizationId: string) {
    const query = `
      SELECT s.*, u.username, u.email as user_email,
        (
          SELECT json_agg(json_build_object('id', r.id, 'name', r.name))
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = s.user_id
        ) as roles
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.organization_id = $1
      ORDER BY s.created_at DESC
    `;
    const result = await db.query(query, [organizationId]);
    return result.rows;
  }

  async getStaffById(organizationId: string, staffId: string) {
    const query = `
      SELECT s.*, u.username, u.email as user_email,
        (
          SELECT json_agg(json_build_object('id', r.id, 'name', r.name))
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = s.user_id
        ) as roles
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = $1 AND s.organization_id = $2
    `;
    const result = await db.query(query, [staffId, organizationId]);
    return result.rows[0];
  }

  async createStaff(organizationId: string, data: any) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      let userId = null;

      // 1. Create User
      if (data.create_user && data.email) {
        const username = data.email.split('@')[0]; // Simple username generation
        const fullName = `${data.first_name} ${data.last_name || ''}`.trim();
        const defaultPassword = data.password || 'Password@123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        const userQuery = `
          INSERT INTO users (organization_id, username, email, full_name, password_hash, default_facility_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        
        const userResult = await client.query(userQuery, [
          organizationId, 
          username, 
          data.email, 
          fullName, 
          passwordHash,
          data.default_facility_id || null
        ]);
        
        userId = userResult.rows[0].id;
        
        // Assign Roles
        if (data.role_ids && data.role_ids.length > 0) {
          const roleValues = data.role_ids.map((roleId: string, index: number) => `($1, $${index + 2})`).join(', ');
          const roleQuery = `INSERT INTO user_roles (user_id, role_id) VALUES ${roleValues}`;
          await client.query(roleQuery, [userId, ...data.role_ids]);
        }
      }

      // 2. Create Staff
      // Generate staff code if not provided
      let staffCode = data.staff_code;
      if (!staffCode) {
         const countResult = await client.query('SELECT COUNT(*) FROM staff WHERE organization_id = $1', [organizationId]);
         const count = parseInt(countResult.rows[0].count) + 1;
         staffCode = `EMP-${count.toString().padStart(4, '0')}`;
      }

      const staffQuery = `
        INSERT INTO staff (
          organization_id, user_id, department_id, staff_code, first_name, last_name, 
          staff_type, designation, phone, email, joined_on, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const staffResult = await client.query(staffQuery, [
        organizationId,
        userId,
        data.department_id || null,
        staffCode,
        data.first_name,
        data.last_name || null,
        data.staff_type,
        data.designation || null,
        data.phone || null,
        data.email || null,
        data.joined_on || null,
        data.is_active !== false
      ]);
      
      await client.query('COMMIT');
      return staffResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStaff(organizationId: string, staffId: string, data: any) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Update Staff Details
      const updates = [];
      const values = [organizationId, staffId];
      let paramIndex = 3;

      const allowedFields = ['department_id', 'first_name', 'last_name', 'staff_type', 'designation', 'phone', 'email', 'joined_on', 'left_on', 'is_active'];
      
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updates.push(`${field} = $${paramIndex}`);
          values.push(data[field]);
          paramIndex++;
        }
      }
      
      updates.push(`updated_at = NOW()`);
      
      if (updates.length > 0) {
        const query = `
          UPDATE staff 
          SET ${updates.join(', ')}
          WHERE organization_id = $1 AND id = $2
          RETURNING *
        `;
        await client.query(query, values);
      }

      // If user exists and roles need updating
      if (data.role_ids !== undefined) {
        const staffRes = await client.query('SELECT user_id FROM staff WHERE id = $1', [staffId]);
        const userId = staffRes.rows[0]?.user_id;
        
        if (userId) {
          await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
          if (data.role_ids && data.role_ids.length > 0) {
            const roleValues = data.role_ids.map((roleId: string, index: number) => `($1, $${index + 2})`).join(', ');
            const roleQuery = `INSERT INTO user_roles (user_id, role_id) VALUES ${roleValues}`;
            await client.query(roleQuery, [userId, ...data.role_ids]);
          }
        }
      }

      await client.query('COMMIT');
      return this.getStaffById(organizationId, staffId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
