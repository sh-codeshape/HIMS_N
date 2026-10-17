import { db } from '../../config/database';
import { PoolClient } from 'pg';

export interface UserRecord {
  id: string;
  organization_id: string;
  default_facility_id?: string | null;
  username: string;
  email?: string | null;
  password_hash: string;
  full_name: string;
  is_active: boolean;
  is_superadmin?: boolean;
  phone?: string | null;
}

const rolesQueryText = `
  SELECT r.code
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = $1
`;

export class AuthRepository {
  async findByUsername(username: string): Promise<UserRecord | null> {
    const query = `
      SELECT
        u.id,
        u.organization_id,
        COALESCE(
          NULLIF(u.default_facility_id, '00000000-0000-0000-0000-000000000000'::uuid),
          (
            SELECT f.id
            FROM public.facilities f
            WHERE f.organization_id = u.organization_id
            ORDER BY f.created_at ASC
            LIMIT 1
          )
        ) AS default_facility_id,
        u.username,
        u.email,
        u.password_hash,
        u.full_name,
        u.is_active,
        u.is_superadmin
      FROM public.users u
      WHERE u.username = $1 OR u.email = $1
    `;
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  }

  async createUser(
    client: PoolClient,
    data: {
      organization_id: string;
      username: string;
      password_hash: string;
      full_name: string;
      email?: string;
      phone?: string;
      is_superadmin?: boolean;
    }
  ): Promise<UserRecord> {
    const query = `
      INSERT INTO users (
        organization_id, username, password_hash, full_name, email, phone, is_superadmin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, organization_id, default_facility_id, username, email, password_hash, full_name, is_active, is_superadmin
    `;
    const values = [
      data.organization_id,
      data.username,
      data.password_hash,
      data.full_name,
      data.email ?? null,
      data.phone ?? null,
      data.is_superadmin ?? false,
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }

  async getUserRolesAndPermissions(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
    const rolesResult = await db.query(rolesQueryText, [userId]);
    const roles = rolesResult.rows.map((row) => row.code);

    const permissionsQuery = `
      SELECT DISTINCT p.code
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = $1
    `;
    const permissionsResult = await db.query(permissionsQuery, [userId]);
    const permissions = permissionsResult.rows.map((row) => row.code);

    return { roles, permissions };
  }

  /**
   * Effective permissions = role-inherited permissions UNION direct user grants.
   * Direct grants are what a super admin assigns to a specific user so that
   * the user can see certain pages regardless of their roles.
   */
  async getUserEffectivePermissions(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
    const rolesResult = await db.query(rolesQueryText, [userId]);
    const roles = rolesResult.rows.map((row) => row.code);

    const permissionsQuery = `
      SELECT DISTINCT p.code
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
    `;
    const permissionsResult = await db.query(permissionsQuery, [userId]);
    const permissions = permissionsResult.rows.map((row) => row.code);

    return { roles, permissions };
  }
}

export const authRepository = new AuthRepository();
