import { db } from '../../config/database';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/errors/AppError';

export class RolesService {
  /* ------------------------------------------------------------
   * Roles (CRUD)
   * ------------------------------------------------------------ */

  async getRoles(organizationId: string) {
    const query = `
      SELECT id, code, name, description, is_system
      FROM roles
      WHERE organization_id = $1
      ORDER BY name ASC
    `;
    const result = await db.query(query, [organizationId]);
    return result.rows;
  }

  async createRole(organizationId: string, data: {
    code: string;
    name: string;
    description?: string;
    is_system?: boolean;
    createdBy?: string;
    updatedBy?: string;
  }) {
    const existing = await db.query(
      `SELECT id FROM roles WHERE organization_id = $1 AND code = $2`,
      [organizationId, data.code]
    );
    if (existing.rows.length > 0) {
      throw new ConflictError(`A role with code "${data.code}" already exists`);
    }

    const query = `
      INSERT INTO roles (organization_id, code, name, description, is_system, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, code, name, description, is_system
    `;
    const result = await db.query(query, [
      organizationId,
      data.code,
      data.name,
      data.description ?? null,
      data.is_system ?? false,
      data.createdBy,
      data.updatedBy,
    ]);
    return result.rows[0];
  }

  async updateRole(roleId: string, data: { name?: string; description?: string; updatedBy?: string }) {
    const role = await db.query(`SELECT id, is_system FROM roles WHERE id = $1`, [roleId]);
    if (role.rows.length === 0) {
      throw new NotFoundError('Role not found');
    }

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${i++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      sets.push(`description = $${i++}`);
      values.push(data.description);
    }
    sets.push(`updated_at = now()`);

    if (sets.length > 1) {
      values.push(roleId);
      const query = `UPDATE roles SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, code, name, description, is_system`;
      const result = await db.query(query, values);
      return result.rows[0];
    }

    return role.rows[0];
  }

  async deleteRole(roleId: string) {
    const role = await db.query(`SELECT id, is_system FROM roles WHERE id = $1`, [roleId]);
    if (role.rows.length === 0) {
      throw new NotFoundError('Role not found');
    }
    if (role.rows[0].is_system) {
      throw new ForbiddenError('System roles cannot be deleted');
    }

    const assigned = await db.query(
      `SELECT 1 FROM user_roles WHERE role_id = $1 LIMIT 1`,
      [roleId]
    );
    if (assigned.rows.length > 0) {
      throw new ConflictError('Cannot delete a role that is assigned to one or more users');
    }

    await db.query(`DELETE FROM roles WHERE id = $1`, [roleId]);
    return { success: true };
  }

  /* ------------------------------------------------------------
   * Permissions (catalog)
   * ------------------------------------------------------------ */

  async getPermissions() {
    const query = `
      SELECT id, code, module, description
      FROM permissions
      ORDER BY module ASC, code ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async getRolePermissions(roleId: string) {
    const query = `
      SELECT p.id, p.code, p.module, p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
      ORDER BY p.module ASC, p.code ASC
    `;
    const result = await db.query(query, [roleId]);
    return result.rows;
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await db.query(`SELECT id FROM roles WHERE id = $1`, [roleId]);
    if (role.rows.length === 0) {
      throw new NotFoundError('Role not found');
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

      if (permissionIds.length > 0) {
        const values = permissionIds.map((id, index) => `($1, $${index + 2})`).join(', ');
        const query = `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`;
        await client.query(query, [roleId, ...permissionIds]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /* ------------------------------------------------------------
   * Users <-> Roles
   * ------------------------------------------------------------ */

  async getUsersWithRoles(organizationId: string) {
    const query = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.is_active,
        u.is_superadmin,
        u.default_facility_id,
        COALESCE(array_agg(r.code) FILTER (WHERE r.id IS NOT NULL), '{}') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.organization_id = $1
      GROUP BY u.id
      ORDER BY u.full_name ASC, u.username ASC
    `;
    const result = await db.query(query, [organizationId]);
    return result.rows;
  }

  async getUserById(userId: string) {
    const user = await db.query(
      `SELECT id, username, email, full_name, is_active, is_superadmin, default_facility_id, organization_id
       FROM users WHERE id = $1`,
      [userId]
    );
    if (user.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    return user.rows[0];
  }

  async getRoleUsers(roleId: string) {
    const query = `
      SELECT u.id, u.username, u.email, u.full_name, u.is_active
      FROM user_roles ur
      JOIN users u ON u.id = ur.user_id
      WHERE ur.role_id = $1
      ORDER BY u.full_name ASC
    `;
    const result = await db.query(query, [roleId]);
    return result.rows;
  }

  async getUserRoles(userId: string) {
    const query = `
      SELECT r.id, r.code, r.name, r.description, r.is_system
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY r.name ASC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  async assignUserRole(userId: string, roleId: string, facilityId?: string | null) {
    const user = await db.query(
      `SELECT id, organization_id FROM users WHERE id = $1`,
      [userId]
    );
    if (user.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const role = await db.query(
      `SELECT id, organization_id FROM roles WHERE id = $1`,
      [roleId]
    );
    if (role.rows.length === 0) {
      throw new NotFoundError('Role not found');
    }

    if (role.rows[0].organization_id !== user.rows[0].organization_id) {
      throw new ConflictError('User and role must belong to the same organization');
    }

    const query = `
      INSERT INTO user_roles (user_id, role_id, facility_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING
      RETURNING id
    `;
    const result = await db.query(query, [userId, roleId, facilityId ?? null]);
    return result.rows[0];
  }

  async removeUserRole(userId: string, roleId: string) {
    const result = await db.query(
      `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING id`,
      [userId, roleId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('User is not assigned to this role');
    }
    return { success: true };
  }

  /* ------------------------------------------------------------
   * Users <-> Permissions (direct grants, independent of roles)
   * ------------------------------------------------------------ */

  async getUserPermissions(userId: string) {
    const user = await db.query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (user.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const query = `
      SELECT DISTINCT p.id, p.code, p.module, p.description,
             CASE WHEN up.id IS NOT NULL THEN 'direct' ELSE 'role' END AS source
      FROM (
        SELECT rp.permission_id
        FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        WHERE ur.user_id = $1
        UNION
        SELECT up.permission_id
        FROM user_permissions up
        WHERE up.user_id = $1
          AND (up.expires_at IS NULL OR up.expires_at > now())
      ) granted
      JOIN permissions p ON p.id = granted.permission_id
      LEFT JOIN user_permissions up ON up.user_id = $1 AND up.permission_id = p.id
      ORDER BY p.module ASC, p.code ASC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  async grantUserPermission(userId: string, permissionId: string, grantedBy?: string | null, expiresAt?: string | null) {
    const user = await db.query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (user.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const permission = await db.query(`SELECT id FROM permissions WHERE id = $1`, [permissionId]);
    if (permission.rows.length === 0) {
      throw new NotFoundError('Permission not found');
    }

    const query = `
      INSERT INTO user_permissions (user_id, permission_id, granted_by, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, permission_id) DO UPDATE
        SET granted_by = EXCLUDED.granted_by,
            granted_at = now(),
            expires_at = EXCLUDED.expires_at
      RETURNING id
    `;
    const result = await db.query(query, [userId, permissionId, grantedBy ?? null, expiresAt ?? null]);
    return result.rows[0];
  }

  async revokeUserPermission(userId: string, permissionId: string) {
    const result = await db.query(
      `DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2 RETURNING id`,
      [userId, permissionId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('User does not have this direct permission');
    }
    return { success: true };
  }
}
