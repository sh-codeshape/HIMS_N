import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository';
import { LoginRequest, RegisterRequest } from './auth.schema';
import { UnauthorizedError, ConflictError } from '../../shared/errors/AppError';
import { db } from '../../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const JWT_EXPIRES_IN = '24h';

export class AuthService {
  async login(data: LoginRequest) {
    const user = await authRepository.findByUsername(data.username);

    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid credentials or inactive user');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const { roles, permissions } = await authRepository.getUserEffectivePermissions(user.id);
    const enabledModules = await authRepository.getEnabledModules();
    
    // Fallback or explicit injection of super_admin role if is_superadmin is true
    const assignedRoles = user.is_superadmin && !roles.includes('super_admin') 
      ? ['super_admin', ...roles] 
      : roles;

    // Default role logic to keep frontend compatibility for now
    const primaryRole = user.is_superadmin ? 'super_admin' : (assignedRoles[0] || 'admin');

    // Ensure the resolved primary role is always present in the assigned roles list,
    // so role-based guards (frontend + token consumers) don't see an empty array.
    if (!assignedRoles.includes(primaryRole)) {
      assignedRoles.unshift(primaryRole);
    }

    const zeroUuid = '00000000-0000-0000-0000-000000000000';
    let facilityId = user.default_facility_id && user.default_facility_id !== zeroUuid
      ? user.default_facility_id
      : undefined;

    if (!facilityId) {
      const facRes = await db.query(
        `SELECT id FROM facilities 
         WHERE (organization_id = $1 OR id != '00000000-0000-0000-0000-000000000000'::uuid) 
           AND id != '00000000-0000-0000-0000-000000000000'::uuid 
           AND is_active = true 
         ORDER BY (CASE WHEN organization_id = $1 THEN 0 ELSE 1 END), created_at ASC 
         LIMIT 1`,
        [user.organization_id]
      );
      if (facRes.rows.length > 0) {
        facilityId = facRes.rows[0].id;
        await db.query(`UPDATE users SET default_facility_id = $1 WHERE id = $2`, [facilityId, user.id]);
      }
    }

    if (!facilityId) {
      throw new UnauthorizedError('This user is not assigned to a valid facility. Please seed or assign a facility first.');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
        organization_id: user.organization_id,
        facilityId,
        facility_id: facilityId,
        roles: assignedRoles,
        permissions,
        enabledModules,
        isDeveloper: assignedRoles.includes('developer'),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const name = user.full_name || user.username;

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || user.username,
        name,
        role: primaryRole, // kept for backward compatibility
        roles: assignedRoles,
        permissions,
        enabledModules,
        isDeveloper: assignedRoles.includes('developer'),
        organization_id: user.organization_id,
      },
    };
  }

  async register(data: RegisterRequest) {
    const existing = await authRepository.findByUsername(data.username);
    if (existing) {
      throw new ConflictError('Username already exists');
    }

    const full_name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
    const password_hash = await bcrypt.hash(data.password, 10);

    let newUser;
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      newUser = await authRepository.createUser(client, {
        organization_id: data.organization_id,
        username: data.username,
        password_hash,
        full_name,
        email: data.email,
        phone: data.phone,
        is_superadmin: false,
      });

      // Assign roles if provided (e.g. a role created via the Role Management module)
      if (data.roleIds && data.roleIds.length > 0) {
        for (const roleId of data.roleIds) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
            [newUser.id, roleId]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const rolesResult = await authRepository.getUserRolesAndPermissions(newUser.id);
    const roles: string[] = rolesResult.roles;

    return {
      id: newUser.id,
      username: newUser.username,
      name: newUser.full_name,
      // Backward-compatible primary role field; resolves to the first assigned role
      // (or 'super_admin' for super-admin flagged accounts) instead of blindly returning 'admin'.
      role: newUser.is_superadmin ? 'super_admin' : (roles[0] || 'admin'),
      roles,
    };
  }
}

export const authService = new AuthService();
