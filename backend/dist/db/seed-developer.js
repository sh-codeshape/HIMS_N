"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function seedDeveloper() {
    const client = await database_1.db.getClient();
    try {
        await client.query('BEGIN');
        // Use existing DEFAULT org (non-zero UUID)
        const orgRes = await client.query(`SELECT id FROM organizations WHERE code = 'DEFAULT' AND id != '00000000-0000-0000-0000-000000000000' LIMIT 1`);
        if (orgRes.rows.length === 0) {
            throw new Error('No non-zero organization with code DEFAULT found. Run db:seed first.');
        }
        const orgId = orgRes.rows[0].id;
        // Use existing MAIN facility for this org
        const facRes = await client.query(`SELECT id FROM facilities WHERE organization_id = $1 AND code = 'MAIN' AND id != '00000000-0000-0000-0000-000000000000' LIMIT 1`, [orgId]);
        if (facRes.rows.length === 0) {
            throw new Error('No non-zero MAIN facility found.');
        }
        const facilityId = facRes.rows[0].id;
        // Developer user credentials
        const developerUsername = 'developer@codeshape.dev';
        const developerEmail = 'developer@codeshape.dev';
        const developerPassword = 'dev@hims2026';
        const passwordHash = await bcrypt_1.default.hash(developerPassword, 10);
        // Create developer user if not exists
        await client.query(`
      INSERT INTO users (
        organization_id, username, email, password_hash, full_name, is_active, is_superadmin, default_facility_id, phone
      ) VALUES ($1, $2, $3, $4, 'System Developer', true, false, $5, '+91-0000000002')
      ON CONFLICT (organization_id, username) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        is_active = EXCLUDED.is_active,
        default_facility_id = EXCLUDED.default_facility_id;
    `, [orgId, developerUsername, developerEmail, passwordHash, facilityId]);
        const devUserResult = await client.query(`SELECT id FROM users WHERE username = $1`, [developerUsername]);
        const devUserId = devUserResult.rows[0].id;
        // Create developer role (system role)
        await client.query(`
      INSERT INTO roles (organization_id, code, name, description, is_system)
      VALUES ($1, 'developer', 'Developer', 'System Developer - God Mode', true)
      ON CONFLICT (organization_id, code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description;
    `, [orgId]);
        const devRoleRes = await client.query(`SELECT id FROM roles WHERE code = 'developer' AND organization_id = $1`, [orgId]);
        const devRoleId = devRoleRes.rows[0].id;
        // Developer-specific permissions
        const developerPermissions = [
            { code: 'developer.modules', module: 'developer', description: 'Toggle module visibility on/off' },
            { code: 'developer.console', module: 'developer', description: 'Access Developer Console page' },
            { code: 'developer.audit', module: 'developer', description: 'View system-wide audit logs' },
            { code: 'developer.config', module: 'developer', description: 'System configuration' },
        ];
        for (const p of developerPermissions) {
            await client.query(`
        INSERT INTO permissions (code, module, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (code) DO NOTHING;
      `, [p.code, p.module, p.description]);
        }
        // Assign ALL permissions to developer role (existing 37 + new 4 developer perms)
        const allPerms = await client.query(`SELECT id, code FROM permissions`);
        const permByCode = new Map(allPerms.rows.map((r) => [r.code, r.id]));
        for (const [code, permId] of permByCode) {
            await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      `, [devRoleId, permId]);
        }
        // Assign developer role to developer user
        await client.query(`
      INSERT INTO user_roles (user_id, role_id, facility_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
    `, [devUserId, devRoleId, facilityId]);
        // Seed module_registry with all sidebar module keys (all enabled by default)
        const moduleKeys = [
            { module_key: 'dashboard', label: 'Dashboard' },
            { module_key: 'registration', label: 'Registration' },
            { module_key: 'opd', label: 'OPD' },
            { module_key: 'ipd', label: 'IPD / Ward' },
            { module_key: 'billing', label: 'Billing' },
            { module_key: 'patients', label: 'Patients' },
            { module_key: 'staff', label: 'Doctors & Staff' },
            { module_key: 'masterReports', label: 'Master Reports' },
            { module_key: 'pharmacy', label: 'Pharmacy / OOM' },
            { module_key: 'laboratory', label: 'Laboratory' },
            { module_key: 'radiology', label: 'Radiology & Imaging' },
            { module_key: 'ward', label: 'IPD / OPD Ward' },
            { module_key: 'billingInvoices', label: 'Billing & Invoices' },
            { module_key: 'inventory', label: 'Inventory Management' },
            { module_key: 'medicalReports', label: 'Medical Reports' },
            { module_key: 'emergency', label: 'Emergency Dispatch' },
            { module_key: 'followup', label: 'Follow-Up' },
            { module_key: 'bulkMessaging', label: 'Bulk Messaging' },
            { module_key: 'developerConsole', label: 'Developer Console' },
        ];
        for (const m of moduleKeys) {
            await client.query(`
        INSERT INTO module_registry (module_key, label, is_enabled, updated_at)
        VALUES ($1, $2, true, now())
        ON CONFLICT (module_key) DO UPDATE SET
          label = EXCLUDED.label;
      `, [m.module_key, m.label]);
        }
        await client.query('COMMIT');
        logger_1.logger.info('Developer role, user, permissions, and module registry seeded successfully.');
        logger_1.logger.info({ devUsername: developerUsername, devPassword: developerPassword }, 'Developer credentials');
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.logger.error({ err: error }, 'Failed to seed developer');
        process.exit(1);
    }
    finally {
        client.release();
        process.exit(0);
    }
}
seedDeveloper();
