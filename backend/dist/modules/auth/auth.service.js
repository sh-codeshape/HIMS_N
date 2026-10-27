"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_repository_1 = require("./auth.repository");
const AppError_1 = require("../../shared/errors/AppError");
const database_1 = require("../../config/database");
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const JWT_EXPIRES_IN = '24h';
class AuthService {
    async login(data) {
        const user = await auth_repository_1.authRepository.findByUsername(data.username);
        if (!user || !user.is_active) {
            throw new AppError_1.UnauthorizedError('Invalid credentials or inactive user');
        }
        const isValidPassword = await bcrypt_1.default.compare(data.password, user.password_hash);
        if (!isValidPassword) {
            throw new AppError_1.UnauthorizedError('Invalid credentials');
        }
        const { roles, permissions } = await auth_repository_1.authRepository.getUserEffectivePermissions(user.id);
        const enabledModules = await auth_repository_1.authRepository.getEnabledModules();
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
            const facRes = await database_1.db.query(`SELECT id FROM facilities 
         WHERE (organization_id = $1 OR id != '00000000-0000-0000-0000-000000000000'::uuid) 
           AND id != '00000000-0000-0000-0000-000000000000'::uuid 
           AND is_active = true 
         ORDER BY (CASE WHEN organization_id = $1 THEN 0 ELSE 1 END), created_at ASC 
         LIMIT 1`, [user.organization_id]);
            if (facRes.rows.length > 0) {
                facilityId = facRes.rows[0].id;
                await database_1.db.query(`UPDATE users SET default_facility_id = $1 WHERE id = $2`, [facilityId, user.id]);
            }
        }
        if (!facilityId) {
            throw new AppError_1.UnauthorizedError('This user is not assigned to a valid facility. Please seed or assign a facility first.');
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            organizationId: user.organization_id,
            organization_id: user.organization_id,
            facilityId,
            facility_id: facilityId,
            roles: assignedRoles,
            permissions,
            enabledModules,
            isDeveloper: assignedRoles.includes('developer'),
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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
    async register(data) {
        const existing = await auth_repository_1.authRepository.findByUsername(data.username);
        if (existing) {
            throw new AppError_1.ConflictError('Username already exists');
        }
        const full_name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
        const password_hash = await bcrypt_1.default.hash(data.password, 10);
        let newUser;
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            newUser = await auth_repository_1.authRepository.createUser(client, {
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
                    await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [newUser.id, roleId]);
                }
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
        const rolesResult = await auth_repository_1.authRepository.getUserRolesAndPermissions(newUser.id);
        const roles = rolesResult.roles;
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
exports.AuthService = AuthService;
exports.authService = new AuthService();
